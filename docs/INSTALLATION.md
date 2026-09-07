# Sitefren

**Bringing power back to shared hosting.**

Built by **Raul Aldrete Jr.** for [Sheepdog Host](https://sheepdoghost.com).

Upload one PHP file. Describe your website. Preview it. Publish real HTML, CSS,
and JavaScript on the hosting account you already own.

Sitefren is an **Alpha 0.2.3** application for small static websites, licensed under AGPL-3.0-only.

**One file to upload is a project requirement.** The customer uploads
`sitefren.php`; the editor creates its own private state and published site files.
No second application upload, package installation, build step, or customer-managed
background worker is required. Future features must preserve that installation
flow. The source archive and development tests are optional developer materials.

## Try it

1. Create an **empty folder** on a test hosting account, such as `public_html/demo`.
2. Upload **only `sitefren.php`** into that folder.
3. Open `https://your-domain.example/demo/sitefren.php`.
   Opening the editor also creates a public coming-soon `index.html` if no
   index/default homepage exists. Publish replaces this managed placeholder.
4. Open the newly created `builder-state.php` in your hosting file manager. Copy
   the setup code from its first line into the setup screen, then choose an
   editor password of at least 12 characters. This proves ownership of the files
   so an unrelated visitor cannot claim a fresh installation.
5. Either connect an AI provider in Settings, or close Settings and choose
   **Try a sample site**. The sample is a real editable draft; it uses no AI credits.
6. Use Preview, Files, Images, and History to work on your site.
7. Click **Publish**. The website is written next to the builder, starting with
   `index.html`. Visit `https://your-domain.example/demo/index.html` to see it.

To serve the site at the domain root, place the builder in an empty document
root instead. A host must serve `.html`, `.css`, `.js`, and images as static
files. A preexisting `index.php` can take precedence over `index.html`; the
alpha does not change hosting configuration or remove existing applications.

**Keep `builder-state.php` private and backed up.** It contains credentials,
drafts, history, ownership information, and recovery data. Direct HTTP requests
to it return an empty 404 while PHP is correctly configured. Prefer the private
storage setting described below on a hosting service you control.

## Upgrade an existing alpha

Production visits automatically register a random installation ID and app version
with Sitefren's Rybbit analytics, including existing installs after this update.
Your site URL and content are not sent; the service receives your hosting server's
IP address. To disable reporting, set `POCKET_INSTALL_TRACKING=0` in your hosting
environment before visiting the editor. See [installation counting](../README.md#installation-counting).

Upload `sitefren.php` into the same folder as your existing installation.
Keep `builder-state.php`, its lock, and all published files. Back up private state
first. Open `sitefren.php` and sign in with your existing password; drafts and
settings are reused. Once that works, remove the old `builder.php` so visitors
cannot keep using an outdated editor. Do not rename or delete private state.

From 0.2.0 onward, use **Settings → Check for updates → Update now** when a newer
signed release is available. Confirm to back up the editor and private state and
reload into the new version. This needs writable editor/folder permissions and
PHP cURL, Sodium and Tokenizer. Modified editor files need a manual upgrade.
See [updates and backup recovery](UPDATES.md).

For manual upgrades, replace only `sitefren.php`. The internal POCKET_* hosting
settings remain supported. Renaming the upload changes its session cookie name,
so an existing user may need to sign in again but does not repeat setup.

## What works

- One uploadable PHP application, with an embedded interface and no CDN assets.
- Owner-verified setup, password sign-in, session expiry, CSRF protection,
  sign-in cooldowns, and sign-out.
- OpenRouter and Concentrate adapters with exact model-ID selection and a
  provider-catalog picker.
- Configurable AI wait limits and browser progress heartbeats during generation.
- Chat-based creation and incremental edits of the managed site's files.
- Desktop/mobile preview and navigation between local HTML pages.
- Direct text editing in Preview, saved to the draft without an AI request.
- Select an element in Preview and ask the AI for a targeted change.
- Latest-request diagnostics with transport evidence and explicit unknown causes.
- PNG, JPEG, WebP, GIF, and static SVG uploads that can be used by the AI.
- A plain-text file editor and the latest 10 draft restore points.
- Publish to the local filesystem, with conflict detection and rollback data.
- Host-provided API credentials and optional provisioned sign-in settings.
- A sample studio site to exercise the workflow without provider credentials.

The builder's author/hosting attribution appears in the **editor**, not in the
customer's generated website. There is no analytics, phone-home endpoint,
license server, mandatory backlink, or dependency on Sheepdog Host.

## Connect AI

Choose the provider, paste that account's API key, and enter an exact model ID
from its dashboard, or click **Load provider model list**. The public catalog
request does not send your saved API key or start a billable generation. A model
listing does not establish that your key can use it or that its route supports
your ZDR policy. Manual model entry remains available if the catalog cannot load.
Model access and billing are controlled by the provider.
Keys are saved server-side and are never returned by the state API or included
in the generated website or model prompt. Leaving the key field blank preserves
the saved key; the remove-key checkbox deletes it.

The adapters use:

| Provider | Endpoint | Request format |
| --- | --- | --- |
| [OpenRouter](https://openrouter.ai/docs/quickstart) | `https://openrouter.ai/api/v1/chat/completions` | Chat messages |
| [Concentrate](https://concentrate.ai/docs/api-reference/introduction) | `https://api.concentrate.ai/v1/responses` | Responses input and instructions |

Each design request sends the managed text files, uploaded image **paths**, the
last eight conversation messages, and your new instruction. Image bytes are
not sent to the text model in this version; describe the intended use of a photo
when you upload it. The model responds with complete changed-file contents in a
small JSON envelope. The PHP application validates the complete batch before
updating the draft. Malformed, oversized, conflicting, or truncated edits leave
the draft intact.

There is one non-streaming inference request per chat turn, with an
16,000-output-token cap. The AI wait limit now defaults to **180 seconds**; Settings
allows **30–300 seconds**. Connection establishment has a separate 10-second
limit. Model support, context windows, latency, and costs vary.

PHP sends a browser progress heartbeat approximately every five seconds while
waiting. These are elapsed-time updates, not model tokens or a completion
percentage. They can help with idle connection timeouts when the host forwards
them promptly. Output buffering, PHP-FPM/LiteSpeed limits, reverse proxies, and
hosting process limits can still stop or buffer the request. Keeping the tab
open cannot override those limits.

Switching tabs is fine. On leaving the page, PHP tries to finish and save the
draft using `ignore_user_abort(true)`. This is best effort: a host can still kill
the worker. Reopening the editor loads the saved draft or polls the pending
request; a stale pending reservation expires 45 seconds after its AI wait limit.
There is no durable background worker, cron queue, or automatic resubmission.
Refresh to check the saved result before manually retrying an interrupted call.

A failed local request may still be billed upstream. Requests are not
automatically retried, and this version does not alter provider retention,
ZDR, routing policy, or the chosen model to recover from errors. Provider
failures are classified into readable messages without echoing raw error bodies.

## Add images

Drag one or more PNG, JPEG, WebP, or GIF files onto the prompt area. The area
highlights while dragging. You can also click **+ Add image**, or use **+ Upload
image** in Images, to choose a file.

Each image must be under 2 MB. The project supports up to 12 images, 8 MB combined,
and 20 megapixels per image. Uploads pause other editor actions and are unavailable
during generation or direct text editing. Files in a drop upload one at a time;
if an upload fails, earlier successful uploads remain and later files are not sent.
Check Images before retrying. Adding an image does not make an AI request; ask the
AI how to use it, review the draft, and Publish when ready.

## Mobile workspace and home-screen app

On phones, use **Website** and **Chat with AI** to switch views without losing
an unsent prompt. A completed generation opens Website. During direct editing,
inactive navigation collapses and Save/Cancel stay above the preview. Touch
controls are larger, form text avoids automatic zoom, and floating panels adjust
to the visible viewport when the keyboard opens.

Use **Settings → Install Sitefren app** to open the browser's install prompt when
supported. On iPhone/iPad, open the editor in Safari and use **Share → Add to Home
Screen**. Other browsers may offer Install app or Add to Home screen in their
menu. HTTPS is required on your hosting account; localhost works for development.
The app manifest, home-screen icons and service worker are served by the same
PHP file, including when it is renamed or installed in a subfolder.

The installed app uses the same server sign-in and signed updates. Editing,
AI generation, saving and publishing require an internet connection. If a page
is already open when connectivity drops, keep it open and reconnect before
saving. Offline launches show a reconnect screen. There is no offline editing,
background save queue, or local copy of private state. The worker caches no
editor/API responses and controls only the editor path, leaving published pages
independent. Replacing the PHP editor is reflected on the next online launch.

Browser installation behavior varies. Chromium installability and offline
behavior are tested; physical iPhone/iPad installation should also be checked
on the target device.

## Edit text and images on the page

In Preview, choose the HTML page and click **Edit**. Select text to open a floating
formatting bar with heading, bold, italic, underline and link controls. Click an
image to replace it from your uploaded images or upload a replacement, change its
alt text, width, height and fit, or remove it. Escape or the close button dismisses
the floating controls. Blank height uses the image's natural proportions.

Click **Save changes** to save text and image edits together to the draft, then
**Publish** when ready. Cancel discards page edits; uploaded replacements remain
available in Images. History can restore the previous page source. No AI request
is needed. Replacement removes old picture sources so browsers display the new image.

Direct image controls work with HTML image elements, including uploaded SVGs used
as images. CSS background images and inline SVG artwork still use Files or AI.
Website scripts remain paused while editing. Tables and complex markup can render
differently with temporary text wrappers. Source formatting may normalize on save.

## Select something and ask for a change

1. In Preview, click **Select for AI**.
2. Click the element you want to change, or focus it and press Enter/Space.
3. If you clicked text inside a card, click **Select parent** beside the prompt
   until the whole card is highlighted.
4. Describe the change, such as **Make this card red**, and click **Update**.
5. Review the draft, then Publish when ready.

The label beside the prompt identifies the selected element and page. Clear
removes the target. Stop selecting returns to normal preview while keeping the
target for your next request. Changing pages or changing that page's source
clears the selection. Selection can be used without a provider connection, but
the requested AI change requires the configured provider/key.

The request includes the original page path, a structural CSS selector, and a
bounded HTML/text excerpt alongside the managed project files already sent to
the model. No account-wide files or credentials are added. The excerpt can be
truncated; the complete managed source remains available in the request. Site
scripts pause while selecting so the target maps to source rather than a
temporary script-generated element. Selection is limited to existing HTML
elements; canvas content, generated DOM, and individual SVG shapes are not
supported. Temporary outlines, selection attributes, and helper scripts are
preview-only.

The selection guides the AI; it is not a hard restriction on the model's changes.
Instructions ask it to preserve unrelated elements and avoid altering every card
that shares a CSS class. Normal file validation, history, and explicit publishing
still apply. The conversation retains a short reference to the chosen target.

## Readable code

The uploadable PHP file and bundled sample are formatted, unminified source.
PHP uses four-space indentation; HTML, CSS, and JavaScript use two spaces.
Code favors descriptive names and ordinary control flow. Comments explain a
small number of non-obvious decisions, rather than narrating each statement.

The AI is instructed to produce code a first-year engineer can follow: readable
indentation, descriptive names, small functions, one CSS declaration per line,
and very few comments. Model output is still model-dependent; this is not an
automatic formatter or a guarantee of code quality. Existing customer files are
not reformatted merely by replacing the editor. Development formatting tools
are not uploaded or required by the hosting account.

## Where did the request fail?

Open **Request details**, including while a generation is running, and use
Refresh to reload the latest server record. This is a single latest-request
record, replaced at the start of the next AI request, not a permanent audit log.
It includes a local request ID, provider/model, UTC start/end times, configured
wait limit, elapsed time, cURL error number, provider HTTP status, and available
cURL connection/response timing. Timing values are cumulative seconds from the
transfer start; zero may mean a phase was not reached or was not measured.

| Recorded evidence | What it establishes |
| --- | --- |
| `local_wait_limit`, cURL 28 | Our connection or AI wait deadline was reached; the reason for the delay is not established. |
| `provider_http_error` plus HTTP code | The selected provider endpoint returned an error. A provider-side gateway may be involved. |
| DNS, TLS, connection, or transport failure | cURL observed a specific failure between hosting and the provider; it may not identify the responsible party. |
| `php_execution_limit`, `php_memory_limit`, or `php_fatal_error` | PHP's shutdown handler was able to record a PHP failure. |
| `interrupted_unknown` | A saved request expired without a final result; inspect host PHP/web-server/proxy logs at the recorded UTC time. |
| `completed` | The provider response was processed and the draft save completed. |

An editor HTTP 502 is not necessarily a provider HTTP 502: the diagnostic record
keeps the upstream status separately. A browser connection error alone cannot
identify which server failed. PHP cannot record every abrupt process kill,
out-of-memory failure, restart, or storage outage. A disconnect observed by PHP
refers to its downstream connection, which may be a proxy; a false value does
not prove that the browser stayed connected. Match timestamps with hosting logs
and provider request activity to investigate uncertain cases. No raw provider
body, API key, or prompt is included in this diagnostic record.

## Hosting requirements

- PHP 8.2+; the supplied checks were run with PHP 8.3.
- Sessions and JSON; cURL and a working CA certificate store for AI requests.
- HTTPS. The built-in PHP development server permits HTTP on loopback only.
- Writable project directory and writable private-state directory.
- Outbound HTTPS to the selected provider.
- Enough request time for inference. The application requests a PHP execution
  limit 15 seconds beyond the selected AI wait limit, where `set_time_limit`
  is available, but cannot override a host's hard limit.
- At least 128 MB PHP memory; 256 MB is preferable for image-heavy drafts and
  publication journals. Hosting request-size limits must allow your uploads.

No database, Composer, Node, Docker, SSH, cron, or shell execution is needed on
the customer's hosting account.

## Host provisioning

The alpha intentionally separates the editor from billing/key issuance. A
hosting installer can set these environment variables before launching PHP:

| Variable | Purpose |
| --- | --- |
| `POCKET_PROVIDER` | `openrouter` or `concentrate`; locks the provider setting |
| `POCKET_API_KEY` | A unique customer-scoped provider key; locks the key setting |
| `POCKET_MODEL` | Exact provider model ID; locks the model setting |
| `POCKET_AI_TIMEOUT` | Integer from 30 to 300 seconds; locks the AI wait limit |
| `POCKET_SETUP_CODE` | Optional unique ownership code, 16–128 letters, digits, `_`, or `-` |
| `POCKET_PASSWORD_HASH` | A PHP `password_hash()` result; initializes an already-provisioned account |
| `POCKET_STATE_PATH` | Absolute private storage path ending in `.php`, preferably outside every document root |
| `POCKET_HTTPS` | Set to `1` only when your trusted proxy terminates HTTPS and enforces it for the editor |

The parent of `POCKET_STATE_PATH` must already exist and be writable by the
account's PHP worker. Its default is `builder-state.php` next to the builder.
The lock is created at the state path plus `.lock.php`.

Provisioned settings take precedence over editable settings. Setup code and
password hash initialize a **new** state only; they do not overwrite an existing
installation's password. The authenticated installer, not a public PHP route,
should generate credentials and deliver the user's editor login.

Later, a Sheepdog Host integration could install the file, provision a limited
key, choose a model, and open the editor from the hosting dashboard. This
alpha does **not** yet create provider accounts, issue API keys, bill
customers, or integrate with a hosting panel or SSO.

Anyone who owns a shared-hosting account can inspect its PHP files, environment,
and credentials. Never embed a shared provider master key. Use a unique limited
key per customer, or a future hosted billing gateway with per-customer tokens.

## Storage, ownership, and publishing

The single uploaded file creates private runtime state and, when published,
public website files. One editor manages one directory. It never recursively
reads an existing hosting account. Existing WordPress/CMS imports are outside
the alpha's scope.

Draft text lives in the guarded state file. Images are stored once in that file
and referenced by their generated immutable paths. History snapshots keep text
versions; restoring a draft does not remove previously uploaded images.

Publishing records a hash of each owned output. It refuses to overwrite an
unowned file or a managed file changed outside the editor. Files are replaced
individually using temporary files and rename. A durable journal is saved first;
an authenticated visit recovers an interrupted publication. It also refuses to
overwrite unexpected outside changes during recovery. A whole-site publish is
**not** an atomic filesystem transaction: concurrent visitors can briefly see a
mix of old and new files. Test on a separate folder before customer deployment.

Limits: 30 text files, 120 KB per text file, 250 KB total text, 12 uploaded images,
2 MB per image, 8 MB total image data, and 10 text-history snapshots. Filenames
use simple relative paths. PHP, `.htaccess`, and executable uploads are not accepted. SVG uploads require
the PHP DOM/XML extension and must use static SVG elements without scripts,
event handlers, external references, or embedded HTML. Public file modes are `0644`; private state and locks use
`0600`. The PHP worker must run as the hosting account's owner.

## Local development and checks

```bash
php -l sitefren.php
php tests/core.php
python3 tests/integration.py
```

The integration runner starts and cleans up its own temporary PHP server.
`PHP_BIN` can select a PHP executable; `PHP_ARGS` can supply development ini flags.
Tests use temporary directories and never edit a deployed website.

For an interactive local session, copy the file into a separate empty directory:

```bash
mkdir demo
cp sitefren.php demo/
php -S 127.0.0.1:8080 -t demo
```

Open `http://127.0.0.1:8080/sitefren.php`. Do not expose PHP's development server
to the internet. See `VALIDATION.md` for what was actually checked and what still
needs a real provider/hosting trial.

## Scope and future PHP/database applications

This version manages up to **30 text files**, **250 KB total text**, **120 KB per
text file**, and **12 uploaded images**. These are alpha limits, not general
shared-hosting limits. It builds static multipage sites: HTML, CSS, JavaScript,
JSON, and text. PHP, SQL migrations, server APIs, and database credentials for a
generated application are not supported in this release.

The one-file editor could later produce a many-file PHP/MySQL application.
Examples include a blog, directory, booking application, or member portal. That
would need an explicit application mode: check PHP extensions and database
access, provision a dedicated app database/user, keep credentials in private
server configuration outside prompts, generate code against placeholders,
validate code before execution, and manage schema changes with backups and
reviewable migration/rollback steps. File history alone cannot restore a database.

Executable PHP previews require separate staging and server-level isolation;
the browser iframe sandbox only isolates browser code. A future host integration
can provision this while keeping customer installation simple. Merely allowing
`.php` in the current static-file allowlist is not sufficient. Runtime choice,
long-lived processes, dependencies, disk, CPU, memory, and database limits still
depend on the hosting plan. A file upload cannot add unsupported runtimes.

Any such extension must keep the one-upload requirement above. If database
setup, staging, or isolation cannot be handled automatically on supported hosting,
defer the feature rather than ask beginners to install additional services,
workers, packages, or scripts. Advanced features remain outside this release.

## Before a public release

See [SECURITY.md](../SECURITY.md) for the alpha's trust boundaries. Test real provider/model
combinations and Apache/LiteSpeed/PHP-FPM deployments. Review the release archive for credentials and customer data, and verify the private security-reporting process.

Ideas for later releases: hosting-panel installation, per-customer key issuance,
usage limits, account-aware model validation, a separate editor origin, existing-site
import with explicit ownership, longer resumable jobs, source diffs, vetted
contact-form components and export.

## License and attribution

AGPL-3.0-only; see [LICENSE](../LICENSE). Copyright © 2026 Raul Aldrete Jr. and contributors.

Built by [Raul Aldrete Jr.](https://raul.ws) for [Sheepdog Host](https://sheepdoghost.com).
**Bringing power back to shared hosting.**

## Homepage placeholder

The first HTTPS visit to the editor creates a neutral, noindex `index.html`
beside the upload. Existing index/default files, directories, and symlinks are
preserved. The placeholder contains no editor link or private information and
does not count as a published draft. Publishing replaces it through the normal
conflict checks and recovery journal. External changes are never silently adopted.

PHP cannot act merely because a file was uploaded: open the editor once. This
prevents the usual root listing only when the server serves index.html as a
directory index. It does not disable directory browsing in subfolders or block
direct file URLs. Hosts should disable directory listing in server configuration;
this application does not edit .htaccess or override custom index routing.

## Structured AI edits

Version 0.1.5 requests a strict JSON edit schema using Concentrate `text.format`
and OpenRouter `response_format`. OpenRouter requires a compatible route with
`require_parameters`. Your selected model/route must support structured output;
there is no automatic retry or fallback to another model or retention policy.
The existing file-path, size, content, revision and publish checks still apply.
Request details distinguish invalid JSON, incomplete output, reported output
limits and refusals, without saving raw model responses. This improves the
request contract but does not guarantee every live model/provider will comply.

References: [Concentrate structured output](https://concentrate.ai/docs/api-reference/endpoint/structured-output)
and [OpenRouter structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs).

## Output allowance

Version 0.1.6 allows 16,000 output tokens per generation (previously 8,000).
Longer responses may take more time and cost more. Request details records the
requested cap and provider-reported usage. An invalid JSON response at the cap
is labeled a suspected cutoff even when the provider says completed. A valid
response at the cap is accepted. Missing usage does not establish a cutoff.
No partial edits are applied and no automatic paid retry is performed.

## Smaller follow-up edits

Version 0.1.7 supports exact text replacements alongside complete new files.
For existing pages the AI is instructed to return unique find/replace snippets
instead of repeating whole HTML files. Replacements run in order against a local
copy. Missing or ambiguous targets, conflicting operations, unsafe paths/content,
and oversized results reject the entire batch without changing the saved draft.
History, revision checks, preview and explicit publishing still apply. Models
can still choose full replacements or exceed output limits; this reduces wasted
output without guaranteeing every generation finishes.

Error toasts appear for the current failed action rather than replaying on every
render. Use Dismiss on a saved error banner to hide it across refreshes; Request
details remain available. A stale dismissal cannot clear a newer request error.
For whole-site requests, clear any selected element first. Optional generated
localStorage access should use try/catch because the isolated preview can deny it.
