import React, { useEffect, useState } from 'react';
import { ExternalLink, Leaf, RefreshCw, Search } from 'lucide-react';
import { CmrDataset, DonkiEvent, NasaImageItem, NeoSummary } from '../types';
import { searchCmrDatasets } from '../services/cmr';
import { fetchNeowsSummary } from '../services/neows';
import { fetchDonkiNotifications } from '../services/donki';
import { searchNasaImages } from '../services/imageLibrary';
import { useMode } from '../context/ModeContext';
import { DataBadge } from '../components/DataBadge';
import { ErrorCard } from '../components/ErrorCard';
import { SkeletonBlock } from '../components/Skeleton';

const CORE_SOURCES = [
  {
    name: 'NASA POWER Daily Point Climatology',
    dataset: 'MERRA-2 & CERES Solar / Agroclimatology',
    endpoint: 'https://power.larc.nasa.gov/api/temporal/daily/point',
    role: 'Primary 20+ year historical temperature, precipitation, 10m wind, humidity, and solar radiation.',
    link: 'https://power.larc.nasa.gov/',
  },
  {
    name: 'NASA EONET v3',
    dataset: 'Earth Observatory Natural Event Tracker',
    endpoint: 'https://eonet.gsfc.nasa.gov/api/v3/events',
    role: 'Active wildfires, severe storms, floods, and volcanic hazards within 300 km.',
    link: 'https://eonet.gsfc.nasa.gov/',
  },
  {
    name: 'NASA GIBS WMTS',
    dataset: 'Global Imagery Browse Services (MODIS, VIIRS, GPM IMERG)',
    endpoint: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/',
    role: 'True-color satellite base maps, precipitation overlays, and Blue/Black Marble textures.',
    link: 'https://nasa-gibs.github.io/gibs-api-docs/',
  },
  {
    name: 'NASA APOD, NeoWs & DONKI',
    dataset: 'NASA Open APIs Gateway',
    endpoint: 'https://api.nasa.gov',
    role: 'Astronomy Picture of the Day, Near-Earth Object tracking, and space weather notifications.',
    link: 'https://api.nasa.gov/',
  },
  {
    name: 'NASA Earthdata CMR & Image Library',
    dataset: 'Common Metadata Repository + images-api.nasa.gov',
    endpoint: 'https://cmr.earthdata.nasa.gov/search/collections.json',
    role: 'Live dataset catalog discovery and archival Earth observation photography.',
    link: 'https://cmr.earthdata.nasa.gov/search/',
  },
  {
    name: 'CelesTrak GP + SGP4 Orbital Propagation',
    dataset: 'Two-Line / OMM Orbital Elements (satellite.js)',
    endpoint: 'https://celestrak.org/NORAD/elements/gp.php',
    role: 'Real-time orbital positions for ISS, Terra, Aqua, Aura, Suomi NPP, NOAA-20, Landsat 8/9, GPM, SMAP, and ICESat-2.',
    link: 'https://celestrak.org/',
  },
  {
    name: 'OpenStreetMap Nominatim',
    dataset: 'OpenStreetMap Geocoder',
    endpoint: 'https://nominatim.openstreetmap.org/search',
    role: 'Place name search and reverse-geocoding for globe clicks (debounced & throttled to 1 req/s).',
    link: 'https://nominatim.org/',
  },
];

