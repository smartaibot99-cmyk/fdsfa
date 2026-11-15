# FIELD SHIFT — PAGE PROMPT: HOME — DAILY FARM TRACKER

**Target page:** Home — daily farm tracker

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
> Source: `Pasted text(10).txt` · original line count: 4798 · source passages assigned to this prompt: 282 lines.

<!-- SOURCE LINES 417-462 BEGIN -->
## 4. Home: the daily farm tracker

**Main question:** “What is happening with my farm, and does anything need my attention?”

Home is a work surface for returning users, not a repeated product introduction. When no farm exists, show a clear onboarding state. Once a farm exists, remove redundant “How it works” and multi-step promotional cards.

### 4.1 Top region

- Compact title and a primary **Plan Crop Rotations** action.
- `Viewing: [Farm Name]` selector; persist the last-viewed farm.
- A subtle “last refreshed” line and optional Refresh Data action.
- No giant hero image consuming the useful dashboard area. If a farm image appears, it should support context, not reduce information density.

### 4.2 Current Conditions card

Show current/recent conditions from the actual source available: temperature, recent precipitation, wind/humidity when useful, observation time and comparison with an appropriate local seasonal baseline when sufficient historical data exists. A separate verified forecast connector may add future forecast data; otherwise the card must not be labelled “Forecast.”

If the data is delayed, say “Updated X hours/days ago.” If the source has no recent value, show the last available observation and its age rather than implying it is live.

### 4.3 Daily Farm Status card

A flexible-height card whose sections appear only when they have meaningful content:
- Farm name, status and updated time.
- What is growing now and the crop's actual stage, if dates/data support it.
- Season/cycle position and days until the next transition only when calculated from a valid schedule.
- Compact rotation line, current crop highlighted.
- Plain-language water status and soil-condition summary.
- One evidence-based next action, or “Nothing needs attention right now.”
- Active alerts at the bottom, highest severity first.

Status should be derived from the same evaluated data as the underlying metrics. Use `Good`, `Needs attention` and `Alert` labels, always with text and supporting reasons. The background can subtly reflect severity, but never turn the entire page into a bright alarm state.

### 4.4 New feature: “What changed since your last check?”

Add a concise change summary when meaningful changes exist: a newly active alert, a significant rainfall event, a new vegetation observation, a changed modelled water balance, a score movement, or a revised planting window. Each item links to evidence and identifies whether the change is a new observation, a new calculation or a new farmer input. Avoid displaying noise from normal daily variation.

### 4.5 New feature: portfolio watch strip

When a user manages multiple farms, show a slim prioritised strip such as “2 fields need attention,” with each item linking directly to the relevant field and reason. Do not collapse several field alerts into one opaque portfolio status. Do not show this block when no useful cross-farm information exists.

### 4.6 Advanced-only compact telemetry

Advanced Mode may expose deeper weather and water variables, data freshness, water/soil intelligence mini-cards, supported vegetation trends, model-derived metrics and their confidence. Keep the Home page readable; deep tables and formulas belong on the relevant intelligence page.

---

<!-- SOURCE LINES 417-462 END -->

<!-- SOURCE LINES 2055-2088 BEGIN -->
### 30.3 Home — daily farm tracker

#### Quantified visual and interaction contract — Home

**Version 8 composition override:** Home is a returning-user operational tracker, not a marketing landing page. Preserve a restrained, high-information first screen. At 1440px, use 36–40px horizontal gutters, a max-width 1480px shell, and a 200–240px photo-backed feature module beneath the 64px top bar; if the viewport height is short, shrink or remove the photo layer rather than pushing real farm status below the fold. The feature module combines selected-farm identity/status and the weather card in a 7:5 or 6:6 grid, not a giant welcome headline. Use an approved, crop/farm-relevant aerial photograph or sky/landscape asset with focal point away from labels. Apply a forest-night directional scrim (`rgba(4,14,8,0.22)` over the image field rising to about `rgba(4,14,8,0.88)` beneath the copy edge) and the current forest-green glass tokens. Keep actual title and metrics in the DOM above the image layer. Add low-alpha atmospheric haze behind the title only if it improves the image transition; the text itself stays sharp. Do not use a storm-only image as unrelated ornament: choose photography consistent with actual farm/location context, while the weather icon/condition itself must come from real data.

