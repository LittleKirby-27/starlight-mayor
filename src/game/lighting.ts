import type { BuildingType } from './rules.ts';

export type RetrofitType = 'shielding' | 'warm_light' | 'timer' | 'smart_dimming';

export interface LightingBuilding {
  id: string;
  type: BuildingType;
  x: number;
  z: number;
  retrofits?: RetrofitType[];
}

export interface LightingProfile {
  baseImpact: number;
  brightness: number;
  upwardRatio: number;
  colorTemperature: number;
  hours: number;
  glareRadius: number;
  disturbance: 'quiet' | 'signage' | 'traffic' | 'industrial' | 'stadium' | 'public';
}

export const RETROFIT_CONFIG: Record<RetrofitType, { name: string; shortName: string; cost: number; description: string }> = {
  shielding: { name: '加装全遮光灯罩', shortName: '遮光灯罩', cost: 90, description: '阻止灯光向天空和住户窗户泄漏。' },
  warm_light: { name: '更换暖色低蓝光灯', shortName: '暖色灯', cost: 75, description: '降低蓝光散射，同时保持必要照明。' },
  timer: { name: '设置定时熄灯', shortName: '定时熄灯', cost: 65, description: '关闭无人使用时段的多余照明。' },
  smart_dimming: { name: '安装智能调光', shortName: '智能调光', cost: 120, description: '根据人流降低亮度，兼顾安全和节能。' },
};

export const LIGHTING_PROFILES: Record<BuildingType, LightingProfile> = {
  residential: { baseImpact: 4, brightness: 48, upwardRatio: 22, colorTemperature: 4200, hours: 8, glareRadius: 3.5, disturbance: 'quiet' },
  commercial: { baseImpact: 11, brightness: 84, upwardRatio: 38, colorTemperature: 5600, hours: 13, glareRadius: 7, disturbance: 'signage' },
  industrial: { baseImpact: 13, brightness: 88, upwardRatio: 42, colorTemperature: 5200, hours: 15, glareRadius: 8, disturbance: 'industrial' },
  park: { baseImpact: 0.5, brightness: 22, upwardRatio: 8, colorTemperature: 3000, hours: 5, glareRadius: 2.5, disturbance: 'quiet' },
  school: { baseImpact: 5, brightness: 58, upwardRatio: 24, colorTemperature: 4300, hours: 6, glareRadius: 4, disturbance: 'public' },
  subway: { baseImpact: 5, brightness: 66, upwardRatio: 20, colorTemperature: 4500, hours: 14, glareRadius: 4.5, disturbance: 'traffic' },
  wind: { baseImpact: 0.2, brightness: 8, upwardRatio: 4, colorTemperature: 3000, hours: 2, glareRadius: 2, disturbance: 'quiet' },
  solar: { baseImpact: 0.3, brightness: 10, upwardRatio: 4, colorTemperature: 3000, hours: 2, glareRadius: 2, disturbance: 'quiet' },
  hospital: { baseImpact: 7, brightness: 72, upwardRatio: 24, colorTemperature: 5000, hours: 16, glareRadius: 5.5, disturbance: 'public' },
  police: { baseImpact: 6, brightness: 70, upwardRatio: 30, colorTemperature: 5200, hours: 15, glareRadius: 5, disturbance: 'public' },
  fire_station: { baseImpact: 6, brightness: 72, upwardRatio: 30, colorTemperature: 5000, hours: 15, glareRadius: 5.5, disturbance: 'public' },
  library: { baseImpact: 4, brightness: 52, upwardRatio: 18, colorTemperature: 4000, hours: 7, glareRadius: 4, disturbance: 'quiet' },
  luxury_residential: { baseImpact: 7, brightness: 68, upwardRatio: 28, colorTemperature: 4700, hours: 10, glareRadius: 5, disturbance: 'quiet' },
  skyscraper: { baseImpact: 16, brightness: 94, upwardRatio: 48, colorTemperature: 6000, hours: 16, glareRadius: 8, disturbance: 'signage' },
  stadium: { baseImpact: 18, brightness: 100, upwardRatio: 56, colorTemperature: 6200, hours: 9, glareRadius: 11, disturbance: 'stadium' },
};

export const RESIDENTIAL_TYPES: BuildingType[] = ['residential', 'luxury_residential'];

