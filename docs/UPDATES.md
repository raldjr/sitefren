# Editor updates

## Installing an update

From Alpha 0.2.0, signed releases can be installed through **Settings → Check for
updates → Update now**. The owner confirms, the editor verifies and installs the
release, and the page reloads. Drafts, credentials, installation identity and
published files are preserved. Save file edits and finish visual editing first.

Builds before 0.2.0 need one manual upload to gain the installer: back up the
editor and private state, upload only the new `sitefren.php`, and sign in normally.
Keep `builder-state.php` and your website files. This also remains the fallback
for customized editors, incompatible hosts or unavailable release assets.

One-click updates require PHP cURL, Sodium and Tokenizer, and writable editor and
parent directory permissions. No shell access, Composer, database, worker or
second customer upload is needed. There is no unattended installation.

## Discovery and privacy

After owner sign-in, PHP checks the fixed public GitHub releases feed for
`raldjr/sitefren`. The request is authenticated and CSRF-protected. It fetches at
most ten releases outside the state lock, with a three-second timeout, verified
HTTPS, no redirects and a bounded response size. Supported version tags and
published prereleases are included; drafts and unrelated tags are ignored.
A tag without a published GitHub Release is not discoverable.

Successful checks are cached for 24 hours. Failed checks retry after an hour.
Settings offers a manual check with a one-minute minimum interval. These checks
do not change the draft revision. Notices appear during editor use; closed
browsers and idle hosts receive no push message. `POCKET_UPDATE_CHECKS=0` disables
both checks and in-place updates.

Checks and downloads send the app version as a user agent. No project content,
installation ID, customer hostname or provider key is sent. GitHub and its asset
host see the hosting server's IP address. Manual release downloads stay available
from Settings even when automated checking is disabled.

## Verification and replacement

The editor embeds only the publisher's Ed25519 public key. The private signing
key is kept outside the repository and is never distributed or sent to GitHub.
A signature authenticates the exact manifest bytes covering version, SHA-256,
file size, PHP compatibility and state schema.

On the authenticated, CSRF-protected POST action, the editor reserves the update
in private state for three minutes. Concurrent edits and generation requests are
rejected while that reservation is active. Downloads run outside the state lock.
Only fixed versioned GitHub release assets and HTTPS redirects to GitHub's
`release-assets.githubusercontent.com` or `objects.githubusercontent.com` hosts
are accepted. Each transfer is limited to five seconds and four destinations;
metadata and editor bodies have explicit size limits. Failed attempts clear their
reservation; an interrupted process's reservation expires.

Both the current and next release manifests must verify. The current editor's
on-disk hash must match its signed release; custom changes, including embedded
sponsor artwork, require a manual upgrade so they are not silently overwritten.
The target must be newer, compatible with PHP and schema 1, match its signed
size/hash/version, and parse as PHP without executing it.

Under the state lock, the installer rechecks the reservation and revision,
creates protected editor/state backups, records the new editor version and
replaces the editor with a same-directory atomic rename. Replacement failure
restores the previous state. Published files are untouched. OPcache is invalidated
when available; an old worker encountering newer state is rejected with a reload
message. Hosts that retain stale PHP bytecode may need their cache cleared.

## Backup recovery

Backups are retained beside the private state file, with owner-only permissions:

- `builder-state.php.update-<random-id>.editor.php`: an inert PHP guard, then a
  newline and base64 of the old editor.
- `builder-state.php.update-<random-id>.state.php`: the old private state with its
  normal PHP guard and JSON body. A custom state path changes this filename prefix.

HTTP requests to these files return an empty 404 when PHP is configured normally.
Treat them as private: state backups contain credentials and drafts. Keep an
independent hosting backup too. Old backup pairs can be removed through the file
manager after the new editor has been verified; the installer does not delete them.

For manual recovery, take the editor backup's text **after the first newline**,
base64-decode it locally, and upload the decoded file over `sitefren.php`. Restore
its matching `.state.php` backup over the configured private state file. Do not
upload the still-encoded editor backup as the editor. Clear the host's PHP cache
if needed. This paired restore also recovers an interruption between saving update
metadata and replacing the editor. Website files do not need replacing.

The installer is not an automatic health-check rollback service. A new editor
that cannot start cannot run its own recovery code. Hosting process limits,
disk exhaustion and unusual OPcache configurations remain reasons to use the
file-manager recovery path. Schema changes require a separate migration design;
the current installer accepts only schema 1 releases.

## Publishing a signed version

The publisher's key is stored at
`~/.config/sitefren/release-signing.key`, with owner-only permissions. Back it up
securely; losing it prevents signing updates trusted by existing installations.
Do not generate a replacement key for an ordinary release. The development tool's
`create-key PATH` command is for initial setup only. Neither key material nor
runtime state belongs in the repository or release assets.

After editing and testing the new version:

1. Update the PHP version/header, README download links, installation guide,
   changelog and validation record as described in CONTRIBUTING.md.
2. Run `php scripts/sign-release.php sign ~/.config/sitefren/release-signing.key`.
   This writes public `release/update.json` and `release/update.sig`. Any later
   change to `sitefren.php` requires signing again.
3. Stage the release files and regenerate `SHA256SUMS` for all tracked files except
   itself. Run `python3 scripts/release.py v0.2.0 /tmp/sitefren-release`, using the
   version being shipped. It verifies signatures, hashes, docs and release notes.
4. Commit and push, then create and push the matching annotated `vX.Y.Z` tag.
5. Watch the Publish release workflow finish; verify the public PHP download and
   signatures with `php scripts/verify-published-release.php` before announcing it.

A request to ship an update is complete only after the version commit and tag
are pushed, the release workflow succeeds, and the public verifier passes.
A pushed main branch alone does not deliver an editor update. Report the version,
release link and verification result when handing off a release.
Public verification is a separate retryable CI job, with bounded retries for
GitHub release-feed propagation. Main pushes also verify that the current editor
matches a published signed release; this makes an unshipped version visible in CI.

The tag workflow verifies the signed manifest and complete source checksums,
runs PHP, core, analytics, update, installer, HTTP, JavaScript and browser checks, then
publishes an alpha prerelease containing `sitefren.php`, `update.json`,
`update.sig`, `SHA256SUMS` and `sitefren.php.sha256`. GitHub supplies source
archives. Local browser and representative-host validation remain separate.
The workflow uses GitHub's scoped token; no signing secret is held by CI.

Use the versioned asset URL for downloads. GitHub's `/releases/latest` shortcuts
omit prereleases, so `/releases` remains the general alpha release destination.