In the hero's left 7 columns place a short contextual greeting, title `Smarter decisions. Healthier fields.` (or equivalent approved final copy), a one-sentence summary and primary `Plan crop rotations` action. In the right 5 columns show a compact `Current Conditions` glass surface (`--fs-glass-default`, 78% opaque, 14px blur, 16px radius, 20px padding) with current/recent temperature, rain observation and source timestamp. Do not place fine text directly on a high-detail photo. Below hero, arrange a 12-column grid: Farm Overview spans 4 columns, Current Conditions / Weather Detail spans 3–4 columns if not already in hero, and Priority Actions spans 4–5 columns. Use one clear section heading above the grid, cards 16px radius, 20px padding, and 16–20px gaps. Section headings 18–20px; card headings 15–17px; primary values 24–32px; body 14–15px; metadata 12–13px.

A lower “Recent insights / What changed” region is a horizontal list of at most three meaningful items; use a left icon/status marker, compact title, one-line evidence-backed summary, and explicit timestamp/context. Each item routes to its exact field, observation or report. Portfolio Watch appears only if another farm needs attention; it identifies that farm by name and provides `View farm` / `Switch farm`. Do not display empty alert containers or dummy trends. Advanced telemetry lives in a collapsed/secondary area or links into Intelligence rather than crowding the primary status card.

**State/data dependencies:** selected farm is canonical global state; every card derives from the same `FarmStatusAssessment` and selected farm ID. On farm switch, set the selection first, cancel/ignore in-flight responses for the previous farm, then hydrate matching data; never flash mixed-farm metrics. Status card states are `loading`, `current`, `stale`, `partial`, `unavailable`, `error`. If a prior report exists but input/source dependencies changed, preserve the report but show a visible stale banner and `Review / rerun` action. If no report exists, show `Plan crop rotations` and `Run Deep Analysis` only when their prerequisites are clear.

The weather card must distinguish `Observed/reanalysis`, `Current conditions` and `Forecast`; include a timestamp and exact period for rainfall. The Next Action component is driven by an action/risk rule with evidence references; if none applies, say no immediate evidence-backed action was identified, but only if the monitored inputs are sufficient. Do not use decorative status curves to imply a measured trend unless the underlying time series exists. For a trend sparkline, include its date window and metric label.

At 1280px the grid can change span but remains a 12-column system; at 768px stack hero content and use 2-column cards; at ≤430px stack cards one column and keep the primary next action above secondary telemetry. The hero background uses `background-size: cover` with a documented focal position, a separate scrim and `pointer-events:none` image layers. Hover elevations are 1–2px maximum; entrance motion 220ms. Respect reduced-motion.


**Page hierarchy:**

1. Page title and compact selected-farm selector, with “Add farm” / “View all farms” secondary actions.
2. A main status panel showing farm name, location, current condition label (Good / Needs attention / Alert / Insufficient data), last evidence update time, active crop and plan phase if known.
3. Current conditions/weather card with current/recent values or forecast if a real forecast source is connected; always label observation, forecast and reanalysis distinctly. Show a short range or context such as “rainfall below typical for this period” only when the baseline is computed.
4. Crop rotation at a glance: crop photo, current crop, sequence, season/year, next transition window, days until transition only if dates are supported, and a clickable sequence leading to the correct field/rotation.
5. Water Intelligence summary: plain-language water balance/status, supported recent precipitation, modelled crop demand and data freshness; advanced detail opens Water Intelligence.
6. Soil Intelligence summary: a supported soil property or condition indicator and whether the value is a lab measurement, mapped estimate or calculation. Advanced detail opens Soil & Land.
7. “What changed since your last check?” short ranked events, only if comparison evidence exists.
8. Recommended next action(s), with reason, due window and action state. If nothing is justified, say “No immediate action identified from the available data.”
9. Active alerts only. Do not reserve an empty alert block; no critical status from a silent fallback.
10. Optional portfolio watch when multiple farms/fields exist: list each relevant field and its specific condition.

**Click reactions:** farm selector updates all sections together; crop sequence opens the matching rotation stage; weather values open their evidence; water/soil summaries open detail tabs; alert opens evidence and affected field; action opens task detail; report history opens dated report. “Start New Analysis” should not be the same action as Deep Analysis or rotation planning; use labels “Plan Crop Rotations” and “Run Deep Analysis” as context-appropriate actions.

**Simple mode:** short status sentences, 1–3 actions and the key crop/rotation view. **Advanced mode:** source timestamps, telemetry, supported 30-day trends, water/soil detail, sensor resolution, scientific explanations and trend thresholds. Keep Advanced content expandable rather than dumping every variable onto Home.

<!-- SOURCE LINES 2055-2088 END -->

