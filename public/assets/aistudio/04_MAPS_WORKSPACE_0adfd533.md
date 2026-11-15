# FIELD SHIFT — PAGE PROMPT: MAPS — MAP, DRAWING, LAYERS AND REGIONAL DISCOVERY

**Target page:** Maps — map, drawing, layers and regional discovery

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
> Source: `Pasted text(10).txt` · original line count: 4798 · source passages assigned to this prompt: 256 lines.

<!-- SOURCE LINES 1827-2006 BEGIN -->
## 29. Map workspace: complete interaction and geometry contract

### 29A. Quantified map materials, layer semantics and geometry editor states

**Compositional layout:** map workspace uses a `calc(100dvh - 64px)`-aware work area, but retains document scroll if supporting information extends below it. Desktop left navigator: 260–300px when expanded; central map canvas: flexible `minmax(0, 1fr)`; right inspector: 340–390px. At ≥1440px the map should remain at least about 62% of the available center workspace when both side panels are open; provide independent collapse controls. The left panel uses `--fs-glass-strong` (88% opaque) and 14px blur; right panel 90% opaque or solid because it carries small metadata; use 16px radius and 1px neutral border. The map imagery itself is not glass and never receives a whole-layer CSS hue/invert filter. Preserve tile attribution and provider usage rules.

**Map field-geometry symbology:** unsaved polygon = dashed 2px white/teal line plus small editable circular vertex handles; saved selected polygon = solid 2.5px teal outline plus low-opacity teal fill (`fillOpacity` about 0.12–0.18); saved unselected polygon = 1.5px white/slate outline and 0.05–0.08 fill; hover = 2px outline and a transient fill change; invalid geometry = high-contrast amber/coral dash plus an attached error label. These values must be tuned to preserve legibility against natural imagery. Do not apply blur to polygon edges. Vertex markers use a minimum 12px hit target even if the visible dot is 6–8px. Always show selected field identity in the inspector and map label/list.

**Map layer controls:** each row carries human label, layer type/source, date window and availability state. Toggle state controls the actual map renderer layer visibility, opacity or blend mode; the row cannot pretend data is displayed. Opacity slider controls raster opacity where renderer supports it and shows a percent label. Index legend includes units/range, palette endpoints, missing-data colour and selected date. Historical comparison mode synchronises both map panes by geometry version, projection, zoom/bounds and cursor state; toggling one pane's temporal frame must be explicit. If valid imagery is not available, the layer is disabled with a reason—not populated by synthetic colors.

**Geometry editor state machine:** `viewing → drawing → draft_valid|draft_invalid → editing_vertices → validating → save_pending → saved|save_failed`; user can `cancel` from draft/edit states with a discard-confirmation if geometry changed. Store polygon coordinates in GeoJSON with explicit CRS (WGS84 lon/lat at the API boundary); calculate area using an appropriate geodesic/projected method, store area units/method/version and do not naïvely use planar degree math. Validation includes polygon closure, at least 3 unique vertices, self-intersection, empty/near-zero area, coordinate ranges, duplicate vertices and plausible extents. Boundary save creates `GeometryVersion`; downstream map samples/areas are invalidated and previous reports keep their old geometryVersionId.

Use a documented Leaflet drawing/editing plugin (for example Leaflet-Geoman) or a justified equivalent; describe the exact library features used and license/plan constraints. Drawing controls require pointer, touch and keyboard alternatives where technically possible. Map failure states distinguish tile outage, geocoder failure, no georeference, invalid polygon, missing imagery and data-service failure. Research: Leaflet-Geoman documents polygon drawing/editing, snapping and geometry operations; MapLibre distinguishes raster sources from raster-style layers and exposes opacity/visibility as layer properties. Sources are cited in the research bibliography.


The map and drawing workflow is a core product capability, not an optional decoration. Provide it both during Add Farm/field setup and later within My Farms, with shared geometry logic so boundaries cannot diverge between workflows.

### 29.1 Map page layout

**Desktop:** map canvas fills the majority of the page (roughly 65–75% width); a contextual right-side inspector (roughly 25–35%) shows selected farm/field details, drawing instructions, layer controls and save status. A compact left list or top selector provides farm/field navigation. The exact proportions should adapt to viewport and inspector visibility. Never shrink the map into a small card surrounded by unused space.

