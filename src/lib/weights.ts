import { ActivityPreset, ActivityPresetId, FactorKey, FactorWeights } from '../types';

export const FACTOR_KEYS: FactorKey[] = [
  'rain',
  'heat',
  'cold',
  'wind',
  'hazard',
  'variability',
];

export const FACTOR_LABELS: Record<FactorKey, string> = {
  rain: 'Rain Risk',
  heat: 'Heat Risk',
  cold: 'Cold Risk',
  wind: 'Wind Risk',
  hazard: 'Hazard Proximity',
  variability: 'Historical Variability',
};

export const ACTIVITY_PRESETS: Record<ActivityPresetId, ActivityPreset> = {
  outdoor_event: {
    id: 'outdoor_event',
    label: 'Outdoor event',
    description: 'Festivals, weddings, markets, and community gatherings requiring dry, comfortable weather.',
    heatThresholdC: 32,
    windThresholdMs: 10,
    rainThresholdMm: 5,
    coldThresholdC: 4,
    defaultWeights: {
      rain: 0.30,
      heat: 0.18,
      cold: 0.10,
      wind: 0.18,
      hazard: 0.14,
      variability: 0.10,
    },
  },
  farming: {
    id: 'farming',
    label: 'Farming / planting',
    description: 'Field operations, seeding, and spraying sensitive to frost, drought extremes, and high winds.',
    heatThresholdC: 34,
    windThresholdMs: 9,
    rainThresholdMm: 10,
    coldThresholdC: 2,
    defaultWeights: {
      rain: 0.20,
      heat: 0.22,
      cold: 0.22,
      wind: 0.12,
      hazard: 0.12,
      variability: 0.12,
    },
  },
  hiking: {
    id: 'hiking',
    label: 'Hiking & travel',
    description: 'Backcountry trails, road trips, and mountain routes where wind, storms, and nearby hazards matter.',
    heatThresholdC: 31,
    windThresholdMs: 11,
    rainThresholdMm: 5,
    coldThresholdC: 2,
    defaultWeights: {
      rain: 0.22,
      heat: 0.18,
      cold: 0.15,
      wind: 0.18,
      hazard: 0.19,
      variability: 0.08,
    },
  },
  school_sports: {
    id: 'school_sports',
    label: 'School sports',
    description: 'Youth tournaments and track days with strict heat safety and lightning/storm margins.',
    heatThresholdC: 30,
    windThresholdMs: 10,
    rainThresholdMm: 4,
    coldThresholdC: 5,
    defaultWeights: {
      rain: 0.26,
      heat: 0.28,
      cold: 0.10,
      wind: 0.14,
      hazard: 0.14,
      variability: 0.08,
    },
  },
  construction: {
    id: 'construction',
    label: 'Construction work',
    description: 'Cranes, roofing, concrete pours, and outdoor crews sensitive to wind gusts, heavy rain, and heat.',
    heatThresholdC: 33,
    windThresholdMs: 10,
    rainThresholdMm: 6,
    coldThresholdC: 2,
    defaultWeights: {
      rain: 0.22,
      heat: 0.20,
      cold: 0.12,
      wind: 0.26,
      hazard: 0.12,
      variability: 0.08,
    },
  },
};

export const ACTIVITY_LIST: ActivityPreset[] = Object.values(ACTIVITY_PRESETS);

export function normalizeWeights(weights: FactorWeights): FactorWeights {
  const sum = FACTOR_KEYS.reduce((acc, key) => acc + Math.max(0, weights[key] || 0), 0);
  if (sum <= 0) {
    const equal = 1 / FACTOR_KEYS.length;
    return {
      rain: equal,
      heat: equal,
      cold: equal,
      wind: equal,
      hazard: equal,
      variability: equal,
    };
  }
  const normalized = {} as FactorWeights;
  for (const key of FACTOR_KEYS) {
    normalized[key] = Math.max(0, weights[key] || 0) / sum;
  }
  return normalized;
}