<!-- SOURCE LINES 2926-2985 BEGIN -->
## 40. Exhaustive Home and Farm Tracker content contract

This section turns the original per-mode content requirements into mandatory implementable data and consistency rules.

### 40.1 Home content — both modes

#### Dedicated weather-card art direction and component contract — applied consistently on Home and Farm Tracker

This component borrows the **visual vocabulary** of the supplied WeatherWise reference—cinematic environmental photography, an oversized but restrained weather value, translucent material panels, a compact visual trend and a horizontal forecast—not its brand, exact composition, fake weather values or globe artwork. Field Shift's weather card must communicate conditions that matter to farming, not become a generic consumer-weather clone.

**Desktop geometry:** on Home, the feature weather module occupies 5–7 columns depending on available dashboard grid; a current-condition hero surface may span 100% of that region and be about 220–280px tall. Place a realistic, contextually appropriate sky/landscape photograph as an inset background with `object-fit: cover` and a documented `object-position`; put a directional navy scrim above it (`rgba(4,14,8,.24)` to `.88` left-to-right) so text is always readable. The surface boundary is 12–16px radius, 1px `rgba(225,241,245,.12)` border, no neon outline. The inner content uses a left text zone and a compact right metric zone; exact split is 58/42 at wide size, stacked at mobile. Main temperature is 40–52px, light/regular weight, with high/low or range values at 14–16px. A concise descriptive condition is 16–18px. Location/time and source timestamp are 12–13px.

**Glass materials:** a photo-backed secondary detail panel uses `rgba(8,23,14,.78)` (78% opaque / 22% transparent), `backdrop-filter: blur(14px) saturate(115%)`, `12px` radius and `16–20px` padding. Any dense telemetry table or very small chart labels use `rgba(7,20,12,.88)` (88% opaque / 12% transparent) or a solid `#102319` surface. Never set CSS `opacity` on the whole card; use alpha only in the background-color so text stays opaque. If contrast fails over bright cloud edges, strengthen the scrim rather than fading text.

**Data hierarchy:** current conditions (or forecast, but never conflated) → rain/temperature summary → a 5-day forecast only if the connected weather provider returns it → farmer-relevant interpretation (e.g. rain observed in a defined period, upcoming heat window if the forecast/source supports it) → `View weather details`. Optional trend curve is shown only when the real underlying time series exists, has a labelled metric/date range and its points correspond to displayed values. Do not make a decorative curve imply an actual trend. Display data source/time in the card or one click away in the Evidence Drawer. NASA POWER history is not a multi-day forecast; forecast content must come from a real forecast service and carry a forecast timestamp.

**Animation:** weather-dependent background treatment can crossfade over 300–500ms when actual weather state changes; photo parallax/drift is optional, limited to 1% translation over 45–90 seconds and disabled under reduced motion. The temperature number must update from data state, not count up repeatedly on every render. Selected forecast day syncs the label, value, chart marker and selected-day state from one `selectedForecastIndex`. Loading uses a card-shaped skeleton; provider failure retains the last valid value with a stale timestamp and explicit stale badge, or shows unavailable—never fabricate sunny/cloudy content to make the card look complete.

**Responsive behaviour:** at 1024px, keep at least 40% width for the current-condition text; below 768px, stack the current reading and supporting metrics; at 390px, the card fills the content width and forecast items may scroll horizontally within the card. Touch target ≥44px, accessible label for weather icon/controls, and text alternative for the curve are mandatory. The same component tokens, spacing and typography are used in Home and Farm Detail; only compact/expanded variants change density.


**Farm identity and overall condition:** farm name, location, total area where boundary/area is valid, selected farm control, condition label (Good / Needs Attention / Alert / Insufficient data), one-line reason when not Good, last updated timestamp, and a clearly stated data freshness/staleness state.

**Current crop:** crop name and simple family label (Grain, Legume, Oilseed, etc.), current position written once as “Season 1 of 4” (never duplicate “Season”), stage (sowing, growing, flowering, harvest-ready) only if crop calendar data supports it, days into stage and days until next transition only if the dates are supported, next crop and expected harvest window. Advanced adds recorded planting date and the modelled/reported time actually in the field.

**Rotation plan:** full sequence with active stage highlighted; each slot explicitly marked as crop, Fallow, or Cover Crop; total cycle length and review point; one short reason for the next crop; link to exact rotation details. Advanced adds match score, evidence confidence and per-crop duration/technical rationale.

