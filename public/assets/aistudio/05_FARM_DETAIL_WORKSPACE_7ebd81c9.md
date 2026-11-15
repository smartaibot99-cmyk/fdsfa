# FIELD SHIFT — PAGE PROMPT: FARM DETAIL — FARM AND FIELD INTELLIGENCE WORKSPACE

**Target page:** Farm Detail — farm and field intelligence workspace

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
> Source: `Pasted text(10).txt` · original line count: 4798 · source passages assigned to this prompt: 102 lines.

<!-- SOURCE LINES 2114-2147 BEGIN -->
### 30.5 Farm detail workspace

#### Quantified visual and information-architecture contract — Farm / Field Detail

Use a master-detail workspace with a stable left contextual rail and a larger main content pane. At ≥1280px the left rail is 240–260px wide; main pane fills remaining width. The rail has a compact farm cover image (16:9 crop, about 120–150px high), farm name, location, mapped area and an active/needs-attention status. Below, use a vertical navigation list with 40–44px row height: Overview, Fields & Map, Rotation Plan, Soil & Land, Water Intelligence, Weather & Climate, Past Analysis, Journal, Farm Settings. Only one active section gets a 3px accent edge and restrained selected fill (teal alpha 0.08); no neon outline. The data content starts with a breadcrumb and section title, then an optional compact field selector if the section is field scoped.

The main pane uses a 12-column responsive grid with 20–24px gaps. Overview reproduces Home's canonical status data but expanded; avoid copying every Home card verbatim. The rotation section uses the canonical full-width rotation card/timeline; soil/water sections use charts with axes/units/source captions and tables for inspectable values. Image assets have a clear purpose: real crop photos for crop-stage cards, real satellite imagery in maps, contextual farmland photography for small profile headers only. Do not use cinematic photo behind data tables if it makes values harder to read.

**State/context:** `farmId`, `fieldId`, `activeSection`, selected rotation ID and crop-focus ID must remain in route context. Navigating away and back restores section/field/scroll context where practical. If clicking a crop from Calendar or a report, the route opens the exact field and rotation stage with a focus banner; clear the focus only on explicit close or selection change. Editing a farm profile creates a new profile version; it does not rewrite previous report inputs. A change that affects analysis creates a stale flag on affected outputs and displays which dependencies changed.

**Backend/domain:** detail panels should call selectors over the canonical farm/field records and related analysis reports; do not re-query each card independently with different IDs/time ranges. Use a query/cache key including farmId, fieldId, section, reportId and data window. Invalidation rules are declared in Section 43. Save states need pending/saved/failed feedback. Destructive delete/archive follows the portfolio contract.

At 1024px the rail collapses to a dropdown/compact secondary nav; at 768px becomes a tab strip or drawer; at ≤430px single-column with field selector at top. All section navigation is keyboard accessible and does not rely on hover.


Use a consistent farm heading region with: breadcrumb `My Farms > [Farm]`; farm name; location and area; status with text; last analysis; actions menu; field/farm selector when needed. A map thumbnail/mini-map can sit beside the heading, but it must be clickable to open the full boundary workspace.

Desktop sub-navigation can be a compact left rail inside the farm workspace. On tablet/mobile convert it to a labelled horizontal scroll menu or dropdown. Do not copy an oversized sidebar onto all global pages.

Required sections:

- **Overview / Farm Tracker:** summary from Home with expanded details.
- **Fields & Map:** fields list, boundary editor, create/import field, selected field status and comparison.
- **Crop Rotation Plan:** active rotation for selected field; if multiple fields, make the field selector explicit and do not combine them into one sequence.
- **Soil & Land:** properties table, texture composition chart, pH/reference ranges only where relevant, slope/erosion context, depth and source; lab measurements take precedence only when appropriate and current.
- **Water Intelligence:** crop water demand, rainfall/irrigation contributions, net water balance, model assumptions, data history and calculation explorer.
- **Weather & Climate:** actual current forecast from an identified source, historical weather/reanalysis with timestamps, climate baseline and risks by crop window.
- **Vegetation & Field Change:** satellite imagery or vegetation index only when genuinely retrieved and quality-screened; display scene date, sensor, resolution and cloud/no-data states.
- **Actions & Observations:** planned/done/overdue actions, farmer log and record details.
- **Past Analyses:** report list, dated scores and comparison.
- **Farm Settings:** editable farm details, unit preferences where global, default practices, data permissions and deletion/archive.

