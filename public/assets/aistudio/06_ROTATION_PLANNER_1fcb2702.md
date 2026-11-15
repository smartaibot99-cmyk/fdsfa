# FIELD SHIFT — PAGE PROMPT: ROTATION PLANNER — QUESTIONNAIRE, RANKING, SUITABILITY, COMPARISON AND PLAN DETAIL

**Target page:** Rotation Planner — questionnaire, ranking, suitability, comparison and plan detail

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
> Source: `Pasted text(10).txt` · original line count: 4798 · source passages assigned to this prompt: 335 lines.

<!-- SOURCE LINES 513-627 BEGIN -->
## 6. Crop Rotation Planner: the primary planning workflow

**Main question:** “Which crop sequence best fits this field, my resources and my priorities—and what are the trade-offs?”

This remains a core differentiator of Field Shift. The redesign should simplify the decision view while preserving the agronomic depth.

### 6.1 Entry points and wizard

Entry point labels: `Plan Crop Rotations`, `Create a new plan`, and optionally `Reassess this plan` when changing meaningful inputs. Creating a new farm or field must start with a clean draft. It must not inherit unrelated answers from the previous farm.

Use the attachment's one-question-at-a-time wizard:
- progress indicator with stage and honest question count;
- Back on every step, keyboard support and Save & exit;
- autosave after each answer;
- unknown / skip option for optional questions;
- inline, friendly validation;
- “Why we ask” explanation and concise indication of how the answer can affect confidence or the recommendation;
- smart prefill from data sources, always presented as a suggestion for the farmer to confirm or correct;
- a full editable review page before the analysis starts.

### 6.2 Core questions

1. Farm and field/location. Choose an existing field or add one; map location and boundary are editable.
2. Soil texture or “Not sure.” Show a plain-language texture guide. Any external soil dataset is clearly labelled and not confused with a lab test.
3. Water source and irrigation arrangement: rain-fed, irrigation, or both; irrigation method, reliability and seasonal water limit when applicable.
4. Recent crop history, ideally last three seasons and up to five where known. Include fallow, cover crop and “I don't remember.”
5. Planning horizon. Distinguish a growing season from a calendar year; ask about cropping intensity/multiple crops per year if relevant.
6. Priorities: water saving, soil health, climate resilience, crop suitability and productivity. Offer preset profiles, then adjustable controls. Normalise weights and prevent one slider from dominating unless the user explicitly selects a mode that permits it.

### 6.3 Optional accuracy questions

- Crops excluded and crops required.
- Soil pH and/or lab results (organic matter, N, P, K, salinity/EC and measurement date/method).
- Drainage/waterlogging history.
- Slope/tillage.
- Fertiliser approach and cover crops/residue management.
- Number of crops per year/available planting windows.
- Known pests/diseases and crop associations.
- Water quality/salinity.
- Field size and field-specific differences.
- Past yield values (with unit, period and source).
- Risk preference.
- Budget/market access only in a later, data-supported phase.

Farm-level default practices may be inherited by fields only after the user confirms they apply to all fields. Soil history, crop history, drainage and boundary remain field-specific.

### 6.4 Review stage

Show each answer, value/unit, source/provenance, last-confirmed date and whether it is farmer-reported, farmer-confirmed, estimated or unknown. Edit answers inline. Highlight only affected downstream answers if an earlier answer changes their relevance. Before running, disclose any key gaps that affect results.

### 6.5 Loading and progress

Use real analysis stages: validate farm/field; retrieve climate; retrieve supported soil/vegetation/terrain data; clean and cross-check inputs; derive climate features; estimate water/soil states; generate valid crop sequences; score and stress-test candidates; evaluate confidence; prepare explanations and report. Only mark a stage complete when its corresponding work completes. Show source names only for data actually used. A failed connector should create a truthful partial/degraded result, not an animation that pretends it worked.

### 6.6 Result screen: quick decision first

At the top show:
- selected field and plan date;
- best rotation and its match score, clearly explaining that it is not a yield percentage;
- short plain-language recommendation;
- rotation duration and growing-season interpretation;
- three to five key benefits;
- main risks and how to manage them;
- evidence confidence and any key data gaps;
- “View full comparison,” “Show evidence,” “Save as active plan,” and “Export plan.”

Use one wide horizontal rotation recommendation component: score/summary at left, crop sequence in the centre using realistic crop photographs and arrows, and concise “Why it fits” points at right. Keep it responsive; at narrow widths it can reflow vertically without clipping or horizontally scrolling the page.

### 6.7 Ranked candidates and comparison

