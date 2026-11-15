# FIELD SHIFT — PAGE PROMPT: WHAT-IF SCENARIO SIMULATOR

**Target page:** What-If Scenario Simulator

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
> Source: `Pasted text(10).txt` · original line count: 4798 · source passages assigned to this prompt: 80 lines.

<!-- SOURCE LINES 870-900 BEGIN -->
## 10. Scenario Simulator: test decisions without corrupting reality

The Simulator should remain a sandbox. A scenario stores an immutable baseline and its changed assumptions; it never changes the active farm plan unless the user intentionally applies an accepted change.

### 10.1 Scenario controls

Start with inputs that the engine can actually recalculate: rainfall change, temperature change, irrigation availability/reliability, starting soil-moisture assumption, planting-date shift or season-window shift. Add heat-wave frequency only if the data and model represent it adequately. Avoid more sliders than the engine can explain.

### 10.2 Results

For every rotation, show:
- baseline score and scenario score;
- score difference and rank difference;
- component(s) changed most;
- water demand/supply and supported stress-day changes;
- constraints newly crossed, if any;
- explanation of the major drivers;
- assumptions and method completeness.

If all changes are approximated using a simplified delta method rather than a full rerun, say so. Results are scenarios, not forecasts. Include a threshold exploration where justified, such as “At this irrigation availability, the leading rotation changes.”

### 10.3 Saved scenarios

Give scenarios meaningful names and comparison labels: baseline, dry season, lower irrigation supply, delayed planting. Store inputs, created date, result version and source snapshot. Provide duplicate, compare, rename and delete actions. “Apply this scenario” should open a review of which real farm assumptions would change and require confirmation; do not overwrite a field profile on one click.

### 10.4 Later economic simulation

A separate phase can model fertiliser, seed, labour/fuel and crop-price shocks. Keep economic projections separate from agronomic scores. All prices need source, currency, date, unit and area basis. If no verified source is connected, label figures illustrative or unavailable rather than implying a market forecast.

---

<!-- SOURCE LINES 870-900 END -->

<!-- SOURCE LINES 2350-2366 BEGIN -->
### 30.13 Scenario Simulator

#### Quantified simulator canvas and model contract

The simulator uses a 12-column desktop grid: controls/workspace setup in columns 1–4 (33.3%); baseline-vs-scenario visual comparison in columns 5–9 (41.7%); impact summary and diagnostics in columns 10–12 (25%). At 1024px, use two columns with controls at 35–40% and results 60–65%; below 768px stack controls above results. Keep a sticky compact context bar showing farm, field, baseline rotation/report, scenario name and `Scenario only`. Use an image/3D scene only if it represents a clearly labelled conceptual model; do not render fake precision field geometry or pretend illustrative 3D crop blocks are simulated satellite results.

Controls are grouped by dimension: weather (temperature/rainfall only within supported bounds), water availability/irrigation assumptions, soil-property assumptions if the model supports recalculation, and rotation choice. Each slider shows the exact current delta and unit, baseline value, min/max and a one-sentence explanation. `Reset` returns controls to zero deltas. Scenario presets must disclose their assumptions. Run button changes to `Running scenario…` and uses actual calculation state. Baseline/simulation charts use identical axes, units, time windows and series definitions. Impact summary rows explain both magnitude and direction (e.g. water demand up/down); a higher score is not always better if a floor is breached.

**Calculation contract:** scenario is a deep-cloned input snapshot/delta applied to the same deterministic model pipeline, with identical random seed/engine version so differences are attributable to the scenario input rather than randomness. Recompute series from changed variables; do not apply unexplained fixed score multipliers. Use stable rotation IDs. If a rotation becomes infeasible under the changed scenario, state `No longer feasible` with constraint/reason instead of falling back to an unchanged base candidate. Distinguish `rank changed` from `safety floor breached`. If a delta extends beyond the farm's historical range, reduce scenario confidence and flag extrapolation. With all deltas equal to zero, results must reproduce the baseline exactly.

Saved scenarios have create/rename/duplicate/delete states and are separate records (`scenarioOnly=true`). `Apply to real plan` opens a diff panel that shows each changed field, downstream affected results and a confirmation requirement; the commit creates new versioned inputs and marks dependent outputs stale. It must never mutate an old report. Backend calculations use validated DTOs, timeouts and cancellation; identical input hash/version may reuse a cached result. Show job/data failure explicitly rather than rendering fake impact cards.


