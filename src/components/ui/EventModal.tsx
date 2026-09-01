import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { EVENT_RESPONSE_SECONDS } from '../../game/rules';
import { shouldTriggerEvent } from '../../game/events';

interface EventData {
  title: string;
  desc: string;
  options: {
    text: string;
    effect: { money?: number; environment?: number; stars?: number; satisfaction?: number };
  }[];
}

const RANDOM_EVENTS: EventData[] = [
  {
    title: '开发商提议',
    desc: '开发商想拆掉城郊树林，建设一片大型商业街区，承诺立刻增加财政收入。',
    options: [
      { text: '批准开发：财政 +220，环境 -16，星空 -12', effect: { money: 220, environment: -16, stars: -12 } },
      { text: '保留树林：环境 +8，满意度 +6', effect: { environment: 8, satisfaction: 6 } },
      { text: '改为生态夜市：财政 +80，星空 -4，满意度 +8', effect: { money: 80, stars: -4, satisfaction: 8 } },
    ],
  },
  {
    title: '市民夜间出行投诉',
    desc: '部分居民认为控光后夜路变暗，希望政府给出更细致的照明方案。',
    options: [
      { text: '增加普通照明：满意度 +14，星空 -18', effect: { satisfaction: 14, stars: -18 } },
      { text: '安装低眩光路灯：财政 -120，星空 +8，满意度 +6', effect: { money: -120, stars: 8, satisfaction: 6 } },
      { text: '维持现状并解释：满意度 -6，星空 +4', effect: { satisfaction: -6, stars: 4 } },
    ],
  },
  {
    title: '雾霾预警',
    desc: '连续施工和工业排放让空气透明度下降，今晚的星空观测活动可能取消。',
    options: [
      { text: '临时停工：财政 -160，环境 +16，星空 +8', effect: { money: -160, environment: 16, stars: 8 } },
      { text: '继续生产：财政 +180，环境 -18，满意度 -8', effect: { money: 180, environment: -18, satisfaction: -8 } },
      { text: '启动公共交通补贴：财政 -80，环境 +8，满意度 +5', effect: { money: -80, environment: 8, satisfaction: 5 } },
    ],
  },
  {
    title: '星空音乐会邀请',
    desc: '青少年乐团想在公园举办一场星空下的小提琴音乐会，为控光行动争取支持。',
    options: [
      { text: '支持活动：财政 -100，满意度 +16，星空 +6', effect: { money: -100, satisfaction: 16, stars: 6 } },
      { text: '缩小规模：财政 -40，满意度 +7，星空 +3', effect: { money: -40, satisfaction: 7, stars: 3 } },
      { text: '暂缓活动：满意度 -5', effect: { satisfaction: -5 } },
    ],
  },
  {
    title: '能源缺口',
    desc: '晚高峰用电上升，商业区要求延长灯光营业时间。',
    options: [
      { text: '延长营业：财政 +160，星空 -14，环境 -6', effect: { money: 160, stars: -14, environment: -6 } },
      { text: '限时营业：财政 +60，满意度 -4，星空 +4', effect: { money: 60, satisfaction: -4, stars: 4 } },
      { text: '补贴清洁能源：财政 -140，环境 +12，星空 +10', effect: { money: -140, environment: 12, stars: 10 } },
    ],
  },
];

export function EventModal() {
  const day = useGameStore((state) => state.day);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const applyEventResult = useGameStore((state) => state.applyEventResult);
  const eventDays = useGameStore((state) => state.eventDays);
  const addEventDay = useGameStore((state) => state.addEventDay);
  const setPaused = useGameStore((state) => state.setPaused);
  const [currentEvent, setCurrentEvent] = useState<EventData | null>(null);
  const [timeLeft, setTimeLeft] = useState(EVENT_RESPONSE_SECONDS);

  useEffect(() => {
    if (currentEvent) return;
    if (shouldTriggerEvent({ day, currentLevel, eventDays, randomRoll: Math.random() })) {
      const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
      setCurrentEvent(event);
      setTimeLeft(EVENT_RESPONSE_SECONDS);
      addEventDay(day);
      setPaused(true);
    }
  }, [addEventDay, currentEvent, currentLevel, day, eventDays, setPaused]);

  useEffect(() => {
    if (!currentEvent) return;
    if (timeLeft <= 0) {
      applyEventResult(currentEvent.options[0].effect);
      setCurrentEvent(null);
      setPaused(false);
      return;
    }
    const timer = window.setInterval(() => {
      setTimeLeft((value) => value - 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [applyEventResult, currentEvent, setPaused, timeLeft]);

  if (!currentEvent) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/65 p-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-sm border border-white/20 bg-[#111827] p-6 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="flex items-center text-xl font-bold text-amber-300">
            <AlertTriangle className="mr-2" size={22} />
            紧急政策
          </h2>
          <span className={`font-mono text-sm ${timeLeft <= 8 ? 'text-red-300 animate-pulse' : 'text-slate-300'}`}>{timeLeft}s</span>
        </div>
        <h3 className="mb-2 text-lg font-bold">{currentEvent.title}</h3>
        <p className="mb-6 text-sm leading-relaxed text-slate-300">{currentEvent.desc}</p>
        <div className="space-y-3">
          {currentEvent.options.map((option) => (
            <button
              key={option.text}
              className="w-full rounded-sm border border-white/15 p-3 text-left text-sm transition-all hover:border-amber-300 hover:bg-white/5"
              onClick={() => {
                applyEventResult(option.effect);
                setCurrentEvent(null);
                setPaused(false);
              }}
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
