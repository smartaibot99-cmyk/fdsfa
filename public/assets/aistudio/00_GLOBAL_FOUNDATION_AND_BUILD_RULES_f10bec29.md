# FIELD SHIFT — GLOBAL FOUNDATION PROMPT (v8)

**Purpose:** establish immutable project-wide constraints for all page-by-page rebuilds.

This is the shared foundation, not a request to redesign every page in one pass. Load it once into the builder/project context. Then run exactly one of the page prompts at a time. The foundation governs every page, but does not authorise changing every page during a page-specific implementation task.

**Foundation responsibilities:** preserve the product's evidence-first principles; global navigation and selection state; source-of-truth data model; privacy and backend architecture; scientific calculation governance; API/DTO patterns; design tokens and materials; shared components; accessibility; audit remediation; traceability; automated tests; phased delivery and release gates.

**Important:** the original v8 source contains historical/expanded duplicate page contracts. All original sections have been assigned to the shared foundation or the relevant page prompt and are retained verbatim. Do not delete a repeated requirement merely because a similar requirement appears elsewhere; reconcile duplicates using the v8 precedence rules.


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
> Source: `Pasted text(10).txt` · original line count: 4798 · source passages assigned to this prompt: 2621 lines.

<!-- SOURCE LINES 1-416 BEGIN -->
# FIELD SHIFT — Master Product, UX, Intelligence and Engineering Plan (v8 · Research-Informed Visual Design + Per-Page Engineering Contract)


> **Version 8 update:** Builds on v7 with a research-informed visual direction grounded in curated galleries and representative sites for 3D/WebGL, scientific maps, agricultural analytics, chart storytelling, and glassmorphism. It translates those references into an original Field Shift visual system and route-by-route implementation rules. It does not instruct the builder to clone any single website or copy its proprietary assets. All earlier product, code-audit, scientific-integrity, backend, and testing requirements remain in force unless this version explicitly tightens a visual rule.



> **Version 8 research scope and limits:** Curated discovery sources index hundreds or thousands of examples; this update examined selected catalogues, representative site/case-study pages and implementation documentation, then converted recurring patterns into Field Shift-specific design contracts. It does not claim exhaustive live inspection of hundreds of individual sites. The provided WeatherWise-style image is treated as a visual reference, with its atmosphere, hierarchy, visualized trend and layered materials adapted to real farm data rather than copied literally.

**Working subtitle:** Evidence-led farm decisions, from satellite observations to practical field actions  
**Status:** AI-builder master prompt and specification; not an implementation claim  
**Scope:** Information architecture, UI/UX, existing requirements, new feature concepts, scientific and data logic, farm/field records, automation, reports, privacy, testing, and phased delivery

---


> **HISTORICAL SOURCE-CODE-AWARE PROMPT NOTES — retained for provenance; current quantified rules are in v7 (24 OCTOBER 2026)**
>
> The user has now supplied `Pasted text(7).txt`, a text dump containing 100 project file sections from the current Field Shift implementation. This version of the prompt reconciles the product plan with that source snapshot and the user-provided professional geospatial-interface reference images. Read this update and the appended **Current Codebase Audit and Mandatory Remediations** before making changes.
>
> **Implementation source of truth:** the actual supplied source establishes what is present in the code. The earlier planning attachment establishes the intended product requirements. Where code and requirements differ, preserve the intended capability, not an implementation defect. Do not assume a visible feature works just because a component or label exists.
>
> **Rebuild rule:** this is a full product and frontend redesign with logic/backend repair, not a visual reskin. Inspect and map all 100 supplied file sections first. Preserve useful crop knowledge, calculation concepts, wizard capabilities, local records, alert interactions and reusable UI patterns when they can be validated. Replace or remove hard-coded sample outputs, simulated API-success messages, inaccurate provenance, false auth/sync claims, fake loading progress and duplicate scenario implementations. Never delete valuable user functionality merely because its current visual implementation is poor.
>
> **Known high-priority source findings that must not be missed:** (1) the current map picker moves one coordinate pin and does not store farm/field polygons; the MapPanel is an illustration, not a real map; (2) only NASA POWER monthly climate and Open-Meteo current weather are visibly fetched in the source services, while other satellite/data products are listed in the UI as if active; (3) the Data Trust “API ping” is simulated with a timeout; (4) the analysis loading screen advances through a timer instead of true job progress; (5) seed farms and fallback values can appear to be real farm data; (6) localStorage is the persistence layer and the current Express server has no durable job queue/scheduler/database for scheduled analyses; (7) What-If logic has simplifying assumptions and unused inputs; (8) alerts and some farm-detail metrics use static timestamps or fixed values; (9) account and some Settings actions simulate success; (10) Undo/Redo currently means navigation history, not edit-history rollback.
>
> **Required builder behaviour:** use the full audit appendix as a corrective worklist. For each finding, either implement the correction, document a tested reason why it does not apply, or mark it blocked with a concrete dependency. Do not leave it as a future note while showing a successful UI. Any feature that cannot be implemented in the available environment must be represented honestly as planned/blocked/unavailable, not simulated as complete. The separate downloadable audit report is `Field_Shift_Codebase_Audit_2026-10-22.md`.
>
> **Validation honesty:** a static inspection of the supplied dump is not a passing build or test. Dependencies could not be installed in the review environment, so the TypeScript check did not reach meaningful project validation. The builder must run the real project's package install, build, type-check, unit/integration/e2e tests and API smoke checks in its target environment before claiming completion.

## 0A. Mandatory technical precision standard — apply to every page, component, interaction and service

This document is a build contract, not a mood board. The builder must not interpret terms such as “premium”, “cinematic”, “glassmorphic”, “clean”, “responsive”, “connected”, “accurate” or “interactive” as sufficient specifications on their own. This applies to every page-level subsection, every feature in Section 15, every reusable component, every map layer, every chart, every form, every backend service and every state transition. Each implementation must translate them into actual component geometry, design tokens, CSS properties, state machines, domain rules, typed data contracts and measurable acceptance tests. The page-level contracts in Section 30 repeat the intended treatment for each route; the tokens below are shared defaults, not a substitute for the page-specific requirements.

### 0A.1 Exact vocabulary and how to use it

Use precise web-development terminology in code-facing instructions and explain the expected result beside it:

- **Design token / CSS custom property:** a named reusable value for colour, spacing, radius, opacity, shadow, type size or motion. Use tokens rather than scattered unrelated magic numbers.
- **Layout container / max-width / gutter:** the bounded area that aligns content; state its maximum width and horizontal padding at each breakpoint.
- **12-column responsive grid:** a column-based layout where section widths are expressed as spans and change at defined breakpoints. Do not independently position every ordinary card with absolute coordinates.
- **Glassmorphism / alpha compositing:** a partially transparent foreground fill that blends with pixels behind it, normally paired with `backdrop-filter`. Specify the fill alpha separately from blur. `rgba(..., 0.74)` means 74% opaque fill and 26% transparent contribution; it does not mean “74% transparency.”
- **Backdrop blur / saturation:** `backdrop-filter: blur(16px) saturate(115%)` filters the pixels behind the surface, not the text inside it. Never use `opacity` on a whole card to fade the material because it also fades all child text and icons.
- **Scrim / gradient overlay / vignette:** a gradient placed above a photo to protect text contrast or establish focal hierarchy. It must not destroy meaningful detail in source imagery.
- **Stacking context / z-index:** explicit layering that orders photo, scrim, surface, content, tooltip, dialog and interaction affordances. Avoid accidental stacking contexts that prevent backdrop blur.
- **Visual hierarchy / progressive disclosure:** important summary first; deeper technical detail appears in an accordion, tab, drawer or expandable table without being deleted.
- **Interaction state machine:** a finite list of valid states and allowed transitions for a control, report, job, alert, task or editor. UI copy and buttons must be derived from the state, not hardcoded independently.
- **Source of truth / derived state:** persist canonical domain facts once; calculate display summaries from them. Do not store multiple contradictory copies of the same score or status.
- **DTO (Data Transfer Object) / schema validation:** the explicit request and response shape sent between browser and backend. Validate payloads at the boundary using a typed schema (e.g. Zod or equivalent); reject invalid data with an actionable error.
- **Idempotency key:** a stable request identifier that lets a retry return/reconcile with the original operation rather than create duplicate jobs, reports or tasks.
- **Optimistic UI:** show a local change before server confirmation only for safe operations, with clear pending state and automatic rollback if the save fails. Do not optimistically claim that a scheduled job or external API succeeded.
- **Stale-data invalidation:** mark a derived result out-of-date when a dependency changed; do not silently display it as current.
- **Provenance:** the source/type/date/resolution/quality and transformations behind a value.
- **Partial success:** a run where some data sources or calculations succeeded and others did not; show exactly which data is missing and how that limits the result.
- **Observability / correlation ID:** structured job logs and a stable ID used to trace a request, connector call and analysis run across services without logging secrets or unnecessary farm details.
- **Semantic HTML / accessible name / focus-visible:** use the appropriate button, link, input, table and heading elements; controls need a meaningful accessible name and visible keyboard focus.

Use these terms consistently in every page spec, API/service specification, component state list and test. Do not rely on implied meaning.

### 0A.2 Quantified design-token contract (shared across the entire product)

These are initial engineering values for the new visual system. The implementation may tune them after rendered screenshot review, but it must preserve the documented visual relationships and must not invent ad-hoc values independently in every component.

| Token | Exact initial value | Engineering intent |
|---|---|---|
| `--fs-canvas` | `#07130C` | Global forest-night canvas; the base is green-black, not blue-black |
| `--fs-surface-solid` | `#102319` | Solid forest surface where there is no image underneath |
| `--fs-surface-raised` | `#183324` | Raised surface / selected row; distinct from the canvas without a bright outline |
| `--fs-glass-strong` | `rgba(7, 20, 12, 0.88)` | 88% opaque / 12% transparent: dense inspectors, tables and small chart labels |
| `--fs-glass-default` | `rgba(8, 23, 14, 0.78)` | 78% opaque / 22% transparent: standard photo-backed panels |
| `--fs-glass-light` | `rgba(8, 24, 14, 0.64)` | 64% opaque / 36% transparent: sparse image-backed overlays only |
| `--fs-glass-hero` | `rgba(4, 14, 8, 0.34)` | 34% opaque / 66% transparent atmospheric hero tint; never put fine text directly on this alone |
| `--fs-modal-surface` | `rgba(6, 17, 10, 0.96)` | 96% opaque / 4% transparent: high-focus dialogs |
| `--fs-border-subtle` | `rgba(226, 241, 228, 0.12)` | 12% warm-white/green-tinted border alpha |
| `--fs-border-hover` | `rgba(226, 241, 228, 0.20)` | Hover separation without glow |
| `--fs-border-selected` | `rgba(128, 196, 142, 0.78)` | Selected control/panel boundary in leaf green |
| `--fs-text-primary` | `#F1F6EF` | Main text |
| `--fs-text-secondary` | `#C0CEC2` | Supporting text that must remain readable |
| `--fs-text-muted` | `#9BA99C` | Non-critical metadata only, subject to contrast test |
| `--fs-accent-teal` | `#83C58E` | Primary agricultural action / selected state; restrained leaf green |
| `--fs-accent-blue` | `#73CAD0` | Water/weather/data-series accent; do not use as the overall brand colour |
| `--fs-positive` | `#78C78B` | Positive state, always paired with label/icon |
| `--fs-caution` | `#E6B86A` | Caution / monitor; warm crop/soil sunlight accent |
| `--fs-critical` | `#E97971` | Critical state |
| `--fs-unknown` | `#9BA79C` | Unknown / unavailable / insufficient evidence |
| `--fs-radius-control` | `10px` | Small buttons, inputs and tags |
| `--fs-radius-card` | `16px` | Ordinary cards and data panels |
| `--fs-radius-feature` | `22px` | Feature/hero panels where composition supports it |
| `--fs-radius-dialog` | `22px` | Dialog/sheet silhouette |
| `--fs-blur-card` | `14px` | Default glass panel backdrop blur |
| `--fs-blur-feature` | `20px` | Photo-backed hero/side panel blur |
| `--fs-shadow-panel` | `0 12px 32px rgba(0, 0, 0, 0.18)` | Depth separation, not a glow |
| `--fs-shadow-dialog` | `0 24px 72px rgba(0, 0, 0, 0.34)` | Dialog depth |

Implementation examples:

```css
.fs-glass-panel {
  background: var(--fs-glass-default);
  -webkit-backdrop-filter: blur(var(--fs-blur-card)) saturate(115%);
  backdrop-filter: blur(var(--fs-blur-card)) saturate(115%);
  border: 1px solid var(--fs-border-subtle);
  border-radius: var(--fs-radius-card);
  box-shadow: var(--fs-shadow-panel);
}

/* Fallback: preserve contrast and hierarchy if backdrop-filter is unsupported. */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .fs-glass-panel { background: #0D2015; }
}
```

Do not apply glass at one opacity everywhere. Use 88% opacity when a dense inspector/table must remain legible; 78% for normal panels over a cinematic image; 64% only where the background is quiet/dark and content is sparse; 96% for dialogs. An alpha value is not a substitute for checking text contrast against the actual composite background. Use a darker scrim or stronger surface if photographs vary behind text.

**Version 8 palette/material precedence:** the Version 8 values in the table immediately above supersede inherited blue-green/teal values and any older duplicated token tables below. When a page paragraph carries a legacy exact fill/radius that conflicts with the shared token, prefer the canonical token unless the paragraph explains a deliberate exception (for example, a dense inspector surface that must be more opaque). Do not leave two independent definitions for the same CSS custom property in the shipped code.

### 0A.3 Global layout, spacing and typography tokens

- **App shell:** `min-height: 100dvh`; desktop top navigation height `64px`; content uses a `min(100% - 2*gutter, 1480px)` container. Do not shrink the desktop content into a narrow centered column without a page-specific reason.
- **Responsive breakpoints:** validate at 1600, 1440, 1280, 1024, 768, 430, 390 and 360 CSS px. Treat these as required test widths, not the only supported sizes. Prefer CSS Grid/Flexbox and content-driven wrapping; avoid fixed absolute positioning for main content.
- **Desktop gutters:** 36–44px at ≥1440px; 28–32px at 1280px; 24px at 1024px; 20px at 768px; 16px at 390px; 12px at 360px. Page-specific map/wizard layouts may use their own internal gutters, but must state them.
- **Spacing scale:** use 4, 8, 12, 16, 20, 24, 32, 40, 48 and 64px. Use a token for every repeated margin, padding and grid gap. Avoid values like 17px or 29px unless a documented optical correction requires them.
- **Typography scale:** metadata 12px; compact label 13px; body 14–16px; card heading 16px; section heading 20px; page heading 30–36px; hero heading 40–48px. Mobile page heading 26–30px and hero 32–38px. Use weight 400 for body, 500 for controls, 600 for headings, 300–400 for cinematic hero headlines. Use tabular numerals for aligned telemetry and score values.
- **Line length:** ordinary paragraph measure 45–75 characters; avoid placing long paragraph blocks over high-detail imagery. Provide a readable opaque/strong-glass region if the copy cannot meet contrast over the image.
- **Icon geometry:** line-icon set consistently (Lucide or equivalent), normal stroke around 1.75–2px; 16px inline, 18px button, 20–24px section icon. Never use emoji as interface icons.
- **Control sizing:** standard button/input minimum height 40px desktop; touch controls minimum 44×44px; icon-only controls have an accessible label and tooltip. Primary action is visually distinct from secondary and destructive actions.
- **Cards:** one card answers one question. No gratuitous `card inside card inside card`; group with spacing, headings, dividers and surface elevation. Normal corner radius 16px, feature radius 16px. Do not put 3D/glow treatments on every card.
- **Contrast:** enforce WCAG 2.2 AA targets: normal text ≥4.5:1, large text ≥3:1 and essential non-text controls/graphical cues ≥3:1 with adjacent colours. Check composited text over images at darkest and brightest parts; if it fails, change the scrim/surface rather than lower readability.

Carbon's spacing/type guidance and W3C WCAG contrast requirements are useful validation references; use them as engineering constraints rather than blindly importing their visual styles. `backdrop-filter` support and rendering semantics must follow browser behaviour; it filters pixels behind a transparent surface, so a solid fallback is required. See research sources at the end of this version.

### 0A.4 Cinematic image/3D/animation vocabulary

Use **photographic art direction** rather than “add nice images.” For every requested image asset specify: intended subject; camera angle/altitude; crop/aspect ratio; focal point; light temperature/direction; contrast grade; saturation; allowed crop; source/licence; image alt text; responsive variants; and whether the image is decorative or communicates data. The image must not contain pre-rendered interface text, logos or fake measurements.

Use full-bleed or wide cinematic imagery selectively: Home hero, optional farm-detail cover, rotation crop photography, field brief cover and other places where image content supports the task. Map basemaps and raster layers are real analytical data and must not be treated as decorative backgrounds or tinted to match the UI. Deep panels over photos use the defined glass tokens; data-dense tables use stronger material or solid surfaces.

Use the term **parallax** only where a controlled foreground/background offset is explicitly needed; if not, use a slow atmospheric image drift. Any 3D object must have a stated purpose, input/output, camera/lighting model, fallback static render and performance budget. A 3D soil column is a labelled conceptual model, never falsely presented as an in-situ scan. Use SVG for chart geometry, CSS transitions for small control feedback, and motion libraries for page/layout transitions. Avoid perpetual movement of content that competes with data.

### 0A.4A Research-informed visual synthesis — source patterns to adapt, not copy

The user supplied a weather-dashboard reference with a cinematic cloud/sky background, oversized current value, restrained glass surfaces, small location tiles, a map/globe element, and a smooth forecast curve. Treat it as a **visual-material reference**, not a template to clone. The Field Shift adaptation replaces city weather as the main story with a farm/field, the agricultural condition, evidence freshness, and the next decision.

The research pass used curated directories that index hundreds of web projects, including SiteInspire's interactive-design catalogue, Godly's design gallery, Three.js Resources' catalogue of 107 live Three.js examples, mesh3d's selected Three.js experiences, and CSS Design Awards' WebGL category. It also examined representative live-page text and case studies for Bruno Simon's interactive 3D portfolio, NASA's 3D Earth interactives, Global Fishing Watch's data-rich map, Our World in Data's chart-exploration controls, Fieldwise's precision-agriculture UX, MapLibre's terrain/globe examples, and current glassmorphism engineering guidance. This is a **curated research scan**, not a claim that every site in every directory was individually opened and reviewed. Use the linked source catalogue to continue discovery when needed; verify a chosen reference directly before basing implementation on a specific interaction.

**Patterns to borrow and how Field Shift must adapt them:**

1. **Cinematic environment, WeatherWise-style:** full-bleed/wide photography, focal light, large concise values, and a thin trend curve make a complex view memorable. Use this on the Home weather/condition feature card, a compact field-condition overview, and selected crop-season panels. Replace generic dramatic storm imagery with farm-relevant aerial crops, soil texture, irrigation water, dawn/dusk field light, or real weather imagery tied to the selected location/state. Do not make Home a promotional landing page.
2. **Atmospheric haze behind headings:** create a separate pseudo-element or absolutely positioned texture layer behind hero copy. A blurred radial gradient/low-opacity cloud texture may feather into the photo, but do **not** blur the glyphs, reduce the text element opacity, or position an unmasked bright cloud edge directly behind small text. Example starting range: white/sage haze opacity `0.06–0.14`, a 24–40px blurred pseudo-element, and a directional dark scrim strengthened until contrast passes. Haze is limited to image-backed hero surfaces, not dense data views.
3. **Layered glass material:** a transparent dark surface plus `backdrop-filter` creates depth when something visually meaningful sits behind it. Use no more than **2–3 glass layers per viewport** as a practical ceiling; raise fill opacity before stacking more blur. Standard photo-backed panels use 78% opaque fill and 14px blur; sparse overlays may use 64% opaque and 18–20px blur only over reliably dark/quiet photography; dense data uses 88% opaque or a solid surface; dialogs use 96% opaque. Opacity applies to background fill only, never the entire card. Keep borders light and neutral, not glowing.
4. **Scientific 3D and geospatial interaction:** NASA Eyes and MapLibre examples demonstrate the value of a spatial model that is explorable, time-aware and connected to real map layers. For Field Shift, spend 3D budget on the map (optional 2.5D terrain/tilt, elevation context, field polygons) and at most one labelled conceptual soil/root profile. Avoid a permanently spinning 3D object that adds no decision value. A conceptual soil cutaway must be labelled as explanatory, not an actual scan of the field.
5. **Operational data maps:** learn from Global Fishing Watch's searchable, filterable data layers and explicit feature inspection. Field Shift Maps should make the map the primary surface, with a compact layer picker, field-boundary controls, a clear legend, map attribution, and a contextual inspector that appears after selecting a farm/field. Hide irrelevant layers instead of turning on all data simultaneously. Preserve a stable basemap and make satellite/terrain/soil/vegetation layers visually distinguishable.
6. **Charts as explorable tools:** Our World in Data's Grapher supports changing view, full-screen inspection and data/source access. Field Shift charts should let users change time range or series when meaningful, inspect points, see units/time windows/source freshness, open a full-screen/detail view, and access a data table/export only when the underlying data is actually available. Never use a decorative graph with invented values. For observed vs forecasted values, use distinct strokes/patterns and explicit labels.
7. **Agriculture-specific UX:** Fieldwise's precision-agriculture case study groups crop growth, soil moisture, water stress, weather and pest data into categorized layers and action-oriented reporting. Keep this as a primary relevance check: every layer, metric and card must answer a farmer's question, and each alert/recommendation must lead to its field, evidence and next action.
8. **Immersive 3D site artistry:** Bruno Simon, mesh3d and WebGL award galleries show how interaction, object depth, shader material and scroll motion can create a memorable brand. For Field Shift, adapt the sense of depth, controlled entrance, materials and smooth focus transitions—not game-like navigation, loud cursor gimmicks, compulsory long scroll stories or heavy full-screen WebGL that delays the working dashboard.
9. **Chart and dashboard restraint:** structured dashboard guidance warns against random layouts, unnecessary colors and effects that obscure the message. In the working app, data hierarchy outranks decoration; 3D, gradient, glow, parallax and animated curves are optional accents, not mandatory decoration for every card.

**No direct visual cloning:** never lift another site's source code, branded graphics, exact layout or copyrighted imagery as a shortcut. Rebuild common interaction patterns using Field Shift's own tokens, data, content hierarchy, crop imagery and brand language. For imagery, check license/permission and retain attribution where required. A user-supplied reference image may guide treatment but must not cause the builder to reproduce the entire page pixel-for-pixel.

### 0A.4B Original Field Shift art direction — component and effect contract

**Brand feeling:** quiet scientific confidence; forest-night agriculture; real land under changing conditions; cinematic but useful; tactile layered materials; no neon, gaming HUD, space-console blue, or generic “AI glow”. The interface should feel like a precision agriculture instrument that happens to be visually beautiful.

**Atmospheric feature surfaces:** use one or two photographic panels on a typical Home viewport. Photography should be high quality, contextual and non-repetitive. Suggested subjects include a real aerial field pattern, close crop canopy at golden hour, drip irrigation on dry land, a soil cross-section photo, or distant farmland under a weather front. Grade toward deep forest green and charcoal with natural warm highlights, not a monochrome green filter that destroys detail. Use `background-size: cover`; document `background-position` per asset; apply a dark directional gradient over the copy side; keep critical metrics on a solid/strong-glass inset when light/dark background variability is high.

**The “clouded text” treatment:** the haze layer sits behind the headline, never on top of the actual glyphs. Implement it with a decorative `::before` layer (or separate `<span aria-hidden="true">`) using a low-alpha radial gradient and/or licensed cloud texture, `filter: blur(24px–40px)`, optional `mix-blend-mode: screen` only if contrast remains stable, and `pointer-events: none`. Mask/fade its edges with a radial or linear gradient. Put the title in a separate higher z-index layer. The text itself remains sharp with normal opacity and no `filter: blur()`. On mobile or reduced-motion mode, keep the same haze as a static low-opacity gradient or remove it.

**Gradient rules:**
- Brand/environment gradients: forest green → deep pine → canvas black, broad and subtle.
- Natural light gradients: restrained amber/clay → transparent, used behind crop or terrain imagery.
- Water data: cyan/teal in measured rainfall/moisture series only.
- Condition gradient: may communicate Good → Needs Attention → Alert in a narrow status rail or map legend; use labelled statuses and a marker, not a whole page tint.
- Never place a gradient behind dense table cells or use it as the only method to convey data categories.

**Elevation and focus:** differentiate layers using surface brightness, border, shadow and blur—not by giving every object a neon outline. Card hover may translate 1–2px and increase border alpha slightly. Selected field/rotation gets a restrained leaf-green border plus selected icon/label. Keyboard focus must use a high-contrast visible ring that meets non-text contrast requirements. Avoid hover-only information; touch and keyboard users receive equivalent detail.

**Photography and crop cards:** use a single registry mapping crop IDs to licensed/approved image paths and alt text. A crop card's image must match the named crop; do not use one generic field image for wheat, lettuce, beans and maize. Use consistent image aspect ratios and `object-position`. Apply a bottom/side gradient only for readable labels, not to hide poor cropping. If a crop image is missing, show an intentional solid illustrated fallback with the crop name, not an unrelated photograph.

**Map material is not background art:** do not overlay a cinematic photo on top of live map tiles or apply a global color grade that distorts geospatial colors. Map contrast comes from map style, layer opacity, selected polygon outlines, accessible legend, and surrounding panels. Use a real satellite basemap only when the selected provider supplies it; standard street tiles must never be labelled as satellite imagery.

**Chart grammar:**
- Line chart: one continuous metric over time. Observed/history uses a solid stroke; forecast uses a dashed stroke and a forecast label. Add threshold/baseline only when the threshold/baseline is defined.
- Bar chart: discrete daily/weekly/monthly rainfall totals, irrigation events, or crop-stage comparisons.
- Stacked horizontal bar: breakdown of rotation scoring components, with each component named and an accessible tooltip/legend; do not use an unlabeled rainbow stack.
- Small sparkline: trend context only when the underlying series exists; show metric and time range in nearby text.
- Map heat layer: spatial distribution only when underlying spatial observations/model estimates exist; include source date, resolution and legend. A regional estimate must not masquerade as a field measurement.
- Radar/spider charts, 3D chart columns, decorative area fills and ambiguous radial gauges are not default choices. Use them only if a specific comparative question is clearer than with a bar/line/table.
- Every chart gets a useful title, units, time range, source/freshness, tooltips or keyboard inspection, and a textual/table alternative where needed.

**Micro-interactions:** use CSS transitions for buttons/cards/segmented controls, Motion (or equivalent) for restrained route/state transitions, GSAP ScrollTrigger only for a genuinely scroll-driven narrative outside dense data workspaces, and Three.js/React Three Fiber only for a specific meaningful 3D object/map extension. No custom cursor requirement. No auto-playing audio. No perpetual particle systems, breathing glows or background animations behind data. Avoid animating layout-heavy or blur-heavy properties at high frequency.

**Fallback and performance:**
- For glass, implement a solid-color fallback using `@supports not (backdrop-filter: blur(1px))` and keep text contrast unchanged.
- Load hero photography responsively; lazy-load below-the-fold images; specify intrinsic dimensions/aspect ratio to prevent layout shifts.
- Defer 3D/map-heavy modules until the route or panel is needed; retain a static preview or standard 2D map fallback when WebGL is unavailable.
- Pause non-essential animations when the panel is offscreen and honor `prefers-reduced-motion`.
- Do not animate CSS `filter`/`backdrop-filter` continuously; use opacity/transform for small transitions.
- Treat a visual effect as successful only if the UI remains legible on bright cloud, pale soil, satellite imagery, loading, empty, partial and error states.

### 0A.4C Pattern-to-route implementation matrix — mandatory mapping

