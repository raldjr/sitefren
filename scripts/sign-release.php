<?php
/** Publisher-only Ed25519 signing. Never upload the key or this tool to a customer site. */
declare(strict_types=1);
$root = dirname(__DIR__);
$command = $argv[1] ?? '';
if ($command === 'create-key') {
    $path = $argv[2] ?? '';
    if (!$path || file_exists($path)) throw new RuntimeException('Supply a new private key path.');
    umask(0077);
    if (!is_dir(dirname($path))) mkdir(dirname($path), 0700, true);
    $pair = sodium_crypto_sign_keypair();
    $file = fopen($path, 'xb');
    fwrite($file, base64_encode(sodium_crypto_sign_secretkey($pair)) . "\n");
    fclose($file);
    echo 'Public key: ' . base64_encode(sodium_crypto_sign_publickey($pair)) . "\n";
    exit;
}
$source = file_get_contents($root . '/sitefren.php');
preg_match("/const PS_VERSION = '([^']+)';/", $source, $version);
preg_match("/const PS_UPDATE_PUBLIC_KEY = '([^']+)';/", $source, $public);
if ($command === 'sign') {
    $path = $argv[2] ?? '';
    if (!is_file($path) || (fileperms($path) & 0077)) throw new RuntimeException('Private key must be owner-only.');
    $secret = base64_decode(trim(file_get_contents($path)), true);
    if (!$secret || strlen($secret) !== SODIUM_CRYPTO_SIGN_SECRETKEYBYTES ||
        !hash_equals(base64_decode($public[1], true), sodium_crypto_sign_publickey_from_secretkey($secret))) {
        throw new RuntimeException('Signing key does not match the editor public key.');
    }
    $manifest = json_encode(['version' => $version[1], 'sha256' => hash('sha256', $source),
        'size' => strlen($source), 'php_min' => '8.2.0', 'php_max' => '9.0.0', 'schema' => 1], JSON_PRETTY_PRINT) . "\n";
    if (!is_dir($root . '/release')) mkdir($root . '/release');
    file_put_contents($root . '/release/update.json', $manifest);
    file_put_contents($root . '/release/update.sig', base64_encode(sodium_crypto_sign_detached($manifest, $secret)) . "\n");
    sodium_memzero($secret);
} elseif ($command !== 'verify') {
    throw new RuntimeException('Usage: php scripts/sign-release.php create-key PATH | sign KEY_PATH | verify');
}
$manifest = file_get_contents($root . '/release/update.json');
$signature = base64_decode(trim(file_get_contents($root . '/release/update.sig')), true);
if (!$signature || !sodium_crypto_sign_verify_detached($signature, $manifest, base64_decode($public[1], true))) {
    throw new RuntimeException('Invalid release signature.');
}
$data = json_decode($manifest, true, 16, JSON_THROW_ON_ERROR);
if ($data['version'] !== $version[1] || $data['sha256'] !== hash('sha256', $source) || $data['size'] !== strlen($source)) {
    throw new RuntimeException('Signed manifest does not match the editor. Sign again after editing.');
}
echo 'Verified signed release ' . $version[1] . "\n";
