import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_AUDIO_THEME, isAudioThemeId, type AudioThemeId } from '../audio/audioThemes.ts';
import {
  BUILDING_CONFIG,
  getNextLevelTransition,
  getLevelTime,
  isLevelComplete,
  MAX_LEVEL,
  POLICY_CONFIG,
  resolveLevelProgress,
  type AchievementCategory,
  type BuildingType,
  type WeatherType,
} from '../game/rules.ts';

export { BUILDING_CONFIG, getLevelObjectives, LEVELS, POLICY_CONFIG, TURN_DURATION_MS } from '../game/rules.ts';
export type { AchievementCategory, BuildingType, LevelConfig, ObjectiveProgress, WeatherType } from '../game/rules.ts';
export type { AudioThemeId } from '../audio/audioThemes.ts';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
  rewardDesc: string;
}

export interface Building {
  id: string;
  type: BuildingType;
  x: number;
  z: number;
}

export interface GameState {
  money: number;
  environment: number;
  stars: number;
  satisfaction: number;
  currentLevel: number;
  maxUnlockedLevel: number;
  completedLevels: number[];
  isGameOver: boolean;
  gameResult: 'win' | 'lose' | null;
  failReason: string | null;
  levelComplete: number | null;
  isPaused: boolean;
  timeLeft: number;
  levelStartedAt: number;
  achievements: Achievement[];
  buildings: Building[];
  activePolicies: string[];
  graphicsQuality: 'high' | 'low';
  audioEnabled: boolean;
  audioTheme: AudioThemeId;
  day: number;
  isNight: boolean;
  weather: WeatherType;
  eventDays: number[];
  addBuilding: (building: Omit<Building, 'id'>) => boolean;
  activatePolicy: (policyId: string) => boolean;
  nextTurn: () => void;
  resetGame: () => void;
  retryCurrentLevel: () => void;
  continueToNextLevel: () => void;
  applyEventResult: (effect: { money?: number; environment?: number; stars?: number; satisfaction?: number }) => void;
  setCurrentLevel: (level: number) => void;
  checkWinLoss: () => void;
  addEventDay: (day: number) => void;
  setGraphicsQuality: (quality: 'high' | 'low') => void;
  toggleAudio: () => void;
  setAudioTheme: (theme: AudioThemeId) => void;
  setPaused: (paused: boolean) => void;
  tickTime: () => void;
  unlockAchievement: (id: string) => void;
  updateAchievementProgress: (id: string, amount: number) => void;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'clear_lvl1', title: '新城起步', description: '完成第一关，城市进入有序建设。', category: 'mixed', icon: 'check-circle', isUnlocked: false, progress: 0, maxProgress: 1, rewardDesc: '解锁第二关与 425 财政奖励' },
  { id: 'clear_lvl2', title: '灯光有边界', description: '完成第二关，让夜晚重新有了层次。', category: 'policy', icon: 'star', isUnlocked: false, progress: 0, maxProgress: 1, rewardDesc: '解锁工业治理任务' },
  { id: 'clear_lvl3', title: '清洁转向', description: '完成第三关，控制工业排放。', category: 'environmental', icon: 'leaf', isUnlocked: false, progress: 0, maxProgress: 1, rewardDesc: '解锁绿色交通任务' },
  { id: 'clear_lvl4', title: '绿色通勤', description: '完成第四关，公共交通成网。', category: 'construction', icon: 'wind', isUnlocked: false, progress: 0, maxProgress: 1, rewardDesc: '解锁低碳城市任务' },
  { id: 'clear_lvl5', title: '低碳样板', description: '完成第五关，低碳设施形成规模。', category: 'environmental', icon: 'globe', isUnlocked: false, progress: 0, maxProgress: 1, rewardDesc: '进入最终银河挑战' },
  { id: 'clear_all', title: '银河回归', description: '通关全部六个关卡。', category: 'mixed', icon: 'award', isUnlocked: false, progress: 0, maxProgress: 1, rewardDesc: '播放小提琴彩蛋曲' },
  { id: 'build_10', title: '城市骨架', description: '累计建成 10 座建筑。', category: 'construction', icon: 'hammer', isUnlocked: false, progress: 0, maxProgress: 10, rewardDesc: '规划经验提升' },
  { id: 'park_5', title: '口袋绿洲', description: '累计建成 5 座公园。', category: 'environmental', icon: 'tree', isUnlocked: false, progress: 0, maxProgress: 5, rewardDesc: '居民更愿意支持环保' },
  { id: 'clean_energy_7', title: '清洁能源网', description: '累计建成 7 座风电或太阳能设施。', category: 'environmental', icon: 'wind', isUnlocked: false, progress: 0, maxProgress: 7, rewardDesc: '星空指数更稳定' },
  { id: 'policy_5', title: '政策工具箱', description: '累计发布 5 项政策。', category: 'policy', icon: 'file-text', isUnlocked: false, progress: 0, maxProgress: 5, rewardDesc: '应急选择更从容' },
  { id: 'stars_100', title: '满天星河', description: '星空指数达到 100。', category: 'environmental', icon: 'star', isUnlocked: false, progress: 0, maxProgress: 100, rewardDesc: '夜空视觉达到最高级' },
  { id: 'money_3000', title: '财政稳健', description: '财政达到 3000。', category: 'economic', icon: 'piggy-bank', isUnlocked: false, progress: 0, maxProgress: 3000, rewardDesc: '城市投资信心提升' },
  { id: 'all_90', title: '平衡大师', description: '三项指数达到 90 且财政超过 900。', category: 'mixed', icon: 'shield', isUnlocked: false, progress: 0, maxProgress: 1, rewardDesc: '完美治理证明' },
];

