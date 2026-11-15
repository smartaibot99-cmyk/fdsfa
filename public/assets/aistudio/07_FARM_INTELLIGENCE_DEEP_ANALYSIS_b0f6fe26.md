# FIELD SHIFT — PAGE PROMPT: FARM INTELLIGENCE — DEEP ANALYSIS, FIELD FINDINGS AND EVIDENCE-LINKED ACTIONS

**Target page:** Farm Intelligence — Deep Analysis, field findings and evidence-linked actions

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
> Source: `Pasted text(10).txt` · original line count: 4798 · source passages assigned to this prompt: 323 lines.

<!-- SOURCE LINES 628-748 BEGIN -->
## 7. Farm Intelligence: the new Deep Analysis workspace

Deep Analysis is an additional monitoring and diagnostic feature—not a replacement for crop-rotation planning and not the same thing as a What-If simulation.

**Main question:** “How is this farm doing now, what has changed, what could become a problem, and what should I consider doing?”

### 7.1 Workspace layout

Top area:
- `Farm Intelligence` heading and farm selector;
- selected date/range, last run status and Refresh Data button;
- primary **Run Deep Analysis** action;
- automation status such as “Every 3 days · next run …” with edit/pause controls;
- a calm, compact farm-wide condition summary;
- per-field score/status comparison immediately visible.

Below:
1. Farm-wide summary and assessment coverage.
2. Field-by-field assessment table or landscape of field rows.
3. Key changes since the previous comparable assessment.
4. Active issues and emerging risks.
5. Strengths and favourable conditions.
6. Recommended improvements/actions, prioritised by benefit, urgency and evidence strength.
7. Supporting water, soil, weather, vegetation and rotation findings.
8. Evidence, calculations and source coverage drawer.
9. Historical report timeline.

Use a split view or expandable sections so a farmer can scan the summary first and inspect details without leaving the report context.

### 7.2 Run Deep Analysis workflow

**Stage A — Confirm scope.** Select the farm and all fields or a chosen subset. Identify any changes to boundaries, field profile, crop plan or farmer practices since the last run.

**Stage B — Refresh evidence.** Fetch the relevant data from configured sources in parallel with timeouts and retries. Record timestamps and quality flags. Do not fetch an entire dataset when a relevant grid cell and time window suffice.

**Stage C — Validate inputs.** Check units, missing values, implausible values, stale records, source conflicts, pixel/field-size mismatches and whether a metric is scientifically supportable. Identify fields for which evidence coverage is too weak.

**Stage D — Confirm management practices.** Ask about any routine whose freshness materially affects the assessment, especially irrigation. Present the saved practice and last-confirmed time. Allow “Still accurate,” “Update it,” and “Not sure.” A report should disclose if it relies on an old routine.

**Stage E — Run supported models.** Recalculate only the models whose prerequisites are present. Possible domains include recent weather anomaly, crop-stage climate exposure, water balance, soil/terrain context, vegetation trend, crop rotation risk and farm action status. Do not show model outputs whose necessary inputs are missing.

**Stage F — Generate report.** Assemble per-field results and a farm summary, with the leading changes and recommended actions grounded in the outputs. AI may improve the clarity of the explanation, but the deterministic engine must supply the facts, values, eligible actions and evidence that the AI is allowed to discuss.

**Stage G — Save immutable run record.** Capture input snapshot, evidence timestamps, model versions, source coverage, per-field scores, farm summary, findings, action recommendations, warnings and job status.

**Stage H — Present and notify.** Show the completed report with “What changed,” “Why it matters,” “Suggested next steps” and “Evidence.” Notify only according to the user's preferences and the severity/novelty of findings.

### 7.3 Farmer routine input using natural language

Allow statements such as “I usually irrigate every three days, early in the morning, but I skip a cycle when it rains.” Do not treat this free text as a confirmed precise measurement.