Show the top N valid alternatives in order of score, while enforcing sequence diversity so the list is not ten near-identical plans. Every candidate must have a genuinely different crop order, duration or defensible plan constraint. Selecting a candidate updates all dependent details consistently.

Advanced Mode can show all generated candidate plans (with pagination or filtering), crop suitability, score components and season-by-season trajectories. Simple Mode should show the leading recommendation and a small number of clear alternatives, with technical comparisons concealed behind “Compare details.”

Add **Head-to-Head Comparison**: choose any two rotations and compare score, water demand, soil effects, crop-family repetition, climate fit, management workload, risk and duration. Give a final conclusion and explain the criteria that made one stronger. Do not claim a plan is universally better; it is better under the selected field inputs and priority weights.

### 6.8 Benefits, risks and mitigation

Every plan must identify relevant disadvantages, not just benefits. Examples include high water demand in a specific stage, short root depth that may increase sensitivity to dry spells, nutrient removal, disease carryover, awkward planting windows or uncertain parameters.

For each risk show:
- the crop/season involved;
- severity and confidence;
- evidence or rule behind the assessment;
- likely consequence;
- a practical mitigation or monitoring action;
- the data that could confirm or reduce the uncertainty.

Do not show a risk if the crop-host relationship or model input is unverified. Use a family-level explanation when species-specific evidence is unavailable.

### 6.9 Technical expansion

An expandable advanced area contains season-by-season details: crop family, planting and harvest window, duration in field, water need, heat/dry-spell fit, soil changes, nitrogen contribution/removal, disease-break logic, assumptions and references. Every numeric value has an appropriate unit, context, and provenance. Use charts and tables rather than many nested cards.

### 6.10 Rotation algorithm requirements

The attached engine specification establishes the following direction. Implementation details should be tested and kept deterministic:

- Climate feature extraction preserves historical year-to-year variability where data supports it: growing degree days, seasonal rainfall, dry-spell length, heat-stress days, frost risk, solar radiation and vapour-pressure deficit as appropriate.
- Crop knowledge records are typed, versioned and source-tagged.
- Crop suitability combines relevant temperature/GDD, rainfall/water availability, soil texture, pH/salinity/drainage, duration and crop constraints.
- Water demand should use a defensible reference evapotranspiration method and crop coefficient approach only when required inputs are available. FAO's reference method distinguishes reference ET (ET₀) from crop ET (ETc = Kc × ET₀). If simplified estimates are used, name them honestly and expose the approximation.
- Soil dynamics are clearly labelled as modelled indices, not direct measurements of soil health. Track model state such as organic-matter and nitrogen pools only when parameters and initial conditions are defensible.
- Hard constraints should include crop exclusions, minimum crop-family return intervals, consecutive-season limits, planting/harvest feasibility, known incompatible transitions and forced inclusions.
- Search may use beam search or other bounded optimisation for manageable execution. It should return a diverse candidate set and make constraints explainable.
- Crop duration must be evaluated, especially for perennial or multi-year crops. The engine should decide cycle length rather than assuming every plan is a four-year rotation.
- Label **Year** and **Season** separately. If each crop occupies a season, the interface should say Season 1, Season 2, etc., rather than incorrectly labelling each crop Year 1, Year 2.
- Ensure the nitrogen credit from a legume appears in the appropriate following crop, with decay/availability assumptions sourced and tested.
- Use a deterministic seed from normalised inputs to resolve ties reproducibly.
- Explain the “review by” date and what would trigger an earlier review.

The engine should be separated from UI and network code as pure, testable functions. Exact agronomic parameters need reviewed crop-specific references and should not be hard-coded as universal truths.

---

<!-- SOURCE LINES 513-627 END -->

<!-- SOURCE LINES 1182-1194 BEGIN -->
### 15.5 Crop Rotation Review Gate

#### UI/UX + triggering rule contract — Rotation Review Gate

Show a compact review state beside the active rotation: `Plan current`, `Review suggested`, or `Review required` only when defined rules support that severity. The badge uses label + icon + low-opacity surface; amber is not a decorative accent. Place the message near the plan title and in Home priority actions only when a trigger exists. Opening it reveals the trigger, date, changed dependency, why the original assumption matters, and actions `Review plan`, `Compare alternatives`, `Dismiss suggestion` where permissible. Keep the old plan visible and active until the farmer confirms a replacement; don't imply a suggestion is a forced invalidation unless a genuine hard constraint is violated.

