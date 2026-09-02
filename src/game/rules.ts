export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'foggy';
export type AchievementCategory = 'construction' | 'policy' | 'environmental' | 'economic' | 'mixed';

export type BuildingType =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'park'
  | 'school'
  | 'subway'
  | 'wind'
  | 'solar'
  | 'hospital'
  | 'police'
  | 'fire_station'
  | 'library'
  | 'luxury_residential'
  | 'skyscraper'
  | 'stadium';

export interface LevelConfig {
  id: number;
  name: string;
  shortName: string;
  targetStars: number;
  timeLimit: number;
  desc: string;
}

export interface ObjectiveProgress {
  id: string;
  label: string;
  current: number;
  target: number;
  completed: boolean;
}

export interface RuleSnapshot {
  currentLevel: number;
  money: number;
  environment: number;
  stars: number;
  satisfaction: number;
  buildings: Array<{ type: BuildingType }>;
  activePolicies: string[];
}

export interface BuildingConfig {
  cost: number;
  env: number;
  stars: number;
  sat: number;
  income: number;
  upkeep: number;
  name: string;
}

export interface PolicyConfig {
  cost: number;
  env: number;
  stars: number;
  sat: number;
  income: number;
  name: string;
  source: '市民' | '专家' | '国际' | '企业';
}

export const TURN_DURATION_MS = 30_000;
export const EVENT_RESPONSE_SECONDS = 60;
export const MAX_LEVEL = 6;

export const LEVELS: LevelConfig[] = [
  { id: 1, name: '第一关：建设新城区', shortName: '新城起步', targetStars: 22, timeLimit: 4 * 60 + 30, desc: '在紧张预算内建成 5 座住宅、3 座商业区、3 座公园，星空指数达到 22。' },
  { id: 2, name: '第二关：解决光污染', shortName: '灯光有边界', targetStars: 45, timeLimit: 4 * 60 + 45, desc: '推广 LED 路灯并控制夜间照明，同时让环境达到 60、星空达到 45。' },
  { id: 3, name: '第三关：控制工业排放', shortName: '清洁转向', targetStars: 65, timeLimit: 5 * 60, desc: '限制工业排放，建成 3 座风电设施，环境达到 70、星空达到 65。' },
  { id: 4, name: '第四关：推广绿色出行', shortName: '绿色通勤', targetStars: 85, timeLimit: 5 * 60 + 15, desc: '建成 3 座地铁站并推广绿色出行，环境达到 75、星空达到 85。' },
  { id: 5, name: '第五关：低碳城市', shortName: '低碳样板', targetStars: 95, timeLimit: 5 * 60 + 30, desc: '建成 5 座太阳能电站，同时实施垃圾分类与碳预算，保持市民支持。' },
  { id: 6, name: '最终关：银河回归', shortName: '银河回归', targetStars: 100, timeLimit: 6 * 60, desc: '财政不少于 1200，环境与满意度达到 85，星空指数达到 100。' },
];

export const BUILDING_CONFIG: Record<BuildingType, BuildingConfig> = {
  residential: { cost: 100, env: -2, stars: -1, sat: 7, income: 10, upkeep: 2, name: '住宅区' },
  commercial: { cost: 180, env: -4, stars: -2, sat: 3, income: 24, upkeep: 4, name: '商业区' },
  industrial: { cost: 280, env: -14, stars: -10, sat: -6, income: 48, upkeep: 7, name: '工业区' },
  park: { cost: 140, env: 8, stars: 2, sat: 7, income: 0, upkeep: 5, name: '公园' },
  school: { cost: 220, env: 0, stars: 0, sat: 10, income: 0, upkeep: 8, name: '学校' },
  subway: { cost: 380, env: 6, stars: 2, sat: 13, income: 3, upkeep: 13, name: '地铁站' },
  wind: { cost: 240, env: 8, stars: 4, sat: 0, income: 2, upkeep: 6, name: '风力发电' },
  solar: { cost: 280, env: 10, stars: 7, sat: 0, income: 3, upkeep: 7, name: '太阳能电站' },
  hospital: { cost: 320, env: 0, stars: -1, sat: 14, income: 0, upkeep: 13, name: '医院' },
  police: { cost: 260, env: 0, stars: -1, sat: 10, income: 0, upkeep: 9, name: '警察局' },
  fire_station: { cost: 260, env: 0, stars: -1, sat: 10, income: 0, upkeep: 9, name: '消防站' },
  library: { cost: 210, env: 1, stars: 1, sat: 10, income: 0, upkeep: 7, name: '图书馆' },
  luxury_residential: { cost: 480, env: -4, stars: -3, sat: 13, income: 25, upkeep: 7, name: '生态住宅小区' },
  skyscraper: { cost: 760, env: -9, stars: -9, sat: 6, income: 65, upkeep: 12, name: '商业中心' },
  stadium: { cost: 580, env: -5, stars: -5, sat: 18, income: 16, upkeep: 10, name: '体育场' },
};