export function getBuildingLightImpact(building: LightingBuilding): number {
  const profile = LIGHTING_PROFILES[building.type];
  const retrofits = building.retrofits ?? [];
  let factor = 1;
  if (retrofits.includes('shielding')) factor *= 0.48;
  if (retrofits.includes('warm_light')) factor *= 0.82;
  if (retrofits.includes('timer')) factor *= 0.7;
  if (retrofits.includes('smart_dimming')) factor *= 0.76;
  return Math.round(profile.baseImpact * factor * 10) / 10;
}

export function getBuildingLightingStats(building: LightingBuilding) {
  const profile = LIGHTING_PROFILES[building.type];
  const retrofits = building.retrofits ?? [];
  return {
    impact: getBuildingLightImpact(building),
    brightness: Math.round(profile.brightness * (retrofits.includes('smart_dimming') ? 0.72 : 1)),
    upwardRatio: Math.round(profile.upwardRatio * (retrofits.includes('shielding') ? 0.24 : 1)),
    colorTemperature: retrofits.includes('warm_light') ? Math.min(3000, profile.colorTemperature) : profile.colorTemperature,
    hours: Math.round(profile.hours * (retrofits.includes('timer') ? 0.62 : 1) * 10) / 10,
  };
}

const clampIndex = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function calculateLightPollution(
  buildings: LightingBuilding[],
  currentLevel: number,
  policyReduction: number,
  eventModifier = 0,
): number {
  const cityBackground = 10 + Math.max(1, currentLevel) * 2;
  const buildingImpact = buildings.reduce((sum, building) => sum + getBuildingLightImpact(building), 0);
  return clampIndex(cityBackground + buildingImpact - policyReduction + eventModifier);
}

export const starsFromLightPollution = (lightPollution: number) => clampIndex(108 - lightPollution);

export interface ResidentialExposure {
  residenceId: string;
  sourceId: string;
  sourceType: BuildingType;
  distance: number;
  severity: number;
  issue: 'glare' | 'signage' | 'noise' | 'floodlight' | 'traffic';
}

const issueFor = (type: BuildingType, disturbance: LightingProfile['disturbance']): ResidentialExposure['issue'] => {
  if (type === 'stadium') return 'floodlight';
  if (disturbance === 'industrial') return 'noise';
  if (disturbance === 'traffic') return 'traffic';
  if (disturbance === 'signage') return 'signage';
  return 'glare';
};

export function getResidentialExposures(buildings: LightingBuilding[]): ResidentialExposure[] {
  const residences = buildings.filter((building) => RESIDENTIAL_TYPES.includes(building.type));
  const reports: ResidentialExposure[] = [];

  residences.forEach((residence) => {
    buildings.forEach((source) => {
      if (source.id === residence.id) return;
      const profile = LIGHTING_PROFILES[source.type];
      if (profile.disturbance === 'quiet') return;
      const distance = Math.hypot(residence.x - source.x, residence.z - source.z);
      if (distance > profile.glareRadius) return;
      const shieldingRelief = source.retrofits?.includes('shielding') ? 0.45 : 1;
      const timerRelief = source.retrofits?.includes('timer') ? 0.72 : 1;
      const proximity = Math.max(0, 1 - distance / profile.glareRadius);
      const severity = Math.round(getBuildingLightImpact(source) * proximity * shieldingRelief * timerRelief * 10) / 10;
      if (severity < 1.25) return;
      reports.push({
        residenceId: residence.id,
        sourceId: source.id,
        sourceType: source.type,
        distance: Math.round(distance * 10) / 10,
        severity,
        issue: issueFor(source.type, profile.disturbance),
      });
    });
  });
  return reports.sort((a, b) => b.severity - a.severity);
}

export interface CitizenFeedbackCandidate {
  id: string;
  buildingId: string;
  tone: 'complaint' | 'praise' | 'observation';
  text: string;
  reason: string;
}

const buildingNameFallback: Record<BuildingType, string> = {
  residential: '住宅区', commercial: '商业区', industrial: '工业区', park: '公园', school: '学校', subway: '地铁站', wind: '风力发电', solar: '太阳能电站', hospital: '医院', police: '警察局', fire_station: '消防站', library: '图书馆', luxury_residential: '生态住宅小区', skyscraper: '商业中心', stadium: '体育场',
};