**Top map toolbar:** search address/place, selected farm/field breadcrumb, map layers, basemap choice where available, fit-to-selection, locate-me, measurement/area units and Help. **Drawing toolbar:** Select, Draw field boundary, Edit vertices, Draw exclusion area/hole, Import boundary, Undo, Redo, Delete selected (with confirmation), Cancel edits and Save changes. Disable controls that do not make sense in the current mode and show their tooltip/reason.

**Right inspector sections:** field/farm identity; area/perimeter; location/centroid; boundary quality and unsaved changes; selected map layer and coverage note; field-specific crop/soil/water metadata; action links to “Open field overview,” “Plan crop rotations,” “Run Deep Analysis” and “View evidence.” The inspector must show source/measurement limitations for any overlay and never imply that a basemap is an agronomic sensor.

### 29.1A Visual direction for the map workspace — inspired by the supplied references, never copied

The two map-interface screenshots supplied by the user are **visual-quality references for the Maps & Fields experience only**. They communicate the level of professional geospatial information design desired: real satellite/aerial imagery as the dominant canvas; clearly defined farm/field geometry; dark, quiet analytical panels; meaningful map layers; historical imagery; and charts/metrics tied to the selected place and date. Use those principles to design an original Field Shift experience. Do not copy either product's branding, names, exact arrangement, wording, icon set, proprietary graphics, or pixel-level composition. Do not make the entire Field Shift product look like a clone of a mapping vendor. Build around Field Shift's own tasks: field management, crop-rotation decisions, water/soil understanding, evidence inspection and Deep Analysis.

#### Art direction and map canvas
- The map itself is the hero and should occupy most of the available workspace. On a wide desktop, target a usable map canvas of roughly 60–70% of the width remaining after global navigation and open side panels. The map must never be reduced to a small decorative card.
- Prefer true-colour, high-resolution satellite/aerial basemap imagery where a permitted, reliable provider is available. Retain the imagery's natural colours. **Do not apply a global dark/invert/hue filter to scientific imagery or index rasters** to force them into the app theme; this can distort the evidence. Make the surrounding UI dark, not the data itself.
- Place the dark Field Shift UI around the map: deep charcoal/navy surfaces, crisp thin neutral borders, controlled hierarchy, clear labels, small professional line icons and restrained teal/emerald accents. Use cyan/teal for selected items and interactive focus, amber for caution, red/coral for critical states, and muted slate for secondary information. Never communicate severity by colour alone.
- Use only restrained surface layering, shadows and occasional translucency. No neon edge glow, glowing map polygons, glass-effect overload, oversized icons, cartoon farmland or decorative 3D. The map's real imagery and the field geometry provide the visual richness.
- Draw field boundaries with a crisp 1.5–2 px high-contrast outline and a low-opacity, theme-aware fill. Selected field: stronger solid teal/white outline plus a clear field label; unselected fields: thinner muted outlines; hovered field: temporary highlight; actively edited boundary: distinct dashed/draft style and visible vertices. Ensure outlines remain visible over pale sand, dark soil, vegetation and cloud shadows. Provide a non-colour distinction, such as line style or label, where overlapping shapes would otherwise be ambiguous.
- Field names should sit on or next to their actual polygon when space permits, with collision avoidance. If labels would clutter the image, use numbered markers with a matching field list. Labels must move with the map and point to the correct geometry. Do not use sample names or fake polygons in a real user's map.

#### Original Field Shift layout: one map, contextual panels

Use the following as a layout system rather than copying the reference screenshot's fixed composition. Keep the global Field Shift navigation consistent with the rest of the app.

