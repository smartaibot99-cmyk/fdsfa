# FIELD SHIFT — PAGE PROMPT: FIRST VISIT, ONBOARDING, ADD FARM AND ADD FIELD SETUP

**Target page:** First visit, onboarding, Add Farm and Add Field setup

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

<!-- SOURCE LINES 2013-2031 BEGIN -->
#### Quantified visual, component and state contract — First Visit / Empty Home

**Desktop composition (1440px reference):** global shell is 64px high. Under it, the main onboarding region spans the 12-column content grid with 40px side gutters and max-width 1480px. Use a photographic wide-angle aerial landscape—real crop fields, terrain and morning/late-afternoon directional light—as a hero background occupying approximately 300–360px height. Preserve realistic greens/earth colours; add a left-to-right scrim from `rgba(4,15,20,.28)` to `rgba(4,15,20,.86)` so the title sits on the darker part of the image. Never bake words into the image.

Place the title/description/primary action in a left 7-column content region, vertically centred, with 32–40px title text, 1.08 line height, weight 500–600 and a max line length of about 12–15 words. The right 5 columns may contain a restrained glass inset showing the three-step setup summary; surface `--fs-glass-strong` (88% opaque/14% transparent), 16px radius, 16px padding and 14px blur. Do not create a fake farm KPI on this screen. Under the hero, use a simple three-column process row (Location → Field details → Recommendations) with 16px section labels, 14–15px body and small line icons. It is instructional structure, not three huge cards.

**Interaction/state contract:** `Add your first farm` starts the wizard at the first incomplete required step. `Continue setup` appears only if a resumable draft exists. `Explore demo` appears only if a deterministic demo fixture exists; every value/banner/export from that workspace carries `Demo` provenance and never merges into the user's real workspace. Loading/saving state must preserve the user's intended action; errors say which draft could not be restored/saved. Creating no data must lead to an honest empty state—not seeded farm metrics.

**Engineering terms:** model this as an `onboarding state machine` (`no_workspace → draft_started → draft_in_progress → review_ready → workspace_created`). Persist wizard drafts to local IndexedDB/localStorage according to the local-first storage policy; validation should be schema-driven. The route must support reload/resume and browser back without losing valid draft answers. On completion, create a Farm entity first; create Field entities only if the user adds boundaries/fields. Do not infer a field polygon from a location pin.

**Responsive:** at 768px, reduce hero height to 280px and allow 2-column instructions; at ≤430px, hero becomes a vertical stack, title 32px, use a compact background focal crop, and primary action spans full width. The background image moves behind the title only if the scrim still satisfies contrast; otherwise use a solid dark text scrim. `prefers-reduced-motion` removes image drift.


**Purpose:** establish where the farm is and let the user get started without a giant form or a promotional landing page pretending to be the working dashboard.

**Layout:** a clean headline (“Understand your land. Plan better rotations.”), concise explanation, one primary action “Add your first farm”, secondary “Explore a clearly labelled demo farm” if a deterministic demo is implemented, and an optional “Continue setup” if a draft exists. Use a realistic agricultural image as a restrained crop/landscape backdrop only if it does not reduce contrast or consume the viewport. No fake farm metrics.

**Interaction:** “Add your first farm” opens the Add Farm wizard at the first step. “Demo farm” loads labelled illustrative data and persists an explicit demo state; demo values can never be confused with the user's real farm. “Continue setup” resumes at the correct first incomplete required step or the review page if required answers are complete. If the user has a saved farm but no current report, Home prioritises “Run your first assessment” / “Plan crop rotations” rather than onboarding cards.

<!-- SOURCE LINES 2013-2031 END -->

<!-- SOURCE LINES 2032-2054 BEGIN -->
### 30.2 Add Farm and Add Field wizard

#### Quantified visual, component and state contract — Add Farm / Add Field

