# FIELD SHIFT — PAGE PROMPT: AUTOMATION, SCHEDULES, NOTIFICATIONS AND REPORT HISTORY

**Target page:** Automation, schedules, notifications and report history

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
> Source: `Pasted text(10).txt` · original line count: 4798 · source passages assigned to this prompt: 158 lines.

<!-- SOURCE LINES 749-830 BEGIN -->
## 8. Scheduled analysis, automation and report history

This is one of the strongest proposed additions, but it must be designed around the privacy decision rather than bolted on as a timer.

### 8.1 Honest storage architecture

Most farm profiles and the main UI state should remain local by default. However, a backend cannot run an analysis while the browser is closed unless it has access to the required inputs and any relevant stored context. Therefore, **server-side scheduled analysis requires explicit opt-in to send the minimum necessary analysis snapshot and scheduling metadata to the backend**. The user should see exactly what will be sent and why. Do not claim “farm data never leaves your device” if a selected scheduled job needs remote processing.

Recommended choices:
- **Local-only mode:** all data remains on the device; refresh/reanalysis runs only while the app is open.
- **Scheduled analysis mode:** user explicitly enables secure background processing for chosen farms/fields. Only necessary profile inputs, stored practices, relevant history and required evidence references are synced. Offer a clear disable/delete path.

This is a user-facing privacy choice, not a hidden technical fallback. Avoid sending raw free text when its structured, user-confirmed representation is sufficient. Do not send personal details unrelated to agronomic computation.

### 8.2 Schedule options

Offer Manual only, Daily, Every 3 days, Weekly and a custom weekday/time later if needed. Allow schedules per farm (with per-field scope), plus a global pause. Use the farm's configured timezone. Explain any provider minimum interval, data latency or cost constraint before enabling a schedule.

Start with sensible presets rather than dozens of controls. Frequent runs should only be offered if the source data and operational cost make them meaningful; a daily run that repeatedly receives unchanged or delayed imagery may create noise rather than insight.

### 8.3 Enabling automation

The setup flow should:
1. Explain that background analysis needs a secure minimum data snapshot stored by the service.
2. List exactly which fields, practices and history the job needs.
3. Ask: “Should we keep using your saved watering routine until you update it?”
4. Show the saved routine and last-confirmed date; let the farmer confirm, edit or mark unknown.
5. Explain how measured/observed rainfall is incorporated and how forecasts are treated separately.
6. Choose cadence, preferred notification types, and quiet hours.
7. Show a preview of what a scheduled report contains.
8. Require explicit confirmation to enable.

Do not automatically opt users in because they ran Deep Analysis once.

### 8.4 How scheduled runs use rainfall and irrigation

A saved rule such as “skip irrigation when it rains” should affect the planning model only when the required rainfall evidence and timing are available. Forecast rain can be shown separately as a possible future change, but it is not the same as observed rainfall. When a qualifying observed rainfall value arrives, record the source, the rainfall period, the effective-rainfall method and whether it changed the water-balance calculation.

If the rainfall feed is unavailable, contradictory or stale, the system must not infer that irrigation was skipped. It should mark the water assessment as partial/low confidence and tell the user why. Rain falling at a nearby coarse grid cell is not guaranteed to represent the exact field.

### 8.5 Job lifecycle and reliability

Model jobs with explicit states:
`Scheduled → Queued → Running → Completed / Partially completed / Failed / Cancelled`.

Supporting states/metadata include retrying, next retry, source timeout, cancelled-by-user, skipped because inputs are unchanged, data not fresh enough, and model unsupported for this field.

Requirements:
- unique idempotency key for the same scheduled run and input snapshot;
- bounded retries with exponential backoff and provider-aware rate limits;
- per-source timeouts, retry limits and circuit-breaker/degraded status;
- duplicate-run suppression;
- queue and worker logs with correlation IDs;
- notification only after the job has a final meaningful state;
- user-visible “last successful run” and “next scheduled run”;
- allow manual run even when a schedule exists;
- allow pause, resume, change cadence, delete schedule and export/delete report history;
- protect against a failed background run overwriting a valid earlier report.

The schedule service should call the same analysis pipeline as a manual run, with the same versioned calculations. It should not have a simplified copy of the engine that drifts from manual analysis.

### 8.6 Report history and trend timeline

Show dated report entries with overall summary, field status, coverage, most important change and run type. Open any report to view the immutable version. Compare two runs side-by-side.

Chart long-term condition changes only when data definitions and time periods are comparable. Differentiate:
- actual environmental change;
- a newly available observation;
- change in farmer-reported practices;
- change in model/data version;
- difference in coverage or missing values.

Allow export of a report as PDF/printable summary later, plus machine-readable JSON/CSV for Advanced users. Export must include source/methodology metadata and not merely screenshot the charts.

### 8.7 Notification rules

Provide separate toggles for high-priority alerts, completed scheduled reports, important changes, routine reminders and data connection issues. Let users set quiet hours and snooze non-critical notices. Critical warnings should remain visible in the workspace but the notification policy must be transparent.

