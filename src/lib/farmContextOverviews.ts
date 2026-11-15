import { findCropCatalogItem, getCropDisplayName } from '../data/farmCropCatalog';
import { FarmProfile } from '../types';
import { formatSoilMoistureUnit, getWaterQualityState } from './farmStorage';

export interface ContextualOverview {
  title: string;
  body: string;
  provenanceNote: string;
}

export function getStage1LocationOverview(profile: FarmProfile): ContextualOverview {
  const hasCoords = profile.location.lat !== null && profile.location.lon !== null;
  const label = profile.location.locationLabel || profile.location.regionOrAddress;

  if (hasCoords) {
    return {
      title: 'Regional climate lookup ready',
      body: `Coordinates (${profile.location.lat!.toFixed(3)}°, ${profile.location.lon!.toFixed(3)}°) allow Anchor to match your farm with 20+ years of NASA POWER historical temperature, rainfall, humidity, and solar irradiance data plus nearby NASA EONET hazard alerts. Regional satellite grid cells cover broad areas and do not replace on-farm microclimate readings.`,
      provenanceNote: 'Farmer-provided location · Enables NASA regional context',
    };
  }
  if (label.trim()) {
    return {
      title: 'Manual location recorded',
      body: `Anchor saved "${label}" as a reported location. Without latitude and longitude coordinates, Anchor cannot pull NASA POWER climate history or EONET hazard proximity for this field, so climate suitability will note missing regional data.`,
      provenanceNote: 'Reported text location · Coordinates optional for satellite data',
    };
  }
  return {
    title: 'Why location matters',
    body: 'Farm location anchors seasonal day-length, historical rainfall timing, frost/heat likelihood, and nearby natural hazards. You can search for a town, click the map, use GPS, or enter a region name manually.',
    provenanceNote: 'General agricultural guidance · Awaiting location input',
  };
}

export function getStage1AreaOverview(profile: FarmProfile): ContextualOverview {
  const val = profile.areaValue;
  const unit = profile.areaUnit;
  if (val === null || val <= 0) {
    return {
      title: 'How farm size informs planning',
      body: 'Total cultivated area helps frame irrigation scheduling logistics, equipment scale, and multi-block crop rotation. Anchor will not estimate water volume from area alone without knowing your crops, soil texture, and watering system.',
      provenanceNote: 'General agricultural guidance · Area not yet entered',
    };
  }

  const hectares = unit === 'acres' ? val * 0.4047 : val;
  if (hectares < 2) {
    return {
      title: 'Smallholder / intensive plot scale',
      body: `At ${val} ${unit}, hand-managed or targeted drip zones and raised beds are practical to monitor closely. Crop diversity across small beds can help break pest cycles, while total water consumption still depends on crop water demand, soil retention, and local evaporation.`,
      provenanceNote: 'Reported farm area · General scale context',
    };
  }
  if (hectares <= 25) {
    return {
      title: 'Small-to-medium farm scale',
      body: `At ${val} ${unit}, dividing the land into 2–4 rotation blocks lets you alternate high-demand crops with soil-building legumes or cover crops. Irrigation flow capacity and delivery uniformity become more critical as field length grows.`,
      provenanceNote: 'Reported farm area · General scale context',
    };
  }
  return {
    title: 'Commercial / multi-field scale',
    body: `At ${val} ${unit}, variation in soil texture, slope drainage, and water pressure across sub-fields is common. Zone-by-zone soil testing and block-level irrigation scheduling are advisable rather than treating the whole farm as uniform.`,
    provenanceNote: 'Reported farm area · General scale context',
  };
}