const initialBuildings: Building[] = [
  { id: 'init_1', type: 'skyscraper', x: 0, z: 0 },
  { id: 'init_2', type: 'commercial', x: 4, z: 0 },
  { id: 'init_3', type: 'commercial', x: -4, z: 0 },
  { id: 'init_4', type: 'residential', x: 0, z: 4 },
  { id: 'init_5', type: 'residential', x: 0, z: -4 },
  { id: 'init_6', type: 'park', x: -4, z: -4 },
  { id: 'init_7', type: 'park', x: 4, z: 4 },
  { id: 'init_8', type: 'school', x: -8, z: 4 },
  { id: 'init_9', type: 'hospital', x: 8, z: -4 },
];

const cloneAchievements = (source = ACHIEVEMENTS) => source.map((achievement) => ({ ...achievement }));
const cloneBuildings = () => initialBuildings.map((building) => ({ ...building }));
const clampIndex = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const emit = (name: string, detail?: unknown) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(name, { detail }));
};

const nextWeather = (day: number, stars: number): WeatherType => {
  if (day % 11 === 0) return 'foggy';
  if (day % 7 === 0) return 'rainy';
  if (stars < 35 && day % 4 === 0) return 'cloudy';
  return 'sunny';
};

const startingState = (level: number) => ({
  money: 1000 + (level - 1) * 450,
  environment: Math.min(72, 52 + (level - 1) * 4),
  stars: Math.min(78, 18 + (level - 1) * 12),
  satisfaction: Math.min(75, 60 + (level - 1) * 3),
  currentLevel: level,
  isGameOver: false,
  gameResult: null as 'win' | 'lose' | null,
  failReason: null as string | null,
  levelComplete: null as number | null,
  isPaused: false,
  timeLeft: getLevelTime(level),
  levelStartedAt: Date.now(),
  buildings: cloneBuildings(),
  activePolicies: [] as string[],
  day: 1,
  isNight: false,
  weather: 'sunny' as WeatherType,
  eventDays: [] as number[],
});

const INITIAL_META = {
  maxUnlockedLevel: 1,
  completedLevels: [] as number[],
  achievements: cloneAchievements(),
  graphicsQuality: 'high' as 'high' | 'low',
  audioEnabled: true,
  audioTheme: DEFAULT_AUDIO_THEME,
};

