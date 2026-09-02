import assert from 'node:assert/strict';
import {
  EVENT_MAX_PER_WINDOW,
  EVENT_MIN_GAP_DAYS,
  FIRST_EVENT_DAY,
  getEventChance,
  shouldTriggerEvent,
} from '../src/game/events.ts';
import { TURN_DURATION_MS } from '../src/game/rules.ts';

assert.equal((FIRST_EVENT_DAY - 1) * TURN_DURATION_MS / 1000, 30, '首个紧急事件可从开局 30 秒后出现');
assert.equal(EVENT_MIN_GAP_DAYS * TURN_DURATION_MS / 1000, 60, '两次紧急事件至少间隔 60 秒');
assert.equal(EVENT_MAX_PER_WINDOW, 3, '六天窗口内最多出现三次紧急事件');

assert.equal(shouldTriggerEvent({ day: 1, currentLevel: 6, eventDays: [], randomRoll: 0 }), false, '第 1 天不能触发事件');
assert.equal(shouldTriggerEvent({ day: 2, currentLevel: 1, eventDays: [], randomRoll: 0 }), true, '第 2 天开始允许触发事件');
assert.equal(shouldTriggerEvent({ day: 3, currentLevel: 6, eventDays: [2], randomRoll: 0 }), false, '最近事件不足两天时不能刷新');
assert.equal(shouldTriggerEvent({ day: 4, currentLevel: 6, eventDays: [2], randomRoll: 0 }), true, '间隔两天后可以刷新');
assert.equal(shouldTriggerEvent({ day: 7, currentLevel: 6, eventDays: [2, 4, 6], randomRoll: 0 }), false, '窗口内已有三次事件时不能刷新');
assert.equal(getEventChance(99), 0.68, '高关卡事件概率必须封顶');

console.log('eventRules: 9 checks passed');