export function getSoilTextureOverview(profile: FarmProfile): ContextualOverview {
  const t = profile.soil.texture;
  const map: Record<string, string> = {
    Sandy:
      'Sandy soils generally drain quickly and retain less water and dissolved nutrients than clay-rich soils. Irrigation may need to be lighter and more frequent depending on the crop and local conditions.',
    'Loamy sand':
      'Loamy sand warms quickly in spring and drains fast, offering easy root penetration, though moisture and soluble nitrogen can leach below shallow roots after heavy rain or irrigation.',
    'Sandy loam':
      'Sandy loam typically balances good aeration and drainage with moderate water-holding capacity, making it workable across many vegetables, grains, and root crops.',
    Loam:
      'Loam generally offers balanced proportions of sand, silt, and clay, supporting reliable aeration, nutrient holding, and moderate moisture retention for most field crops.',
    'Silt loam':
      'Silt loam holds plant-available water well and is often fertile, though surface crusting or compaction can occur if tilled when wet.',
    'Clay loam':
      'Clay loam retains water and nutrients strongly, which can buffer dry spells, though slow infiltration during intense rain requires careful drainage observation.',
    Clay:
      'Clay soils generally retain more water and may drain slowly. Monitor drainage and avoid assuming that frequent irrigation is necessary, as saturated roots can suffer oxygen stress.',
    Unknown:
      'Soil texture is marked Unknown. A simple jar-settling test or laboratory particle-size analysis can clarify infiltration speed and moisture retention before setting irrigation intervals.',
  };

  if (!t) {
    return {
      title: 'Soil texture characteristics',
      body: 'Select the texture that best describes your topsoil. Anchor displays general soil behaviour only—not measured farm-specific lab results.',
      provenanceNote: 'General soil characteristics (not farm-specific measurements)',
    };
  }

  return {
    title: `${t} — general characteristics`,
    body: map[t],
    provenanceNote: 'General soil characteristics (not measured farm-specific results)',
  };
}

export function getSoilMoistureOverview(profile: FarmProfile): ContextualOverview {
  const { moistureStatus, moisturePct, moistureMethod, moistureUnit, moistureDepth, texture } = profile.soil;
  if (moistureStatus === 'unknown' || moisturePct === null) {
    return {
      title: 'Soil moisture unmeasured',
      body: 'Soil moisture is currently Unknown / Not measured. Anchor will not assume whether the root zone is dry or wet without a field reading or local rainfall/irrigation context.',
      provenanceNote: 'Unknown · No moisture value recorded',
    };
  }

  const label = moistureStatus === 'measured' ? 'Measured' : 'Estimated';
  const unitLabel = formatSoilMoistureUnit(moistureUnit);
  const hasUnit = Boolean(unitLabel);
  const hasMethod = Boolean(moistureMethod.trim());
  const hasDepth = Boolean(moistureDepth?.trim());
  const hasTexture = Boolean(texture && texture !== 'Unknown');

  const details: string[] = [];
  if (hasUnit) details.push(unitLabel);
  if (hasMethod) details.push(moistureMethod.trim());
  if (hasDepth) details.push(`depth ${moistureDepth!.trim()}`);
  const contextNote = details.length > 0 ? ` (${details.join(', ')})` : '';

  const missing: string[] = [];
  if (!hasUnit) missing.push('measurement unit/basis (% VWC vs. gravimetric vs. % available water)');
  if (!hasMethod) missing.push('measurement method');
  if (!hasDepth) missing.push('sampling depth');
  if (!hasTexture) missing.push('soil texture');

  if (missing.length > 0 || moistureStatus === 'estimated') {
    return {
      title: `Reported soil moisture: ${moisturePct}% — interpretation uncertain`,
      body: `A ${label.toLowerCase()} reading of ${moisturePct}%${contextNote} cannot be reliably classified as dry, moderate, or wet without ${missing.length > 0 ? missing.join(', ') : 'instrument verification and soil water-retention curves'}. Different soil textures and measurement bases have very different field-capacity and wilting-point percentages.`,
      provenanceNote: `${label} value · Interpretation uncertain without full measurement context`,
    };
  }

  return {
    title: `Measured soil moisture: ${moisturePct}% (${unitLabel})`,
    body: `Recorded ${moisturePct}% (${details.join(', ')}) on ${texture} soil. Anchor does not apply a universal dry/moderate/wet cutoff; compare this figure against your local soil water-retention curve (field capacity and permanent wilting point) and active crop rooting depth.`,
    provenanceNote: `${label} value · Compare against soil-specific retention thresholds`,
  };
}

