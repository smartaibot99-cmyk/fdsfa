# FIELD SHIFT — PAGE PROMPT: CALENDAR & ACTIONS

**Target page:** Calendar & Actions

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
> Source: `Pasted text(10).txt` · original line count: 4798 · source passages assigned to this prompt: 89 lines.

<!-- SOURCE LINES 901-929 BEGIN -->
## 11. Calendar & Actions

The calendar should coordinate the rotation plan and real-world activities, not be an isolated calendar UI.

### 11.1 Views

- Month view for a farm or selected field.
- Agenda/upcoming view for the next one to two weeks.
- Optional multi-field overlay that shows which field has which crop/action.
- Filters for planting/harvest windows, crop stages, irrigation/logged events, recommended tasks, soil testing/scouting and reassessment dates.

### 11.2 Crop-date logic

Use crop parameters, local climate features, rotation sequence, user-confirmed planting dates and growing-degree calculations where supported. Do not hard-code generic dates for all farms. Distinguish planned windows from confirmed actual dates and predicted windows from observed events.

### 11.3 Clicking a crop or event

Selecting a crop cell opens a detailed contextual panel: crop, farm, field, plan, stage, date window, relevant action, evidence and links to the rotation plan. If several fields have the same crop on that date, display separate entries with explicit field labels.

### 11.4 Interactive usability

Keep month arrows in fixed positions, provide a Today action, support keyboard navigation, and avoid a calendar that leaves large unused margins or forces horizontal overflow. Crop-specific colours can distinguish sequences, but text labels and accessible contrast are still required. Do not use emoji as a replacement for professional icons.

### 11.5 Schedule adjustment

If updated weather or crop-stage estimates alter a suggested window, show the previous and revised range, why it changed, and whether the user should approve the change. Never quietly edit the farmer's confirmed plan.

---

<!-- SOURCE LINES 901-929 END -->

<!-- SOURCE LINES 1195-1207 BEGIN -->
### 15.6 Farm Resource Calendar

#### UI/UX + event projection contract — Farm Resource Calendar

This is implemented within Calendar & Actions rather than as a second disconnected calendar. Add filters for operation class (`planting/harvest`, `irrigation`, `soil test`, `scouting`, `fertilizer`, `rotation transition`, `analysis/review`, `farmer task`). On desktop use the calendar 8-column / agenda 4-column layout specified in Section 30.14. Add a compact workload-density strip above the month only when it helps identify clustered work. Each operation row displays field, proposed date/window, certainty basis (`planned`, `recommended window`, `scheduled`, `completed`) and task state.

Resource scheduling may show conflicts such as many fields' planting windows overlapping, but only if crop timing and field assignments support the inference. Do not create exact labor hours or machine capacity without user-supplied/validated capacity data. If equipment/labor information is available, expose it as optional farmer-entered constraints. Calendar tasks derive from plan stages and recommendations; the UI must not create duplicate tasks just because a recommendation is shown in more than one page.

Task actions use `TaskCommand` and update one canonical Task entity. Creation/editing records due window, timezone, linked plan/report/finding, priority and optional reminder. When a plan changes, dependent planned events update as new versions and actual completed events remain unchanged. Exported ICS events use stable UID and timezone; update/cancel versions when supported. Tests check cross-farm same-day events, calendar/task consistency, timezone/DST transitions and no duplicate action creation.


Bring together crop operations, irrigation routine reminders, soil testing, scouting and rotation transitions. This gives farmers a single action timeline. Each recommended operation links to its evidence and can be completed or deferred. Only create tasks from valid models/rules or clear user reminders; don't invent activities to make the calendar look populated.

<!-- SOURCE LINES 1195-1207 END -->

<!-- SOURCE LINES 2367-2387 BEGIN -->
### 30.14 Calendar & Actions

#### Quantified calendar geometry, event rendering and mutation contract

At 1440px the calendar page uses a 12-column grid: calendar body spans 8 columns, selected-date agenda/action panel spans 4 columns; the calendar fills available width (not a small boxed widget centred in a wide page). Main content max-width 1480px with 36–40px gutters, page title 30–34px. Calendar surface is solid/strong glass rather than very transparent because small dates need stable contrast; 16px radius and 20px padding. The month header is a three-part grid: previous arrow in fixed 40px left cell, centered month/year in a flexible middle cell, next arrow in fixed 40px right cell. Never align arrows using the text length of the month string. Day headers are 12–13px; day cells use a stable seven-column CSS grid with min-height 84–110px desktop, 56–72px tablet and adaptive mobile agenda view. Crop labels use 12–13px readable text and never overflow into adjacent day cells.

Use event type + border/marker + label to distinguish crop stage, planting/harvest window, irrigation task, scheduled analysis, alert and farmer observation. Crop-specific hues can be assigned from a restrained, colorblind-considered palette, but each item must carry a crop name and farm/field label; color alone cannot distinguish simultaneous events from different farms. Multi-farm day cells show compact stacked chips or a `+N more` disclosure. Selected date gets a clear 2px border/focus ring with a non-color indicator. The right agenda orders records by time, then severity/type, and shows event title, farm/field, time window, date basis (`planned`, `observed`, `modelled`) and action button.