**Water:** plain status (“Enough for current conditions,” “Getting low,” “Critically low,” or “Insufficient data”); one evidence-backed sentence saying what the status means and what to consider doing; recent rainfall and comparison to a suitable baseline; water source (rain-fed, irrigated, both, or unknown); approximate days until water stress only when the water-balance model has suitable inputs; seasonal irrigation allowance used/remaining when the user has entered a limit and usage records exist. Advanced adds topsoil/root-zone moisture values, units/depth, within-field or regional historical percentile when a suitable baseline exists, water-stress days this season, current crop demand in mm versus rainfall/irrigation supply and full calculation basis.

**Soil:** plain description of known/estimated soil texture; soil condition; moisture compared to usual conditions only where a comparable historical reference exists; potential warnings such as acidic/alkaline, salinity or poor drainage phrased as a possible limitation when based on mapped estimates. Advanced adds pH, organic matter, nitrogen balance in kg N/ha, salinity/EC, drainage classification, soil texture fractions, CEC, available water capacity, bulk density/porosity, slope and their data source, depth, date, native resolution and uncertainty. Do not fabricate all fields if unavailable.

**Weather:** current/recent temperature and conditions; rain status and recent 24-hour/7-day totals when source cadence supports them; wind and humidity if supplied; comparison to normal only against a correctly defined temporal baseline. A multi-day forecast is labelled Forecast only when a real forecast source provides it. NASA POWER historical/daily data must not be presented as a forecast. Advanced adds highs/lows, solar radiation, hot-day counts, time-window definition and deeper series.

**Crop health:** Simple may show “vegetation appears above/near/below its recent baseline” only if a real valid satellite-derived observation/index was fetched, quality-screened and appropriate for the field/crop stage. Include cautious wording that vegetation changes can have multiple causes. Advanced adds index name/value, sensor/product, scene date, cloud/quality flags, trend, baseline method, spatial resolution and caveats. If no valid imagery exists, the section shows unavailable/awaiting imagery—not guessed greenness.

**Risks and alerts:** show only when active risks/alerts exist; prioritise the most urgent; each has what is happening, why it matters and what the farmer can do. Supported classes may include heat, frost, drought/water stress, heavy rain, flooding/waterlogging and pest/disease risk where the model supports the latter. Simple shows Low/Moderate/Elevated plus one reason. Advanced adds value, reference/baseline, anomaly magnitude, source, timestamp, threshold and evidence confidence. If there are no alerts, remove the section entirely or show a compact neutral state only if needed to explain monitoring is active; never fill space with fake alerts.

**What to do next:** one highest-priority evidence-backed action, or “No immediate action identified from the available data” only when all evaluated status indicators are non-concerning and enough data exists. Also show upcoming tasks in the next 1–2 weeks, such as irrigation review, sowing window, harvest window, field inspection or soil test due, each with a farm-specific reason. Advanced adds exact windows/dates, supporting calculation and dependencies.

**Trends:** 30-day soil-moisture trend only if comparable observations/model outputs exist; monthly rainfall vs normal with baseline; meaningful persistent changes with duration/magnitude. Advanced adds season-to-date charts, same-season historical comparisons and year-by-year values, and marks unavailable time windows.

**Trust:** confidence/evidence-quality label and one-line reason; key data source type (satellite, farmer-entered, estimated, calculated); data freshness for weather, moisture, and crop health; relevant missing field profile inputs and how to add them. Advanced adds confidence contributors, provenance tag on every value, native resolution, fallbacks, model version and details in the Evidence Drawer.

**Linked actions:** open full rotation detail; open exact field detail; stress-test selected baseline in Simulator; edit farm/field details; open Deep Analysis; add observation; review tasks.

### 40.2 Overall-status consistency rule

All related status phrases must be derived from a single status evaluation object/version. The headline condition, water/soil labels, descriptions, suggested action and alert severity cannot be independently hardcoded. The overall farm/field condition may not be more positive than a qualifying critical underlying indicator. If a critical indicator is stale or unverified, show an appropriate caution/unknown state instead of a false “Good.”

Required regression cases from the attachment:

- Water status cannot say “Adequate” while its detail says “critically low, irrigation needed.”
- Soil status cannot say “Balanced” while the explanatory sentence contradicts it without explicitly distinguishing different measures.
- “Nothing needed right now” cannot coexist with a credible critical water state.
- The header cannot say “Good Condition” when a verified critical alert is active.
- Rotation position must not repeat terms (“Year 1 • Season 1 of 4,” not “Season 1 Season”).
- If data is missing, do not choose Good simply because no alert calculation ran.

