import assert from 'node:assert/strict';

const memory = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
    removeItem: (key: string) => memory.delete(key),
  },
});

const { INITIAL_STATE, useGameStore } = await import('../src/store/gameStore.ts');

useGameStore.setState({ ...INITIAL_STATE });
let state = useGameStore.getState();
assert.equal(state.isPaused, true, '新关卡必须暂停并等待玩家选择高难度委托');
assert.equal(state.activeChallengeId, null, '新关卡不得暗中替玩家选择委托');
state.selectChallenge('night_audit');
state = useGameStore.getState();
assert.equal(state.activeChallengeId, 'night_audit', '玩家选择的委托必须写入状态');
assert.equal(state.isPaused, false, '选择委托后必须开始计时');

const originalPollution = state.lightPollution;
const originalMoney = state.money;
state.auditBuilding('init_1');
assert.ok(useGameStore.getState().auditedBuildingIds.includes('init_1'), '巡查建筑必须记录且可用于目标判定');
assert.equal(useGameStore.getState().applyLightingRetrofit('init_1', 'shielding'), true, '已巡查且财政足够时必须能改造建筑');
state = useGameStore.getState();
assert.equal(state.money, originalMoney - 90, '遮光灯罩必须扣除正确财政');
assert.ok(state.lightPollution < originalPollution, '遮光改造必须降低全城光污染');
assert.ok(state.stars > INITIAL_STATE.stars, '光污染下降必须自动提高星空指数');
assert.equal(state.applyLightingRetrofit('init_1', 'shielding'), false, '同一建筑不得重复安装同类改造');

useGameStore.setState({
  ...INITIAL_STATE,
  activeChallengeId: 'night_audit',
  isPaused: false,
  money: 1000,
  recentBuildType: null,
  consecutiveBuildCount: 0,
});
state = useGameStore.getState();
assert.equal(state.addBuilding({ type: 'residential', x: 20, z: 20 }), true, '第一座同类建筑应按原价建造');
assert.equal(useGameStore.getState().addBuilding({ type: 'residential', x: 22, z: 20 }), true, '第二座同类建筑仍应按原价建造');
assert.equal(useGameStore.getState().addBuilding({ type: 'residential', x: 24, z: 20 }), true, '第三座同类建筑应允许建造但触发防刷');
state = useGameStore.getState();
assert.equal(state.money, 665, '三座住宅应扣除100+100+135财政');
assert.equal(state.buildings.at(-1)?.upkeepMultiplier, 1.25, '第三座同类建筑必须承担提高后的维护倍率');
assert.equal(state.consecutiveBuildCount, 3, '连续建设计数必须准确');
assert.equal(state.addBuilding({ type: 'park', x: 26, z: 20 }), true, '更换建筑类型后应恢复原价');
assert.equal(useGameStore.getState().consecutiveBuildCount, 1, '更换类型必须重置连续建设计数');

useGameStore.setState({
  ...INITIAL_STATE,
  activeChallengeId: 'night_audit',
  isPaused: false,
  money: 500,
  lightPollution: 50,
  stars: 58,
});
state = useGameStore.getState();
state.applyEventResult({ money: 320, satisfaction: 8 });
assert.equal(useGameStore.getState().money, 820, '流星雨达标选项必须发放财政奖励');
const pollutionBeforeEventDimming = useGameStore.getState().lightPollution;
state.applyEventResult({ lightPollution: -8 });
assert.ok(useGameStore.getState().lightPollution < pollutionBeforeEventDimming, '事件调光效果必须进入光污染计算');

const completedBuildings = [
  { id: 'a', type: 'skyscraper' as const, x: 0, z: 0, retrofits: ['shielding' as const], upkeepMultiplier: 1 },
  { id: 'b', type: 'commercial' as const, x: 4, z: 0, retrofits: ['warm_light' as const], upkeepMultiplier: 1 },
  { id: 'c', type: 'residential' as const, x: 0, z: 4, retrofits: ['timer' as const], upkeepMultiplier: 1 },
  { id: 'd', type: 'park' as const, x: -4, z: -4, retrofits: [], upkeepMultiplier: 1 },
];
useGameStore.setState({
  ...INITIAL_STATE,
  activeChallengeId: 'night_audit',
  isPaused: false,
  money: 700,
  lightPollution: 38,
  stars: 70,
  satisfaction: 80,
  auditedBuildingIds: ['a', 'b', 'c', 'd'],
  buildings: completedBuildings,
  completedLevels: [],
  maxUnlockedLevel: 1,
});
useGameStore.getState().checkWinLoss();
state = useGameStore.getState();
assert.equal(state.levelComplete, 1, '核心光污染目标和所选高难度委托完成后必须通关');
assert.equal(state.maxUnlockedLevel, 2, '通关后必须解锁下一关');
state.continueToNextLevel();
state = useGameStore.getState();
assert.equal(state.currentLevel, 2, '确认后必须进入第二关');
assert.equal(state.activeChallengeId, null, '新关卡必须重新选择高难度委托');
assert.equal(state.isPaused, true, '新关卡选择委托前不得偷跑计时');

console.log('gameStore: 25 checks passed');
