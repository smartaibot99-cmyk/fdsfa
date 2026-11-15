export interface GibsLayerConfig {
  id: string;
  label: string;
  description: string;
  tileUrl: string;
  attribution: string;
  maxZoom: number;
  opacity: number;
}

function getRecentGibsDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 2);
  return d.toISOString().slice(0, 10);
}

export function getGibsLayers(): GibsLayerConfig[] {
  const date = getRecentGibsDate();
  return [
    {
      id: 'modis_true_color',
      label: 'NASA MODIS True Color',
      description: 'Terra MODIS Corrected Reflectance satellite mosaic',
      tileUrl: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
      attribution: 'NASA GIBS / Terra MODIS',
      maxZoom: 9,
      opacity: 0.88,
    },
    {
      id: 'viirs_true_color',
      label: 'NASA VIIRS True Color',
      description: 'Suomi NPP VIIRS daily true-color imagery',
      tileUrl: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
      attribution: 'NASA GIBS / Suomi NPP VIIRS',
      maxZoom: 9,
      opacity: 0.88,
    },
    {
      id: 'imerg_precip',
      label: 'NASA GPM Precipitation',
      description: 'GPM IMERG global precipitation rate overlay',
      tileUrl: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/${date}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
      attribution: 'NASA GIBS / GPM IMERG',
      maxZoom: 6,
      opacity: 0.65,
    },
    {
      id: 'osm_base',
      label: 'OpenStreetMap Base',
      description: 'Clean terrain & road reference map',
      tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
      opacity: 1,
    },
  ];
}