Review triggers derive from registered dependencies and versioned thresholds: material irrigation/water availability change, new crop history, boundary change, newly available reliable data, plan review-by date or a known hard constraint failure. Define trigger hysteresis/cooldown to avoid repetitive notification churn and store `triggerRuleVersion`. State machine: `current → review_suggested → in_review → current` after explicit acceptance/revalidation, or `review_required` when a documented constraint no longer holds. Dismissal suppresses the same trigger fingerprint until relevant input changes, but does not erase the audit record.

The rule engine emits a `RotationReviewTrigger` containing the exact input/report IDs and reason. Test false positives, repeated runs with no change, a boundary edit, new crop history, and user choosing to retain the plan despite a noncritical suggestion.


Every active rotation has a review date and trigger conditions—such as new crop history, a major water-availability change, a boundary edit or evidence showing that a critical assumption no longer holds. The system flags “Plan review recommended,” not “plan invalid,” and explains the change. User-confirmed plans remain active until a user accepts a replacement, except where a clear safety limitation demands an alert.

<!-- SOURCE LINES 1182-1194 END -->

<!-- SOURCE LINES 1208-1220 BEGIN -->
### 15.7 Rotation Diversity and Workload Balance (multi-field)

#### UI/UX + optimisation contract — Multi-field Coordination

This is a later-phase planning workspace, not a control added to the basic single-field wizard. Desktop view has a field list/table on the left (4 columns) and season/operation timeline on the right (8 columns), with filters for crop family, season/year, water resource and workload windows. Each field remains an independent plan row with its own crop sequence, soil/water inputs, scores and confidence. A group summary can show peak number of concurrent planting/harvest windows only if event dates and field areas are valid.

The optimizer searches combinations of already feasible field-level candidates using explicit farm-level constraints: shared water cap if supplied, capacity limits if supplied, non-overlapping operation windows when requested, crop diversity targets if specified, and existing field-specific constraints. Do not sacrifice a critical field-level agronomic hard constraint merely to optimize farm workload. Display Pareto-style trade-offs or ranked feasible combinations with explanation of what improves and what worsens; label objective weights and assumptions. If labor/equipment capacity isn't provided, only show calendar overlap, not a claim that resources will be insufficient.

Data model links `FarmCoordinationPlan` to exact `RotationPlanVersion` IDs per field; outputs are proposals and never overwrite active plans automatically. Scenario-only coordination remains separate until user reviews a change diff and confirms. Tests include zero constraints, one field with no feasible candidates, shared resource cap violation, differing field input versions and same-input deterministic output.


For farms with several fields, a farm-level planner can coordinate field-specific rotations so planting and harvesting labour does not peak on every field at once, where the crop calendar and constraints permit. It should respect field-specific soil and water differences and show trade-offs rather than forcing all fields to share one rotation. This is a high-value future feature because the user manages multiple fields, but it depends on a reliable per-field rotation engine first.

<!-- SOURCE LINES 1208-1220 END -->

<!-- SOURCE LINES 2148-2217 BEGIN -->
### 30.6 Crop Rotation Planner — question wizard

#### Quantified visual, form, and calculation contract — Rotation Wizard

The planner wizard must feel like a focused decision workflow, not a chat clone or a generic survey. Use a two-region desktop layout where appropriate: primary question panel at 58–66% width and a contextual “what this changes” panel at 34–42% width. On the location/boundary step the map may become the dominant region; for non-geographic questions, the progress and form are the focal point. Form surface: `--fs-glass-default` (78% opaque), 14px blur, 16px radius and 28px padding. Context/preview panel: `--fs-glass-strong` (88% opaque), 8px blur, 16px radius and 20px padding. Title 26–30px, prompt body 15–16px, answer labels 14–15px, helper metadata 12–13px. Inputs minimum 44px high, focus border 2px leaf green, selected answer background `rgba(131,197,142,.10)` with a 1px selected border; unselected answers must not look pre-selected.

One question occupies one step unless the question truly requires a small set of dependent fields. Show required-step progress as `Question 3 of 6 · Soil` and keep optional data in a later `Improve accuracy` stage. Every question has a `Why we ask` explanation and an `How this affects the result` disclosure. Unknown/skipped is a legitimate state only if the field permits it; if the field is required, explain why it must be supplied. Changing an upstream answer revalidates only dependent answers and flags those now inconsistent on the review screen.

The right preview may display selected priorities and a small, clearly labelled provisional summary, but must not present a final rotation score before the model finishes. Priority sliders use a fixed defined range and show value text, not only a colored handle. If weights are normalised, show the final effective weights in Advanced Mode and make the anti-domination constraint transparent.