export function getSoilPhOverview(profile: FarmProfile): ContextualOverview {
  const { phStatus, phValue } = profile.soil;
  if (phStatus === 'not_tested' || phValue === null) {
    return {
      title: 'Soil pH not tested',
      body: 'Soil pH is currently untested. In general soil chemistry, overly acidic or alkaline soil can reduce availability of nutrients such as phosphorus, calcium, or iron. A soil lab test (including buffer pH) is needed before applying lime or sulfur.',
      provenanceNote: 'Unknown · Laboratory or field test recommended',
    };
  }

  if (phValue < 5.8) {
    return {
      title: `Acidic soil range (pH ${phValue.toFixed(1)})`,
      body: `A tested pH of ${phValue.toFixed(1)} falls in the acidic range (< 5.8) under general soil-chemistry guidance, where availability of phosphorus, calcium, magnesium, and legume nodulation can decline. A soil lab buffer-pH test is needed before sizing agricultural lime.`,
      provenanceNote: 'Farmer-reported test result · General soil-chemistry guidance (not crop-specific)',
    };
  }
  if (phValue <= 7.5) {
    return {
      title: `Broadly favorable pH window (pH ${phValue.toFixed(1)})`,
      body: `A tested pH of ${phValue.toFixed(1)} falls within the general 5.8–7.5 soil-chemistry window where macronutrients and micronutrients are broadly available for many crops, though individual crop species and cultivars still vary.`,
      provenanceNote: 'Farmer-reported test result · General soil-chemistry guidance (not crop-specific)',
    };
  }
  return {
    title: `Alkaline soil range (pH ${phValue.toFixed(1)})`,
    body: `A tested pH of ${phValue.toFixed(1)} falls in the alkaline range (> 7.5) under general soil-chemistry guidance, where iron, zinc, manganese, and phosphorus availability can decrease. Verify crop tolerance with local extension guidance before amending.`,
    provenanceNote: 'Farmer-reported test result · General soil-chemistry guidance (not crop-specific)',
  };
}

export function getDrainageOverview(profile: FarmProfile): ContextualOverview {
  const d = profile.soil.drainage;
  if (!d || d === 'Unknown') {
    return {
      title: 'Field drainage behavior',
      body: 'Knowing how fast water clears after heavy rain helps distinguish waterlogging risk from rapid drying. Observation after a heavy rain or a simple percolation hole test can clarify this.',
      provenanceNote: d === 'Unknown' ? 'Unknown · Field observation helpful' : 'General agricultural guidance',
    };
  }
  if (d === 'Very slowly' || d === 'Slowly') {
    return {
      title: `${d} draining field`,
      body: 'Slow drainage raises the risk of waterlogging, root oxygen deprivation, and root-rot diseases after heavy rainfall or over-irrigation. Raised beds, surface drainage channels, or waterlogging-tolerant crops may be worth considering.',
      provenanceNote: 'Reported field observation · Drainage risk noted',
    };
  }
  if (d === 'Moderately') {
    return {
      title: 'Moderately draining field',
      body: 'Moderate drainage generally lets excess gravitational water escape within a day or two while leaving plant-available moisture in pore spaces—favorable for most annual and perennial crops.',
      provenanceNote: 'Reported field observation',
    };
  }
  return {
    title: `${d} draining field`,
    body: 'Rapid drainage prevents standing water and root rot, but moisture and soluble nutrients may move below the shallow root zone quickly. Mulching, organic matter, and smaller, targeted irrigation pulses can help retain moisture.',
    provenanceNote: 'Reported field observation · Rapid leaching consideration',
  };
}

