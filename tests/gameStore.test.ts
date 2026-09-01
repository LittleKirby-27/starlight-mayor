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

const levelOneBuildings = [
  ...Array.from({ length: 5 }, (_, index) => ({ id: `r${index}`, type: 'residential' as const, x: index * 2, z: 0 })),
  ...Array.from({ length: 3 }, (_, index) => ({ id: `c${index}`, type: 'commercial' as const, x: index * 2, z: 4 })),
  ...Array.from({ length: 3 }, (_, index) => ({ id: `p${index}`, type: 'park' as const, x: index * 2, z: 8 })),
];

useGameStore.setState({
  ...INITIAL_STATE,
  money: 100,
  environment: 52,
  stars: 22,
  satisfaction: 84,
  buildings: levelOneBuildings,
  completedLevels: [],
  maxUnlockedLevel: 1,
  currentLevel: 1,
  timeLeft: 733,
});
useGameStore.getState().checkWinLoss();

let state = useGameStore.getState();
assert.equal(state.levelComplete, 1, '达成第一关目标后必须进入通关状态');
assert.equal(state.isPaused, true, '通关结算期间必须暂停计时');
assert.equal(state.maxUnlockedLevel, 2, '第一关完成后必须解锁第二关');
assert.deepEqual(state.completedLevels, [1], '第一关必须记录为已完成');

state.continueToNextLevel();
state = useGameStore.getState();
assert.equal(state.currentLevel, 2, '点击进入下一关后必须切换到第二关');
assert.equal(state.levelComplete, null, '进入第二关后必须清除上一关结算状态');
assert.equal(state.isPaused, false, '进入第二关后必须恢复游戏');
assert.equal(state.timeLeft, 4 * 60 + 45, '第二关必须获得完整的 4 分 45 秒计时');
assert.equal(state.money, 525, '进入第二关后必须正确发放 425 财政奖励');

state.setPaused(true);
const pausedTime = useGameStore.getState().timeLeft;
state.tickTime();
assert.equal(useGameStore.getState().timeLeft, pausedTime, '暂停期间不得扣除关卡时间');

useGameStore.setState({
  isPaused: false,
  isGameOver: false,
  gameResult: null,
  failReason: null,
  levelComplete: null,
  currentLevel: 2,
  timeLeft: 0,
  stars: 30,
  environment: 50,
  satisfaction: 50,
  money: 500,
  activePolicies: [],
});
useGameStore.getState().checkWinLoss();
state = useGameStore.getState();
assert.equal(state.gameResult, 'lose', '未完成目标且时间归零时必须判定失败');
assert.match(state.failReason ?? '', /时间限制/, '超时失败必须显示明确原因');

useGameStore.setState({
  isPaused: false,
  isGameOver: false,
  gameResult: null,
  failReason: null,
  levelComplete: null,
  currentLevel: 6,
  timeLeft: 900,
  money: 1200,
  environment: 85,
  stars: 100,
  satisfaction: 85,
  completedLevels: [1, 2, 3, 4, 5],
  maxUnlockedLevel: 6,
});
useGameStore.getState().checkWinLoss();
state = useGameStore.getState();
assert.equal(state.gameResult, 'win', '第六关四项指标达标后必须判定完整胜利');
assert.equal(state.isGameOver, true, '最终胜利必须结束本轮游戏');
assert.deepEqual(state.completedLevels, [1, 2, 3, 4, 5, 6], '最终胜利必须记录全部六关');

console.log('gameStore: 16 checks passed');
