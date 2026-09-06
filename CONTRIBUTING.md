# Contributing

Sitefren is built by Raul Aldrete Jr. for Sheepdog Host to bring power back
to shared hosting. Keep the core useful on ordinary hosting accounts.

## Design principles

- Ship one uploadable `sitefren.php`. One clean file upload is a requirement,
  not a temporary convenience. No extra customer-managed scripts, packages,
  workers, cron entries, or build tools may be required by a new feature.
- Let customers own their site files and choose an AI provider.
- Keep the published site independent of the editor and hosting brand.
- Make failures understandable and preserve recoverable work.
- Keep host provisioning optional. Never distribute a master billing key.
- Prefer small, readable changes and no new runtime dependencies.
- Use descriptive names and ordinary control flow a first-year engineer can
  follow. Keep code unminified and comments limited to non-obvious intent.
- Keep generated-code instructions aligned with this readability standard.

## Development

Edit `sitefren.php`. The first version deliberately keeps server functions,
request routing, styles, and browser code in one readable source file. Any future
development-only organization or formatting must still deliver that one clean
file. No formatter, JavaScript package, or PHP dependency is needed on the user's
host. PHP uses four-space indentation; embedded HTML/CSS/JS uses two spaces.

Run `php -l sitefren.php`, `php tests/core.php`, and `python3 tests/integration.py`.
Run `node tests/image-drop.cjs` for embedded JavaScript syntax and image upload
handler checks. This check requires only Node.js; it does not replace browser tests.
Add focused regression checks for file safety, data loss, and credential handling.
With cURL enabled, run `POCKET_TEST_TRANSPORT=1 python3 tests/integration.py`
and `POCKET_TEST_TRANSPORT=1 node tests/browser.cjs` to exercise generation,
progress streaming, catalog selection, and errors without live provider traffic.
These runners replace cURL functions in their isolated PHP server using
`tests/curl-fixture.php`; never upload that development fixture to a website.
Browser tests require Playwright and Chromium. See the runner header for runtime
path overrides.
For UI changes, exercise setup, sign-in, the sample site, mobile preview, Files,
History, image upload, and publishing in a browser. For provider changes, test a
real low-cost request with your own development key and report the provider,
model, and outcome without disclosing the key.

Never commit `builder-state.php`, its lock, customer sites, credentials, uploaded
images, or private runtime files. Reproduction cases must use synthetic data.

## Release workflow

1. Confirm the version, AGPL notices and attribution.
2. Complete a hosting compatibility and security review.
3. Test both provider integrations with real credentials and a small prompt.
4. Inspect the release archive for secrets and customer data.
5. Update `PS_VERSION`, the source header, README, installation guide, changelog,
   and validation record. The frontend badge reads `PS_VERSION` automatically.
6. Regenerate `SHA256SUMS` for all tracked release files except the manifest itself.
7. Publish source, the standalone file, release notes, and checksums together.

The release must clearly distinguish supported behavior, known limits, and
features that remain planned. Submit changes through a pull request to this repository.

Contributions are provided under AGPL-3.0-only. Do not include code or assets
whose terms conflict with that license.
