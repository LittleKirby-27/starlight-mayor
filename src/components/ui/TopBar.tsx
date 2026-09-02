import type { ReactNode } from 'react';
import { Award, Cloud, CloudFog, CloudRain, Clock, DollarSign, Leaf, Lightbulb, Monitor, Music2, Pause, Play, Smile, Sparkles, Sun, Volume2, VolumeX } from 'lucide-react';
import { getAudioTheme } from '../../audio/audioThemes';
import { useGameStore, WeatherType } from '../../store/gameStore';

const WeatherIcon = ({ weather }: { weather: WeatherType }) => {
  if (weather === 'cloudy') return <Cloud size={18} className="text-slate-200" />;
  if (weather === 'rainy') return <CloudRain size={18} className="text-sky-300" />;
  if (weather === 'foggy') return <CloudFog size={18} className="text-zinc-300" />;
  return <Sun size={18} className="text-amber-300" />;
};

const weatherLabels: Record<WeatherType, string> = {
  sunny: '晴朗',
  cloudy: '多云',
  rainy: '降雨',
  foggy: '雾霾',
};

export function TopBar({ onOpenAchievements, onOpenAudioSettings }: { onOpenAchievements: () => void; onOpenAudioSettings: () => void }) {
  const money = useGameStore((state) => state.money);
  const environment = useGameStore((state) => state.environment);
  const lightPollution = useGameStore((state) => state.lightPollution);
  const stars = useGameStore((state) => state.stars);
  const satisfaction = useGameStore((state) => state.satisfaction);
  const day = useGameStore((state) => state.day);
  const isNight = useGameStore((state) => state.isNight);
  const weather = useGameStore((state) => state.weather);
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);
  const setGraphicsQuality = useGameStore((state) => state.setGraphicsQuality);
  const timeLeft = useGameStore((state) => state.timeLeft);
  const isPaused = useGameStore((state) => state.isPaused);
  const setPaused = useGameStore((state) => state.setPaused);
  const audioEnabled = useGameStore((state) => state.audioEnabled);
  const audioTheme = useGameStore((state) => state.audioTheme);
  const toggleAudio = useGameStore((state) => state.toggleAudio);

  const minutes = Math.max(0, Math.floor(timeLeft / 60));
  const seconds = Math.max(0, timeLeft % 60);
  const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const timeTone = timeLeft < 120 ? 'text-red-300 animate-pulse' : timeLeft < 300 ? 'text-amber-200' : 'text-white';

  return (
    <div className="game-topbar pointer-events-none absolute left-1/2 top-4 z-20 flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#07101d]/72 p-2 text-white shadow-2xl backdrop-blur-xl">
      <button
        onClick={onOpenAchievements}
        className="pointer-events-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-white/15 bg-black/60 text-amber-300 transition-colors hover:bg-white/10"
        title="打开成就系统"
      >
        <Award size={20} />
      </button>

      <button
        onClick={() => setPaused(!isPaused)}
        className={`pointer-events-auto flex h-12 min-w-24 items-center justify-center rounded-xl border px-3 transition-colors ${isPaused ? 'border-amber-200/40 bg-amber-200/10 text-amber-100' : 'border-white/10 bg-black/30 text-slate-300 hover:text-white'}`}
        title={isPaused ? '继续游戏' : '暂停游戏'}
      >
        {isPaused ? <Play size={17} /> : <Pause size={17} />}
        <span className="ml-2 text-xs">{isPaused ? '继续' : '暂停'}</span>
      </button>

      <button
        onClick={toggleAudio}
        className="pointer-events-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-slate-300 transition-colors hover:text-white"
        title={audioEnabled ? '关闭音效' : '开启音效'}
      >
        {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      <button
        onClick={onOpenAudioSettings}
        className="pointer-events-auto flex h-12 min-w-28 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 px-3 text-slate-300 transition-colors hover:text-white"
        title="选择并试听声音方案"
      >
        <Music2 size={17} />
        <span className="ml-2 text-xs">{getAudioTheme(audioTheme).name}</span>
      </button>

      <Indicator icon={<DollarSign size={18} />} value={money} label="财政" color={money < 180 ? '#f87171' : '#facc15'} />
      <Indicator icon={<Lightbulb size={18} />} value={lightPollution} max={100} label="光污染↓" color={lightPollution > 65 ? '#f87171' : lightPollution > 35 ? '#fbbf24' : '#67e8f9'} />
      <Indicator icon={<Leaf size={18} />} value={environment} max={100} label="环境" color={environment < 30 ? '#f87171' : '#4ade80'} />
      <Indicator icon={<Sparkles size={18} />} value={stars} max={100} label="星空" color="#facc15" glow={stars > 80} />
      <Indicator icon={<Smile size={18} />} value={satisfaction} max={100} label="满意度" color={satisfaction < 35 ? '#f87171' : '#f8fafc'} />

      <div className={`flex h-12 min-w-24 items-center justify-center rounded-sm border border-white/15 bg-black/60 px-3 ${timeTone}`}>
        <Clock size={16} className="mr-2" />
        <span className="font-mono text-lg">{timeText}</span>
      </div>

      <div className="flex h-12 min-w-28 items-center justify-center rounded-sm border border-white/15 bg-black/60 px-3">
        <span className="mr-2 text-xs text-slate-400">DAY</span>
        <span className="mr-3 font-mono text-lg">{day}</span>
        <span className="rounded-sm bg-white/10 px-2 py-1 text-xs font-bold" style={{ color: isNight ? '#c4b5fd' : '#fde68a' }}>
          {isNight ? '夜晚' : '白天'}
        </span>
      </div>

      <div className="flex h-12 min-w-24 items-center justify-center rounded-sm border border-white/15 bg-black/60 px-3">
        <WeatherIcon weather={weather} />
        <span className="ml-2 text-xs text-slate-200">{weatherLabels[weather]}</span>
      </div>

      <button
        onClick={() => setGraphicsQuality(graphicsQuality === 'high' ? 'low' : 'high')}
        className="pointer-events-auto flex h-12 min-w-24 items-center justify-center rounded-sm border border-white/15 bg-black/60 px-3 text-slate-300 transition-colors hover:text-white"
        title="切换画质"
      >
        <Monitor size={18} />
        <span className="ml-2 text-xs font-mono">{graphicsQuality === 'high' ? 'HI' : 'LO'}</span>
      </button>
    </div>
  );
}

function Indicator({ icon, value, max, label, color, glow }: { icon: ReactNode; value: number; max?: number; label: string; color: string; glow?: boolean }) {
  return (
    <div className="pointer-events-auto flex h-12 min-w-28 items-center rounded-sm border border-white/15 bg-black/60 px-3">
      <div className="mr-2" style={{ color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] leading-none text-slate-400">{label}</div>
        <div className="mt-1 flex items-end font-mono">
          <span className="text-lg leading-none" style={{ color, textShadow: glow ? `0 0 12px ${color}` : 'none' }}>
            {value}
          </span>
          {max && <span className="mb-[1px] ml-1 text-xs leading-none text-slate-500">/{max}</span>}
        </div>
      </div>
    </div>
  );
}