Implement `StatusAssessment` once and feed every surface from it; test contradictions at the domain/unit level and in the UI.

<!-- SOURCE LINES 2926-2985 END -->

<!-- SOURCE LINES 3263-3297 BEGIN -->
## 47. Farm Tracker visual arrangement: more data without card dumping

Use a deliberate layout rather than a grid of identical boxes.

**Desktop arrangement:**

- Top: title/selected farm control and one-line condition.
- Main top-left (~2/3 width): a coherent weather card with temperature as the largest value, a restrained temperature accent/background tint, current/recent conditions, rain summary and historical-normality label. If forecast data exists, show the forecast as a clearly labelled strip; do not imply it exists otherwise.
- Top-right (~1/3 width): farm identity/details and last-analysis/evidence freshness summary.
- Middle left: a Farm Conditions section with Water and Soil summaries combined in a balanced split or compact paired view. Use different icons/labels and meaningful status hierarchy; keep them visually distinguishable without making each one a large glowing card.
- Middle right: a Recommended Action panel showing either “No immediate action identified” or an ordered short list of actions with priority, reason and link. It must be consistent with status/alerts.
- Crop status: one attractive crop photo tile for the current crop, with crop name, botanical/plain family, active stage and remaining days overlaid on the image only when the dates support the number. A compact rotation roadmap can sit nearby with the active stage highlighted; avoid a large repeated rotation card if the same sequence is already shown elsewhere on the page.
- Retrospective row: “Last month: crop and weather conditions” using actual valid historical observations/baselines: vegetation trend/mean vs baseline if available, temperature normality, rainfall anomaly and GDD if computed. Include source/period and missing data states. This replaces scattered low-level telemetry.
- Trends row: soil moisture/rainfall graph and persistent trend summary where enough comparable data exists.
- Risks/alerts section appears only when active; most urgent first; no empty decorative panel.
- Recent data-update card: a separate compact card listing the latest successful update by data category (Weather, Soil moisture, Vegetation, Terrain etc.), with last observation date and last retrieval date separately. Make clear that a source retrieval can be recent even when the newest observation is older. Show source statuses and any failed updates.
- Optional portfolio alert strip if a different farm has a meaningful unresolved issue.

**Advanced mode only details** can be placed in expandable technical sections, a side drawer or deeper tab; don't place every scientific number in the main grid. Complex terms should live in Advanced Mode/technical sections rather than Simple Mode. Farm Tracker must not contain a separate large “Field Log” dashboard card per the user's later direction; field observations/journal access belongs in Actions & Observations or a contextual “Add observation” action. The journal data model remains available because it is useful for management history.

**Mobile arrangement:** weather/status first; selected crop and main action next; alerts next; water/soil summary; last update and deeper trends. Use full-width stacked sections, not a three-column desktop grid compressed to phone width.

## 48. Extra Advanced Home cards and ranking interaction

Advanced Home may add more detail while preserving the current visual language and not turning Home into an unstructured telemetry dump. Potential additional sections:

- **Other candidate rotations:** a horizontally scrollable or compact ranked strip showing each valid alternative's overall score, sequence preview and confidence/data limitation. The horizontal region must have visible scroll affordance and keyboard/touch support; do not hide candidates behind a tiny scrollbar only. Selecting a candidate opens the Rotation Planner detail for that exact candidate, with the selected farm/field and input snapshot retained.
- **Why this rotation, not the next-best one:** an explicit selection-aware comparison panel. It summarises the strongest drivers and downsides of the selected plan versus the next-best alternative, and allows the user to select another competitor. The conclusion and all data must refresh when the selected rotation changes. It must not claim the top sequence is universally superior; explain that it ranks highest under the current inputs/priorities.
- **Data freshness and source update card:** a compact standalone panel with per-source latest observation/retrieval dates and a last-analysis timestamp. Avoid mixing this with a generic confidence score.
- **Water Intelligence expanded card** and **Soil Intelligence expanded card** in Advanced Mode only, with direct links to their detailed views.
- **Condition trends:** one compact sparkline row for supported moisture/rainfall/vegetation indicators with baseline and source.
- **Farm action priorities:** a ranked short list tied to reports/tasks with clear dates and status.

The Home page still answers “what is happening and what should I check first?” The full analysis output belongs to Farm Intelligence; the full rotation catalogue belongs to Crop Rotation Planner. These Home sections are previews/entry points and must link to the full destination.