The parser should convert it into a typed draft, for example:
- activity: irrigation;
- recurrence: every three days;
- time preference: early morning;
- rain-skip condition: yes;
- amount: unknown unless stated;
- affected field: selected field(s);
- effective date and last-confirmed date;
- source statement and parser confidence.

Then show the interpreted fields for farmer confirmation. If quantity, area, duration, irrigation method or units are required for a particular water calculation, ask for them or downgrade that result. An interval-only routine cannot establish the number of millimetres applied.

Store both the reusable routine and actual irrigation events separately. A routine is a plan/expectation; it is not evidence that irrigation happened. An actual event can update the water ledger once the farmer confirms it.

### 7.4 Farm-wide and per-field scores

Display **both** as requested, with strict safeguards:
- Each field gets its own condition summary and any supported component scores.
- The farm-wide summary shows an area-weighted composite only when comparable field scores and sufficient coverage exist.
- Always show the distribution of field results, number of fields assessed, fields with active alerts, and fields with missing/weak data.
- A severe issue in one field remains visible even if the whole-farm average is good.
- Do not average unlike measures together without a defined, validated method. Soil texture, NDVI, water balance, risk probability and confidence are different things.
- Use “Farm Condition Index” as a provisional label only after its formula and validation protocol are approved. Before then, present a farm summary status plus separate metrics instead of a false-precision score.
- Define thresholds, component weights, missing-data treatment, confidence and model versions. A score change must be attributed to changed evidence, changed farmer inputs, changed model version, or a combination.

### 7.5 Report sections

Every report should contain:
1. Assessment date, trigger and coverage status.
2. Farm-wide summary and per-field status.
3. Overall index (only when valid), component scores and evidence confidence.
4. Strengths / favourable signals.
5. Current concerns and developing risks.
6. Significant changes since last comparable report.
7. Practical recommendations with timing and evidence.
8. Data gaps and what would improve confidence.
9. Source table and retrieval times.
10. Calculation/methodology disclosure and model versions.
11. Farmer practices used, last-confirmed dates and parsed values.
12. Actions that were carried forward, completed, deferred or rejected.

Use neutral language. Example: “The vegetation index is below the field's usual value for this period. This can reflect several causes, including growth stage or cloud/observation issues; inspect the field before concluding that water stress is responsible.”

### 7.6 New feature: evidence-linked recommendations

Every recommendation opens an evidence panel with:
- the observation or calculation behind it;
- source and valid/observed date;
- comparison baseline and period;
- calculation or trigger rule;
- confidence and key uncertainty;
- expected relevance to the specific crop stage/field;
- what the farmer can check in the field to confirm or rule it out.

This provides a clear chain from data → interpretation → recommendation. If the evidence changes, the recommendation should be re-evaluated instead of remaining active by inertia.

### 7.7 New feature: “Why did the assessment change?”

Compare two dated assessments and classify the difference:
- changed weather/earth-observation evidence;
- changed farmer-entered practice or crop information;
- new field boundary or profile;
- revised source data/version;
- changed engine/crop knowledge version;
- incomplete or non-comparable data.

Show numeric deltas only when the underlying values and periods are comparable. If a changed algorithm makes direct comparisons invalid, disclose this and avoid misleading arrows.

---

<!-- SOURCE LINES 628-748 END -->

<!-- SOURCE LINES 1126-1155 BEGIN -->
## 15. Additional original features that make the platform more connected

The following are new proposals built from the principles in the attachment. They should be prioritised by value and dependencies, not all built at once.

### 15.1 Field Evidence Timeline

#### UI/UX + state + data contract — Field Evidence Timeline