1. **Page header / map command bar:** immediately above the canvas, place a breadcrumb such as `Maps & Fields / [Farm] / [Field]`, a farm selector, field selector where applicable, search place/address, current data period when relevant, and compact primary actions. The primary action changes according to context: `Draw boundary` when no boundary exists; `Edit boundary` when a saved one is selected; `Compare dates` when valid historical observations exist. Secondary controls include `Fit field`, `Fit all fields`, `Locate me`, `Measure`, and help. Every icon-only control has an accessible name and tooltip.
2. **Farm & field navigator (collapsible left panel or drawer):** a searchable farm/field tree with hierarchy, field area, current crop if known, and concise status. Selecting a field highlights and fits that exact polygon, updates the entire inspector and records the selection in navigation context. Avoid showing multiple farms' numbers together without explicit per-farm labels. Collapse this panel to give the map more room; reopening it must not reset map extent or selected field.
3. **Dominant central map canvas:** show the selected farm/field geometry, chosen imagery/overlay, map controls and a compact legend. Use a floating, vertically arranged zoom control and a clear `Fit selection` control. Support pan, zoom, map identification (click an overlay/feature to inspect it), drawing and vertex editing. Keep the selected map extent stable when a layer is toggled unless the user explicitly requests a fit/zoom action.
4. **Contextual right inspector:** a narrow but readable panel, approximately 320–380 px on wide desktop where space allows, with its own collapse/expand control. Use contextual tabs such as `Field overview`, `Layers`, `History`, and `Compare`—not four separate permanent stacks. The inspector must update to the same selected farm, field, layer and observation date as the central map. It contains data controls and field evidence, not a second unrelated dashboard.
5. **Temporal strip / bottom timeline:** show it only when a selected data layer has a meaningful observation history. Display available observation dates, thumbnails only where genuine imagery exists, cloud/quality status where available, and the selected date. A compact date-range bar can be pinned to the lower edge of the map, but must not cover key labels or drawing vertices. For a single-date layer, do not invent a timeline.
6. **Layer legend and attribution:** position the legend near the lower edge of the map in a legible, compact panel, avoiding overlap with the timeline and drawing toolbar. Show the units, range and meaning of colours. Put map-tile attribution in the required visible location. Legend thresholds must come from the actual layer definition, not decorative arbitrary values.

#### Contextual workspace modes to keep information organized

Do not display every possible panel at once. The user's current intent chooses the panel arrangement:

- **Explore mode:** Farm & field navigator + satellite/basemap canvas + right `Layers` inspector. The inspector lists the currently available layers, their toggles, source, date, status and metadata drawer.
- **Field inspection mode:** reduce the navigator to a compact field selector; keep the chosen field dominant on the map; show the right `Field overview` with a concise subset of relevant status metrics, source labels and short historical sparkline only if supported data exists. Advanced users can expand technical values.
- **Historical comparison mode:** make the date selection obvious. Offer a synchronised before/after comparison using either side-by-side maps or a drag-to-reveal swipe slider, selected according to screen space. A narrow history/image strip may appear to the left of the map, while the right inspector shows the difference summary, chart and data table. Both views must use the same field boundary, projection, zoom and aligned extent. Clearly label each date and source.
- **Boundary edit mode:** reduce distracting telemetry and layer controls; prioritise vertices, geometry validation, live area, undo/redo and Save/Cancel. Preserve imagery as the working background. Show a persistent draft/unsaved status. Never make the user guess whether they are editing a saved boundary or a draft.
- **Evidence mode:** identify the exact raster, observation or metric being inspected. Show its date/range, legend, spatial resolution, valid-pixel/coverage information if available and source/processing notes. Keep farmer-entered data visibly distinct from remotely sensed, reanalysis, modelled or calculated data.

The system changes modes in place where practical, preserving farm, field, date and extent. If changing mode would discard unsaved geometry or other edits, ask the user to save, discard or stay.

#### Field overview panel: information design

The compact selected-field summary can contain the following, **only when each value has a defensible source or calculation**:
- Selected field name, parent farm, area, crop/rotation stage if recorded, and last updated time.
- Overall field condition/status from the defined assessment logic, with a plain-language explanation and a link to the latest Deep Analysis report. Never present an unexplained heart/health number as a measurement.
- A small set of useful indicators that depend on the field and chosen context—for example recent rainfall, crop-stage information, water balance, vegetation index or a validated soil metric. Each value uses a clear number, unit, short meaning, evidence date and state label (`Observed`, `Modelled`, `Farmer-reported`, `Estimated`, `Demo` or `Unavailable`). Do not fill a 2-column grid with metrics solely to imitate the reference.
- Compact trends or sparklines only if the underlying time series really exists, is date-aligned and has enough valid observations. Selecting a metric opens its full chart/history in the inspector and the correct detail page.
- `Open field overview`, `Open crop rotation`, `Run Deep Analysis`, `View history` and `View evidence` actions that navigate to the exact selected field and retain context. If the prerequisite plan/data is absent, the action must start the appropriate setup or explain the missing prerequisite rather than opening an empty view.

#### Layers & Data inspector

