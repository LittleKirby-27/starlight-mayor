import assert from 'node:assert/strict';
import {
  getChallengeObjectives,
  getChallengeOptions,
  getLevelObjectives,
  getNextLevelTransition,
  isLevelComplete,
  LEVELS,
  resolveLevelProgress,
  type BuildingType,
  type RuleSnapshot,
} from '../src/game/rules.ts';
import type { RetrofitType } from '../src/game/lighting.ts';

const building = (id: string, type: BuildingType, retrofits: RetrofitType[] = []) => ({ id, type, retrofits });
const base = (overrides: Partial<RuleSnapshot> = {}): RuleSnapshot => ({
  currentLevel: 1,
  money: 1000,
  environment: 80,
  stars: 70,
  satisfaction: 80,
  lightPollution: 38,
  residentialComplaints: 0,
  auditedBuildingIds: ['a', 'b', 'c', 'd'],
  activeChallengeId: 'night_audit',
  buildings: [
    building('a', 'skyscraper', ['shielding']),
    building('b', 'commercial', ['warm_light']),
    building('c', 'residential', ['timer']),
    building('d', 'park'),
  ],
  activePolicies: [],
  ...overrides,
});

assert.equal(isLevelComplete(base()), true, '第一关核心目标与高难度审计委托完成后应通关');
assert.equal(isLevelComplete(base({ activeChallengeId: null })), true, '纯规则函数在未选择委托时只校验核心目标，商店负责阻止提前结算');
assert.equal(isLevelComplete(base({ lightPollution: 61, stars: 47 })), false, '第一关光污染或星空不达标时不得通关');

const pollutionObjective = getLevelObjectives(base({ lightPollution: 62 })).find((item) => item.id === 'light_pollution');
assert.equal(pollutionObjective?.direction, 'atMost', '光污染目标必须使用越低越好的判定方向');
assert.equal(pollutionObjective?.completed, false, '光污染高于上限时目标必须未完成');

assert.deepEqual(
  LEVELS.map((level) => level.timeLimit / 60),
  [4.5, 4.75, 5, 5.25, 5.5, 6],
  '六关时间必须保持约五分钟并逐步增加',
);
assert.deepEqual(LEVELS.map((level) => level.targetStars), [48, 58, 66, 74, 82, 90], '星空目标必须随光污染课程逐关提高');

const challengeOptions = getChallengeOptions(4);
assert.equal(challengeOptions.length, 3, '每关必须提供三种高难度城市委托');
assert.match(challengeOptions.map((item) => item.desc).join(' '), /光污染|巡查|住宅/, '委托必须围绕光污染知识而不是普通建设刷分');

const precisionObjectives = getChallengeObjectives(base({
  currentLevel: 4,
  activeChallengeId: 'precision_budget',
  lightPollution: 35,
  money: 650,
  buildings: [building('a', 'commercial', ['shielding', 'warm_light', 'timer', 'smart_dimming'])],
}));
assert.equal(precisionObjectives.every((item) => item.completed), true, '精准控光委托满足低污染、多类改造与预算条件后应完成');

const residentObjectives = getChallengeObjectives(base({
  currentLevel: 5,
  activeChallengeId: 'resident_night',
  residentialComplaints: 0,
  satisfaction: 75,
  buildings: Array.from({ length: 5 }, (_, index) => building(`s${index}`, 'commercial', ['shielding'])),
}));
assert.equal(residentObjectives.every((item) => item.completed), true, '居民安夜委托必须同时校验区位、遮光和满意度');

const finalState = base({
  currentLevel: 6,
  activeChallengeId: 'precision_budget',
  money: 1600,
  stars: 94,
  satisfaction: 82,
  lightPollution: 14,
  residentialComplaints: 0,
  activePolicies: ['smart_lighting'],
  buildings: Array.from({ length: 6 }, (_, index) => building(`f${index}`, 'commercial', ['shielding', 'timer', ...(index < 4 ? ['smart_dimming' as const] : []), 'warm_light'])),
});
assert.equal(isLevelComplete(finalState), true, '最终关必须校验全城照明改造、财政、居民和高难度委托');

const progress = resolveLevelProgress(1, [], 1);
assert.deepEqual(progress.completedLevels, [1], '完成第一关后必须记录进度');
assert.equal(progress.maxUnlockedLevel, 2, '完成第一关后必须解锁第二关');
assert.deepEqual(getNextLevelTransition(1, 240), { currentLevel: 2, timeLeft: 4 * 60 + 45, reward: 425, money: 665 }, '进入下一关必须发放奖励并重置计时');
assert.equal(resolveLevelProgress(6, [1, 2, 3, 4, 5], 6).isFinal, true, '第六关完成后必须进入最终胜利');
assert.equal(getNextLevelTransition(6, 1000), null, '最终关后不能创建第七关');

console.log('gameRules: 18 checks passed');