**Typed data and state:** persist a `RotationPlanDraft` with version, answers, provenance/confirmation statuses and current step. Use a deterministic schema to validate soil, water, crop history, horizon and priorities. AI parsing of natural language can suggest structured input only where the wizard includes such a field; it must preserve original text, flag ambiguity and require farmer confirmation. `Run analysis` captures immutable input snapshot/hash; during submission, prevent duplicate double-click submissions with an idempotency key. Errors preserve form state and point to the failed step/source. `Back`/browser history must not submit or wipe data.

The progress screen is not a decorative animation: it consumes real pipeline progress events. In a browser-only/local calculation, represent known synchronous stages honestly; when server-side, use job polling/SSE and current job ID. A cancelled run must stop/ignore downstream responses and leave the draft available. Motion between wizard stages 200–280ms, with reversed direction for Back; reduced motion removes slide transitions.


The planner is the primary tool for “Which rotations fit this field?” It is not Deep Analysis and it is not a What-If scenario.

Wizard contract:

- One decision/question per stage; use conditional follow-up only when it changes the model.
- Header: breadcrumb/context, progress text (“Step 3 of 7 required”), progress bar and Save & exit.
- Main column: clear question (32–48px desktop, responsive), helper line explaining why the question matters, exactly one principal input group and one primary action.
- Side rail on desktop may list broad categories, not future unanswered questions with confusing status.
- Back is always available; keyboard Back is supported without stealing browser shortcuts from text inputs. Next/Continue is disabled only when an answer is genuinely required and invalid.
- Single-choice cards can auto-advance only after a safe short delay and cancellation route; prefer explicit Continue for consequential or ambiguous inputs.
- All drafts save locally on every answer and sync only according to consent/identity architecture. The UI says Saved, Saving or Save failed honestly.
- Optional unknowns use “I don't know” and “Skip this question”; these are explicit states, not an empty string.
- Every input has an accessible label and correct units.

**Required question groups:** field/location selection; soil texture/known soil info; water source and irrigation type/reliability; crop history; planning horizon and cropping intensity; priorities. Optional accuracy group: pH/lab data, drainage/slope/tillage, pest/disease history, fertilizer/residue practices, crop exclusions/inclusions, water salinity, yields, available planting windows and any other factor the actual model supports.

The review screen shows all inputs grouped under Farm/Field, Soil, Water, Crop History, Management, Planning and Priorities. Each row shows value, units, provenance, last-confirmed date and inline Edit. Editing an upstream value identifies which later answers become irrelevant, which analysis cache is invalidated and why.

### 30.7 Crop Rotation Planner — result and detail pages

#### Quantified visual, sequence-card, and comparison contract — Rotation Results

The recommended rotation is the dominant result. At 1440px, render one wide 12-column recommendation panel with three internal zones divided by two neutral hairline rules: score/decision summary 22–25%, crop sequence 48–54%, and reason/benefits summary 23–28%. Target a panel height of roughly 250–310px according to crop image ratio, 16px radius, 24–28px padding and background `--fs-glass-strong` (88% opaque) if photo-backed, or solid `--fs-surface-solid` on plain canvas. Do not create a 5:1 strip so compressed that crop names/metadata become unreadable. Crop cards are photo-led: each has a 4:3 or square image, clear Year label, separately labelled Season, crop name, family tag, duration chip (e.g. `~115 days in field`) and a contextual expand control. Never combine Year and Season into one ambiguous term. Crop family uses label/text in addition to color. Images must correspond to the actual crop; no random plant photo pretending to be another species.

Score zone: display `Match score` with `/100`, explicit meaning and confidence separately. Include 3–4 small component metrics only where computed (e.g. water performance, soil outcome, resilience, productivity); each component has a label and value with units/meaning. The center sequence uses arrows with enough space and a timeline continuation rule if more crops than fit. The right zone includes up to 3 compact strengths and 1–3 most material risks; don't hide drawbacks beneath a generic “Why this works”. Buttons: `View full plan`, `Compare`, `Select this plan` (if selection is supported), and AI explanation action only if a real backend response can be generated. Every button has a defined destination/state effect.

Below the hero: (1) current farm/field context strip, (2) season-by-season plan table/timeline, (3) Benefits & Risks with mitigation, (4) alternatives sorted by score with stable candidate IDs and reason for ranking, (5) crop suitability, (6) Evidence / methodology drawer. Only 3–4 sections are expanded by default; use accordions/tabs to manage density. Avoid nested card stacks. Advanced Mode reveals all supported component values, formulas, assumptions, model versions, source references and soil/N/water trajectories; Simple Mode shows summary values and plain-language trade-offs from the same calculation result.