- Add a search/filter field only if the available layer catalog is large enough to justify it. Group layers into meaningful headings such as `Base map`, `Field boundaries`, `Vegetation`, `Weather & water`, `Soil & terrain`, and `Quality & comparison`.
- Each layer entry has a human-readable label, an on/off state where meaningful, an availability state, and a disclosure action to inspect source and definition. Distinguish a currently active layer from a pinned/favourite layer; a pin does not mean the source was fetched successfully.
- Candidate layers include true-colour imagery; field boundaries; actual NDVI/EVI/NDRE when a real, quality-screened satellite product is connected; rainfall or weather context; supported soil properties; elevation/slope; and quality/cloud masks. Do not promise every layer for every location/date. Layers such as nutrient or disease heatmaps require valid inputs and a documented model; do not present invented raster layers as observed data.
- When toggled on, show a real loading state, then either the data overlay and legend or an honest no-data/error explanation. Keep layer choices separate from boundary geometry. Switching off a layer never deletes data or geometry.
- If two overlays are incompatible, hide or disable the conflicting combination and explain why. Never combine multiple opaque rasters until the basemap and field edges become unreadable.
- Layer metadata must include, where applicable: source/provider, product/version, observation period, retrieval date, unit/index definition, nominal spatial resolution, processing method, valid-pixel/coverage state, quality caveats and any permitted download/source link.

#### Time-series and comparison visuals

- Selecting a date updates the map overlay, legend, statistics, table and weather/context values that are date-dependent. Use one canonical `selectedObservationPeriod` to prevent the map showing one date while the panel shows another.
- In comparison mode, provide `Before` and `After` date selectors and a visible difference layer only where arithmetic comparison is meaningful. Offer a swipe divider or synchronised side-by-side maps; never use an attractive before/after thumbnail that does not correspond to the actual selected data.
- For genuine raster values, useful statistics may include minimum/median/mean/maximum, distribution histogram, change distribution, valid area/pixel count and percentage of valid coverage. Define whether summary statistics are over the whole polygon or only valid pixels. If coverage is too low, suppress or qualify statistics rather than interpreting cloud/no-data pixels as poor crop condition.
- A chart beside the map should answer a clear question (e.g. “How did the vegetation index change across available observations?”). Title it with the selected field, metric, units and period. Put a one-sentence takeaway above it and an exact data table/source details behind a disclosure. Never show an empty chart with invented axes/data to fill space.
- The visual legend should be continuous or categorical according to the actual index's scientific meaning. State index units/range. Do not apply the same colours or thresholds to NDVI, EVI, NDRE, soil moisture and risk outputs as if they were interchangeable.

#### Interaction rules for the map visual reference

| User action | Required response |
|---|---|
| Select a field name in the left navigator | Highlight its outline, fit it on the map, update the right panel and make all related actions use that field ID. |
| Click a field polygon on the map | Select the same field in the navigator, show its label and open the contextual inspector. Overlap selection presents a small disambiguation list. |
| Toggle a layer | Fetch/render that layer if implemented; update legend, provenance and selected date without changing field identity or geometry. Show unavailable/failure states honestly. |
| Select an observation date | Update the map raster, date badge, chart, statistics and table to the same timestamp/window. |
| Choose Compare | Require two valid comparable periods, align both maps, show a before/after or difference view, and disclose incompatible data versions or insufficient coverage. |
| Click a chart segment/bin where supported | Highlight corresponding values or period on the map/timeline; otherwise do not pretend a non-linked chart is interactive. |
| Begin boundary drawing | Enter a visible edit mode, display vertices and live geometry, and temporarily de-emphasise irrelevant metrics. |
| Save a boundary | Validate and commit geometry, area/centroid and revision together, then show a success state and a list of calculations marked stale. |
| Open Deep Analysis from the map | Open it with the selected field preselected and the current boundary/data context recorded. |
| Collapse/expand a panel | Resize/invalidate the map canvas, keep the active geometry/layer/date, and prevent a grey or blank map. |

#### Responsive map layout

