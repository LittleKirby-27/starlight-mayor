import assert from 'node:assert/strict';
import {
  EVENT_MAX_PER_WINDOW,
  EVENT_MIN_GAP_DAYS,
  FIRST_EVENT_DAY,
  getEventChance,
  shouldTriggerEvent,
} from '../src/game/events.ts';
import { TURN_DURATION_MS } from '../src/game/rules.ts';

assert.equal((FIRST_EVENT_DAY - 1) * TURN_DURATION_MS / 1000, 60, '首个紧急事件不得早于开局 60 秒');
assert.equal(EVENT_MIN_GAP_DAYS * TURN_DURATION_MS / 1000, 90, '两次紧急事件至少间隔 90 秒');
assert.equal(EVENT_MAX_PER_WINDOW, 2, '七天窗口内最多出现两次紧急事件');

assert.equal(shouldTriggerEvent({ day: 2, currentLevel: 6, eventDays: [], randomRoll: 0 }), false, '第 2 天不能触发事件');
assert.equal(shouldTriggerEvent({ day: 3, currentLevel: 1, eventDays: [], randomRoll: 0 }), true, '第 3 天开始才允许触发事件');
assert.equal(shouldTriggerEvent({ day: 5, currentLevel: 6, eventDays: [3], randomRoll: 0 }), false, '最近事件不足三天时不能刷新');
assert.equal(shouldTriggerEvent({ day: 6, currentLevel: 6, eventDays: [3], randomRoll: 0 }), true, '间隔三天后可以刷新');
assert.equal(shouldTriggerEvent({ day: 8, currentLevel: 6, eventDays: [3, 6], randomRoll: 0 }), false, '窗口内已有两次事件时不能刷新');
assert.equal(getEventChance(99), 0.33, '高关卡事件概率必须封顶');

console.log('eventRules: 9 checks passed');
