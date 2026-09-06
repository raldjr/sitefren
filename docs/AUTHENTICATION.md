# Authentication and credentials

Sitefren is a single-owner editor, not a multi-user account service. Its server
functions and request routes live in [sitefren.php](../sitefren.php).

## Components and flow

1. `ps_new_state()` generates a filesystem-only ownership code using
   `random_bytes(16)`. A host can provide POCKET_SETUP_CODE or a precomputed
   POCKET_PASSWORD_HASH instead.
2. The browser requests `?action=state`. `ps_public()` exposes setup status and
   a session CSRF token, but not the setup secret, password hash or provider key.
3. Setup requires the ownership code and a password of 12–72 bytes. The server
   stores `password_hash(..., PASSWORD_DEFAULT)` and clears the setup code.
4. Later login uses `password_verify()`. Ten failed attempts in an address-based
   ten-minute window trigger throttling. Successful login rotates the session ID
   and CSRF token and saves the project auth_version in the server-side session.
5. `ps_authorized()` compares that version and enforces a two-hour idle timeout.
   State-changing requests require POST, JSON and `X-CSRF-Token`. Revision checks
   protect saved edits against concurrent updates; they are separate from auth.
6. Logout removes session authorization and rotates the session ID and CSRF token.

## Tokens and storage

- PHP session cookies are HttpOnly, SameSite=Strict and Secure on production
  HTTPS, scoped to the editor folder. Strict session mode is enabled.
- The CSRF token is random and intentionally readable by the authenticated UI
  (also available during setup/login). It is not a provider API key.
- Provider keys are recoverable plaintext in guarded private state, or read from
  host environment settings. They are not encrypted at rest by Sitefren.
- `ps_save()` writes owner-only state with a PHP guard that returns 404 and exits.
  Prefer POCKET_STATE_PATH outside document roots. PHP execution and correct
  hosting file permissions are essential; protect backups equally.
- `ps_provider_http()` sends the selected key as an HTTPS Bearer header only to
  fixed provider endpoints, verifies TLS and does not follow redirects. Public
  catalog requests omit it. Model prompts, UI state and diagnostics exclude it.
- Host environment settings override saved provider settings. Never provision
  the same master billing secret to customer-owned hosting accounts.

## Boundaries

The preview runs in an opaque sandbox. Published JavaScript shares the site's
origin and can act with the authority of a signed-in editor visitor; CSRF is not
an XSS defense. There is no MFA, OAuth, hosting SSO or email password-reset flow.
See [SECURITY.md](../SECURITY.md) and the core/HTTP/browser tests for the implemented checks.
