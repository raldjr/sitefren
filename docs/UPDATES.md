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

The footer links to the official release page when a newer release exists. The
owner backs up private state and published files, then replaces only `sitefren.php`
through their hosting file manager. An unavailable or empty feed is reported
explicitly; neither is presented as proof that the installation is up to date.

## Publishing a version

Follow CONTRIBUTING.md's release checks, update the shipped version, and publish
a GitHub Release with a supported matching version tag, release notes, the
standalone `sitefren.php`, and checksums. Publish prereleases explicitly while the
app remains alpha. The ten most recent release entries must include the currently
recommended version. The feed was reachable but empty on September 7, 2026.

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