**Ranking/domain rules:** hard constraints determine candidate feasibility before weighted preference ranking. User priority weights may alter the aggregate objective but do not alter raw component metrics. A rotation failing a safety/feasibility floor must be marked infeasible or clearly downgraded with the exact reason; it must not be forced to #1 by preference weights. Candidate IDs are stable and independent of display names. Same input snapshot + engine/crop-KB version + seed must reproduce identical ranking. Ties require deterministic tie-break rules. Confidence is separate from match score. No score or percent uplift can be displayed unless the calculation and baseline are defined.

When selected, the plan becomes the canonical active selected plan for that field only after user confirmation. Update My Farms, Home, Calendar and Simulator baseline through one versioned event; preserve old plan and report history. If re-ranking occurs, never silently swap the farmer's selected plan. The `selected` state and `recommended` state are distinct.


Result page order:

1. field/farm context and analysis timestamp;
2. best-ranked valid rotation summary;
3. one wide three-part rotation card: score and headline trade-offs on the left, crop sequence in the centre, why-it-fits summary on the right;
4. priority/component score summary and evidence confidence (not conflated);
5. Current field context: current crop, plan stage, next transition, supported water/soil signals;
6. Benefits & Risks, including risk level, affected crop/stage, evidence or mechanism, mitigation and what is uncertain;
7. Ranked alternatives and a working compare selector;
8. schedule/timeline and review trigger;
9. additional supporting insights; deep details remain collapsible.

**Rotation sequence cards:** use realistic crop photography, crop name below image, year/season labels above, arrows or a visible directional link between stages, duration and planting/harvest windows where supported. Hover/tap displays duration in the field, botanical family and relevant stage note. On mobile, use a vertical or horizontally scrollable sequence region with clear control; never make the whole page overflow.

**Scoring and plan labels:** describe the overall figure as a match/suitability score out of 100, not predicted yield or likelihood of success. Display component scores (suitability, water, soil health, resilience, productivity, diversity) only when each is defined, computable and tested. Every metric has a definition, basis, formula/version in advanced detail, source/provenance, period and confidence where applicable.

**Ranked candidates:** show top 3 expanded initially; remaining candidates are compact and expandable or paginated. Advanced mode can expose the full valid ranked set with filters. Add a “Not recommended under current assumptions” group only for actual candidates tested and rejected, including the hard constraint or factor causing rejection. Do not call a plan “valid” if it violates crop-family return intervals, growing windows or required water constraints.

**Head-to-head comparison:** farmer selects two rotations (three only if layout remains readable). Display score, duration, crop sequence, each priority component, water demand/availability, soil trajectory, nitrogen assumptions, crop-family break, disease-cycle considerations, seasonal climate fit, workload/timing and evidence/confidence. At the bottom give an explicit conditional conclusion: “Plan A is the stronger match for your current water-saving priority; Plan B scores better on productivity potential under the stated assumptions.” Show when the difference is too small or unsupported to justify a confident winner.

**Detailed rotation screen:** selected plan title and active/saved status; crop sequence; year vs season distinction; duration explanation; planting and harvest windows; crop-specific climate conditions; risks/mitigations; water demand vs effective rainfall and reported irrigation; soil and nitrogen/organic matter trajectory where the model is validated; review-by date and trigger; source and assumptions drawer; print/export one-page field plan. Every button must work.

<!-- SOURCE LINES 2148-2217 END -->

<!-- SOURCE LINES 3008-3048 BEGIN -->
### 41.1 Simple Mode output

- Recommended rotation sequence, with current/active stage distinct.
- A plain-language overall label (“Strong fit for your current priorities”) with numerical score optional but never alone.
- Confidence label and one short reason.
- Total cycle length described in growing seasons/years correctly, with review timing.
- A clear choice of **Fallow** or **Cover Crop**, never the ambiguous combined option. Explain what each does in ordinary language.
- Three to four benefits grounded in the model and actual crop sequence.
- Simple expected impact directions for yield/productivity potential, soil direction, water use/demand and resilience. Numerical deltas are optional details and should only appear if supported.
- Crop family tag in plain words and a short explanation why family diversity matters.
- One to two alternative plans with their sequence and why they may be useful.
- Rejected combinations grouped behind an expandable section; simple view shows the count only if candidate generation actually evaluated that many candidates.
- Next action: compare, explore an explicitly hypothetical scenario, see field detail or save the plan.
- Dedicated Benefits & Risks section with disadvantage, risk level, affected stage, management mitigation and caveat; never only positive claims.

