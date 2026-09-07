<?php
/** Isolated installation tracking checks; no real network calls.
 * Run with the cURL functions replaced:
 * php -d disable_functions=curl_init,curl_setopt_array,curl_exec,curl_getinfo,curl_close tests/installations.php
 */
declare(strict_types=1);
define('POCKET_TESTING', true);
define('POCKET_ROOT', sys_get_temp_dir() . '/sitefren-installs-' . bin2hex(random_bytes(8)));
mkdir(POCKET_ROOT, 0700);
require dirname(__DIR__) . '/sitefren.php';
$calls = 0;
$reply = '{"success":true}';
$http = 200;
$passed = 0;
function check(bool $ok, string $label): void {
    global $passed;
    if (!$ok) throw new RuntimeException('FAIL: ' . $label);
    $passed++;
    echo 'PASS: ' . $label . "\n";
}
function curl_init($url) { return (object) ['url' => $url, 'options' => []]; }
function curl_setopt_array($handle, $options) { $handle->options = $options; return true; }
function curl_getinfo($handle, $option) { return $GLOBALS['http']; }
function curl_close($handle) {}
function curl_exec($handle) {
    global $calls, $reply;
    $calls++;
    $GLOBALS['last_payload'] = json_decode($handle->options[CURLOPT_POSTFIELDS], true);
    check($handle->url === 'https://analytics.molondigital.com/api/track', 'Use only the installs analytics endpoint');
    check(empty($GLOBALS['ps_lock_active']), 'Network delivery happens outside the state lock');
    $lock = fopen(ps_state_path() . '.lock.php', 'r+');
    check(flock($lock, LOCK_EX | LOCK_NB), 'Another request can acquire the project lock during delivery');
    flock($lock, LOCK_UN); fclose($lock);
    $before = $calls;
    ps_report_installation();
    check($calls === $before, 'A competing attempt respects the saved retry reservation');
    check($handle->options[CURLOPT_TIMEOUT_MS] <= 1500 &&
        $handle->options[CURLOPT_SSL_VERIFYPEER] &&
        $handle->options[CURLOPT_SSL_VERIFYHOST] === 2 &&
        !$handle->options[CURLOPT_FOLLOWLOCATION], 'Bound delivery time and retain TLS verification without redirects');
    if ($reply === false) return false;
    if ($reply === 'throw') throw new RuntimeException('Synthetic transport failure');
    return $handle->options[CURLOPT_WRITEFUNCTION]($handle, $reply) === strlen($reply);
}
function retry_now(): void {
    ps_locked(static function (array $state): void {
        $state['installation']['sent'] = false;
        $state['installation']['next_attempt'] = 0;
        ps_save($state);
    });
}
try {
    putenv('POCKET_INSTALL_TRACKING');
    $state = ps_locked(static fn($state) => $state);
    $id = $state['installation']['id'];
    check((bool) preg_match('/^[a-f0-9]{32}$/', $id), 'Fresh state has a random installation ID');
    check(ps_load()['installation']['id'] === $id && ps_new_state()['installation']['id'] !== $id,
        'Reloads retain identity and independent states get different IDs');
    check(empty($GLOBALS['ps_installation_scheduled']), 'CLI tests never schedule live telemetry');
    $_SERVER['HTTP_HOST'] = 'private-customer.example';
    $_SERVER['REQUEST_URI'] = '/private/editor.php?secret=private';
    $_SESSION = ['csrf' => 'fixture'];
    ps_report_installation();
    check(ps_load()['installation']['sent'] && $calls === 1, 'Successful delivery is persisted');
    $payload = $GLOBALS['last_payload'];
    check($payload === [
        'site_id' => 'da0e8d634b5b', 'type' => 'custom_event',
        'hostname' => 'installs.sitefren.com', 'pathname' => '/install',
        'user_id' => $id, 'event_name' => 'installation_created',
        'properties' => ps_json(['installation_id' => $id, 'version' => PS_VERSION]),
    ], 'Payload contains only fixed routing metadata, random identity and version');
    check(!isset(ps_public(ps_load())['installation']), 'Public state does not expose installation metadata');
    ps_report_installation();
    check($calls === 1, 'Reloading after delivery does not resend');
    foreach ([false, '{"success":true,"message":"Event not tracked - bot detected"}',
        '{"success":false}', 'invalid JSON', str_repeat('x', 4097), 'throw'] as $failure) {
        retry_now(); $reply = $failure; $before = $calls;
        ps_report_installation();
        check(!ps_load()['installation']['sent'], 'Failed, filtered or unreadable delivery stays pending');
        check(ps_load()['installation']['next_attempt'] > time() + 86000, 'Failure schedules a later daily retry');
        ps_report_installation();
        check($calls === $before + 1, 'Subsequent visits do not immediately retry failure');
    }
    retry_now(); $reply = '{"success":true}'; $http = 500;
    ps_report_installation();
    check(!ps_load()['installation']['sent'], 'HTTP failure cannot mark delivery successful');
    retry_now(); $http = 200;
    putenv('POCKET_INSTALL_TRACKING=0'); $before = $calls;
    ps_report_installation();
    check($calls === $before, 'Host opt-out prevents delivery');
    putenv('POCKET_INSTALL_TRACKING');
    ps_report_installation();
    check(ps_load()['installation']['sent'] && ps_load()['installation']['id'] === $id,
        'Retry succeeds with the same installation identity');
    ps_locked(static function (array $state): void {
        unset($state['installation']);
        $state['revision'] = 42;
        ps_save($state);
    });
    ps_report_installation();
    $migrated = ps_load();
    check($migrated['installation']['sent'] && $migrated['revision'] === 42 &&
        $migrated['setup_code'] === $state['setup_code'], 'Older states register without altering setup or draft revision');
    echo "$passed installation checks passed. No network requests were made.\n";
} finally {
    putenv('POCKET_INSTALL_TRACKING');
    foreach (scandir(POCKET_ROOT) as $name) {
        if ($name !== '.' && $name !== '..') unlink(POCKET_ROOT . '/' . $name);
    }
    rmdir(POCKET_ROOT);
}
