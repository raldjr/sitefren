# Security notes for Sitefren Alpha

This is an alpha for a trusted hosting-account owner. It has not undergone an
independent security audit and is not ready for automatic deployment across
customer accounts without a hosting trial and review.

## Implemented boundaries

- Setup requires a secret obtained through filesystem access, or a host-provided
  password hash. Merely opening the public URL does not allow claiming the app.
- Authentication uses PHP password hashing, regenerated sessions, HTTP-only
  SameSite=Strict cookies, a two-hour idle timeout, and per-address sign-in limits.
- Mutations require POST with a session CSRF token. Revisions reject stale edits.
- Provider credentials are server-side. Public state excludes keys, password
  hashes, recovery journals, and setup codes. Provider error bodies are not echoed.
- Public model catalogs are fetched only from fixed provider endpoints, without
  forwarding the saved key. The authenticated catalog proxy requires CSRF.
  Catalog visibility does not verify account access or ZDR eligibility.
- Generation progress contains only elapsed time and the configured wait limit;
  the final streamed result uses the same credential-filtered state representation.
  Failures after progress begins carry their status in the final JSON event.
- Authenticated latest-request diagnostics contain bounded metadata, transport
  codes and timings, not prompts, credentials, or raw provider/PHP error bodies.
  An unrecorded interruption remains unknown; shutdown recording is best effort.
  A fatal while the state lock is held skips the recorder to avoid deadlocking.
- Visual text editing disables site scripts and inline handlers in the preview.
  Messages must come from that iframe and match the current edit-session token.
  Only validated text-node changes are applied to an original source DOM;
  rewritten preview HTML is never accepted as the saved page. Normal authenticated
  save-file validation, stale-revision checks, and history still apply.
- Element selection also pauses site scripts and accepts messages only from the
  preview with its current selection token. The parent derives the snippet from
  the original source DOM, not HTML supplied by the preview. PHP requires an
  owned HTML path, a bounded structural selector, and bounded text/HTML fields;
  unknown fields are discarded. This context is untrusted source data, not an
  instruction tier. Selection guides the model but does not sandbox its edits to
  a single element. The ordinary file validation and Publish step remain required.
- HTTPS is required outside a local development server. Proxy headers from an
  arbitrary request are not trusted. Provider requests verify TLS and do not
  follow redirects. Provider destinations are fixed, not user-supplied URLs.
- Generated paths are limited to simple project-relative static filenames.
  Parent traversal, dot paths, wrappers, escaping symlinks, executable extensions,
  and PHP opening tags in generated text are blocked. No generated PHP is run.
- The editor reads only its own managed text files from private state when
  constructing prompts. It does not give the model account-wide file access.
- Whole edit batches are validated before they replace draft state. Writes use
  an exclusive lock and random temporary PHP filenames with restrictive modes.
- The preview is a separate response with an opaque sandbox, a restrictive CSP,
  no network fetches, no form submissions, and no same-origin access. Local
  styles/scripts and uploaded images are embedded for preview. External image
  requests over HTTPS are allowed and reveal ordinary request metadata to their
  image hosts. Third-party scripts, fonts, frames, and connections are blocked.
- Publishing checks ownership and content hashes. A stored journal supports
  rollback after failure, and refuses to overwrite later external edits.

## Important limits

Authenticated update checks fetch only the fixed public GitHub release feed,
without project data or keys. Responses are size/time bounded and version tags
are validated; the UI uses a fixed official release link, not an upstream-provided
URL or HTML. Nothing is downloaded for execution or installed automatically.
GitHub receives the hosting server IP and app version. `POCKET_UPDATE_CHECKS=0`
disables these requests. The hosting ad contains static links and no third-party
script; its contact link does not attach customer URLs or content.

Installation counting automatically sends a random persistent installation ID and
app version to `https://analytics.molondigital.com/api/track`, using a fixed site ID
and hostname label. No customer domain, content, credentials or visitor IP is
forwarded. The receiving service sees the hosting server's source IP and may
derive network/location metadata or retain access logs. No browser script, replay,
or automatic error capture is loaded. Set `POCKET_INSTALL_TRACKING=0` in the host
environment to disable sending. See README.md for identity and retry behavior.
The public ingestion endpoint cannot authenticate a distributed open-source
installation; these counts are approximate and can be forged, not license evidence.

**Published JavaScript shares the site's origin.** Preview isolation does not
make arbitrary published code trustworthy. A published script can act with the
authority of a visitor on that origin, including an editor user who is signed
in. CSRF tokens are not a defense against same-origin malicious JavaScript.
Use trusted prompts, review code, sign out before browsing published pages, and
plan a separate editor origin for a stronger production boundary. The builder
does not claim to detect every malicious JavaScript program.

The hosting account owner can read their own keys and files. This is not a place
to conceal a shared billing secret. Account isolation must be enforced by the
hosting platform; another process running as the same Unix user is trusted by
this application. File validation is not an OS sandbox against that process.

Guarded `.php` storage assumes PHP is configured to execute PHP files, never
serve their source. Keep state outside every document root where possible and
protect backups and archives equally. HTML, CSS, JavaScript, and image output
must be served statically; deployments with custom PHP/SSI handlers for those
extensions are unsupported. Do not weaken file modes to make setup work.

The app has no antivirus, robust HTML/JavaScript sanitizer, two-factor login,
password-reset email, automatic updates, audit-log service, usage billing cap,
or hosting-panel SSO. Native sessions depend on the host's session storage.
Requests and locks are bounded by normal PHP/host limits; shared hosting may
terminate inference requests early. Progress heartbeats and continued execution
after a browser disconnect do not provide durable background jobs. No automatic
inference retries or provider retention/routing overrides are made. Image
storage and snapshots consume disk
and memory. Backup the complete private state and the public files together.

A host-level write race, disk exhaustion, host crash, or manual intervention can
require recovery by the hosting administrator. File replacement is per-file,
not a global atomic deployment. Before recovery, preserve `builder-state.php`
and the live files so the original journal remains available.

## Reporting

Report suspected vulnerabilities privately to **hello@raul.ws**, with the subject
“Sitefren security report”. Describe the affected version and use a minimal
synthetic reproduction. Do not include real credentials or customer state.
Do not publish exploit details in a public issue while coordinating a fix.
This volunteer-maintained alpha has no guaranteed response-time commitment.

## Directory listings

Version 0.1.4 creates a placeholder index.html on the first HTTPS editor visit
when no index/default homepage exists. This relies on normal server directory
index settings. It does not protect subdirectory listings or direct URLs and
cannot run before the editor is first requested. Disable directory listing at
the hosting level as well. PHP execution and private-state protection remain
required. Existing homepages and hosting configuration are preserved.