export function getSoilPrepOverview(profile: FarmProfile): ContextualOverview {
  const methods = profile.soil.preparationMethods;
  if (methods.length === 0) {
    return {
      title: 'Soil preparation practices',
      body: 'Select the practices used on your field. Tillage, organic amendments, raised beds, and synthetic inputs each influence soil aggregates, water infiltration, and biological activity differently.',
      provenanceNote: 'General agricultural guidance',
    };
  }
  const notes: string[] = [];
  if (methods.includes('Ploughing / Tilling') || methods.includes('Harrowing')) {
    notes.push('Frequent deep tillage or harrowing breaks up surface weeds and loosens seedbeds short-term, but repeated disturbance can accelerate organic matter breakdown and subsoil compaction if done when wet.');
  }
  if (methods.includes('Compost / Organic fertiliser')) {
    notes.push('Compost and organic fertilisers build humus, improve water-holding capacity in sandy soils, and open pore structure in heavy clays.');
  }
  if (methods.includes('Chemical fertilisers')) {
    notes.push('Chemical fertilisers supply targeted nutrients rapidly; pairing them with soil testing and organic matter helps prevent salt buildup or nutrient runoff.');
  }
  if (methods.includes('Raised beds')) {
    notes.push('Raised beds improve root-zone drainage and warm earlier in cool seasons, reducing waterlogging pressure.');
  }
  if (methods.includes('No regular preparation')) {
    notes.push('Minimal or no-till approaches preserve undisturbed soil structure and moisture-retaining crop residues, though surface compaction or perennial weeds should be monitored.');
  }
  if (methods.includes('Other') && profile.soil.preparationOther.trim()) {
    notes.push(`Custom practice noted: "${profile.soil.preparationOther.trim()}".`);
  }
  return {
    title: 'Effect of selected practices',
    body: notes.join(' '),
    provenanceNote: 'Reported practices · General soil biology context',
  };
}

export function getWaterSourceAndAvailabilityOverview(profile: FarmProfile): ContextualOverview {
  const { sources, reliability, availableQuantityKnown, availableQuantityValue, availableQuantityUnit } = profile.water;
  const parts: string[] = [];

  if (sources.length === 0) {
    parts.push('Select one or more water sources used on your farm.');
  } else {
    parts.push(`Selected source(s): ${sources.join(', ')}. Anchor does not estimate actual water volume from the source type alone.`);
    if (sources.includes('Groundwater / Well') || sources.includes('Recycled water')) {
      parts.push('Groundwater and recycled sources can carry dissolved salts, making periodic EC/salinity checks valuable.');
    }
    if (sources.includes('Rainwater collection')) {
      parts.push('Rainwater harvesting provides low-salinity water when storage capacity matches dry-season crop demand.');
    }
  }

  if (reliability === 'Sometimes limited' || reliability === 'Frequently limited' || reliability === 'Highly unreliable') {
    parts.push('Water availability is reported as limited or unreliable. Water-efficient delivery (such as drip where suitable), drought-resilient crop selection, and mulching are key considerations.');
  } else if (reliability === 'Always available' || reliability === 'Usually available') {
    parts.push('Reliable supply supports planned scheduling, though avoiding over-irrigation still protects soil nutrients and pumping costs.');
  }

  if (availableQuantityKnown === 'Yes' && availableQuantityValue !== null) {
    parts.push(`Reported available volume: ${availableQuantityValue} ${availableQuantityUnit}.`);
  }

  return {
    title: 'Water source & reliability context',
    body: parts.join(' '),
    provenanceNote: 'Farmer-reported water inputs · Volume never assumed from source alone',
  };
}

export function getWaterQualityOverview(profile: FarmProfile): ContextualOverview {
  const { ecValue, ecUnit, salinityValue, salinityUnit } = profile.water;
  const waterState = getWaterQualityState(profile);

  if (waterState === 'not_tested') {
    return {
      title: 'Irrigation water not tested',
      body: 'You indicated irrigation water has not been tested. Unmeasured salinity, sodium, or alkalinity can gradually accumulate in root zones—especially with groundwater or recycled water.',
      provenanceNote: 'Not tested · No salinity levels assumed',
    };
  }
  if (waterState === 'unknown') {
    return {
      title: 'Water test status unknown',
      body: 'You indicated water test status is Unknown. Without knowing whether testing occurred or what EC and salinity values are present, salt sensitivity risks cannot be verified.',
      provenanceNote: 'Unknown · Testing status unconfirmed',
    };
  }
  if (waterState === 'unanswered') {
    return {
      title: 'Irrigation water quality status',
      body: 'Testing irrigation water for electrical conductivity (EC) and salinity helps confirm whether salt-sensitive crops face leaf-burn or root uptake stress.',
      provenanceNote: 'Unanswered · Select Yes, No, or Unknown',
    };
  }
  if (waterState === 'tested_results_missing') {
    return {
      title: 'Water tested — numeric results missing',
      body: 'You indicated water has been tested, but EC and salinity readings were not entered. Entering the lab values and test date allows Anchor to flag potential salt sensitivity.',
      provenanceNote: 'Tested (results missing) · Numeric readings needed',
    };
  }
  const readings: string[] = [];
  if (ecValue !== null) readings.push(`EC ${ecValue} ${ecUnit}`);
  if (salinityValue !== null) readings.push(`Salinity ${salinityValue} ${salinityUnit}`);
  return {
    title: `Recorded water quality (${readings.join(' · ')})`,
    body: 'Salinity tolerance varies across crops. Compare these readings against local extension or crop-specific salinity guides.',
    provenanceNote: 'Farmer-reported test values (with numeric readings)',
  };
}