| Field Shift surface | Research-informed visual pattern | Required Field Shift implementation | Avoid |
|---|---|---|---|
| Home / selected farm | Weather dashboard composition; cinematic nature photography; compact metric cards | A compact farm condition + weather feature with photo, sharp title, one clear current/recent value, timestamp, subtle trend curve only when data exists; lower operational cards for field status, urgent actions, and an expandable map preview | Consumer-weather clone, giant marketing hero, fake forecast curve, putting all metrics on the photo |
| Home map preview | Spatial preview / MapLibre camera animation | A real map crop/field polygon preview; click opens Maps and preserves selected farm/field; clearly label the current map layer | Decorative static map image pretending to be interactive |
| Maps | MapLibre terrain/layer examples; Global Fishing Watch filters and inspection | Full-height/large map canvas; search; drawing controls; layer list; legend; field/farm selection; side inspector; supported satellite/terrain/vegetation/moisture layers only; clear attribution and source date | Many simultaneous layers, fake terrain precision, decorative overlay obscuring map facts |
| Crop Rotation Planner | Editorial crop imagery; clear data-story cards; score decomposition | Stepwise questionnaire, progress, explicit priority weights, rank-ordered rotation candidates, component score bars, crop-matched images, concise pros/cons, compare-two-plans view | Neon score dials, made-up precision, dozens of tiny cards, image without matching crop |
| Rotation detail | Visual timeline; clear component chart; crop photography | Sequence/timeline with each crop stage, timing window, fit score/evidence, pros/cons and assumptions; link to individual field and calendar entries | Using colour alone for crop stage; unsupported dates or yields |
| Deep Analysis | Scientific dashboard; OWID-like inspectable charts; evidence drawer | Top summary with separate condition/evidence-confidence/data-readiness concepts; field-by-field findings; time-series with unit/date/source; finding-to-action flow; expandable technical provenance | One unexplained composite score, decorative graph, raw telemetry wall |
| Report history | Data comparison with source/version access | Compare two dated immutable reports; show changed inputs, changed observations, missing source changes and model version | Presenting changed source availability as true farm improvement/worsening |
| What-If Simulator | Interactive scenario controls and compare view | Clear baseline vs scenario, editable assumptions, recomputed result, visual deltas with units and assumptions, save as scenario without overwriting real farm data | Treating hypothetical projections as observed outcomes |
| Calendar & Actions | Clean editorial timeline / task list | Date-based events, compact action cards, status/type icon, links to field/report, filters and calendar/list toggle | Heavy photograph behind task dates or decorative charts in task rows |
| Global Farming Network | Interactive public data map, discover/filter/inspect | Public farm geography shown at city/region level only; regional aggregated status; search/filter; profile/detail panel; user farms separate; private exact coordinates never exposed | Pinning exact private farm location, inventing public farm condition, red/green without labels |
| Data & Trust Centre | OWID source view and scientific provenance | Source availability, data age, source/variable/units/resolution, method, quality, limitations, cache status and honest refresh/error state | “API connected” simulations or treating a static status animation as real telemetry |
| Add Farm / Add Field | Guided form workflow | Map-backed geometry input, clear step state, input validation, field-specific setup; save state visibly | Over-designed 3D wizard, inaccurate area estimates without polygon measurement |
| Settings / schedule | Calm forms and system status | High-contrast solid surfaces, clear privacy/persistence/scheduler status, confirm destructive actions, honest unsupported-feature state | Glass on every control, fake account/cloud-sync success |

All route-level page contracts below inherit this matrix. Where earlier text conflicts with this matrix, use the matrix and the more specific Version 8 override; do not remove any product/domain requirement to achieve the look.

### 0A.5 Every page must have an implementation card

For each page and major subview, the builder must explicitly record all of the following—not rely on a global reference alone:

1. Route and parent route; purpose; primary user question.
2. Desktop composition as named layout regions, their order, grid span/ratio, approximate dimensions and alignment anchors.
3. Tablet/mobile reflow rules; what becomes a drawer, sheet, tab, stacked section or horizontally scrollable data region.
4. Component inventory with each component's exact label/content, semantic role, visual surface token, opacity/transparency, blur, border, radius, padding, typography, z-index and image treatment.
5. Content hierarchy; above-the-fold priority; progressive-disclosure rule; where advanced detail lives.
6. State contract: initial/empty/loading/ready/partial/stale/error/disabled/saving/saved/unsaved/permission-denied states that actually apply.
7. Interaction contract for every visible button, link, tab, hover, select, keyboard action and context-menu action.
8. Domain calculation/input dependencies; formula/version/units if numerical; source/provenance and uncertainty; invalidation triggers.
9. Backend service/API call, request DTO, response DTO, validation, authorization, idempotency, cancellation, retry/timeout and error response where remote work is needed.
10. Persistence semantics: local-only, local draft, immutable server report, versioned entity or transient scenario; specify rollback on failure.
11. Cross-page effects: records/cards/reports/alerts/calendar/routes affected; preserve context and mark dependent results stale where necessary.
12. Acceptance tests: screenshot geometry, values/logic, state transitions, keyboard/screen-reader, viewport, API failure and cross-page consistency.

The builder may not mark a page or feature “complete” merely because it looks correct. Its visual contract, interaction contract, data contract and test contract must all pass.

---

## 0. Executive direction

Field Shift should evolve from a tool that generates a crop rotation into a connected agricultural decision-support platform. Its main value is not the quantity of charts or the number of pages. Its value is the connection between:

1. the farm and the fields the farmer actually manages;
2. the environmental and soil evidence available for those places;
3. the crops, rotations and management practices being considered;
4. the current assessment of each field and the farm as a whole;
5. the recommended actions and the farmer's decision to take, defer or reject them;
6. later assessments that show what changed, what evidence changed, and what should be reviewed next.

The product should answer six practical questions:

- **What is happening on my farm?** — Home and Farm Tracker.
- **Which rotation best fits each field, and why?** — Crop Rotation Planner.
- **What condition is each field in, what are the risks, and what changed?** — Farm Intelligence and Deep Analysis.
- **What if I change a decision or conditions change?** — Scenario Simulator.
- **What should happen next, and when?** — Calendar and Action Centre.
- **Where did this conclusion come from, and how reliable is it?** — Data & Trust Centre.

The new features should reinforce one another. An irrigation routine entered once can inform water-balance estimates, rotation comparisons, a scheduled Deep Analysis, a relevant alert, a task, and a later report comparison. The same routine must not be copied into six disconnected versions of the truth.

This plan intentionally goes beyond the original attachment with additional product ideas, while preserving its established requirements. It distinguishes existing requirements, new proposals, and items that must remain unavailable until sufficient evidence or a working data connection exists.

## 1. Product rules that govern every page

### 1.1 Evidence before appearance

A polished interface must never make uncertain or missing evidence look exact. Every analysis-derived value should be traceable to its source or to the calculation that generated it. The system must distinguish:

- directly observed or measured data;
- remote-sensing products;
- modelled or reanalysis estimates;
- farmer-reported facts and practices;
- values inferred from a dataset or regional prior;
- Field Shift calculations;
- scenario-only assumptions;
- demonstration data.

A modelled soil-moisture estimate must not be labelled as a direct satellite measurement. NDVI must never be generated from rainfall as a substitute for actual vegetation data. A fixed global number must not be presented as a farm-specific trend. A named scientific formula may only be claimed when the implementation actually uses that formula and its required inputs.

### 1.2 Confidence is not the same as suitability or health

Keep these concepts separate:

- **Rotation match/suitability:** how well a crop sequence fits the available farm conditions and the user's priorities.
- **Evidence confidence:** how strongly the available data support the assessment.
- **Field condition indicators:** individual supported assessments such as water stress, vegetation trend, heat exposure, or a soil property.
- **Farm Condition Index:** an optional composite summary, only calculated if its components, weights, missing-data rules and validation are documented.

A rotation can have a moderate match with high confidence. A candidate can have a high estimated match with low confidence. A high score must not imply high certainty.

### 1.3 One source of truth

Changing the selected farm or field must update all relevant cards, comparisons, calendar items, alerts and reports. The app must not show one farm's weather beside another farm's soil. The crop sequence and planting dates must agree wherever the plan is displayed.

### 1.4 Plain language first; scientific depth on demand

Simple Mode explains conclusions and next steps in everyday wording. Advanced Mode reveals more of the same underlying results: source metadata, formulas, units, spatial resolution, intermediate values, uncertainty, model versions and thresholds. Modes must not silently use different calculations.

Every specialised term should have a short, accessible definition through an information icon or glossary. Every percentage, score and quantity should state what it means, use clear units, and provide context. Technical details belong in expandable sections instead of being deleted.

### 1.5 No fake completeness

If a data connector fails, show a partial result and explain what was affected. If a value cannot be calculated, show “Unavailable” plus the missing requirement. If no suitable crop sequence passes the hard constraints, say so and explain what would need to change. Never make up an answer just to fill a card.

### 1.6 Useful motion, not decoration

Motion should confirm an action, explain a transition or maintain context. Use gentle page and question transitions, loading progress tied to real pipeline stages, chart entrance once, selected-state feedback, and small layout transitions. Avoid floating ornaments, constant animated glows, parallax, excessive gradients and motion that reduces readability. Respect reduced-motion settings.

### 1.7 Every control must work

No decorative buttons pretending to be functional. A button either completes its labelled action, is clearly disabled with a reason, or is not shown. Every crop, alert, score, chart point, task and “View details” affordance should lead somewhere useful.

---

## 2. Final proposed information architecture

The original attachment includes several historical navigation versions. The plan resolves them around the most recent product direction: Home is a daily tracker; crop planning and Deep Analysis are separate workflows; the simulator is a sandbox, not an analysis dashboard.

### 2.1 Primary navigation

1. **Home** — daily summary and urgent context.
2. **My Farms** — portfolio, farm boundaries, fields and farm records.
3. **Farm Intelligence** — Deep Analysis, dated assessment reports, farm/field scores and historical changes.
4. **Rotation Planner** — setup questionnaire, candidate generation, rankings, detailed plans and head-to-head comparison.
5. **Simulator** — hypothetical climate, water and (later) economic scenarios.
6. **Calendar & Actions** — planting windows, upcoming operations, tasks and reassessment dates.
7. **Data & Trust** — data sources, freshness, methodology, provenance, confidence and limitations.

Settings, profile, help and notifications should be reachable from consistent global controls, not consume the primary navigation unnecessarily. On smaller screens, collapse the primary navigation into an accessible menu or bottom tab layout without hiding the current farm context.

### 2.2 Naming that reduces confusion

- Replace a vague primary “Analysis” action with **Plan Crop Rotations** or **Create Rotation Plan**. This tells users that the wizard is for creating and comparing rotations.
- Use **Farm Intelligence** as the dedicated monitoring and diagnostic workspace.
- Use **Run Deep Analysis** for a full reassessment of current farm/field conditions.
- Use **Refresh Data** for a lighter data refresh that does not automatically imply a full reanalysis.
- Use **Simulator** or **What-If Simulator** for hypothetical scenarios.

The distinction should be consistent in the navigation, buttons, breadcrumbs, report titles and notifications.

### 2.3 Global app shell

A restrained top bar should include the FIELD SHIFT identity, current farm/field selector where relevant, global search/help, notifications with an unread count, and profile/settings. Show the active navigation item clearly. Keep the header compact rather than repeating a large promotional hero on every page.

Use breadcrumbs on deep pages, such as `My Farms / Al Marjan Farm / Field 02 / Soil & Land`. Persistent context should include the selected farm and, where applicable, the selected field. Switching the farm should warn only when unsaved edits would be lost; otherwise it should be immediate.

### 2.4 Contextual navigation

The same record should be reachable from anywhere it is mentioned. Selecting “Wheat” from a calendar cell, rotation timeline, report, alert or recommended action should open the correct farm, field, plan and crop stage—not a generic crop page. If multiple fields have wheat concurrently, show each relevant instance clearly rather than guessing which one was intended.

---

## 3. Core information model: make every feature share the same records

This is the central structural decision. Many future features become much easier once the data model is built around farms, fields, evidence and dated decisions.

### 3.1 Entities

**Farm**
- Stable ID, display name, location, timezone, units, boundary, total area and user-defined notes.
- One farm can contain multiple individually managed fields/parcels.
- Farm-level information should never override field-specific inputs where fields differ.

**Field**
- Stable ID, parent farm, name/label, polygon boundary, calculated area, location centroid and any subfield zones if needed later.
- Own soil profile, crop history, rotation plan, irrigation method/availability, farmer observations, analysis reports and tasks.
- Boundary edits create a record of the change, because area and sampled environmental pixels may change.

**Farm/field profile fact**
- Key, value, unit, depth or area basis, source, collection/observation date, retrieval date, provenance category, confidence/quality, notes and who confirmed it.
- Examples: reported soil texture, lab pH result, estimated soil organic carbon, irrigation limit, previous crop, soil test date.
- Preserve the original input when an AI parser normalises it. Do not overwrite the source statement silently.

**Environmental observation / model output**
- Dataset and product identifier, variable, value, units, valid time, retrieval time, spatial cell/pixel/resolution, quality flags, processing version and source URL/reference.
- Mark observations, forecasts, reanalysis and modelled products differently.

**Crop knowledge record**
- Crop ID, common and scientific names where supported, crop family, annual/perennial behaviour, temperature/GDD requirements, planting windows, stage lengths, water-demand parameters, pH/salinity/drainage tolerances, disease-host relationships, nitrogen effects, evidence sources and parameter confidence.
- Unknown crop parameters remain explicitly unknown. Do not infer a complete crop profile from the crop name alone.

**Rotation plan and version**
- The ordered crop sequence, field ID, length/horizon, crop duration, seasonal planting and harvest windows, constraints, score components, overall score, trade-offs, risks, action timeline, input snapshot, engine version, crop-library version and generated timestamp.
- Saving a different plan creates a new version or a new plan. It must not rewrite the historical plan silently.

**Analysis run / report**
- Trigger type (manual or scheduled), farm and fields included, input snapshot/version, environmental data snapshots and timestamps, calculation version, source coverage, per-field results, farm summary, confidence, findings, recommendations, execution logs and outcome state.
- A report remains understandable even if a live connector becomes unavailable later.

**Action/task**
- Source recommendation or alert, associated field/crop/stage, description, evidence and reason, due window, priority, status, user notes, completed date and whether it changes a stored farming practice.
- Suggested is not the same as accepted or completed.

**Alert**
- Rule/type, severity, field/farm, active period, evidence, threshold, observation time, source, confidence, recommended action, status and prior history.

**Farmer practice and observation event**
- What happened or is expected to happen, affected field, time/window, amount and units if known, input method (typed, selected, imported), original natural-language statement, parser output, parser confidence and user confirmation status.
- Separate a recurring routine (e.g., irrigation every three days) from an actual event (e.g., irrigation occurred this morning).

**Scenario**
- Baseline report/version, changed assumptions, resulting calculations, results snapshot, created date and limitations. Scenarios never mutate real farm records unless a user deliberately applies a supported change.

**Automation schedule**
- Scope, cadence, timezone, next run, consent record, data payload policy, farmer-practice confirmation date, pause/retry rules, notification choices, last run status and deletion/disable state.

### 3.2 Versioning and reproducibility

Every analysis-derived page must be able to answer: Which inputs, source data, formulas, weights, crop parameters and engine version generated this result? The report should capture an immutable input/evidence snapshot sufficient to reproduce the calculation, subject to licensing and storage constraints.

If an algorithm or crop parameter changes, do not rewrite the past silently. Clearly label comparisons that cross model versions and either show the original as-run result or explicitly recalculate both periods on a common version where technically justified.

---

<!-- SOURCE LINES 1-416 END -->

<!-- SOURCE LINES 831-869 BEGIN -->
## 9. Alerts, actions and the farm decision loop

This layer makes Field Shift useful after it has produced a recommendation.

### 9.1 Alert lifecycle

Use an explicit state model: New → Active → Acknowledged → Resolved; with separate Snoozed and Dismissed states where appropriate. Dismissal should not falsely mean the underlying condition was corrected. The system may reopen an alert if the rule triggers again after resolution, with a record of the earlier event.

Deduplicate repeat signals from the same cause; track onset, persistence, severity, evidence freshness and confidence. Use thresholds justified by crop parameters or documented assumptions. Do not generate a confident diagnosis from one vague vegetation signal.

### 9.2 Alert detail

Every alert includes:
- clear title and plain-language description;
- farm/field/crop stage;
- severity and why it qualifies;
- value, units, source, observation period and resolution;
- historical baseline and difference from normal if supported;
- the rule/evidence that triggered it;
- confidence and alternative explanations;
- recommended action, timing and how to verify the result;
- when it began, last updated and status history.

### 9.3 Actions and tasks

Turn accepted recommendations into tasks with clear verbs, due windows, field/crop context and evidence. Examples may include inspecting a field after a risk alert, reviewing an irrigation plan, obtaining a soil test, confirming crop dates or reassessing a rotation at its review point.

Task states: Suggested, Accepted, Scheduled, In progress, Completed, Deferred, Dismissed. A task may be complete because the farmer carried it out, but the underlying alert may remain until the next assessment verifies that the condition changed. Keep those concepts separate.

### 9.4 New feature: recommendation feedback loop

When a user completes or rejects a recommendation, optionally collect a short reason: “completed,” “not relevant,” “not feasible,” “already done,” “waiting for conditions,” or free text. Use this to improve the relevance and transparency of future suggestions, not to secretly change scientific parameters. Any learning that changes a model should be versioned and validated separately.

### 9.5 New feature: practical field journal

Let users record observations (e.g. visible dry patches, pest noticed, sowing completed, irrigation applied) with date, field, optional photograph, notes and crop stage. Label this as farmer-reported and distinguish it from satellite or instrument measurements. Link journal entries to alerts and later reports so farmers can see the context around a change.

---

<!-- SOURCE LINES 831-869 END -->

<!-- SOURCE LINES 977-1125 BEGIN -->
## 13. Data source and agronomic logic plan

This section turns the attachment's proposed integrations into a research-aware implementation plan. A connector is not considered integrated until it is tested end-to-end.

### 13.1 Core source roles

| Source | Proposed role | Important limitation / design rule |
|---|---|---|
| **NASA POWER** | Historical/daily climate and solar variables, reference inputs for climate features and water-demand calculations | Native spatial resolution varies by parameter; it is climate-context evidence, not a field weather station. Cache at native grid/time granularity and label timestamps/time standard. |
| **NASA SMAP L4** | Surface and root-zone soil-moisture estimates/model analysis | L4 root-zone values combine satellite observations with a land model; they are not a direct measurement taken in the exact field. Published product is 9 km, 3-hourly. |
| **NASA MODIS vegetation indices** | Longer-term vegetation history/seasonal comparison | Common NDVI product has 250 m 16-day compositing; too coarse for many small farms. Apply quality flags and disclose pixel-to-field mismatch. |
| **Copernicus Sentinel-2** | Potential higher-resolution vegetation monitoring and field change analysis | Level-2A has bands at 10/20/60 m; valid analysis requires appropriate cloud/scene masks and correct processing. Revisit is not a guarantee of a usable cloud-free image. |
| **NASA GPM IMERG** | Precipitation signal and cross-check | Common gridded products are about 0.1° (~10 km), with 30-minute or daily products; local rainfall can differ from a grid cell. |
| **NASADEM** | Terrain/elevation and slope context | Approximately 30 m elevation data; derived slope and erosion susceptibility need the chosen model and assumptions disclosed. |
| **GRACE / GRACE-FO** | Optional regional groundwater/total-water-storage context | Coarse regional context only, not a field-level well-level or irrigation-supply measurement. |
| **ISRIC SoilGrids** | Soil texture and selected soil-property priors where access is available | External/non-NASA, model-derived estimates with pixel uncertainty. Do not treat as a lab test. The SoilGrids REST API status must be checked at implementation time; current official documentation warns that access is beta/unstable and has reported service suspension. |
| **Weather forecast provider** | Explicit current/future short-range forecast | Store separately from historical observations/reanalysis; keep forecast issue time and valid time visible. |
| **Farmer/lab records** | Field-specific soil measurements, crop history, irrigation events, yields and observations | Preserve dates, units, method, and farmer-reported vs independently measured status. |

### 13.2 Source resolution is a UI requirement

Do not merely disclose spatial resolution in a bibliography. Use it in the product:
- compare dataset grid/pixel size with the field polygon;
- warn when a field is substantially smaller than the supporting grid;
- prevent a regional value from being styled as a field-specific measurement;
- avoid fake pixel-level precision when summarising a polygon smaller than the sensor footprint;
- show valid-pixel coverage for satellite imagery when possible.

### 13.3 Data pipeline

Use a provider-neutral connector interface. Each connector should support request validation, timeouts, retries, normalisation, metadata, quality flags and consistent error states. Recommended sequence:

1. Validate coordinates/boundaries and requested period.
2. Resolve native grid cells and dataset requirements.
3. Check cache for the matching cell, variable and time window.
4. Fetch data from eligible connectors with provider-aware concurrency/rate limits.
5. Validate units, sentinels/fill values, bounds and temporal continuity.
6. Apply source quality flags and remove unusable pixels/dates.
7. Cross-check overlapping sources when appropriate; flag disagreement instead of silently averaging.
8. Record provenance and quality.
9. Derive features and models.
10. Generate confidence/coverage summaries and results.
11. Store the report snapshot and connector log.

Historical data may be cached for long periods when allowed. Recent data needs a shorter time-to-live. Cache by native grid/cell + variable + product/version + time window—not just arbitrary coordinate precision. Respect provider fair-use policies and terms.

### 13.4 Fallback ladder

For each variable, define an allowed source order. A possible default is: best suitable direct/remote-sensing product → suitable modelled/reanalysis source → defensible regional climatology/prior → unavailable. Demonstration values must be restricted to demo mode and visually labelled. Every fallback records its provenance and reduces confidence according to an explicit rule.

Do not assume the same fallback ladder applies to every type of data. A climatology is not a valid substitute for a present-day observation, and a forecast is not a substitute for observed rainfall.

### 13.5 Agricultural calculations

**Water intelligence:** use a physically defensible daily bucket model when the inputs allow it. Document reference ET, crop coefficient/stage, effective precipitation, irrigation amount and application efficiency, soil water capacity, rooting depth, drainage and uncertainty. Display output in mm or another clear unit. Do not call a temperature-only approximation FAO-56 Penman–Monteith.

**Soil model:** distinguish sourced or lab-measured soil parameters from derived parameters. Organic-matter and nitrogen projections are model states, not direct measurements. Apply each correction once, document assumptions, and show missing lab properties as missing.

**Climate suitability:** preserve historical variability where possible rather than scoring only from a long-term mean. Show heat/dry spell risk during sensitive crop stages, not just annual average temperature or total rain.

**Vegetation:** derive NDVI or similar metrics only from actual reflectance products with adequate quality checks. Account for cloud/quality flags, crop stage and field/pixel size. A vegetation anomaly is a signal, not a diagnosis of disease or water stress.

**Soil health:** avoid one unsupported “microbial activity” or “soil health percentage.” Prefer a transparent group of physical, chemical and biological indicators; an aggregate index requires a defensible definition and suitable measurements.

**Economic projections:** do not calculate verified margins without prices, costs, yields and units with known dates and sources. Keep economic scoring separated from agronomic rotation scoring.

### 13.6 External source review

Every connector should have a documented owner, official documentation, tests, data-use/attribution requirements, rate limits, outage strategy, and a review date. Recheck provider status during implementation rather than assuming the status captured at planning time will remain true.

---

## 14. Visual system for the major redesign

The intended feel is premium, scientific, agricultural and product-led—not a generic admin dashboard or a neon “AI” mockup.

### 14.1 Visual identity

- **Base:** forest-night green-black (`#07130C` canvas, `#102319` solid surface, `#183324` raised surface). The UI must read as agricultural intelligence, not a blue cyber-security console.
- **Primary accent:** muted leaf green (`#83C58E`) for selected controls, primary actions and positive direction; do not tint every card green.
- **Secondary data accent:** water/sky cyan (`#73CAD0`) for rainfall, moisture and weather series only.
- **Warm accent:** soil/clay/sunlight (`#B58A60` / `#E6B86A`) for crop imagery, seasonal highlights and caution—not for every chart.
- **Primary text:** soft warm white (`#F1F6EF`).
- **Secondary text:** readable muted sage (`#C0CEC2`).
- **Warning:** warm amber (`#E6B86A`).
- **Critical:** calm coral (`#E97971`).
- **Unknown/missing evidence:** neutral sage-grey (`#9BA79C`).

These are starting tokens, not rigid values for every component. Use forest green as the brand base and leaf green as a restrained accent rather than colouring every card bright green. Avoid excessive blur, neon, continuous glow, oversized gradients, huge icons and nested bordered cards. Borders should separate structure subtly, not glow to announce that something exists.

### 14.2 Typography and hierarchy

Use one high-quality sans-serif family, consistent weights, predictable heading sizes and tabular numerals for values. Body text should normally be at least 16 px on desktop, with careful exceptions for metadata that remains readable. Use a clear system:
- page title;
- section title;
- card heading;
- main value;
- descriptive sentence;
- source/updated metadata.

Do not style every text element at the same size or weight. Main headings must look deliberate rather than like ordinary card text.

### 14.3 Layout rules

- Use a consistent spacing scale, alignment and card padding.
- Fit layouts to the available viewport; eliminate oversized empty margins and fixed-width content that clips.
- Reserve tables for row-based comparison; do not convert all tables into separate cards.
- Use cards for grouped decisions and summaries, not for every individual metric.
- Expand technical content inline or in a side drawer; avoid one extremely tall, dense result page.
- Let card height follow its actual content; don't reserve empty alert space.
- Crop imagery consistently and only use imagery that adds contextual value.
- Use realistic crop photographs for rotation sequences, with crop name and stage as text labels.
- Use professional Lucide-style line icons rather than emojis.

### 14.4 Motion rules

- Question transitions: directional fade/slide, with reverse direction when going Back.
- Loading: stage progress based on real work; no fabricated percentages.
- Selection: visible but restrained active-state change.
- Charts: enter once after data arrives, not on every render.
- Save/completion: toast and subtle confirmation.
- Farm/field switches: transition context smoothly but preserve page state where sensible.
- No perpetual glow or movement behind dense data.
- Honour `prefers-reduced-motion`; provide immediate non-animated state changes when requested.

### 14.5 Responsiveness and accessibility

- Desktop: clear multi-column dashboard with comfortable reading widths.
- Tablet: 2-column to 1-column reflow and accessible secondary navigation.
- Phone: stacked cards, usable charts, touch targets about 44×44 px or larger, and a focused bottom navigation/menu pattern.
- Keyboard: visible focus state, logical tab order, operation without a pointer, accessible menus and modal focus management.
- Status must not rely on color alone.
- Important charts need a written summary and accessible table alternative.
- Ensure text contrast meets WCAG AA targets, support browser zoom, and respect reduced motion.

### 14.6 New visual component: Evidence Drawer

Create a reusable right-side drawer or inline disclosure pattern used by scores, alerts, chart points and recommendations. Its structure stays consistent:
1. What the value says.
2. What it means in plain language.
3. Data/source and time.
4. How it was calculated.
5. Confidence and limitations.
6. What action, if any, follows.

This adds scientific depth without cluttering every page.

---

<!-- SOURCE LINES 977-1125 END -->

<!-- SOURCE LINES 1156-1168 BEGIN -->
### 15.3 Input Freshness and Change Impact

#### UI/UX + dependency invalidation contract — Input Freshness and Change Impact

Use an inline `Out of date` chip beside each affected metric/plan/report and a small impact drawer opened from `Why is this out of date?`. Chip geometry: 12–13px text, 6px vertical/9px horizontal padding, 8px radius; neutral amber/surface background rather than neon border. The drawer is 420–520px on desktop, full-height on mobile, with 96% opaque surface, 20px radius and 24px padding. It lists `Changed input`, `Affected outputs`, `Why`, `Last calculated`, and `Recalculate` action. Do not cover the data value with an unexplained red banner.

Build a dependency graph from `metricKey → input/source/geometry/profile/model versions → derived outputs`. Mutating a boundary invalidates area/centroid and geometry-sampled aggregates; changing irrigation affects forward water balance and rotation scores; new crop history affects sequencing constraints; changing a display unit does not invalidate calculations. Invalidation is scoped to the affected farm/field/input version. Old reports remain immutable and marked historical; a new calculation produces a new version.

Implementation uses typed domain events such as `FieldGeometryVersionChanged`, `IrrigationAvailabilityChanged`, `CropHistoryUpdated`, `SourceObservationArrived`, `CropKnowledgeVersionChanged`. A central dependency service returns affected metric/plan/report IDs. Do not rely on arbitrary page-local boolean flags. Background source refresh shows `New data available` until the user or scheduled policy runs the appropriate recomputation. Tests ensure unrelated fields remain fresh, stale results never appear as current, and recompute refreshes dependent outputs while preserving old reports.


When a user edits a field's boundary, crop history, soil test, irrigation limit or crop plan, show which outputs may now be stale: rotation ranking, water balance, next actions, scheduled Deep Analysis baseline and calendar. Let the user rerun only the impacted calculations where safe. This avoids both unnecessary full recomputation and stale results presented as current.

<!-- SOURCE LINES 1156-1168 END -->

