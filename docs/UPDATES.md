# Editor updates

## Available now

After owner sign-in, the browser asks the PHP editor to check the fixed public
GitHub releases feed for `raldjr/sitefren`. The request is authenticated and
CSRF-protected. PHP fetches at most ten releases, outside the state lock, with a
three-second timeout, verified HTTPS, no redirects, and a bounded response size.
No project content, installation ID, customer hostname or provider key is sent.
The request user agent includes the Sitefren version; GitHub sees the server IP.

The latest supported version tag among those releases is compared with
`PS_VERSION`. Supported tags are `0.1.9`, `v0.1.9`, and alpha/beta/rc variants such
as `v0.2.0-beta.1`. Published prereleases are included because Sitefren is alpha.
Drafts and unrelated tag names are ignored. A Git tag without a GitHub Release
does not appear in this feed.

Successful checks are cached in private state for 24 hours. Failed checks retry
after an hour when the editor is used again. Settings offers a manual check with
a one-minute minimum interval. These checks do not change the draft revision.
There is no background service or push connection: notices appear during use.
Set `POCKET_UPDATE_CHECKS=0` in the hosting environment to disable checks.

The footer links to the official release page when a newer release exists. Settings
also keeps a **View releases and downloads** link available. The
owner backs up private state and published files, then replaces only `sitefren.php`
through their hosting file manager. An unavailable or empty feed is reported
explicitly; neither is presented as proof that the installation is up to date.

## Publishing a version

Follow CONTRIBUTING.md's release checks, update the shipped version, and publish
a GitHub Release with a supported matching version tag, release notes, the
standalone `sitefren.php`, and checksums. Publish prereleases explicitly while the
app remains alpha. The ten most recent release entries must include the currently
recommended version.

The `Publish release` GitHub Actions workflow runs when a `v*` version tag is pushed.
It verifies that the tag matches the app, docs, changelog and complete checksum
manifest, then runs core, installation, update, HTTP and JavaScript checks. It
creates a draft release, uploads the standalone PHP file, source checksums, and a
separate download checksum, then publishes the alpha prerelease. Source archives
are supplied by GitHub. The workflow uses GitHub's scoped token; no personal key
is distributed or required by the installed editor.

Publisher sequence after local browser validation and compatibility review:

```sh
git push origin main
git tag -a v0.1.10 -m "Sitefren Alpha 0.1.10"
git push origin v0.1.10
```

Use the new version for each shipment. Watch the workflow finish and verify the
published file against its checksum before announcing it. If publishing fails
after creating a draft, inspect that draft and workflow logs before retrying;
the workflow does not overwrite an existing release.

The README's versioned asset link always downloads the file from that release,
not an unreleased edit on main. GitHub's `/releases/latest` shortcuts omit
prereleases, so use `/releases` as the general alpha release destination.

Editors with release checking discover a new published version on their next
eligible check during use, usually within a day of publication. **Check for
updates** bypasses the daily cache after the one-minute cooldown. Older builds
without this checker need to be upgraded manually once. This is polling during
use, not a push notification to closed browsers or idle hosting accounts.

## Proposed in-place installation

A one-file PHP app can replace its own file. That installer is not implemented
in this version. Before adding it, establish a signed release workflow:

1. Keep a release-signing private key outside the repo and distributed app. Embed
   only its public key in the editor. PHP Sodium can verify Ed25519 signatures;
   hosts without the verifier retain the manual update path.
2. Publish a signed manifest covering the release version, supported PHP versions,
   state compatibility, file size, checksum, and a fixed-origin download location.
3. On an authenticated owner action with CSRF protection, download to a temporary
   file, verify the signature and bytes, and check host compatibility. Reject
   downgrades, unexpected local modifications and concurrent update attempts.
4. Preserve a protected backup of the old editor and private state. Use a dedicated
   update lock, ensure no generation/publish is running, and replace the editor
   through a same-directory rename. Invalidate OPcache where supported.
5. Verify the new editor can start, with a tested manual recovery path if it cannot.
   A failed new PHP file cannot be relied on to run its own rollback code. Make
   state migrations recoverable before advertising automatic rollback.

These are requirements for a future installer, not guarantees of the current
notification feature. Customers would still upload one PHP file; release tooling
and signatures would be maintained by the publisher.
