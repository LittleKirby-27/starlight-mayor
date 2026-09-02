import type { ReactNode } from 'react';
import { Check, ChevronRight, Clock3, Headphones, Lock, MessageSquareText, MoonStar, Play, ShieldCheck, Sparkles } from 'lucide-react';
import { formatLevelDuration } from '../../game/rules';
import { LEVELS, useGameStore } from '../../store/gameStore';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenFeedback: () => void;
  onOpenAudioSettings: () => void;
}

export function MainMenu({ onStartGame, onOpenFeedback, onOpenAudioSettings }: MainMenuProps) {
  const setCurrentLevel = useGameStore((state) => state.setCurrentLevel);
  const maxUnlockedLevel = useGameStore((state) => state.maxUnlockedLevel);
  const completedLevels = useGameStore((state) => state.completedLevels);

  const startAtLevel = (levelId: number) => {
    setCurrentLevel(levelId);
    onStartGame();
  };

  return (
    <div className="menu-shell absolute inset-0 z-50 overflow-y-auto text-white">
      <div className="menu-stars" aria-hidden="true" />
      <main className="relative mx-auto flex min-h-full w-full max-w-7xl flex-col px-5 py-8 sm:px-8 lg:px-12">
        <nav className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-200/10 text-cyan-100"><MoonStar size={23} /></div>
            <div>
              <p className="text-sm font-black tracking-wide">星光市长</p>
              <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Restore the night</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="secondary-button" onClick={onOpenAudioSettings}><Headphones size={16} />声音方案</button>
            <button className="secondary-button" onClick={onOpenFeedback}><MessageSquareText size={16} />试玩反馈</button>
          </div>
        </nav>

        <section className="grid flex-1 items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="eyebrow">光污染科普 · 3D 策略游戏</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.05] tracking-[-0.045em] sm:text-6xl xl:text-7xl">
              让城市亮起来，
              <span className="block bg-gradient-to-r from-cyan-100 via-blue-200 to-violet-300 bg-clip-text text-transparent">也让星空回来。</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
              巡查每座建筑的亮度、色温、向上光和照明时段，用遮光、暖色灯、定时熄灯与智能调光让星空真正回来。每关还需完成一项高难度城市委托。
            </p>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              <Feature icon={<Clock3 size={18} />} title="夜间巡查" text="找出真实漏光源" />
              <Feature icon={<ShieldCheck size={18} />} title="科学控光" text="方向 · 色温 · 时段" />
              <Feature icon={<Sparkles size={18} />} title="动态银河" text="污染越低，星空越亮" />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button className="primary-button px-7 py-3.5" onClick={() => startAtLevel(maxUnlockedLevel)}>
                <Play size={18} fill="currentColor" />
                {maxUnlockedLevel > 1 ? `继续第 ${maxUnlockedLevel} 关` : '开始执政'}
              </button>
              <p className="flex items-center text-xs text-slate-500">音效将在第一次点击后启用，可随时静音。</p>
            </div>
          </div>

          <section className="glass-panel p-4 sm:p-5">
            <div className="mb-4 flex items-end justify-between px-1">
              <div>
                <p className="eyebrow">关卡路线</p>
                <h2 className="mt-1 text-xl font-black">银河恢复计划</h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">{completedLevels.length}/6 完成</span>
            </div>
            <div className="space-y-2">
              {LEVELS.map((level) => {
                const unlocked = level.id <= maxUnlockedLevel;
                const completed = completedLevels.includes(level.id);
                return (
                  <button
                    key={level.id}
                    className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${unlocked ? 'border-white/10 bg-white/[0.035] hover:border-cyan-200/30 hover:bg-white/[0.065]' : 'cursor-not-allowed border-white/[0.05] bg-black/10 opacity-45'}`}
                    disabled={!unlocked}
                    onClick={() => startAtLevel(level.id)}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${completed ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200' : unlocked ? 'border-cyan-200/20 bg-cyan-200/10 text-cyan-100' : 'border-white/10 text-slate-500'}`}>
                      {completed ? <Check size={18} /> : unlocked ? String(level.id).padStart(2, '0') : <Lock size={15} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{level.shortName}</p>
                      <p className="mt-1 truncate text-[11px] text-slate-500">星空 {level.targetStars} · {formatLevelDuration(level.timeLimit)}</p>
                    </div>
                    {unlocked && <ChevronRight size={18} className="text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-100" />}
                  </button>
                );
              })}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-3 text-cyan-200">{icon}</div>
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{text}</p>
    </div>
  );
}
