import type { RetrofitType } from './lighting.ts';

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
  direction?: 'atLeast' | 'atMost';
}

export interface RuleSnapshot {
  currentLevel: number;
  money: number;
  environment: number;
  stars: number;
  satisfaction: number;
  lightPollution: number;
  residentialComplaints: number;
  auditedBuildingIds: string[];
  activeChallengeId: string | null;
  buildings: Array<{ id?: string; type: BuildingType; retrofits?: RetrofitType[] }>;
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
  lightReduction: number;
  name: string;
  source: '市民' | '专家' | '国际' | '企业';
}

export const TURN_DURATION_MS = 30_000;
export const EVENT_RESPONSE_SECONDS = 60;
export const MAX_LEVEL = 6;

export const LEVELS: LevelConfig[] = [
  { id: 1, name: '第一关：寻找消失的星星', shortName: '夜间巡查', targetStars: 48, timeLimit: 4 * 60 + 30, desc: '进入照明巡查模式，识别主要漏光建筑并完成第一批遮光改造。' },
  { id: 2, name: '第二关：让灯光照向地面', shortName: '灯光有边界', targetStars: 58, timeLimit: 4 * 60 + 45, desc: '用全遮光灯具减少向上光，在不牺牲基本照明的情况下恢复夜空。' },
  { id: 3, name: '第三关：告别刺眼冷白光', shortName: '暖色夜晚', targetStars: 66, timeLimit: 5 * 60, desc: '更换暖色低蓝光灯，并开始关闭无人使用时段的多余照明。' },
  { id: 4, name: '第四关：深夜不必一直明亮', shortName: '按需照明', targetStars: 74, timeLimit: 5 * 60 + 15, desc: '利用定时熄灯和智能调光控制照明时段，同时处理住宅区受到的干扰。' },
  { id: 5, name: '第五关：治理招牌与泛光灯', shortName: '区域控光', targetStars: 82, timeLimit: 5 * 60 + 30, desc: '治理商业招牌、体育场和高层建筑泛光，建立全城照明规则。' },
  { id: 6, name: '最终关：银河回归', shortName: '银河回归', targetStars: 90, timeLimit: 6 * 60, desc: '在财政与居民支持约束下完成全城照明治理，迎接流星雨观测。' },
];

export const BUILDING_CONFIG: Record<BuildingType, BuildingConfig> = {
  residential: { cost: 100, env: -2, stars: 0, sat: 7, income: 10, upkeep: 2, name: '住宅区' },
  commercial: { cost: 180, env: -4, stars: 0, sat: 3, income: 24, upkeep: 4, name: '商业区' },
  industrial: { cost: 280, env: -14, stars: 0, sat: -6, income: 48, upkeep: 7, name: '工业区' },
  park: { cost: 140, env: 8, stars: 0, sat: 7, income: 0, upkeep: 5, name: '公园' },
  school: { cost: 220, env: 0, stars: 0, sat: 10, income: 0, upkeep: 8, name: '学校' },
  subway: { cost: 380, env: 6, stars: 0, sat: 13, income: 3, upkeep: 13, name: '地铁站' },
  wind: { cost: 240, env: 8, stars: 0, sat: 0, income: 2, upkeep: 6, name: '风力发电' },
  solar: { cost: 280, env: 10, stars: 0, sat: 0, income: 3, upkeep: 7, name: '太阳能电站' },
  hospital: { cost: 320, env: 0, stars: 0, sat: 14, income: 0, upkeep: 13, name: '医院' },
  police: { cost: 260, env: 0, stars: 0, sat: 10, income: 0, upkeep: 9, name: '警察局' },
  fire_station: { cost: 260, env: 0, stars: 0, sat: 10, income: 0, upkeep: 9, name: '消防站' },
  library: { cost: 210, env: 1, stars: 0, sat: 10, income: 0, upkeep: 7, name: '图书馆' },
  luxury_residential: { cost: 480, env: -4, stars: 0, sat: 13, income: 25, upkeep: 7, name: '生态住宅小区' },
  skyscraper: { cost: 760, env: -9, stars: 0, sat: 6, income: 65, upkeep: 12, name: '商业中心' },
  stadium: { cost: 580, env: -5, stars: 0, sat: 18, income: 16, upkeep: 10, name: '体育场' },
};