Place the timeline as a dedicated `History` subview in Farm/Field Detail and as an expandable section in Deep Analysis, not as a duplicate global feed. Desktop composition: primary chronological timeline/list occupies 7 of 12 columns; selected-event evidence/detail panel occupies 5 columns. On mobile use a single-column vertical timeline with a sticky date/filter control. Use a solid/strong surface (`--fs-glass-strong`, 88% opaque if over the hero image), 16px radius, 20px padding; row/event padding 12–16px; date labels 12–13px; event title 14–15px; evidence summary 13–14px. Show a thin vertical timeline rail and small 8px event nodes; line/icon shape distinguishes event categories in addition to colour. Avoid a large separate card for every event.

Each entry renders a concise verb/title, timestamp in field timezone, farm/field label, event/source type (`remote sensing`, `weather/reanalysis`, `farmer reported`, `calculated`, `plan change`, `alert`, `analysis`, `task`), status and linked entity. Filters are time window, event type and crop/field; selected dates propagate to the map/date series only if the target source has a compatible interval. The event click opens its source report, task or journal entry with exact IDs. A “view as known then” action, if implemented, must reconstruct the snapshot available at that time—not display today's source values beneath an old event.

Use an append-only `EvidenceTimelineEvent` projection from canonical records; do not invent separate shadow records for the same task/report. Sort by event time then stable ID; retain both `observedAt`/`effectiveAt` and `recordedAt` where late-entry events are possible. Never infer an event date from retrieval time. API/query is scoped by farmId + fieldId + range + category and paginated. Cache key includes those filters. Empty, partial and source-unavailable states explain that historical records may be incomplete. Tests prove a completed task, new report, edited geometry and farmer observation each appear once with correct timestamp/context.


A unified timeline combining observations, farmer-entered events, alerts, analyses, plan changes and completed actions for one field. Use event type and source labels; filter by season or data category. It answers “what happened to this field, and what did Field Shift know at the time?” This connects satellite history, Deep Analysis, irrigation records, alerts and crop changes.

### 15.2 Data Gap Coach

#### UI/UX + prioritisation + calculation contract — Data Gap Coach

Render this as a contextual callout adjacent to the metric/assessment affected by missing evidence, and a compact prioritized checklist in the Data & Trust Centre. It must not become a giant generic card occupying the Home hero. Use `--fs-glass-default` (78% opaque) for a small image-backed callout, 16px radius and 16px padding. The hierarchy is: `What is missing` (15–16px semibold), `Why it matters` (13–14px), `Suggested next step` (13–14px), and one CTA. Use a neutral info icon with amber only when it denotes reduced evidence coverage; do not style missing data as a crop-health failure.

Prioritise gaps by decision relevance, expected usefulness, whether the farmer can realistically provide the data, and which current result depends on it. Example actions: confirm soil texture, enter pH from a named/date-stamped test, record crop history, confirm irrigation routine or wait for the next usable satellite composite. Each suggestion names the affected metric/decision and shows the dependency chain. Do not promise “confidence +12%” unless the confidence model estimates and validates that exact delta; otherwise say qualitatively what the input improves.

Model each recommendation as `DataGapRecommendation` with `gapKey`, `entityId`, `affectedMetricKeys[]`, severity/priority rationale, required input schema, evidence gap and route target. Dismissing one item suppresses only that gap version; if the dependency changes or the missing input becomes available, recompute the checklist. Clicking CTA opens the correct form with the missing field focused and returns to the prior page when saved/cancelled. Data-gap calculations are derived from the metric registry and analysis input snapshot, not a static checklist. Tests confirm that entering data resolves only its relevant gaps and does not automatically assert that the result became correct.


Instead of only showing that confidence is low, make it actionable. Identify which missing input is most likely to improve a specific decision and offer the next step: confirm soil texture, enter a measured pH with test date, add previous crop history, or verify irrigation quantity. Estimate the confidence benefit only if the confidence model has been validated; otherwise state qualitatively why the information matters.

<!-- SOURCE LINES 1126-1155 END -->

<!-- SOURCE LINES 1221-1246 BEGIN -->
### 15.8 Seasonal Farm Review

#### UI/UX + workflow contract — Seasonal Farm Review

