import { ActivityPresetId, FactorWeights, PlaceSelection } from '../types';
import { ACTIVITY_PRESETS, FACTOR_KEYS } from './weights';

export interface UrlAnalysisParams {
  place?: PlaceSelection;
  targetDate?: string;
  endDate?: string;
  activityId?: ActivityPresetId;
  weights?: FactorWeights;
  demo?: boolean;
}

export function encodeAnalysisUrl(params: {
  place: PlaceSelection;
  targetDate: string;
  endDate?: string;
  activityId: ActivityPresetId;
  weights: FactorWeights;
}): string {
  const sp = new URLSearchParams();
  sp.set('name', params.place.name);
  sp.set('display', params.place.displayName);
  sp.set('lat', params.place.lat.toFixed(4));
  sp.set('lon', params.place.lon.toFixed(4));
  sp.set('date', params.targetDate);
  if (params.endDate) sp.set('end', params.endDate);
  sp.set('activity', params.activityId);
  const wStr = FACTOR_KEYS.map((k) => `${k}:${params.weights[k].toFixed(2)}`).join(',');
  sp.set('w', wStr);
  return `${window.location.origin}/analyze?${sp.toString()}`;
}

export function decodeAnalysisUrl(search: string): UrlAnalysisParams {
  const sp = new URLSearchParams(search);
  const result: UrlAnalysisParams = {};

  if (sp.get('demo') === '1') {
    result.demo = true;
  }

  const latStr = sp.get('lat');
  const lonStr = sp.get('lon');
  if (latStr !== null && lonStr !== null) {
    const lat = Number(latStr);
    const lon = Number(lonStr);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      const name = sp.get('name') || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      const displayName = sp.get('display') || name;
      result.place = { name, displayName, lat, lon };
    }
  }

  const date = sp.get('date');
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    result.targetDate = date;
  }

  const end = sp.get('end');
  if (end && /^\d{4}-\d{2}-\d{2}$/.test(end)) {
    result.endDate = end;
  }

  const act = sp.get('activity') as ActivityPresetId | null;
  if (act && act in ACTIVITY_PRESETS) {
    result.activityId = act;
  }

  const wParam = sp.get('w');
  if (wParam && result.activityId) {
    const base = { ...ACTIVITY_PRESETS[result.activityId].defaultWeights };
    for (const pair of wParam.split(',')) {
      const [k, v] = pair.split(':');
      const num = Number(v);
      if (k in base && !Number.isNaN(num)) {
        base[k as keyof FactorWeights] = num;
      }
    }
    result.weights = base;
  }

  return result;
}