export const POLICY_CONFIG: Record<string, PolicyConfig> = {
  local_business: { cost: 90, env: -1, stars: 0, sat: 4, income: 9, lightReduction: -2, name: '延长夜市营业', source: '市民' },
  community_events: { cost: 100, env: 0, stars: 0, sat: 9, income: 0, lightReduction: -1, name: '推广社区夜间活动', source: '市民' },
  recycle: { cost: 110, env: 12, stars: 0, sat: 3, income: 0, lightReduction: 0, name: '实施垃圾分类', source: '市民' },
  limit_industry: { cost: 80, env: 11, stars: 0, sat: -5, income: -9, lightReduction: 3, name: '限制工业夜间运行', source: '专家' },
  led_lights: { cost: 180, env: 1, stars: 0, sat: 2, income: 0, lightReduction: 12, name: '推广全遮光路灯', source: '专家' },
  limit_lights: { cost: 90, env: 1, stars: 0, sat: -4, income: -5, lightReduction: 14, name: '设置深夜照明时段', source: '专家' },
  green_travel: { cost: 150, env: 10, stars: 0, sat: 8, income: 0, lightReduction: 2, name: '鼓励绿色出行', source: '国际' },
  carbon_budget: { cost: 180, env: 16, stars: 0, sat: -3, income: -3, lightReduction: 2, name: '碳排放预算', source: '国际' },
  green_standard: { cost: 210, env: 8, stars: 0, sat: 3, income: 0, lightReduction: 8, name: '暗夜友好照明标准', source: '国际' },
  clean_enterprise: { cost: 130, env: 9, stars: 0, sat: 2, income: -5, lightReduction: 5, name: '企业夜间节能改造', source: '企业' },
  lights_out_hour: { cost: 80, env: 2, stars: 0, sat: -3, income: 0, lightReduction: 15, name: '非必要照明熄灯', source: '市民' },
  star_party: { cost: 110, env: 0, stars: 0, sat: 11, income: 0, lightReduction: -3, name: '星空音乐会', source: '市民' },
  warm_light_standard: { cost: 160, env: 1, stars: 0, sat: 3, income: -2, lightReduction: 10, name: '暖色低蓝光标准', source: '专家' },
  billboard_rules: { cost: 150, env: 0, stars: 0, sat: -2, income: -4, lightReduction: 12, name: '商业招牌亮度上限', source: '专家' },
  smart_lighting: { cost: 220, env: 2, stars: 0, sat: 5, income: -3, lightReduction: 14, name: '全城智能调光网络', source: '国际' },
};

const objective = (id: string, label: string, current: number, target: number): ObjectiveProgress => ({
  id,
  label,
  current,
  target,
  completed: current >= target,
  direction: 'atLeast',
});

const objectiveAtMost = (id: string, label: string, current: number, target: number): ObjectiveProgress => ({
  id,
  label,
  current,
  target,
  completed: current <= target,
  direction: 'atMost',
});

const policyObjective = (state: RuleSnapshot, id: string, label: string): ObjectiveProgress => objective(id, label, state.activePolicies.includes(id) ? 1 : 0, 1);

const retrofitCount = (state: RuleSnapshot, type?: RetrofitType) => state.buildings.reduce((total, building) => (
  total + (type ? (building.retrofits?.includes(type) ? 1 : 0) : (building.retrofits?.length ?? 0))
), 0);

const distinctRetrofitTypes = (state: RuleSnapshot) => new Set(state.buildings.flatMap((building) => building.retrofits ?? [])).size;

export interface ChallengeOption {
  id: 'night_audit' | 'precision_budget' | 'resident_night';
  name: string;
  desc: string;
  badge: string;
}

export function getChallengeOptions(level: number): ChallengeOption[] {
  const auditTarget = Math.min(10, 3 + level);
  const retrofitTarget = 2 + level;
  const pollutionTarget = Math.max(24, 60 - level * 6);
  const satisfactionTarget = 60 + level * 3;
  return [
    {
      id: 'night_audit',
      name: '暗夜审计',
      badge: '调查难度高',
      desc: `至少巡查 ${auditTarget} 座建筑，并累计完成 ${retrofitTarget} 项照明改造。`,
    },
    {
      id: 'precision_budget',
      name: '精准控光',
      badge: '规划难度高',
      desc: `将光污染压至 ${pollutionTarget} 以下，使用多类改造并保留足够财政。`,
    },
    {
      id: 'resident_night',
      name: '居民安夜',
      badge: '区位难度高',
      desc: `消除住宅严重干扰，完成重点遮光，并让满意度达到 ${satisfactionTarget}。`,
    },
  ];
}