export function getWateringMethodOverview(profile: FarmProfile): ContextualOverview {
  const wm = profile.water.wateringMethod;
  if (!wm) {
    return {
      title: 'Watering system logic',
      body: 'Choosing Rain-fed, Artificial irrigation, or Hybrid adjusts the remaining Stage 3 questions so you only answer what applies to your farm.',
      provenanceNote: 'Conditional stage routing',
    };
  }
  if (wm === 'Rain-fed agriculture') {
    return {
      title: 'Rain-fed agriculture',
      body: 'Production depends heavily on rainfall. Seasonal rainfall patterns, soil moisture conservation, and planting timing are important planning considerations.',
      provenanceNote: 'Reported system · Rainfall questions active',
    };
  }
  if (wm === 'Artificial irrigation') {
    return {
      title: 'Artificial irrigation',
      body: 'Controlled irrigation gives flexibility across dry spells, making application efficiency, system maintenance, and water quality key levers.',
      provenanceNote: 'Reported system · Irrigation questions active',
    };
  }
  return {
    title: 'Hybrid (rainfall + irrigation)',
    body: 'Combining natural rainfall with supplemental irrigation allows you to save water during wet periods while protecting crops during dry gaps.',
    provenanceNote: 'Reported system · Both rainfall & irrigation questions active',
  };
}

export function getIrrigationMethodOverview(profile: FarmProfile): ContextualOverview {
  const im = profile.water.irrigationMethod;
  const map: Record<string, string> = {
    'Drip irrigation':
      'Drip systems deliver water close to plant roots and can reduce evaporation and runoff losses when properly filtered, designed, and maintained.',
    'Sprinkler irrigation':
      'Sprinklers distribute water broadly over the canopy, though wind drift and midday evaporation can lower efficiency compared with root-zone systems; foliar humidity can also raise fungal disease risk on sensitive leaves.',
    'Flood irrigation':
      'Flood irrigation covers wide basins with low equipment complexity, but can lose water to deep percolation, uneven distribution, or waterlogging on poorly leveled land.',
    'Furrow irrigation':
      'Furrow irrigation channels water along crop rows without wetting foliage, though tailwater runoff and uneven soak between row head and tail should be watched.',
    'Manual watering':
      'Manual watering allows spot attention for small plots, though labor effort increases rapidly with farm size and uniformity can vary.',
    Other:
      'Custom irrigation setup recorded. Consider distribution uniformity and evaporation losses when scheduling applications.',
    Unknown:
      'Irrigation method is marked Unknown. Documenting how water reaches the root zone helps identify practical efficiency improvements.',
  };
  return {
    title: im ? `${im} — efficiency notes` : 'Irrigation delivery method',
    body: im ? map[im] : 'Select your primary irrigation delivery method to see distribution and efficiency considerations.',
    provenanceNote: 'General irrigation system characteristics',
  };
}

export function getIrrigationFrequencyOverview(profile: FarmProfile): ContextualOverview {
  const freq = profile.water.irrigationFrequency;
  if (!freq || freq === 'Unknown') {
    return {
      title: 'Irrigation schedule context',
      body: 'Anchor records your current irrigation timing without labeling it right or wrong—ideal intervals depend on crop rooting depth, growth stage, soil texture, and local evaporation.',
      provenanceNote: 'General guidance · Never auto-judged without crop/soil context',
    };
  }
  return {
    title: `Reported cadence: ${freq}`,
    body: `Applying water ${freq.toLowerCase()} interacts directly with soil texture and crop stage: sandy soils and shallow-rooted vegetables typically respond to shorter, lighter pulses, while deeper-rooted crops on loam or clay often use deeper, less frequent applications. Checking topsoil/root-zone moisture before irrigating helps confirm timing.`,
    provenanceNote: 'Reported schedule · Compared contextually, not labeled right/wrong',
  };
}