<!-- SOURCE LINES 3263-3297 END -->

<!-- SOURCE LINES 3887-3993 BEGIN -->
# PAGE 1 — HOME: DAILY FARM INTELLIGENCE

## 21. Home purpose

Home answers, within a few seconds: **Which farm am I viewing? Is something important wrong? What changed? What should I do next?** Home is a daily operational tracker, not the setup wizard, the full scientific report or a miniature of all other pages. Show a small number of high-value summaries and provide direct routes to detail. Raw NDVI, ET₀, soil-water equations and long source lists belong in Advanced details or dedicated pages.

## 22. Layout and visual hierarchy

Use a 12-column responsive grid and stable alignment. The page must feel like the cinematic Field Shift collage: a panoramic, realistic aerial farm image in a controlled hero, dark scrim for legibility, restrained teal/green accent, subtle translucent surfaces and sharply readable metrics. Do not put all text on a busy image; protect important copy with gradients/surface overlays. The photo must not be falsely described as a satellite image of the user's actual farm. If the user has no farm imagery, use a generic illustrative farm image and treat it as decoration.

### 22.1 Global header

Use the shared sticky 64 px header, with FIELD SHIFT mark left, navigation centered and search/notifications/profile right. Home is active. Avoid a separate duplicate Home navbar. Clicking the logo returns Home; search opens the global search overlay; notification icon opens the notification drawer; profile/settings opens its actual panel. The header's active farm context must be synchronized with Home's selector.

### 22.2 Hero panel

Place a wide hero panel 20–24 px inside the content container, around 230–285 px high at 1440 px desktop, radius 18–20 px. Base image layer is a realistic farm/aerial landscape with `cover` positioning; above it add dark left-to-right and bottom scrims; then put content above the scrim. Keep image brightness and focal point so there is a readable dark area behind text. On mobile change the crop/stack rather than reducing text to tiny sizes.

Left aligned 28–36 px from its top and left edges:
- Small eyebrow: `YOUR FARM OVERVIEW` or time-sensitive greeting only when a reliable local time is known. Never hardcode a person's name.
- Heading: `Smarter decisions. Healthier fields.` or a shorter returning-user headline, around 30–38 px, light/medium weight.
- Supporting line: `Evidence-backed farm insights, crop planning and actions in one place.` around 14–16 px, maximum two lines.
- Active farm name plus city/region, secondary and compact.

Right side primary action `Create crop rotation plan`; secondary `Run Deep Analysis`; quiet `Open map`. Primary action uses the teal/green accent, other actions are lower contrast. Do not make all buttons equally bright.

Actions:
- `Create crop rotation plan` opens the Rotation Planner wizard in new-plan mode. If a prior draft exists, offer Resume or Discard; never overwrite silently.
- `Run Deep Analysis` opens a scope summary with selected farm/fields, practices to be used, data refresh plan and any required privacy notice. Do not start a farm-level report if only one field was selected without identifying the scope.
- `Open map` navigates to Map focused on the selected farm extent.
- Farm name/select affordance opens the farm selector. Switching farms is a single state transition and clears or reloads every dependent query; old results must not flash under the new farm name.

### 22.3 Context row below hero

Left: `Viewing farm` selector. Rows in the selector show farm name, region, mapped area, current crop if known and semantic status. Include search for large portfolios. Right: `Last assessed [time]`, stale/needs-review indicator, and `Review changes` route where applicable. Do not confuse data retrieval time with underlying observation time.

When another farm has a critical alert, a compact cross-farm strip can say `[Farm name] needs attention · Open`. Show at most one such teaser and a `View all alerts` link. Respect the user's cross-farm notification preference. Clicking opens the exact farm and alert record.

### 22.4 Summary row

Four consistent, compact tiles span the page with 14–16 px gaps. Each tile has an icon, label, primary value/status, short explanation and click target:

1. **Farm health/status.** Numerical score only if a defensible, validated health model exists and enough compatible field data is present; otherwise show `Needs attention`, `Not assessed`, `Unavailable` or an equivalent explanation. Links to Farm Intelligence. Never default to 92/100.
2. **Fields tracked.** Count actual saved field entities and optionally how many need attention. Links to My Farms filtered to these fields; do not count crop stages as fields.
3. **Active plan/current crop.** Show only a farmer-confirmed/current active plan; e.g. crop plus `Season 2 of 4`. If no plan, show `No active rotation` and `Create plan`. Keep Year and agricultural Season distinct.
4. **Next action.** The highest-priority open task with due window, or a quiet `No urgent action`. Links to Calendar & Actions with the task selected.

