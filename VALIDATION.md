# Alpha 0.2.5 release validation

Checked on September 8, 2026, with PHP and Chromium via Playwright.

- PHP syntax, 125 core, 79 installation, 47 update-notice, 41 installer,
  91 HTTP, 74 browser, 37 direct-editing and 28 mobile/PWA checks passed,
  together with embedded JavaScript/image-drop checks.
- Desktop screenshots were inspected. Split layouts at 721, 900 and 1440px
  keep both panes visible without overlap or horizontal page overflow.
  Resizing between phone and desktop preserves unsent prompts and code edits.
- Existing phone navigation, floating text/image editing, publishing, signed
  upgrades and PWA coverage remain intact. No provider integration changed;
  requests use synthetic fixtures. Physical devices and shared hosts were not
  newly tested for this CSS layout correction.

# Alpha 0.2.4 release validation

Checked on September 7, 2026, with PHP and Chromium via Playwright.

- PHP syntax, 125 core, 79 installation, 47 update-notice, 41 installer,
  91 HTTP, 71 browser, 37 direct-editing and 28 mobile/PWA checks passed,
  together with embedded JavaScript/image-drop checks.
- Desktop and phone layouts were inspected. Workspace regressions cover new
  projects starting in Chat, the sample shortcut, unsent prompts and unsaved code
  surviving workspace switches, selected-element context reaching AI, and
  completed generations returning to Editor. More-menu diagnostics and sign-out,
  Files, History, publishing and signed browser upgrades remain covered.
- Floating text/image controls, mobile focus behavior, installability, offline
  privacy and immediate PWA refresh retain their regression coverage.
- Provider calls use synthetic fixtures; no new live provider or physical-device
  testing was performed for this interface change. Shared-host/browser limits
  documented in earlier validation records still apply.

# Alpha 0.2.3 release validation

Checked on September 7, 2026, with PHP and Chromium via Playwright.

- PHP syntax, 125 core, 79 installation, 47 update-notice, 41 installer,
  91 HTTP, 68 browser, 37 direct-editing and 28 mobile/PWA checks passed,
  together with embedded JavaScript/image-drop checks. Provider and installer
  regressions use synthetic fixtures, without live AI billing.
- Mobile checks cover Website/Chat switching, preservation of an unsent prompt,
  focused editing, larger touch targets and no horizontal overflow. Phone
  screenshots were inspected; direct-editing tests also cover short landscape.
- Chromium parses the app manifest and reports no installability errors. PNG
  icon dimensions, renamed editors in subfolders, app identity and the exact
  editor service-worker scope are checked. Public PWA requests create no
  private state or session, reject POST, and reject unknown resource names.
- Offline tests verify that open pages show a notice, API requests fail rather
  than using cached state, offline navigation shows only a reconnect screen,
  and reconnection restores authenticated access to the server draft. Cache
  Storage remains empty and published pages have no editor worker controller.
- A replaced PHP file loads on the next online navigation without a stale app
  shell. That test disables PHP opcode caching to isolate worker behavior;
  signed-installer tests separately cover replacement and OPcache invalidation.
- The manifest, icons and worker are embedded in one uploadable PHP file.
  Editing/publishing require internet. There is no offline editing or queued
  save support. Physical iOS/Android home-screen installation, real mobile
  keyboards and production shared-host upgrades were not exercised here.

# Alpha 0.2.2 release validation

Checked on September 7, 2026, with PHP and Chromium via Playwright.

- PHP syntax, 125 core, 79 installation, 47 update-notice, 41 installer,
  91 HTTP, 68 browser and 37 direct-editing checks passed, together with embedded
  JavaScript/image-drop checks. Provider and installer tests use synthetic fixtures.
- Direct editing covers floating text controls, links, emphasis and headings;
  image upload/replacement, alt text, width/height/fit, cancellation, removal,
  image-only nested pages, relative asset paths, combined text/image saves,
  preserved inline styles, and publication of the edited page and SVG asset.