Launch from a `Review season` action when a crop season reaches its configured review window; do not auto-assert a season ended based solely on a guessed calendar date. Use a stepper/wizard with progress, one decision at a time and a final review summary. Step groups: planted crop and dates; actual field events; recorded issues; completed/deferred recommendations; optional yield/cost/notes; final validation. Input panel uses 78% opaque glass over a quiet photo backdrop or solid surface, 24px padding and 16px radius. Show crop photo only where it helps identify a crop, not on every question. User can skip unknown values with explicit `Unknown` state; never fill a yield value to complete the form.

On completion, create a `SeasonReview` record that references planned RotationPlanVersion and CalendarEvent IDs; differences between planned and actual planting/harvest dates are stored as separate actual event records. Results may update future crop-history inputs only after the farmer confirms which review details should become canonical history. Old analyses remain unchanged and the next new analysis snapshots the confirmed additions.

The system can compare plan-vs-actual timing, recorded actions and user-reported observations. It cannot claim that a recommendation caused a yield change. If yield is absent, say no yield record was provided; do not use default estimates as if harvested. Tests verify skipped fields, late review submission, changed planned dates and correct carry-forward to a new rotation draft.


At the end of a season, guide the farmer through a brief review: what was planted, key events, any issues, recorded yields if they choose to supply them, and which recommendations were completed. Compare the planned calendar with actual dates and observations. Update the next planning cycle using confirmed history, not guessed yield values.

### 15.9 Recommendation Impact Review

#### UI/UX + evidence attribution contract — Recommendation Impact Review

Embed a compact `After this action` section in the relevant report and action detail, and provide a full comparison only when enough post-action data exists. Use a 6-column left/right comparison: action and completion record on the left; supported metric timeline/delta on the right. The summary says what happened after the recorded action, when the indicator changed and what other factors remain unaccounted for. Each delta is linked to the exact source window and metric method. Use `Observed after action` or `Associated change`; reserve causal wording for a separately validated causal design.

Eligibility requires: (1) a valid action record with completion date; (2) pre-action and post-action values from comparable metric definitions/time periods; (3) data coverage/quality above a declared minimum; and (4) the comparison window is suitable for the measured property. If these conditions fail, show `Not enough comparable evidence yet` with the reason. The UI must not treat a dismissed task as a completed action. A farmer-reported completion is labelled as reported, not sensor-verified.

`ImpactReview` stores action ID, baseline/current report/metric IDs, time windows, comparability flags, confounder caveats and engine version. It should be recalculated as a new immutable review if data changes, not mutate an earlier explanation. Tests cover no baseline, missing post values, incomparable methods and a real recorded action with valid measurements.


When enough relevant evidence exists, show whether a previously recommended action was followed and whether the associated indicator later changed. Use wording such as “After the action, this indicator increased,” not “the action caused improvement,” unless causal evidence exists. This creates accountability without overclaiming causality.

<!-- SOURCE LINES 1221-1246 END -->

<!-- SOURCE LINES 1284-1296 BEGIN -->
### 15.13 What Changed / Evidence story

#### UI/UX + evidence-narrative contract — What Changed

This reusable module appears on Home as at most 2–3 concise change summaries and inside Deep Analysis as a full evidence-backed explanation. On Home, each summary is a compact row (icon/status, 14–15px headline, 13–14px supporting sentence, 12px timestamp/context); use a 1px divider rather than a bordered card per row. In the report, use a vertical narrative with each statement followed by a `View evidence` link and source-period chip. A selected finding opens the exact metric/chart point and Evidence Drawer.

Narrative generation is constrained to a set of typed facts/deltas produced by the comparison engine. Inputs include old/new metric values, baseline period, current period, changed source/profile/model metadata, comparable flag and driver categories. LLM phrasing may simplify wording but cannot invent a numeric cause or exceed the evidence payload. If a change falls inside the noise/uncertainty interval, use `No meaningful change can be confirmed`; if source methods changed, explain the methodology difference. Distinguish `input changed`, `new source data arrived`, `model version changed` and `metric value changed`.