- **Wide desktop (1440 px and above):** use the three-region workspace only when both side panels are open; the map must retain enough width for meaningful field outlines. Start with one side panel collapsed if the available map canvas becomes cramped.
- **Laptop (1280 px):** keep the map central; make the field navigator collapsible and right inspector approximately 320 px or a drawer. Avoid horizontal page scrolling.
- **Tablet (768 px):** map remains the primary surface; field list and inspector become drawers or tabs. Put drawing controls into a compact toolbar with text labels available on expansion.
- **Phone (390/360 px):** map uses almost the entire main viewport. Keep only essential floating controls visible; use bottom sheets for field list, layer selection, details and date timeline. Drawing must support touch, vertex selection and a non-map alternative for manual coordinates. Do not attempt to squeeze the desktop three-column layout onto a phone.
- In every layout, ensure that the map does not steal page scroll unexpectedly, all controls remain tappable, panels do not cover the selected polygon without a way to reposition them, and reduced-motion preferences are respected.

#### Originality and quality bar

The reference images are a benchmark for density, clarity and professional map-centric composition—not a request for cloning. Field Shift must have its own component system, wording, iconography, labels, data hierarchy and colour tokens. Its strongest differentiator is the connection between the map and the crop-rotation plan, Deep Analysis, field history and recommendations. A user should be able to move from a detected field issue on the map to the evidence, the relevant assessment, and a practical next action without losing their selected field. Make that connected workflow the defining visual and functional feature.

### 29.2 Initial map loading and world bounds

- Render a single world; do not repeat the world horizontally. For Leaflet use a no-wrap tile configuration, world bounds, no world-copy jumping and a suitable minimum zoom. For MapLibre, disable world copies and set valid geographic bounds. Respect the chosen library's current official docs.
- Initial view fits the whole world without unnecessary clipping, then smoothly zooms to a supplied saved farm/field if one exists. If a saved boundary exists, fit the geometry with comfortable padding and preserve a sensible zoom cap.
- On resize, drawer open/close, or entering a hidden tab, call the map library's resize/invalidate-size operation; prevent blank or grey maps.
- Validate longitude in [-180, 180] and latitude in [-90, 90]; clamp search/fly-to requests to valid coordinates and explain invalid manual values.
- Provide zoom buttons and trackpad/mouse-wheel navigation; support pinch zoom on touch. Keyboard users need accessible map controls and a non-map list/form alternative.
- Map attribution must remain visible. Do not promise a public tile provider has 100% uptime; respect its usage policy and provide a graceful failure state.

### 29.3 Ways to add a farm or field

Support these routes where data/service capability allows:

1. **Search by place/address:** user enters a place, selects a result, map animates to it and shows the chosen place. Ask them to confirm before saving.
2. **Use my location:** request browser permission only after user action. On denial or unsupported devices, keep manual search and coordinate entry available. Do not persist precise GPS position or upload it without clear user action/consent.
3. **Enter coordinates:** latitude/longitude input with clear decimal-degree labels, validation and a preview pin.
4. **Draw boundary:** user clicks/taps points around the actual field, closes the polygon, reviews area and names the field.
5. **Import geometry:** support a defined and tested set of formats (initially GeoJSON/KML; other formats such as zipped shapefiles only after a reliable parser and validation are included). Show filenames, detected polygon count, coordinate reference assumptions, invalid features and field names before import. Never silently drop failed features.
6. **Select a detected/predefined field boundary:** only if a real provider/dataset supports it in the chosen geography. The interface must disclose how the boundaries were obtained and allow correction. Do not show selectable field outlines as though they exist if no such integration is active.

For every path, the farm name must remain the name the farmer entered. Searching an address, dropping a pin or selecting a boundary must never overwrite the farm/field name automatically.

### 29.4 Draw polygon interaction — precise sequence

