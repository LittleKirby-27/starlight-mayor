import assert from 'node:assert/strict';
import {
  BUILDING_CONFIG,
  getLevelObjectives,
  getNextLevelTransition,
  isLevelComplete,
  LEVELS,
  POLICY_CONFIG,
  resolveLevelProgress,
  type BuildingType,
  type RuleSnapshot,
} from '../src/game/rules.ts';

const building = (type: BuildingType) => ({ type });
const base = (overrides: Partial<RuleSnapshot> = {}): RuleSnapshot => ({
  currentLevel: 1,
  money: 1000,
  environment: 80,
  stars: 100,
  satisfaction: 80,
  buildings: [],
  activePolicies: [],
  ...overrides,
});

assert.equal(
  isLevelComplete(base({
    buildings: [
      ...Array.from({ length: 5 }, () => building('residential')),
      ...Array.from({ length: 3 }, () => building('commercial')),
      ...Array.from({ length: 3 }, () => building('park')),
    ],
  })),
  true,
  '第一关应在四个目标都完成时通关',
);

assert.equal(
  isLevelComplete(base({
    stars: 19,
    buildings: [
      ...Array.from({ length: 5 }, () => building('residential')),
      ...Array.from({ length: 3 }, () => building('commercial')),
      ...Array.from({ length: 3 }, () => building('park')),
    ],
  })),
  false,
  '第一关星空不足时不得误通关',
);

assert.equal(
  isLevelComplete(base({ currentLevel: 2, stars: 45, activePolicies: ['led_lights', 'limit_lights'] })),
  true,
  '第二关政策和星空目标完成后应通关',
);

assert.equal(
  isLevelComplete(base({
    currentLevel: 3,
    stars: 65,
    environment: 70,
    activePolicies: ['limit_industry'],
    buildings: [building('wind'), building('wind'), building('wind')],
  })),
  true,
  '第三关应正确识别风电数量与工业政策',
);

assert.equal(
  isLevelComplete(base({
    currentLevel: 6,
    money: 1199,
    environment: 100,
    stars: 100,
    satisfaction: 100,
  })),
  false,
  '最终关财政低于 1200 时不能通关',
);

assert.equal(
  isLevelComplete(base({
    currentLevel: 6,
    money: 1200,
    environment: 85,
    stars: 100,
    satisfaction: 85,
  })),
  true,
  '最终关四项指标达标时应通关',
);

assert.deepEqual(
  getLevelObjectives(base({ currentLevel: 2, stars: 40, activePolicies: ['led_lights'] })).map((item) => item.completed),
  [true, false, true, false],
  '关卡进度必须逐项展示，不能只看星空',
);

assert.deepEqual(
  LEVELS.map((level) => level.timeLimit / 60),
  [4.5, 4.75, 5, 5.25, 5.5, 6],
  '关卡时间应按最新要求控制在约 5 分钟并递增',
);

const progress = resolveLevelProgress(1, [], 1);
assert.deepEqual(progress.completedLevels, [1], '完成第一关后必须写入已通关列表');
assert.equal(progress.maxUnlockedLevel, 2, '完成第一关后必须解锁第二关');
assert.equal(progress.isFinal, false, '第一关不能被判为最终胜利');
assert.deepEqual(
  getNextLevelTransition(1, 240),
  { currentLevel: 2, timeLeft: 4 * 60 + 45, reward: 425, money: 665 },
  '点击继续后必须真正进入第二关并重置本关计时',
);
assert.equal(resolveLevelProgress(6, [1, 2, 3, 4, 5], 6).isFinal, true, '第六关完成后必须进入最终胜利');
assert.equal(getNextLevelTransition(6, 1000), null, '最终关后不能创建不存在的第七关');

const initialBuildings: BuildingType[] = ['skyscraper', 'commercial', 'commercial', 'residential', 'residential', 'park', 'park', 'school', 'hospital'];
const startingResources = (level: number): RuleSnapshot => ({
  currentLevel: level,
  money: 1000 + (level - 1) * 450,
  environment: Math.min(72, 52 + (level - 1) * 4),
  stars: Math.min(78, 18 + (level - 1) * 12),
  satisfaction: Math.min(75, 60 + (level - 1) * 3),
  buildings: initialBuildings.map(building),
  activePolicies: [],
});

const applyStrategy = (level: number, buildings: BuildingType[], policies: string[]) => {
  const state = startingResources(level);
  buildings.forEach((type) => {
    const config = BUILDING_CONFIG[type];
    state.money -= config.cost;
    state.environment = Math.min(100, state.environment + config.env);
    state.stars = Math.min(100, state.stars + config.stars);
    state.satisfaction = Math.min(100, state.satisfaction + config.sat);
    state.buildings.push(building(type));
  });
  policies.forEach((policyId) => {
    const config = POLICY_CONFIG[policyId];
    state.money -= config.cost;
    state.environment = Math.min(100, state.environment + config.env);
    state.stars = Math.min(100, state.stars + config.stars);
    state.satisfaction = Math.min(100, state.satisfaction + config.sat);
    state.activePolicies.push(policyId);
  });
  return state;
};

const feasibleStrategies: Array<{ level: number; buildings: BuildingType[]; policies: string[] }> = [
  { level: 1, buildings: ['residential', 'residential', 'residential', 'commercial', 'park', 'solar'], policies: [] },
  { level: 2, buildings: ['park'], policies: ['led_lights', 'limit_lights'] },
  { level: 3, buildings: ['wind', 'wind', 'wind', 'solar'], policies: ['limit_industry'] },
  { level: 4, buildings: ['subway', 'subway', 'subway', 'solar', 'solar', 'solar'], policies: ['green_travel'] },
  { level: 5, buildings: ['solar', 'solar', 'solar', 'solar', 'solar'], policies: ['recycle', 'carbon_budget', 'community_events'] },
  { level: 6, buildings: ['solar', 'solar', 'library'], policies: ['green_standard'] },
];

feasibleStrategies.forEach(({ level, buildings, policies }) => {
  const state = applyStrategy(level, buildings, policies);
  assert.ok(state.money > 0 && isLevelComplete(state), `第 ${level} 关必须存在无需等待收入且财政为正的通关策略`);
});

console.log('gameRules: 20 checks passed');