### 41.2 Advanced Mode output — complete detail

For every candidate, display the six component scores (suitability, water, soil health, resilience, productivity, diversity) and their definitions/units or scales. Display confidence contributors: input completeness, data quality, rank stability, crop-parameter coverage, field/grid scale fit and climate representativeness—but only if each has an implemented, defined measure. Show score uncertainty range/percentile interval and proportion of modelled test scenarios in which the candidate ranks first only if those simulations actually ran and the sample/method are stated.

Season/crop detail includes: distinct Year and Season fields; planting window and harvest window; crop duration/days in field; climate suitability for relevant crop phase; water demand in mm vs available precipitation/irrigation envelope; expected water-stress days if modelled; nitrogen addition/removal in kg N/ha and decay of legume credit across later seasons only with sourced coefficients; organic matter trajectory per season only if the soil model supports it; pest/disease break explanation for specific supported host/pathogen relationships; pH, drainage, salinity, slope and growing-period suitability factors with limiting factor, each only when inputs/knowledge base permit.

Rejected rotation detail for each actual rejected candidate includes failed constraint, actual computed value, threshold, difference to threshold and whether the failure is due to user constraint, climate, crop data, sequence feasibility or insufficient information. “Rejected” and “not assessed” are distinct states.

Explain total cycle-length choice versus alternatives and score difference; explain why each perennial/multi-season crop stays for its selected duration; explain review date and triggers; explain order dependence (what the previous crop contributes/consumes and what the following crop gains); show source/provenance on every number; show technical explanation alongside plain-language summary.

### 41.3 Fallow versus cover crop logic

Never label a stage as “Cover Crop/Fallow” without deciding which one the plan actually contains. A cover crop is a planted crop with a crop family, duration and purpose; fallow is a non-cropped/rest period with its own assumptions and potential weed/moisture considerations. The engine must choose based on supported goals/constraints and present the reason. Do not generalise “always choose fallow in arid climates” or “always choose cover crop when moisture is high” as an unqualified rule; use crop/soil/climate-specific criteria and validate it. If evidence is insufficient to select confidently, show the alternatives and ask the user or mark the choice tentative.

### 41.4 Water, soil and disease claims

- Crop water demand and supply use compatible periods and units; irrigation and rainfall are distinct terms.
- Nitrogen credit is not a universal fixed figure for every legume/soil/biomass; source assumptions and uncertainty are visible.
- Soil organic matter cannot be claimed to rise by a fixed percentage from rotation alone without a model, initial condition and documented transitions.
- Disease interruption depends on crop family, pathogen/host range, region and management. If the knowledge base cannot establish a relevant pathogen, use a general diversity explanation, not an invented species-specific percentage.
- Yield impact is potential/model-based unless supported by verified local data; never state a harvest guarantee.

### 41.5 Financial detail, separately gated

Gross margin, seed/fertilizer/fuel cost, commodity prices and market shocks are Advanced Mode only, separate from the agronomic match score, and later-phase unless a disclosed credible local/regional source and calculation method are implemented. Every price contains currency, unit, location/market, observation date and source. Until then, financial examples must be explicitly `Demo / illustrative`; they must never look like actual local quotes or predictions.

<!-- SOURCE LINES 3008-3048 END -->

<!-- SOURCE LINES 3079-3082 BEGIN -->
### 42.6 Crop suitability panel

Where shown, list candidate crops and rank only those evaluated. Include a factor breakdown for supported temperature/season, water, soil pH, drainage, salinity, slope and growing-period fit; identify the limiting factor; provide provenance/confidence; let user filter by family, suitability or constraints; and show why excluded/unknown candidates cannot be scored. Ensure this is not a detached duplicate engine: its scores come from the same versioned model as the rotation planner.

<!-- SOURCE LINES 3079-3082 END -->

<!-- SOURCE LINES 3236-3262 BEGIN -->
## 46. Full crop suitability, AI explanation and professional wording requirements

### 46.1 Crop Suitability is distinct from Crop Rotation Plans

Navigation and page headings must separate:

- **Crop Rotation Plans:** compare multi-season sequences such as Wheat → Chickpea → Sorghum → Cover Crop.
- **Crop Suitability:** compare individual candidate crops for the selected farm/field.

Do not put individual crop compatibility cards under a heading that implies complete rotation plans without a clearly visible sub-navigation. Make the second-level navigation bar visually distinct from its content: sufficient spacing, clear border/background/active underline, readable active label and a separate toolbar for Sort and Filter. The tab labels and sorting controls must never be visually swallowed by paragraphs or overlapping with page headings.