1. User selects **Draw field boundary**. Enter explicit draw mode and show a short instruction (“Click around the outside edge of the field. Select the first point to close the boundary.”).
2. The first click creates vertex 1. Subsequent clicks add vertices and live connecting edges. A faint fill shows the current polygon. Show live approximate area only once enough valid vertices exist, marked “draft estimate” until closed.
3. A line preview follows the pointer/touch to the next potential vertex. Keep it subtle; never obscure satellite imagery/basemap labels.
4. Clicking the first vertex closes the polygon. A “Finish drawing” button provides a more accessible alternative. Escape cancels the drawing with a confirmation if vertices would be lost; Backspace removes only the last vertex (except when focus is in a text field); Undo removes the last geometry operation.
5. After closing, show area and perimeter in the selected unit, vertex count, field name input, and validation summary. Allow user to refine the shape before saving.
6. Dragging an existing vertex changes a draft geometry; display updated area in real time with a debounce. Keep a clear selected vertex marker and maintain pointer capture so the point does not jump.
7. Adding/removing vertices maintains valid polygon ring order. If the shape self-intersects, display the offending edges, explain why it may produce incorrect area and disable Save until fixed or corrected. Do not silently reorder vertices or change the shape.
8. If two field polygons overlap beyond the agreed tolerance, show both outlines and the estimated overlap. Offer “Review overlap,” not an automatic change. Shared borders can touch and small coordinate artefacts may be treated with a documented tolerance.
9. **Exclusion areas / holes:** allow the farmer to cut out buildings, ponds, roads or non-cultivated patches from an otherwise valid field only after explicit selection of “Add exclusion area.” Distinguish the field exterior from internal holes visually and in GeoJSON geometry. Recalculate usable area and label gross versus excluded/net area.
10. Save opens a confirm/review state summarising field name, area, parent farm, boundary edits and implications. Save must be atomic: either the valid geometry and metadata are committed together or neither is. Cancel returns to the previous persisted geometry. If there are unsaved changes and the user navigates away, ask whether to save, discard or stay.
11. After a successful saved boundary edit, create a new geometry version, recalculate derived area/centroid, invalidate affected spatial caches, and mark field-level analyses that depend on spatial coverage as stale. Keep past reports linked to the old boundary version.

### 29.5 Geometry, area and quality rules

- Use GeoJSON-compatible WGS84 coordinate storage, with a suitable geodesic/projected calculation for area and distance. Do not calculate hectares from raw latitude-longitude degree spans.
- Persist original imported geometry and normalized geometry separately where transformations are made. Store coordinate reference system when known.
- Store geometry revision, author/source, created timestamp, and edit reason where helpful.
- Validate empty polygons, fewer than three distinct vertices, duplicate adjacent vertices, invalid ring closure, self-intersection, out-of-range coordinates, unsupported geometry types, non-finite coordinates and implausible area.
- A farm may contain multiple fields. Define whether fields may overlap by design (e.g. nested management zones) or whether overlapping production fields are normally warning states. Never sum overlapping field areas into a portfolio total without a disclosed deduplication strategy.
- If a field is too small relative to a dataset pixel/grid, show the resolution mismatch and lower confidence in spatial representativeness. Do not upsample a single coarse observation into apparent field-level detail.
- If satellite images/cloud-free scenes are unavailable, keep the map usable with the best available basemap and explain the limitation. No fake NDVI/satellite raster.

### 29.6 Map layer switcher

Only list layers that are implemented and have real data available for the selected period/place. Potential layers include base map; field outlines; actual optical image; actual NDVI/EVI; rainfall; elevation/slope; soil properties; and observation-quality mask. Every layer entry has: source/provider, product name, units/legend, observation date/time window, nominal spatial resolution, processing method and quality caveat.

When the user switches layers: keep the same selected field and map extent; show layer-specific legend and loading state; handle no-data/cloud-contaminated scenes; do not change the farm boundary itself; and update the evidence metadata. If two layers cannot be meaningfully combined, disable the combination with a short reason instead of adding unreadable blended colors.

### 29.7 Map selection and map-to-page navigation

Clicking a field outline selects it and opens/updates the right inspector. A selected outline uses a clear solid accent border and restrained transparent fill; unselected fields use quieter borders and accessible labels. Clicking a field from a list flies to and selects the same geometry. “View detail” opens the exact field page. “Crop rotation” opens that field's active rotation or starts a plan if none exists. “Deep Analysis” opens the workspace preselected to that field. “Fit all fields” frames all valid field boundaries. When map edits are unsaved, changing field prompts to save/discard/stay. Preserve map selection on return from detail pages when sensible.

### 29.8 Map error and empty states

- No farm yet: show a clear empty state and “Add a farm.”
- Farm has no boundary: show the pin/coordinates and offer “Draw boundary” and “Import boundary.”
- Tile provider down: maintain editing if geometry tools can function on cached/background blank coordinates; show “Map tiles could not load” and manual coordinates/list fallback.
- Geocoder down: preserve typed query and expose manual coordinate or pan-and-select alternative.
- GPS denied: no repeated permission prompts; explain how to choose a location manually.
- Invalid geometry: highlight the exact error and the action to fix it.
- Import failure: show file-specific errors and allow retry without discarding unsaved form data.
- Partial geodata: clearly separate unavailable layers from a map rendering failure.

