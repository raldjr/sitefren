<?php
/** Read-only check of the public release through the editor's updater transport. */
declare(strict_types=1);
define('POCKET_TESTING', true);
require dirname(__DIR__) . '/sitefren.php';

if (ps_fetch_release_version() !== PS_VERSION) {
    throw new RuntimeException('The release feed does not advertise this version as newest.');
}
$manifest = ps_update_manifest(PS_VERSION);
$code = ps_update_download(
    'https://github.com/raldjr/sitefren/releases/download/v' . PS_VERSION . '/sitefren.php',
    2097152,
);
if (hash('sha256', $code) !== $manifest['sha256'] || strlen($code) !== $manifest['size'] ||
    hash('sha256', $code) !== hash_file('sha256', dirname(__DIR__) . '/sitefren.php')) {
    throw new RuntimeException('Published download does not match the signed local release.');
}
token_get_all($code, TOKEN_PARSE);
echo 'Verified public update discovery, signature and download for ' . PS_VERSION . "\n";