- Desktop, mobile and short landscape layouts were checked. Floating controls
  stay within the preview, scroll on short screens, and can be dismissed with
  Escape or Close. Save/Cancel remain reachable above the preview.
- Fixed inert-document style parsing when reading and updating image settings.
  Source reconstruction retains unrelated inline styles and original scripts;
  replacement removes stale picture sources and excludes preview-only helpers.
- Direct image editing supports HTML image elements. CSS background images and
  inline SVG artwork still use Files or AI. Uploads remain in the asset library
  when page edits are canceled. Live AI calls and production shared-host updates
  were not run; the existing updater compatibility/recovery limits still apply.
- Public verification allows time for the tag's test/publish job to finish when
  main and the version tag are pushed together, while retaining a bounded wait.

# Alpha 0.2.1 release validation

Checked on September 7, 2026, with PHP and Chromium via Playwright.

- Public 0.2.1 discovery, signature and download passed the updater transport.
  An isolated copy of the actual public 0.2.0 editor discovered and installed
  0.2.1 from GitHub while preserving synthetic draft, credentials and website.
  The initial CI check raced GitHub feed propagation after publication; verification
  now runs as a separate retryable job with bounded propagation retries.

- PHP syntax, 125 core, 79 installation, 47 update-notice, 41 installer,
  91 HTTP, 68 browser and 20 rich-text checks passed, plus embedded JavaScript checks.
- Rich-text checks cover selected emphasis, headings, links, unsafe URLs,
  styled spans, navigation/button replacement, saved source, cancellation,
  paused website scripts, plain-text paste and mobile overflow. Desktop and
  mobile screenshots were inspected. Fixed stripped button elements and
  replacement text being saved outside its block during this validation.
- Browser installer tests use signed synthetic releases and verify preserved
  drafts and credentials after replacement and reload. Provider tests use
  fixtures; live AI requests and production shared-host upgrades were not run.
- Release CI now runs browser and rich-text tests before publishing, then checks
  the public release feed, signature and downloaded bytes using the updater's
  own transport. The publisher must verify these before reporting completion.
- Squire 2.4.8 is embedded with its MIT license; customers still upload one PHP
  file. Existing update compatibility and manual recovery limits still apply.

# Alpha 0.2.0 release validation

Checked on September 7, 2026, with PHP 8.5.4 and Chromium via Playwright.

- PHP syntax, 125 core, 79 installation, 47 update-notice, 41 installer,
  91 HTTP and 68 browser checks passed, plus embedded JavaScript/image-drop
  checks. All provider and installer traffic used isolated synthetic fixtures.
- Installer tests cover signed manifests and bytes, compatibility, local edits,
  authentication, CSRF, HTTP methods, concurrent work, expired reservations,
  bounded downloads and redirect destinations. A fresh PHP process boots the
  replacement using preserved state. Private backups reproduce the previous
  editor/state and return an empty 404 over HTTP.
- The browser exercises cancel and confirm, actual PHP replacement and reload,
  continued sign-in, and unchanged draft/provider credentials. No customer
  installation was modified by these tests.
- Desktop, laptop, text/image advertisement and mobile layouts were checked.
  The editor now uses sitefren.com's supplied logo, orange and neutral colors;
  generated websites keep their own styles. No horizontal mobile overflow.
- Release signing uses an owner-only private key outside the repository. Only
  the public key, manifest and detached signature ship. Release preparation
  verifies the signature, source hash, versioned links and all tracked checksums.
- PHP cURL, Sodium, Tokenizer and writable editor/folder permissions are needed
  for in-place updates. Customized editors use manual uploads. PHP process limits,
  unusual OPcache settings and interrupted replacement may need manual recovery;
  no automatic post-install health rollback is claimed. Schema 1 only.
- AI adapters were unchanged. Live provider calls and representative production
  shared-host installs were not repeated; fixture tests are not certification
  of every hosting configuration.

