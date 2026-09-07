<?php
/** Isolated replacement tests; never touches the working editor or network.
 * php -d disable_functions=curl_init,curl_setopt_array,curl_exec,curl_getinfo,curl_close tests/update-install.php
 */
declare(strict_types=1);
define('POCKET_TESTING', true);
define('POCKET_ROOT', sys_get_temp_dir() . '/sitefren-installer-' . bin2hex(random_bytes(8)));
mkdir(POCKET_ROOT, 0700);
$pair = sodium_crypto_sign_keypair();
$secret = sodium_crypto_sign_secretkey($pair);
$source = preg_replace("/const PS_UPDATE_PUBLIC_KEY = '[^']+';/", "const PS_UPDATE_PUBLIC_KEY = '" . base64_encode(sodium_crypto_sign_publickey($pair)) . "';", file_get_contents(dirname(__DIR__) . '/sitefren.php'));
$editor = POCKET_ROOT . '/sitefren.php';
file_put_contents($editor, $source);
require $editor;
$passed = 0;
$assets = [];
$calls = 0;
$hook = null;
function check(bool $ok, string $message): void {
    if (!$ok) throw new RuntimeException('FAIL: ' . $message);
    $GLOBALS['passed']++;
    echo 'PASS: ' . $message . "\n";
}
function curl_init($url) { return (object) ['url' => $url, 'options' => [], 'status' => 200, 'redirect' => '']; }
function curl_setopt_array($ch, $options) { $ch->options = $options; return true; }
function curl_getinfo($ch, $option) { return $option === CURLINFO_REDIRECT_URL ? $ch->redirect : $ch->status; }
function curl_close($ch) {}
function curl_exec($ch) {
    $GLOBALS['calls']++;
    if (!empty($GLOBALS['ps_lock_active'])) throw new LogicException('Network under state lock');
    if ($ch->options[CURLOPT_FOLLOWLOCATION] || !$ch->options[CURLOPT_SSL_VERIFYPEER] ||
        $ch->options[CURLOPT_SSL_VERIFYHOST] !== 2 || isset($ch->options[CURLOPT_POSTFIELDS])) throw new LogicException('Unsafe request');
    if ($GLOBALS['hook']) { $hook = $GLOBALS['hook']; $GLOBALS['hook'] = null; $hook(); }
    $asset = $GLOBALS['assets'][$ch->url] ?? false;
    if ($asset === false) return false;
    if (is_array($asset)) { $ch->status = 302; $ch->redirect = $asset[0]; return true; }
    return ($ch->options[CURLOPT_WRITEFUNCTION])($ch, $asset) === strlen($asset);
}
function asset_url(string $version, string $name): string {
    return 'https://github.com/raldjr/sitefren/releases/download/v' . $version . '/' . $name;
}
function signed_assets(string $version, string $code, array $override = []): void {
    $manifest = json_encode(array_replace(['version' => $version, 'sha256' => hash('sha256', $code), 'size' => strlen($code),
        'php_min' => '8.2.0', 'php_max' => '9.0.0', 'schema' => 1], $override));
    $GLOBALS['assets'][asset_url($version, 'update.json')] = $manifest;
    $GLOBALS['assets'][asset_url($version, 'update.sig')] = base64_encode(sodium_crypto_sign_detached($manifest, $GLOBALS['secret']));
    $GLOBALS['assets'][asset_url($version, 'sitefren.php')] = $code;
}
function reset_install(): array {
    global $source, $editor, $assets, $calls, $hook;
    file_put_contents($editor, $source);
    $assets = []; $calls = 0; $hook = null;
    $state = ps_new_state(); $state['password_hash'] = 'synthetic'; $state['setup_code'] = '';
    $state['config']['api_key'] = 'synthetic-private-key';
    $state['files']['index.html'] = '<h1>Keep my draft</h1>';
    $state['installation']['sent'] = true;
    ps_save($state);
    $_SESSION = ['auth' => $state['auth_version'], 'seen' => time(), 'csrf' => 'synthetic'];
    file_put_contents(POCKET_ROOT . '/index.html', '<h1>Keep my published site</h1>');
    signed_assets(PS_VERSION, $source);
    signed_assets('0.2.2', str_replace("const PS_VERSION = '" . PS_VERSION . "';", "const PS_VERSION = '0.2.2';", $source));
    return ['version' => '0.2.2', 'revision' => $state['revision']];
}
function rejected(array $input, string $message): void {
    $before = file_get_contents($GLOBALS['editor']);
    $draft = ps_load()['files'];
    try { ps_install_update($input); throw new LogicException('Unexpected installation: ' . $message); }
    catch (RuntimeException | ParseError $error) {
        check(file_get_contents($GLOBALS['editor']) === $before && ps_load()['files'] === $draft, $message . ' preserves editor and draft');
    }
}
try {
    $input = reset_install(); unset($_SESSION['auth']); rejected($input, 'Unauthenticated owner');
    check($calls === 0, 'Authentication precedes downloads');
    $input = reset_install(); $input['revision']++; rejected($input, 'Stale revision');
    $input = reset_install(); $input['version'] = PS_VERSION; rejected($input, 'Downgrade or reinstall');
    $input = reset_install(); $input['version'] = '../bad'; rejected($input, 'Untrusted version path');
    $input = reset_install(); putenv('POCKET_UPDATE_CHECKS=0'); rejected($input, 'Hosting opt-out'); putenv('POCKET_UPDATE_CHECKS');
    $input = reset_install(); $state = ps_load(); $state['pending'] = ['expires' => time() + 60]; ps_save($state); rejected($input, 'Active generation');
    $input = reset_install(); $state = ps_load(); $state['update_pending'] = ['id' => 'other', 'expires' => time() + 60]; ps_save($state); rejected($input, 'Concurrent updater');
    $input = reset_install(); $assets[asset_url('0.2.2', 'update.sig')] = base64_encode(str_repeat('x', 64)); rejected($input, 'Forged signature');
    check(!isset(ps_load()['update_pending']), 'A failed download clears its reservation');
    $input = reset_install(); $assets[asset_url('0.2.2', 'update.json')] .= ' '; rejected($input, 'Tampered manifest');
    $input = reset_install(); $assets[asset_url('0.2.2', 'sitefren.php')] .= 'tampered'; rejected($input, 'Tampered release bytes');
    $input = reset_install(); signed_assets('0.2.2', $assets[asset_url('0.2.2', 'sitefren.php')], ['schema' => 2]); rejected($input, 'Unsupported storage schema');
    $input = reset_install(); signed_assets('0.2.2', $assets[asset_url('0.2.2', 'sitefren.php')], ['php_min' => '99.0.0']); rejected($input, 'Unsupported PHP version');
    $input = reset_install(); signed_assets('0.2.2', "<?php const PS_VERSION = '0.2.2'; broken syntax !"); rejected($input, 'Signed but invalid PHP');
    $input = reset_install(); file_put_contents($editor, $source . "\n<!-- Custom ad -->"); rejected($input, 'Customized editor');
    $input = reset_install(); unset($assets[asset_url(PS_VERSION, 'update.json')]); rejected($input, 'Missing current release');
    $input = reset_install(); $assets[asset_url(PS_VERSION, 'update.json')] = str_repeat('x', 4097); rejected($input, 'Oversized response');
    foreach (['http://github.com/a', 'https://evil.example/a', 'https://user@github.com/a', 'https://github.com:444/a'] as $redirect) {
        $input = reset_install(); $assets[asset_url(PS_VERSION, 'update.json')] = [$redirect]; rejected($input, 'Unsafe redirect');
        check($calls === 1, 'Unsafe redirect never fetched');
    }
    $input = reset_install(); $url = asset_url(PS_VERSION, 'update.json'); $assets[$url] = [$url]; rejected($input, 'Redirect loop');
    $input = reset_install(); $hook = static function (): void {
        $state = ps_load();
        try { ps_check_revision($state, ['revision' => $state['revision']]); throw new LogicException('Concurrent edit accepted'); }
        catch (RuntimeException $error) { check($error->getCode() === 409, 'Edits are blocked during download'); }
        $state['update_pending']['expires'] = time() - 1; ps_save($state);
    }; rejected($input, 'Expired reservation');
    $input = reset_install(); $hook = static function (): void { $state = ps_load(); $state['revision']++; ps_save($state); }; rejected($input, 'Project changed during download');
    $input = reset_install(); $before = ps_load();
    $url = asset_url('0.2.2', 'sitefren.php'); $assets['https://release-assets.githubusercontent.com/fixture'] = $assets[$url];
    $assets[$url] = ['https://release-assets.githubusercontent.com/fixture'];
    $result = ps_install_update($input);
    check($result['updated'] && $result['version'] === '0.2.2', 'Signed official redirect installs successfully');
    $after = ps_load();
    foreach (['files', 'config', 'password_hash', 'installation', 'revision'] as $field) check($after[$field] === $before[$field], 'Update preserves ' . $field);
    check(file_get_contents(POCKET_ROOT . '/index.html') === '<h1>Keep my published site</h1>', 'Published website is untouched');
    $backup = POCKET_ROOT . '/' . $after['update_backup'];
    $protected = file_get_contents($backup . '.editor.php');
    check(str_starts_with($protected, '<?php http_response_code(404); exit; ?>') &&
        base64_decode(explode("\n", $protected, 2)[1], true) === $source, 'Protected backup recovers the exact previous editor');
    $saved = json_decode(explode("\n", file_get_contents($backup . '.state.php'), 2)[1], true);
    check($saved === $before && (fileperms($backup . '.state.php') & 0777) === 0600, 'Owner-only state backup restores credentials and draft');
    try { ps_locked(static fn($state) => $state); throw new LogicException('Old worker accepted'); }
    catch (RuntimeException $error) { check($error->getCode() === 409, 'An old PHP worker cannot mutate upgraded state'); }
    $probe = POCKET_ROOT . '/boot.php';
    file_put_contents($probe, '<?php define("POCKET_TESTING",true); define("POCKET_ROOT",__DIR__); require __DIR__."/sitefren.php"; echo ps_locked(static fn($s)=>PS_VERSION);');
    exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($probe), $output, $status);
    check($status === 0 && implode('', $output) === '0.2.2', 'A fresh PHP process boots the replacement with the preserved state');
    echo "$passed installer checks passed.\n";
} finally {
    foreach (glob(POCKET_ROOT . '/*') as $path) if (is_file($path)) unlink($path);
    rmdir(POCKET_ROOT);
}