export const DataSources: React.FC = () => {
  const { isPlantMode } = useMode();
  const [cmrQuery, setCmrQuery] = useState('POWER MODIS GPM');
  const [cmrList, setCmrList] = useState<CmrDataset[]>([]);
  const [cmrLoading, setCmrLoading] = useState(true);
  const [cmrError, setCmrError] = useState<string | null>(null);

  const [neows, setNeows] = useState<NeoSummary | null>(null);
  const [donki, setDonki] = useState<DonkiEvent[]>([]);
  const [images, setImages] = useState<NasaImageItem[]>([]);
  const [auxError, setAuxError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  const loadCmr = async (kw: string = cmrQuery) => {
    setCmrLoading(true);
    setCmrError(null);
    try {
      const res = await searchCmrDatasets(kw);
      setCmrList(res);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setCmrError(err instanceof Error ? err.message : 'CMR search failed');
    } finally {
      setCmrLoading(false);
    }
  };

  const loadAux = async () => {
    setAuxError(null);
    const [neoRes, donkiRes, imgRes] = await Promise.allSettled([
      fetchNeowsSummary(),
      fetchDonkiNotifications(),
      searchNasaImages('Earth observation satellite'),
    ]);

    if (neoRes.status === 'fulfilled') setNeows(neoRes.value);
    if (donkiRes.status === 'fulfilled') setDonki(donkiRes.value);
    if (imgRes.status === 'fulfilled') setImages(imgRes.value.slice(0, 4));
    if (
      neoRes.status === 'rejected' &&
      donkiRes.status === 'rejected' &&
      imgRes.status === 'rejected'
    ) {
      setAuxError('Some NASA auxiliary feeds could not be reached right now.');
    }
  };

  useEffect(() => {
    loadCmr();
    loadAux();
  }, []);

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-8 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text-primary)] inline-flex items-center gap-2">
            {isPlantMode && <Leaf className="w-6 h-6 text-[var(--accent)]" aria-hidden="true" />}
            <span>NASA Data Sources & Provenance</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Every metric in Anchor is traceable to a named NASA Earth-observation API or open scientific catalog. Last verified{' '}
            <span className="font-mono">{new Date(lastUpdated).toLocaleTimeString()}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            loadCmr();
            loadAux();
          }}
          className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent)] cursor-pointer shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Live Feeds</span>
        </button>
      </div>

      {/* Core Datasets Table */}
      <div className="anchor-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                <th className="py-3.5 px-5 font-semibold">Source</th>
                <th className="py-3.5 px-5 font-semibold">Role in Anchor</th>
                <th className="py-3.5 px-5 font-semibold">Endpoint</th>
                <th className="py-3.5 px-5 font-semibold text-right">Docs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {CORE_SOURCES.map((src) => (
                <tr key={src.name} className="hover:bg-[var(--bg-elevated)]/50">
                  <td className="py-4 px-5 align-top">
                    <div className="font-semibold text-[var(--text-primary)]">{src.name}</div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{src.dataset}</div>
                  </td>
                  <td className="py-4 px-5 align-top text-[var(--text-secondary)] max-w-md">
                    {src.role}
                  </td>
                  <td className="py-4 px-5 align-top font-mono text-[11px] text-[var(--teal)] break-all">
                    {src.endpoint}
                  </td>
                  <td className="py-4 px-5 align-top text-right">
                    <a
                      href={src.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline whitespace-nowrap"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Space Weather & NEO Telemetry (DONKI + NeoWs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="anchor-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
              {isPlantMode && <Leaf className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />}
              <span>Near-Earth Objects Today</span>
            </h2>
            <DataBadge dataset="NASA NeoWs" />
          </div>
          {neows ? (
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3.5">
                <div className="text-[var(--text-secondary)]">Tracked Today</div>
                <div className="font-mono text-2xl font-bold text-[var(--text-primary)] mt-1">
                  {neows.elementCount}
                </div>
              </div>
              <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3.5">
                <div className="text-[var(--text-secondary)]">Potentially Hazardous</div>
                <div className="font-mono text-2xl font-bold text-[var(--text-primary)] mt-1">
                  {neows.hazardousCount}
                </div>
              </div>
              {neows.closestApproachName && (
                <div className="col-span-2 text-[var(--text-secondary)] font-mono text-[11px]">
                  Closest pass: {neows.closestApproachName} ({neows.closestDistanceKm?.toLocaleString()} km)
                </div>
              )}
            </div>
          ) : (
            <SkeletonBlock className="h-24 w-full" />
          )}
        </div>

        <div className="anchor-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
              {isPlantMode && <Leaf className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />}
              <span>Space Weather Notifications (DONKI)</span>
            </h2>
            <DataBadge dataset="NASA DONKI" />
          </div>
          {auxError && <ErrorCard title="Space weather unavailable" message={auxError} onRetry={loadAux} />}
          {donki.length > 0 ? (
            <ul className="divide-y divide-[var(--border)] text-xs">
              {donki.slice(0, 3).map((d) => (
                <li key={d.messageID} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-mono font-semibold text-[var(--teal)]">{d.messageType}</span>
                    <span className="text-[var(--text-secondary)] ml-2">
                      {new Date(d.messageIssueTime).toLocaleDateString()}
                    </span>
                  </div>
                  <a
                    href={d.messageURL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline shrink-0"
                  >
                    Bulletin →
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            !auxError && <SkeletonBlock className="h-24 w-full" />
          )}
        </div>
      </div>

      {/* Earthdata CMR Search */}
      <div className="anchor-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-display font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
              {isPlantMode && <Leaf className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />}
              <span>NASA Earthdata CMR Collection Catalog</span>
            </h2>
            <DataBadge dataset="NASA CMR Search API" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadCmr(cmrQuery);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={cmrQuery}
                onChange={(e) => setCmrQuery(e.target.value)}
                placeholder="Search Earthdata CMR..."
                className="min-h-[38px] pl-8 pr-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)]"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 min-h-[38px] rounded-xl bg-[var(--accent)] text-white text-xs font-medium cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>

        {cmrLoading && <SkeletonBlock className="h-32 w-full" />}
        {cmrError && <ErrorCard title="CMR lookup failed" message={cmrError} onRetry={() => loadCmr()} />}
        {!cmrLoading && !cmrError && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cmrList.slice(0, 6).map((ds) => (
              <div
                key={ds.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-1.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">{ds.title}</span>
                  <span className="font-mono text-[10px] text-[var(--teal)] shrink-0">
                    {ds.shortName}
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] line-clamp-2">{ds.summary}</p>
                {ds.links[0] && (
                  <a
                    href={ds.links[0].href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline pt-1"
                  >
                    <span>Dataset Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NASA Image Library Strip */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-semibold text-[var(--text-primary)]">
              NASA Earth Observation Archive Imagery
            </h2>
            <DataBadge dataset="NASA Image & Video Library" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {images.map((img) => (
              <div key={img.nasaId} className="anchor-card overflow-hidden">
                <img
                  src={img.thumbnailUrl}
                  alt={img.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-40 object-cover"
                />
                <div className="p-3.5 space-y-1">
                  <h3 className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1">
                    {img.title}
                  </h3>
                  <p className="text-[11px] font-mono text-[var(--text-secondary)]">
                    {img.nasaId} {img.center ? `· ${img.center}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