### 46.2 Plain-language percentage explanation

A crop factor percentage means a degree of match under the chosen model, not a directly measured biological percentage. At the top of Crop Suitability, show a brief explanation such as: “Each percentage shows how closely this crop matches one part of your field conditions. A low score points to a mismatch, not the percentage of the crop that will grow.” Add a short glossary for Temperature & Season, Water Match, Soil pH Match and Drainage Match.

For each crop: crop name/photo; overall `XX% Match`; clear subtitle “Overall fit for your farm and preferences”; 3–7 supported factor match bars/values; “Main issue” with a plain-language description; evidence confidence; and action/link to view details or compare. Example labels: “Temperature & growing season — low match; conditions may be too cold or the usable growing period too short.” Do not label factors as “Temp 11%” without explaining what that means. A high pH match means the entered/estimated soil pH is close to the crop's supported preferred range under the model—not that the crop absorbs nutrients with a quantified efficiency unless that is actually modelled.

### 46.3 Crop family, disease and crop placement explanations

Every crop may display its family in plain wording (Grain, Legume, Oilseed, Brassica, etc.) and technical botanical family in Advanced Mode. Explain the role only where supported (e.g., legume nitrogen contribution requires an appropriate model/assumptions; disease break needs crop-host/pathogen knowledge). Explain why the next crop follows the previous crop and what carries forward: nitrogen credit, residue, soil-water state, root structure, family return interval or risk break—only factors present in the actual calculation record.

### 46.4 AI Agronomist / explanation panel

If the AI Agronomist remains in product scope, it must be a side drawer or panel that is context-aware: it knows the selected farm, field, active rotation/report/scenario and relevant source snapshot. It can answer with simple or advanced phrasing based on current mode; show links to source evidence; and be explicit when it does not have enough data. Its response must use a validated structured payload of calculation outputs and source references, not independently estimate or override a score.

Quick prompts should be relevant to the open context, such as “Why was this rotation ranked first?”, “What is the biggest risk for this field?”, “Compare this plan with the alternative”, and “What does this metric mean?” Do not display unsupported AI-generated actions as if they were part of the verified action plan. Every actionable suggestion must pass the same rules as other recommendations.

<!-- SOURCE LINES 3236-3262 END -->

<!-- SOURCE LINES 4197-4236 BEGIN -->
# PAGE 6 — ROTATION PLANNER, RANKING AND PLAN DETAIL

## 50. Distinct purpose

Rotation Planner answers `Which crop sequence best fits this field, over what duration, and why?` Farm Intelligence answers `How is this farm doing now?` They share farm, field and data records but are separate workflows. Name them distinctly in navigation and headings.

## 51. Wizard and review layout

Entry identifies current farm/field. If multiple fields exist, select one or specify separate plans; never treat different fields as one soil profile. Single-question steps show honest progress, Back at bottom-left, Continue at bottom-right and Skip/I don't know for optional questions. Include field/location, soil and source, irrigation/water reliability, crop history, planning horizon, priorities, constraints, optional soil tests/management inputs and review. Keep plain-language prompts in Simple Mode; Advanced can expose technical names and confidence impact.

Priority vector includes water, soil, climate resilience, crop suitability and productivity when supported. Slider inputs need normalization and a documented mapping; if using clamps, disclose them and ensure weights sum to 1. Preferences affect the ranking objective, not the actual environmental values. Show conflicts such as water conservation versus productivity rather than silently changing weights.

After initial candidate evaluation, ask whether the farmer accepts a material trade-off only when it matters, e.g. higher productivity with increased water demand. Options can be `Accept this trade-off`, `Show a more balanced plan`, `Avoid this risk`, `Learn more`. User acceptance never bypasses a hard agronomic constraint. If no feasible plan remains, explain why and offer constraint/input review.

## 52. Suitability and rotation calculation contract

Keep distinct: crop suitability (single crop/field/window), rotation score (sequence across multiple seasons/years), confidence (evidence reliability), farm/field health (separate assessment model). Crop suitability can use climate accumulation/heat/frost, water, soil texture/pH/salinity/drainage, slope and season length only when supported by cited crop parameters. The underlying requirements specify normalized factor values combined through a documented weighted geometric approach and limiting-factor guard. Missing values must not default to ideal; hard minimum thresholds must return a reason/cap/rejection.

