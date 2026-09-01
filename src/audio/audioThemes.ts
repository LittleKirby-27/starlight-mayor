export type AudioCue = 'level' | 'final' | 'failed' | 'achievement';

export type AudioThemeId = 'starlight' | 'strings' | 'city' | 'synth';

export interface AudioTheme {
  id: AudioThemeId;
  name: string;
  label: string;
  description: string;
  accent: string;
  tracks?: Record<AudioCue, { src: string; volume: number }>;
}

export const DEFAULT_AUDIO_THEME: AudioThemeId = 'starlight';

const audioAsset = (fileName: string) => `${import.meta.env?.BASE_URL ?? '/'}audio/${fileName}`;

export const AUDIO_THEMES: AudioTheme[] = [
  {
    id: 'starlight',
    name: '星河叙事',
    label: '舒展 · 温暖',
    description: '主通关曲、小提琴终章、轻柔失败提示与快速成就音。',
    accent: '#a5f3fc',
    tracks: {
      level: { src: audioAsset('level-complete.mp3'), volume: 0.72 },
      final: { src: audioAsset('galaxy-violin.mp3'), volume: 0.8 },
      failed: { src: audioAsset('game-failed.mp3'), volume: 0.58 },
      achievement: { src: audioAsset('achievement.mp3'), volume: 0.48 },
    },
  },
  {
    id: 'strings',
    name: '弦乐庆典',
    label: '古典 · 明亮',
    description: '短弦乐庆祝、小提琴终章，以及更清晰的提示音组合。',
    accent: '#ddd6fe',
    tracks: {
      level: { src: audioAsset('level-strings.mp3'), volume: 0.68 },
      final: { src: audioAsset('galaxy-violin.mp3'), volume: 0.8 },
      failed: { src: audioAsset('failed-alert.mp3'), volume: 0.52 },
      achievement: { src: audioAsset('achievement-short.mp3'), volume: 0.46 },
    },
  },
  {
    id: 'city',
    name: '轻快城市',
    label: '活力 · 现代',
    description: '节奏更鲜明的通关庆祝曲，适合短视频与公开试玩。',
    accent: '#fde68a',
    tracks: {
      level: { src: audioAsset('level-bright.mp3'), volume: 0.66 },
      final: { src: audioAsset('level-bright.mp3'), volume: 0.72 },
      failed: { src: audioAsset('game-failed.mp3'), volume: 0.55 },
      achievement: { src: audioAsset('achievement.mp3'), volume: 0.46 },
    },
  },
  {
    id: 'synth',
    name: '星尘合成',
    label: '原创 · 轻量',
    description: '不加载音乐文件，由浏览器实时生成清澈、短促的原创音效。',
    accent: '#86efac',
  },
];

export const isAudioThemeId = (value: unknown): value is AudioThemeId =>
  AUDIO_THEMES.some((theme) => theme.id === value);

export const getAudioTheme = (id: AudioThemeId) =>
  AUDIO_THEMES.find((theme) => theme.id === id) ?? AUDIO_THEMES[0];