<!-- SOURCE LINES 1827-2006 END -->

<!-- SOURCE LINES 4036-4111 BEGIN -->
# PAGE 3 — MAP WORKSPACE: SATELLITE MAP, FIELD DRAWING, LAYERS AND REGIONAL DISCOVERY

## 30. Four map modes

Map is a full spatial workspace, not a pin picker. It has distinct modes:
1. **Explore:** pan/zoom, select fields, view layers and legend.
2. **Edit boundaries:** draw or edit geometry as an unsaved draft until saved.
3. **Inspect data:** click field/pixel/point to inspect values, date, source, units, resolution and quality.
4. **Regional discovery:** see privacy-safe aggregates and farmer profiles that users explicitly choose to publish.

Only one pointer-owning interaction mode can be active at once. In drawing mode, a click adds a vertex and cannot also select another field or dismiss the inspector. Show the active mode and a clear cancel affordance.

## 31. Desktop geometry and surface hierarchy

Use nearly the full available height beneath the top navigation. At 1440 px desktop, layout target: collapsible left farm/field rail 250–300 px, flexible center map preserving at least about 50–55% of usable width, right layers/data inspector 300–360 px. Panels collapse independently; map smoothly expands to fill available space and recalculates its viewport after resize. On mobile, panels become drawers/bottom sheets.

The satellite imagery is the visual environment. Do not apply a CSS dark filter to the map tiles because it corrupts their real colors/index values. Keep control panels dark enough for legibility, selected field boundary clear, other boundaries restrained, and a small legend explaining border/fill meaning. Place zoom/layer/location controls within safe map margins and keep attribution visible. The map should be professional, dense enough for GIS work but not a wall of toggles.

## 32. Left farm/field rail

Header `Farms & fields`, search input, `Add field`. Each farm row expands to child fields, each showing field name, area, current crop or `No active crop`, and status. Clicking a farm fits the view to all its fields. Clicking a field sets stable `selectedFarmId` and `selectedFieldId`, centers/zooms to the polygon and updates inspector/layer context. Search results must differentiate saved fields from geocoder locations. A geocoder result moves the map only; it never renames a farm, overwrites an existing field or creates a record without the user's explicit action.

If selection changes while there are unsaved geometry edits, offer Save / Discard / Continue editing. A blank-map click clears selection only when there is no draft edit.

## 33. Map canvas and base layers

Base layer selector can offer Satellite, Road/Street, Terrain and neutral basemap if those providers are genuinely configured. Attribute the provider and show acquisition date where known. Don't promise worldwide historical/high-resolution imagery without checking coverage. Support pan/zoom, fit selected farm/field, locate me only after browser permission, place search, scale bar, optional compass, boundary labels, layer opacity, date selection for temporal layers and a legend matching the active layer.

Map resize/drawer/tab changes must refresh the map container dimensions while preserving map center, zoom and selection. Avoid infinitely repeated world tiles while drawing; use suitable map bounds and documented edge-case handling. Map tile attribution and provider usage limits must be respected in production.

## 34. Drawing a new field boundary

Click `Add field` or `Draw boundary`. Open an inline tool panel/side inspector: required field name, polygon (default) or rectangle tool, helper text, `Finish`, `Undo point`, `Cancel`, and `Help`. Drawing mode changes cursor and gives visible point handles. Guidance: `Click around the field edge. Select the first point or choose Finish to close the boundary.` On touch, provide large controls; don't rely on hover.

As vertices are placed, show provisional polygon and estimated area when calculable. Label it `Estimated mapped area` until saved. Validate at least 3 distinct points, finite coordinates in geographic bounds, non-zero area, no self-intersection unless a documented repair is previewed, plausible scale, duplicate/overlap with same-farm fields, and coordinate handling for antimeridian/polar cases. Adjacent shared borders must not be treated as a harmful overlap. Area calculation must use suitable geographic projection/geodesic method; never treat latitude/longitude degrees as square metres.

Before saving, display field name, mapped area, perimeter if reliable, vertex count, overlap warnings and a note that a drawn boundary is user-defined, not independently verified cadastral/legal boundary. Allow fix/edit; no silent geometry alteration.

## 35. Editing, undo, save and downstream consequences

