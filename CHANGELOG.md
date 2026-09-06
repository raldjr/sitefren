# Changes

## Repository publication — September 6, 2026

- Publish Alpha 0.1.7 source, download link, screenshot and contributor materials.
- Distribute this version under AGPL-3.0-only, including the full license in the
  standalone PHP file and a visible corresponding-source link in the editor.
- Add issue/PR templates, PHP CI, installation, authentication and licensing docs.


## 0.1.7 — September 6, 2026

- Add exact unique find/replace edits to the structured AI contract for smaller
  follow-up responses. Validate the complete batch before saving, preserve
  history and reject ambiguous or conflicting replacements.
- Stop replaying stored errors as fresh toasts; add persistent authenticated
  dismissal without erasing diagnostics or a newer error.
- Advise generated code to handle unavailable browser storage in preview.


## 0.1.6 — September 5, 2026

- Increase the requested generation allowance from 8,000 to 16,000 output tokens.
- Retain output token usage and requested cap in safe request diagnostics.
- Report suspected output exhaustion when JSON decoding fails at the cap, even
  if the provider labels the response completed. Keep valid at-cap responses.
- Preserve drafts on cutoff; do not repair or publish unfinished code.


## 0.1.5 — September 5, 2026

- Name the single upload sitefren.php. Reuse existing builder-state.php and
  POCKET_* settings; document removal of the older builder.php after upgrading.
- Request a strict edit schema through both providers, with compatible-route
  selection on OpenRouter. Keep existing validation and no automatic retries.
- Record safe response-format diagnoses without retaining generated response
  text. Distinguish invalid JSON, refusal and provider-reported output limits.


## 0.1.4 — September 5, 2026

- Rename the product to Sitefren and label this release Alpha. Keep builder.php,
  existing private storage names, and POCKET_* host settings compatible.

- Create a neutral coming-soon index.html when the editor is first opened over
  HTTPS in a folder without an index/default homepage. No extra upload is needed.
- Preserve existing homepages and links; track the placeholder for safe replacement
  by Publish with existing conflict detection and rollback.
- Apply the same check to older empty installations. The public page includes
  no credentials, setup code, or editor link.
- This is a root homepage, not a server-wide directory-listing restriction.


## 0.1.3 — September 5, 2026

- Keep one clean PHP upload as an explicit project requirement. No new hosting
  runtime dependencies or setup services are added.
- Add Select for AI with click/keyboard selection, a visible target beside the
  prompt, Select parent, Clear, and a structural source reference in AI requests.
- Pause site scripts while selecting, validate bounded selection context, clear
  stale targets, and retain a short target reference in the conversation.
- Place Edit text and Select for AI together above the preview with brief usage
  guidance. Existing direct text edits still need no AI request.
- Format the PHP application, embedded HTML/CSS/JS, and sample site for reading.
  Request clear, unminified generated code with descriptive names and few comments.

Existing private state remains compatible. Replace only `builder.php`.
Targeting quality and generated-code style still depend on the chosen model.

## 0.1.2 — September 5, 2026

- Add Request details with a persistent latest-request ID, UTC timestamps,
  transfer timing, separate provider HTTP status and cURL error, and recorded
  outcome. Distinguish local deadlines, returned HTTP errors, network/TLS errors,
  recorded PHP fatal errors, and interruptions with no established cause.
- Add Edit page in Preview: change existing text, save to draft without AI,
  cancel edits, or restore through History. Preserve source CSS/script links;
  exclude temporary preview helpers from saved files.
- Disable site JavaScript while accepting visual edits and keep the existing
  static-file, authentication, CSRF, and stale-revision boundaries.
- Explain current static-site limits and the requirements for future PHP/database
  application support. No generated PHP or database execution is enabled.

Upgrade by replacing only `builder.php`; keep private state and published files.

## 0.1.1 — September 5, 2026

- Increase the default generation wait from 45 to 180 seconds. Add a 30–300
  second setting and the optional host override `POCKET_AI_TIMEOUT`.
- Send elapsed-time progress heartbeats while PHP waits for the provider.
  Match pending-request expiry to the chosen wait limit, with a recovery margin.
- Show provider model, request-field, and ZDR failures more clearly without
  exposing raw error bodies. Keep the latest error visible beside the chat.
- Add public provider model catalogs with exact-ID selection and manual fallback.
  Catalogs do not verify the customer's key or ZDR eligibility.
- Describe cURL availability and selected settings without claiming the AI
  connection has been tested. Add fixture-based HTTP and browser regression checks.

Existing state is compatible; replace only `builder.php`. Hard host timeouts
still apply. This release adds no durable background job system, automatic
inference retry, or provider retention/routing override.

## 0.1.0

Initial single-file alpha with ownership setup, provider adapters, sample
site, isolated preview, static-file editing, image uploads, history, and local
publishing with conflict checks and recovery.