# Alpha 0.1.10 release validation

Checked on September 7, 2026, with PHP 8.5.4 and Chromium via Playwright.

- PHP syntax, 125 core, 79 installation, 47 update, 88 HTTP and 64 browser checks
  passed, together with embedded JavaScript/image-drop checks. Provider and
  release responses were fixtures; no live inference was billed.
- The toolbar ad was checked with and without embedded artwork, on desktop and
  mobile. Published websites do not receive the editor promotion. Independent
  help and visible version labels remain available.
- Release preparation verifies matching PHP/docs/tag versions, a versioned README
  download URL, changelog notes, and SHA-256 coverage of every tracked source file.
  Published assets are limited to the editor and checksum files; source archives
  come from the tagged repository. No private runtime state or credentials are
  included in those assets.
- Tagged-release automation runs PHP/core/installation/update/HTTP/JavaScript
  checks before publishing. Local browser validation is a separate release gate.
- No changes were made to AI provider adapters. Live provider requests and
  representative production-host testing were not repeated for this UI/release
  update. In-place self-updating is not implemented.

# Toolbar advertisement layout review before 0.1.10

Checked on September 7, 2026.

- PHP syntax, embedded JavaScript/image-drop checks, `git diff --check`, and all
  64 browser checks passed with fixture provider/release responses.
- Browser checks cover placement between tabs and preview controls, a 440-pixel
  width cap, a bounded embedded image, mobile wrapping, independent help, and
  publishing without inserting the editor ad into site files.
- Text-only, image-and-text, and mobile screenshots were inspected. The image
  screenshot uses a synthetic SH tile for layout testing, not final sponsor artwork.
- This layout is a local, unreleased preview; no release version or checksum
  manifest was changed and nothing was deployed.

# Alpha 0.1.9 visibility and version correction

Checked on September 7, 2026, with PHP 8.5.4.

- The public HTML served by `https://sitefren.com/sitefren.php` contained the prior
  committed ad and help link but still identified itself as Alpha 0.1.8. The missing
  ad in the owner's browser was not independently reproduced; browser filtering or
  placement remained possible explanations.
- The corrected build identifies itself as Alpha 0.1.9, keeps that badge visible
  on narrow screens, moves the ad above the workspace, and offers independent
  help links on setup/sign-in and in the signed-in header.
- PHP syntax, 125 core, 79 installation, 47 update, 88 HTTP and 61 browser checks
  passed, along with embedded JavaScript/image-drop checks and `git diff --check`.
- Browser assertions verify ad/help placement inside a 1366×768 viewport, help
  visibility with the ad hidden, and mobile version/help visibility. Laptop and
  mobile screenshots were inspected. Provider and release responses were fixtures.
- No live AI calls, hosting replacement or in-place update was performed. GitHub
  Release publication and representative production-host testing remain separate.
- Version references and the SHA-256 manifest were updated together.

# Unreleased hosting promotion and update notices

Checked on September 7, 2026, with PHP 8.5.4.

- PHP syntax, 125 core checks, 47 isolated update checks, 88 HTTP checks with the
  provider/release fixture, and 54 Playwright browser checks passed. Embedded
  JavaScript/image-drop checks passed.
- Update checks cover authentication, CSRF, bounded fixed-origin requests, version
  ordering (including alpha releases), cache reuse, host opt-out, invalid responses,
  rate limiting, and missing releases. No private project data is sent.
- Browser coverage includes the labeled editor ad, a help link without customer
  data, the update notice, publishing without ads, mobile layout, sign-out and no
  uncaught JavaScript errors. The stale tagline assertion was replaced with the
  current promotion's mobile visibility check.
- The desktop screenshot was inspected. The ad sits below the preview and above
  the footer. `/tmp/sitefren-ad-desktop.png` is a local review artifact.
- The public GitHub releases feed returned HTTP 200 and an empty array. No release
  was published and no in-place update was performed. Automatic notifications
  require a published GitHub Release with a supported version tag.