Rotation scoring may combine suitability, water, soil trajectory, resilience, productivity and crop diversity, with repetition/duration penalties. Hard constraints include crop-family return intervals, disease-host restrictions, realistic planting/harvest transitions, season/climate compatibility, water/soil limits, duration rules and horizon feasibility. Candidate generation should be deterministic with a stable seed, stable rotation IDs and diverse candidates; do not use unseeded randomness or output near-duplicate alternatives just to fill the screen. Use a suitable search method (the technical plan discusses beam search or dynamic programming) and keep intermediate calculation trace.

If score is 0–100, define its calibration and component meanings. Do not call 82/100 an 82% chance. Show confidence separately. Only show score intervals/ranking probabilities if a validated uncertainty method really computes them. If a candidate becomes infeasible, show its hard-constraint reason, not a stale previous score.

## 53. Rotation output composition

Page heading `Crop Rotation Plans`, farm/field context, analysis date/status and actions `Edit inputs`, `Refresh data`, `Export plan`.

The leading recommendation is a wide horizontal composition: left ~22–25% for rank/name/score/confidence/summary; center ~50–55% for actual crop-photo sequence with years, seasons, arrows, durations and crop labels; right ~22–25% for key component metrics and `Why this plan?`. On smaller widths stack intentionally rather than clip horizontally. Below it: current crop/status only if real record exists; benefits and disadvantages with risk management; ranked alternatives; head-to-head comparison; season-by-season timeline/table; plain-language rationale; expandable calculations/evidence; plan actions.

Each risk includes severity, cause, affected crop/period, evidence basis, mitigation and timing. Each crop card binds to stable farm/field/rotation/crop-occurrence IDs and has correct crop photography. Hover on desktop shows duration/dates/family; on touch use an info control. Click always opens the right occurrence even when the same crop appears multiple times or on another farm. Keep Year and agricultural Season as distinct properties and labels everywhere.

`Fallow` and `Cover Crop` are different agronomic options, never a combined label. The engine chooses among them based on water recharge, erosion, biomass/nitrogen, weeds, season and valid crop/soil inputs. Neither is inherently best. If data cannot support a choice, show alternatives and uncertainty.

## 54. Plan activation/versioning

Selecting a plan creates a new active-plan reference/version; it does not rewrite candidate results, history or imply the crop is already planted. Calendar uses the selected active plan plus separately recorded real events. Changes to crop/priority/input create a new version and record timestamp/reason. A stale plan remains inspectable but has a clear status and a refresh/review route.

Acceptance tests: reproducibility; hard constraints; priorities change ranking but do not change environmental measurements; unknown inputs reduce coverage rather than becoming ideal; failed refresh preserves last valid result; zero-delta simulator reproduces baseline; crop click-through is exact; year/season never conflated; fallow/cover crop never merged.

---

<!-- SOURCE LINES 4197-4236 END -->

<!-- SOURCE LINES 4650-4661 BEGIN -->
## 48. Crop suitability detail / crop catalogue / crop picker

### 48.1 Crop browser and suitability layout

Crop catalogue is a searchable/filterable table or gallery with real, accurate crop photographs only when available. Desktop filter toolbar: crop name search, family, season/growing window and available-for-this-field filter. Use a wide table for technical comparisons and a photo tile gallery for exploratory selection; do not merge both into a wall of cards. Crop image cards use 4:3 thumbnail, object-fit cover, 8px radius and a stable 16px name label below. Their visual states include eligible, selected, low-confidence, unsuitable and unavailable, each with non-color labels/icons.

Suitability detail opens a full-width page or 440–520px drawer depending on entry point. It shows crop name/family, score/rating and confidence as separate concepts, primary suitability drivers, limiting factors, local timing window only if supported, water/soil fit, source coverage and the next action. In Advanced Mode, expose factor breakdown values, input metrics/units, thresholds, weights and crop knowledge-base provenance. `Add to candidate comparison` updates the active comparison set; it does not mutate the selected live rotation. `Use in new plan` creates a new draft with provenance intact.

### 48.2 Calculation semantics

Crop suitability is not rotation suitability. Evaluate crop-specific temperature, GDD, frost/heat exposure, water, soil texture/pH/salinity/drainage, slope and growing-window constraints only if the knowledge base contains the required thresholds and applicable data. A weighted geometric mean or other declared aggregation method must be implemented exactly as specified in the model registry; a critical limiting factor may cap the score through a documented rule. Missing inputs reduce evidence confidence or cause `insufficient evidence`; they do not silently receive an ideal value. UI displays the main limiting factor and what information could resolve it. A crop cannot be shown as “unsuitable” merely because a data connector failed.

<!-- SOURCE LINES 4650-4661 END -->