For an existing field, `Edit boundary` enables draggable points, midpoint insertion, vertex deletion, undo/redo and `Reset to saved boundary`. Recalculate provisional area/perimeter while editing and mark the field `Unsaved changes`. The inspector must not imply its metrics have been recalculated for draft geometry.

Saving persists normalized GeoJSON or equivalent geometry with CRS, coordinates, area method, source (`drawn`/`imported`), geometry version, timestamp and validation results. A new field receives a new stable ID; editing preserves field ID and increments geometry version. After save: update the map and field list, recalculate total mapped area, invalidate geometry-dependent cached samples/layers, mark dependent analysis stale, warn the rotation planner/simulator if affected, preserve historical reports referencing the previous geometry, update Home only through canonical summary logic, and show success only after persistence. Provide `Open field details`.

Cancel discards draft after confirmation if edits exist. Geometry Undo/Redo edits vertices and never navigates away. `Reset to saved boundary` warns if it will discard changes. Failed save keeps the draft and presents retry; don't replace the saved geometry with a failed draft.

If import is implemented, support GeoJSON first and other formats only with tested parser/CRS handling. Preview features before import, map names to fields, reject invalid/duplicate geometries clearly, never overwrite existing boundaries silently, and provide a reversible import batch.

## 36. Right inspector: layers and data

Header `Map layers & data` and tabs `Layers`, `Inspect`, `Compare`. Compare is only enabled when valid comparable observations exist. Group layers rather than dump every option into one list:
- **Boundaries & operations:** farm/field outlines, exclusion areas, crop/rotation labels, saved zones if any.
- **Vegetation:** NDVI, EVI and other indices only if a real multispectral product and quality/cloud masking exist.
- **Water/weather context:** precipitation, supported soil-moisture data, ET products, drought context; don't render point-specific weather JSON as a precise raster.
- **Soil/terrain:** soil properties at actual grid resolution/depth, elevation/slope if integrated, supported erosion/drainage proxies.
- **Planning/risk:** calculated suitability, modelled stress, scenario differences, alerts and observations.
- **Regional discovery:** aggregate-only data and opt-in public profiles.

Each row has layer name, source/product, real status (Available / Loading / Stale / Unavailable / Planned), date, visibility toggle, optional opacity and pin/favourite. Toggle fetches/paints a layer only after valid data exists; never show decorative fake heatmaps. Date change retrieves the actual capture; if none exists, show closest real available dates. Switching indices changes legend/unit/explanation. Map click with an active layer opens Inspect containing value, units, acquisition date, geometry intersection, product, quality mask, resolution and interpretation limits. Compare dates with swipe/split only when processing and time semantics match.

A vegetation index signals a spectral change; it does not diagnose a disease or nutrient issue. Display cloud contamination, pixel quality and the field-versus-grid size limitation. If the product's grid is larger than the parcel, label data as broader grid context.

## 37. Regional farm network and privacy

Regional discovery combines map discovery, connections and agricultural context. **Public farms must never show exact locations or field polygons. City-level disclosure is mandatory.** Only explicitly opted-in farms contribute to aggregate city/region statistics. Add minimum cohort thresholds to prevent inferring one farm's values from an aggregate. Public profile responses must be a separate privacy-filtered data model/API, not the same private response hidden using CSS.

Clicking a city opens opted-in farm/farmer profiles. Clicking a profile exposes only details the farmer chose to share. Messaging requires permission-aware contact, block/report controls if offered, and no exposure of private contact information by default. Revoking sharing stops future publication and states propagation/cache delay.

`Compare my farm with the region` requires enough public data and matching periods, units, crop/context and methodology. Disclose region/time window and sample-size band. If too few contributors exist, say `Not enough shared data to provide a reliable regional comparison`.

## 38. Map backend/API contracts and tests

Provide logical operations for reading geometry/versions; saving new geometry versions with validation; listing real available layers; querying tiles/field statistics by source/time; listing actual acquisition dates; inspecting values; comparing valid layer snapshots; and retrieving privacy-safe region aggregates. Never expose credentials in browser code. Test invalid/self-crossing polygons, two-point boundary, duplicate vertex, overlap, small/large fields, mobile touch, map resize, tile failure, cloudy/no imagery dates, layer resolution larger than field, edit/cancel/save failure, stale analysis, import validation and public API privacy. Verify drawing clicks cannot also select an underlying map object.

---

<!-- SOURCE LINES 4036-4111 END -->