- `git diff --check` passed. Changes remain unreleased; checksums were not rebuilt.

# Unreleased installation counting validation

Checked on September 7, 2026, with PHP 8.5.4.

- PHP syntax, 125 core checks, 83 HTTP checks with the provider fixture, and
  embedded JavaScript/image-drop checks passed.
- 79 isolated installation checks passed using replaced cURL functions: stable
  identity, older-state registration, payload limits, no customer URL or credential
  fields, delivery outside the state lock, competing attempts, daily retries,
  opt-out, HTTP/transport failures and Rybbit's filtered-success response.
- Playwright with the provider fixture passed 47 checks, then failed the existing
  assertion for the absent "Bringing power back to shared hosting." tagline.
  An unchanged HEAD copy reproduced that same failure. Later sign-out and final
  JavaScript-error assertions were not reached; this is not a full browser pass.
- A labeled `installation_tracking_test` event was accepted by the configured
  Rybbit installs site and its presence in the dashboard was confirmed by the owner
  before implementation. Automated tests sent no live analytics or provider calls.
- Automatic production shutdown scheduling has not been exercised on a deployed
  host. Built-in-server and CLI runs intentionally skip automatic reporting.
- `git diff --check` passed. This is an unreleased change; release checksums were
  not regenerated.

# Alpha 0.1.8 validation

Checked on September 6, 2026.

- `node tests/image-drop.cjs` passed: embedded JavaScript syntax, nested drag
  highlighting, multiple uploads, concurrent-drop prevention, format and size
  rejection, authentication and text-editing guards, ordinary text dragging,
  existing file-picker uploads, read errors, and server-error display.
- `git diff --check` passed. Release version references and the SHA-256 manifest
  were checked for consistency.
- PHP syntax, core/HTTP integration, and full browser checks were not rerun:
  PHP is not installed in this environment. The new handler checks use simulated
  DOM events and upload responses; native browser drag behavior remains unverified.
- No live provider or production-host tests were performed for 0.1.8.
- The bundled editor screenshot is from 0.1.7 and predates the footer and drop hint.

## Previous Alpha 0.1.7 validation

Validated on September 6, 2026.

| Check | Result |
| --- | --- |
| PHP syntax | Passed on PHP 8.3.6 |
| Embedded browser JavaScript syntax | Passed with Node.js |
| Core behavior and safety checks | 122 passed |
| HTTP integration checks | 69 passed, including the isolated cURL fixture |
| Chromium browser checks | 50 passed on 0.1.7 |
| Desktop visual inspection | Preview screenshot inspected |
| Live OpenRouter generation | Not tested; no live key supplied |
| Live Concentrate generation | Not tested; no live key supplied |
| Production shared-hosting deployment | Not tested |

The current core/HTTP checks and browser checks cover ownership setup, credential handling, login,
CSRF enforcement, wrong-password throttling, static-path constraints, unsafe
content rejection, bounded history, incremental edits, provider request/response
fixtures, image upload, real disk publishing, external-file conflicts,
interrupted-publish recovery, symlinks, stale revisions, host provisioning,
desktop/mobile rendering, local asset loading, preview navigation, and preview
isolation from parent DOM, cookies, and network fetches.

Version 0.1.1 adds checks for existing-state timeout defaults, timeout validation
and host overrides, catalog parsing, public catalog requests without credentials,
model selection in Settings, NDJSON progress and completion, timed heartbeat
callbacks, saved wait limits, ZDR/model error classification, sensitive provider
error suppression, and pending-job release after success or failure. Both
provider response shapes pass through the same HTTP path used in deployment,
with cURL replaced only in the isolated development server. These checks do not
simulate a production proxy buffering output or killing a PHP worker.

