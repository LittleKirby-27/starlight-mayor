import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Lightbulb, Sparkles } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { EVENT_RESPONSE_SECONDS } from '../../game/rules';
import { shouldTriggerEvent } from '../../game/events';

interface EventEffect {
  money?: number;
  environment?: number;
  lightPollution?: number;
  satisfaction?: number;
}

interface EventOption {
  text: string;
  effect: EventEffect;
  maxLightPollution?: number;
}

interface EventData {
  id: string;
  title: string;
  desc: string;
  lesson: string;
  options: EventOption[];
}

const EVENTS: EventData[] = [
  {
    id: 'grid_overload',
    title: '电网过载',
    desc: '晚高峰照明负荷突破警戒线。工程师提醒：扩大发电能力并不能解决过度照明本身。',
    lesson: '按需调光既能降低电力压力，也能减少不必要的天空辉光。',
    options: [
      { text: '启动分区智能调光：财政 -120，光污染 -8，满意度 +4', effect: { money: -120, lightPollution: -8, satisfaction: 4 } },
      { text: '临时扩容保亮度：财政 -220，环境 -4，满意度 +7', effect: { money: -220, environment: -4, satisfaction: 7 } },
      { text: '直接关闭景观灯：财政 +40，光污染 -12，满意度 -9', effect: { money: 40, lightPollution: -12, satisfaction: -9 } },
    ],
  },
  {
    id: 'meteor_watch',
    title: '流星雨观测窗口',
    desc: '天文台确认今晚有流星雨。城市能否获得观星旅游与科研合作收入，取决于当前夜空质量。',
    lesson: '提前治理光污染会在特殊天象到来时带来公共与经济回报。',
    options: [
      { text: '开放国际观测区：财政 +320，满意度 +8（需光污染 ≤35）', effect: { money: 320, satisfaction: 8 }, maxLightPollution: 35 },
      { text: '紧急全城调暗：财政 +180，光污染 -8，满意度 -2（需光污染 ≤50）', effect: { money: 180, lightPollution: -8, satisfaction: -2 }, maxLightPollution: 50 },
      { text: '接受商业灯光赞助：财政 +260，光污染 +6，满意度 +4', effect: { money: 260, lightPollution: 6, satisfaction: 4 } },
    ],
  },
  {
    id: 'billboard_complaint',
    title: '住宅窗外的巨型招牌',
    desc: '居民提交照片：商业招牌的冷白光整夜照进卧室。企业希望继续保持最高亮度。',
    lesson: '降低亮度、控制时段和遮挡方向，比简单拆除照明更能兼顾双方。',
    options: [
      { text: '限时并降低亮度：财政 -60，光污染 -7，满意度 +7', effect: { money: -60, lightPollution: -7, satisfaction: 7 } },
      { text: '仅安装遮光板：财政 -90，光污染 -5，满意度 +5', effect: { money: -90, lightPollution: -5, satisfaction: 5 } },
      { text: '维持营业优先：财政 +150，光污染 +5，满意度 -7', effect: { money: 150, lightPollution: 5, satisfaction: -7 } },
    ],
  },
  {
    id: 'safety_review',
    title: '夜间安全评估',
    desc: '市民担心控光会让道路变暗。照明专家建议把光准确投向路面，而不是提高所有灯具亮度。',
    lesson: '良好照明关注方向、均匀度和眩光控制，不等于越亮越安全。',
    options: [
      { text: '改造为低眩光路灯：财政 -130，光污染 -6，满意度 +8', effect: { money: -130, lightPollution: -6, satisfaction: 8 } },
      { text: '增加普通高亮灯：财政 -70，光污染 +7，满意度 +4', effect: { money: -70, lightPollution: 7, satisfaction: 4 } },
      { text: '先做小范围试点：财政 -50，光污染 -3，满意度 +3', effect: { money: -50, lightPollution: -3, satisfaction: 3 } },
    ],
  },
];

export function EventModal() {
  const day = useGameStore((state) => state.day);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const lightPollution = useGameStore((state) => state.lightPollution);
  const activeChallengeId = useGameStore((state) => state.activeChallengeId);
  const applyEventResult = useGameStore((state) => state.applyEventResult);
  const eventDays = useGameStore((state) => state.eventDays);
  const addEventDay = useGameStore((state) => state.addEventDay);
  const setPaused = useGameStore((state) => state.setPaused);
  const [currentEvent, setCurrentEvent] = useState<EventData | null>(null);
  const [timeLeft, setTimeLeft] = useState(EVENT_RESPONSE_SECONDS);

  const availableOptions = useMemo(() => currentEvent?.options.filter((option) => option.maxLightPollution === undefined || lightPollution <= option.maxLightPollution) ?? [], [currentEvent, lightPollution]);

  useEffect(() => {
    if (currentEvent || !activeChallengeId) return;
    if (shouldTriggerEvent({ day, currentLevel, eventDays, randomRoll: Math.random() })) {
      const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      setCurrentEvent(event);
      setTimeLeft(EVENT_RESPONSE_SECONDS);
      addEventDay(day);
      setPaused(true);
    }
  }, [activeChallengeId, addEventDay, currentEvent, currentLevel, day, eventDays, setPaused]);

  useEffect(() => {
    if (!currentEvent) return;
    if (timeLeft <= 0) {
      const fallback = availableOptions[0] ?? currentEvent.options[currentEvent.options.length - 1];
      applyEventResult(fallback.effect);
      setCurrentEvent(null);
      setPaused(false);
      return;
    }
    const timer = window.setInterval(() => setTimeLeft((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [applyEventResult, availableOptions, currentEvent, setPaused, timeLeft]);

  if (!currentEvent) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-[#0b1728] p-5 text-white shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="flex items-center text-xl font-bold text-amber-300"><AlertTriangle className="mr-2" size={22} />紧急政策</h2>
          <span className={`font-mono text-sm ${timeLeft <= 8 ? 'animate-pulse text-red-300' : 'text-slate-300'}`}>{timeLeft}s</span>
        </div>
        <div className="mb-2 flex items-center gap-2"><Sparkles size={17} className="text-cyan-200" /><h3 className="text-lg font-bold">{currentEvent.title}</h3></div>
        <p className="mb-3 text-sm leading-relaxed text-slate-300">{currentEvent.desc}</p>
        <div className="mb-5 flex gap-2 rounded-xl border border-cyan-200/10 bg-cyan-200/[0.045] p-3 text-xs leading-relaxed text-cyan-100"><Lightbulb size={16} className="mt-0.5 shrink-0" /><span>{currentEvent.lesson}</span></div>
        <div className="space-y-3">
          {currentEvent.options.map((option) => {
            const locked = option.maxLightPollution !== undefined && lightPollution > option.maxLightPollution;
            return (
              <button
                key={option.text}
                disabled={locked}
                className="w-full rounded-xl border border-white/15 p-3 text-left text-sm transition-all hover:border-amber-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35"
                onClick={() => {
                  applyEventResult(option.effect);
                  setCurrentEvent(null);
                  setPaused(false);
                }}
              >
                {option.text}{locked && <span className="mt-1 block text-[10px] text-red-200">当前光污染 {lightPollution}，尚未达到条件</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
