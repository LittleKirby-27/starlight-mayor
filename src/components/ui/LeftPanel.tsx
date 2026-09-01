import { useMemo } from 'react';
import { CheckCircle2, Circle, MessageSquare, Target } from 'lucide-react';
import { getLevelObjectives, LEVELS, useGameStore } from '../../store/gameStore';

export function LeftPanel() {
  const state = useGameStore();
  const level = LEVELS.find((item) => item.id === state.currentLevel);
  const objectives = getLevelObjectives(state);
  const completedCount = objectives.filter((item) => item.completed).length;

  const feedback = useMemo(() => {
    if (state.satisfaction < 35) return '最近抱怨变多了。大家愿意看星星，但也需要安全、方便的夜晚。';
    if (state.environment < 35) return '空气有些浑浊，远处的山已经看不清了。';
    if (state.stars < 25) return '夜空还是灰蒙蒙的，只能看到几颗最亮的星。';
    if (state.activePolicies.includes('lights_out_hour') && state.isNight) return '关灯一小时后，广场上有人第一次看见了银河的轮廓。';
    if (state.stars > 85) return '昨晚的星空太漂亮了，市民自发办起了小型观星会。';
    if (state.satisfaction > 80) return '城市变化很明显，大家开始相信环保并不等于牺牲生活。';
    return '城市正在稳步变化。慢一点观察，再决定下一项建设。';
  }, [state.activePolicies, state.environment, state.isNight, state.satisfaction, state.stars]);

  return (
    <div className="game-left-panel pointer-events-none absolute left-4 top-24 z-20 flex w-[min(19rem,calc(100vw-2rem))] flex-col gap-3 sm:left-5">
      <section className="glass-panel pointer-events-auto p-4 text-white">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-cyan-100"><Target size={17} />当前任务</div>
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-slate-400">{completedCount}/{objectives.length}</span>
        </div>
        <h3 className="mb-1 text-sm font-bold">{level?.name}</h3>
        <p className="mb-4 text-xs leading-relaxed text-slate-400">{level?.desc}</p>
        <div className="space-y-2">
          {objectives.map((item) => (
            <div key={item.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${item.completed ? 'border-emerald-300/15 bg-emerald-300/[0.06] text-emerald-100' : 'border-white/[0.07] bg-black/10 text-slate-300'}`}>
              {item.completed ? <CheckCircle2 size={14} className="shrink-0 text-emerald-300" /> : <Circle size={14} className="shrink-0 text-slate-600" />}
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <span className="font-mono text-[10px] text-slate-500">{Math.min(item.current, item.target)}/{item.target}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel pointer-events-auto p-4 text-white">
        <div className="mb-3 flex items-center gap-2 font-bold text-emerald-200"><MessageSquare size={17} />市民声音</div>
        <p className="border-l-2 border-emerald-200/25 py-1 pl-3 text-xs italic leading-relaxed text-slate-300">“{feedback}”</p>
      </section>
    </div>
  );
}