Header explains “Test a possible change without editing the real farm.” User selects a farm/field and a baseline analysis/rotation. Left/control area includes scenario name, controls for supported variables (e.g. temperature/rainfall shifts or water availability only where modelling supports it), presets, reset-to-baseline and saved scenarios. Right/results area shows baseline vs scenario, rank changes, component delta, risk drivers and a textual explanation.

The simulator must state the scenario time range and assumptions. It must not relabel scenario numbers as forecasts. Unsupported control/variable combinations should be disabled with a reason. Results must be deterministic for identical inputs and model versions. Save/duplicate/rename/delete scenario actions all work. “Apply to real plan” opens a review diff of changed assumptions and requires explicit confirmation, then creates a new version; it never mutates historical scenarios or reports.

<!-- SOURCE LINES 2350-2366 END -->

<!-- SOURCE LINES 3049-3060 BEGIN -->
## 42. Exhaustive Simulator, Calendar, Data and Setup mode-specific requirements

### 42.1 What-If Climate Simulator

**Simple:** a small set of plain-language presets/controls for hotter conditions, less rain or lower available irrigation where supported; one before/after explanation; whether the top rotation changes; a clear “hypothetical scenario, not a forecast” disclosure.

**Advanced:** all candidate score deltas; rank movement; which rotations newly fail a hard constraint; driver attribution by temperature/rainfall/water supply; baseline vs scenario water-balance chart and raw values; saved scenario parameter set and source/model snapshot; uncertainty or sensitivity only if computed. Saving/renaming/deleting/comparing a scenario must work. All hypothetical values carry a scenario provenance tag and stay isolated from real data until explicit reviewed application.

### 42.2 Economic / market shock simulation

This is a separate future module, not blended into the climate simulator or agronomic score. Simple presets might express a qualitative effect if a supported model exists; Advanced provides crop-level fertilizer/commodity price deltas, gross margin and uncertainty. It remains unavailable or clearly illustrative until a valid non-NASA market/input cost provider, local currency and model are implemented. Do not make up a claim that a rotation “will still profit.”

<!-- SOURCE LINES 3049-3060 END -->

<!-- SOURCE LINES 4331-4350 BEGIN -->
# PAGE 9 — SCENARIO SIMULATOR

## 65. Purpose and UI composition

Simulator answers `What might change if an environmental or management assumption changes?` It must not silently alter real farm profiles, management history, active rotation or formal reports.

Header: `Scenario Simulator`, farm/field selector, baseline report/version/date, scenario selector. Layout: left/upper control pane (scenario, variables/deltas, valid ranges, preset scenarios), central baseline-versus-scenario comparison, right impact summary, and lower evidence charts/assumptions/saved scenarios. Use a compelling but restrained split visual (baseline farm/field versus scenario) if useful; real data charts remain the authority. Main `Run scenario` disabled until valid changes exist.

## 66. Recalculation contract

For rain/temperature changes, transform supported input time series and rerun affected calculations rather than multiplying final scores by unexplained constants. If only monthly data exists, don't claim daily event precision. Recompute ET₀ with required inputs, crop stage, water balance and rotation scores as supported. Reuse baseline seed/model version so random variation doesn't look like an effect. For irrigation changes, modify hypothetical inputs—not saved routines. Crop/rotation changes must rerun suitability and hard constraints.

Each output stores the baseline hash, scenario input deltas, models/versions and results. If a plan becomes infeasible, show `No longer feasible` and exact constraint; never use its old score as a fallback. Mark scenarios outside historical variability as extrapolation and lower confidence only according to a defined rule. `Save scenario` preserves the hypothetical result; `Apply as a new plan` opens a review and explicit confirmation then creates a new plan version.

## 67. Results and UX states

Show baseline rank/score, scenario rank/score, delta, valid confidence interval if calculated, leading drivers, water balance, new risks and violated constraints. Keep `rank changed` separate from `constraint breached`. Driver attribution must run single-factor variants plus combined scenario where feasible; do not choose a cause from a temperature/rainfall rule of thumb. A zero-delta scenario must reproduce the baseline exactly. Missing candidate -> reason, not previous score. Support saved scenario compare, duplicate, rename, delete and reset to baseline. Handle no baseline, stale baseline, invalid range, no output change, partial input, API failure, empty saved list and low-confidence extrapolation explicitly.

---

<!-- SOURCE LINES 4331-4350 END -->