export function getRainfallFrequencyOverview(profile: FarmProfile): ContextualOverview {
  const rf = profile.water.rainfallFrequency;
  if (!rf || rf === 'Unknown') {
    return {
      title: 'Reported rainfall experience',
      body: 'Your experience of how often rain falls helps capture local microclimate patterns, distinct from regional NASA satellite precipitation records.',
      provenanceNote: 'Farmer experience vs. measured rainfall records',
    };
  }
  return {
    title: `Reported rainfall: ${rf}`,
    body: `You reported rainfall occurring "${rf.toLowerCase()}". Note that this reflects your on-farm observation rather than measured rain-gauge totals—frequency alone does not show storm intensity or effective root-zone infiltration.`,
    provenanceNote: 'Farmer-reported experience (distinct from measured rain records)',
  };
}

export function getCropHistoryOverview(profile: FarmProfile): ContextualOverview {
  const cycles = [
    profile.crops.previousCycle1,
    profile.crops.previousCycle2,
    profile.crops.previousCycle3,
  ];
  const populated = cycles.filter((c) => c.length > 0);
  if (populated.length === 0) {
    return {
      title: 'Why 3-cycle crop history matters',
      body: 'Recording the last three growing cycles helps Anchor spot repeated crop families, continuous heavy nutrient feeders, and opportunities to introduce legumes or different root depths. Crop history alone does not conclusively diagnose soil nutrient levels.',
      provenanceNote: 'Rotation screening · Not a substitute for soil testing',
    };
  }

  const allPrev = cycles.flat();
  const counts = new Map<string, number>();
  const families = new Map<string, number>();
  let hasLegume = false;

  for (const id of allPrev) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
    const item = findCropCatalogItem(id);
    if (item) {
      families.set(item.botanicalFamily, (families.get(item.botanicalFamily) ?? 0) + 1);
      if (item.nitrogenRole === 'fixer') hasLegume = true;
    }
  }

  const repeatedCrops = Array.from(counts.entries())
    .filter(([, n]) => n >= 2)
    .map(([id]) => getCropDisplayName(id));
  const repeatedFamilies = Array.from(families.entries())
    .filter(([, n]) => n >= 2)
    .map(([fam]) => fam);

  if (repeatedCrops.length > 0 || repeatedFamilies.length > 0) {
    return {
      title: 'Repeated planting pattern noticed',
      body: `Repeatedly growing the same crop${repeatedCrops.length ? ` (${repeatedCrops.join(', ')})` : ''} or botanical family${repeatedFamilies.length ? ` (${repeatedFamilies.join(', ')})` : ''} across recent cycles can increase certain nutrient demands and elevate pest or disease carryover. Introducing an unrelated crop family or legume may improve rotation diversity—though soil nutrient status cannot be confirmed without a soil test.`,
      provenanceNote: 'Derived from reported 3-cycle history · Not a soil lab diagnosis',
    };
  }

  return {
    title: 'Varied recent crop sequence',
    body: `Your reported history spans ${populated.length} cycle(s) with distinct crops${hasLegume ? ', including at least one nitrogen-fixing legume' : ', though no nitrogen-fixing legume was listed in these cycles'}. Rotating across botanical families helps disrupt pest and disease life cycles.`,
    provenanceNote: 'Derived from reported 3-cycle history',
  };
}