export const INITIAL_STATE = { ...startingState(1), ...INITIAL_META };

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      addBuilding: (building) => {
        const state = get();
        const config = BUILDING_CONFIG[building.type];
        if (state.isPaused || state.isGameOver || state.money < config.cost) return false;
        if (state.buildings.some((item) => Math.hypot(item.x - building.x, item.z - building.z) < 1.8)) return false;

        set((current) => ({
          money: current.money - config.cost,
          environment: clampIndex(current.environment + config.env),
          stars: clampIndex(current.stars + config.stars),
          satisfaction: clampIndex(current.satisfaction + config.sat),
          buildings: [...current.buildings, { ...building, id: crypto.randomUUID() }],
        }));

        get().updateAchievementProgress('build_10', 1);
        if (building.type === 'park') get().updateAchievementProgress('park_5', 1);
        if (building.type === 'wind' || building.type === 'solar') get().updateAchievementProgress('clean_energy_7', 1);
        emit('game-action', { type: 'build' });
        get().checkWinLoss();
        return true;
      },

      activatePolicy: (policyId) => {
        const state = get();
        const config = POLICY_CONFIG[policyId];
        if (state.isPaused || state.isGameOver || !config || state.activePolicies.includes(policyId) || state.money < config.cost) return false;

        set((current) => ({
          money: current.money - config.cost,
          environment: clampIndex(current.environment + config.env),
          stars: clampIndex(current.stars + config.stars),
          satisfaction: clampIndex(current.satisfaction + config.sat),
          activePolicies: [...current.activePolicies, policyId],
        }));

        get().updateAchievementProgress('policy_5', 1);
        emit('game-action', { type: 'policy' });
        get().checkWinLoss();
        return true;
      },

      applyEventResult: (effect) => {
        set((current) => ({
          money: current.money + (effect.money ?? 0),
          environment: clampIndex(current.environment + (effect.environment ?? 0)),
          stars: clampIndex(current.stars + (effect.stars ?? 0)),
          satisfaction: clampIndex(current.satisfaction + (effect.satisfaction ?? 0)),
        }));
        emit('game-action', { type: 'event' });
        get().checkWinLoss();
      },

      nextTurn: () => {
        const state = get();
        if (state.isPaused || state.isGameOver || state.levelComplete) return;

        let turnIncome = 0;
        let environmentDrift = -Math.floor(state.currentLevel / 3);
        let starsDrift = state.isNight ? 1 : 0;

        state.buildings.forEach((building) => {
          const config = BUILDING_CONFIG[building.type];
          let income = config.income - config.upkeep;
          if (building.type === 'industrial') {
            const regulated = state.activePolicies.includes('limit_industry');
            environmentDrift -= regulated ? 1 : 3;
            starsDrift -= regulated ? 1 : 2;
            if (regulated) income = Math.floor(income * 0.65);
          }
          if (building.type === 'commercial' && state.activePolicies.includes('limit_lights')) income = Math.floor(income * 0.85);
          if (building.type === 'park' || building.type === 'wind' || building.type === 'solar') environmentDrift += 1;
          turnIncome += income;
        });

        state.activePolicies.forEach((policyId) => {
          turnIncome += POLICY_CONFIG[policyId]?.income ?? 0;
        });
        if (state.activePolicies.includes('green_travel')) environmentDrift += 2;
        if (state.activePolicies.includes('recycle')) environmentDrift += 2;
        if (state.activePolicies.includes('led_lights')) starsDrift += 1;
        if (state.activePolicies.includes('limit_lights')) starsDrift += state.isNight ? 3 : 1;
        if (state.activePolicies.includes('lights_out_hour')) starsDrift += state.isNight ? 4 : 1;
        if (state.activePolicies.includes('carbon_budget')) environmentDrift += 2;

        set((current) => ({
          day: current.day + 1,
          isNight: !current.isNight,
          weather: nextWeather(current.day + 1, current.stars),
          money: current.money + turnIncome,
          environment: clampIndex(current.environment + environmentDrift),
          stars: clampIndex(current.stars + starsDrift),
        }));
        get().checkWinLoss();
      },

      checkWinLoss: () => {
        const state = get();
        if (state.isGameOver || state.levelComplete) return;

        const lose = (reason: string) => {
          set({ isGameOver: true, gameResult: 'lose', failReason: reason, isPaused: true });
          emit('game-failed', { level: state.currentLevel, reason });
        };

        if (state.environment <= 0) return lose('环境指数归零，城市陷入严重污染。');
        if (state.stars <= 0) return lose('星空指数归零，光污染吞没了夜空。');
        if (state.satisfaction <= 0) return lose('居民满意度归零，市民不再支持你的治理方案。');
        if (state.money <= 0) return lose('财政归零，城市建设被迫停摆。');
        if (state.timeLeft <= 0) return lose('超出时间限制，当前关卡目标没有完成。');

        if (!isLevelComplete(state)) {
          if (state.money >= 3000) get().updateAchievementProgress('money_3000', state.money);
          if (state.stars >= 100) get().updateAchievementProgress('stars_100', state.stars);
          if (state.money >= 900 && state.environment >= 90 && state.stars >= 90 && state.satisfaction >= 90) get().unlockAchievement('all_90');
          return;
        }

        const clearedLevel = state.currentLevel;
        get().unlockAchievement(clearedLevel === MAX_LEVEL ? 'clear_all' : `clear_lvl${clearedLevel}`);
        const progress = resolveLevelProgress(clearedLevel, state.completedLevels, state.maxUnlockedLevel);

        if (progress.isFinal) {
          set({ completedLevels: progress.completedLevels, maxUnlockedLevel: progress.maxUnlockedLevel, isGameOver: true, gameResult: 'win', isPaused: true });
          emit('game-won', { level: clearedLevel });
          return;
        }

        set({ completedLevels: progress.completedLevels, maxUnlockedLevel: progress.maxUnlockedLevel, levelComplete: clearedLevel, isPaused: true });
        emit('game-level-complete', { level: clearedLevel });
      },

      continueToNextLevel: () => {
        const state = get();
        if (!state.levelComplete) return;
        const transition = getNextLevelTransition(state.levelComplete, state.money);
        if (!transition) return;
        set({
          currentLevel: transition.currentLevel,
          timeLeft: transition.timeLeft,
          levelStartedAt: Date.now(),
          levelComplete: null,
          isPaused: false,
          eventDays: [],
          money: transition.money,
        });
        emit('game-level-start', { level: transition.currentLevel });
      },

      setCurrentLevel: (level) => {
        const state = get();
        const target = Math.max(1, Math.min(MAX_LEVEL, level));
        if (target > state.maxUnlockedLevel) return;
        set({
          ...startingState(target),
          achievements: state.achievements?.length ? state.achievements : cloneAchievements(),
          maxUnlockedLevel: state.maxUnlockedLevel,
          completedLevels: state.completedLevels,
          graphicsQuality: state.graphicsQuality,
          audioEnabled: state.audioEnabled,
          audioTheme: state.audioTheme,
        });
      },

      retryCurrentLevel: () => {
        const state = get();
        set({
          ...startingState(state.currentLevel),
          achievements: state.achievements,
          maxUnlockedLevel: state.maxUnlockedLevel,
          completedLevels: state.completedLevels,
          graphicsQuality: state.graphicsQuality,
          audioEnabled: state.audioEnabled,
          audioTheme: state.audioTheme,
        });
      },

      tickTime: () => {
        const state = get();
        if (state.isPaused || state.isGameOver || state.levelComplete) return;
        set({ timeLeft: Math.max(0, state.timeLeft - 1) });
        get().checkWinLoss();
      },

      unlockAchievement: (id) => {
        set((state) => ({
          achievements: (state.achievements?.length ? state.achievements : cloneAchievements()).map((achievement) => {
            if (achievement.id !== id || achievement.isUnlocked) return achievement;
            const unlocked = { ...achievement, isUnlocked: true, progress: achievement.maxProgress };
            emit('achievement-unlocked', unlocked);
            return unlocked;
          }),
        }));
      },

      updateAchievementProgress: (id, amount) => {
        set((state) => ({
          achievements: (state.achievements?.length ? state.achievements : cloneAchievements()).map((achievement) => {
            if (achievement.id !== id || achievement.isUnlocked) return achievement;
            const absolute = id === 'stars_100' || id === 'money_3000';
            const progress = Math.min(achievement.maxProgress, absolute ? amount : achievement.progress + amount);
            if (progress >= achievement.maxProgress) {
              const unlocked = { ...achievement, progress, isUnlocked: true };
              emit('achievement-unlocked', unlocked);
              return unlocked;
            }
            return { ...achievement, progress };
          }),
        }));
      },

      setPaused: (paused) => {
        const state = get();
        if (state.isGameOver || state.levelComplete) return;
        set({ isPaused: paused });
      },
      addEventDay: (day) => set((state) => ({ eventDays: [...state.eventDays, day] })),
      setGraphicsQuality: (quality) => set({ graphicsQuality: quality }),
      toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),
      setAudioTheme: (audioTheme) => set({ audioTheme }),
      resetGame: () => {
        const state = get();
        set({
          ...startingState(1),
          achievements: state.achievements?.length ? state.achievements : cloneAchievements(),
          maxUnlockedLevel: state.maxUnlockedLevel,
          completedLevels: state.completedLevels,
          graphicsQuality: state.graphicsQuality,
          audioEnabled: state.audioEnabled,
          audioTheme: state.audioTheme,
        });
      },
    }),
    {
      name: 'starlight-mayor-storage',
      version: 4,
      migrate: (persisted) => {
        const previous = (persisted ?? {}) as Partial<GameState>;
        return {
          ...INITIAL_STATE,
          ...previous,
          levelComplete: null,
          isPaused: false,
          isGameOver: false,
          gameResult: null,
          failReason: null,
          timeLeft: previous.timeLeft && previous.timeLeft > 0 ? previous.timeLeft : getLevelTime(previous.currentLevel ?? 1),
          maxUnlockedLevel: previous.maxUnlockedLevel ?? 1,
          completedLevels: previous.completedLevels ?? [],
          achievements: previous.achievements?.length ? previous.achievements : cloneAchievements(),
          audioTheme: isAudioThemeId(previous.audioTheme) ? previous.audioTheme : DEFAULT_AUDIO_THEME,
        };
      },
    },
  ),
);