Each section starts with a human-readable summary then offers advanced expansion. Standard rows and charts link to evidence. Do not duplicate different copies of the same metric with conflicting formulas.

<!-- SOURCE LINES 2114-2147 END -->

<!-- SOURCE LINES 2990-3007 BEGIN -->
### 40.4 Farm detail expanded history and action plan

Simple shows Home information expanded into readable sentences, everyday soil/water descriptions, rotation sequence and one-line reason for each placement, plus a short “Why this was chosen.” Advanced adds:

- Soil & Satellite Profile: soil texture fractions, pH, organic matter, CEC, available water capacity, bulk density/porosity, slope/class, salinity/EC, drainage class and underlying 10-year rainfall series when valid; each value carries provenance, confidence/uncertainty, depth, date, units and resolution.
- Rotations & Schedule: all season-by-season entries with Year and Season separate, planting/harvest windows, days in field, six component scores per rotation (suitability, water, soil health, resilience, productivity, diversity) when available.
- Historical Crop Records: prior planted crops by season, actual dates where supplied, recorded pest/disease issues, yields only when farmer-provided or connected to a valid source, and provenance.
- Agronomic Action Plan: checklist of soil tests, cover-crop termination windows, sowing windows, transitions and other operations derived from the actual selected plan's timeline and local constraints.
- Full “Why this was chosen”: formulas/score drivers, assumptions, source list, rejected alternatives, limitations, uncertainty and why the crop order/durations were selected.

### 40.5 Farmer journal and performance history

Allow a simple note/observation field for issues such as a pest sighting, irrigation-system problem, visible dry patch, planting/harvest completion or management event. Capture date, field, optional quantity/unit, text and optional image attachment. Ask whether the note describes something that happened or a plan/intention. Do not parse a report of a broken pump into “irrigation definitely stopped for 3 days” unless the user states that duration. Advanced can structure quantities and show parsed fields for confirmation.

Yield/performance records are optional farmer-provided events with crop/season, quantity/unit, area basis, measurement method and date; never invent yields from a suitability score. Compare planned vs reported performance only when definitions/units/area/time windows align.

## 41. Exhaustive Crop Rotation output data contract

<!-- SOURCE LINES 2990-3007 END -->

<!-- SOURCE LINES 4153-4196 BEGIN -->
# PAGE 5 — FARM DETAIL WORKSPACE

## 43. Base composition and navigation

Opening a farm leads to a detail workspace with breadcrumb `My Farms > [Farm]`, farm title, general location, mapped area, assessment status, data coverage and stale indicator. Right-aligned actions: `Run Deep Analysis`, `Plan rotation`, overflow menu. Desktop uses a left local navigation rail about 220–260 px and flexible main content; do not squeeze three dense columns side by side. The main content expands when the rail collapses.

Local sections: Overview/Farm Tracker; Fields & Map; Crop Rotation Plan; Soil & Land; Water Intelligence; Weather & Climate; Field History; Reports; Farm Settings. A field selector controls field-specific data. Every route preserves `farmId` and, if relevant, `fieldId`. A field report may also preserve report ID, crop occurrence ID and period. Avoid separate, competing state per tab.

## 44. Overview / Farm Tracker

This is Home in expanded form and should share the same data objects and status logic. Include: farm summary/status, selected field and freshness; `What's growing now` with crop and source, stage, actual planting date and expected harvest period; wide crop sequence with separate Year/Season and crop duration; simple weather and water/soil status; active alerts; recommended tasks with due dates; changes since last report; and a field table with name, area, current crop, status and report freshness.

If multiple fields exist, clicking a field updates all field-dependent modules together. A farm-wide roll-up must display field counts and not hide a severe field alert in an average. Each card must label its scope if it intentionally describes the whole farm while a field is selected.

## 45. Field overview

Field heading includes name, farm, area, boundary status, current crop (only if confirmed), actions `View on map`, `Edit boundary`, `Run Deep Analysis for this field`, `Open active rotation`. Detail sections include Overview, Crop Plan, Soil, Water, Weather & Climate, Vegetation (only if supported), Risks & Actions, History/Reports and Settings. Stable field/geometry version IDs drive every query.

