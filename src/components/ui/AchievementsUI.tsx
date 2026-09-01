import { useState } from 'react';
import type { ReactNode } from 'react';
import { Award, CheckCircle, Clock, DollarSign, FileText, Globe, Hammer, Leaf, PiggyBank, Shield, Star, TreePine, Wind, X } from 'lucide-react';
import { AchievementCategory, useGameStore } from '../../store/gameStore';

const ICONS: Record<string, ReactNode> = {
  hammer: <Hammer size={24} />,
  tree: <TreePine size={24} />,
  wind: <Wind size={24} />,
  'file-text': <FileText size={24} />,
  leaf: <Leaf size={24} />,
  star: <Star size={24} />,
  shield: <Shield size={24} />,
  globe: <Globe size={24} />,
  'dollar-sign': <DollarSign size={24} />,
  'piggy-bank': <PiggyBank size={24} />,
  award: <Award size={24} />,
  clock: <Clock size={24} />,
  'check-circle': <CheckCircle size={24} />,
};

const tabs: { id: AchievementCategory | 'all'; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'construction', label: '建设' },
  { id: 'policy', label: '政策' },
  { id: 'environmental', label: '环保' },
  { id: 'economic', label: '经济' },
  { id: 'mixed', label: '综合' },
];

export function AchievementsUI({ onClose }: { onClose: () => void }) {
  const achievements = useGameStore((state) => state.achievements);
  const [filter, setFilter] = useState<AchievementCategory | 'all'>('all');
  const filtered = filter === 'all' ? achievements : achievements.filter((achievement) => achievement.category === filter);

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-6 text-white backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="achievements-title">
      <div className="flex h-full max-h-[82vh] w-full max-w-4xl flex-col overflow-hidden rounded-sm border border-white/20 bg-[#111827] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-5">
          <h2 id="achievements-title" className="flex items-center text-2xl font-bold">
            <Award className="mr-3 text-amber-300" />
            成就系统
          </h2>
          <button onClick={onClose} className="rounded-sm p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white" title="关闭">
            <X size={24} />
          </button>
        </div>

        <div className="flex overflow-x-auto border-b border-white/10 bg-black/20">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`shrink-0 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${filter === tab.id ? 'border-amber-300 bg-amber-300/10 text-amber-300' : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.map((achievement) => (
              <div key={achievement.id} className={`flex rounded-sm border bg-black/35 p-4 transition-all ${achievement.isUnlocked ? 'border-amber-300/60 shadow-[0_0_16px_rgba(252,211,77,0.12)]' : 'border-white/10 opacity-70 grayscale'}`}>
                <div className={`mr-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${achievement.isUnlocked ? 'bg-amber-300/20 text-amber-300' : 'bg-white/5 text-slate-500'}`}>
                  {ICONS[achievement.icon] || <Award size={24} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className={`truncate font-bold ${achievement.isUnlocked ? 'text-white' : 'text-slate-400'}`}>{achievement.title}</h3>
                    {achievement.isUnlocked && <span className="shrink-0 rounded-sm border border-amber-300/30 bg-amber-300/15 px-2 py-0.5 text-xs text-amber-200">已解锁</span>}
                  </div>
                  <p className="mb-3 line-clamp-2 text-sm leading-snug text-slate-400">{achievement.description}</p>
                  <div className="mb-1 flex justify-between text-xs font-mono text-slate-500">
                    <span>进度</span>
                    <span>
                      {Math.floor(achievement.progress)} / {achievement.maxProgress}
                    </span>
                  </div>
                  <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-black">
                    <div className={`h-full rounded-full ${achievement.isUnlocked ? 'bg-amber-300' : 'bg-sky-400'}`} style={{ width: `${Math.min(100, (achievement.progress / achievement.maxProgress) * 100)}%` }} />
                  </div>
                  <div className="text-xs text-sky-200">
                    <span className="mr-1 opacity-70">奖励:</span>
                    {achievement.rewardDesc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
