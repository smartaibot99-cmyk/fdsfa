# FIELD SHIFT — PAGE PROMPT: MY FARMS — PORTFOLIO AND FIELD JOURNAL

**Target page:** My Farms — portfolio and field journal

**Purpose of this prompt:** build or rebuild only this page, using the shared foundation as mandatory context. All page-specific source material from v8 assigned to this page is reproduced below without rewriting or summarising it. The prompt deliberately preserves overlapping requirements from the two expanded v8 page-contract sections so that no page-specific instruction is lost.

**Page-specific implementation objective:** deliver a production-quality page whose visual design, content hierarchy, images/3D, interactions, state model, data/calculation logic, APIs, persistence, privacy implications, accessibility and tests are all complete. When a feature belongs to another page, link to that feature rather than implementing a duplicate here.


## How to use this prompt

1. Load and retain `00_GLOBAL_FOUNDATION_AND_BUILD_RULES.md` as the project-wide specification before using any page prompt. It contains the shared technical, scientific, privacy, design-system, source-audit, backend, accessibility, testing and release requirements.
2. Use this file for **one target page/route only**. Do not redesign, rewrite, reorganise or change the behaviour of other pages as part of this task.
3. First inspect the actual current codebase and identify the existing route, components, data stores, API/service dependencies and cross-links for this page. The supplied v8 source audit is mandatory context; verify its findings against the real source rather than assuming they remain unchanged.
4. Preserve all valid functionality and data. Repair misleading, simulated or defective behaviour where the v8 requirements demand it. Do not silently remove functionality.
5. Implement the page's purpose, composition, precise UI, interactions, responsive behaviour, state transitions, calculations, data provenance, backend integration, persistence and acceptance tests from the source material below. Do not compress this into a generic visual reskin.
6. Shared components may be consumed, but do not change their global implementation unless a defect blocks this page. If a shared change is required, keep it backward-compatible and record it as a dependency; do not use this page task to redesign other routes.
7. Do not claim a feature is complete because a mock-up looks correct. Test real interactions, data contracts, empty/loading/partial/stale/error states, keyboard access, mobile behaviour and cross-page consistency.
8. If the page prompt conflicts with the Global Foundation, use the stricter/more specific v8 rule and record the conflict. The original source excerpts below are retained verbatim.

## Page-only execution boundary

- **Allowed scope:** this page, its page-specific components, its page-specific state, and strictly necessary page integration.
- **Not allowed:** unrelated changes to other navigation pages, global styling rewrites, broad refactors, changing canonical domain semantics, removing records, replacing the project's stack, or introducing a second implementation of an existing feature.
- Maintain the existing route path and navigation label unless the global architecture explicitly requires a documented route correction.
- Before editing, list the exact files/components expected to change and why. After editing, report the actual changed files and confirm the other pages were not redesigned.
- If this page reveals a missing shared service or data model, implement only a compatible adapter or mark the dependency `blocked`; do not fake the response or bypass the canonical service.


## Original v8 source material — retained verbatim
> Source: `Pasted text(10).txt` · original line count: 4798 · source passages assigned to this prompt: 147 lines.

<!-- SOURCE LINES 463-512 BEGIN -->
## 5. My Farms: the farm and field workspace

This is the source of truth for managing farm boundaries and field-specific information.

### 5.1 Portfolio overview

- Search, sort and filter farms.
- Add farm, duplicate a configuration when appropriate, rename, archive/delete with confirmation, and export.
- Desktop table/list view with farm name, location, area, number of fields, status, active crop/plan, last analysis, data freshness and alert count.
- Responsive compact list on mobile; do not force an unreadable wide table.
- Advanced Mode may add total managed area and a portfolio summary, but aggregate scores must disclose how they were calculated and how missing fields were treated.
- Avoid invented demo farms in a real account. Demo mode, if present, must be explicitly labelled.

### 5.2 Add Farm flow

A guided sequence: name the farm; locate it on a map or enter coordinates; create or import a boundary; choose whether to add fields now or later; review area/location; choose which information is known; save. Save progress as the user goes.

Use a map provider that does not require a secret API key in the browser if a suitable open option is chosen. Explain mapping service terms, attribution and usage limits. Geolocation requires explicit browser permission and should not be the only way to enter a location.

### 5.3 Farm map and boundaries