Store the facts and references used for each generated summary so later investigation can reproduce it. Tests ensure every sentence containing a number maps to a registered metric and a source/derived value; no causal claim is generated from simple before/after correlation.


A reusable explanation module across Home and Deep Analysis that composes a short narrative only from supported deltas: “Rainfall observed over the last seven days was X versus the local baseline Y; the water-balance model consequently changed by Z. This is based on source A, updated at time B.” If no change is significant or data is not comparable, say that no meaningful conclusion can be made.

<!-- SOURCE LINES 1284-1296 END -->

<!-- SOURCE LINES 2218-2282 BEGIN -->
### 30.8 Farm Intelligence / Deep Analysis workspace

#### Quantified visual and telemetry contract — Farm Intelligence

This is an assessment and monitoring workspace, not a second Home page. At 1440px use a 12-column grid: primary summary/priority zone spans 4 columns; assessment timeline and high-level trend may span 8 columns below or beside it according to the active subview. The page header shows selected farm, field scope (`All fields` or one field), current data time, prior report date, freshness indicator and `Run Deep Analysis`. The primary score/condition panel uses 22–28px for the score and a 16–18px status headline; definition, range and confidence are directly adjacent. Use `--fs-glass-default` (78% opaque, 14px blur) for photo-backed summary cards; use solid/strong surfaces for data tables and evidence lists. Any header photograph is a shallow (160–220px) field-context strip, not a full-page obstructive wallpaper.

The workspace's visual sequence is: **current assessment → highest-priority findings → field-by-field summary → change since previous report → recommended actions → data coverage / methodology**. Render findings as a ranked list with severity icon + text, evidence phrase, date/window, affected field and next action. Use no more than four major sections expanded initially. Keep a chart title + one-sentence takeaway above each chart. Charts have axes, units, selected time range, legend and source status; every chart has a text/table alternative. Low/medium/high risk color must also have labels and icons.

The `Run Deep Analysis` button opens a run panel summarising the scope, refreshable data sources and stored practice routine. The user can review/edit natural-language routine inputs before initiating. The run's progress UI uses actual job stages (profile snapshot, connector refresh, validation, calculations, field assessments, report assembly), not timers. Partial sources produce a partial report with missing inputs highlighted. If there is no prior report, say “First assessment” rather than inventing a trend.

**State / backend:** `idle → confirming_inputs → queued/running → complete|partial|failed|cancelled`. Store a run ID, immutable input snapshot, source outcome list and model version. Repeated double-clicks must map to one idempotent job. On completion, fetch the returned report ID and route to the report view. On failed job, preserve its safe diagnostic details and expose `Retry` only if retryable. Farm-wide score aggregates field assessments only under defined comparable weighting rules; always show field-level outcomes beside it so one severe field cannot disappear into an average. Schedule settings are managed separately from manual analysis but shown as a status summary here.


**Purpose:** “How are the selected farm and its fields doing, what changed, what risks need attention, and which improvements deserve consideration?” It is a monitoring/diagnostic workflow, not a replacement for rotation planning.

Header: `Farm Intelligence`; selected farm; field scope (`All fields` or selected subset); latest report timestamp; current assessment freshness; primary `Run Deep Analysis` action; schedule status/menu; reports/history link. Show a compact evidence coverage strip and a warning if critical sources are missing or stale.

Before running, open a short preflight panel: selected scope; relevant profile/input changes; data sources expected; last confirmed irrigation/management routine; whether the user wants to update it now. Offer “Use last confirmed routine” with its timestamp and “Update practices.” Do not silently assume the stored routine is current.

Run state sequence:

