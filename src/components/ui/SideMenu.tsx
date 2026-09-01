import { useState } from 'react';
import { FileText, Hammer } from 'lucide-react';
import { BUILDING_CONFIG, BuildingType, POLICY_CONFIG, useGameStore } from '../../store/gameStore';

interface SideMenuProps {
  onSelectBuilding: (type: BuildingType | null) => void;
  selectedBuilding: BuildingType | null;
}

export function SideMenu({ onSelectBuilding, selectedBuilding }: SideMenuProps) {
  const [activeTab, setActiveTab] = useState<'build' | 'policy'>('build');
  const money = useGameStore((state) => state.money);
  const activePolicies = useGameStore((state) => state.activePolicies);
  const activatePolicy = useGameStore((state) => state.activatePolicy);
  const isPaused = useGameStore((state) => state.isPaused);

  return (
    <div className="game-side-menu glass-panel absolute right-4 top-24 z-20 flex max-h-[calc(100vh-7rem)] w-[min(21rem,calc(100vw-2rem))] flex-col overflow-hidden text-white sm:right-5">
      <div className="flex border-b border-white/10">
        <button
          className={`flex-1 px-3 py-4 text-sm font-bold transition-colors ${activeTab === 'build' ? 'border-b-2 border-amber-300 text-amber-300' : 'text-slate-400 hover:text-white'}`}
          onClick={() => setActiveTab('build')}
        >
          <Hammer className="mr-2 inline" size={16} />
          建设
        </button>
        <button
          className={`flex-1 px-3 py-4 text-sm font-bold transition-colors ${activeTab === 'policy' ? 'border-b-2 border-amber-300 text-amber-300' : 'text-slate-400 hover:text-white'}`}
          onClick={() => {
            setActiveTab('policy');
            onSelectBuilding(null);
          }}
        >
          <FileText className="mr-2 inline" size={16} />
          政策
        </button>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
        {activeTab === 'build' && (
          <div className="space-y-3">
            <p className="mb-4 text-xs leading-relaxed text-slate-400">选择建筑后，在地图网格上点击放置。工业和商业会带来财政收入，也会压低环境与星空。</p>
            {(Object.entries(BUILDING_CONFIG) as [BuildingType, (typeof BUILDING_CONFIG)[BuildingType]][]).map(([type, config]) => {
              const canAfford = money >= config.cost && !isPaused;
              const isSelected = selectedBuilding === type;
              return (
                <button
                  key={type}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${isSelected ? 'border-cyan-200/50 bg-cyan-200/10' : 'border-white/10 bg-black/10 hover:border-white/30'} ${!canAfford ? 'cursor-not-allowed opacity-45' : ''}`}
                  onClick={() => canAfford && onSelectBuilding(isSelected ? null : type)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`font-bold ${isSelected ? 'text-amber-300' : ''}`}>{config.name}</span>
                    <span className="font-mono text-sm text-amber-200">${config.cost}</span>
                  </div>
                  <EffectRow income={config.income - config.upkeep} env={config.env} stars={config.stars} sat={config.sat} />
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'policy' && (
          <div className="space-y-3">
            <p className="mb-4 text-xs leading-relaxed text-slate-400">政策立即生效。部分政策会牺牲短期收入或满意度，但能更快恢复夜空。</p>
            {Object.entries(POLICY_CONFIG).map(([id, config]) => {
              const isActive = activePolicies.includes(id);
              const canAfford = money >= config.cost && !isActive && !isPaused;
              return (
                <button
                  key={id}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${isActive ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-white/10 bg-black/10 hover:border-white/30'} ${!canAfford && !isActive ? 'cursor-not-allowed opacity-45' : ''}`}
                  onClick={() => canAfford && activatePolicy(id)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`font-bold ${isActive ? 'text-emerald-300' : ''}`}>{config.name}<span className="ml-2 text-[10px] font-normal text-slate-500">{config.source}</span></span>
                    <span className="font-mono text-sm text-amber-200">{isActive ? '已发布' : `$${config.cost}`}</span>
                  </div>
                  <EffectRow income={config.income} env={config.env} stars={config.stars} sat={config.sat} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EffectRow({ income, env, stars, sat }: { income?: number; env: number; stars: number; sat: number }) {
  const tone = (value: number) => (value > 0 ? 'text-emerald-300' : value < 0 ? 'text-red-300' : 'text-slate-500');
  const signed = (value: number) => `${value > 0 ? '+' : ''}${value}`;

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono text-slate-400">
      {typeof income === 'number' && <span className={tone(income)}>收入 {signed(income)}</span>}
      <span className={tone(env)}>环境 {signed(env)}</span>
      <span className={tone(stars)}>星空 {signed(stars)}</span>
      <span className={tone(sat)}>满意 {signed(sat)}</span>
    </div>
  );
}