If a metric cannot be computed, retain the layout but show a direct reason/next step. Missing data is not zero. A suggested rotation is not automatically an active/planted rotation.

### 22.5 Primary Home grid

At desktop use an 8/4 column split for the first content row; at 1024 px switch to 7/5 or stack; on mobile stack in the order below. The first row should fit the selected farm's weather and most important actions without feeling cramped.

**A. Current Conditions / Weather card (wide left panel).** Use the WeatherWise reference's dark, cinematic, layered feel, but adapt it to agricultural conditions. A subtle farm/sky photo or atmospheric weather scene can sit behind the right half of the panel with a dark scrim. Do not use an unrelated dramatic storm photo as the main focal point. The card header says `Current conditions`, identifies the selected farm/field and displays a source/freshness string with a `Details` link. Main temperature is 42–56 px on desktop and smaller responsively; weather condition and high/low pills sit together. Supporting metrics are limited to values actually provided (e.g., humidity, wind, recent rain). Use a compact 5-day forecast strip with day, icon, high/low; a thin curve is optional only if it communicates a clear trend.

Current conditions, short-range forecast and historical climate baseline are separate data types. A forecast provider such as a properly integrated Open-Meteo endpoint supplies forecast fields; NASA POWER may supply historical/climatological context, not a live local forecast. Label the actual source and the observation/retrieval time. Do not call satellite data real-time weather. If a value is missing, show `Unavailable` and why, not 0. A stale last-known response remains visible only with an explicit stale timestamp.

Interactions: `Details` opens Weather & Climate for the same farm/field; choosing a day opens the date in Calendar or a weather detail state, but never changes planting dates; clicking precipitation opens Water Intelligence only when source/time window matches. No farm location → `Add a location`; provider error → preserve last valid response with stale notice and retry. A source failure must not blank other Home modules.

**B. Priority Actions and Alerts (right panel).** Show title, count of active items, up to 3 ranked action rows and `View all`. Each row has severity icon + text label, concise title, evidence-based reason, field name, due time and chevron. Priority order: critical active alert, high-priority time-sensitive action, medium-risk action, routine task. Deduplicate by stable action/alert ID; the Home row and notification drawer must represent the same record. Click opens a detail drawer containing evidence, exact dates, recommendation, what it means, source timestamp and allowed actions (`Mark complete`, `Snooze`, `Dismiss alert`, `Open field`). Completing a task does not resolve the alert automatically. Dismissing an alert does not imply that the underlying condition is fixed. Empty state: `No urgent actions right now`, in a compact quiet surface, not a giant blank panel.

**C. Water Intelligence preview — Advanced only on Home.** Simple mode shows one clear sentence in the farm status summary; full Water Intelligence is still available deeper in the site. Advanced preview contains heading + `View details`; crop water demand with time unit and current crop stage; rainfall input and source; recorded irrigation (only if logged); concise demand-versus-supply chart; balance statement where supported; a `Calculation details` disclosure. Separate root-zone from surface moisture and distinguish observed, modelled, forecast and farmer-entered inputs. A stored irrigation routine is not proof of actual watering. If FAO-56 ET₀ is named, implement the actual required-input method; otherwise label a simplified proxy honestly. Water-balance terms, sign convention, units, crop coefficient and assumptions must be inspectable. Clicking opens the complete detail while preserving field/date selection; reuse the shared query/cache rather than launching duplicate fetches.

**D. Soil Intelligence preview — Advanced only on Home.** Heading + `View details`; soil texture and source type; actual pH/organic carbon/organic matter/salinity values only if available; texture composition chart only if valid compatible sand/silt/clay fractions exist; comparable moisture trend only when a real comparable time series exists; short status such as `Stable`, `Needs investigation` or `Not enough history` based on documented rules. Include a concise note that gridded/regional soil properties are not equivalent to a laboratory sample from the field. Unknown values show `Not available` and `Add soil measurement`, never an artificial gauge.

**E. Active crop rotation at a glance.** Show a clean, wide sequence of realistic crop photo tiles connected by subdued arrows. Header states `Active crop rotation`, plan name/status and `Open full plan`. Each tile includes separate Year and Season labels, crop name/family if supported, planned versus actual date window, duration in days only when dates/model support it, and current-stage highlight with text (not just color). On hover show details; touch users have a clear info button. Every crop occurrence has stable farm/field/rotation/occurrence IDs. Clicking opens exactly that occurrence in Rotation Planner/detail. If the same crop appears twice or across farms, it must not navigate based on crop name alone. No plan → show `Create plan`, no empty sequence.