Add a map where the user can draw, edit, name and save multiple field polygons. Support undo/redo while editing, vertex movement, polygon deletion with confirmation, and an explicit Save/Cancel edit state. Calculate area from a geodesically appropriate method and show the unit. Warn about self-intersecting polygons, duplicate/overlapping fields and implausible area, but let the user review rather than silently “fix” boundaries.

Display data-coverage overlays and sampled pixels only when they help explain resolution limits. A small field must not be presented as having field-specific satellite measurements when the underlying grid is much larger.

### 5.4 Farm detail layout

Use a stable left or secondary navigation on desktop and a clear tab/menu system on smaller screens. Recommended sections:

- **Overview / Farm Tracker:** expanded version of the Home status.
- **Fields & Map:** list and boundary editor, field status and field comparison.
- **Rotation Plan:** the selected field's active plan and alternatives.
- **Soil & Land:** texture, profile, slope, pH, organic matter, drainage and lab observations where available.
- **Water Intelligence:** supply, demand, balance, assumptions and irrigation records.
- **Weather & Climate:** recent conditions, historical baseline and supported seasonal features.
- **Vegetation & Field Change:** actual satellite-derived indicators only when connected and quality-screened.
- **Actions & Observations:** tasks, scouting notes, irrigation/fertiliser events and completion history.
- **Past Analyses:** dated reports and comparisons.
- **Farm Settings:** farm profile, data permissions and management settings.

Do not create a huge undifferentiated page of identical cards. Each section needs a clear purpose, headline, useful visual hierarchy and expansion for deeper details.

### 5.5 Field-level intelligence

Each field has an independent profile, crop history, rotation, condition indicators, report history and actions. Show a comparison table for fields in the same farm, with consistent units and explicit unavailable cells. Add filters such as “fields with active alerts,” “rotation review due,” or “missing soil information.”

Farm-level reports can be generated across all fields, but the output must show each field's score/status and must not let one healthy area hide a severe issue in a smaller area.

---

<!-- SOURCE LINES 463-512 END -->

<!-- SOURCE LINES 1169-1181 BEGIN -->
### 15.4 Decision Journal / Plan Change Log

#### UI/UX + audit event contract — Decision Journal / Plan Change Log

Display this in a `Plan history` tab and as a compact change strip on the rotation detail page. Desktop uses a chronological table/timeline with 60–72px row height; columns include date, action, prior plan/version, new plan/version, actor and optional reason. Use 14–15px action text and 12–13px metadata. Each row opens a detail drawer showing the old/new values as a diff: removed values left/muted, added values right/selected tint; never rely on color alone. For images, only use crop thumbnails that correspond to the actual old/new plan.

When the farmer chooses a plan, explicitly record `selected`, `rejected`, `deferred` or `replaced` as a decision event; capture an optional reason (water, cost, equipment, market, management preference, other). The selected plan version remains separate from the model's `recommendedCandidateId`. Do not silently make the highest-ranked rotation active after a rerun. Any application of changed inputs requires explicit review and creates a versioned profile/plan update.

Persist `PlanDecisionEvent` with actor, timestamp, farmId, fieldId, candidate ID, prior/new active version, reason and source report ID. This record is append-only; corrections create superseding events. Do not encode decisions as free text inside the mutable Farm row. Event history respects access controls and data deletion policy. Tests verify that a new run, selection, rejection, and changed plan have correct stable references and never rewrite historical score/ranking data.


When choosing a rotation, capture the selected plan/version, date and optional farmer reason. When rejecting the top recommendation, ask optionally whether the issue was cost, market, equipment, water, personal preference or unavailable crop. Use this context to interpret future decision support, but don't alter scientifically grounded crop constraints without an explicit profile update.

<!-- SOURCE LINES 1169-1181 END -->

<!-- SOURCE LINES 1271-1283 BEGIN -->
### 15.12 Offline-tolerant field mode

#### UI/UX + local-sync state contract — Offline-Tolerant Mode

Show a compact connectivity badge in the global shell only when network state is genuinely detected; labels are `Online`, `Offline`, `Changes pending`, `Sync issue`. It must not be a decorative pulsing dot. Offline mode presents cached/available records with last-synced timestamps; use a subtle banner that explains which operations are unavailable. The local draft/editor remains usable for supported tasks, with an explicit queue count in the header and a sync-detail panel.