If a crop chip is clicked from a calendar/map/report, it must open the exact crop occurrence under the correct farm and field using `rotationId`, `cropOccurrenceId`, year and season—not crop name alone.

## 46. Soil & Land detail

Use a readable table with columns: property, value, unit, depth, source, date and quality/uncertainty. Include soil texture composition or pH reference visualization only with compatible data. Possible properties include texture fraction, pH, organic carbon/organic matter, CEC, bulk density, available water capacity, salinity/EC, drainage and slope—but render only properties actually supplied by a connector or farmer lab record. Unknown properties show `Not available` and a clear `Add measurement` / `Why it matters` action.

A soil texture triangle requires compatible sand/silt/clay fractions that sum within the documented tolerance; otherwise show a data-quality warning rather than silently normalizing. pH comparison bands must be crop/context-specific and cited. A regional soil grid is not equivalent to a laboratory sample collected from the exact field.

## 47. Water Intelligence detail

The view answers: estimated crop demand, known/estimated supply, likely root-zone change and assumptions. Layout: selected farm/field/crop stage and period selector; summary values with units; time-series demand/supply chart; detailed table by time step; soil-profile diagram only if depths and model are known; `Calculation explorer`; actions to `Add irrigation event` and `Edit management routine`.

Keep event and routine separate: a routine says what usually happens; an event says what actually happened on a particular date. Do not add assumed irrigation as real recorded irrigation. Distinguish observed rainfall, forecast rain and effective-rainfall model outputs. If claiming FAO-56 ET₀, implement the actual required-input method and validate against references; otherwise label any proxy as a simplified estimate. Crop ET requires a supported crop coefficient and growth stage. A water balance must identify sign convention, time step, soil-water storage, rainfall/infiltration, irrigation, ET and any included runoff/drainage. Unsupported terms must not be implied.

## 48. Weather & Climate detail

Use WeatherWise's cinematic visual language most strongly here: an appropriate sky/farm atmosphere, prominent current condition and high/low, compact daily forecast and a restrained curve. Beneath it, show historical climate, rainfall anomaly and heat/dry-spell/GDD metrics only when backed by suitable time resolution and crop thresholds. Make source/time difference clear: current/forecast, historic observations/reanalysis and long-term climatology are distinct. A monthly climatology endpoint is not a daily observed record. Every chart has range, units, timezone, legend, source and date. Source-specific coverage/freshness is visible.

## 49. History and field settings

Field History is chronological: farmer observations, real management events, weather/satellite observation arrivals, alerts, assessments, rotation changes, tasks and outcomes. Each event labels type and origin and opens its immutable source/report snapshot. Filters include date, field and event type. AI interpretation cannot be presented as a farmer-authored entry.

Settings include farm name/description, location/time zone, units, fields, profile inputs, privacy sharing, export, automation and delete. Input edits create a new profile version and stale affected results; they do not rewrite old reports. Dangerous actions have separate confirmation flows.

---

<!-- SOURCE LINES 4153-4196 END -->

<!-- SOURCE LINES 4662-4667 BEGIN -->
## 49. Field Journal, observation capture and attachments

The journal is a field-context timeline and entry form, not a free-floating chat screen. The page uses a 7-column timeline/list and 5-column detail/editor layout desktop; mobile stacks the list and entry editor. Journal entries have date/time, farm/field, event category, narrative, optional structured metric/unit, optional photo, `observed` vs `planned` vs `estimated` basis and author/source. Use 14–15px body, 12–13px metadata and an 88% opaque editor panel for readable fields over an image backdrop. Photo thumbnails preserve aspect ratio and open into an accessible lightbox with captions; don't add decorative stock photos to replace user evidence.

Saving creates an immutable observation entry or a new version if explicitly editing a prior entry. Keep original text when AI parses it into structure. Parsed quantities must carry a confidence/ambiguity flag and require confirmation before affecting calculations. The entry date, crop stage and field ID are validated; an attachment upload has max-size/type constraints and a retry state. A journal event may inform later analysis but must not retroactively alter a prior report or automatically assert unmentioned facts (e.g. a note about a faulty pump does not prove irrigation was absent for a precise duration).

<!-- SOURCE LINES 4662-4667 END -->
