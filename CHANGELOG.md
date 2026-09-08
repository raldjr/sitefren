# Changes

## 0.2.5 — September 8, 2026

- Restore side-by-side chat and website editing on desktop, with the original
  370px chat sidebar (320px on smaller desktop windows).
- Keep the current separate Chat/Editor views on phones, including focused
  editing and PWA support. Preserve prompts and code edits across resizing.

## 0.2.4 — September 7, 2026

- Give Chat and Editor their own full workspace on desktop and mobile, with a
  centered composer, quieter header, compact controls and a slimmer hosting ad.
- Keep unsent prompts and source edits when switching views. Open new projects
  in Chat, offer a sample shortcut, and return completed AI changes to Editor.
- Add Continue in Chat for selected elements and move request details and
  sign-out into the More menu. Preserve floating text/image editing and PWA support.

## 0.2.3 — September 7, 2026

- Add separate Website and Chat views on phones, preserving unsent prompts.
  Focus direct editing on the page with larger touch targets, keyboard-aware
  floating controls and safe-area spacing.
- Add home-screen PWA installation with standalone display and embedded icons.
  Serve the manifest and narrowly scoped worker from the single PHP file.
- Show a reconnect screen on offline launch and an offline notice while open.
  Keep editing, publishing and signed upgrades online without caching private
  editor or API responses. Published websites remain outside worker control.

## 0.2.2 — September 7, 2026

- Rename Edit text to Edit and replace the separate formatting section with a
  floating toolbar beside the selected text or image.
- Add image replacement from uploads, alt text, width, height, fit and removal.
  Preserve page styling and relative image paths, including image-only pages.
- Save text and image changes together to the draft, with cancellation and
  unsaved-change protection. Published sites remain independent of the editor.

## 0.2.1 — September 7, 2026

- Add selection-based bold, italic, underline, heading and link controls to direct
  text editing, with the MIT-licensed Squire editor embedded in the single PHP file.
- Preserve page styles, block attributes and original scripts when saving text to
  the draft; reject unsafe links and keep preview editing helpers out of saved HTML.
- Gate releases on browser editing and signed-upgrade tests, then verify public
  update discovery, signatures and download bytes after publishing.
- Include the validated SVG upload and publishing fix in the signed update download.

## 0.2.0 — September 7, 2026

- Add owner-confirmed Update now with Ed25519 release verification, compatibility
  and local modification checks, protected editor/state backups, and atomic replacement.
  Existing versions need one manual upload to gain the installer.
- Sign release manifests locally; publish public signatures with verified releases.
- Match sitefren.com with its smiling-browser logo, orange controls, neutral grays,
  and sans-serif headings. Retain the compact toolbar advertisement and independent help.

## 0.1.10 — September 7, 2026

- Publish tagged releases through GitHub Actions after version, checksum, and
  regression checks, attaching the standalone PHP download and checksums.
- Link the README to the versioned release download, and keep a release/download
  link available in Settings alongside the update check.

- Place a compact hosting advertisement between workspace tabs and preview
  controls, wrapping to its own row on smaller screens. Support optional embedded
  sponsor artwork and keep the independent header help link.

## 0.1.9 — September 7, 2026

- Keep the version badge visible on narrow screens, move the hosting ad above the
  workspace, and offer independent help links on setup/sign-in and in the editor.

- Show a labeled Sheepdog Host advertisement and a voluntary hosting/setup-help
  email link inside the editor, without adding ads to published websites.
- Check published GitHub releases after sign-in, cache the result, and show an
  update link with a manual check in Settings. No in-place installer is included;
  document the signed release workflow needed for that future feature.

- Count initialized production installations through a direct Rybbit event with a
  persistent random ID and app version. Exclude customer URLs and content; disclose
  reporting in setup and documentation, with a host environment opt-out. Keep
  delivery outside project locks, bound its duration, and retry failures daily.

- Use the supplied Sitefren SVG as the embedded browser favicon.
- Accept static SVG uploads through the picker and drag and drop, validating
  elements, attributes, and references before storage and publication. SVG support
  requires PHP DOM/XML; existing image size limits still apply.

## 0.1.8 — September 6, 2026

- Accept one or more images dropped onto the prompt area, with a highlighted
  drop target and visible instructions. Keep the existing file picker available.
- Upload dropped images sequentially using the existing server validation.
  Reject unsupported formats and files over 2 MB before uploading, and prevent
  uploads during other operations or direct text editing.
- Display Raul Aldrete in the editor footer. Add `utm_source=sitefren` to the
  author and Sheepdog Host links, retaining new-tab behavior and link protection.
- Derive the frontend version badge from the application's version constant.
- Add dependency-free Node.js checks for image-drop and file-picker handlers.

Upgrade by replacing only `sitefren.php`; keep private state and published files.
JavaScript checks passed; PHP and full browser checks were not rerun for this release.

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