Use a local outbox pattern: each queued change has stable operation ID, entity ID, base version, payload schema version, created timestamp and conflict policy. Sync is idempotent and reports per-operation `pending`, `syncing`, `synced`, `conflict`, or `failed`. If the server has a newer entity version, do not blind-overwrite; show a conflict comparison. Do not queue unsupported jobs (like a true server-side scheduled run) as though they ran offline. Satellite imagery may be stale/cached, with a visible data-time label; no live map layer is implied when offline.

The local database must tolerate browser storage quota/error, and provide export/recovery guidance where practical. Background sync must run only if the browser/platform supports it; otherwise sync when the app becomes online/foregrounded. Tests cover offline create/update, duplicate sync replay, browser reload, local quota failure, and version conflict.


Later, cache the active plan, calendar, tasks and basic field records for intermittent connectivity. Queue farmer observations for sync when online, showing pending/synced/failed clearly. Keep high-cost, live satellite processing and cloud scheduled analysis separate from offline data entry.

<!-- SOURCE LINES 1271-1283 END -->

<!-- SOURCE LINES 2089-2113 BEGIN -->
### 30.4 My Farms portfolio page

#### Quantified visual and component contract — My Farms

Use a portfolio workspace, not a set of identical oversized cards. At 1440px the content shell uses 36–40px gutters. Page heading and subtitle sit at top left; `Search farms…`, view switch if implemented, and `+ Add farm` align on the top-right baseline. Beneath them, use a compact portfolio-summary strip (only values supported by saved farms) with 3–4 metrics such as total mapped area, farms, fields and active alerts; each metric is a label/value pair, not a separate giant tile. Then a full-width data table/list with columns `Farm / Location`, `Mapped area`, `Fields`, `Current plan`, `Status`, `Last assessment`, and row actions. Use 56–64px row height minimum, 12–14px column labels, 14–15px row text, right-aligned numeric columns and tabular numerals. Use real thumbnail imagery only if a reliable farm image or map snapshot exists; don't use the same stock image to imply different farms are real. A subtle selected-row tint (`rgba(39,199,178,.08)`) is sufficient; table container uses solid `--fs-surface-solid` or `--fs-glass-strong` depending on backdrop.

Clicking a row's main area opens the selected farm detail workspace; the overflow menu contains `Rename`, `Manage fields`, `Open map`, `Run Deep Analysis` (when valid), `Archive` or `Delete` with explicit confirmation. Each action has its own domain handler; no menu item is decorative. Search filters only the user's accessible farm list and includes no-match/reset states. Sort controls show active field/direction and are keyboard operable. Multi-select/bulk actions are not included unless their consequences and confirm dialog are specified.

Advanced mode may add portfolio rollups, risk distribution and comparative table columns, but averages are permitted only across comparable fields with the same metric meaning, time range, unit, depth/source semantics and method version. If non-comparable, show per-field values and coverage instead of one misleading average. Status is derived from the shared assessment object, not a separate hard-coded badge.

**Data and state:** empty farms → onboarding CTA; farms with no analysis → `Analysis not run`; stale report → `Needs refresh`; partial source data → `Partial`; complete fresh result → status derived from rules. Rename uses optimistic UI only if rollback is implemented and the persistence write is confirmed. Delete uses a confirmation dialog with farm name and downstream-data consequences; if backend schedules exist, deletion/archival requires schedule suspension and policy-defined report handling. Local-only mode must state deletion only clears this browser's data; cross-device persistence must never be implied.

Responsive: desktop table; tablet hides lower-priority columns behind a `Details` disclosure; mobile uses compact farm rows with a 2-line identity block and clear status, with row actions in a labelled menu. Do not force whole-page horizontal scrolling.


**Page hierarchy:** page title + subtitle, search, status filters, sort, list/table toggle if useful, “Add farm” primary action, then farm table/list. Do not surround the table with multiple nested cards.

Desktop columns: farm thumbnail/mark, farm name and location, total boundary area and number of fields, current crop-plan state, farm status, last analysis with freshness, active alert count, and a row action menu. Values are sourced from records; avoid hardcoded sample farms in a real account. On mobile, each farm becomes a compact stacked row with status and key actions; it must not overflow horizontally.

**Actions:** open farm; rename; edit farm information; manage fields/map; duplicate configuration only with a clear explanation that data/history are not duplicated unless selected; archive; delete with consequence summary and confirmation; export. Search must search names and location labels. Sorting/filtering must operate on actual records.

