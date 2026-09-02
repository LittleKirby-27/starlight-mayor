import { Crosshair, Home, Search, ShieldCheck } from 'lucide-react';
import { getChallengeOptions, LEVELS, useGameStore } from '../../store/gameStore';

const icons = {
  night_audit: Search,
  precision_budget: Crosshair,
  resident_night: Home,
};

export function ChallengePicker() {
  const currentLevel = useGameStore((state) => state.currentLevel);
  const activeChallengeId = useGameStore((state) => state.activeChallengeId);
  const selectChallenge = useGameStore((state) => state.selectChallenge);
  if (activeChallengeId) return null;

  const level = LEVELS[currentLevel - 1];
  const options = getChallengeOptions(currentLevel);

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-[#020711]/82 p-4 backdrop-blur-md">
      <section className="challenge-picker w-full max-w-4xl rounded-3xl border border-cyan-100/15 bg-[#071322]/96 p-5 text-white shadow-2xl sm:p-7">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl border border-amber-200/25 bg-amber-200/10 p-3 text-amber-200"><ShieldCheck size={24} /></div>
          <div>
            <div className="text-xs font-bold tracking-[0.22em] text-cyan-200">第 {currentLevel} 关 · 高难度城市委托</div>
            <h2 className="mt-1 text-2xl font-black">选择本关额外挑战</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{level?.desc} 除核心目标外，你还必须完成下面一项高难度委托。选择后本关计时才会开始。</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {options.map((option) => {
            const Icon = icons[option.id];
            return (
              <button
                key={option.id}
                className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-left transition-all hover:-translate-y-1 hover:border-cyan-200/45 hover:bg-cyan-200/[0.07]"
                onClick={() => selectChallenge(option.id)}
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="rounded-xl bg-cyan-200/10 p-2.5 text-cyan-200"><Icon size={21} /></span>
                  <span className="rounded-full border border-red-300/20 bg-red-300/10 px-2.5 py-1 text-[10px] font-bold text-red-200">{option.badge}</span>
                </div>
                <h3 className="text-lg font-black group-hover:text-cyan-100">{option.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{option.desc}</p>
                <div className="mt-5 text-xs font-bold text-amber-200">选择并开始计时 →</div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
