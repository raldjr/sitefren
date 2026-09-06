# Alpha 0.1.7 validation

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