<!-- SOURCE LINES 1297-1826 BEGIN -->
### 15.14 Avoid feature bloat

Do not build every idea in one release. The core product already has meaningful complexity. Prioritise the shared data model, truthful sources, two distinct planning/monitoring flows, useful reports and task integration. The advanced features above become valuable only when their inputs and underlying logic are reliable.

---

## 16. Local data, backend and privacy architecture

### 16.1 Layered system

**Client/UI layer:** React/TypeScript or equivalent, accessible component library, shared design tokens, routing and responsive layouts.

**Local persistence layer:** IndexedDB for structured farm/field profiles, drafts, local reports and pending events; localStorage only for small preferences. Provide export and clear local data deletion. Browser storage can be cleared by the browser/device, so explain that it is local storage rather than a guaranteed backup.

**Optional background service:** stores the minimum explicit schedule configuration and encrypted/minimised analysis snapshot required for a user-authorised background run. It handles schedules/queue, connector orchestration, report generation and notifications. It should not silently upload every local record.

**Data connector layer:** isolated per-provider adapters, source metadata, request limits, caching and provenance.

**Deterministic agronomy engine:** pure, versioned calculations with no network I/O; inputs and outputs are typed and validated.

**Explanation layer:** converts computed facts to readable text; it can explain results but cannot invent values, causal diagnoses, source claims or recommendations outside the engine's eligible findings.

**Audit/observability layer:** run ID/correlation ID, job state transitions, safe connector logs, error reasons and model versions.

### 16.2 Consent and data minimisation

Before enabling scheduled processing, show what leaves the device, what is stored, the reason, the processing provider(s), the retention/deletion rules, and how to disable it. Separate consent to run scheduled analyses from ordinary local use and from optional notifications. Do not send credentials or unrelated personal information to the job worker.

For a scheduled job, keep the smallest useful set of profile facts, management inputs, relevant history, field identifiers/geometries or derived spatial request data, schedule and baseline references. Check whether the analysis can use cached environmental data rather than resending or recomputing it. Store sensitive farm data behind tenant/user access controls and encrypted transport/storage.

### 16.3 Credentials and access control

Provider credentials stay server-side. Validate all user-submitted farm IDs, field IDs, schedules and analysis parameters on the backend, not just in the browser. Ensure each user can access only their own data. Rate-limit expensive endpoints such as full analyses, boundary import and exports. Protect background-job endpoints against unauthorised triggering and duplicate execution.

### 16.4 Audit logs

Log job lifecycle and security-relevant events with a run/correlation ID. Do not log secrets, access tokens, full credentials, or unnecessary raw farmer notes. Apply access controls and retention rules to logs. Logging is for operation and auditability, not an uncontrolled duplicate of the whole private farm profile.

### 16.5 Deletion

The user must be able to disable automation, delete scheduled snapshots, delete stored reports where appropriate, and clear local data. Explain any retention limitations for backups or operational logs. Deleting the local farm does not silently leave a background schedule running; it should deactivate/delete linked server resources after confirmation.

---

## 17. Reliability, errors and edge cases

Every major page needs designed states for:
- first use / no farm;
- no field boundary yet;
- incomplete setup draft;
- data loading;
- analysis queued/running;
- successful full result;
- partial result;
- failed run with retry;
- source stale or unavailable;
- insufficient inputs;
- no suitable rotation;
- no active alerts;
- no historical report yet;
- schedule disabled/paused;
- local changes awaiting sync;
- network offline;
- changed input invalidating a prior analysis;
- deleted/renamed farm or field;
- export failure;
- duplicate or overlapping field polygons.

Do not show zero for a missing value. Do not display a successful source badge when the connector failed. Preserve a previous valid analysis while a refresh runs, marked as the last available report with its date. A new incomplete report must not overwrite an older complete report as though it were the same thing.

---

## 18. Testing and acceptance criteria

A release is not complete because the homepage looks good or a build command succeeds. The complete workflows and scientific calculations must be validated.

### 18.1 Calculation tests

- Same normalised inputs and engine version produce identical results.
- Score components stay within defined ranges and weights obey constraints.
- Hard crop constraints are never violated unless the output explicitly identifies an infeasible user-forced constraint.
- Crop sequence candidates are genuinely distinct where presented as distinct.
- Planting/harvest windows and season/year labels are consistent.
- Water-balance calculations pass known worked examples and use correct units.
- Nitrogen/soil-state logic is deterministic and documents uncertainty.
- Missing values do not silently become plausible defaults.
- Confidence changes according to documented rules when key inputs are missing, stale or sourced from a weak fallback.
- The score's plain-language description matches the actual score definition.

### 18.2 Data connector tests

Test successful requests, invalid response shapes, timeouts, provider throttling, malformed values, fill values, missing periods, stale responses, cache hits, source conflicts, inaccessible sources and fallback paths. Assert that provenance and confidence update correctly. Verify official endpoints/product names/versions before implementation.

### 18.3 Deep Analysis and automation tests

- Manual run, scheduled run and retry all call the same versioned pipeline.
- Duplicate job submissions do not create duplicate reports or notifications.
- Changing watering routine affects only the calculations that depend on it.
- Actual irrigation events and recurring routines remain distinct.
- Observed rainfall and forecast rainfall are never conflated.
- Stale management practices are flagged according to the product rules.
- Farm-wide and field-level results stay in sync.
- Partial runs preserve source failures in the report.
- Disabling automation prevents further jobs and removes/revokes its saved snapshot as promised.
- An old successful report remains available when the latest run fails.

### 18.4 Cross-page interaction tests

- Create farm → add two fields → enter different soil/crop histories → run rotation plan per field → save chosen plans → view on Home/My Farms/Calendar → run Deep Analysis → compare historical report → simulate an alternative → confirm no real plan changes without approval.
- Switching farm changes every dependent component consistently.
- Clicking a crop from any page opens the correct field and rotation context.
- Editing a farm boundary updates area and invalidates only relevant outputs.
- Every button/menu/CTA works; no fake interactions.

### 18.5 Visual/accessibility tests

Check desktop, tablet and mobile; long farm names, many fields, no alerts, multiple alerts, very long crop labels, large result tables, empty data and source errors. Test keyboard-only, focus order, screen-reader labels, contrast, browser zoom and reduced motion. Confirm the redesigned UI has no overlapping text, clipped rotation cards, broken chart labels or horizontal page overflow.

### 18.6 Release gates

Before a feature is labelled production-ready:
1. The UI and underlying logic both work.
2. Required sources are actually connected and tested.
3. Data provenance is correct.
4. Known limitations and missing prerequisites are shown.
5. Automated tests cover critical calculations and workflows.
6. A manual acceptance checklist is completed.
7. Privacy/security review covers any data sent to the backend.

---

## 19. Phased roadmap and dependencies

The order matters. Building a 3D soil view before the underlying water/soil calculations are reliable would produce visual complexity without dependable value.

### Phase 0 — Product architecture and design system

- Freeze navigation and naming distinctions.
- Define the farm/field/evidence/analysis/plan/task/alert/scenario records.
- Create design tokens, typography, icon, chart, table, status and Evidence Drawer components.
- Define simple/advanced content rules and source/provenance semantics.
- Establish route state and global selected-farm/field behaviour.

**Exit criterion:** every page has a clear job, every core record has one home, and shared UI components are specified before duplicated layouts are built.

### Phase 1 — Core farm/field structure and planning flow

- Rebuild Add Farm, mapping and multi-field management.
- Keep local persistence, wizard autosave/resume, one-question flow and inline review.
- Make field-specific crop/soil/water/history inputs explicit.
- Preserve the deterministic rotation engine and repair inconsistencies in season/year labels, crop sequences and explanations.
- Deliver candidate ranking, risk/mitigation and head-to-head comparison using only supported parameters.

**Exit criterion:** users can create a farm with multiple fields, create a valid field-specific rotation plan, review the evidence and return to it without cross-field contamination.

### Phase 2 — Major visual redesign and daily tracker

- Implement global nav, Home, portfolio/farm details, typography hierarchy, responsive layout and accessibility.
- Share the daily status snapshot between Home and farm overview.
- Ensure alerts, weather, soil/water descriptions and next actions align with the same underlying state.
- Add useful empty/loading/error states and fully functional links.

**Exit criterion:** the main daily-use journeys are coherent, readable and stable across viewport sizes.

### Phase 3 — Farm Intelligence and saved Deep Analysis reports

- Build a common assessment pipeline, report schema and per-field assessments.
- Add source refresh, data quality/confidence, management-practice input and structured review.
- Add evidence-linked findings and recommendations.
- Add dated reports, “what changed” comparisons and version-aware history.
- Only introduce a composite Farm Condition Index after validating its definition; otherwise show component indicators and field statuses.

**Exit criterion:** a report can be reproduced from its saved inputs, every finding has evidence, and missing data does not create false certainty.

### Phase 4 — Secure scheduled automation

- Implement explicit opt-in for cloud background processing.
- Define minimal sync schema and user-visible privacy information.
- Add job queue, idempotency, retry/backoff, run status and schedule controls.
- Confirm saved watering practices and incorporate qualifying observed rainfall correctly.
- Add report notifications, retention/deletion controls and security tests.

**Exit criterion:** scheduled reports run reliably when the browser is closed, without hidden upload or duplicate-run errors.

### Phase 5 — Calendar, task centre and feedback loop

- Build calendar from saved rotation plans and operation windows.
- Link crop cells and tasks back to exact farm/field context.
- Add farmer observations, task states, decision journal and review triggers.
- Connect completed tasks and observations to subsequent analysis reports.

**Exit criterion:** recommendations can become trackable actions, and history preserves what was suggested versus what the farmer reported doing.

### Phase 6 — Higher-resolution vegetation and expanded soil/water intelligence

- Integrate eligible satellite imagery and indices with cloud/quality masking.
- Add vegetation trends only when the field/pixel scale and data coverage permit them.
- Expand soil and water views with measured, modelled and unavailable values clearly separated.
- Add change detection and field evidence timeline.

**Exit criterion:** satellite/soil/water views are source-backed, spatially honest and quality-tested.

### Phase 7 — Multi-field coordination and advanced simulation

- Coordinate rotation plans and workload across multiple fields.
- Add scenario comparison, thresholds and stress testing.
- Add economic simulation only when reliable local prices/cost inputs and sources exist.
- Add seasonal review, exportable Field Brief and offline-tolerant mode if user demand justifies them.

**Exit criterion:** advanced capabilities use the same canonical farm records and never alter real farm plans without user approval.

---

## 20. Feature priority matrix

| Priority | Feature | Why it comes here | Dependencies |
|---|---|---|---|
| P0 | Clear information architecture and design system | Prevents page sprawl and visual inconsistency | None |
| P0 | Reliable farm/field records and selected-context state | Every other feature depends on it | Data model |
| P0 | Honest source/provenance/confidence system | Protects scientific credibility | Connector metadata, data model |
| P0 | Crop rotation wizard and correct ranking/explanation | Existing core differentiator | Crop knowledge base and engine tests |
| P0 | Home daily tracker and farm detail coherence | Makes the product useful every day | Farm snapshot and alerts |
| P1 | Deep Analysis reports with per-field and farm-wide views | Adds recurring intelligence and change history | Evidence pipeline, report model, scoring definition |
| P1 | Alert lifecycle, actions and observations | Turns analysis into an actionable workflow | Evidence/rules and tasks |
| P1 | Scenario Simulator aligned with baseline | Lets users explore trade-offs safely | Deterministic engine and saved scenarios |
| P1 | Schedule service with privacy consent and robust jobs | Delivers requested automation | Report schema, backend snapshot model, security |
| P1 | Calendar linked to crop plans/tasks | Connects planning with execution | Rotation dates and task model |
| P2 | Data Gap Coach and input-change impact | Improves confidence and reduces stale outputs | Confidence model and dependency map |
| P2 | Actual Sentinel-2 vegetation history | Higher-resolution field-context potential | Connector, masking, resolution tests |
| P2 | Field evidence timeline and seasonal review | Connects events and outcomes | Farmer journal and report history |
| P3 | Multi-field portfolio rotation coordination | Valuable but computationally broader | Stable per-field model and calendar |
| P3 | Market/economic simulation | Useful only with verified prices/costs | Data provider or confirmed manual input |
| P3 | Offline-tolerant field mode | Useful for intermittent connectivity | Local persistence, sync conflict policy |

---

## 21. Example end-to-end user journey

This journey demonstrates how the product should feel when the pieces are connected.

1. The farmer creates a farm, draws two fields and gives each a name. Field A has a sandy-loam estimate; Field B has a confirmed soil test. The interface records this difference in provenance and confidence.
2. They enter crop history and water availability separately for each field. Common practices can be applied to both only after confirmation.
3. The user chooses **Plan Crop Rotations** for Field A. The wizard saves each response, helps them review unknowns and produces a ranked list of valid rotations with a clear explanation of the match score.
4. The farmer compares the recommended rotation against an alternative. The system shows the potential water and soil trade-offs, crop-specific risks, management mitigations and evidence limitations. They save one plan as active.
5. Home shows the farm's current status and the two field summaries. Field B's missing rotation is not hidden by Field A's completed plan.
6. The farmer opens **Farm Intelligence** and runs Deep Analysis. The system refreshes available evidence, asks them to confirm their irrigation routine, evaluates each field and creates a dated report.
7. The report shows a supported concern in Field A and a missing-data limitation in Field B. It offers a concrete inspection/review action, links the evidence, and avoids diagnosing a specific cause from a vegetation signal alone.
8. The farmer enables every-three-day scheduled analysis and explicitly approves the minimum data snapshot required by the background service. The service stores the routine's confirmed state and next run date.
9. After a qualifying observed rainfall update, the next analysis revises the supported water balance; it does not pretend that a forecast is a rainfall observation and does not assume irrigation was skipped if the source data is missing.
10. The report history highlights the input and evidence changes since the previous run. A task becomes completed only when the farmer records that it was done; a later analysis evaluates whether the underlying condition changed.
11. The farmer opens the Simulator to test an alternative irrigation assumption. It shows scenario-only results and does not alter the active rotation until the user reviews and confirms a change.
12. At season's end, the Seasonal Review compares planned and reported actual crop dates and records any user-supplied outcomes for the next planning cycle.

This is the product's connected loop: **profile → evidence → plan → monitor → recommend → act → record → reassess → improve the next decision.**

---

## 22. Open design decisions and guardrails

These are not blockers to completing the plan; they are decisions that should be settled during implementation with explicit consequences documented.

1. **Local-only vs scheduled cloud analysis:** keep local mode available. Scheduled server jobs require explicit opt-in and a minimum persisted analysis snapshot. Do not imply otherwise.
2. **Composite farm score:** proposed, but must be validated before release. Until then show field statuses, separate indicators and a transparent farm summary.
3. **Source availability:** SoilGrids REST API and other provider access can be unstable or change. Check current official status before implementation and maintain alternate sources / unavailable states.
4. **AI role:** use AI for natural-language parsing and explanation; use typed, validated deterministic methods for scoring and rules. Farmer review is required for ambiguous practice extraction.
5. **Economic simulation:** phase later unless verified data and local assumptions are available.
6. **Satellite crop health:** build only after a real vegetation connector and quality controls exist. No synthetic NDVI.
7. **3D models:** use 3D only where it helps explain a real model, such as soil-water layers or boundary elevation. Do not add 3D decoration that obscures the decision or implies sensor precision the system does not have.
8. **Portfolio calculations:** show how aggregates are calculated and keep per-field issues visible.
9. **User identity/authentication:** the original concept supports local-first use; scheduled cloud processing needs a secure way to bind schedules and reports to the correct user/device. Choose the least-complex secure identity strategy consistent with the deployment model before implementation.
10. **Retention:** define how long reports, cloud snapshots, logs and backups are retained, and explain what deletion means in each storage location.

---

## 23. Research references for implementation validation

These sources support the technical planning direction. Verify the current documentation and product version again when implementation begins.