Use a focused, step-based form shell, not a conventional dense admin form. At ≥1024px, keep the page header and progress indicator across the top, a central form column 600–720px wide, and an optional contextual map/preview region 34–40% of the available content width when the current step needs geography. Use a 3px progress track, 100% width, with a teal fill tied to actual required-step completion; optional “Sharpen accuracy” questions are excluded from the required-step denominator. Main question panel uses `--fs-glass-default` (78% opaque/24% transparent), 14px blur, 16px radius and 28–32px padding over a low-detail aerial image with a strong dark scrim. Inputs are minimum 44px high, with 8px radius, 16px text and visible focus ring.

Every step displays a 12px eyebrow (`STEP 2 OF 6 · LOCATION`), one 24–30px primary question, one 14–16px explanation of why it matters, then the relevant control. Buttons remain in a fixed footer row inside the form column: `Back` on the left, `Save & exit` as a tertiary action, and `Continue` on the right. On the final review step, use `Run analysis` or `Create farm` according to the actual workflow. The map step uses real tiles, search/geocoding with documented provider/terms, draggable location pin as a location locator, and a separate “draw boundary” tool. Do not imply a pin equals a boundary.

**Form state machine:** `draft → editing → step_valid → review → submitting → saved` or `save_failed`; each question can be `unanswered`, `answered`, `unknown/skipped`, `suggested`, or `farmer_confirmed`. No multiple-choice response is selected by default unless an actual persisted answer exists. Single-select controls must allow changing the choice; a deselect action is allowed only where the question semantics permit “unknown/none”. Inline validation includes the expected range/unit and preserves other answers. Each answer has provenance metadata (`farmer_provided`, `farmer_confirmed`, `prefilled_estimate`, `skipped`).

**Backend/data contract:** use typed `WizardDraft`, `FarmProfileInput` and `FieldBoundaryInput` DTOs; validate at client and service boundary. Prefetch may suggest relevant source-derived values but must never silently commit them. A save operation must be idempotent by draft/entity ID. Boundary changes are drafts until `Save boundary`; no analysis is triggered while the user is moving vertices. On save failure, retain the draft and geometry and provide retry. Continue/back transitions animate 180–240ms horizontal/fade; reverse direction when navigating back. Do not let motion delay keyboard action.

At ≤768px, map becomes a full-width panel above/below the question with a clear “Open map” sheet if space is tight; mobile browser back must not accidentally discard the draft. Focus moves to the new step heading after transition and returns to the invoking control on exit.


Create distinct entities: a **farm** is the overall operation and a **field** is a spatial management unit inside a farm. Do not use “farm” and “field” interchangeably in labels or calculations.

Farm wizard steps: (1) name and optional note; (2) country/region/location search, map pin or coordinate entry; (3) draw/import farm boundary or save location and add boundary later; (4) add fields now or later; (5) review location, area, selected units and data/service limitations; (6) save.

Field wizard steps: (1) field name; (2) boundary draw/import/select supported field outline; (3) optional crop in ground and planting date; (4) soil/water knowledge—known, estimated or not known; (5) crop history; (6) review and save.

All steps: autosave locally as drafts; show stage counter; persistent Back; Save & exit; optional Skip only where allowed; validate inputs inline; keep name values independent of map search; no surprise overwrite of existing fields; review all collected information before creation. If creation partially fails, the UI reports what was saved and resumes safely without duplicate farms/fields on retry.

<!-- SOURCE LINES 2032-2054 END -->

<!-- SOURCE LINES 3073-3078 BEGIN -->
### 42.5 Setup and re-analysis wizard

**Simple:** only required location/field, soil, water, crop history, planning horizon and priorities; optional accuracy stage described as “Answer a few extra questions to improve the assessment.” Use everyday wording and plain priority sliders.

**Advanced:** full soil lab measurements with named nutrients and units, pH scale, salinity/EC, exact irrigation/tillage terminology, structured crop management inputs, raw normalized answer data and the precise confidence factor influenced by each answer. Review must show both farmer-entered raw value and normalized representation where appropriate. Editing any answer triggers dependency analysis and flags affected results stale, but must not silently recompute and overwrite previous reports.

<!-- SOURCE LINES 3073-3078 END -->