export function getPlannedCropsOverview(profile: FarmProfile): ContextualOverview {
  const planned = [...profile.crops.currentCrops, ...profile.crops.plannedCrops];
  if (planned.length === 0) {
    return {
      title: 'Current & planned crop suitability',
      body: 'Select crops currently growing or planned. Anchor evaluates potential suitability across location, NASA climate history (if coordinates are provided), soil texture/pH, water availability, and growing season—and flags any missing data clearly.',
      provenanceNote: 'Multi-factor check · Missing fields flagged explicitly',
    };
  }

  const restrictedSet = new Set(profile.crops.noRestrictions ? [] : profile.crops.restrictedCrops);
  const overlap = planned.filter((c) => restrictedSet.has(c));
  if (overlap.length > 0) {
    return {
      title: 'Overlap with restricted crops',
      body: `${overlap.map(getCropDisplayName).join(', ')} appears in both planned/current crops and your restricted list. Restricted crops will be excluded from future recommendations and rotation suggestions.`,
      provenanceNote: 'Conflict check against restricted crop list',
    };
  }

  const missingDeps: string[] = [];
  if (profile.location.lat === null || profile.location.lon === null) missingDeps.push('coordinates for local climate');
  if (!profile.soil.texture || profile.soil.texture === 'Unknown') missingDeps.push('soil texture');
  if (profile.soil.phStatus === 'not_tested') missingDeps.push('soil pH test');
  if (!profile.water.reliability || profile.water.reliability === 'Unknown') missingDeps.push('water reliability');

  return {
    title: `${planned.length} crop(s) selected for review`,
    body:
      missingDeps.length > 0
        ? `Anchor will assess general compatibility for ${planned.map(getCropDisplayName).slice(0, 4).join(', ')}${planned.length > 4 ? '…' : ''}, while noting that missing ${missingDeps.join(', ')} limits farm-specific certainty.`
        : `Anchor has location, soil, and water inputs ready to cross-check suitability for ${planned.map(getCropDisplayName).slice(0, 4).join(', ')}${planned.length > 4 ? '…' : ''}.`,
    provenanceNote: 'Farmer selections · Checked against reported soil, water & NASA climate',
  };
}

export function getRestrictedCropsOverview(profile: FarmProfile): ContextualOverview {
  if (profile.crops.noRestrictions) {
    return {
      title: 'No crop restrictions active',
      body: 'All suitable crop families can be considered in rotation and seasonal planning recommendations.',
      provenanceNote: 'Mutually exclusive with individual crop exclusions',
    };
  }
  const count = profile.crops.restrictedCrops.length + (profile.crops.restrictedOther.trim() ? 1 : 0);
  if (count === 0) {
    return {
      title: 'Exclude crops that cannot be grown',
      body: 'Select any crops blocked by local regulations, soil-borne disease, market contracts, livestock constraints, or personal choice—or choose "No restrictions".',
      provenanceNote: 'Hard exclusion filter for Stage 5 & final report',
    };
  }
  return {
    title: `${count} crop restriction(s) enforced`,
    body: 'Selected restricted crops are strictly excluded from all crop suitability and crop rotation recommendations in your generated Farm Analysis.',
    provenanceNote: 'Enforced exclusion filter',
  };
}

export function getFertiliserOverview(profile: FarmProfile): ContextualOverview {
  const ft = profile.crops.fertiliserType;
  if (!ft || ft === 'Unknown') {
    return {
      title: 'Fertiliser management context',
      body: 'Knowing whether you rely on organic, chemical, both, or no fertilisers helps frame long-term soil fertility and organic matter planning—without assuming actual soil nutrient levels without a lab test.',
      provenanceNote: 'General nutrient management · Never infers N-P-K levels',
    };
  }
  const map: Record<string, string> = {
    'Organic fertilisers':
      'Organic inputs (compost, manure, green manures) release nutrients gradually while building soil humus and microbial life; nutrient ratios vary by source.',
    'Chemical fertilisers':
      'Synthetic fertilisers provide predictable nutrient timing; pairing them with soil tests and organic matter helps prevent leaching, acidification, or salt buildup.',
    Both:
      'Combining organic amendments with targeted mineral fertilisers supports both soil structure and timely crop nutrition when guided by soil testing.',
    Neither:
      'Without external fertilisers, crop rotations with nitrogen-fixing legumes, cover crops, and residue retention carry extra weight in sustaining productivity—verified periodically by soil testing.',
  };
  return {
    title: `Fertiliser approach: ${ft}`,
    body: `${map[ft] ?? ''} Actual nutrient reserves (N, P, K, micronutrients) cannot be known without soil testing.`,
    provenanceNote: 'Reported management · Soil test required for nutrient levels',
  };
}