**Domain model:** calendar event is a view projection from crop stages, tasks, alert due dates, scheduled analysis and user events. It should not duplicate them into separate unsynchronised event records. Task updates use an action command (`complete`, `defer`, `reschedule`, `cancel`) and append an audit event. Completion means the farmer reports the action happened; it does not prove the desired agronomic outcome. Editing planting/harvest dates invalidates dependent rotation timelines, expected crop stage, water/crop demand calculations and relevant Deep Analysis summaries. Record planned vs actual dates separately.

Clicking a crop opens the exact farm + field + active plan + crop stage using canonical IDs, not name-only search. When multiple farms grow the same crop, a click on a specific event uses that event's entity IDs; a generic crop label opens a chooser. ICS export includes timezone, stable UID, sequence/version and cancellation update where supported. Empty month, unavailable date data and failed calendar load get distinct states. At mobile, default to Agenda view; month-grid remains accessible with horizontal/vertical support without whole-page overflow.


The page combines time-based crop stages and actionable farm work while retaining their different data types. Header: title, farm scope, field filter, current month/week/agenda toggle, Today, date navigation, create task and filters. Calendar grid must use screen width efficiently and not be trapped in a small box with unused margins.

Month grid has fixed-position previous/next controls; centered month/year; accessible day headers; clear crop labels within relevant cells; crop-color palette with readable contrast; visually different but legible marks when multiple farms have events on the same day; selected day state; and a textual agenda panel. Do not rely on background color alone to distinguish overlapping farm events.

Selected-date panel lists events chronologically: crop stage/planting/harvest window, recommended task, scheduled Deep Analysis, farmer record and any alert. Each row displays the event type, farm/field, date basis (planned/observed/modelled), status and actions. Clicking an event opens detail; clicking a crop uses the canonical deep link to the exact rotation stage; completing a task updates the action record and report context, not its underlying evidence. Dates derived from a model are windows, not exact promises.

Support create/edit/reschedule/complete/defer/cancel for tasks with audit history. Conflicts with the crop plan should trigger a warning. Changing planting/harvest dates marks affected rotation timelines and analyses stale. `Today` returns to the actual local date for the farm or selected timezone and does not reset unrelated filters.

<!-- SOURCE LINES 2367-2387 END -->

<!-- SOURCE LINES 3061-3066 BEGIN -->
### 42.3 Calendar

**Simple:** month view with crop names shown on planted/planned days; selected date displays crop stage and one or two evidence-grounded recommended activities; a crop/field colour legend and labels; view/event details are clickable.

**Advanced:** full planting/harvest windows per crop, year and season, task timing rationale, overlapping schedules across fields/farms, historical actual dates vs current plan if records exist, linked crop water/soil/climate reasoning. Events from different farms must remain distinguishable even when the same crop occurs on the same date. Each event carries provenance (`planned`, `farmer-recorded actual`, `modelled window`) and must not look like a confirmed real event if it is only planned.

<!-- SOURCE LINES 3061-3066 END -->

<!-- SOURCE LINES 4351-4370 BEGIN -->
# PAGE 10 — CALENDAR & ACTIONS

## 68. Calendar layout and event model

Use a compact month grid with fixed navigation-arrow positions regardless of month title length. Desktop: page header with farm/field selector, Month/Agenda/Timeline switch where implemented, date arrows, Today and Add task. Main area: calendar around 7–8 grid columns and selected-day/upcoming-action panel around 4–5 columns. Use remaining screen space; don't trap the calendar in a tiny box. On mobile, compact grid then selected-day agenda.

Events can be planned sowing/harvest windows, crop stage, transition/preparation, actual field operation, reminder/task, review date, observation or user event. Each event includes type, farm/field, crop occurrence/active plan version, start/end, time zone, source/status and evidence links. Planned windows, model estimates and actual confirmed dates use distinct labels/patterns.

Calendar cells use equal widths, locale-correct week start and 2–3 event labels max plus `+N more`. Crops have consistent accessible category colors but also text/icons. If two farms grow the same crop on the same date, display separate entries with their farm/field context; never merge into one indistinguishable chip. Clicking a crop preserves stable farm, field, rotation, crop occurrence and date IDs to open the exact detail.

## 69. Day and task interactions

Selected day panel groups `Crops and stages`, `Planned work`, `Tasks due`, `Observations`. Each row includes icon, title, field, date/time, state and open affordance. Clicking opens a task/event drawer containing purpose, reason, source, due window, prerequisites, notes and allowed controls.

`Mark complete` records completion time as actual execution and removes it from open task queue while preserving history. It does not automatically resolve a risk alert. `Reschedule` changes the task and invalidates dependent crop date calculations where relevant; it doesn't silently change the biological stage. If actual planting/harvest differs from a plan, record separately and offer to recompute downstream predicted events. Log important changes.

ICS export includes selected supported events and timezone, with stable UIDs to prevent duplicates. Don't display Google/Outlook sync toggles unless those integrations actually exist. Test month arrows, DST, same crop across farms, exact click-through, completed tasks, export UIDs and mobile layout.

---

<!-- SOURCE LINES 4351-4370 END -->