**Click behaviour:** clicking a farm row opens that farm's Overview, not a generic page. The active/selected farm is reflected in global state. Deletion checks linked fields/plans/reports; explain what will be removed and whether records in cloud/backups are also deleted. If deletion is irreversible, do not claim it is undoable.

Advanced-only portfolio information can include total managed area, active farms, fields by status, rotation reviews due and alerts. Do not compute an “average health” figure from incompatible or missing component metrics without a documented aggregation model.

<!-- SOURCE LINES 2089-2113 END -->

<!-- SOURCE LINES 2986-2989 BEGIN -->
### 40.3 My Farms portfolio modes

Simple mode lists farm name, location, area, current crop/rotation state and Good/Needs Attention/Alert label. Advanced adds total managed area, active farm count, field/rotation review count, alerts and portfolio metrics only when scientifically comparable. An average soil-health figure is allowed only if the underlying metrics have the same definition, depth, time basis and source/model version; otherwise show per-field distributions and coverage instead.

<!-- SOURCE LINES 2986-2989 END -->

<!-- SOURCE LINES 3994-4035 BEGIN -->
# PAGE 2 — MY FARMS: PORTFOLIO AND FARM/FIELD OWNERSHIP

## 26. Purpose and portfolio layout

My Farms is the management workspace for the user's private farms and fields. It answers: what farms exist, which fields belong to each, which need attention, and how to open the right record. It is not the public regional network. Private fields never become publicly visible just because they appear here.

Under the global header place a page heading `My Farms` and supporting text `Manage farms and fields, review their status, and open detailed records.` Align primary `Add farm` and a search field at the right. Below, put a compact toolbar for search, status, region and sorting by name, mapped area, status or last update. Filters combine predictably and `Clear filters` only resets controls, never data.

A portfolio summary row may show actual counts for farms, fields, total mapped field area and fields needing attention. Advanced mode may expose portfolio health/coverage only if the component method is sound and all records are comparable. Never average unrelated values without explaining basis.

## 27. Farm table and row actions

Use a wide table at desktop because each farm shares repeated attributes. Columns:
1. Farm identity: small realistic image, name and region/city.
2. Area: mapped field area and unit, distinct from any user-entered whole-farm area.
3. Fields: count.
4. Active crop/plan: the actually selected active plan or `No active plan`; do not assume the highest-ranked candidate is currently active.
5. Status: Good / Needs attention / Alert / Not assessed with semantic icon and text.
6. Last assessment: timestamp and stale state.
7. Actions: open details and an overflow menu.

Rows are about 64–84 px tall, with restrained dividers and a selected/hover state. Don't wrap all cells into separate cards or add thick neon borders. At narrow widths transform rows into readable stacks with the same fields instead of shrinking the desktop table until it overlaps. Clicking a row opens farm details; buttons inside rows must not also trigger row navigation.

Search works across farm names, region, city and field names. Zero matches show the applied filters and `Clear filters`. The row menu can rename, edit profile, export, duplicate a profile as a new record when justified, or delete. Rename validates the string and synchronizes every label. Edit profile opens review/edit mode, not a blank wizard. Delete requires explicit confirmation naming the farm and explaining affected local records, dependent reports, scheduled backend snapshots and what will be deleted. A deleted active farm routes to a remaining farm or first-run state and clears invalid context/history IDs.

## 28. Add farm and farm/field entities

`Add farm` creates a blank unique draft, never clones prior values. Save a farm shell so setup can be resumed. Farm and field are separate entities:
- Farm: name, general location, timezone, preferences, privacy/sharing state and collection of fields.
- Field: stable ID, farm ID, geometry/version, mapped area, soil/water/management profile, crop history, current plan, observations and reports.
- Optional management zones are allowed only where actual geometry and data resolution justify them.

Do not treat one farm as one undifferentiated polygon if the farmer manages multiple fields. If a farm has one field, opening it may default the field selection; the record distinction still remains. Never keep important field data only in transient UI state.

## 29. Portfolio states and tests

Support no farms, draft farms, multiple farms, large lists, no search results, failed saves, deleted active farm, missing location, unmapped field, no analysis, stale analysis and mixed statuses. Total mapped area comes from valid geometries with units and an appropriate area method, not raw degrees. If field geometries may overlap, validate before summing. Label the difference between declared farm acreage and summed mapped fields.

Test selection persistence, search and filter semantics, active farm after deletion, route restoration, data isolation by user/workspace, accessible table navigation and empty states.

---

<!-- SOURCE LINES 3994-4035 END -->
