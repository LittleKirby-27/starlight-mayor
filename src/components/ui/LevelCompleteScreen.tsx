import { ArrowRight, CheckCircle2, MessageSquareText, Sparkles } from 'lucide-react';
import { getLevelReward, LEVELS } from '../../game/rules';
import { useGameStore } from '../../store/gameStore';

export function LevelCompleteScreen({ onOpenFeedback }: { onOpenFeedback: () => void }) {
  const clearedLevel = useGameStore((state) => state.levelComplete);
  const money = useGameStore((state) => state.money);
  const environment = useGameStore((state) => state.environment);
  const stars = useGameStore((state) => state.stars);
  const satisfaction = useGameStore((state) => state.satisfaction);
  const continueToNextLevel = useGameStore((state) => state.continueToNextLevel);

  if (!clearedLevel) return null;
  const nextLevel = LEVELS[clearedLevel];
  const reward = getLevelReward(clearedLevel);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#030817]/78 p-4 text-white backdrop-blur-lg">
      <div className="glass-panel w-full max-w-2xl overflow-hidden">
        <div className="relative border-b border-white/10 bg-gradient-to-br from-amber-300/16 via-cyan-300/8 to-transparent p-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-200/50 bg-amber-300/15 text-amber-200 shadow-[0_0_34px_rgba(251,191,36,.2)]">
            <CheckCircle2 size={34} />
          </div>
          <p className="eyebrow">第 {clearedLevel} 关完成</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">夜空又清晰了一点</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-300">本关目标已全部达成，通关逻辑已锁定并暂停计时。继续后才会正式进入下一关。</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[['财政', money, 'text-amber-200'], ['环境', environment, 'text-emerald-300'], ['星空', stars, 'text-cyan-200'], ['满意度', satisfaction, 'text-violet-200']].map(([label, value, tone]) => (
              <div key={String(label)} className="metric-card">
                <span className="text-[11px] uppercase tracking-widest text-slate-500">{label}</span>
                <strong className={`mt-1 block font-mono text-2xl ${tone}`}>{value}</strong>
              </div>
            ))}
          </div>

          <div className="my-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div>
              <p className="text-xs text-slate-500">下一关</p>
              <p className="mt-1 font-bold">{nextLevel?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">暗夜治理奖励</p>
              <p className="mt-1 font-mono font-bold text-amber-200">+{reward}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="secondary-button flex-1" onClick={onOpenFeedback}><MessageSquareText size={17} />试玩反馈</button>
            <button className="primary-button flex-[1.35]" onClick={continueToNextLevel}>
              <Sparkles size={17} />
              进入下一关
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
