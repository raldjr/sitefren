<?php
/** No live network calls. Run:
 * php -d disable_functions=curl_init,curl_setopt_array,curl_exec,curl_getinfo,curl_close tests/updates.php
 */
declare(strict_types=1);
define('POCKET_TESTING', true);
define('POCKET_ROOT', sys_get_temp_dir() . '/sitefren-updates-' . bin2hex(random_bytes(8)));
mkdir(POCKET_ROOT, 0700);
require dirname(__DIR__) . '/sitefren.php';
$passed = 0;
$calls = 0;
$http = 200;
$reply = '[{"tag_name":"v0.2.5","draft":false,"prerelease":true}]';
function check(bool $ok, string $label): void {
    global $passed;
    if (!$ok) throw new RuntimeException('FAIL: ' . $label);
    $passed++; echo 'PASS: ' . $label . "\n";
}
function curl_init($url) { return (object) ['url' => $url, 'options' => []]; }
function curl_setopt_array($handle, $options) { $handle->options = $options; return true; }
function curl_getinfo($handle, $option) { return $GLOBALS['http']; }
function curl_close($handle) {}
function curl_exec($handle) {
    global $calls, $reply;
    $calls++;
    check($handle->url === 'https://api.github.com/repos/raldjr/sitefren/releases?per_page=10', 'Only the official release feed is fetched');
    check(empty($GLOBALS['ps_lock_active']), 'Release requests do not hold the project lock');
    check(!isset($handle->options[CURLOPT_POSTFIELDS]) &&
        $handle->options[CURLOPT_HTTPHEADER] === ['Accept: application/vnd.github+json'], 'No credentials or project identifiers are forwarded');
    check($handle->options[CURLOPT_TIMEOUT_MS] === 3000 &&
        $handle->options[CURLOPT_SSL_VERIFYPEER] &&
        $handle->options[CURLOPT_SSL_VERIFYHOST] === 2 &&
        !$handle->options[CURLOPT_FOLLOWLOCATION], 'Release fetching is bounded and verifies TLS without redirects');
    if ($reply === false) return false;
    return $handle->options[CURLOPT_WRITEFUNCTION]($handle, $reply) === strlen($reply);
}
function expire_check(): void {
    ps_locked(static function (array $state): void {
        $state['update_check']['attempted_at'] = time() - 120;
        $state['update_check']['next_attempt'] = 0;
        ps_save($state);
    });
}
try {
    putenv('POCKET_UPDATE_CHECKS');
    $state = ps_locked(static fn($state) => $state);
    $_SESSION = ['csrf' => 'fixture'];
    try { ps_check_updates(false); throw new LogicException('Unauthenticated check succeeded'); }
    catch (RuntimeException $error) { check($error->getCode() === 401 && $calls === 0, 'Authentication is checked before release traffic'); }
    $_SESSION['auth'] = $state['auth_version']; $_SESSION['seen'] = time();
    check(ps_release_version([
        ['tag_name'=>'v0.1.9'], ['tag_name'=>'v0.2.0'], ['tag_name'=>'v99.0.0','draft'=>true],
        ['tag_name'=>'<script>'], ['tag_name'=>'v0.2.5-rc.1','prerelease'=>true],
    ]) === '0.2.5-rc.1', 'Version ordering includes alpha releases and excludes drafts and malformed tags');
    check(ps_release_version([]) === null, 'An empty feed has no advertised version');
    $result = ps_check_updates(false);
    check($result['available'] && $result['version'] === '0.2.5' &&
        $result['url'] === 'https://github.com/raldjr/sitefren/releases', 'A newer release produces an official update link');
    check(!isset($result['next_attempt']) && !isset($result['fetch']), 'Internal cache metadata stays private');
    ps_check_updates(false); ps_check_updates(true);
    check($calls === 1, 'Reloads and immediate forced checks reuse the cache');
    check(ps_load()['revision'] === $state['revision'] && ps_load()['files'] === $state['files'], 'Update metadata does not alter draft content or revision');
    foreach ([false, '{"error":"private upstream error"}', 'invalid JSON', str_repeat('x', 262145)] as $failure) {
        expire_check(); $reply = $failure;
        $result = ps_check_updates(false);
        check($result['status'] === 'unavailable' && !$result['available'], 'Invalid or failed responses never advertise an update');
    }
    expire_check(); $http = 429; $reply = '[{"tag_name":"v99.0.0"}]';
    check(ps_check_updates(false)['status'] === 'unavailable', 'Rate-limited responses are treated as unavailable');
    expire_check(); $http = 200; $reply = '[]';
    check(ps_check_updates(false)['status'] === 'no_release', 'Missing releases are distinguished from an up-to-date installation');
    expire_check(); $reply = '[{"tag_name":"v0.1.7"}]';
    check(!ps_check_updates(false)['available'], 'Older versions never advertise a downgrade');
    putenv('POCKET_UPDATE_CHECKS=0'); $before = $calls;
    check(ps_check_updates(true)['status'] === 'disabled' && $calls === $before, 'Host opt-out prevents forced network requests');
    echo "$passed update checks passed. No network requests were made.\n";
} finally {
    putenv('POCKET_UPDATE_CHECKS');
    foreach (scandir(POCKET_ROOT) as $name) if ($name !== '.' && $name !== '..') unlink(POCKET_ROOT . '/' . $name);
    rmdir(POCKET_ROOT);
}