- [NASA POWER Daily API documentation](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) — parameter/time-series behaviour and time standards.
- [NASA POWER data FAQs](https://power.larc.nasa.gov/docs/faqs/data/) — source resolution and temporal context.
- [NASA SMAP L4 product information](https://gmao.gsfc.nasa.gov/gmao-products/smap-l4/) — 9 km, 3-hourly estimates and the role of land-surface modelling for root-zone moisture.
- [NASA MODIS vegetation indices](https://modis.gsfc.nasa.gov/data/dataprod/mod13.php) — NDVI/EVI product cadence and spatial resolution options.
- [NASA GPM IMERG data directory](https://gpm.nasa.gov/data/directory) — current product, cadence, coverage and latency.
- [Copernicus Data Space Sentinel-2 Level-2A documentation](https://documentation.dataspace.copernicus.eu/Data/SentinelMissions/Sentinel2.html) — surface-reflectance processing, bands and quality-related outputs.
- [ESA Sentinel-2 mission overview](https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-2) — mission bands, resolution and revisit overview.
- [NASADEM via NASA Earthdata LP DAAC](https://www.earthdata.nasa.gov/centers/lp-daac) — approximately 30 m terrain product information.
- [SoilGrids documentation](https://docs.isric.org/globaldata/soilgrids/index.html) and [SoilGrids REST entry page](https://rest.isric.org/) — global soil estimates, uncertainty and current service caution.
- [FAO crop evapotranspiration guidance](https://www.fao.org/4/X0490E/x0490e0a.htm) — distinction between reference evapotranspiration and crop evapotranspiration using crop coefficients.
- [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api) and [Historical Forecast API](https://open-meteo.com/en/docs/historical-forecast-api) — useful examples of the distinctions between reanalysis, archived forecasts and live forecasts; review licence and service conditions before selecting a provider.
- [NASA Earthdata Login token management](https://urs.earthdata.nasa.gov/documentation/for_users/user_token) — credential lifecycle and token expiry considerations for protected NASA data.
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) — protect secrets and sensitive data in logs, restrict access and define retention.
- [OWASP API4:2023 Unrestricted Resource Consumption](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/) — request limits, rate limiting and cost controls for expensive API operations.

---

## 24. Final definition of success

Field Shift succeeds when a farmer can understand the state of their farm quickly, investigate every important conclusion, choose a suitable crop plan for each field, explore alternatives safely, turn recommendations into real tasks, and track changes over time—without confusing model outputs with direct measurements or losing control of their data.

The redesigned interface should feel like one deliberate product rather than a collection of separate dashboard widgets. Its advanced features should be visible where useful, but always layered so the main decision remains clear. Its intelligence should be ambitious while staying transparent about evidence and limitations.

The full experience is built around one principle:

> **Every feature must either improve a decision, explain the evidence behind a decision, help carry out a decision, or help evaluate what happened afterwards. If it does none of those, it probably does not belong in Field Shift.**

---

# PART II — FULL REBUILD DIRECTIVE FOR THE AI WEBSITE BUILDER

> **This part is an execution contract, not optional inspiration. Rebuild the complete Field Shift experience from this specification. Do not assume a page, feature, data model, interaction or validation already works merely because it appears in historical notes or an earlier implementation summary. Recreate it deliberately, implement the complete user journey, and verify it. When a feature is not supportable with the available data or service access, implement a truthful unavailable/limited state rather than a fake success.

## 25. How to interpret and apply the brief

### 25.1 Authority and conflict resolution

Use this order if requirements conflict:

1. The user's latest explicit directions in the active conversation.
2. This master build prompt's product principles, full rebuild requirements and explicit resolutions of contradictions.
3. The detailed requirements and interaction behaviours in the original uploaded attachment.
4. Older historical snippets and implementation summaries inside that attachment.
5. The builder's own choices, only where the above sources are silent.

Do not interpret an old action-history message such as “edited files” or “build passed” as proof that the current build contains a working feature. The attachment is historical design/context evidence, not a verified repository.

### 25.2 Full rebuild, not a partial redesign

Rebuild the app shell, routes, design system, pages, cross-page navigation, forms, data models, calculation interfaces, map workflow, report experience, loading/empty/error states and responsive behaviour as one integrated product. Do not only restyle the homepage. Do not preserve a broken layout merely because an earlier version had it. Preserve intended product capabilities, not bugs or obsolete UI decisions.

Every previously specified capability must receive one of these explicit treatments:

- **Rebuilt now:** specified in sufficient detail and implemented in the appropriate phase.
- **Implemented after a prerequisite:** present in the architecture and UI plan, but disabled until the service/data/model prerequisite is genuinely available.
- **Deferred:** deliberately left for a later roadmap phase with a reason and an integration contract.
- **Rejected:** excluded because it is deceptive, redundant, unsupported, unsafe for data quality, or conflicts with current user direction. Give the reason in the implementation summary.

Do not silently omit it.

### 25.3 Required builder output and execution discipline

Before coding, the builder must produce a short internal implementation map (not a new request to the user): route tree, shared component list, canonical data entities, API/job dependencies, feature dependency order and test matrix. Then implement in dependency order. Keep the product usable after each phase. Run type checks, unit tests, integration tests, browser-level workflow tests and visual checks; correct failures rather than reporting them as completed.

Deliver a final implementation report listing each required feature as complete, partially complete, deferred or blocked; the tests run; known issues; real connectors versus planned connectors; and any external API/key/deployment setup still required. Never claim “everything works perfectly” without evidence from actual tests.

## 26. Whole-product navigation, route and state contract

### 26.1 Primary global shell

**Desktop layout:** a fixed-height top navigation bar; a slim, collapsible global sidebar only if it improves navigation density; a wide main content canvas; and contextual secondary navigation inside farm/field details. Avoid a permanent 220px sidebar on every page when it needlessly compresses the content. The main content should use the available width, usually a 12-column responsive grid, with a comfortable maximum reading width for long technical articles.

**Top bar order from left to right:**

1. Global Undo button.
2. Global Redo button.
3. FIELD SHIFT leaf mark and wordmark.
4. Current workspace breadcrumb or selected farm/field context when relevant.
5. Primary navigation: **Home**, **My Farms**, **Farm Intelligence**, **Crop Rotation Planner**, **Simulator**, **Calendar & Actions**, **Data & Trust**.
6. Notification centre with unread count.
7. Global search/command launcher where implemented.
8. Settings/profile control and visible Simple/Advanced mode state.

If available horizontal space becomes inadequate, move secondary controls into a “More” menu; do not shrink text until it is unreadable. On small screens use a compact top bar and a bottom navigation with the most frequent destinations; keep remaining links in a labelled navigation drawer. Preserve page title and the selected farm/field context.

**Undo/Redo:** these buttons operate on the app's undoable domain actions, not merely browser navigation. They must show tooltips, have accessible labels and be disabled when no valid action is available. A history entry identifies the change it would reverse. Undo/redo must not undo an external server job that has already executed, delete a cloud report without confirmation, or reverse an irreversible external data-provider action. Where a change cannot be reversed, explain that and offer an explicit compensating action. Browser Back/Forward and breadcrumbs remain available for navigation and must not be mislabeled as Undo/Redo.

### 26.2 Required routes

Implement a canonical route system with stable identifiers and deep links. Suggested route pattern (adjust syntax to the chosen framework, not the semantics):

- `/` — redirect to `/home` when an existing workspace is available; otherwise show onboarding/empty state.
- `/setup` and `/setup/review` — reusable farm/field setup or rotation-planning wizard, with an explicit `purpose` and selected `farmId` / `fieldId` context.
- `/home` — daily tracker and multi-farm attention summary.
- `/farms` — portfolio list.
- `/farms/new` — Add Farm workflow.
- `/farms/:farmId` — selected farm workspace and overview.
- `/farms/:farmId/map` — full farm/field map and geometry editor.
- `/farms/:farmId/fields/:fieldId` — selected field summary.
- `/farms/:farmId/fields/:fieldId/:section` — field sub-sections such as `overview`, `rotation`, `soil`, `water`, `weather`, `vegetation`, `actions`, `history`, `settings`.
- `/rotation-planner` — start or resume rotation planning; requires farm/field context or guides the user to choose one.
- `/rotation-planner/results/:analysisId` — saved rotation result, with versioned result context.
- `/rotation-planner/rotation/:rotationId` — single rotation detail.
- `/farm-intelligence` — choose farm/fields and open Deep Analysis workspace.
- `/farm-intelligence/reports/:reportId` — immutable saved report.
- `/farm-intelligence/history` — reports and comparisons.
- `/simulator` and `/simulator/:scenarioId` — baseline vs. scenario.
- `/calendar` — field-aware calendar and action schedule.
- `/actions` and `/actions/:actionId` — task list/detail.
- `/data-trust` — source registry and methodology.
- `/settings` — display, units, privacy, automation, notifications, storage and export controls.

A builder may consolidate route implementation, but it must preserve each destination's clear purpose and direct-link behaviour. Avoid using “Analysis” for three different things. Use **Crop Rotation Planner** for a new rotation; **Farm Intelligence / Deep Analysis** for assessing current conditions; **Simulator** for hypothetical changes.

### 26.3 Global selection state

Maintain one canonical selected context: `activeFarmId`, optional `activeFieldId`, active crop-plan ID, display units, Simple/Advanced mode, selected date/window and relevant filters. Persist suitable preferences locally. Do not persist a stale selected field without checking it still belongs to the selected farm.

On farm switch:

1. update the global selected-farm state;
2. if the active field does not belong to that farm, clear it and select the farm overview;
3. refresh or retrieve all farm-specific data needed by the current page;
4. cancel/ignore late asynchronous responses belonging to the previously selected farm;
5. invalidate only the dependent caches and stale results;
6. update breadcrumbs, titles, page selectors, charts, weather, crop sequence, alerts and calendar scope coherently;
7. show a short transition/loading state rather than a flash of old data;
8. preserve the previous scroll position per route only when sensible and never land on a crop detail from the old farm.

On field switch, apply the same dependency rules within the current farm. An explicit field selector must always identify both field name and farm name when there could be ambiguity.

### 26.4 Universal cross-link rule

Every visible crop name, field name, farm name, chart point, alert, risk, recommendation, schedule item and history item must carry a real entity reference and open the correct contextual destination. Never derive navigation from displayed text alone; use stable IDs.

Examples:

- Clicking **Wheat** in a rotation card opens the wheat stage in the specific rotation belonging to the specific field and farm. If the crop name appears in multiple farms, the selected item resolves from its own stored `farmId`, `fieldId`, `rotationId` and `seasonStageId`.
- Clicking a crop tile on Calendar opens an event detail panel. That panel identifies farm, field, crop, rotation, dates, stage and related tasks. A “View crop in rotation” link opens the correct rotation detail at the matching season.
- Clicking “Open farm details” from Home goes to the current farm's detail route, not the generic portfolio list.
- Clicking an alert from the notification drawer opens the associated report/evidence and the correct field; it must preserve a return path to the screen the user came from.
- Clicking “Show evidence” from a score opens the reusable Evidence Drawer with the exact metric and time window preselected.
- Clicking a date on a trend graph updates the linked date context only for compatible charts and exposes the underlying value, not a dead decorative point.

Record these rules in typed navigation helpers and test every originating page.

## 27. Whole-product visual system and exact component rules

### 27.1 Design direction

The authoritative aesthetic is a professional, premium agricultural-intelligence product: dark navy/blue foundation, restrained teal/turquoise/emerald accents, muted cool-grey text, realistic crop/land imagery, precise chart and table layouts, thin borders and selective surface contrast. The new direction supersedes old iterations with purple-heavy gradients, neon glow, excessive glassmorphism, decorative atmosphere or generic AI-looking cards.

Suggested token starting point (validate contrast and refine in implementation):

| Token | Initial value | Use |
|---|---|---|
| `bg.canvas` | `#07130C` | Global forest-night page background |
| `bg.surface` | `#102319` | Main panels and tables |
| `bg.surfaceRaised` | `#183324` | Menus, nested panels, selected rows |
| `bg.surfaceMuted` | `#0A202B` | Input backgrounds and quiet surfaces |
| `accent.primary` | `#12C7B2` | Primary actions and focus treatment |
| `accent.secondary` | `#27A9D8` | Information and source accents |
| `accent.green` | `#3AA879` | Positive agronomic status, used sparingly |
| `text.primary` | `#F3F7F8` | Main text and values |
| `text.secondary` | `#A7BAC4` | Descriptions and metadata |
| `border.subtle` | `rgba(190,220,230,0.13)` | Panel separation |
| `status.good` | `#55C58A` | Positive, always paired with text/icon |
| `status.caution` | `#E6B85C` | Caution / monitor |
| `status.highRisk` | `#EF7770` | High/critical risk |
| `status.unknown` | `#98A9B3` | Unknown/unavailable/insufficient evidence |
| `source.satellite` | `#55BDE7` | Satellite/data source tag |
| `source.farmer` | `#C1A6E8` | Farmer-reported input tag |
| `source.calculated` | `#69CDB5` | Calculated value tag |
| `source.estimated` | `#E6B85C` | Estimated/fallback tag |

These values are starting tokens, not permission to use color as the only meaning. All semantic statuses also need labels and icons. Validate text contrast against WCAG guidance, especially muted text on cards, focus rings, chart axes and disabled states.

### 27.2 Typography and hierarchy

Use one coherent modern sans-serif family (Inter, Geist or a similarly legible family). Use tabular numerals for values. Establish a visible scale; do not render every label and heading at the same size.

- Page title: typically 28–36px desktop, 24–30px mobile.
- Section title: 18–22px.
- Card heading: 15–18px, semibold.
- Body: 14–16px minimum for essential copy; prefer 15–16px.
- Chart labels/metadata: normally 12–13px, with zoom/help available; never use tiny labels for critical evidence.
- Hero metrics: responsive and large enough to read, but their labels and definitions must remain close.
- Helper text: concise and readable; no walls of tiny grey copy.

Use meaningful whitespace between page header, primary action, filters, content groups and footnotes. Use headings before cards. Avoid repeatedly nesting bordered cards inside bordered cards; use spacing, background tone and typographic hierarchy to group content.

### 27.3 Surface and card rules

- Rounded corners should be consistent and moderate, generally 8–14px, with larger radii reserved for hero panels or dialogs.
- No constant glow; no neon outline on every component; no floating unbounded pills; no excessive animated background.
- Use photographs only when they communicate crop/land context and are properly sized/cropped. Crop images need captions and accessible alt text where meaningful. Decorative imagery must not push key information below the fold.
- Use SVG/Lucide-style professional line icons, not emojis.
- Use a consistent icon size scale (16px inline, 18–20px controls, 22–24px section marks); do not use oversized icons to fill empty space.
- Data values, labels, units and provenance should form one readable cluster. Never detach a value's caveat two screens away.
- Use full-width tables when comparison is the point. Do not transform every table row into separate cards on desktop.
- A card should answer one clear question. Combine related weather facts in one coherent weather card rather than building a separate card for every number.

### 27.4 Grid, spacing and responsive layout

Use a responsive 12-column grid on wide desktop screens with consistent spacing. Main content should be close to full usable width, leaving balanced margins rather than an artificially narrow column. For wide tables and calendars, optimise for the viewport and only permit horizontal scrolling inside a clearly indicated data region when necessary—not on the whole page.

At each breakpoint verify: top navigation wrapping/collapse, table-to-list transformation, map tool placement, drawers converting to full-screen sheets on mobile, chart legibility, crop sequences reflowing vertically, sticky headers not covering content, and touch targets of at least 44×44 CSS pixels. Test desktop width 1440px, laptop 1280px, tablet 768px and mobile 390px/360px; these are representative test widths, not exclusive targets.

### 27.5 Shared components and their states

Build reusable components and specify the following states for every one:

- Button: default, hover, focus-visible, pressed, loading, disabled, success/error result.
- Input: empty, focused, filled, invalid, helper, read-only, saving, saved, save-failed.
- Select/combobox: closed, open, searching, no match, keyboard-selected, chosen, loading, failed.
- Card/list row: default, hover/clickable, selected, stale, loading, partial data, unavailable, actionable, resolved/archived.
- Tooltip/help popover: mouse hover and keyboard/focus/tap access; never require hover on mobile.
- Drawer/dialog: open, loading, content, validation error, save pending, save success, save failure, close with unsaved changes.
- Chart: loading, valid data, partial data, no data, failed source, selected point, accessible text/table alternative.
- Badge: icon + text + optional tooltip, with semantic label; no badge should be purely decorative.
- Empty state: explains why empty, what action creates content, and a real CTA.
- Toast: short outcome summary, optional Undo only when true undo is supported, auto-dismiss duration and accessible live-region announcement.

### 27.6 Motion rules

Use subtle 180–320ms interaction motion; wizard/page transitions may be around 250–450ms. Reversing a wizard step should move in the opposite direction. Use spring/layout motion only if it improves continuity. Motion must never delay a critical button or fake data progress. Respect `prefers-reduced-motion`, stop ambient motion in hidden tabs and never rely on animation alone to convey a state change.

## 28. Global undo/redo, command search and in-app guidance

### 28.1 Undo/redo behaviour

Provide global Undo and Redo at the far-left of the top bar before the logo, as requested in the historical brief. These buttons operate on a central action history of reversible domain changes such as editing a draft answer, renaming a farm, moving a field polygon vertex, changing a planned date or modifying an unsaved scenario. The history label should say e.g. “Undo: move boundary point” or “Redo: change irrigation assumption.”

Rules:

- Save an action snapshot or reversible command before mutation.
- Group rapid repeated changes (e.g. drag vertices) into one meaningful history action, not hundreds of entries.
- Do not include passive events like receiving new weather data as user-undoable actions.
- Warn before undoing an action whose reversal may create a stale analysis.
- If undo reverts an input used by an analysis, restore the input and mark affected results stale; do not mutate the historical report.
- Undoing a map geometry edit restores the prior unsaved geometry; undoing a saved geometry is a new versioned correction, not deletion of history.
- History must not allow cross-user actions or cross-farm actions to be replayed after the context changes.
- Disable controls and explain when the selected operation cannot be safely undone.

### 28.2 Global “?” guide

The attachment requests a persistent `?` page guide. Include it consistently on major pages, wizard stages and farm details, but make it discreet. On activation, open a panel that explains: the current page's purpose; the visible sections and key numbers; what each action does; the recommended next 2–3 steps; and relevant glossary definitions. The guide content is contextual to the exact route and active mode, not a generic text dump. Allow closing, keyboard Escape, focus return and dismissible first-use tips. Do not let the guide block critical fields or cover save actions.

### 28.3 Global search / command launcher

A later but valuable enhancement: search farms, fields, crop plans, analysis reports, alerts, tasks and source/methodology entries by name. Include keyboard shortcut only if shown clearly and accessible. Results display type + parent context, so “Wheat” in Farm A cannot be confused with “Wheat” in Farm B. Selecting a result must route to the exact entity context. Search results must obey user permissions and should not index private report content into third-party services without consent.

<!-- SOURCE LINES 1297-1826 END -->

<!-- SOURCE LINES 2007-2012 BEGIN -->
## 30. Page-by-page redesign contract

For every screen below, the builder must implement the named regions in the specified order. When a screen has more content than fits, use a clear hierarchy, meaningful grouping and progressive disclosure, not tiny text. Each primary button must have a real action, pending state and success/failure feedback.

### 30.1 First visit, workspace creation and empty Home

<!-- SOURCE LINES 2007-2012 END -->

<!-- SOURCE LINES 2434-2855 BEGIN -->
## 31. Canonical data model and event contracts

The prior data model must be expanded sufficiently for implementation. Use typed schemas and stable IDs. Exact database technology may vary; semantic contracts may not.

### 31.1 Core entities

- **User/LocalWorkspace:** workspace ID, owner/auth subject if applicable, created date, locale/timezone, preferences, data mode and consent records. Anonymous local-only use must remain possible if chosen; scheduled remote processing requires a secure identity/signed-device binding.
- **Farm:** ID, display name, region/country, timezone, default units, optional farm-level polygon, centroid, notes, created/updated timestamps, archived/deleted state and version.
- **Field:** ID, farm ID, display name, geometry version, area and method, centroid, soil profile references, current crop/rotation ID, profile completeness and timestamps.
- **GeometryVersion:** ID, farm/field ID, geometry, CRS, area/perimeter, source/import method, validation results, effective timestamp, created timestamp and superseded version ID.
- **FarmPractice / FieldPractice:** practice type, structured value/unit, schedule/frequency, effective date range, scope, provenance, original user text if supplied, parsed output, ambiguity flags, user confirmation timestamp and stale/unknown status.
- **CropHistoryEvent:** field ID, crop ID/family, start/end or season, dates certainty (`exact`, `estimated`, `unknown`), source, disease/pest notes and user-confirmed yields if provided.
- **CropKnowledgeVersion:** crop ID, family, duration bounds, crop coefficients/thresholds/source references, planting/harvest conditions, water/nutrient traits, host-family constraints, evidence quality and version. No agronomic constant without a source/reasoning record.
- **AnalysisInputSnapshot:** stable snapshot ID and hash; farm/field/geometry/profile/practice/history version IDs; source payload references and time windows; user priorities; engine/crop database versions; consent state; created timestamp.
- **DataObservation:** source/product/variable, raw and normalised value, unit, start/end timestamp, retrieval timestamp, geometry/pixel/grid information, QC flags, source type (observation/model/reanalysis/estimate), cache ID and provenance ID.
- **DerivedMetric:** metric key, value/unit, time window, calculation ID/version, input references, uncertainty/confidence basis, availability state and explanation keys.
- **RotationPlan:** ID, farm/field, created date, plan status, crop sequence/stages, active version, priority weights, source snapshot, total duration, review triggers and user decision state.
- **RotationCandidate:** analysis ID, candidate ID, sequence, season schedule, hard-constraint checks, total match and component scores, risks/trade-offs, confidence and stable rank explanation.
- **AnalysisRun:** run ID/type/scope, trigger (`manual`, `scheduled`, `recompute`, `scenario`), status, input snapshot ID, source outcomes, stage events, retry count, start/end timestamps, engine versions, result/report ID and failure classification.
- **DeepAnalysisReport:** immutable report ID/version, run ID, farm summary, per-field results, findings, actions, data gaps, previous-report comparison references and export metadata.
- **Alert:** ID, affected entity, type/severity/status, condition/threshold version, evidence references, first/last seen, suppression group, acknowledgment/resolution history and destination route.
- **Action/Task:** ID, affected farm/field/plan/finding, title and description, rationale, source references, status, due window, created-by, completion evidence/notes, deferral reason and revision history.
- **ObservationJournalEntry:** ID, farm/field, event type, narrative, normalized values/units, original user text if applicable, attachments, date/location confidence, author and privacy state.
- **Scenario:** ID, baseline run/plan version, modified input deltas, units, assumptions, name, creation date, result, status and `scenarioOnly=true` marker.
- **Schedule:** ID, owner/workspace, scope, cadence, timezone, next run, enabled state, consent/version, permitted snapshot reference, last/next run, failures, retry policy and delivery preferences.
- **ReportComparison:** IDs of two immutable report versions, scope compatibility, metric deltas, driver categories and comparability status.
- **AuditEvent:** event key, entity reference, user/system actor, timestamp, success/failure, safe metadata and correlation/job ID; never raw secrets.

### 31.2 Entity relationships and invariants

- One farm may contain many fields; a field belongs to one farm at a time, with any relocation represented as a versioned action rather than implicit reassignment.
- A rotation plan belongs to a field; if a farm-level plan spans several fields, each field's sequence and constraints are explicit child plan records.
- One analysis run references exactly one immutable input snapshot.
- One final report references one run and its source/model versions.
- A scheduled run records the exact snapshot/version it used; later local edits do not retroactively alter the report.
- A task may reference a finding but remains a separate record: closing a task does not automatically close an alert or prove improvement.
- Geometry edits create versions; historical analyses reference the geometry version used at calculation time.
- Scenario inputs are isolated from real farm/profile records until a user explicitly applies a reviewed change.
- Source observations are immutable source evidence; normalized/derived values are separate records with transformation/version links.
- Deleted/archived items must not remain selectable as active, but their retention/export behaviour follows the stated deletion policy.

### 31.3 Explicit status types, not overloaded strings

Use enums/unions for status and availability. For example:

- Data availability: `available`, `partial`, `stale`, `unavailable`, `not_applicable`, `demo_only`.
- Evidence type: `observed`, `satellite_product`, `modelled`, `reanalysis`, `farmer_reported`, `farmer_confirmed`, `regional_prior`, `derived`, `scenario_assumption`, `demo`.
- Analysis status: `draft`, `queued`, `validating`, `fetching_data`, `quality_control`, `calculating`, `generating_explanations`, `complete`, `partial`, `failed`, `cancelled`, `retrying`.
- Plan status: `draft`, `candidate`, `active`, `review_recommended`, `superseded`, `archived`.
- Alert status: `new`, `acknowledged`, `snoozed`, `resolved`, `dismissed`, `reopened`.
- Task status: `suggested`, `planned`, `in_progress`, `completed`, `deferred`, `dismissed`, `cancelled`.

Do not encode multiple states into free-form labels and then guess status from text in the UI.

## 32. Backend architecture, APIs and scheduled jobs

### 32A. API contract precision — required for each backend operation

Every remote action must have a written operation contract containing: HTTP method/path; authentication/authorization requirements; request DTO schema; response DTO schema; validation rules; side effects; idempotency policy; timeout; retryability; cancellation semantics; persistence effects; log/correlation fields; and error codes. Example required error envelope:

```json
{
  "error": {
    "code": "SOURCE_UNAVAILABLE",
    "message": "Historical rainfall data could not be retrieved.",
    "retryable": true,
    "correlationId": "opaque-request-id",
    "details": { "sourceId": "NASA_POWER", "stage": "fetch_precipitation" }
  }
}
```

Do not expose stack traces, keys, private prompt contents or exact farm coordinates in user-visible errors. Use appropriate HTTP status semantics (400 schema/validation issue, 401 unauthenticated, 403 not authorised, 404 unknown/inaccessible record, 409 stale-version or conflicting state, 413 upload too large, 429 rate limited, 5xx server/source failure). Validate both browser inputs and server-side payloads; client validation is UX, not a security boundary.

For long-running jobs, submit a job and return a stable job ID plus status; client may subscribe via Server-Sent Events (SSE) or poll a documented status endpoint. Progress events include `jobId`, `stageKey`, safe display label, stage state, timestamp, optional `sourceId` and safe error code. A percentage is optional unless stage weights are defensible. Do not manufacture percentage progress. A cancellation request is best-effort and records whether the calculation stopped or the result was merely ignored at the client.

Every write has optimistic concurrency/version policy. For edits, include `expectedVersion` or an ETag; conflicting writes return 409 and prompt reload/merge rather than overwriting a newer change. For schedules and report generation, use idempotency keys to prevent duplicate jobs on retry. Keep local-only CRUD paths working if the remote scheduler is unavailable; do not silently route private full farm records to remote storage.

### 32B. Backend observability and connector adapter contract

All provider calls go through typed connector adapters rather than being issued ad hoc from page components. Each adapter normalises payloads into a canonical observation schema while preserving raw-product references, timestamps, units, QA flags and provenance. Configure connection/read timeouts, bounded concurrency, retry with exponential backoff/jitter for transient failures, and rate limits from provider docs. Do not retry permanent 4xx/authentication/invalid-query errors blindly. Cache keys include native spatial cell/grid, variable/product, time window, product/version and relevant processing options; do not share private per-farm content under an overly coarse public cache key.

Structured logs include severity, timestamp, service, operation, correlation ID, run ID and safe error class. Logs must not include access tokens, API keys, user secrets, full private prompts, or precise location data unless specifically justified and protected. Add metrics for connector latency, error rate, cache hit ratio, job queue depth, job completion duration, retry rate and schedule lateness. Provider health displayed to users is derived from these actual checks, not a visual-only API ping. Ensure logs/metrics never become a shadow store of sensitive agronomic profiles.


### 32.1 Local-first with explicit scheduled-analysis bridge

Default farm data lives locally where practical (IndexedDB preferred for structured records and larger local data; localStorage only for compact preferences/selected IDs). The small backend exists for scheduled jobs and any explicitly authorised cloud operations. Because a closed browser cannot be read by a server, the product must define the secure bridge:

1. user enables a schedule;
2. frontend presents the exact minimum dataset required by that schedule;
3. user explicitly consents to transmitting that snapshot;
4. snapshot is encrypted in transit and at rest under access control;
5. backend scheduler operates only on that approved snapshot plus permitted refreshed public source data;
6. each job stores input snapshot version/hash, source and result metadata;
7. results are retrievable only by the workspace owner/authorised client;
8. revoking consent prevents future execution, deletes queued data where possible and follows the disclosed retention policy for past reports;
9. sync conflict rules are explicit if local practices change while an older schedule snapshot is pending.

If the user declines cloud snapshots, local analysis can still be run when the app is open; do not falsely advertise unattended scheduling. Explain the choice with simple language.

### 32.2 Service separation

Keep clear interfaces among:

- UI/presentation state;
- domain/application service layer;
- typed API adapters;
- analysis orchestrator/job runner;
- individual external data connectors;
- data cleaning/QC and provenance registry;
- crop knowledge base;
- deterministic calculation engine;
- explanation/claim-validation layer;
- job scheduler and notification delivery;
- local persistence and optional cloud persistence;
- reporting/export service.

The scientific engine should be a deterministic, independently testable module with no direct network or UI dependencies. AI services should not directly set scientific scores or invent source observations.

### 32.3 Minimum API contract families

Implement equivalent endpoints/actions (exact REST names can differ) with typed validation, auth/authorization, request IDs and consistent errors:

**Workspace/profile:** get/update local or account profile, list/create/update/archive farms, list/create/update/archive fields, geometry validate/save/import/export, list versions.

**Wizard:** create draft, autosave answer, get/resume draft, validate current answer, prefill optional evidence suggestions, retrieve review model, update inline answer, start analysis.

**Analysis:** create run, retrieve run, subscribe to progress (SSE/WebSocket/poll fallback), cancel eligible run, retrieve immutable results, retrieve stage/source status, rerun against current inputs.

**Rotations:** list candidates, get candidate details, compare two/three candidates, set active plan, create plan version, mark review recommended, export plan.

**Deep Analysis:** run analysis for selected scope, list/retrieve reports, compare reports, retrieve findings, list/create/complete/defer actions, attach note/observation, request report export.

**Schedule:** create schedule, update cadence/timezone, enable after consent, pause/resume/disable, run now, retrieve job history, revoke snapshot consent.

**Simulator:** run scenario with validated baseline ID and supported deltas, save/rename/duplicate/delete scenario, compare scenarios, request apply-to-real-plan review.

**Sources:** list source registry, inspect data coverage/source status for a region/time, retrieve provenance for a metric, inspect methodology version.

All list endpoints need pagination and documented filtering. Validate all ownership relationships on the server. A valid `fieldId` alone does not prove that it belongs to the requested `farmId`.

### 32.4 Job payload and progress events

A job payload includes: run ID, workspace/owner ID, scope IDs, trigger, immutable input snapshot ID/hash, source requests, expected stage names, engine and crop KB versions, timeout/retry policy and idempotency key. Never include raw credentials in a payload visible to the client.

Progress events include `runId`, `stageKey`, human-readable stage label, status (`pending`, `running`, `complete`, `skipped`, `partial`, `failed`), start/end times, safe message and completion ratio only where measurable. Stage messages must not leak stack traces or secrets. Percent should reflect actual completed work/weighted stages, not a timer pretending to be progress.

Use exponential backoff with jitter for transient failures, explicit timeouts, limited retries and circuit-breaking/backoff for persistently failing providers. Distinguish rate limit, timeout, unauthorized, invalid response, no coverage and internal calculation error. A retry must not create duplicate reports or notifications.

### 32.5 Cache strategy and provenance

Cache data by provider/product + native grid cell or geometry lookup + variable/band + start/end time + product/version + processing options. Use source-appropriate TTLs: static historical datasets may be cached long-term; forecasts and recent conditions expire quickly; soil priors persist with product version and retrieval date. Never reuse a cached value from a different geometry/time window without recording how it was aggregated. Cache invalidation must be targeted after geometry, crop, practice or source-version changes.

### 32.6 Failure, partial success and retry contract

- If one nonessential source fails, continue with valid sources and label the result Partial if the missing source materially affects coverage.
- If a required input/source for a specific calculation is missing, mark that metric unavailable and disable derived actions requiring it.
- If all critical data inputs fail validation, fail the run rather than produce a confident report from defaults.
- Never use a demo value as a silent fallback in a real farm run.
- A rerun creates a new run and report; retrying one failed job retains its identity and attempt history.
- Show what failed, what still succeeded, how it affects the conclusion, and whether retry is useful.

## 33. Scientific logic, confidence and score governance

### 33A. Scientific metric contract and naming grammar

Every number in the UI, report, map inspector, comparison, notification, downloadable brief and AI explanation must have a metric registry entry before it ships. Required fields: stable `metricKey`; display label; definition; unit; spatial and temporal basis; observation/model/calculation type; source/product; input fields; formula/method version; source reference; valid range; missing-data policy; uncertainty/confidence method; allowed page surfaces; formatting precision; status thresholds and who approved the threshold. The UI renderer should obtain labels, units, availability, provenance and status from this registry instead of independently hardcoding them in each component.

Name metrics unambiguously: `precipitation_observed_mm_24h`, `precipitation_reanalysis_mm_14d`, `soil_moisture_percentile_grid`, `root_zone_wetness_modelled`, `vegetation_index_ndvi_composite`, `crop_water_demand_estimated_mm_day`, `rotation_match_score` and `evidence_confidence`. Do not collapse concepts with different semantics into a generic `water`, `soil`, `health` or `score` property. UI copy may be concise but the schema and evidence drawer use canonical keys.

Any calculated score must disclose: numerator/denominator or component structure; scaling range; weights; hard constraints/caps; baseline; missing component treatment; rounding; version; and tests. A visual dial/radial gauge is only a visual representation of an already-computed value; it must not own or invent the value. For uncertainty intervals, label the interval method (e.g. P10–P90) and do not use an arbitrary shaded band.

### 33B. Exact client/backend responsibility boundary

Client: interaction state, local draft state, formatting/unit display, view-mode toggling, derived display grouping and safe offline queueing. Backend/domain service: authorization, schema validation, durable scheduling, canonical source/analysis jobs, server-side keys, immutable reports and cross-device state if accounts are enabled. Shared pure domain modules: formulas/rotation scoring where possible, tested on both client/server using the same inputs/version. The browser must not be the authority for permissions, score thresholds, job state or successful remote persistence. A render component must not independently reimplement agronomic rules.

### 33C. Model/version comparability

An `AnalysisResult` references engineVersion, cropKnowledgeVersion, inputSnapshotId, source snapshot IDs and calculation settings. If a calculation changes, previous reports remain immutable and new comparisons carry a compatibility flag. A direct numeric delta is allowed only when units, scopes, time windows, methods and data semantics are comparable. If not, show a quality/coverage/method change explanation rather than a single misleading delta.


### 33.1 Metric catalogue required before implementing a number

For every displayed score/metric the builder must register:

- stable metric key and human-readable name;
- exact meaning and decision question;
- mathematical formula or reference implementation;
- required inputs, units, temporal range and geometry basis;
- output range/unit and directionality (higher better, lower better, or contextual);
- source evidence type and fallback rules;
- quality filters and missing-data policy;
- model/calculation version;
- validated threshold/interpretation ranges;
- confidence method and known limitations;
- pages/components allowed to display it;
- text used in Simple and Advanced modes;
- tests and evidence/reference citations.

Do not render metrics that do not have this definition. If a metric is planned but not computable, display it in a clearly marked planned/unavailable context rather than inventing a plausible-looking number.

### 33.2 Crop rotation decision engine

Separate hard constraints from weighted preferences:

**Hard constraints** reject sequences that violate supported planting windows, crop availability, minimum family return interval, maximum repeated host/crop-family exposure, crop duration constraints, infeasible transition dates, known water constraints or explicitly user-required/excluded crops. Missing optional values should usually reduce confidence rather than act as an invented hard failure, unless there is a clear agronomic/safety constraint.

**Candidate generation:** produce a diverse set of valid sequences; avoid top N near-duplicates; include meaningful differences in order, family diversity, duration or user-defined constraints. Use deterministic search (e.g. beam search/DP when suitable) with an input-hash seed for tie-breaking. Identical normalized inputs + model versions must produce equivalent ranked outputs.

**Candidate score:** calculate component metrics separately; normalize each with a documented scale; normalize user weights; clamp weights only when defined by product policy and disclose conflicts; calculate the composite from supported components; retain intermediate values for explanation. Do not make component values appear empirical when they are model-based. A score difference of 1 point should not be described as a meaningful winner unless the method supports such a claim.

**Duration and cycle length:** evaluate crop durations allowed by the crop knowledge base; penalize unsupported assumptions about perennial crops, declining performance, disease pressure and feasible planting windows. Evaluate total cycle length; disclose what a “season” means for the location/cropping system. Show review timing based on relevant slow-changing soil factors, data confidence and risk triggers. Do not assume every rotation is four seasons or years.

**Soil dynamics:** only quantify nitrogen, organic matter, carbon or soil-health changes if input/transition models and crop traits are sourced and validated sufficiently. Track units/basis and distinguish a modeled projection from measured soil change. Do not promise microbial activity, disease reduction percentages or nitrogen credits without a transparent evidence basis.

**Fallback/output behaviour:** if no sequence passes hard constraints, show no acceptable rotation under current assumptions and list realistic inputs/constraints that could be reconsidered. Do not manufacture a recommended crop. Always present downsides and mitigations alongside benefits.

### 33.3 Water intelligence

Distinguish reference evapotranspiration (ET₀), crop evapotranspiration (ETc), effective rainfall, reported/observed irrigation and estimated root-zone water state. If implementing FAO-56 Penman–Monteith, use the actual required inputs and unit conventions; if using a simpler proxy, label it a proxy and disclose the approximation—never label a temperature-only heuristic as FAO-56. Document crop-coefficient (`Kc`) and growth-stage assumptions and their source. Show the water-balance period, starting condition, soil water capacity and what is unknown. Do not present rainfall total as identical to effective rainfall.

### 33.4 Soil and vegetation intelligence

Mapped global soil properties are regional/model estimates with native grid resolution and uncertainty; they are not a laboratory test from the user's exact field. The UI must show property, depth interval, units, source, retrieval/version, prediction uncertainty when available and any gap between field size and map resolution.

Vegetation indicators require actual source imagery/index calculations and product quality controls such as cloud/no-data masks and valid scene dates. NDVI cannot be derived from rainfall. Vegetation trend cannot by itself prove disease, nutrient deficiency or irrigation failure. Where no valid optical data exists, show unavailable/cloud-obscured and retain other evidence.

### 33.5 Confidence methodology

Confidence is not a decorative percentage. The team must define confidence levels or a calibrated score from measurable factors such as input completeness, source quality, temporal freshness, spatial fit, cross-source consistency and model applicability. Publish the factors and validation strategy. Until calibrated, use evidence labels such as High / Moderate / Limited with an explicit qualitative basis; do not invent a false-precision confidence number.

Missing-data behaviour must be metric-specific. Missing values are not zero. Never interpolate beyond declared limits. If a fallback source replaces a preferred source, preserve both the attempted primary source status and the actual fallback provenance, and lower confidence if appropriate.

### 33.6 Farm-wide score governance

A farm-wide score is not a required single number until the methodology is defensible. Initially show a farm-wide condition summary plus each field's score/indicators and the worst significant field alerts. If/when a composite index is approved:

- publish components and weights;
- define aggregation by area and whether each component is comparable across fields;
- prevent missing fields silently inflating/deflating the score;
- show coverage and excluded/missing fields;
- retain component and per-field metrics alongside the composite;
- version the score formula and prevent naïve comparisons across incompatible versions.

## 34. External product research: inspiration to adapt, not copy

Research was performed on publicly available official pages/documentation for farm-management and precision-agriculture products. Borrow interaction patterns and product lessons, not proprietary branding, page screenshots, copy or unique visual compositions.

### 34.1 OneSoil — field creation and boundary editing

OneSoil documents multiple ways to create fields: draw boundaries, select detected fields where supported, and import field files. It supports vertex edits and saving boundaries; some workflows also use satellite imagery/index layers to refine the boundary. Inspiration for Field Shift: offer a flexible field-creation entry point and a clear review/save cycle, make geometry editing discoverable, and let the farmer improve a boundary instead of treating the first outline as permanent. Adaptation: Field Shift must make source/coverage limitations visible and should not promise automatic detections where no provider exists.

Source: [OneSoil — How to add fields](https://help.onesoil.ai/en/articles/5235093-how-to-add-fields-in-the-onesoil-platform); [OneSoil — edit field boundaries](https://help.onesoil.ai/en/articles/5237448-how-to-edit-field-information-and-boundaries).

### 34.2 farmOS — locations, event records and tasks

farmOS connects location assets, logs/events, plans, observations and tasks. Its guide shows that a map can be a navigation entry point into connected records, and that planned tasks can later be marked completed, rescheduled or deleted. Inspiration: Field Shift should use relationships between fields, activities, observations and reports instead of treating each page as isolated data. Adaptation: keep Field Shift's simpler farmer-first UI and specialised evidence/rotation engine; do not force the user to manage a complex raw record database for everyday tasks.

Sources: [farmOS User Guide](https://farmos.org/guide/); [farmOS Mapping locations](https://farmos.org/guide/mapping/); [farmOS Logging events](https://farmos.org/guide/logs/).

### 34.3 John Deere Operations Center — operational continuity

John Deere positions Operations Center around setting up farm operations, planning work, monitoring job quality/productivity and learning from seasonal results; it includes farm maps and field-operation context. Inspiration: connect the recommendation to execution and later review, and make operational status accessible on web/tablet/phone. Adaptation: avoid claims of equipment integrations or near-real-time machine monitoring unless Field Shift actually implements those integrations.

Source: [John Deere Operations Center](https://www.deere.com/en-us/products-solutions/technology-solutions/precision-ag-technology/operations-center).

### 34.4 Climate FieldView — comparative field analysis and reports

Climate FieldView describes field-level charts, side-by-side maps, data visualization and custom reports. Inspiration: let Field Shift users compare two rotations, two dated reports or two relevant field layers side by side, and export a clean field/farm brief. Adaptation: comparative visuals must preserve source dates, scale differences and confidence; comparison is not valid when units or datasets are incompatible.

Source: [Climate FieldView — Field Health Imagery](https://climate.com/features/field-health-imagery/).

### 34.5 EOSDA Crop Monitoring — exclusion areas and image selection

EOSDA's user guide documents boundary tools, cutting out parts of a field and choosing available imagery by date. Inspiration: support exclusion zones where needed, explain net cultivable area, and allow selection among actually available valid imagery dates. Adaptation: never assume a current high-resolution image is available for every location/date, and disclose sensor resolution/cloud coverage.

Source: [EOSDA Crop Monitoring — Add Field](https://eos.com/user-guide/crop-monitoring/add-field/).

### 34.6 What Field Shift should uniquely contribute

Competitor inspiration is a foundation, not the product's differentiation. Field Shift should be defined by the connected reasoning loop: NASA/soil/climate evidence with explicit quality and resolution; deterministic crop-rotation planning and duration logic; per-field Deep Analysis; farmer practice inputs; transparent “why this changed” reports; scheduled reassessments with consent; and recommendations that become trackable actions without pretending that the software controls the farm.

## 35. Complete interaction acceptance matrix

### 35A. Precision design and interaction verification extension

For each matrix row, add four separate acceptance assertions: (1) **visual state** — exact active/disabled/loading/selected/error treatment and layout region; (2) **domain transition** — the state-machine transition and entity mutation; (3) **data effect** — dependency invalidations, saved version, report/schedule/alert changes; (4) **navigation/context** — route destination and preserved farm/field/plan/date context. Passing only one category is not a pass.

For every key page, store approved screenshot baselines at 1440px, 1280px, 768px and 390px. Use visual regression diff thresholds that flag material spacing, wrapping, clipping and contrast changes without failing on harmless antialiasing. Verify computed CSS for design tokens in smoke checks (e.g. expected card alpha, 16px radius, focus outline) where feasible. Test both a dark quiet background and a high-detail photo backdrop to ensure glassmorphic text remains readable.

For each interactive element test keyboard focus/activation, touch-sized target, disabled explanation, duplicate click suppression, save pending/failure handling and accessible status announcements. For each metric test formatting, units, unavailable state, source drawer, stale state and consistent value across Home, Farm Detail, Deep Analysis and Export. Include a “one field critical, other fields healthy” regression test to ensure portfolio aggregation does not mask the critical field.


The builder must convert this matrix into automated tests where possible and manual checks where map/canvas accessibility or provider behaviour requires them.

| Trigger | Expected UI reaction | Data/logic reaction | Failure/edge rule |
|---|---|---|---|
| Change active farm | All farm-context indicators update together; heading/breadcrumb changes | Re-query only the selected farm, cancel stale client requests | Never flash old farm data as current; invalidate field selection if unrelated |
| Change active field | Field-specific cards, rotation, calendar and reports update | Resolve dependencies from field ID and version | Verify field belongs to active farm |
| Click crop tile anywhere | Opens the correct rotation stage and selected field | Resolve by stable IDs | Same crop name in two farms must never cross-link |
| Click farm name/“open details” | Opens that farm detail overview | Route includes farm ID | Never return only to `/farms` generic listing |
| Draw field polygon | Vertices/edge preview/area update live | Store draft geometry until saved | Invalid polygons cannot be saved; draft can be cancelled or undone |
| Move polygon vertex | Selected vertex and shape update; area recomputes | Geometry draft becomes dirty | Large or invalid changes show geometry validation before commit |
| Save boundary | Confirmation and saved status; updated area appears everywhere | New geometry version; invalidate affected spatial analysis | Past reports preserve old boundary version |
| Cancel map edits | Restore persisted geometry | Discard draft with user confirmation if dirty | Never drop unsaved edits silently |
| Switch map layer | Legend, date, provenance and raster change consistently | Fetch/resolve the actual layer for same bounds | Keep field selection; no-data layer explains why |
| Tile/geocoder failure | Error banner + manual alternative | Record provider failure safely | App remains usable; no infinite loader |
| Change crop history | Affected plan/results marked stale | Invalidate family-return/sequence calculations | Unrelated farm/field results remain valid |
| Change irrigation routine | Show save confirmation and affect appropriate outputs | Update practice version; scheduled snapshot policy applies | Does not retroactively alter old reports |
| Save wizard answer | Visible Saved state | Update draft and affected validation state | Save failure remains visible with retry |
| Edit review answer | Inline edit/save/cancel; changed row updated | Mark dependent run stale; recompute when requested | Do not re-run silently on every edit |
| Start rotation plan | Truthful staged progress | Fetch/validate inputs; create run snapshot | Only say a stage completed when actual work completed |
| Source partially fails | Partial-result banner and per-metric status | Continue only independent calculations | No silent demo/default substitutions |
| Select rotation candidate | Main sequence, risks, scores, detail panels all switch together | Use candidate ID and matching snapshot | Do not leave component scores from previous candidate |
| Compare two rotations | Side-by-side results and conclusion update | Compare same metric definitions and units | Incompatible metrics marked not comparable |
| Save as active plan | Confirmation and active label across relevant pages | New plan version and status transition | No historical report rewrite; audit plan selection |
| Change scenario control | Result delta updates with source/assumption label | Recompute scenario deterministically | Does not write to real farm inputs |
| Apply scenario | Review diff modal; user confirms | Create new real input/plan version if accepted | Scenario remains preserved as scenario history |
| Run Deep Analysis | Preflight and stages shown; report added on completion | Freeze snapshot, evaluate fields, aggregate, persist report | Partial/failed run never looks fully successful |
| Enable schedule | Consent and preview completed | Persist schedule and exact permitted snapshot | No scheduled cloud execution without opt-in |
| Rainfall arrives | Relevant future run can incorporate correctly typed data | Update environmental observation/cache and stale dependencies | Forecast is not observation; rain does not imply no irrigation |
| Scheduled job fails | Show retry/status/error reason and last successful report | Retry under limits; record job history | Do not duplicate reports/notifications |
| Complete task | Status updates in calendar/actions | Store completion event and note | Does not automatically resolve alert or claim impact |
| Dismiss alert | Notification is dismissed/suppressed per policy | Underlying signal remains until resolution condition | Explain “dismissed” is not “fixed” |
| Export report | Real generated PDF/CSV is offered | Authorised server/client export uses report snapshot | Failure gives actionable retry; no fake download button |
| Change units | All visible supported values convert consistently | Canonical store remains metric; convert at presentation/input boundary | Never mix units on one table without labels |
| Toggle Advanced mode | Relevant detail is revealed; selection/context persists | Same result model/calculations | No score or recommendation changes due to mode alone |
| Global Undo/Redo | Tooltip identifies action; relevant values restore | Reverse/reapply valid local action and invalidate dependent outputs | External/irreversible effects require compensating action, not false undo |
| Browser Back/Forward | Navigation behaves normally and restores route context | URL state is source of truth for shareable views | Not conflated with domain Undo/Redo |
| Delete farm | Confirmation shows effects/retention | Delete/archive through consistent cascade policy | Must not leave orphaned fields/jobs or misrepresent cloud erasure |
| Keyboard-only operation | All controls and map alternatives accessible | Same operations available | No critical workflow trapped in pointer-only canvas |

## 36. Required automated test suite and release gates

### 36.1 Unit tests

Test: input validation, coordinate ranges, polygon ring closure/self-intersection, geodesic area calculations, unit conversion, score normalization, weights bounds/sum, crop family return intervals, crop duration bounds, cycle length, season/year distinction, sequence hard constraints, nitrogen-credit assumptions where implemented, water-balance unit consistency, confidence/coverage caps, data fallback provenance, determinism and unchanged-input hashing.

### 36.2 Integration tests

Test each source connector's valid response, empty/no-coverage response, HTTP errors, malformed schema, missing fields, rate limits, timeout, retries, cache hit/miss, stale cache, version change, and privacy-safe log output. Test backend access-control checks for cross-user farm/field IDs and cross-farm mismatched IDs. Test schedule creation, consent revocation, idempotent run/retry and report retrieval.

### 36.3 End-to-end workflows

1. First visit → Add Farm → location search or manual coordinate → draw boundary → save → add two fields.
2. Boundary edit → undo/redo vertex → cancel and restore; repeat and save; confirm area and stale analysis updates.
3. Import GeoJSON with multiple polygons, malformed geometry and excluded area; validate outcomes.
4. Run rotation wizard, back/forward through every stage, skip optional answers, close/reopen, inline edit review and re-run.
5. Select candidate 2 and verify all related scores/risks/details update to candidate 2.
6. Compare two rotations; verify conclusion reflects selected weights and disclosed assumptions.
7. Navigate to the same crop from Home, Calendar and rotation page; ensure exact farm/field/rotation/season opens.
8. Run Deep Analysis for all fields; verify report, partial sources, farm summary and each field result.
9. Compare two reports with same engine; then simulate engine version change and verify comparability warning.
10. Enable scheduled analysis with consent, run it, retry a failure, revoke consent and verify future job stops.
11. Confirm forecast rain and observed rainfall are displayed as separate categories; ensure rainfall does not change irrigation record without evidence.
12. Save scenario, test values, compare to baseline, apply through confirmation and verify old reports/scenario remain immutable.
13. Complete a task; ensure calendar updates but alert/field condition does not falsely resolve.
14. Unit switch updates Home, charts, tables, rotation details, field geometry area and exports.
15. Toggle Simple/Advanced; confirm same values and ranks, only detail changes.
16. Keyboard-only path for main wizard, farm creation, rotation selection, report drill-down, calendar and settings.
17. Mobile/desktop tests, browser zoom, reduced motion, screen reader summaries and offline/poor network handling.

### 36.4 Visual release gates

No overlapping text; no clipped crop sequence; no page-wide horizontal overflow at defined test widths; no tiny essential text; consistent typography; clear main action per view; no card nesting clutter; balanced page width; map toolbar/inspector fit; readable legends and tables; focus state visible; animation disabled/reduced appropriately; screenshots reviewed for Home, My Farms, farm detail, map editor, Rotation Results, rotation detail, Deep Analysis, report detail, schedule setup, Simulator, Calendar, Data & Trust and Settings.

### 36.5 Data integrity release gates

- Every displayed generated value has provenance and actual source/type status.
- Every derived metric has a definition/formula/version and required-input test.
- No placeholder or demo value can silently enter a real record.
- No output is labelled live/observed/forecast/satellite without matching source evidence.
- Repeated identical inputs and versions give reproducible engine results.
- Existing reports do not change because the user edited current inputs later.
- Schedules cannot run on data the backend has no permission to use.
- Every visible interactive control performs a tested action or is explicitly disabled with an explanation.
- Every map boundary edit is validated and versioned.
- Cross-page farm/field/crop navigation opens the exact target entity.

## 37. Implementation handoff summary for the builder

Build Field Shift as a fully integrated rebuild with these priorities:

1. Canonical domain model, design system, routes, navigation context and global undo/redo semantics.
2. Farm/field setup plus reliable full-screen map and boundary editor.
3. Home and My Farms with exact farm-context navigation.
4. Rotation wizard, deterministic engine interfaces, ranked plans and deeply explained comparison/detail outputs.
5. Farm Intelligence / Deep Analysis, immutable report history, per-field and farm-wide reporting.
6. Data & Trust, actual connector inventory, provenance, formula registry and meaningful unavailable states.
7. Actions/calendar/journal/notifications with real linked records.
8. Scenario simulator with strict isolation from real farm inputs.
9. Scheduled backend jobs with minimum snapshot, explicit consent, schedule controls, retries, source freshness and safe notifications.
10. Seasonal reviews, recommendation impact feedback, field brief and higher-dependency portfolio/offline enhancements according to the roadmap.
11. Full automated tests and responsive/accessibility polish.

**Never trade credibility, usability or data integrity for the appearance of complexity.** The standard is not “many cards and advanced effects.” The standard is a connected agricultural decision-support platform in which every important action has a defined consequence, every conclusion can be traced to evidence, and every page makes the next useful action obvious.

## 38. Additional external research references

The following official sources were reviewed to guide product patterns and technical caveats. They supplement the original plan's source list and should be rechecked during implementation:

- OneSoil, adding fields by drawing, selecting supported map delineations and importing boundaries: <https://help.onesoil.ai/en/articles/5235093-how-to-add-fields-in-the-onesoil-platform>
- OneSoil, editing field names and boundary vertices: <https://help.onesoil.ai/en/articles/5237448-how-to-edit-field-information-and-boundaries>
- farmOS user guide, connected location records, dashboard map and upcoming/late tasks: <https://farmos.org/guide/>
- farmOS mapping locations, geometry editing and geolocation/search affordances: <https://farmos.org/guide/mapping/>
- farmOS event logs, pending/done activities, observations and task history: <https://farmos.org/guide/logs/>
- John Deere Operations Center, farm operations, field mapping, planning and seasonal analysis: <https://www.deere.com/en-us/products-solutions/technology-solutions/precision-ag-technology/operations-center>
- Climate FieldView, field-level visualization, side-by-side maps, analysis and reports: <https://climate.com/features/field-health-imagery/>
- EOSDA Crop Monitoring, field boundaries, exclusion/cutout areas and date-selectable imagery: <https://eos.com/user-guide/crop-monitoring/add-field/>
- NASA POWER Daily API: <https://power.larc.nasa.gov/docs/services/api/temporal/daily/>
- NASA SMAP L4 current product information and model-assisted root-zone moisture estimates: <https://ntrs.nasa.gov/citations/20260007170>
- SoilGrids resolution, depth intervals and quantified uncertainty: <https://docs.isric.org/globaldata/soilgrids/index.html>
- Open-Meteo historical weather/reanalysis distinction: <https://open-meteo.com/en/docs/historical-weather-api>
- OWASP Logging Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html>

---

# Final instruction to the AI builder

Treat the whole document as the master product prompt. Read it all before implementing. Do not cherry-pick only the visually exciting screens. Preserve all the intended capabilities and interactions, explicitly resolve the known contradictions, implement the underlying state/data contracts, and validate the product with the acceptance tests. If the environment cannot implement an integration or background job, do not simulate its success: build the correct interface contract, mark the dependency clearly, and report the block. Do not ask the user to restate requirements that are already in this document. Make professional, reasoned decisions for any gaps, record those assumptions, and continue. The finished application should feel redesigned as one coherent product, not like the old product with a new coat of paint.

<!-- SOURCE LINES 2434-2855 END -->

<!-- SOURCE LINES 2856-2925 BEGIN -->
## 39. Global Simple Mode / Advanced Mode contract — mandatory on every page

### 39A. Mode-aware visual disclosure pattern

The mode switch must change information density by progressive disclosure, not alter the underlying page grid arbitrarily. Simple Mode shows primary conclusion, practical meaning, top action and only the metrics needed for the decision. Advanced Mode retains the same summary region and adds a clearly labelled `Technical details` area: source/provenance rows, formula/assumptions table, uncertainty, model version, source coverage and raw series. Use tabs/accordions for multiple technical blocks; do not render every Advanced metric in a giant grid of cards. Visual tokens and component sizing remain identical between modes; only sections/columns and detail rows change.

A mode toggle transition is a small opacity/layout transition (180–240ms) without re-mounting the entire route or losing field, report, filter, scroll or draft state. Persist the preference in the documented store. When switching from Advanced to Simple while a technical drawer is open, close or preserve its state consistently and return focus to the mode toggle. Never put an unavailable metric into Simple as a guessed status or into Advanced as a fake precise value.


This is a global presentation mode, not a feature-specific toggle. It is visible in the global header and in Settings. The chosen mode persists between routes, farms, fields and visits within the workspace. After an analysis completes, Simple Mode must show the dismissible invitation described in §39.5.

### 39.1 Core rule

Both modes consume the same complete `FarmAnalysis`/canonical report model. The scientific engine and calculations do not change when switching modes. Advanced Mode does not use a different model; it reveals more of the same calculation record. Switching mode must never change a score, reorder rotations, alter a recommendation or invalidate an analysis merely because the display preference changed.

**Simple Mode:** show the most important conclusion first; plain language; at most 2–3 supporting facts near the headline; no unexplained technical metric; one clear next action; concise supporting context; a “See details” route for every important conclusion.

**Advanced Mode:** keep every Simple Mode summary, then add the full available numeric results, component scores, raw/source-derived inputs where appropriate, provenance labels, units, date/window, source resolution, quality flags, confidence components, uncertainty range, alternative rankings, historical series, formula, intermediate calculation values, thresholds, assumptions, model/crop knowledge base version and scientific citations. Organise these in tabs, data tables, accordions, evidence drawers and downloadable records so that “show everything” does not mean “dump everything into one screen.” Never hide material limitations in a footnote that is hard to find.

### 39.2 Mode persistence and transitions

- The single global toggle is always available through Settings and a visible header/profile control.
- When switched, all routes update immediately without losing selected farm, field, current tab, scroll position where sensible, selected candidate, filters, unsaved text or selected report. Never remount the entire app in a way that destroys draft state.
- If the mode changes inside a modal/popup, update the rest of the application and close the popup once the choice is applied.
- When changing from Advanced to Simple, do not delete detailed data; only collapse/hide it.
- A user can drill into an advanced evidence drawer while in Simple Mode. Close the drawer to return to the same Simple Mode page; don't silently flip the global mode.
- Store mode in local preferences and sync across signed-in devices only if account sync is enabled and disclosed.
- Simple/Advanced setting is not a subscription tier. No billing/paywall should be attached to the mode.

### 39.3 Advanced information organisation

Advanced pages must support progressive disclosure:

1. Human-readable summary (same as Simple Mode).
2. Key metrics and component breakdown.
3. Trends and comparisons.
4. Data table with units, dates, sources and quality status.
5. Calculation/methodology expansion with actual input substitution.
6. Assumptions, confidence and known limitations.
7. Export/print of the relevant evidence record, if implemented.

Use tabs only when they represent different jobs; use accordions for optional detail within the same job. Do not create an accordion for every individual sentence or bury critical risks in an accordion. Use table column configuration/filters for large technical datasets. On mobile, horizontal tables must be inside their own labelled scroll region and include a responsive stacked alternative for the most important data.

### 39.4 Post-analysis Advanced Mode invitation

After **each successfully completed user-triggered analysis** that leaves the user in Simple Mode, show a small dismissible popup/card, not a full-screen interruption:

- Title: “Want to explore the full analysis?”
- Body: “Advanced Mode reveals the underlying data, score breakdowns, assumptions and calculation details. Your recommendations will stay the same.”
- Primary action: “Switch to Advanced Mode.”
- Close icon `X`, plus secondary “Stay in Simple Mode.”
- The card is keyboard accessible, labelled to assistive technology, and does not steal keyboard focus from the analysis result. Escape closes it. The result remains fully usable underneath.
- Clicking Switch updates global mode immediately and reveals Advanced sections on the current result. Clicking X/Stay closes it and leaves the user in Simple Mode.
- The invitation appears after a completed analysis, not after every chart refresh, automatic re-render, schedule heartbeat or retry event. For a scheduled analysis, offer the prompt only when the user opens the completed report in Simple Mode—not as a popup over a background page while no user is present.
- A partial or failed analysis does not present itself as a successful analysis just to show this prompt.

### 39.5 Mode-specific global header and notifications

Simple header: active farm name/location; notification bell/count; current mode control; Settings; basic notification preferences and units. Simple notification drawer uses plain-language summaries, farm/field name, and the next action.

Advanced header/drawer adds full alert record: source, variable, measurement/value, unit, observation/retrieval time, historical baseline, anomaly magnitude, threshold/version, confidence/evidence type and links to the method. Settings additionally exposes source status, refresh/cache state, engine/crop KB versions and relevant export options.

### 39.6 Global mode invariants

- Every Simple Mode metric comes from the same source/model as its Advanced equivalent.
- Advanced cannot show a metric that was never computed or is unsupported; it shows an explicit unavailable state plus reason.
- Mode does not change formulas, thresholds, hard constraints or the source selection policy.
- If a score is unavailable, Simple Mode explains the gap in a sentence and Advanced gives the missing inputs and source state.
- If Simple Mode uses “Good / Needs Attention / Alert,” Advanced shows the same status with the supporting component values and thresholds.

<!-- SOURCE LINES 2856-2925 END -->

<!-- SOURCE LINES 3083-3141 BEGIN -->
## 43. Data freshness, change propagation and calculation dependency registry

### 43A. Visual propagation and cache invalidation contract

For every input/metric dependency, declare the dependency edge and invalidation action. Example: changing a field polygon invalidates derived area, centroid, field-sampled environmental aggregates, geometry-dependent confidence, map extent/selection cache and future assessments; it does not mutate old reports. Changing irrigation availability invalidates the future water-balance baseline, candidate rotation water scores, water-related risk assessment and affected scenario baseline; it does not alter recorded past irrigation events. Changing crop-history events affects rotation hard constraints, crop-family return intervals, disease-risk calculations and candidate ranking. UI states should show a small `Out of date` label next to affected outputs, with a `Why?` popover listing changed inputs and `Recalculate` action.

Implement a dependency registry or typed domain event mapping rather than a scatter of manual `setIsStale(true)` calls. Use keys including entity ID, geometry/profile/version, metric/source, time window and engine version. Cache invalidation must be scoped, so changing Field A does not mark Field B's unrelated report stale. A background weather refresh can update source observations but should not silently rewrite an immutable Deep Analysis report; instead show `New data available` and offer a new run. An empty/no change result is still a legitimate event state and should not generate an alert by default.


Implement a dependency map so every change invalidates the right results and no more than necessary. Example dependency chain:

- **Boundary geometry** → area/centroid and spatial aggregation → soil/grid overlap and vegetation aggregation → confidence/coverage → field status, water/soil context, rotation ranking if field size/location meaningfully changes, Deep Analysis baseline. It does not change historical reports.
- **Soil lab values/profile** → soil suitability, pH/salinity/drainage constraints, applicable water-holding model, rotation score and report.
- **Crop history** → family-return intervals, disease-cycle logic, rotation generation and current sequence context.
- **Irrigation source/limit/routine** → water balance, crop suitability, water risk, action priorities, Deep Analysis, schedule input snapshot.
- **Recorded irrigation event** → actual management history and water balance for its stated period; do not infer unrecorded events.
- **Rainfall observation/reanalysis** → relevant water balance and weather trend; must not imply irrigation status.
- **Forecast update** → forward-looking planning windows/risks; does not rewrite observed historical rainfall.
- **Crop plan/date change** → crop stage, calendar, per-stage climate/water/risk model and active-plan status.
- **Crop knowledge base/model version** → candidate scores and comparability flags; generate a new run, retain the earlier version.
- **Display mode/units** → presentation only, not scientific outputs.
- **Scenario slider** → scenario branch only, not real farm records.

For each value, store `observedAt`, `retrievedAt`, `validFrom/To` if relevant, `sourceProductVersion`, `qualityStatus`, `staleAfter/TTL`, and the dependency/engine version. A UI refresh does not magically make old source data newer. Show “checked now; latest available observation is dated …” when applicable.

When an input changes, display a small banner on affected result screens: “This assessment uses the previous irrigation setup. Update the analysis to use your new information.” Buttons: “Review changes,” “Run updated analysis,” “Keep viewing previous report.” If viewing an immutable historic report, do not overlay current values and make the old report appear updated.

## 44. Requirement coverage ledger — do not silently skip source requirements

### 44A. Requirement-to-implementation traceability requirement

Extend the ledger with these columns: requirement ID; source text/reference; page/route; component ID; design token/material profile; domain entity/API/service; calculation or state transition; dependency/invalidations; unit/integration/E2E test IDs; screenshot baseline ID; implementation status (`not_started`, `in_progress`, `implemented`, `verified`, `blocked`); test evidence; and blocker reason. One requirement may map to multiple pages but must have one canonical rule/implementation. A page-level row cannot be marked `verified` based only on visual appearance. “Already exists in source” is not proof of completion; it must be retested after rebuild.


Before implementation starts, the builder must create an explicit checklist in code/docs linking every category in the source attachment to the implementation section and tests. At minimum include:

- product goal and scientific honesty;
- question-by-question setup flow, Save/Resume, editable review and priority sliders;
- world map constraints and location search/manual coordinate fallback;
- farm/field boundaries, multi-field structure, drawing/editing/import, undo/redo, geodesic area and versioning;
- NASA POWER, SMAP, MODIS/vegetation, NASADEM, GPM IMERG, SoilGrids and weather forecast/historical data handling, with integration status accurately labelled;
- data-source cache, fallback ladder, cleaning/QC and provenance;
- deterministic crop scoring, hard constraints, multi-season sequence/duration/cycle selection, diversity of candidate plans, confidence and uncertainty;
- crop-family, legume/carryover, fallow-vs-cover-crop, water, soil and disease claims, only when the knowledge base/model supports them;
- rotation overview, detailed page, score components, head-to-head comparisons, rejected candidates, risk mitigation, calendar, print/export;
- Home daily tracker and all required current-condition/crop/water/soil/weather/health/alerts/tasks/trends/trust fields;
- My Farms portfolio, farm/field details and every field tab, history and settings;
- Simple and Advanced Mode across every relevant page, global toggle and post-analysis prompt;
- Deep Analysis, farm-wide and field-level results, natural language management input, dated reports, comparison and confidence;
- schedule setup, data consent/snapshot, routine confirmation, rain incorporation, job lifecycle, retries and privacy;
- notifications, task lifecycle, field journal and recommendation feedback;
- What-If Simulator and separation from economic/market simulation;
- Data & Trust page, formulas/methods and source registry;
- global breadcrumbs/context, entity-aware navigation, undo/redo and page guide;
- no emojis, no glow/neon-heavy effects, legible typography, responsive content and no overlap;
- testing, error states, accessibility, offline/partial-source handling, deployment configuration and final completion report.

Each checklist row must have status, route/component/engine location, automated test ID (or reason a manual test is required), and proof/test result. This prevents a builder from skipping a requirement because it thinks an earlier app already contains it. The new implementation must independently satisfy the requirement.

<!-- SOURCE LINES 3083-3141 END -->

<!-- SOURCE LINES 3298-3327 BEGIN -->
## 49. Final source-derived requirements that must stay explicit

This list consolidates source details that are easy to omit during a rewrite:

- Keep a user-controlled farm name. Map search, selected pin and geocoder do not overwrite the custom name.
- Add Farm / Start New Analysis starts a clean draft; never prefill another farm's values unless an explicit “copy settings” action is selected and reviewed.
- Wizard step transitions animate smoothly and directionally; Back works on every step; progress autosaves; review answers are inline-editable.
- The world map shows once, does not loop infinitely, fits/resizes, offers a pin/search/manual coordinate fallback, and does not require a secret browser API key for a chosen open basemap.
- Global Undo/Redo sit at the far left before the logo, are not oversized cards and operate on reversible edits; map editor also provides contextual undo/redo.
- Clicking any crop label/image/date from any page opens the right farm → field → rotation → season/crop detail; the current crop remains clear when multiple fields/farms grow the same crop.
- Calendar cells that contain crops from different farms must show multiple clearly distinguishable events, not one ambiguous crop block; clicking reveals each event separately.
- Home and farm details use the same source of truth for farm status, water/soil status, alert severity and suggested action.
- Simple Mode keeps the farm tracker glanceable: farm status, weather, current crop, rotation position/days left, water/soil plain summaries and next action. It does not display Sequence Analysis, Additional Insights or a long technical AI overview on the rotation output; these are Advanced-only or move to Farm Intelligence.
- Advanced Mode contains the expanded scientific material detailed in §§39–47, structured by purpose and disclosure level.
- Farm Tracker must have a coherent weather mini-app card, a clear farm info region, a current-crop photo card with remaining duration overlay only when valid, clean action card, historical crop/weather card, confidence explanations in accessible tooltip/popover, and a distinct last-data-updates card.
- Do not show a dedicated “Field Log” card on Farm Tracker; keep contextual notes in the separate journal/actions area.
- Crop Rotation output needs the “why selected vs alternatives” interaction as well as positives, drawbacks, risk-management steps and score interpretation.
- Distinguish individual **Crop Suitability** from complete **Crop Rotation Plans** in page titles/sub-navigation.
- Add a clearly visible brief intro that explains what crop match percentages mean in plain English.
- A secondary navigation bar and Sort/Filter controls must be clearly separated and visually legible throughout the app; avoid overlays, text collision and nested-card clutter.
- The `?` guide appears on every main page and wizard section, opens contextual short simple guidance and offers meaning for the visible metrics/actions.
- Use professional SVG icons, never emoji glyphs as UI icons.
- Smooth animation is used where it clarifies a state change; reduced-motion preference is respected.
- Test all visual/functional changes at wide desktop, laptop, tablet and mobile widths; specifically check overlap, crops/cards, page-level overflow, fixed nav overlap, calendar sizing and map resize.
- A build passing or a generated historical action summary is not proof of scientific correctness. Check formulas with reference calculations, verify source values and explicitly report what could not be verified.



---

<!-- SOURCE LINES 3298-3327 END -->

<!-- SOURCE LINES 3328-3886 BEGIN -->
# Appendix A — Current Codebase Audit and Mandatory Remediations

# FIELD SHIFT — Current Codebase Audit and Rebuild Reconciliation

**Snapshot reviewed:** `Pasted text(7).txt`, uploaded 22 October 2026  
**Purpose:** Reconcile the master rebuild prompt with the actual supplied implementation.  
**Review type:** Static source review. This is not a claim that the app has been executed, deployed, or scientifically validated.

## Executive conclusion

The uploaded dump contains **100 project file sections** across the React/TypeScript interface, page components, calculation engines, data services, storage helpers, styling, and an Express server. It is considerably more useful than a requirements document alone: it reveals existing workflows worth retaining, implementation shortcuts that should not survive the rebuild, and gaps between what the interface says and what the code actually does.

The rebuild should therefore be a **source-informed redesign, not a blind rewrite and not a cosmetic reskin**. Preserve valuable product logic only after it has been reviewed and tested. Preserve the user's intended capabilities, not misleading labels, fake API success states, hard-coded results, or unimplemented promises.

### What currently exists in the code

- React 19 + TypeScript UI, Vite, Tailwind CSS, Motion, Lucide icons and Leaflet.
- Root application state and tab-based navigation in `src/App.tsx`.
- Home/daily tracker, My Farms list, farm detail workspace, crop calendar, rotation output, what-if dashboard, an additional simulator component, settings, Data & Trust Center, setup wizard and map pin picker.
- A crop knowledge base and deterministic scoring/rotation engine in `src/engine/crops.ts` and `src/engine/scoring.ts`.
- A soil-hydraulics/soil-pH helper engine in `src/engine/soilEngine.ts`.
- NASA POWER monthly climate retrieval and a regional fallback in `src/services/nasaApi.ts`.
- Open-Meteo current-weather retrieval in `src/services/liveWeather.ts`.
- Client-side alert generation and a daily status snapshot in `src/services/nasaAlerts.ts` and `src/services/dailySnapshot.ts`.
- Two Express AI endpoints in `server.ts`.
- Browser-local persistence through `localStorage`, plus backup-related code in `src/store/farmStorage.ts` and `src/store/userStore.ts`.
- Numerous reusable UI components and a sizable existing layout library.

### What the code dump does not prove

The dump does not include a runtime trace, deployed environment, configured secrets, live API response captures, an automated test suite, dependency lockfile, or actual binary/static media assets. A dependency installation attempt timed out, and the globally available TypeScript compiler could not resolve `vite/client` because the project dependencies were not installed in the review environment. Therefore no successful production build, browser run or end-to-end test is claimed here. The points below are static findings to turn into implementation and test work.

## 1. Existing source inventory

The builder must check each listed area before deleting or replacing it. File existence does not certify behaviour; the audit identifies likely purpose and the required disposition.

### Application and configuration

| File | Current role | Rebuild disposition |
|---|---|---|
| `package.json` | Runtime scripts and dependencies | Revisit production scripts, lockfile, test tooling, security posture and dependency versions. |
| `tsconfig.json` | TypeScript configuration | Keep strict, reproducible type checking; fix rather than suppress domain-type errors. |
| `vite.config.ts` | Vite and Tailwind integration | Retain only necessary configuration; separately document development and production commands. |
| `index.html` | App shell, metadata, fonts, Leaflet CSS | Update product metadata and accessibility/theme defaults; avoid conflicting external CSS assumptions. |
| `server.ts` | Express + Vite dev middleware + AI endpoints | Refactor into validated, secured API/services; add no scheduler claim until a real queue and durable store exist. |
| `metadata.json` | Product metadata/capability declarations | Align declared capabilities with implemented functionality. |
| `.env.example` | Environment variable template | Document all required variables; never include real secrets. |
| `src/index.css` | Global styles, theme tokens and animations | Replace with canonical design tokens and accessible motion rules; reduce glows and visual noise. |
| `src/main.tsx` | React root | Preserve as entry point, add app-level error boundary and route setup as required. |
| `src/App.tsx` | Navigation, active farm, local analysis state, modals, wizard and main view routing | Refactor into route/state architecture. Fix duplicate tab paths and ensure navigation and analysis jobs are independent. |

### Engines, services, and stores

| File | Current role | Rebuild disposition |
|---|---|---|
| `src/engine/crops.ts` | Crop knowledge base | Preserve domain knowledge only after parameter/source review; version every parameter set. |
| `src/engine/scoring.ts` | Priority weights, crop suitability, rotation generation, confidence and What-If scoring | Preserve reusable functions after unit/property testing; fix assumptions documented in §4. |
| `src/engine/soilEngine.ts` | Soil hydraulic priors, moisture comparisons, pH/drainage analysis | Retain as a model helper, but label texture-derived estimates and do not present priors as lab observations. |
| `src/services/nasaApi.ts` | NASA POWER historical/monthly pull, ET₀/GDD/trend routines and fallback | Keep the actual connector but correct metric semantics, period labels, gaps, fallback provenance and unsupported variables. |
| `src/services/liveWeather.ts` | Open-Meteo current conditions, local time and fallback | Keep the connector after freshness, fallback, timeout, location/timezone and advice logic are reviewed. |
| `src/services/nasaAlerts.ts` | Derived moisture, heat, rain and NDVI alerts | Rebuild around time-aligned, evidence-supported signals; disable unsupported NDVI alerts until real imagery is connected. |
| `src/services/dailySnapshot.ts` | Farm tracker summary, derived crop phase, condition labels and next action | Replace fixed 90-day assumptions and default metric values with a date-aware, evidence-backed snapshot. |
| `src/services/aiService.ts` | Calls server AI endpoints and local fallback text | Keep as a provider adapter; label AI unavailability and never pass fallback prose off as a generated analysis. |
| `src/services/cropImages.ts` | Crop image lookup/fallback | Keep an image registry with reliable licensing/alt text/fallbacks; images must never imply measured farm evidence. |
| `src/store/farmStorage.ts` | Farm CRUD, wizard draft, crop sanitisation, seed farms, JSON backup/import | Migrate to a versioned schema; fix empty-list reseeding and export/import validation; opt-in demo data only. |
| `src/store/userStore.ts` | Local profile/settings and preset accounts | Replace fake authentication/preset accounts with a truthful local profile or actual auth integration; remove hard-coded personal profile data. |
| `src/store/useAppStore.ts` | Defaults, blank answers and helper hook state | Consolidate with a canonical typed store; remove geographic defaults that silently look like user input. |
| `src/types/index.ts` | Main domain interfaces | Preserve useful domain distinctions, add Farm/Field boundary and geometry versions, inputs, reports, jobs, provenance, actions and explicit status enums. |

### Main pages and feature components

| Area | Files present | Rebuild disposition |
|---|---|---|
| Home | `HomeView.tsx`, `HeroSection.tsx`, `DailyFarmStatusCard.tsx`, `DailyWeatherCard.tsx`, `CurrentConditionsCard.tsx`, `LatestNasaDataCard.tsx`, `YourFarmsCard.tsx`, `RecentAnalysisCard.tsx`, `WaterIntelligenceCard.tsx`, `SoilIntelligenceCard.tsx`, `NasaEarthObservationBanner.tsx`, `QuickStartCard.tsx`, `HowItWorksCard.tsx`, `FarmTrackerSelector.tsx`, `WatchHowItWorksModal.tsx` | Preserve the daily-tracker purpose and working data paths; consolidate redundant/intro cards and eliminate fake defaults/metrics. Advanced water/soil detail belongs behind clear depth layers. |
| Farms | `MyFarmsView.tsx`, `FarmDetailView.tsx`, `FarmSwitcherModal.tsx`, `FarmCard.tsx`, `FarmThumbnail.tsx` | Keep the portfolio and farm detail concept; move to true farm → fields hierarchy, boundary-backed areas and field-specific histories. |
| Map/UI | `FarmMapPicker.tsx`, `MapPanel.tsx`, `Sidebar.tsx` | `FarmMapPicker` is a point selector with a draggable marker, not a polygon boundary editor. `MapPanel` is an illustrative rectangle, not a geographic map. Replace both roles with a real map workspace/editor. |
| Rotation planner | `RotationsView.tsx`, `RotationComparisonCard.tsx`, `RotationTimelineBlueprint.tsx`, `BenefitsAndRisksSection.tsx`, `WhyThisRotationCard.tsx`, `CropCard.tsx`, `RotationCard.tsx`, `Timeline.tsx`, `Tabs.tsx` | Preserve ranked alternatives, selectable plans, crop sequence visuals, benefits and risks; deduplicate logic and ensure selected plan/state IDs are stable. Remove synthetic rotation examples from real-result paths. |
| What-If | `DashboardView.tsx`, `SimulatorView.tsx` | Two separate implementations currently overlap. Consolidate to one authoritative simulator workspace with a separate, unambiguous route and real scenario recomputation. |
| Calendar | `CropCalendarView.tsx`, `Timeline.tsx` | Preserve cross-page crop navigation but derive dates from a real crop schedule, not guessed generic seasons. Support farm + field + crop identity. |
| Data & Trust | `DataTrustCenter.tsx`, `EvidenceDrawer.tsx`, `ProvenanceTag.tsx`, `ConfidenceBadge.tsx`, `TermTooltip.tsx`, `SatelliteDataCard.tsx`, `ChartCard.tsx`, `DataRow.tsx`, `Table.tsx`, `LoadingState.tsx`, `EmptyState.tsx`, `StatusBadge.tsx` | Keep the transparency concept and visual primitives; remove simulated endpoint success, incorrect default provenance and dataset claims unsupported by a live connector. |
| Settings/profile/notifications | `SettingsDashboardView.tsx`, `SettingsModal.tsx`, `SignInModal.tsx`, `NotificationsDrawer.tsx`, `Notification.tsx`, `SwipeableAlertItem.tsx` | Preserve preferences and alert interactions; make sync/auth/export/refresh actions truthful and functional; add job schedule, privacy, data retention and automation controls. |
| Wizard | `WizardContainer.tsx`, `QuestionsTopBar.tsx`, `PrioritiesStep.tsx`, `StepIndicator.tsx`, `FarmMapPicker.tsx` | Keep one-question-at-a-time flow, back/skip/review and priority controls; correct selection/deselect behaviour and add separate farm/field and boundary steps. |
| Help/chat/navigation | `PageGuideModal.tsx`, `WatchHowItWorksModal.tsx`, `AIAgronomistChat.tsx`, `TopBar.tsx`, `DesignSystem/Navbar.tsx`, `Navigation/Navbar.tsx`, `Modal.tsx`, `Dropdown.tsx`, `PrimaryButton.tsx`, `SecondaryButton.tsx`, `SearchBar.tsx`, `GlassCard.tsx`, `cardStyles.ts`, `WeatherCard.tsx`, `MetricCard.tsx`, `StepIndicator.tsx`, `index.ts` | Consolidate duplicated navigation and guidance surfaces, keep functional chat/help, and treat every component as a primitive of the new design system rather than copy every current style. |
| Backgrounds | `BackgroundAurora.tsx`, `WeatherAmbientBackground.tsx` | Reassess; disable decorative animation by default if it competes with data; retain subtle, low-cost transitions and reduced-motion support. |

## 2. Critical findings: mandatory remediation before release

Severity labels below indicate implementation priority. They are not claims that every issue has been runtime reproduced.

### P0 — misleading measurement, provenance and source status

#### 2.1 NASA source registry is broader than the real connector coverage

`src/services/nasaApi.ts` contains an actual request to NASA POWER's **monthly point API** for 2014–2023. `src/services/liveWeather.ts` calls Open-Meteo for current weather. `FarmMapPicker.tsx` uses OpenStreetMap raster tiles and Nominatim geocoding. The supplied code contains registry rows and URLs for SMAP, Sentinel/HLS, Landsat, MODIS, GPM, NASADEM and soil databases, but the shown source does not implement corresponding fetch/processing connectors for all of them.

`src/components/Data/DataTrustCenter.tsx` has `handleTestApiPing()` which waits 600 ms and displays a prewritten HTTP 200 response; it does not actually make a network request. The UI must not call this a live API test or indicate a connector is verified based on this simulation.

**Required change:** create a connector registry with states `implemented`, `configured`, `available`, `degraded`, `unavailable`, and `planned`. A “Test connection” action must really call an approved health-check or query endpoint, validate a response, record the time, and show the actual result. Planned products must not appear as active telemetry. A successful homepage render is not evidence that a connector works.

#### 2.2 “Satellite NDVI” is currently a regional rainfall-based prior

`nasaApi.ts` derives `vegetationNdviMean` from annual-precipitation thresholds. It tags the value `REGIONAL_PRIOR`, which is more honest than claiming a direct pixel measurement, but it is still an estimated ecological proxy—not an actual NDVI observation. `nasaAlerts.ts` can use that field to generate an alert whose copy says satellite imagery shows crop greenness is below normal and labels a generic satellite sensor. That turns a regional prior into a field-level satellite diagnosis.

**Required change:** do not display the proxy as NDVI or use it to trigger satellite crop-health alerts. Either rename it as a documented regional ecological prior with no NDVI terminology and limited downstream use, or omit the metric. Enable true NDVI/NDWI charts and image-based alerts only after a real optical imagery connector, cloud/quality masking, field polygon aggregation, valid observation dates, and coverage rules exist.

#### 2.3 Soil-moisture semantics need correction

`nasaApi.ts` reads NASA POWER `GWETROOT`, which the code itself describes as modelled root-zone wetness. It sets `soilMoisturePercentile` by multiplying mean monthly wetness fraction by 100 and clipping it; this is not a percentile derived from the historical distribution. The `soilMoistureHistoricalBaseline` is then assigned the same computed number, preventing a meaningful baseline anomaly. A fallback inside `EvidenceDrawer` defaults missing provenance to `NASA_SMAP`, so an unlabelled value can appear to be from a different source.

**Required change:** distinguish `root-zone wetness fraction/percent` from a statistical percentile. A percentile requires a defined reference distribution, same variable/product, period and spatial support. If only an absolute/modelled wetness value exists, label it correctly and do not display a percentile anomaly. Never default missing provenance to SMAP or any other source. Missing provenance is an error state to fix, not a reason to guess.

#### 2.4 Terrain provenance is not proof a terrain connector ran

Climate results can include a provenance record naming NASADEM, although the shown fetch flow does not retrieve a NASADEM value. The Data & Trust Center also lists NASADEM and other products in its catalogue without establishing that the current run queried them.

**Required change:** provenance must be generated by a successful connector or a named local calculation. For every result include a field-level source-status record. No source name may be assigned simply because that source is in a registry or planned architecture diagram.

#### 2.5 Sample farms are presented as real/analysed farms

`farmStorage.ts` creates two prefilled farm records with saved analysis results and `isDemo: false`; one result is built from a Kansas regional climate object with some climate values overwritten for a UAE location. Their provenance can be empty. These records are automatically seeded when stored farm data is missing. That can make seeded values look like real observations for the user's own farms.

**Required change:** first run must show an honest empty state and offer `Add farm` or `Explore demo`. Seed datasets must be explicitly labelled `DEMO`, isolated from user records and never exported as real farm data. No hard-coded sample measurement is allowed through a production data path. If compatibility requires migration of existing seeded records, present a clear `Demo data` label and a safe remove-demo action.

#### 2.6 Fake measurement/analysis values appear in components

Examples in `FarmDetailView.tsx` include a hard-coded `96% Confidence`, a fixed GDD value of `384`, and a 30-day rainfall value selected from fixed `58.4/62.1 mm` branches. Some copy presents values as observed or above a 5-year baseline without the code showing a real corresponding time series/connector. `CurrentConditionsCard.tsx` also has fully populated fallback climate objects. `dailySnapshot.ts` uses numeric defaults for absent crop/soil/water values.

**Required change:** remove these fixed result values from real-farm displays. A placeholder may only appear in an explicitly isolated demo mode. If a metric is unavailable, render an unavailable state with the specific missing requirement. Every 30-day/5-year comparison must calculate from a real timestamped series covering those dates.

#### 2.7 Data Trust and help copy overclaims source coverage

`PageGuideModal.tsx` claims there is no synthetic/mock climate data and all values are fetched directly from NASA APIs. The codebase has demo seed farms, preconfigured regional priors, local defaults and fallback values. The Data & Trust Center uses registry descriptions broader than live connectors. These claims are incompatible with the current data path.

**Required change:** generate UI status and copy from actual runtime connector/provenance records rather than hard-coded statements. Show `Observed`, `Modelled`, `Regional estimate`, `Farmer entered`, `Calculated`, `Demo`, or `Unavailable` consistently. Update descriptions, source badges, data quality warnings and report text from the same canonical provenance object.

### P0 — analysis lifecycle and false loading progress

#### 2.8 `AnalyzingScreen.tsx` reports a simulated pipeline

The screen advances through 16 prewritten stages on a 280 ms interval, lights up POWER/SMAP/MODIS/NASADEM/GPM source badges, and calls `onComplete` after the timer regardless of which connectors or calculations actually ran. The “Continue in background” control merely calls `onComplete`; there is no persisted server job that continues independently. `App.tsx` runs `executeAnalysis()` separately and does not bind the displayed stages to its real progress.

`executeAnalysis()` catches failures mainly by logging; it does not produce a user-visible failed/partial state. The loading component can also navigate away while the asynchronous analysis is still in flight. Cancel hides the screen but does not necessarily abort the fetch/calculation or ensure the result will not be persisted later.

**Required change:** replace fake progress with an analysis-job state machine. The actual pipeline should emit stage events, and the UI should display only completed/running/skipped/failed operations. If only POWER ran, do not light SMAP/MODIS/etc. “Continue in background” may only appear when a durable job is actually submitted and can be retrieved after navigation/reload. Cancel must cancel an abortable job when supported or clearly explain that a server job cannot be cancelled; it must not silently save a result after the user believes it was cancelled. A failed run must show retry/recovery options, not navigate to success.

### P0 — data storage, account and backend truthfulness

#### 2.9 Empty farm list cannot remain empty

`loadSavedFarms()` only accepts a parsed stored array when `length > 0`, otherwise reseeds the demo farms. Therefore storing an empty array after deletion will cause seeds to be recreated on the next load. This defeats delete-all/empty-state behaviour.

**Required change:** treat “storage key absent” and “stored empty list” as different states. Migrate legacy storage keys explicitly, never recreate deleted records as an implicit side effect, and add tests for adding/deleting the final farm and refreshing the page.

#### 2.10 Backup export reads old store keys

`farmStorage.ts` uses the `fieldshift_farms_v6` key, but `SettingsDashboardView.tsx` directly exports `fieldshift_farms_v5` or `fieldshift_farms_v3`, defaulting to an empty array. The Settings export can therefore omit current saved farms. It also has a catch branch that displays “Export completed” even if the operation failed.

**Required change:** expose a single typed export service that uses the canonical store and a versioned export schema. Include settings, farm/field records, analysis history, schedules and observations according to user choice; verify the exported package before showing success. Use explicit export failure messages.

#### 2.11 “Sign in and sync” is not authentication or cross-device sync

`SignInModal.tsx` locally creates a profile from a name/email and offers preset profiles. `userStore.ts` stores that profile in `localStorage`. There is no authentication provider or farm database in `server.ts`; the farm records remain browser-local. Copy that promises syncing or verified accounts is misleading. The Settings password flow similarly changes UI state without a real authentication service.

**Required change:** either integrate a real provider-backed auth service and authorization rules, or rename the UI to local profile/session settings and remove password/sync promises. Do not collect unnecessary personal data. All remote API routes must be authorised once user-owned cloud data is introduced.

#### 2.12 The current Express server is not the scheduled analysis backend

`server.ts` serves the app and exposes AI-description/AI-chat endpoints. There is no durable database, task queue, recurrence scheduler, report persistence API or analysis-run store in the supplied code. Background schedule features must not be faked with browser timers or `setInterval` in a component.

**Required change:** implement a separately defined scheduled-analysis service with durable job storage, queue/worker or platform scheduler, idempotency, retry policy, access control and an explicit minimum-data snapshot consent flow. Local-first data means the client has to securely authorise the exact snapshot sent to the backend. The system must say when it cannot run because the device has not uploaded the required approved inputs.

### P1 — location, map and geometry

#### 2.13 Current map is a single coordinate pin, not farm/field drawing

`FarmMapPicker.tsx` creates a Leaflet map with a draggable marker; a map click moves that marker. It supports search, GPS and manual coordinate entry. The saved domain types contain a field-size number but no canonical polygon boundary. `MapPanel.tsx` renders a decorative rectangular parcel on a grid rather than an actual geographic map and uses hard-coded area/elevation defaults.

**Required change:** implement the true map workspace specified in the master prompt. The canonical model must store GeoJSON Polygon/MultiPolygon geometry, calculated geodesic area, boundary version, validation result, and optional interior exclusion zones. Support draw/edit vertices, delete/undo/redo, save/cancel, imports, field splitting/naming, overlays, map selection and field inspector. Do not derive a polygon from the old marker or rectangle. Preserve coordinate-only farm location as a separate concept from field boundary geometry.

#### 2.14 Map coordinate display and geocoding need correction

The pin picker formats coordinates as `°N` and `°E` even for negative latitude/longitude. Nearby preset-name matching uses a broad ±0.5 degree threshold and can label a coordinate with a preset city name without actual reverse geocoding. Manual coordinates are silently clamped to bounds rather than clearly rejected/validated. Search/reverse-geocode calls have minimal response/error handling, and external services have usage/availability constraints.

**Required change:** format hemispheres correctly; validate out-of-range values with a user-visible error; distinguish confirmed geocoded place names from raw coordinates and approximate labels; debounce/rate-limit appropriately (without using the public Nominatim endpoint for forbidden autocomplete patterns); add request timeout/cancellation and no-result states; show visible map attribution. Treat standard OSM tiles as street-map data, not satellite imagery, and do not promise public tile uptime. Set a provider abstraction so production usage can move to a supported map/tile/geocoding provider.

### P1 — metric definitions and derived alerts

#### 2.15 Current “percentile” and historical anomaly terms are not always statistically derived

The POWER integration returns a monthly series from 2014 to 2023. The code labels some outputs as 30-year or daily records in other areas. In `nasaApi.ts`, precipitation trend is assigned from a conditional based on annual rainfall, dry-spell length is assigned in three buckets, and the coarse groundwater trend is inferred from rainfall rather than a groundwater dataset. The temperature trend uses a 10-year series, but the no-data case in `calculateTheilSenAndMannKendall()` returns a default +0.25°C/decade slope, which looks like a real result.

**Required change:** each metric must have a written definition, a valid input series, a temporal/spatial resolution, missing-data rules, unit and method. Compute precipitation trend from the actual rainfall series or mark it unavailable. Compute dry-spell length from daily values or do not show it as an observed statistic. Do not call rainfall a groundwater trend. The trend function must return `insufficient_data`/`unavailable`, not a numeric slope, when it cannot estimate one. Use tested statistical code with its assumptions disclosed.

NASA POWER's own documentation distinguishes monthly, daily, hourly and climatology temporal APIs. The implementation must name the API and period it really queried, not label monthly data as a 30-year daily record. References: https://power.larc.nasa.gov/docs/services/api/temporal/ and https://power.larc.nasa.gov/docs/services/api/temporal/monthly/.

#### 2.16 Alerts are currently based on static or climate-summary values

`nasaAlerts.ts` calculates alerts from the stored analysis climate summary, not a canonical stream of time-aligned current observations. It uses the 10-year rainfall history mean as a baseline and compares it with `annualPrecipitationMm`, which in the live connector is a long-term average; timestamps are fixed strings such as “3 hours ago”; a heat alert copy says “Today” even though its input is `maxSummerTempC`; and NDVI alert language calls a regional prior satellite imagery. Some suggested irrigation instructions are prescriptive without enough context on crop stage, actual irrigation system, soil water or local timing.

**Required change:** alert generation takes actual timestamped observations/derived metrics with a baseline period, valid window, quality, threshold version, uncertainty and source. Use current weather only for weather-appropriate alerts; use long-term climate only for climatological risk. Never show a fabricated relative timestamp. Make irrigation advice conditional on adequate crop/field information and provide safe, non-overconfident recommendations; where evidence is weak, prompt verification rather than direct an exact irrigation duration.

#### 2.17 Daily status snapshot guesses the current rotation phase

`dailySnapshot.ts` derives the current crop using 90-day blocks elapsed since analysis creation, not the saved planting/harvest windows or current field schedule. When information is missing, it supplies defaults for crop, stress days, soil moisture, soil health and pH; it can render a full confident status from incomplete data. A selected farmer rotation is also not a first-class field in the analysis payload; much rendering assumes `rotations[0]`.

**Required change:** active crop/phase derives from a versioned farm/field crop schedule with start/end date uncertainty. If a schedule is missing, say that the current crop stage is not recorded. Selected rotation ID belongs in the user's field-plan record and must be separate from the highest-scoring recommendation. Avoid substituting a generic crop or score. Status must support `insufficient_data` and never be better than its worst evidenced component.

#### 2.18 Fallback advice and pH defaults overstate evidence

In `soilEngine.ts`, functions can default pH to 7.2 and classify it as though a value were known; texture-based hydrological properties are priors. `dailySnapshot.ts` defaults pH to 7.4 and treats soil component score as a current soil-health diagnosis. `aiService.ts` returns a generic locally generated “calibrated agronomic synthesis” if the AI service fails, even where its claims (such as nitrogen delivery or moisture protection) may not be supported by the exact calculation.

**Required change:** carry values and provenance together as `Sourced<T>` or an equivalent required envelope. Missing measured pH is `unknown`; a modelled pH prior must be expressly estimated. Texture-derived water-retention properties are “estimated from texture class” with broad uncertainty. A rotation soil component score is not a direct observation of current soil biology. AI fallback copy must describe only validated outputs and be labelled as an offline template, or return an unavailable state.

### P1 — scenario engine is not a full simulator yet

#### 2.19 What-If model uses simple multipliers and incomplete factor attribution

`runWhatIfScenario()` adjusts annual ET₀ and GDD through fixed temperature multipliers, changes annual precipitation and seasonal water quota, and then reruns rotation generation. It doesn't use the declared `initialSoilMoistureDeltaPct` in its scenario climate transformation. It matches scenario rotations by display name and falls back to the baseline object when a plan disappears, making an infeasible plan look unchanged. `primaryMovingFactor` is selected by threshold heuristics, water-stress delta compares only sequence index zero, and `breachesSafetyFloor` is equated to `!isRecommended` rather than reporting the failed constraint.

**Required change:** either label this as a simplified sensitivity model and restrict claims, or implement the scenario system described in this brief: apply changes to the underlying time series and inputs, rerun the approved calculation pipeline with the same seed, compare stable IDs, show infeasibility reasons, identify actual breached constraints, recompute all affected seasons, quantify attribution through controlled component reruns, and report uncertainty bands. Zero-delta scenario must reproduce baseline exactly. Unknown/failed values must not be silently replaced with baseline results.

#### 2.20 The app contains two competing What-If interfaces

`DashboardView.tsx` and `SimulatorView.tsx` both call `runWhatIfScenario`, have their own default parameters and presentation, and duplicate portions of scenario UI. In `App.tsx`, selecting `simulator` redirects to `analysis` and scrolls to an element; a separate `SimulatorView` render branch still exists. This makes navigation and ownership of scenario state ambiguous.

**Required change:** choose one canonical `/simulator` route/workspace and one shared domain service, schema, scenario persistence method and result presentation. `/analysis` (or the renamed Farm Intelligence page) must not silently become the simulator. Context links should navigate explicitly and preserve selected farm/field/rotation. Keep Deep Analysis separate as decided by the user.

### P1 — rotation and farm data integrity

#### 2.21 Many pages assume the top-ranked rotation is the active plan

The app repeatedly uses `analysis.rotations[0]` in farm status, crop schedule, alerts and farm details. Top-ranked recommendation and farmer-selected active rotation are different concepts. A user who selects an alternative must be able to make that plan active without the home page or calendar silently reverting to the first-ranked plan.

**Required change:** data-model separate: candidate recommendation set, selected/accepted plan ID, plan versions, crop schedule and scenario selection. Update all related screens through one shared domain event. Keep historical reports tied to the plan/input snapshot used at that time.

#### 2.22 Farm creation defaults contain conflicting geography

`DEFAULT_FARM_ANSWERS` includes a sample farm name while pointing at Salina, Kansas; the code's seeded UAE farm uses climate fields partly copied from the Kansas preset. The blank answers object also contains default latitude/longitude. These should not quietly survive into a real farmer's form or be interpreted as confirmed information.

**Required change:** separate `blank`, `demo`, `example` and `confirmed user input` schemas. A blank farm has no confirmed location until the user chooses one. Never combine a sample farm name with an unrelated location. A local viewport default may exist, but it must not populate the saved coordinate until the farmer confirms it.

#### 2.23 Data import is permissive and needs schema versioning

`importFarmsBackup()` parses JSON, checks only a few fields and merges incoming objects. This risks malformed or stale data entering the canonical store; `sanitizeFarmCrops()` mutates records while normalizing strings. Import does not yet specify migration of analysis versions, plan IDs or future field geometry.

**Required change:** use a versioned schema with validation and migration; preview a backup before applying it; give replace/merge/duplicate-handling choices; validate every farm, field, polygon and report; preserve an untouched backup copy; report exactly what was imported/skipped. Mutations must be immutable, and import must not permit active-farm references to missing IDs.

### P1 — AI/security and operational readiness

#### 2.24 AI API wiring needs explicit configuration and validation

`server.ts` creates `new GoogleGenAI()` without explicitly wiring the configured environment variable in the shown code. It hardcodes the model string, builds prompts by interpolating request-body fields and returns raw provider error messages. Request shapes are not validated; rate limiting and request budgets are not shown. The browser-facing client uses fallback template strings on any endpoint failure.

**Required change:** initialise the SDK explicitly from validated environment configuration using the current official SDK documentation; keep model ID in config; validate payload sizes/shapes with schema validation; set request timeouts and rate limits; return standard error codes; prevent raw stack/provider error exposure; record privacy-safe usage metadata. The AI must explain only scores/findings computed by the deterministic engine and cite the actual source snapshot. Prompt output cannot become a new source of numerical truth.

#### 2.25 The public source dump endpoints should not ship as open production endpoints

`server.ts` has public `/api/download-source` and `/api/all-code-text` endpoints for source artifacts. Unless there is an explicit, separately reviewed public code-sharing feature, these endpoints create unnecessary disclosure surface and may reference files not included in the deployment.

**Required change:** remove them from production or protect any necessary diagnostic/export route with authorization, feature flags and audit controls. Production must not serve local code dumps or secrets by default.

#### 2.26 Settings actions often simulate success

The supplied `SettingsDashboardView.tsx` refresh handler displays “Satellite readings refreshed” after a confirmation and timer but does not call the NASA connector. The export routine reads outdated storage keys. The password change flow only updates React state; the support form only toggles a success message. These are UI simulations, not completed backend features.

**Required change:** each action must be connected to a real service or clearly labelled as a local-only demonstration. Refresh should display actual connector status and any new data timestamp. Support submission must use a real endpoint if offered. Remove password change unless actual authentication is integrated. Export uses the canonical backup service. Never display a success toast until the operation returns success.

#### 2.27 The global Undo/Redo controls currently reverse navigation only

`App.tsx` stores a navigation-history stack of tabs/farm-detail context and `Navbar.tsx` labels the arrows “Undo Navigation (Go Back)” and “Redo Navigation (Go Forward).” This is not an undo history for farm data edits. Browser back/forward, in-app view history and undoing a boundary/input edit are separate operations.

**Required change:** implement all three with unambiguous labels and contracts: browser route history; in-app navigation history preserving farm/field/plan context; and transaction-based undo/redo for reversible data edits such as boundary vertex edits, field rename and form changes. Do not show a domain Undo button that only changes pages. Irreversible external jobs/actions need cancellation or compensating actions rather than false rollback.

## 3. Canonical target architecture and routes to build from this baseline

The master prompt's intended product structure remains authoritative and resolves ambiguity in the legacy implementation:

- `/home` — daily farm tracker and portfolio watch.
- `/farms` — farm portfolio and field management.
- `/farms/:farmId` — farm summary and fields; nested field views use stable field IDs.
- `/farms/:farmId/fields/:fieldId` — canonical field workspace and active crop/plan context.
- `/map` or an integrated full-screen map workspace — field/farm boundary drawing and editing; use a dedicated route or a carefully designed full-screen workflow, not just the wizard location pin.
- `/rotation-planner/new` — guided creation/re-analysis questionnaire.
- `/farms/:farmId/fields/:fieldId/rotations/:planId` — selected rotation result/detail and alternatives.
- `/farm-intelligence` — current farm/field state, run Deep Analysis, score breakdown, evidence and report timeline.
- `/farm-intelligence/reports/:reportId` — immutable dated report and comparison.
- `/simulator` — separate scenario workspace.
- `/calendar` — cross-field crop schedule, work and actions.
- `/data-trust` — real connector status, source coverage, metric catalogue and method audit.
- `/settings` — display mode, units, privacy, data export, alerts, schedules, account state and security controls.

These route patterns can be adjusted to the hosting framework, but each named destination must remain a distinct product responsibility. If routes use query parameters instead, direct links, refresh and browser back/forward must still restore the expected context. No page may silently reroute to a different product function because a legacy component was reused.

## 4. Cross-page state rules forced by the current code findings

1. `recommendedRotationId` and `activeRotationPlanId` are not the same field.
2. `currentObservedWeather`, `historicalClimate`, `weatherForecast`, `regionalPrior` and `scenarioClimate` are different entities/time bases.
3. Modelled root-zone wetness, volumetric water content, soil-moisture percentile and soil-water balance are different variables.
4. `ndviObservation` does not exist merely because a number is present in `vegetationNdviMean`.
5. `farmLocationPoint` does not equal `FarmBoundary`, and `FarmBoundary` does not equal `FieldBoundary`.
6. A `DataConnector` registry row does not mean the connector ran for an analysis.
7. `isDemo` must be propagated to data, report, UI labels, alert suppression and export policy.
8. `insufficient_data`, `estimated`, `stale`, `partial`, `failed`, `running` and `completed` must be explicit statuses, not handled as numeric defaults.
9. Changing a boundary creates a new boundary version and marks spatially dependent analyses stale; historical reports retain their old boundary version.
10. Scheduled Deep Analysis runs use a saved, consented and versioned input snapshot. They never fetch arbitrary localStorage contents or pretend to see local-only edits that have not been shared.
11. All child-page navigation carries `farmId`, `fieldId`, `planId`, `reportId` or `scenarioId` explicitly where relevant.
12. A deletion must update active selection, route, local persistence and any remote scheduled job/reference safely, with confirmation for permanent deletion.

## 5. Required migration and compatibility plan

Before the redesigned first view is shown, the builder must:

1. Detect the old keys (`fieldshift_farms_v3`, `fieldshift_farms_v5`, `fieldshift_farms_v6`, wizard drafts, settings and user profile) without treating a missing key as an empty or default farm.
2. Preview or safely apply a versioned migration; preserve a backup of the original JSON before changing it.
3. Mark old hard-coded farms and preset-derived analyses as demo/sample records, not real verified farms.
4. Preserve genuine user-created farm answers, logs, rotations and settings where recoverable.
5. Remove or quarantine unsupported static metric fields that look measured; keep the underlying saved plan with provenance warnings rather than silently converting invented values into observations.
6. Resolve invalid active-farm IDs, duplicate IDs, missing analyses, malformed rotation sequences and unknown crop IDs.
7. Preserve existing user experience settings if valid, while applying the new design tokens and corrected semantics.
8. Present migration status with a clear result and a recovery route. Never delete or overwrite legacy storage silently.

## 6. Required source-aware acceptance tests

The builder must add tests for each high-impact source finding—not merely snapshot the redesigned visuals.

### Data and provenance tests

- A `REGIONAL_PRIOR` vegetation estimate never appears as a measured/satellite NDVI observation and cannot trigger an NDVI observation alert.
- Missing source metadata never defaults to NASA_SMAP/MODIS/NASADEM.
- A monthly 2014–2023 dataset is labelled as monthly over that period; no copy says “30-year daily history” unless the query really fetched and checked that data.
- Missing temperature trend data returns unavailable/insufficient data, not +0.25°C/decade.
- A moisture percentile is only generated when a defined reference distribution exists and all source/time rules are met.
- Static demo values cannot enter live-farm calculations without a visibly explicit `DEMO` route.
- A non-connected data product cannot appear as “active,” “passed,” “verified,” or “last updated now.”

### Job/loading tests

- Analysis cannot show 100% or navigate to success until the actual job completes or is deliberately continued as a real durable job.
- Failed, timed-out, partial and cancelled runs are distinguished and have correct outcomes.
- Cancel does not secretly persist a result without explicit cancellation semantics.
- Only data sources actually used appear in the run-stage/provenance strip.

### Storage and route tests

- First load without data shows the intended first-run state, not seeded farms.
- Storing an empty farms array and reloading remains empty.
- Export includes current v6 farms and current reports; successful export is not shown if serialization/download fails.
- Import validates schema, survives malformed input and never leaves active IDs orphaned.
- Cross-page farm/field/plan links resolve to the same entity; a selected alternative plan remains selected on Home, farm details and Calendar.
- The `/simulator` route opens the actual simulator; it does not silently scroll an unrelated page.
- Navigation undo/redo and edit undo/redo have separate tests.

### Map tests

- Location point and boundary polygon can be edited independently.
- Polygon validation covers range, ring closure, self-intersection, invalid area and MultiPolygon cases.
- Area is calculated from geometry with correct units, not copied from a default.
- Editing/cancelling a polygon restores the saved version; saving increments boundary version and stales dependent analyses.
- Coordinates display N/S and E/W correctly; invalid manual coordinates produce a validation error.
- Tile and geocoding provider failures are visible and allow a manual-coordinate fallback.
- Attribution and terms requirements are met for the selected provider.

### Scenario tests

- All-zero deltas exactly reproduce baseline outputs and rankings.
- Initial soil moisture delta changes the relevant model inputs or is removed from the UI/type.
- A plan infeasible under a scenario is represented as infeasible with its reason, never silently reused as baseline.
- Scenario comparison uses stable IDs and reports specific violated constraints.
- Water stress is reported over the intended full timeline, not only first sequence index.
- Driver attribution is calculated or explicitly labelled qualitative.

### UX/security tests

- No visible `Sign In`, password, cloud sync, support submission or “refresh data” action claims to have succeeded unless a real service completed it.
- AI routes validate inputs, apply timeout/rate limits and emit safe errors.
- No production route anonymously exports source code.
- Personal profile information is not hardcoded in public defaults.
- Keyboard, screen-reader, mobile and reduced-motion checks cover maps, dialogs, tables and the new page system.

## 7. Current-source review limitation

This source audit is static. The attempt to install dependencies did not complete within the available execution window. A direct TypeScript check therefore reported that the `vite/client` type package was not present in the environment, rather than establishing whether the supplied application compiles. The next implementation stage should run the project's intended install/build/test scripts in its actual AI Studio/Cloud Run environment and report exact failures. Do not write “build passes,” “all APIs verified,” or “all tests pass” until these steps have genuinely run.

## 8. External technical documentation to verify during implementation

- NASA POWER temporal APIs: https://power.larc.nasa.gov/docs/services/api/temporal/  
- NASA POWER monthly API: https://power.larc.nasa.gov/docs/services/api/temporal/monthly/  
- OpenStreetMap standard raster tile usage policy: https://operations.osmfoundation.org/policies/tiles/  
- Nominatim geocoding usage policy: https://operations.osmfoundation.org/policies/nominatim/  
- Official Google Gen AI SDK guide: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/sdks/overview

Provider and endpoint details must be rechecked at implementation time. These references do not prove the Field Shift integration has been implemented.

## 9. Complete uploaded file-section manifest

The following file paths are present as sections in the uploaded dump. This is an inventory of the supplied text snapshot, not proof that all required binary assets/deployment files were included.

### Root and build configuration

- `/package.json`
- `/tsconfig.json`
- `/vite.config.ts`
- `/index.html`
- `/server.ts`
- `/metadata.json`
- `/.env.example`

### Core application and global styles

- `/src/index.css`
- `/src/main.tsx`
- `/src/App.tsx`

### Engines, services and stores

- `/src/engine/soilEngine.ts`
- `/src/engine/crops.ts`
- `/src/engine/scoring.ts`
- `/src/services/cropImages.ts`
- `/src/services/nasaApi.ts`
- `/src/services/liveWeather.ts`
- `/src/services/nasaAlerts.ts`
- `/src/services/dailySnapshot.ts`
- `/src/services/aiService.ts`
- `/src/store/useAppStore.ts`
- `/src/store/farmStorage.ts`
- `/src/store/userStore.ts`
- `/src/types/index.ts`

### Home components

- `/src/components/Home/FarmTrackerSelector.tsx`
- `/src/components/Home/WatchHowItWorksModal.tsx`
- `/src/components/Home/CurrentConditionsCard.tsx`
- `/src/components/Home/LatestNasaDataCard.tsx`
- `/src/components/Home/DailyWeatherCard.tsx`
- `/src/components/Home/YourFarmsCard.tsx`
- `/src/components/Home/NasaEarthObservationBanner.tsx`
- `/src/components/Home/RecentAnalysisCard.tsx`
- `/src/components/Home/SoilIntelligenceCard.tsx`
- `/src/components/Home/HeroSection.tsx`
- `/src/components/Home/WaterIntelligenceCard.tsx`
- `/src/components/Home/HowItWorksCard.tsx`
- `/src/components/Home/HomeView.tsx`
- `/src/components/Home/QuickStartCard.tsx`
- `/src/components/Home/DailyFarmStatusCard.tsx`

### Farm and mapping components

- `/src/components/Common/FarmSwitcherModal.tsx`
- `/src/components/DesignSystem/MapPanel.tsx`
- `/src/components/Wizard/QuestionsTopBar.tsx`
- `/src/components/Wizard/WizardContainer.tsx`
- `/src/components/Wizard/PrioritiesStep.tsx`
- `/src/components/Wizard/FarmMapPicker.tsx`
- `/src/components/Farms/FarmDetailView.tsx`
- `/src/components/Farms/MyFarmsView.tsx`

### Rotation and soil components

- `/src/components/DesignSystem/CropCard.tsx`
- `/src/components/DesignSystem/RotationCard.tsx`
- `/src/components/Soil/SoilBaselineView.tsx`
- `/src/components/Rotations/WhyThisRotationCard.tsx`
- `/src/components/Rotations/RotationsView.tsx`
- `/src/components/Rotations/RotationComparisonCard.tsx`
- `/src/components/Rotations/RotationTimelineBlueprint.tsx`
- `/src/components/Rotations/BenefitsAndRisksSection.tsx`

### Dashboard, simulator, calendar and data

- `/src/components/Data/DataTrustCenter.tsx`
- `/src/components/Calendar/CropCalendarView.tsx`
- `/src/components/Simulator/SimulatorView.tsx`
- `/src/components/Dashboard/DashboardView.tsx`

### Settings, navigation, chat and shared design system

- `/src/components/BackgroundAurora.tsx`
- `/src/components/WeatherAmbientBackground.tsx`
- `/src/components/TopBar.tsx`
- `/src/components/AnalyzingScreen.tsx`
- `/src/components/AI/AIAgronomistChat.tsx`
- `/src/components/DesignSystem/CropCard.tsx`
- `/src/components/DesignSystem/PageHeader.tsx`
- `/src/components/DesignSystem/SatelliteDataCard.tsx`
- `/src/components/DesignSystem/LoadingState.tsx`
- `/src/components/DesignSystem/Notification.tsx`
- `/src/components/DesignSystem/ChartCard.tsx`
- `/src/components/DesignSystem/EmptyState.tsx`
- `/src/components/DesignSystem/FarmCard.tsx`
- `/src/components/DesignSystem/DataRow.tsx`
- `/src/components/DesignSystem/SearchBar.tsx`
- `/src/components/DesignSystem/Navbar.tsx`
- `/src/components/DesignSystem/GlassCard.tsx`
- `/src/components/DesignSystem/FarmThumbnail.tsx`
- `/src/components/DesignSystem/PrimaryButton.tsx`
- `/src/components/DesignSystem/MapPanel.tsx`
- `/src/components/DesignSystem/Table.tsx`
- `/src/components/DesignSystem/Sidebar.tsx`
- `/src/components/DesignSystem/WeatherCard.tsx`
- `/src/components/DesignSystem/SecondaryButton.tsx`
- `/src/components/DesignSystem/Dropdown.tsx`
- `/src/components/DesignSystem/RotationCard.tsx`
- `/src/components/DesignSystem/Tabs.tsx`
- `/src/components/DesignSystem/cardStyles.ts`
- `/src/components/DesignSystem/Modal.tsx`
- `/src/components/DesignSystem/MetricCard.tsx`
- `/src/components/DesignSystem/Timeline.tsx`
- `/src/components/DesignSystem/StepIndicator.tsx`
- `/src/components/DesignSystem/index.ts`
- `/src/components/DesignSystem/StatusBadge.tsx`
- `/src/components/Settings/SettingsDashboardView.tsx`
- `/src/components/Navigation/SettingsModal.tsx`
- `/src/components/Navigation/Navbar.tsx`
- `/src/components/Navigation/NotificationsDrawer.tsx`
- `/src/components/Navigation/SignInModal.tsx`


---

# PART II — PAGE-BY-PAGE IMPLEMENTATION CONTRACT (expanded and quantified in v7)

**This part is mandatory and takes precedence wherever the earlier high-level plan is less specific.** Do not compress these instructions into a generic summary. Each page must be implemented, validated and tested before moving to the next.

## 20. Build contract and interpretation of the visual references

The two supplied images have different purposes. **Reference A (WeatherWise)** supplies visual language: cinematic environmental photography, dark grading, layered translucent surfaces, atmospheric depth, light editorial typography, compact charts and careful overlaps. It does not dictate Field Shift's data or exact layout. **Reference B (Field Shift multi-page collage)** supplies the agricultural product direction: panoramic farmland imagery, satellite and aerial maps, restrained glass surfaces, realistic crop images, selective 3D/isometric visual explanations and consistent navigation. Its small text and sample values are not authoritative; product requirements and verified data determine content.

Create an original Field Shift experience, not a copy of either screenshot. Do not make every page a duplicate grid of rounded cards. Each page must have a distinct composition suited to its job, while sharing the same tokens, typography, iconography and interaction rules.

### 20.1 Inspect before replacing

The code dump is source evidence, not proof of correctness. Inventory routes/tabs, components, calculation modules, state stores, APIs, data sources, modals, forms and interaction paths. Tag each item **preserve/reuse**, **refactor**, **replace**, **not implemented**, or **cannot verify statically**. Never assume an item works because its file exists. Preserve useful functionality unless it is incorrect, deceptive, duplicated or incompatible with the new model. Do not tell users a build/API/test passed unless it was actually run.

### 20.2 Primary navigation and page responsibilities

Use this proposed primary navigation: **Home; My Farms; Map; Rotation Planner; Farm Intelligence; Simulator; Calendar & Actions; Data & Trust.** Settings, search, notifications, profile, AI Agronomist and page guide are global actions. Keep Rotation Planner distinct from Farm Intelligence: one produces crop sequences; the other assesses current farm/field conditions. Do not reuse a vague `Analysis` label for both without clarifying the purpose.

### 20.3 Global visual system

Target desktop width 1440 px. Use a sticky app header around 64 px high; 24–32 px page gutters; main content maximum width around 1,520 px; 16–20 px gap between related modules and 24–32 px between major sections. Typical card padding 18–24 px, table cell padding 12–16 px. Main page titles 28–36 px; section titles 17–21 px; body 14–16 px; small labels 12–13 px. Do not shrink text to fit. Base colors are forest-night green-black, layered pine surfaces, readable warm-white text, muted sage secondary text, leaf green for selected states, cyan for water/weather series, amber/clay for caution/soil imagery and coral for urgent issues. Never rely on color alone to convey status. Use one coherent SVG icon set (Lucide is already present); no emoji.

Cards should blend into the page naturally: subtle borders and shadows, minimal glow, limited glassmorphism only where it improves layered imagery, and a small consistent set of corner radii. Use tables for repeatable exact values; do not make every table row an individual card. Use realistic imagery purposefully: aerial farm scene on Home, true imagery on Map, correct crop photographs on rotation cards, and 3D/isometric renderings only to explain a model or create an intentional hero. A rendered image must never be presented as a real satellite observation.

### 20.4 Global shell and navigation state

The global header has the FIELD SHIFT mark on the left, primary destinations in the middle and search, notifications and profile/settings to the right. The active destination is clear through text and a restrained underline/tint, not glow alone. On small screens collapse navigation into an accessible menu and keep core routes reachable.

On farm-specific pages, show one active farm selector and, where needed, a field selector. All farm-dependent modules must use the same active IDs; no card may quietly refer to a different farm. Breadcrumbs expose the route context, e.g. `My Farms > [Farm] > [Field] > [Section]`.

Separate two concepts currently conflated by some navigation controls: **navigation Back/Forward** moves through visited routes and context; **Undo/Redo edit** reverses actual changes inside an editor. Tooltips must describe which one is being used. If the header has only Back/Forward arrows, a map editor also needs its own data-editing Undo/Redo. Integrate with browser history and direct URLs rather than maintaining a disconnected history stack.

Every visible button, tab, chart selector, row, crop card, icon action and menu must have a defined, functioning result. If an action is unavailable, disable it with a reason or hide it. No dead `View details`, fake map toggles, simulated API success or decorative controls masquerading as real features. Save UI must say `Saving…`, `Saved`, or `Could not save — Retry`; show success only after persistence succeeds.

Route transitions: roughly 160–260 ms; wizard steps: 180–300 ms; hover: 140–220 ms; chart entrance animation only once and restrained. Respect reduced-motion settings. Never animate a progress indicator on an arbitrary timer to imply work completed. Refreshing a route restores its selected IDs and saved state. Invalid/deleted IDs lead to a useful recovery screen, not a crash. On mobile, side panels become drawers/bottom sheets, not tiny fixed columns.

---

<!-- SOURCE LINES 3328-3886 END -->

<!-- SOURCE LINES 4431-4613 BEGIN -->
# PAGE 14 — BACKEND, DATA MODEL, CALCULATION AND CROSS-PAGE CONTRACTS

## 80. Canonical entities and versioning

Use stable unique IDs and explicit relations. Names may vary, but domain separation is mandatory:

- `UserProfile/Workspace`: identity and preferences, separate from scientific farm data.
- `Farm`: name, general location, timezone, visibility/consent, preferences and timestamps.
- `Field`: farm ID, name, geometry version, mapped area, soil/water/management profile, crop history and current-plan reference.
- `GeometryVersion`: normalized GeoJSON/CRS, area/perimeter method, drawn/imported provenance, version/time.
- `FarmProfileVersion` / `FieldProfileVersion`: versioned answers and provenance; do not mutate snapshots used by old reports.
- `CropKnowledgeVersion`: crop family, thresholds, duration/season rules, coefficients, citations and release version.
- `AnalysisRun`: stable run ID, scope, input hash, request time, manual/scheduled origin, state, stage logs and report ID.
- `DataObservation`: source/product, variable, canonical value/unit, space/time scope, observation/acquisition date, retrieval date, resolution and quality flags.
- `DerivedMetric`: value/unit, formula version, input observation IDs, scope, interval and confidence/coverage metadata.
- `RotationPlan/RotationVersion`: field, inputs/priority vector, sequence, score components, constraints, dates and active/draft/archived state.
- `CropOccurrence`: field/plan version, crop ID, sequence position, year index, season ID, duration/date window and status.
- `DeepAnalysisReport`: input/source/model snapshots, farm and field results, findings, recommendations and comparable-report references.
- `Alert`: trigger rule/version, scope, evidence IDs, severity and lifecycle.
- `ActionTask`: linked recommendation/event, field/farm, due date, actual completion time, state and notes.
- `FarmerPracticeRoutine`: structured usual practice with source and last confirmation date.
- `ManagementEvent`: actual irrigation/fertiliser/planting/scouting event with source and timestamp.
- `Scenario`: baseline snapshot, deltas, model version, outputs and saved/unsaved state.
- `Schedule/Job`: frequency/time zone/consent scope, job lifecycle, stage logs, retries and report ID.
- `AuditEvent`: actor, object ID, action, time and non-sensitive summary.
- `RegionalPublication`: explicit opt-in and public-safe profile/aggregate only; never raw private geometry/exact coordinates.

Use schema validation at all form/API boundaries (e.g., Zod already appropriate for the TypeScript stack). Define canonical units in contracts. Convert for display only. Do not duplicate active health/status logic independently in each card.

## 81. Services and API responsibilities

Keep external requests behind service adapters. Recommended boundaries:
- `FarmRepository`: local load/save of farms, fields, geometry and profiles; optional authenticated sync only if implemented.
- `WeatherProvider`: current conditions/short-range forecast with true provider semantics.
- `EarthObservationProvider`: data discovery/query by product, location/geometry and period, preserving provenance.
- `SoilProvider`: property values with depth/resolution and sources.
- `DataQualityService`: schema, unit/range/fill-value checks, consistency and missingness.
- `AgronomicEngine`: deterministic pure calculations from normalized input objects.
- `AnalysisOrchestrator`: pipeline/job stages, cancellation, retry and idempotency.
- `ReportService`: immutable report persistence/comparison.
- `AlertService`: documented threshold/rule evaluation and deduplication.
- `TaskService`: task states and calendar links.
- `SchedulerService`: durable server-side schedule queue and retry rules.
- `Consent/PrivacyService`: explicit remote-analysis/public-sharing permission, revocation and deletion.
- `AIExplanationService`: constrained explanation of validated result objects; no authority to set numeric results.
- `ExportService`: PDF/CSV/ICS/GeoJSON generation with preview.

Use authenticated, authorized access for user data; validate schema/size, use rate limits and provider timeouts; redact logs. Keep credentials server-side. Error response shape includes stable code, user-readable message and correlation/job ID. Don't expose stack traces or raw upstream errors.

## 82. Canonical analysis pipeline

1. Validate IDs and required inputs; snapshot versioned farm/field/profile data.
2. Resolve user consent and permitted remote calls.
3. Fetch supported providers in parallel with per-source timeout/retry policies.
4. Parse and validate units, ranges, dates and missing/fill values.
5. Normalize units while preserving original source metadata.
6. Assess quality, spatial/temporal coverage and staleness.
7. Apply a per-variable fallback only where justified: direct suitable source → appropriate model/reanalysis → regional climatology/prior → demo values only in explicit demo mode. Every fallback is tagged and affects coverage/confidence.
8. Calculate metrics using versioned scientific methods.
9. Run the relevant engine (crop suitability/rotation or Deep Analysis).
10. Calculate confidence/coverage separately from suitability/health score.
11. Evaluate documented rules for findings/actions.
12. Generate constrained AI explanation only after deterministic results are final, if enabled.
13. Validate output schema, ranges, evidence IDs and contradiction rules.
14. Persist immutable snapshots and source/model versions.
15. Update current report pointers, alerts/tasks and timeline through idempotent handlers.
16. Return result/job ID; update the UI and disclose partial failures.

Failed optional source may lead to partial output only if the remaining evidence is sufficient. Failed essential input produces a blocked/failed report with reason. Never substitute synthetic zeros or silently fabricate a completed stage.

## 83. Cache and freshness policy

Cache keys include source/product, coordinate/grid cell rounded to that source's effective resolution, variable, time window, data version/aggregation, and geometry version when geometry affects the result. Immutable history gets longer TTL; near-current data short TTL matched to provider cadence. Avoid cross-user caching of private result objects. A fresh retrieval can contain an old observation; display both timestamps. Geometry edits invalidate geometry-dependent aggregations but not unrelated historical climate records.

## 84. Scientific variable catalogue

Every variable defines ID, name, unit, spatial scope, time basis, source semantics, input kinds, depth where relevant, method, freshness requirements, plausible range, aggregation and missing-data behaviour. Air temperature °C; rainfall mm per specified period; ET₀ and crop ET mm/day; soil moisture with depth/source; NDVI/EVI with index and capture date; slope degrees or percent; pH/depth; area ha/acres. Never compare different units/depths/definitions without conversion. Percent versus percentage-point difference must be explicit. Rotation score 82/100 is not automatically an 82% probability.

## 85. Crop suitability and rotation objective

Represent crop profiles as cited/versioned tolerance/optimum ranges and duration/season rules. Calculate factor suitability only when required inputs/reference values exist. The underlying plan calls for normalized factor scores, a documented weighted/geometric combination and a limiting-factor guard. Apply hard exclusion thresholds with explicit reason codes. Missing data is not ideal; it is unknown, estimated via a disclosed model or excluded under a documented policy with reduced coverage/confidence. Return partial/undetermined when required factors are missing.

Rotation objective can combine normalized productivity, crop suitability, soil trend, water performance, resilience and diversity with user weights and defined repetition/duration penalties. Apply hard constraints before ranking. Constraints include crop-family return intervals, host-disease rules, plausible transitions, seasonal/climate compatibility, water/soil thresholds, crop duration and planning horizon. Every penalty needs a method note and unit tests. Same normalized inputs + engine/crop KB versions + seed must produce the same ranking. Stable IDs are required for plan comparison.

Only show Monte Carlo ranking stability, probability or confidence intervals if the implementation truly computes them using a documented method and stores its seed/distribution. Otherwise omit them. A missing rotation under scenario is `Not feasible` with a reason, not a fallback to its base result.

## 86. Water, ET and GDD

Define exact sign, time step, storage assumptions and units for water balance. Any ET₀ calculation labelled FAO-56 Penman–Monteith must use required compatible weather inputs and pass reference validation. A simpler proxy may exist only with an honest name. Crop ET uses a cited crop coefficient and growth stage. Distinguish observed rain, forecast rain, effective rainfall estimate and recorded irrigation. A saved routine is not an actual event.

Do not apply unexplained multipliers to ET₀/GDD. If using monthly Tmin/Tmax summaries to estimate accumulated GDD, describe it as an approximation, not exact daily accumulated GDD. Use crop-specific base/upper temperatures and method/version. Rainfall, infiltration, runoff, irrigation, ET, drainage and root-zone storage terms only appear if the actual method supports them.

## 87. Soil, vegetation, trends and confidence

Gridded soil products are predictions at specified depths/resolution—not exact lab values for a field. Soil-moisture products have product-specific scale/model characteristics. NDVI/EVI require real optical bands/products plus quality/cloud filtering; no NDVI derived from rainfall. Never tag POWER modelled root-zone wetness as a direct SMAP observation unless SMAP actually supplied the value. Trends require a valid compatible series, time range, data completeness threshold and documented method. `No reliable trend / not enough comparable history` is valid; do not use a universal warming constant.

Confidence should account for completeness, source quality, spatial/temporal fit, recency, cross-source agreement, model applicability and confirmation state. Define and test weights/normalization; keep confidence a separate field from score. Show reasons and the most useful missing input. A single high-quality data source cannot make a whole multi-component report high confidence.

Status evaluation is canonical per scope/time/report and stores rule IDs, evidence, threshold version, severity, timestamps and lifecycle. Thresholds should be crop/location/stage-specific where supported. If no defensible threshold exists, present an observation/note, not a formal alert.

---

# PAGE 15 — DESIGN SYSTEM AND ASSET RULES

## 88. Asset and composition policy

Use legally usable assets with stored source/license and stable asset IDs. A crop image must depict that crop; consistent crops/aspect ratios matter. Don't use competitor screenshots as backgrounds. Generated farm renders are illustrations, not real satellite imagery. Real satellite imagery uses an actual provider with attribution, acquisition date, processing notes and terms. Missing asset gets a designed neutral placeholder.

Use a small component taxonomy: standard panel (subtle border, 12–14 px radius), glass overlay for a map/photo context, metric tile (label/value/unit/status/explanation), continuous table surface, crop photo tile and inspector drawer. Do not make all cards glow or use thick teal borders. Contrast is validated on the actual imagery.

Every chart has a question/clear title, one-line takeaway, axes/units/timeframe/legend and text summary. Use time-series lines, comparisons bars, maps for spatial relationships, tables for exact records. Avoid 3D charts merely to appear modern. Hover/tooltips must have a touch equivalent. Animations reveal information once, then rest; no perpetual animated numbers.

## 89. Motion and access

Primary control hover changes fill/border, not large glow. Field selection strengthens outline and translucent fill. Accordions transition subtly and do not shift content unnecessarily. Skeletons match the loaded component. Reduced motion stops the photo drift/chart reveal. Background parallax is optional, very slight and disabled on small/low-performance devices. Support keyboard, focus, accessible names, contrast and non-colour status cues. A photo hero can switch to a stronger scrim or a different crop if text contrast fails.

---

# PAGE 16 — RELEASE SEQUENCE AND DEFINITION OF DONE

## 90. Dependency-ordered build milestones

A. Inventory source code, identify placeholders/fakes, freeze contracts and establish tests.
B. Implement design tokens, shared controls, routing/context, navigation history and accessibility.
C. Implement local-first farms/fields/geometries, draft save, profile versions and error handling.
D. Implement Home and My Farms with real summary/weather/status/actions.
E. Implement Map, boundary drawing/editing/import and real layer/provenance states; public regional mode only after server privacy guards exist.
F. Implement Rotation Planner input/review, deterministic calculations, candidate ranking, trade-off step, comparison and active-plan versioning.
G. Implement Farm Detail, Weather, Soil, Water and Data & Trust with shared evidence drawer.
H. Implement Deep Analysis orchestration, field/farm reports, management input, comparisons and history.
I. Implement authenticated background scheduling, consent snapshots, jobs/queue/retries, notifications and deletion.
J. Implement Simulator, Calendar, task lifecycle and exports.
K. Add optional advanced systems (field evidence timeline, seasonal review, recommendation feedback, data-gap coaching, offline-tolerant entry) only after core data integrity is sound.
L. Run build/type/lint, unit/property, API integration, end-to-end, responsive/accessibility and security tests.

## 91. Explicitly prohibited shortcuts

Never present hard-coded score 92/100, default Kansas climate, canned crop data or placeholder values as a real user's result. No fake API-connected indicator. No fake successful save. Do not claim a connector is integrated until an actual call and response have been verified. No area calculation in unprojected degrees. No monthly climatology rendered as day-level history. No fake NDVI. No attribution mismatch between data provider and actual API called. No unsupported FAO-56 label. No globally shared warming constant presented as local trend. No nondeterministic ranking without explanation. No fallback to stale plan score when scenario candidate fails. No public exact private farm polygon. No mixing Year and Season. No combined `Fallow / Cover Crop` selection. No storing values only in memory while claiming they are saved. No browser timer substituted for durable scheduled backend. No leaked credentials, stack traces or unauthorized farm data.

## 92. Every page's completion gate

A page is done only when: its purpose is clear; desktop composition fits the references; mobile/tablet layouts don't clip; every control works; each metric has source/method/unit/date or a truthful unavailable state; loading/empty/stale/partial/error/permission states exist; cross-page routes preserve exact IDs; edits invalidate dependent results without rewriting history; accessibility and reduced motion work; tests cover normal/failure paths; target build and typecheck pass; and a report lists completed, blocked and unverified items. Don't claim perfection without evidence.

## 93. Mandatory end-to-end journeys

1. First visit → add farm → location → draw field → save draft → reload → resume → complete profile → run planner.
2. Create farms A/B and switch repeatedly; verify no cross-farm weather/soil/crop/report bleed.
3. Draw boundary, undo/redo, save, edit/cancel, edit/save; old report remains unchanged and dependent outputs are marked stale.
4. Attempt unavailable NDVI layer; state says unavailable, no fabricated heatmap appears. When real layer exists, legend/date/source match its data.
5. Repeat same planner inputs/version; ranking reproduces; compare plans; crop click opens exact occurrence and context.
6. Unknown pH/history stays unknown and affects coverage, not assigned a guessed ideal.
7. Run Deep Analysis with live stages, persist report, reload it and verify same snapshot/version.
8. Change irrigation routine; new report says inputs changed rather than attributing every difference to weather.
9. Enable schedule after explicit consent; job runs with browser closed; pause/revoke/delete/remote deletion work.
10. Provider failure creates partial/failed state with cause; Home preserves previous values and timestamp, retry works.
11. Zero-delta scenario equals baseline; rainfall scenario recalculates; infeasible plan shows reason.
12. Calendar click on Crop X in Field 2 opens that exact field/occurrence when crop also exists elsewhere.
13. Mark task completed; task history updates, underlying alert remains separate until reevaluation.
14. Public network opt-in shows only city/region aggregate; API cannot expose private coordinates; revocation stops future publication.
15. Switch modes without changing output/ranking/selected context.
16. Delete active farm and verify valid recovery, schedule handling and clean references.
17. Export PDF/CSV/ICS/GeoJSON accurately; GeoJSON warns about exact location; failed export isn't called success.
18. Keyboard-only usage of header, wizard, map tools, drawers, tables, charts and dialogs.
19. Test 1440×900, 1366×768, 1024×768, 768×1024, 390×844 and 320×700 with long labels, reduced motion, high contrast, slow/offline network and empty states.
20. Test malformed requests, unauthorized farm IDs, duplicate jobs, oversized geometry/imports and AI rate limits without data leakage/corruption.

## 94. Official documentation to verify during implementation

These are technical references and inspiration, not claims that the services are already connected. Recheck current docs, licenses, endpoints, quality rules, rates and terms at implementation time:

- NASA POWER temporal API: https://power.larc.nasa.gov/docs/services/api/temporal/
- NASA POWER Daily API: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
- NASA SMAP Level-4 9 km surface/root-zone soil moisture: https://data.nasa.gov/dataset/smap-l4-global-3-hourly-9-km-ease-grid-surface-and-root-zone-soil-moisture-analysis-update
- ESA Sentinel-2: https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-2
- Leaflet-Geoman drawing/editing: https://geoman.io/docs/leaflet and https://geoman.io/docs/leaflet/modes/draw-mode
- John Deere Operations Center / map layers: https://www.deere.com/en-us/products-solutions/technology-solutions/precision-ag-technology/operations-center and https://developer.deere.com/dev-docs/map-layers
- WCAG 2.2: https://www.w3.org/TR/WCAG22/

Use similar agricultural products as inspiration for patterns—field-linked map layers, task tracking, seasonal comparisons, field observations and reports—not as exact design/asset copies. Retain Field Shift's product identity and user-approved requirements.

**FINAL BUILDER INSTRUCTION:** start with the global shell and **Page 1 — Home**. Complete page geometry, data contracts, logic, interaction states, failure cases, responsive behavior and tests before moving on. Then build My Farms, Map, setup, farm detail, Rotation Planner, Farm Intelligence, automation, Simulator, Calendar and remaining tools. Report precisely what changed, passed, was blocked and remains unverified after every milestone. Never claim all features work until runtime/API tests prove they do.


<!-- SOURCE LINES 4431-4613 END -->

<!-- SOURCE LINES 4614-4637 BEGIN -->
# PART III — COMPONENT-LEVEL MATERIAL, TYPOGRAPHY AND ENGINEERING CONTRACTS FOR AUXILIARY SCREENS

This part extends the same specificity to shared and secondary screens. Do not interpret a screen's omission from the main page list as permission to leave it generic. Each component below must use the common design tokens from Section 0A, the shared state patterns from Section 27, and the exact domain records from Sections 31–33.

## 46. Global navigation, top bar, profile menu and command search

### 46.1 Top navigation geometry

Desktop top navigation is a 64px-high full-width row, with a 1px bottom divider `rgba(225,241,245,.10)`, background `rgba(5,18,25,.88)` (88% opaque) and `backdrop-filter: blur(16px) saturate(115%)` only where the surface genuinely overlays imagery. Use a centered max-width layout aligned with the page container, 24–32px horizontal padding, and a three-zone flex layout: brand on the left; primary route navigation in the middle; utility controls on the right. The wordmark uses 14–16px semibold type with a small leaf/satellite-field glyph; do not use oversized logo treatment. Navigation labels are 13–14px, 44px minimum hit area, with active state indicated by text color, a 2px bottom indicator and semantic `aria-current=page`. Do not use a permanent glow.

Utility actions: Undo, Redo, global search, help, notifications and profile/settings. Buttons are 36–40px visual size with 44px hit areas; tooltips appear after a modest delay for mouse and are accessible by focus/tap. Disabled Undo/Redo includes a reason in the tooltip and accessible description. The bar must not wrap unpredictably; at 1024px condense navigation into a menu; at 768px use an explicit mobile navigation pattern and preserve selected farm context.

### 46.2 Farm/field selector

The selector shows the active farm label, optional field label and chevron. Dropdown width 300–380px desktop, max viewport width minus 24px, max height 70vh with internal scroll, search box and hierarchical farms → fields grouping. Each row contains name, location or area context, and a status label where valid. Selected row has background `rgba(131,197,142,.10)`, 2px or inset accent marker and check icon. Selecting a farm triggers one global selection command, closes the selector, updates all dependent views and aborts/ignores stale in-flight queries. If unsaved edits belong to a different field, show Save / Discard / Stay; do not silently discard.

### 46.3 Command search

The command launcher is a centered modal (desktop width 560–680px; mobile full-screen sheet) with 96% opaque surface, 16–20px radius, 24px padding and shadow token. Search input sits at the top; group results by Farms, Fields, Rotation plans, Reports, Alerts, Tasks and Data sources. Each result shows entity type, primary name, parent path and relevant date/status. Keyboard behavior: Ctrl/Cmd+K opens if shortcut is advertised; arrows move selection; Enter opens; Escape closes; focus returns to invoker. Query only accessible records. A result must carry stable entity IDs and route to exact context; matching only by crop/farm name is not sufficient. Show debounced search/pending, no-results, unavailable/error states.

### 46.4 Profile menu and session states

Profile menu includes settings, data export, account/session state and sign-in/out only where real auth is implemented. Do not display an avatar/username as proof of authenticated account if it is only a local profile preference. If auth is not integrated, label local workspace state honestly. Menu rows have icon, label, optional helper and 44px target. Authentication errors are typed and never simulated as success.

<!-- SOURCE LINES 4614-4637 END -->

<!-- SOURCE LINES 4678-4798 BEGIN -->
## 52. Shared empty, loading, error, stale and partial-data visuals

These states are reusable design-system primitives and must be consistent across every page:

- **Loading:** content-shaped skeletons that match the final component geometry; no blank page, no unlabelled spinner and no fake progress. Skeleton uses neutral surface tokens and subtle static shimmer only when reduced motion permits.
- **Empty:** a meaningful state icon (20–24px line icon), 16–18px title, one sentence explaining why there is no content, and one real next action. No fake metrics or placeholder graphs.
- **Partial:** small amber/neutral status label plus a clear list of missing inputs/source outcomes and what part of the result remains supported.
- **Stale:** visible `Out of date` label with changed dependency reason, last computed time and `Refresh / rerun` action; the old report remains accessible and is explicitly historical.
- **Unavailable:** value text says `Unavailable` with reason; never show `0`, `N/A` or dash without distinction if that could be interpreted as an actual zero.
- **Error:** plain-language cause, retryability and action; technical error/correlation ID available in Advanced Mode, not raw stack trace.
- **Saving:** button disabled only for the operation being submitted, inline `Saving…` text, then success or failure. Avoid page-wide modal blocking for a simple local save.
- **Conflict:** if version changed in another context, show `This record changed since you opened it`, display timestamp/version and offer reload or compare/merge.

Every primitive must specify visual styling through tokens, `aria-live`/role only as appropriate, keyboard focus order and a test for state transition. The state UI is never an optional polish step.

## 53. Motion curves and performance budgets by component class

Use the following defaults and tune only through documented visual QA:

| Motion category | Default duration | Easing | Allowed use |
|---|---:|---|---|
| Button/field micro-interaction | 120–180ms | `ease-out` | pressed, hover, focus feedback |
| Tooltip/popover | 140–180ms | `ease-out` | opacity + 2–4px translation |
| Drawer/modal | 200–280ms | cubic-bezier(0.2, 0.8, 0.2, 1) | translate + opacity; preserve focus |
| Page transition | 220–320ms | `ease-in-out` | 8–12px y movement + opacity, not full-screen zoom |
| Wizard question change | 200–280ms | `ease-out` | horizontal/fade; reverse on Back |
| Chart reveal | 400–700ms once | `ease-out` | draw/reveal actual series, only after data loads |
| Atmospheric photo drift | 30–90s | linear/ease-in-out | optional, low-motion hero only |

Do not animate large card surfaces on every re-render. Animate only when state transition merits feedback. Don't use blur/filter animations that cause heavy repaint on weak devices. `prefers-reduced-motion` disables ambient drift, parallax, chart drawing and movement; retain immediate state feedback. Respect user control to disable motion. Lazy-load below-the-fold photos, provide `width`/`height` or aspect-ratio to avoid layout shift, use optimized WebP/AVIF where supported, and retain a local/fallback image if remote assets fail. A photo's failure must not hide the content.

## 54. Reference implementation terminology checklist — builder must be precise in code and handoff

The code handoff must use and explain the following terms in the implementation inventory:

- `CSS custom properties/design tokens` for colours, alphas, blur, spacing, border/radius, shadows and motion;
- `CSS Grid/Flexbox` for primary page geometry; `position:absolute` reserved for overlays, map controls, markers and local ornaments only;
- `stacking context/z-index` for hero imagery, scrims, glass surfaces, controls, tooltips and dialogs;
- `backdrop-filter` plus alpha background for glass panels; solid fallback and contrast verification;
- `responsive breakpoints`, `container sizing`, `intrinsic aspect ratio`, `object-fit`, `object-position` for photography;
- `controlled component`, `derived state`, `state machine`, `domain command`, `optimistic mutation with rollback`, `route context` for interactions;
- `DTO`, `schema validation`, `authorization`, `idempotency`, `optimistic concurrency`, `SSE/polling`, `retry/backoff`, `correlation ID`, `cache key`, `invalidation dependency` for backend;
- `immutable snapshot`, `versioned entity`, `data provenance`, `model version`, `metric registry`, `confidence method`, `partial success` for scientific integrity;
- `unit test`, `property test`, `integration test`, `E2E test`, `visual regression`, `WCAG contrast/focus` for verification.

Use jargon to increase implementation precision, not to hide ambiguity. Every technical term in the product UI should be translated for ordinary farmers via glossary/help, while the builder specification can use the precise engineering name.

## 55. Additional research references for UI engineering and geospatial implementation

Use these official sources for technical behavior and QA; re-check their current versions, licensing and compatibility before implementation:

- IBM Carbon Design System, spacing foundation: https://www.carbondesignsystem.com/building-blocks/foundations/spacing/overview — consistent spacing tokens and intentional whitespace.
- IBM Carbon Design System, typography: https://www.carbondesignsystem.com/building-blocks/foundations/typography/type-sets — productive/expressive type hierarchy.
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/ — text contrast, resize, accessible names and interaction criteria.
- W3C understanding non-text contrast: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html — meaningful UI components and graphics should meet the relevant 3:1 contrast requirement.
- MDN `backdrop-filter`: https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter — filter pixels behind a transparent/partially transparent surface; support and stacking behavior matter.
- Leaflet-Geoman drawing modes: https://geoman.io/docs/leaflet/modes/draw-mode — polygon/geometry drawing and validity behavior.
- MapLibre Style Specification, layers: https://maplibre.org/maplibre-style-spec/layers/ — raster-layer visibility and opacity are explicit render-layer properties.
- MapLibre Style Specification, sources: https://maplibre.org/maplibre-style-spec/sources/ — a data source and its visual layer are separate objects.

These references inform technical constraints; they do not replace product-specific UX design or authorize copying competitor visual assets.

## 55A. Research sources for visual patterns — use as references, not clones

The following sources were consulted during the Version 8 design scan. The collection pages index far more sites than could be individually reviewed in this pass; use them as continuing discovery catalogues, while the representative pages/case studies listed below provide the grounded pattern-to-product examples. Revisit the live site and current documentation before copying a particular interaction or relying on a library feature.

### Curated design galleries and large site catalogues

- [SiteInspire — Web & Interactive Design](https://www.siteinspire.com/websites/category/web-and-interactive-design): a categorized interactive-design catalogue; at the time checked the category showed 910 entries. Use it to discover layout, typography and interaction ideas, not to select a whole page to copy.
- [Godly Design Inspiration](https://godly.design/): curated web/app/UI/visual design references with sections for hero, CTA, footer, tools and templates.
- [Three.js Resources — Showcase](https://threejsresources.com/showcase): directory presenting 107 live Three.js projects across agency, data visualization, educational, landing-page, SaaS, immersive and other categories; entries include technology tags. Inspect examples selectively and assess complexity versus value.
- [mesh3d.gallery](https://www.mesh3d.gallery/): curated real-time Three.js experiences, including work from Active Theory, Lusion, Unseen Studio and others.
- [CSS Design Awards — WebGL gallery](https://cssdesignawards.com/website-gallery?feature=WebGL&page=1): current nominees tagged for WebGL, useful for discovering technical/art-direction patterns.
- [Awwwards](https://www.awwwards.com/): broad award gallery for creative websites and immersive experiences. Treat awards as discovery signals, not proof of accessibility or suitability for an operational dashboard.

### Representative websites and direct pattern references

- [Bruno Simon's portfolio](https://bruno-simon.com/): playful 3D world, navigable content and explicit user controls. Transfer the sense of spatial interaction only where it serves a farm/map task; do not copy the driving game interface.
- [NASA interactive experiences / Eyes on Earth](https://www.nasa.gov/interactives/): 3D science exploration, Earth observation context and time-aware interactive storytelling. Use as a reference for meaningful scientific visualization, not fabricated farm-level precision.
- [Global Fishing Watch map](https://globalfishingwatch.org/our-map/): search/filter/inspect interactions over satellite-derived activity layers, with time and entity context. Useful for Field Shift's Global Farming Network and map-layer workflows.
- [Our World in Data — Grapher redesign](https://ourworldindata.org/redesigning-our-interactive-data-visualizations): switching visual views (chart/map/table), sources, full-screen exploration, and download/share affordances. Use these as chart-detail UX patterns when Field Shift has appropriate real series.
- [Fieldwise — Precision Agriculture UX](https://www.tanguyd.com/prjt-fieldwise): agriculture-specific dashboard case study combining categorized map layers (crop growth, soil moisture, water stress, weather and pest data), reports, dark mode for map-heavy screens and rotation planning. This is the closest domain reference in the scan.
- [MapLibre GL JS examples](https://maplibre.org/maplibre-gl-js/docs/examples/): official examples for satellite raster, terrain/hillshade, globe, data layers, heatmaps, GeoJSON polygons, camera movement and geometry drawing integrations.
- [MapLibre GL JS — 3D terrain example](https://maplibre.org/maplibre-gl-js/docs/examples/3d-terrain/): technical pattern for a controllable terrain-enabled map, subject to compatible elevation tile data.
- [Clay — Glassmorphism UI](https://clay.global/blog/glassmorphism-ui): contemporary guidance on contrast in dynamic backgrounds, opacity-versus-blur tradeoffs, layer restraint and solid fallbacks. Its practical recommendation of two to three glass surfaces per view informs the default layer ceiling above.

### Visual/engineering guardrails

- [MDN — `backdrop-filter`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter): confirms the effect operates on pixels behind a transparent/partly transparent element, not on the text above it, and documents browser/stacking considerations.
- [MDN — Color contrast accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Perceivable/Color_contrast): contrast targets and legibility rationale; apply to photo compositing and controls.
- [Michelin Design System — Dashboard principles](https://designsystem.michelin.com/data-visualization/design-guidelines/principles-of-a-dashboard): emphasizes data-led hierarchy, consistent layout, disciplined use of color and avoiding effects that obscure chart meaning.
- [GSAP ScrollTrigger documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/): use for intentional scroll-driven experiences only; it is not required for the ordinary app dashboard.

**Research integrity note:** this research identifies patterns and translates them into Field Shift decisions. It does not establish that every reference is best-in-class in all respects, nor that every feature should be implemented. Validate designs with actual Field Shift data, responsive screenshots, accessibility checks and a real running build. External websites should be cited as inspiration in the engineering handoff; no external content should be presented as Field Shift-owned original material.

## 56. Version 8 release gate — research-informed visual fidelity and implementation quality

Before claiming the prompt is implementation-ready, verify:

1. Each page from 30.1–30.16 contains page-specific layout geometry, component/material tokens, visual hierarchy, interaction states, domain logic, backend/data dependency and responsive behavior.
2. The map has its own geometry editor, layer rendering and data inspector contract.
3. Shared controls have explicit states and keyboard/mobile behavior.
4. Glass alpha means opacity/transparency consistently and specifies fallback/contrast verification.
5. Photo/3D use is purposeful, described in asset/art-direction terms and visually subordinate to the task; map imagery is not dark-filtered as decoration.
6. Every backend operation is typed, validated, authorized, traceable, idempotent as appropriate and has honest error semantics.
7. Every metric has a registry/provenance/version contract and no unsupported value is invented.
8. Every cross-page mutation has a dependency invalidation and navigation-context rule.
9. Screenshot/visual-regression checks cover representative desktop/tablet/mobile widths and adverse backgrounds.
10. Existing implementation findings in the attached code audit are mapped to implementation IDs and tests, not merely acknowledged in prose.
11. The source-to-pattern matrix is applied route-by-route: Home remains an operational tracker; Maps uses real map layers and explicit controls; Deep Analysis charts are evidence-led; 3D appears only where it improves a spatial/scientific task.
12. The “cloud/fog over text” effect is implemented as a decorative background layer behind crisp text, never by blurring or fading text glyphs.
13. Most views use no more than two or three glass surfaces; dense data stays on strong-glass or solid panels, with a contrast-safe fallback when `backdrop-filter` is unavailable.
14. The forest-green brand, cyan water data, amber/soil highlights and coral critical state have consistent meanings; colors are not used as the sole status cue.
15. Each actual photograph has a documented purpose, crop, alt text, source/licence status and fallback; crop photographs match the crop names and map imagery is never decorative or mislabelled.

If any of these checks fail, mark the relevant requirement `not implemented`, `blocked` or `unverified`, with evidence and the next action. Do not claim “everything works” based on a document or a successful screenshot alone.


## Version 8 mandatory specificity rule

When interpreting any page, feature, interaction or service in this document, use the Version 8 research-informed pattern matrix, the page-specific contract AND the global quantified design/engineering contract. Do not reduce instructions to “make it premium,” “use glassmorphism,” “use a beautiful image,” “add animations,” “make it responsive,” “make it connected,” or “implement securely.” The actual implementation must state and satisfy the concrete dimensions, tokens, component composition, CSS/material properties, source and domain dependencies, valid state transitions, API contracts and acceptance checks required above. If an exact value depends on rendered screenshot tuning, begin with the provided token and record the final adjusted value in the design-token file and visual QA notes; do not leave it subjective or inconsistent across the product.
<!-- SOURCE LINES 4678-4798 END -->

## Global execution checklist

Before any page-specific work begins, the builder must:
- Read this entire foundation and the target page prompt.
- Inspect the current codebase and reconcile the audit findings with actual files.
- Confirm existing routes, shared state, entity models, services, data connectors, storage and tests.
- Use a single canonical source of truth and versioned calculations.
- Keep local-first data handling and explicit opt-in for any remote scheduling/sync.
- Distinguish observed, forecast, modelled, farmer-reported, inferred, calculated, scenario and demonstration data.
- Implement no false API-success, no fake progress, no fabricated metrics, no decorative controls that imply function, and no unverified connector claims.
- Keep the exact v8 visual token hierarchy and research-informed art direction.
- Run the project install/build/type-check/unit/integration/e2e/API smoke tests in the actual target environment and report results honestly.
- Maintain the requirement coverage ledger so each source requirement is marked implemented, blocked, not applicable with evidence, or unverified.