1. Validate selected farm/field IDs, boundaries, profile completeness and permission to run.
2. Freeze a run-input snapshot (farm/field profile versions, crop plan versions, practice records, data time windows, sources, model/crop KB versions).
3. Queue/execute required data refresh jobs with per-source timeout, cache and retry policy.
4. Validate each response and unit; handle data gaps/fill values; check spatial and temporal adequacy; store provenance.
5. Calculate supported field-level indicators and field assessments.
6. Calculate a farm-wide summary using the declared aggregation methodology; show field scores separately and never allow aggregation to obscure severe field-specific alerts.
7. Generate evidence-linked findings and actions through structured templates/rules. AI may paraphrase and parse user language, but cannot fabricate measurements or invent causes.
8. Validate each generated explanatory claim against structured calculations and sources. If validation fails, omit the claim or mark it unverified.
9. Persist a dated immutable report and update current-report pointer only after successful finalisation.
10. Display report status, coverage, partial failures and “what changed since the previous report.”

### 30.9 Deep Analysis report — full hierarchy

#### Quantified report layout and evidence hierarchy — Deep Analysis Report

Treat the report as a readable diagnostic document, not a collection of dashboard tiles. At desktop width, use a 12-column content grid with approximately 900–1120px readable report measure; a compact right-side contents rail (220–260px) may appear above 1280px, while the main report body occupies the rest. Keep the title, farm/field scope, report date, overall status, evidence confidence and input snapshot/version in the opening region. A shallow real agricultural image may be used as a header background only if a dark scrim secures contrast; data-heavy content belongs on solid or 88%-opaque surfaces. Hero summary headline 30–36px; section headings 20–24px; prose 15–16px; metadata 12–13px; table text at least 13–14px.

The immutable report order is: (1) Assessment summary and overall farm state; (2) field-by-field score/status table; (3) most important findings with severity, evidence and caveat; (4) water and soil status; (5) crop/rotation implications; (6) recommended actions with urgency and due windows; (7) changes since prior report; (8) data gaps and freshness; (9) method, formula, source and version appendix. For each finding, place evidence and uncertainty immediately beside the conclusion. Example: `Root-zone moisture estimate is below the selected baseline` followed by `Source: [product], depth: [basis], period: [dates], coverage/confidence: [value]`. Do not phrase a vegetation-index drop as confirmed disease.

Each numeric metric exposes a value, unit, date/time basis, source type and status. Selecting `Why?` opens the Evidence Drawer with observed/input/modelled/calculated classification, input values, formula and version. Report export (if implemented) uses the same immutable report data and layout, not a screenshot and not a fresh recalculation at export time. `Print` uses a light print stylesheet but preserves labels, sources and caveats.

**State/data contract:** reports are immutable snapshots; edits create new input versions and new reports, never overwrite old values. Report DTO includes a compatibility/version marker. Missing values appear as `Unavailable — [specific reason]`, not zero or blanks that imply zero. If no comparable previous report exists, hide deltas and show the reason. A report's status is computed from the assessment result and per-field data, with a separate `data confidence` measure. The report may be `complete`, `partial`, or `unavailable`; do not badge a partial report as complete.

Keyboard focus for expandable evidence must return to the triggering button when closed. A sticky contents rail must account for the 64px global header and never cover headings; mobile uses a `Report sections` disclosure instead.