export const POLICY_CONFIG: Record<string, PolicyConfig> = {
  local_business: { cost: 90, env: -1, stars: -1, sat: 4, income: 9, name: '鼓励本地消费', source: '市民' },
  community_events: { cost: 100, env: 0, stars: 0, sat: 9, income: 0, name: '推广社区活动', source: '市民' },
  recycle: { cost: 110, env: 12, stars: 2, sat: 3, income: 0, name: '实施垃圾分类', source: '市民' },
  limit_industry: { cost: 80, env: 11, stars: 4, sat: -5, income: -9, name: '限制工业排放', source: '专家' },
  led_lights: { cost: 180, env: 1, stars: 13, sat: 2, income: 0, name: '推广 LED 路灯', source: '专家' },
  limit_lights: { cost: 70, env: 1, stars: 16, sat: -7, income: -5, name: '控制夜间照明', source: '专家' },
  green_travel: { cost: 150, env: 10, stars: 4, sat: 8, income: 0, name: '鼓励绿色出行', source: '国际' },
  carbon_budget: { cost: 180, env: 16, stars: 5, sat: -3, income: -3, name: '碳排放预算', source: '国际' },
  green_standard: { cost: 210, env: 8, stars: 9, sat: 3, income: 0, name: '国际绿色标准', source: '国际' },
  clean_enterprise: { cost: 130, env: 9, stars: 4, sat: 2, income: -5, name: '企业节能减排', source: '企业' },
  lights_out_hour: { cost: 80, env: 2, stars: 12, sat: -3, income: 0, name: '关灯一小时', source: '市民' },
  star_party: { cost: 110, env: 0, stars: 5, sat: 11, income: 0, name: '星空音乐会', source: '市民' },
};

const buildingCount = (state: RuleSnapshot, type: BuildingType) => state.buildings.filter((building) => building.type === type).length;

const objective = (id: string, label: string, current: number, target: number): ObjectiveProgress => ({
  id,
  label,
  current,
  target,
  completed: current >= target,
});

const policyObjective = (state: RuleSnapshot, id: string, label: string): ObjectiveProgress => objective(id, label, state.activePolicies.includes(id) ? 1 : 0, 1);

export function getLevelObjectives(state: RuleSnapshot): ObjectiveProgress[] {
  const targetStars = LEVELS[state.currentLevel - 1]?.targetStars ?? 100;
  const stars = objective('stars', `星空指数达到 ${targetStars}`, state.stars, targetStars);

  switch (state.currentLevel) {
    case 1:
      return [
        objective('residential', '住宅区达到 5 座', buildingCount(state, 'residential'), 5),
        objective('commercial', '商业区达到 3 座', buildingCount(state, 'commercial'), 3),
        objective('park', '公园达到 3 座', buildingCount(state, 'park'), 3),
        stars,
      ];
    case 2:
      return [
        policyObjective(state, 'led_lights', '推广 LED 路灯'),
        policyObjective(state, 'limit_lights', '控制夜间照明'),
        objective('environment', '环境指数达到 60', state.environment, 60),
        stars,
      ];
    case 3:
      return [
        policyObjective(state, 'limit_industry', '限制工业排放'),
        objective('wind', '风力发电达到 3 座', buildingCount(state, 'wind'), 3),
        objective('environment', '环境指数达到 70', state.environment, 70),
        stars,
      ];
    case 4:
      return [
        objective('subway', '地铁站达到 3 座', buildingCount(state, 'subway'), 3),
        policyObjective(state, 'green_travel', '鼓励绿色出行'),
        objective('environment', '环境指数达到 75', state.environment, 75),
        stars,
      ];
    case 5:
      return [
        objective('solar', '太阳能电站达到 5 座', buildingCount(state, 'solar'), 5),
        policyObjective(state, 'recycle', '实施垃圾分类'),
        policyObjective(state, 'carbon_budget', '实施碳排放预算'),
        objective('environment', '环境指数达到 85', state.environment, 85),
        objective('satisfaction', '满意度达到 75', state.satisfaction, 75),
        stars,
      ];
    case 6:
      return [
        objective('money', '财政保持 1200', state.money, 1200),
        objective('environment', '环境指数达到 85', state.environment, 85),
        objective('satisfaction', '满意度达到 85', state.satisfaction, 85),
        stars,
      ];
    default:
      return [stars];
  }
}

export function isLevelComplete(state: RuleSnapshot): boolean {
  return getLevelObjectives(state).every((item) => item.completed);
}

export function getLevelTime(level: number): number {
  return LEVELS.find((item) => item.id === level)?.timeLimit ?? LEVELS[0].timeLimit;
}

export function formatLevelDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`;
}

export interface LevelCompletionProgress {
  clearedLevel: number;
  completedLevels: number[];
  maxUnlockedLevel: number;
  isFinal: boolean;
}

export interface NextLevelTransition {
  currentLevel: number;
  timeLeft: number;
  reward: number;
  money: number;
}

export const getLevelReward = (clearedLevel: number) => 350 + clearedLevel * 75;

export function resolveLevelProgress(clearedLevel: number, completedLevels: number[], maxUnlockedLevel: number): LevelCompletionProgress {
  const normalizedLevel = Math.max(1, Math.min(MAX_LEVEL, Math.round(clearedLevel)));
  return {
    clearedLevel: normalizedLevel,
    completedLevels: Array.from(new Set([...completedLevels, normalizedLevel])).sort((a, b) => a - b),
    maxUnlockedLevel: Math.max(maxUnlockedLevel, Math.min(MAX_LEVEL, normalizedLevel + 1)),
    isFinal: normalizedLevel === MAX_LEVEL,
  };
}

export function getNextLevelTransition(clearedLevel: number, currentMoney: number): NextLevelTransition | null {
  if (clearedLevel < 1 || clearedLevel >= MAX_LEVEL) return null;
  const currentLevel = clearedLevel + 1;
  const reward = getLevelReward(clearedLevel);
  return {
    currentLevel,
    timeLeft: getLevelTime(currentLevel),
    reward,
    money: currentMoney + reward,
  };
}
