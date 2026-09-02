import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, FileText, Hammer, Lightbulb, Search } from 'lucide-react';
import {
  BUILDING_CONFIG,
  getBuildingLightingStats,
  getBuildingSpamMultiplier,
  LIGHTING_PROFILES,
  POLICY_CONFIG,
  RETROFIT_CONFIG,
  type Building,
  type BuildingType,
  type RetrofitType,
  useGameStore,
} from '../../store/gameStore';

interface SideMenuProps {
  onSelectBuilding: (type: BuildingType | null) => void;
  selectedBuilding: BuildingType | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function SideMenu({ onSelectBuilding, selectedBuilding, collapsed, onToggleCollapsed }: SideMenuProps) {
  const [activeTab, setActiveTab] = useState<'build' | 'policy' | 'audit'>('audit');
  const state = useGameStore();
  const selectedCityBuilding = state.buildings.find((building) => building.id === state.selectedCityBuildingId) ?? null;

  useEffect(() => {
    state.setAuditMode(activeTab === 'audit');
  }, [activeTab, state.currentLevel, state.setAuditMode]);

  const switchTab = (tab: 'build' | 'policy' | 'audit') => {
    setActiveTab(tab);
    if (tab !== 'build') onSelectBuilding(null);
    state.setAuditMode(tab === 'audit');
  };

  return (
    <div className={`game-side-menu glass-panel absolute right-4 top-24 z-20 flex max-h-[calc(100vh-7rem)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden text-white sm:right-5 ${collapsed ? 'is-collapsed' : ''}`}>
      <button className="mobile-menu-handle" onClick={onToggleCollapsed} aria-label={collapsed ? '展开操作面板' : '收起操作面板'}>
        <span>{activeTab === 'audit' ? '照明巡查' : activeTab === 'policy' ? '城市政策' : '建设菜单'}</span>
        {collapsed ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
      </button>

      <div className="side-menu-tabs flex border-b border-white/10">
        <TabButton active={activeTab === 'build'} onClick={() => switchTab('build')} icon={<Hammer size={15} />} label="建设" />
        <TabButton active={activeTab === 'audit'} onClick={() => switchTab('audit')} icon={<Search size={15} />} label="巡查" />
        <TabButton active={activeTab === 'policy'} onClick={() => switchTab('policy')} icon={<FileText size={15} />} label="政策" />
      </div>

      <div className="side-menu-content custom-scrollbar flex-1 overflow-y-auto p-4">
        {activeTab === 'build' && (
          <div className="space-y-3">
            <p className="mb-4 text-xs leading-relaxed text-slate-400">建筑会产生真实照明负担。连续建造两座同类建筑后，第三座起触发防刷成本和维护费。</p>
            {(Object.entries(BUILDING_CONFIG) as [BuildingType, (typeof BUILDING_CONFIG)[BuildingType]][]).map(([type, config]) => {
              const spamMultiplier = getBuildingSpamMultiplier(type, state.recentBuildType, state.consecutiveBuildCount);
              const actualCost = Math.ceil(config.cost * spamMultiplier);
              const upkeepMultiplier = 1 + (spamMultiplier - 1) * 0.7;
              const canAfford = state.money >= actualCost && !state.isPaused;
              const isSelected = selectedBuilding === type;
              return (
                <button
                  key={type}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${isSelected ? 'border-cyan-200/50 bg-cyan-200/10' : 'border-white/10 bg-black/10 hover:border-white/30'} ${!canAfford ? 'cursor-not-allowed opacity-45' : ''}`}
                  onClick={() => canAfford && onSelectBuilding(isSelected ? null : type)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`font-bold ${isSelected ? 'text-amber-300' : ''}`}>{config.name}</span>
                    <span className="font-mono text-sm text-amber-200">${actualCost}</span>
                  </div>
                  <EffectRow income={config.income - Math.ceil(config.upkeep * upkeepMultiplier)} env={config.env} light={LIGHTING_PROFILES[type].baseImpact} sat={config.sat} />
                  {spamMultiplier > 1 && <div className="mt-2 rounded-lg bg-red-300/10 px-2 py-1 text-[10px] font-bold text-red-200">连续建设惩罚 ×{spamMultiplier.toFixed(2)} · 后续维护同步上升</div>}
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'audit' && (
          <AuditPanel
            building={selectedCityBuilding}
            money={state.money}
            isPaused={state.isPaused}
            audited={selectedCityBuilding ? state.auditedBuildingIds.includes(selectedCityBuilding.id) : false}
            onAudit={state.auditBuilding}
            onRetrofit={state.applyLightingRetrofit}
          />
        )}

        {activeTab === 'policy' && (
          <div className="space-y-3">
            <p className="mb-4 text-xs leading-relaxed text-slate-400">政策不再直接增加星空。它们通过减少向上光、降低色温或限制照明时段来改变全城光污染。</p>
            {Object.entries(POLICY_CONFIG).map(([id, config]) => {
              const isActive = state.activePolicies.includes(id);
              const canAfford = state.money >= config.cost && !isActive && !state.isPaused;
              return (
                <button
                  key={id}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${isActive ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-white/10 bg-black/10 hover:border-white/30'} ${!canAfford && !isActive ? 'cursor-not-allowed opacity-45' : ''}`}
                  onClick={() => canAfford && state.activatePolicy(id)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`font-bold ${isActive ? 'text-emerald-300' : ''}`}>{config.name}<span className="ml-2 text-[10px] font-normal text-slate-500">{config.source}</span></span>
                    <span className="font-mono text-sm text-amber-200">{isActive ? '已发布' : `$${config.cost}`}</span>
                  </div>
                  <EffectRow income={config.income} env={config.env} light={-config.lightReduction} sat={config.sat} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return <button className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-4 text-xs font-bold transition-colors ${active ? 'border-b-2 border-amber-300 text-amber-300' : 'text-slate-400 hover:text-white'}`} onClick={onClick}>{icon}{label}</button>;
}

function AuditPanel({ building, money, isPaused, audited, onAudit, onRetrofit }: {
  building: Building | null;
  money: number;
  isPaused: boolean;
  audited: boolean;
  onAudit: (buildingId: string) => void;
  onRetrofit: (buildingId: string, retrofit: RetrofitType) => boolean;
}) {
  if (!building) {
    return (
      <div className="rounded-2xl border border-cyan-200/15 bg-cyan-200/[0.04] p-5 text-center">
        <Search className="mx-auto mb-3 text-cyan-200" size={26} />
        <h3 className="font-bold text-cyan-100">选择一座建筑</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">巡查模式已开启。地图上的光柱越高，污染贡献越大；点击建筑查看亮度、色温、向上光和照明时段。</p>
      </div>
    );
  }

  const stats = getBuildingLightingStats(building);
  const config = BUILDING_CONFIG[building.type];
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
        <div className="flex items-start justify-between gap-3">
          <div><div className="text-[10px] font-bold tracking-[0.18em] text-cyan-300">照明档案</div><h3 className="mt-1 text-lg font-black">{config.name}</h3></div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${stats.impact >= 10 ? 'bg-red-300/10 text-red-200' : stats.impact >= 5 ? 'bg-amber-300/10 text-amber-200' : 'bg-emerald-300/10 text-emerald-200'}`}>贡献 {stats.impact}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <AuditMetric label="亮度" value={`${stats.brightness}/100`} />
          <AuditMetric label="向上光" value={`${stats.upwardRatio}%`} />
          <AuditMetric label="色温" value={`${stats.colorTemperature}K`} />
          <AuditMetric label="照明时段" value={`${stats.hours}小时`} />
        </div>
        <button className="primary-button mt-4 w-full" disabled={audited || isPaused} onClick={() => onAudit(building.id)}>
          {audited ? <><CheckCircle2 size={16} />已完成巡查</> : <><Search size={16} />登记巡查结果</>}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1 text-xs font-bold text-amber-200"><Lightbulb size={15} />逐栋照明改造</div>
        {(Object.entries(RETROFIT_CONFIG) as [RetrofitType, (typeof RETROFIT_CONFIG)[RetrofitType]][]).map(([id, retrofit]) => {
          const installed = building.retrofits.includes(id);
          const disabled = installed || !audited || isPaused || money < retrofit.cost;
          return (
            <button key={id} disabled={disabled} onClick={() => onRetrofit(building.id, id)} className={`w-full rounded-xl border p-3 text-left transition-colors ${installed ? 'border-emerald-300/25 bg-emerald-300/[0.06]' : 'border-white/10 bg-black/10 hover:border-cyan-200/35'} disabled:cursor-not-allowed disabled:opacity-45`}>
              <div className="flex items-center justify-between text-sm font-bold"><span>{retrofit.name}</span><span className="font-mono text-amber-200">{installed ? '已完成' : `$${retrofit.cost}`}</span></div>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{retrofit.description}</p>
            </button>
          );
        })}
        {!audited && <p className="px-1 text-[10px] text-amber-200/75">先登记巡查结果，才能制定改造方案。</p>}
      </div>
    </div>
  );
}

function AuditMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white/[0.045] p-2.5"><div className="text-[10px] text-slate-500">{label}</div><div className="mt-1 font-mono text-cyan-100">{value}</div></div>;
}

function EffectRow({ income, env, light, sat }: { income?: number; env: number; light: number; sat: number }) {
  const tone = (value: number, inverse = false) => {
    const positive = inverse ? value < 0 : value > 0;
    const negative = inverse ? value > 0 : value < 0;
    return positive ? 'text-emerald-300' : negative ? 'text-red-300' : 'text-slate-500';
  };
  const signed = (value: number) => `${value > 0 ? '+' : ''}${value}`;
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono text-slate-400">
      {typeof income === 'number' && <span className={tone(income)}>收入 {signed(income)}</span>}
      <span className={tone(env)}>环境 {signed(env)}</span>
      <span className={tone(light, true)}>光污染 {signed(light)}</span>
      <span className={tone(sat)}>满意 {signed(sat)}</span>
    </div>
  );
}