1. **Report header:** farm name; date and timezone; scope and fields included; run status (Complete / Partial / Failed); model/version; data window; evidence freshness.
2. **Farm condition summary:** farm-wide score/index only if validated; otherwise a summary of supported component indicators. Explanation, confidence and aggregation method.
3. **Field-by-field results:** each field's condition, separate score/indicators, top finding, alert severity, evidence quality and link to field detail.
4. **Priority findings:** sorted by severity, confidence, urgency and actionability, not just by visual drama. Each includes “What we noticed”, “Why it matters”, evidence, date/range, uncertainty and “What to do next.”
5. **Water intelligence:** precipitation period and source; forecast/reanalysis/observation distinction; estimated crop demand and irrigation records if supported; water-balance method; missing practice data; limitations.
6. **Soil and land:** available properties, depth, source, measured vs mapped distinction, drainage/slope context, missing lab measurements and confidence.
7. **Weather/climate exposure:** heat/dry spell/frost/flooding exposure only with crop-specific thresholds and relevant time windows; forecasts separate from long-term baseline.
8. **Vegetation and field change:** only real retrieved imagery/index values; scene dates; cloud quality; spatial-resolution explanation; do not infer exact disease/nutrient diagnosis from greenness alone.
9. **Management-practice context:** user-confirmed irrigation, planting, fertiliser, residue and scouting history; mark unknown or stale routines visibly.
10. **Potential risks:** risk level, causal mechanism or plausible pathways, evidence supporting it, confidence and mitigation. Distinguish “possible risk” from confirmed event.
11. **Recommended actions:** priority, reason, field, due window, dependencies, estimated effort only if supported, action buttons and evidence link.
12. **Data gaps and improvement opportunities:** missing inputs and how to provide them; predicted effect on reliability expressed qualitatively unless validated quantitatively.
13. **Change comparison:** compare with previous comparable report; split difference drivers into changed farmer inputs, new observation/data, changed geometry/crop plan, different model version or missing-data change.
14. **Methods and provenance:** expandable full source registry, variable values and units, timestamps, calculation steps, thresholds, assumptions, model version and quality flags.
15. **Run summary and audit:** stage outcomes, source failures, partial computations, run ID and report creation timestamp. Never expose secret tokens or unnecessary sensitive logs.

The report must distinguish **farm condition**, **evidence confidence**, **data readiness** and **recommendation priority** as different concepts. A single composite farm health score is not mandatory if it cannot be scientifically justified. The requirement is that both farm-wide and field-level views exist; the farm-wide view can summarise component metrics until a defensible validated composite is available.

<!-- SOURCE LINES 2218-2282 END -->

<!-- SOURCE LINES 4237-4304 BEGIN -->
# PAGE 7 — FARM INTELLIGENCE: DEEP ANALYSIS WORKSPACE

## 55. Purpose and visual hierarchy

Farm Intelligence answers: `How is each field doing, what changed, what evidence supports the assessment, and what should I consider doing next?` It combines validated environment/soil/water calculations with farmer practices and observations. It is not merely an AI-generated paragraph and the language model is never the source of truth for scores.

Desktop layout: page header and scope selector, concise report verdict, farm + field assessments, key findings, priority actions and report-history/evidence entry points. Show four primary groupings before expandable details; don't place twenty metrics at the same visual level.

Header: title `Farm Intelligence`, support `Understand field conditions, changes and practical next steps.`, active farm selector, scope control (`Whole farm`, one field or selected fields), last report timestamp/stale notice, primary `Run Deep Analysis`, secondary `View report history`, quiet `Manage schedule`.

## 56. Pre-run flow and farmer practices

Before starting, summarise farm/fields included, data sources to refresh, saved routines/observations being used, management changes requested, processing steps and any data that will leave the browser. A field-only run is labelled field-only; never call it a full-farm report.

Ask `Has your watering routine changed?` when relevant. Use saved routine as a stated assumption, not proof of actual irrigation. Collect optional recent management changes/events: irrigation event/quantity/unit, planting date, nutrient application, tillage, crop issue observations, etc. Do not repeat a long questionnaire each run; prefill and ask what changed.

For natural-language input like `I usually water every three days for about two hours`, keep the raw statement and parse into a structured draft with named fields, units, uncertainty/ambiguity and confirmation state. Ask follow-up when required; don't invent flow rate or volume from duration alone. User must review/correct. Unconfirmed ambiguous fields are excluded or handled only by a documented uncertainty method.

## 57. Actual analysis stages and progress UI