**F. What changed since your last check?** Render only when meaningful, comparable history exists. Each change includes what changed, magnitude/unit/period, comparison baseline/source, whether observed/modelled/forecast, why it matters, a significance rule and click-through to evidence. Don't promote a data retrieval timestamp change as a meaningful farm change. Do not numerically compare incompatible source/model versions; say `Not directly comparable` or recalculate under one version.

**G. Recent seasonal insights.** Optional row with 2–3 valid insights such as vegetation observation trend, weather anomaly, upcoming planting window or review due. A vegetation index module only exists when a real optical vegetation product/connector supplied valid observations. Rainfall-based NDVI proxies must never be called NDVI. Link a vegetation insight to Map with the right field/layer/date selected.

Do not put everything on Home. The Simple view should expose four-ish main groupings plus contextual summaries; Advanced mode adds depth through inline sections and disclosures, not by creating dozens of cards.

## 23. Home modes

The Simple/Advanced toggle lives in Settings/global quick access and persists. It changes display depth only. It must not change calculations, source selection, weights, alert thresholds or saved results.

**Simple:** hero, selector, farm status, weather, current crop/rotation, simple water and soil sentences, top actions, meaningful changes and clear plan/assessment actions. No dense formula tables, raw satellite listings or excessive plots. Users can still tap any important score/value to open its definition/source.

**Advanced:** all Simple content plus Water Intelligence and Soil Intelligence previews, more weather metrics when supported, detailed timestamps, data coverage/confidence, per-field indicators, trends, sources and compact technical disclosures. Keep full datasets on detail pages.

Changing mode must preserve active farm/field, date range, drafts and selected view. It does not trigger recalculation. If the detailed mode needs extra data, load only that module and keep the summary stable.

## 24. Home state machine and backend contracts

Implement explicit UI states: (1) first run/no farm; (2) saved but not analysed; (3) normal current data; (4) partial data; (5) stale report; (6) refresh in progress; (7) refresh complete; (8) refresh failed; (9) no rotation; (10) no actions; (11) active critical alert; (12) farm switched during request; (13) deleted/invalid farm ID; (14) persistence quota/error. Each has tailored copy and a recovery action.

A new user should not receive pre-seeded demo farms presented as their own. A demo workspace, if retained, must be an explicit choice, visibly tagged as demo and isolated from real records. On farm switch, cancel obsolete requests where possible and ignore any response whose farm ID no longer matches. On storage error, don't show `Saved`; allow retry/export where safe.

Use shared typed services for farm list, summary, weather/forecast, field list, changes and action list. Exact endpoint names can differ, but contracts must include stable IDs, source/time metadata and typed error states. Keep the canonical farm record local-first unless the user expressly enables account sync; remote scheduled analysis has its own explicit consent flow.

### 24.1 Status and score rules

One canonical `StatusEvaluation` produces status, severity, rule IDs and affected scope. UI components must not independently invent status. Use the highest credible active severity so a bad field cannot be averaged away. If evidence is stale or insufficient, show `Unknown`/`Needs review`, not `Good` by default.

A farm health score must use a documented, tested method. If field scores are comparable, an area-weighted aggregation may use `H_farm = sum(A_i * H_i) / sum(A_i)` over eligible scored area only; show that area's share of total mapped area. Do not include unassessed area as 0 or 100. If no validated health model exists, do not display a numerical score; use status and evidence coverage. Health, suitability and confidence are separate concepts.

Next-action sort: severity/mandatory priority, due-date urgency, relevance to crop stage, then acknowledgement/snooze state. A completed task leaves the open queue but remains in history.

What-changed comparisons require matching units, compatible windows, source semantics and model versions. `delta = current - previous` is displayed numerically only when both values are comparable. Show baseline and units; otherwise explain the mismatch.

## 25. Home acceptance tests

Test at 1440×900, 1366×768, 1024×768, 768×1024, 390×844 and 320×700. Confirm no overlap, overflow or illegible text. Confirm hero contrast on actual image. Keyboard users can use selector and every link. Reduced motion stops ambience and chart entrance. Switching farm while weather is loading never shows old farm data. Source failure never creates a zero or fake alert. Stale analyses are clearly marked on Home and Farm Detail. A crop click opens the correct field/rotation occurrence. First run has no fake real farm.

---

<!-- SOURCE LINES 3887-3993 END -->