<!-- SOURCE LINES 4112-4152 BEGIN -->
# PAGE 4 — ADD FARM / FIELD WIZARD AND REVIEW

## 39. Purpose and step-by-step structure

Farm setup is a focused wizard, not a giant form. Show one main question per step where practical, a clear progress indicator, Back at lower-left, Continue/Save at lower-right, and `Save and exit` throughout. Autosave locally after each valid input. Mark optional questions clearly; `I don't know` and `Skip` are real states that do not block completion unless a field is truly required.

The wizard supports two distinct modes: **Create** (brand-new unique blank records) and **Edit/reanalyse** (loads the selected farm/field's saved answers, opens review/edit mode and preserves historical snapshots). Do not accidentally clone old answers into a new farm or create a duplicate when editing.

Recommended question sequence:
1. Farm identity: name and optional description.
2. General location: geocoder/search, map point/centre, city/region, time zone and coordinate confirmation.
3. Field boundaries: draw/import one or more field polygons; optionally skip and label the record `Location only` with no field-specific geometry analysis.
4. Field identity/area: name, field use/type, mapped geometry area versus user-declared area.
5. Soil: known texture, lab measurements or unknown; collect source type.
6. Water access: rain-fed/irrigated/mixed, water source and reliability; keep irrigation frequency/quantity separate from presence of irrigation.
7. Crop history: repeatable dated crop records and relevant past issues; unknown history is allowed and reduces coverage/confidence where appropriate.
8. Current crop/active plan: current crop/stage if confirmed, actual planting date, expected harvest window and source. Never infer that a recommended plan is already planted.
9. Planning horizon: years, seasons or growing cycles, with Year and Season separate.
10. Priorities: water efficiency, soil restoration, resilience, suitability and productivity with plain-language tooltips.
11. Optional accuracy details: soil test data, salinity, tillage, irrigation quantity/method, organic amendment and management practices.
12. Review: every answer visible, inline editable, source-tagged.
13. Save profile or run planner: user explicitly chooses next flow.

Conditional logic avoids irrelevant questions but does not presume unknown facts. Location-based data may suggest a soil/terrain value; the farmer confirms/corrects it. A changed upstream answer marks dependent suggestions as needing review. Bad numeric input produces an inline warning instead of being silently clamped. Missing units prompt clarification. Natural-language observations remain farmer-reported, not sensor readings.

## 40. Location and boundary controls

A draggable location pin and a field polygon are different controls. Provide `Set farm location` independently from `Draw field boundary`. Location changes update coordinates/region and can prefetch supported source availability; they must not change a custom farm name. A polygon may provide a derived centre for sampling but that centre is labelled derived and doesn't overwrite the address/name. For a multi-field farm, each field can have its own polygon and input profile.

## 41. Review/autosave/finish behaviour

Persist draft and current step after valid edits. `Draft saved` appears only after write succeeds. Review shows every answer grouped by Location, Soil, Water, Crops, Management, Plan & Priorities. Each row shows value and source state: `You provided`, `Farmer-confirmed`, `Dataset estimate`, `Skipped`, `Unknown`, or `AI-interpreted—needs confirmation`. Inline edit has Save/Cancel. A missing required answer routes to the first required missing step; optional skipped answers do not block.

On exit, preserve draft and return to previous context; only discard on explicit confirmation. Refresh resumes draft. After completion, save records, activate selected farm when appropriate, and show which sources are available. Do not fabricate source data. The user can go straight to Rotation Planner with field preselected, launch Deep Analysis if enough inputs exist, or save profile and open Farm Detail. Each route explains whether an analysis has actually been run.

## 42. Wizard tests

New farm IDs and answers must be unique. Editing doesn't create duplicates. Search/pin doesn't overwrite the name. Back retains answers. Optional unknowns don't block. Required values do. Boundary invalidity blocks geometry save but not unrelated profile save if boundary is optional. Storage errors are visible. Draft refresh works. Demo data remains isolated from live profiles.

---

<!-- SOURCE LINES 4112-4152 END -->