export function getPlanningHorizonOverview(profile: FarmProfile): ContextualOverview {
  const h = profile.planning.horizon;
  if (!h) {
    return {
      title: 'Planning timeframe',
      body: 'Your planning horizon determines whether Anchor emphasizes immediate seasonal adjustments or multi-year crop rotation and soil-building steps.',
      provenanceNote: 'Framing for recommendations',
    };
  }
  const shortTerm = h === 'Next growing cycle' || h === 'Next season' || h === 'Next 6 months';
  return {
    title: `Horizon: ${h}`,
    body: shortTerm
      ? 'A short-term horizon focuses on immediate irrigation adjustments, seasonal planting windows, and practical next-cycle rotation shifts.'
      : 'A multi-season or multi-year horizon supports structured 3+ crop family rotations, gradual soil organic matter building, and irrigation infrastructure planning.',
    provenanceNote: 'Reported planning horizon',
  };
}

export function getPrioritiesOverview(profile: FarmProfile): ContextualOverview {
  const p = profile.planning.priorities;
  if (p.length === 0) {
    return {
      title: 'Agricultural objectives',
      body: 'Selecting your priorities orders recommendations so the most relevant water, soil, yield, cost, or resilience considerations appear first.',
      provenanceNote: 'Prioritization weight (does not alter scientific facts)',
    };
  }
  return {
    title: `Prioritising ${p.length} objective(s)`,
    body: `Recommendations will highlight ${p.slice(0, 3).join(', ')}${p.length > 3 ? ` (+${p.length - 3} more)` : ''} while clearly keeping scientific evidence and data gaps intact.`,
    provenanceNote: 'Farmer-selected priority ordering',
  };
}

export function getCyclesAndSeasonOverview(profile: FarmProfile): ContextualOverview {
  const { annualCycles, growingSeasons } = profile.planning;
  if (!annualCycles && growingSeasons.length === 0) {
    return {
      title: 'Cycles & seasonal cadence',
      body: 'Annual cropping intensity and active growing seasons shape how quickly soil organic matter turns over, when irrigation demand peaks, and how cover crops fit between main harvests.',
      provenanceNote: 'General cropping calendar guidance',
    };
  }
  const parts: string[] = [];
  if (annualCycles) {
    parts.push(
      annualCycles === '1'
        ? 'One annual cycle leaves wider off-season windows for cover crops, soil rest, or organic residue decomposition.'
        : annualCycles === '2' || annualCycles === '3' || annualCycles === '4+'
          ? `${annualCycles} cycles per year increases nutrient turnover and pest-carryover risk if crop families repeat, making planned family rotation and soil fertility monitoring especially valuable.`
          : 'Flexible cycle timing lets you align planting windows with observed rainfall onset or market windows.'
    );
  }
  if (growingSeasons.length > 0) {
    parts.push(`Active season(s): ${growingSeasons.join(', ')} — used to align heat/frost exposure and seasonal water demand.`);
  }
  return {
    title: 'Seasonal scheduling context',
    body: parts.join(' '),
    provenanceNote: 'Reported cropping schedule',
  };
}

export function getChallengesOverview(profile: FarmProfile): ContextualOverview {
  const { challenges, primaryChallenge } = profile.planning;
  if (challenges.length === 0 && !primaryChallenge) {
    return {
      title: 'Biggest agricultural challenge',
      body: 'Select all challenges affecting your farm and mark one Primary Challenge so Anchor addresses your most urgent bottleneck first.',
      provenanceNote: 'Required primary challenge prioritization',
    };
  }
  if (!primaryChallenge) {
    return {
      title: 'Select one Primary Challenge',
      body: `You selected ${challenges.length} challenge(s). Please designate one as your Primary Challenge so the analysis ranks relevant guidance appropriately.`,
      provenanceNote: 'Action required: pick 1 primary challenge',
    };
  }
  return {
    title: `Primary challenge: ${primaryChallenge}`,
    body: `Anchor will prioritize "${primaryChallenge}" across irrigation, soil, crop suitability, and conservation sections${challenges.length > 1 ? `, alongside ${challenges.length - 1} secondary challenge(s)` : ''}.`,
    provenanceNote: 'Farmer-selected primary prioritization',
  };
}