The UI must reflect actual orchestrator/job events. Each stage uses queued/running/complete/partial/skipped/failed. Example sequence:
1. validate IDs and profile/geometry versions;
2. snapshot scope and user-confirmed practice inputs;
3. retrieve climate/forecast data required by report;
4. retrieve soil and moisture data where available;
5. retrieve vegetation observations only if connector exists;
6. retrieve terrain data if relevant;
7. clean units/dates/missing values/quality flags;
8. evaluate source resolution relative to field geometry;
9. calculate supported water/soil/climate indicators;
10. evaluate documented risk rules;
11. compute field assessments;
12. aggregate farm summary with coverage;
13. compare previous compatible report;
14. build evidence-linked recommendations;
15. validate output and persist immutable report.

Never show a fake 16-step timer or mark a source stage complete before success. Optional source failure can be `Skipped — source unavailable`; proceed only if remaining evidence suffices. Required source failure leads to failed/blocked state with reason. Cancel should abort server job if supported; otherwise explain whether processing may complete and prevent a late response from replacing a newer report. Use run ID and input hash to protect against race conditions.

## 58. Report top and farm/field score logic

Top section shows `Farm assessment · [date/time]`, validated health score if available, evidence coverage/confidence separately, scope, and a short verdict derived from calculated findings. Show both farm-wide result and per-field results. A table lists field, crop/stage if known, assessment/status, coverage/confidence, leading finding, priority action and report time.

Farm score must never hide a severe field issue. Show count such as `2 of 5 fields need attention`; don't average an unassessed field as 0 or 100. Define eligible field/area denominator and weighting. If the health model is not defensibly defined/validated, show categories and coverage instead of arbitrary numerical score. The following concepts must remain separate: health, crop suitability, data coverage and confidence.

## 59. Report sections

Every section starts with plain language and offers expandable technical details.

- **Overall farm picture:** status, assessed coverage, fields included, strengths, key concerns and top action, with timeframe.
- **Field-by-field results:** stable field rows with drilldown to the exact field report.
- **Water conditions:** observed/modelled/forecast/farmer-recorded inputs, units, time range, moisture depth and limitations; link Water Intelligence.
- **Soil & land:** measured/estimated property values, depths, history where valid, slope/erosion only if supported and tests that could improve confidence.
- **Vegetation:** valid optical product with acquisition dates, quality/cloud mask, index name/range, source and comparable history. Explain that index change does not identify its exact cause.
- **Climate/exposure:** heat, cold, dry spells, rainfall anomalies for relevant period and supported crop stage; separate forecast from historical climate.
- **Risks:** severity definition, affected field/crop/stage, evidence IDs/time, possible mechanisms, alternative explanations, confidence, what would confirm it and mitigation choices. A coloured pixel alone cannot diagnose disease.
- **Recommended actions:** priority, why, evidence, affected field, due window, prerequisites and status; distinguish Suggested, Accepted, Scheduled, Completed, Deferred and Dismissed. Completion is not proof the risk is resolved.
- **Compare with prior report:** added/resolved/continuing findings, numerical deltas only for compatible inputs/methods, and attribution between new evidence, farmer edits and model/version change.
- **Evidence/calculation explorer:** formulas, input values, units, normalization, source, date, resolution, quality, model version and limitations.

## 60. AI explanation rules and persistence

AI may translate validated facts, structure input language and explain the computed output. It may not invent measurements, numeric scores, risks, missing data or override engine constraints. Provide it a validated `ReportFinding` payload with approved evidence IDs. Validate its response; if AI fails, preserve deterministic results with `Explanation unavailable; results are still available`.

Each report is an immutable snapshot of scope, farm/field and geometry versions, profiles/practices, data observations and timestamps, model/crop database versions, metrics, confidence/coverage, findings and actions. New analysis creates a new report rather than modifying the old one. History filters by date/scope/status; open, compare compatible reports, export. Failed/partial runs remain visibly marked and never replace the last successful report as current.

---

<!-- SOURCE LINES 4237-4304 END -->