A missing data source should usually produce a data-quality notice, not a crop-risk alarm. Do not notify about an ordinary score fluctuation that is within expected variability.

---

<!-- SOURCE LINES 749-830 END -->

<!-- SOURCE LINES 2283-2332 BEGIN -->
### 30.10 Report history and comparison

#### Quantified history table and comparison contract

Use a report-history workspace with two clearly separated areas: a chronological history list/table and an explicit comparison selector. Desktop layout: primary list 7–8 columns, selected comparison summary 4–5 columns; if a chart is used, it spans the content width below the selected reports. Each history row includes report date/time, farm/field scope, trigger (manual/scheduled), status (complete/partial/failed), farm and field score where comparable, confidence, report version and an `Open` action. Use 60–72px rows, 14px primary text and 12–13px metadata. Filters include time range, field and run status. Do not build one large card for each historical report if a table is clearer.

Comparison mode requires selecting two immutable reports. The sticky comparison header shows both report IDs/dates, selected farm/field and a `Comparable / Partially comparable / Not comparable` state. Metric delta rows include previous value, current value, delta with units, direction meaning, confidence and reason for comparability. Green cannot universally mean “higher is better”; use metric-specific direction metadata. If engine/model/crop-KB versions differ, either recompute under a common version or label the comparison as method-changed and avoid treating raw score delta as direct improvement. Missing data in one report is a coverage change, not a zero delta.

**Backend:** endpoint receives report IDs and scope; server returns a comparison DTO with explicit comparability flags and metric-level reasons. Historical reports remain immutable. Generate `Why did this change?` categories from actual input/data/source/model-version diffs; label the result as an attribution/explanation rather than causal proof. Loading uses content-shaped skeleton rows; errors preserve the selected report IDs and permit retry.


Report history is a dated list or timeline per farm, with field filters and clear Complete/Partial/Failed states. Every report is immutable after creation except for an added annotation/correction record. A new run creates a new report; it does not rewrite an old one.

Selecting two reports opens a comparison with: farm and field scope differences; scores only where comparable; changed inputs; data source/product/timestamp differences; model/crop database version differences; metric-by-metric changes; new/resolved alerts; recommended actions added/completed/deferred; and missing values introduced by failed sources. If a method changes, show “not directly comparable” or recompute both under a common method when valid source data is available.

Allow export to PDF/CSV after confirming its scope; include a report ID, generated date, source caveats and model version. Do not include more precise location detail than appropriate for the selected report-sharing/privacy setting.

### 30.11 Automation and schedule settings

#### Quantified automation UI and job-state contract

Automation settings use a clear schedule-detail page with a 12-column desktop layout: schedule form/controls occupy 7 columns; right-side `What will be sent/stored` and `Last run` summary occupies 5 columns. Do not make schedule management look like a simple on/off toggle with hidden consequences. A schedule panel uses `--fs-glass-strong` (88% opaque) or a solid surface, 20–24px padding, 16px radius. Inputs are 44px high. Each schedule card shows scope (farm/field), cadence and timezone, next run, last outcome, consent/snapshot status and an explicit enabled/paused/needs-attention label.

Schedule cadence uses allowed choices such as daily, every 3 days, weekly, and custom only where supported. Show the calculated next run timestamp in the farm/workspace timezone. When first enabling, use a stepwise confirmation: (1) select scope/cadence; (2) review the practice snapshot and freshness needs; (3) disclose the exact fields that leave the device and what is stored remotely; (4) define reporting/notifications; (5) confirm consent. Explain that a backend cannot access the browser's localStorage while it is closed unless the required data snapshot has been explicitly transmitted and authenticated.

**Job state machine:** `draft → awaiting_consent → enabled → queued → running → complete|partial|failed → retrying|paused|disabled`. State label, buttons and explanatory text are derived from the job/schedule record. `Pause` stops future schedule occurrences; it does not erase reports. `Disable` requires a confirmation and revokes future runs. `Run now` creates an idempotent manual job for the same scope, with deduplication if a matching job is already running. Each run row includes start/end timestamp, job ID, source outcome summary, retry count and report link. Failed source calls are disclosed in the run result; no green success toast unless the job service returns a successful status.

**Backend contract:** schedule create/update/delete endpoints validate cadence/timezone/scope; scheduler claims due jobs through a durable queue with lease/lock and idempotency key; job processor reads only the consented minimum snapshot; connector adapters have timeouts and bounded retries with exponential backoff and jitter. Store immutable report output and safe structured logs with a correlation ID; never log API keys, original free-text practice if not needed, or sensitive farm coordinates in generic logs. A missing/expired snapshot moves the schedule to `needs sync` or `suspended`; it must not analyze stale browser values as though current. Rainfall observations never prove irrigation did not occur.

Responsive layouts stack consent and schedule summary; destructive disable/revoke actions require deliberate confirmation and clearly describe effect. Accessible screen-reader announcements report queued/running/completed/failed status.


Automation setup uses a clearly separated flow:

1. Choose farm and fields.
2. Choose frequency: daily, every 3 days, weekly or a custom supported schedule. Explain that the schedule is a re-evaluation frequency, not a promise that every source publishes new observations at that cadence.
3. Choose preferred run window and timezone derived from farm/user settings. Handle daylight-saving transitions correctly where relevant.
4. Review which inputs will be sent to the backend for the scheduled job, why they are required, how long they are retained, where deletion applies and what stays local.
5. Confirm the last known irrigation/management routine. Ask whether it remains valid. If unchanged, record confirmation timestamp. If changed, capture new inputs and preserve the previous value as historical.
6. Configure material-change notifications, ordinary report-ready notices and repeated-alert suppression.
7. Review and explicitly enable schedule.

**Scheduled run logic:** a backend scheduler enqueues jobs only for enabled and consented schedules. It loads the minimum permitted snapshot; refreshes eligible sources; skips data-dependent recomputation if relevant inputs/data have not changed and policy permits; otherwise runs the analysis; stores source statuses and report; and sends notification only according to user settings. If cloud input is missing or consent expired, do not improvise with local data the backend cannot read—mark the job as waiting for updated device sync or suspended and explain it.

**Rainfall rule:** only use newly available rainfall observations/reanalysis from an appropriate source and mark their type/date. Forecast rain may influence forward-looking planning but is not recorded as observed rainfall. Rainfall does not prove irrigation did not happen. Unless the farmer records an irrigation event or a supported sensor establishes it, irrigation remains unknown/reported routine; it is not automatically subtracted from the record based only on rainfall.

**Schedule lifecycle:** Draft → Awaiting consent → Enabled → Queued → Running → Complete/Partial/Failed → Retrying (if eligible) → Paused/Suspended/Disabled. Preserve prior runs. Include `Run now`, `Pause`, `Resume`, `Change schedule`, `View last report` and `Disable` actions. Confirm disabling and explain that existing reports remain. `Run now` must respect per-user/field rate limits and show whether it queues or executes immediately.

**Idempotency and duplicates:** one logical schedule occurrence generates at most one final report per scope and input snapshot unless user explicitly reruns. Retries reuse a job ID/idempotency key. Concurrent runs for the same farm/field/window are de-duplicated or safely serialized.

<!-- SOURCE LINES 2283-2332 END -->

<!-- SOURCE LINES 4305-4330 BEGIN -->
# PAGE 8 — AUTOMATION, SCHEDULES AND REPORT HISTORY

## 61. Schedule setup

Reach it from Farm Intelligence `Manage schedule` and Settings > Automation. Schedule is tied to farm/scope/field set, frequency (daily, every 3 days, weekly and custom if implemented), time zone, preferred time, practices snapshot, data refresh options and notification preferences. Background execution requires a backend job system; a browser timer cannot run while the browser is closed.

Before opt-in, disclose the exact information that leaves local storage (e.g., selected coordinates/field geometry as needed, soil/crop inputs, management routines, and analysis context). Make remote processing explicitly optional and off by default. Offer a local/manual-only alternative when the user declines. Ask whether a saved irrigation routine is still typical and store the confirmation date; a routine remains an assumption, not a record of actual watering.

## 62. Rainfall and watering handling

Separate forecast precipitation from observed/historical precipitation and from modelled effective rainfall. Each has source, resolution and time period. When observed rain is available, the water model may incorporate it under its declared rules; it must not conclude that the farmer didn't irrigate. Actual irrigation events stay separate from routines. If old routine data needs reconfirmation, mark `Needs confirmation` and explain its impact instead of silently treating it as current fact.

## 63. Background job lifecycle

Each job has stable job ID, farm/scope, schedule ID, requested/start/end time, current stage, attempt count, status and resulting report ID. States: queued, running, complete, partial, failed, retrying, cancelled, skipped. Idempotency prevents duplicates during retries. Store stage logs with source outcomes, fallback/skipped reasons, error class and duration; don't log credentials or sensitive raw fields. Retry transient failures with bounded exponential backoff; don't retry invalid inputs forever. Avoid duplicate heavy jobs for same farm/scope.

A job is complete only when pipeline and persistence actually complete. If one optional source fails, continue only if a meaningful report remains and clearly mark partial. If a required source fails, mark failed/blocked with a useful error. UI progress is event-driven, not a timer.

## 64. Automation dashboard and consent lifecycle

Schedule list shows farm, scope, frequency/timezone, next run, last run, status, consent and actions Pause/Resume/Run now/Edit/History/Delete. `Run now` opens existing active job instead of creating a duplicate. Detail shows last runs, source stage timeline and failed/skipped reasons. Notification settings do not alter the underlying alert. Deduplicate recurring instances of the same unresolved risk.

Pause stops future runs but retains history. Delete removes the schedule. Revoke background processing stops future remote jobs and deletes or queues deletion of its server snapshot under a stated retention rule. Delete farm also handles related schedules and remote copy. Do not show `Deleted` until server acknowledges completion; pending delete has an explicit state. Authenticate/authorize every job; never trust a client-supplied user ID alone. Test time zone/DST, retry duplication, partial source failure, paused queued job, running-job deletion, consent revocation, cross-user access and privacy deletion.

---

<!-- SOURCE LINES 4305-4330 END -->
