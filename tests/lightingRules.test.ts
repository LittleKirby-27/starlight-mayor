import assert from 'node:assert/strict';
import {
  calculateLightPollution,
  getBuildingLightImpact,
  getBuildingLightingStats,
  getBuildingSpamMultiplier,
  getCitizenFeedbackCandidates,
  getResidentialExposures,
  starsFromLightPollution,
  type LightingBuilding,
} from '../src/game/lighting.ts';

const buildings: LightingBuilding[] = [
  { id: 'home-a', type: 'residential', x: 0, z: 4, retrofits: [] },
  { id: 'home-b', type: 'luxury_residential', x: 0, z: -4, retrofits: [] },
  { id: 'tower', type: 'skyscraper', x: 0, z: 0, retrofits: [] },
  { id: 'shop', type: 'commercial', x: 4, z: 0, retrofits: [] },
  { id: 'park', type: 'park', x: -5, z: -5, retrofits: [] },
];

const initialPollution = calculateLightPollution(buildings, 1, 0);
assert.ok(initialPollution > 40, '高亮商业建筑必须产生明显城市光污染');
assert.equal(starsFromLightPollution(initialPollution), 108 - initialPollution, '星空必须由光污染反向计算');

const tower = buildings.find((building) => building.id === 'tower')!;
const originalImpact = getBuildingLightImpact(tower);
const improvedTower = { ...tower, retrofits: ['shielding', 'warm_light', 'timer', 'smart_dimming'] as const };
assert.ok(getBuildingLightImpact(improvedTower) < originalImpact * 0.3, '组合照明改造必须显著降低污染贡献');
assert.ok(getBuildingLightingStats(improvedTower).upwardRatio < getBuildingLightingStats(tower).upwardRatio, '遮光改造必须降低向上光比例');
assert.ok(getBuildingLightingStats(improvedTower).colorTemperature <= 3000, '暖色改造必须把色温控制到3000K或以下');

const exposures = getResidentialExposures(buildings);
assert.ok(exposures.some((item) => item.residenceId === 'home-a'), '普通住宅必须受到邻近灯光影响');
assert.ok(exposures.some((item) => item.residenceId === 'home-b'), '生态住宅同样必须受到邻近灯光影响');
assert.ok(exposures.every((item) => item.distance > 0 && item.severity > 0), '区位暴露必须来自真实距离和污染强度计算');

const feedback = getCitizenFeedbackCandidates(buildings, initialPollution);
assert.ok(feedback.some((item) => item.buildingId === 'home-a' && /招牌|灯光/.test(item.text)), '住宅气泡内容必须匹配邻近污染源');
assert.ok(feedback.every((item) => item.reason.length > 0), '所有市民气泡必须附带可核对的数值或地理原因');
assert.ok(buildings.every((building) => feedback.some((item) => item.buildingId === building.id)), '任何类型建筑都必须有机会出现符合当前状态的市民气泡');

assert.equal(getBuildingSpamMultiplier('commercial', 'commercial', 1), 1, '连续两座之前不得触发防刷');
assert.equal(getBuildingSpamMultiplier('commercial', 'commercial', 2), 1.35, '第三座同类建筑必须触发防刷');
assert.equal(getBuildingSpamMultiplier('commercial', 'residential', 5), 1, '更换建筑类型必须重置连续建设惩罚');

console.log('lightingRules: 14 checks passed');