export function getChallengeObjectives(state: RuleSnapshot): ObjectiveProgress[] {
  const level = state.currentLevel;
  if (state.activeChallengeId === 'night_audit') {
    return [
      objective('challenge_audits', `挑战：巡查 ${Math.min(10, 3 + level)} 座建筑`, state.auditedBuildingIds.length, Math.min(10, 3 + level)),
      objective('challenge_retrofits', `挑战：累计完成 ${2 + level} 项改造`, retrofitCount(state), 2 + level),
    ];
  }
  if (state.activeChallengeId === 'precision_budget') {
    return [
      objectiveAtMost('challenge_pollution', `挑战：光污染不高于 ${Math.max(24, 60 - level * 6)}`, state.lightPollution, Math.max(24, 60 - level * 6)),
      objective('challenge_variety', `挑战：使用 ${Math.min(4, 2 + Math.ceil(level / 2))} 类改造`, distinctRetrofitTypes(state), Math.min(4, 2 + Math.ceil(level / 2))),
      objective('challenge_money', `挑战：财政保持 ${250 + level * 100}`, state.money, 250 + level * 100),
    ];
  }
  if (state.activeChallengeId === 'resident_night') {
    return [
      objectiveAtMost('challenge_complaints', `挑战：住宅严重干扰不超过 ${level <= 2 ? 1 : 0}`, state.residentialComplaints, level <= 2 ? 1 : 0),
      objective('challenge_shielding', `挑战：完成 ${2 + Math.ceil(level / 2)} 处重点遮光`, retrofitCount(state, 'shielding'), 2 + Math.ceil(level / 2)),
      objective('challenge_satisfaction', `挑战：满意度达到 ${60 + level * 3}`, state.satisfaction, 60 + level * 3),
    ];
  }
  return [];
}

export function getLevelObjectives(state: RuleSnapshot): ObjectiveProgress[] {
  const targetStars = LEVELS[state.currentLevel - 1]?.targetStars ?? 100;
  const stars = objective('stars', `星空指数达到 ${targetStars}`, state.stars, targetStars);
  let core: ObjectiveProgress[];

  switch (state.currentLevel) {
    case 1:
      core = [
        objective('audit', '完成 3 座建筑照明巡查', state.auditedBuildingIds.length, 3),
        objective('retrofit', '完成 2 项照明改造', retrofitCount(state), 2),
        objectiveAtMost('light_pollution', '光污染降至 60 以下', state.lightPollution, 60),
        stars,
      ];
      break;
    case 2:
      core = [
        objective('shielding', '完成 3 处全遮光改造', retrofitCount(state, 'shielding'), 3),
        objective('warm_light', '完成 2 处暖色灯改造', retrofitCount(state, 'warm_light'), 2),
        objectiveAtMost('light_pollution', '光污染降至 50 以下', state.lightPollution, 50),
        stars,
      ];
      break;
    case 3:
      core = [
        objective('warm_light', '累计完成 4 处暖色灯改造', retrofitCount(state, 'warm_light'), 4),
        objective('timer', '累计完成 3 处定时熄灯', retrofitCount(state, 'timer'), 3),
        policyObjective(state, 'warm_light_standard', '发布暖色低蓝光标准'),
        objectiveAtMost('light_pollution', '光污染降至 42 以下', state.lightPollution, 42),
        stars,
      ];
      break;
    case 4:
      core = [
        objective('timer', '累计完成 5 处定时熄灯', retrofitCount(state, 'timer'), 5),
        objective('smart_dimming', '累计完成 3 处智能调光', retrofitCount(state, 'smart_dimming'), 3),
        objectiveAtMost('complaints', '住宅严重干扰不超过 1 条', state.residentialComplaints, 1),
        objectiveAtMost('light_pollution', '光污染降至 34 以下', state.lightPollution, 34),
        stars,
      ];
      break;
    case 5:
      core = [
        policyObjective(state, 'billboard_rules', '发布商业招牌亮度上限'),
        objective('retrofit_variety', '使用全部 4 类照明改造', distinctRetrofitTypes(state), 4),
        objective('retrofit_total', '累计完成 12 项照明改造', retrofitCount(state), 12),
        objectiveAtMost('light_pollution', '光污染降至 26 以下', state.lightPollution, 26),
        stars,
      ];
      break;
    case 6:
      core = [
        policyObjective(state, 'smart_lighting', '建成全城智能调光网络'),
        objective('shielding', '累计完成 6 处全遮光改造', retrofitCount(state, 'shielding'), 6),
        objective('timer', '累计完成 6 处定时熄灯', retrofitCount(state, 'timer'), 6),
        objective('smart_dimming', '累计完成 4 处智能调光', retrofitCount(state, 'smart_dimming'), 4),
        objectiveAtMost('complaints', '消除住宅严重灯光干扰', state.residentialComplaints, 0),
        objectiveAtMost('light_pollution', '光污染降至 18 以下', state.lightPollution, 18),
        objective('money', '财政保持 900', state.money, 900),
        objective('satisfaction', '满意度达到 70', state.satisfaction, 70),
        stars,
      ];
      break;
    default:
      core = [stars];
  }

  return [...core, ...getChallengeObjectives(state)];
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