Version 0.1.2 also verifies transport cause classification, upstream HTTP status
retention, timing/request IDs, a synthetic PHP fatal handled at shutdown,
unknown-outcome recovery after a synthetic unrecorded exit, authenticated-only
diagnostics, and draft preservation. Direct-edit browser checks exercise script
suppression, literal text escaping, preservation of original asset links, removal
of editor-only artifacts, draft-only saving, Cancel, and History restoration.
The synthetic exit is not an operating-system kill test. Production out-of-memory
and fatal-inside-write recovery remain hosting-dependent and unverified.

Version 0.1.3 verifies selection field limits and filtering, owned-page and
selector validation before generation, and context forwarding for both providers.
Browser checks select a heading using the keyboard, move to the parent card,
reject a message with the wrong token, and send the target through the real
application HTTP path to a synthetic provider transport. That fixture requires
the correct source selector/snippet before returning a red first card while
preserving the second card's shared class. Checks cover saved-source cleanliness,
target references in chat, clearing selection after changes/navigation, and mobile
overflow. Source-formatting changes also pass the existing workflow checks.

The targeted fixture demonstrates correct context delivery and result handling;
it does not establish a live model's targeting accuracy or readability. The
uploadable application has no new runtime dependency. Formatting packages were
used only in the development environment and are not included in the release.

Browser checks used headless Chromium 134 with Playwright against a local PHP
development server. The sample-site preview is an actual screenshot of the app,
not a design mockup. No live inference requests were billed. Provider adapters
were verified against documented API shapes and synthetic responses; that does
not establish that a particular real model will produce valid edits, finish
within hosting time limits, or be available to a customer's key.

Before a customer rollout, test a small real prompt with each provider and your
chosen model, then repeat the workflow on your actual Apache/LiteSpeed/PHP-FPM
configuration, including HTTPS/proxy handling, file ownership, request limits,
session behavior, and recovery. The security notes describe the remaining
boundaries; these checks are not an independent security audit.

Version 0.1.4 passed 150 core and HTTP checks plus PHP syntax validation. New
checks cover placeholder ownership, a public root response, noindex metadata,
existing PHP/HTML/default homepages, dangling links, directories, upgrading an
empty state, and publishing over the tracked placeholder. The development
server serves index.html by default; Apache/LiteSpeed directory index and listing
configuration have not been tested here. Branding was updated to Sitefren Alpha; all 47 browser checks were rerun and
the refreshed screenshot was inspected.

Version 0.1.5 passed 211 checks (102 core, 62 HTTP, 47 browser) using the renamed
sitefren.php entry point. Provider fixtures require the structured edit schema.
Malformed model output through the HTTP route preserves drafts, releases pending
work and saves diagnostics without raw text. Core checks distinguish output
limits and refusals. Live provider structured-output enforcement and availability
were not tested; the request fields follow the documented provider contracts.

Version 0.1.6 core/HTTP validation covers provider-reported usage, the 16,000-token
request cap, rejection of truncated output marked completed, draft preservation,
and acceptance of valid edits at the cap. Browser workflow and screenshot remain
from 0.1.5; embedded JavaScript syntax was rechecked. The supplied user response
was reviewed as pasted text, not replayed as exact original bytes. New cutoff
fixtures reproduce its reported usage/status and unfinished JSON characteristics.
No new live provider call was made; the higher cap is not a guarantee of completion.

Version 0.1.7 checks cover targeted CSS replacements without HTML changes,
history preservation, empty/missing/ambiguous targets, unsafe replacement text,
conflicts with full-file edits, and all-or-nothing failure after an earlier valid
replacement. The browser target fixture now returns a small exact replacement
through the real application HTTP path. Error dismissal tests cover CSRF, stale
request protection, refresh persistence, absence of replayed toasts and retained
diagnostics. Full live model generation remains untested; fixtures demonstrate
handling of the new contract, not model compliance with it.

Repository preparation: all 241 local checks were rerun with the AGPL header and
source link. The updated screenshot and local Markdown links were inspected.
GitHub Actions configuration is provided but has not run on GitHub yet.
