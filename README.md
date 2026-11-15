# Anchor — Ground Your Plans in NASA Earth Data

**Built for the NASA Space Apps Challenge ("Create Your Own Challenge").**
*One-line pitch: Anchor turns NASA open data into a clear, explainable decision — with a score you can trust and reasoning you can see.*

---

## The Problem

People plan outdoor events, crop planting, travel, school sports, and construction using short-range weather forecasts that only look a few days ahead and ignore active regional natural hazards. Meanwhile, NASA holds decades of free Earth-observation data (NASA POWER climatology, EONET natural events, GIBS satellite imagery, and live orbital mission telemetry), yet non-experts lack a direct way to turn raw scientific archives into a single grounded decision.

This gap matters most in regions with sparse local weather infrastructure.

## The Solution

Anchor answers one core question for any place on Earth and any target date:

> **"How safe and suitable is this place, on this date, for what I'm planning — and why?"**

1. **Interactive 3D Earth & Live Orbit Observatory (`/`)**: Full-screen WebGL globe shaded with NASA Blue Marble / Black Marble day-night terminator textures, live CelesTrak SGP4 propagation of 11 NASA/Earth-observing satellites (ISS, Terra, Aqua, Aura, Suomi NPP, Landsat 8 & 9, GPM-Core, SMAP, NOAA-20, ICESat-2), active NASA EONET v3 hazard markers, and 12 interactive 3D global crop habitats (`FarmExplorer` + `FarmScene`) driven by real solar local time and climate profiles.
2. **Explainable Anchor Score (`/analyze`)**: Combines 20+ years of historical NASA POWER daily observations for the target calendar window (±3 days) with active EONET hazards within 300 km, producing a deterministic score (`0–100`), interactive Leaflet + NASA GIBS satellite map, Recharts climatology visualizations, and a bounded Gemini AI synthesis (`±10` points max) with streamed reasoning steps and a grounded Q&A drawer.
3. **Side-by-Side Comparison (`/compare`)**: Evaluate up to 3 locations or dates side by side to identify the safest, lowest-risk option.
4. **Live Data Sources Explorer (`/data`)**: Inspect NASA Earthdata CMR dataset records, Near-Earth Objects (NeoWs), Space Weather alerts (DONKI), and NASA Image Library results.
5. **AI & Methodology Disclosure (`/about`)**: Full transparency into formulas, dataset citations, and AI boundaries.

---

## Anchor Score Formulas (Two-Stage Architecture)

### Stage 1 — Deterministic Computation (`src/lib/scoring.ts`)

Using 20+ years of NASA POWER daily records (`T2M_MAX`, `T2M_MIN`, `PRECTOTCORR`, `WS10M`, `RH2M`, `ALLSKY_SFC_SW_DWN`) filtered to `targetDate ± 3 calendar days`, Anchor computes six raw risk percentages (`0–100`, where higher = higher risk):

| Factor | NASA Dataset | Deterministic Formula |
| :--- | :--- | :--- |
| **Rain Risk** | NASA POWER (`PRECTOTCORR`) | `% of window days with precipitation > 5 mm/day` |
| **Heat Risk** | NASA POWER (`T2M_MAX`) | `% of window days with max temperature > threshold` (`32°C` default; `35°C` farming; `30°C` sports/hiking; `34°C` construction) |
| **Cold Risk** | NASA POWER (`T2M_MIN`) | `% of window days with min temperature < 2°C` |
| **Wind Risk** | NASA POWER (`WS10M`) | `% of window days with 10 m wind speed > 10 m/s` |
| **Hazard Proximity** | NASA EONET v3 | Count & proximity of open events within `300 km` in last 30 days (`0` events = `0`; `min(100, 40 + 25 * count + proximityBonus)`) |
| **Variability** | NASA POWER (multi-year σ) | Combined year-to-year standard deviation of temperature & precipitation normalized to `0–100` |

Each factor converts to suitability `(100 - risk)` and multiplies by normalized activity weights (`outdoor_event`, `farming`, `hiking`, `school_sports`, `construction`) plus optional user weight sliders so the weighted factor contributions sum strictly to `dataScore`.

### Stage 2 — Bounded AI Synthesis (`server.ts`)

- Gemini (`gemini-4-hydrogen` via `@google/genai` on the Express backend) receives **only** the computed NASA factor table, sample size, and active EONET event summaries.
- It streams structured reasoning steps via SSE (`thinkingConfig: { includeThoughts: true }`) and returns strict JSON validated by `zod`.
- Any AI score adjustment is **clamped server-side to `[-10, +10]`** around `dataScore`.
- If `GEMINI_API_KEY` is omitted or unavailable, Anchor cleanly displays the deterministic Stage 1 score with `"AI unavailable — showing data-only score."`

---

## NASA & Open Data Sources Cited

- **NASA POWER Daily Point API** — <https://power.larc.nasa.gov/>
- **NASA EONET v3** — <https://eonet.gsfc.nasa.gov/api/v3/events>
- **NASA GIBS WMTS** — <https://nasa-gibs.github.io/gibs-api-docs/>
- **NASA Open APIs (APOD, NeoWs, DONKI)** — <https://api.nasa.gov/>
- **NASA Earthdata CMR Search** — <https://cmr.earthdata.nasa.gov/search>
- **NASA Image & Video Library** — <https://images-api.nasa.gov/search>
- **CelesTrak OMM/TLE Orbital Data** — <https://celestrak.org/> (with bundled local fallback `/public/tle-fallback.json`)
- **OpenStreetMap Nominatim** — <https://nominatim.openstreetmap.org/> (debounced 800 ms, ≤ 1 req/sec)

---

## AI Usage Disclosure

- **Where Gemini is used**: Stage 2 qualitative synthesis (`summary`, `reasons`, `warnings`, `bestWindowTip`, and bounded `[-10, +10]` adjustment), streaming thinking-timeline summary, and the "Ask Anchor" / "Ask about this plant" contextual Q&A drawers.
- **What Gemini cannot do**: Gemini never fetches APIs directly, never performs primary meteorological math, and is instructed never to invent coordinates, temperatures, or hazard counts outside the supplied NASA payload.
- **Limitations**: Historical climatology reflects past 20+ year averages and climate variability—it is not a 48-hour deterministic forecast and cannot predict sudden local flash hazards or microclimate anomalies.

---

## Local Setup

### Prerequisites
- Node.js 20+ and npm

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables (optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
- `GEMINI_API_KEY`: Optional. Enables Stage 2 AI synthesis and conversational Q&A. Without it, Anchor operates in deterministic NASA data-only mode.
- `NASA_API_KEY`: Optional. Defaults to `DEMO_KEY` on the server proxy for APOD, NeoWs, and DONKI.

### 3. Run in development
```bash
npm run dev
```
The Express + Vite server runs on `http://localhost:3000`.

### 4. Production build
```bash
npm run build
npm start
```

---

## License

MIT License. Built for the NASA Space Apps Challenge. Not endorsed by NASA.
