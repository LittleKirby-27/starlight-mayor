export const FIRST_EVENT_DAY = 3;
export const EVENT_MIN_GAP_DAYS = 3;
export const EVENT_WINDOW_DAYS = 7;
export const EVENT_MAX_PER_WINDOW = 2;

export interface EventScheduleSnapshot {
  day: number;
  currentLevel: number;
  eventDays: number[];
  randomRoll: number;
}

export const getEventChance = (currentLevel: number) =>
  Math.min(0.33, 0.16 + Math.max(1, currentLevel) * 0.025);

export function shouldTriggerEvent({ day, currentLevel, eventDays, randomRoll }: EventScheduleSnapshot): boolean {
  if (day < FIRST_EVENT_DAY) return false;

  const recentEventsCount = eventDays.filter((eventDay) => {
    const elapsedDays = day - eventDay;
    return elapsedDays >= 0 && elapsedDays < EVENT_WINDOW_DAYS;
  }).length;
  if (recentEventsCount >= EVENT_MAX_PER_WINDOW) return false;

  const lastEventDay = eventDays.length > 0 ? Math.max(...eventDays) : Number.NEGATIVE_INFINITY;
  if (day - lastEventDay < EVENT_MIN_GAP_DAYS) return false;

  return randomRoll < getEventChance(currentLevel);
}