export function getCitizenFeedbackCandidates(buildings: LightingBuilding[], lightPollution: number): CitizenFeedbackCandidate[] {
  const exposures = getResidentialExposures(buildings);
  const candidates: CitizenFeedbackCandidate[] = exposures.slice(0, 8).map((report) => {
    const sourceName = buildingNameFallback[report.sourceType];
    const textByIssue: Record<ResidentialExposure['issue'], string> = {
      glare: `窗外的${sourceName}灯光太刺眼，晚上很难休息。`,
      signage: `附近${sourceName}的招牌整夜亮着，窗帘都挡不住。`,
      noise: `附近${sourceName}又亮又吵，希望能限制夜间运行。`,
      floodlight: `${sourceName}的泛光灯照进了家里，也遮住了星星。`,
      traffic: `${sourceName}周围灯光和车流太集中，夜里有些扰民。`,
    };
    return {
      id: `exposure-${report.residenceId}-${report.sourceId}-${report.issue}`,
      buildingId: report.residenceId,
      tone: 'complaint' as const,
      text: textByIssue[report.issue],
      reason: `${sourceName}距离住宅约 ${report.distance} 格，干扰强度 ${report.severity.toFixed(1)}`,
    };
  });

  buildings.forEach((building) => {
    const impact = getBuildingLightImpact(building);
    const retrofits = building.retrofits ?? [];
    if (retrofits.length >= 2) {
      candidates.push({
        id: `retrofit-${building.id}-${retrofits.length}`,
        buildingId: building.id,
        tone: 'praise',
        text: `${buildingNameFallback[building.type]}改造后不再到处漏光，路面仍然看得清。`,
        reason: `已完成 ${retrofits.length} 项照明改造，当前污染贡献 ${impact.toFixed(1)}`,
      });
    } else if (impact >= 12) {
      candidates.push({
        id: `source-${building.id}`,
        buildingId: building.id,
        tone: 'observation',
        text: `这里的灯有不少照向天空，也许应该先做一次照明巡查。`,
        reason: `${buildingNameFallback[building.type]}当前污染贡献 ${impact.toFixed(1)}`,
      });
    }
  });

  // Every building can host a bubble, but the sentence is generated from that
  // building's actual lighting role and current city conditions.
  buildings.forEach((building) => {
    if (candidates.some((candidate) => candidate.buildingId === building.id)) return;
    const impact = getBuildingLightImpact(building);
    let text: string;
    if (RESIDENTIAL_TYPES.includes(building.type)) {
      text = lightPollution > 45
        ? '虽然附近没有最严重的直射光，窗外的天空仍被城市辉光照亮。'
        : '这里的夜间灯光比较克制，窗外已经能看见更多星星。';
    } else if (building.type === 'park') {
      text = lightPollution > 35 ? '公园上空仍有明显辉光，观星活动还需要全城一起控光。' : '公园灯光照向步道，没有把夜空一起照亮。';
    } else if (building.type === 'wind' || building.type === 'solar') {
      text = '这里几乎没有夜间照明，但它也不能替代对商业灯光的直接治理。';
    } else if (building.type === 'hospital' || building.type === 'police' || building.type === 'fire_station') {
      text = '必要照明需要保留，不过灯光仍可以更均匀、更少眩光。';
    } else if (building.type === 'school' || building.type === 'library') {
      text = '闭馆后按时熄灯，既节能也不会影响正常使用。';
    } else if (building.type === 'subway') {
      text = '出入口需要安全照明，但深夜可以根据客流自动调暗。';
    } else {
      text = impact >= 8 ? '这里的夜间照明贡献不低，值得检查方向、色温和运行时段。' : '这座建筑的灯光目前较克制，可以继续观察。';
    }
    candidates.push({
      id: `building-${building.id}-${Math.round(impact * 10)}-${lightPollution}`,
      buildingId: building.id,
      tone: impact >= 8 ? 'observation' : 'praise',
      text,
      reason: `${buildingNameFallback[building.type]}当前污染贡献 ${impact.toFixed(1)}，全城光污染 ${lightPollution}`,
    });
  });

  const park = buildings.find((building) => building.type === 'park');
  if (park && lightPollution <= 35) {
    candidates.push({
      id: `sky-${park.id}-${lightPollution}`,
      buildingId: park.id,
      tone: 'praise',
      text: '今晚在公园能看见更多星星了，孩子们都舍不得回家。',
      reason: `全城光污染已降至 ${lightPollution}`,
    });
  }

  return candidates;
}

export function getBuildingSpamMultiplier(type: BuildingType, previousType: BuildingType | null, consecutiveCount: number) {
  if (type !== previousType || consecutiveCount < 2) return 1;
  return Math.min(2.4, 1 + 0.35 * (consecutiveCount - 1));
}
