import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { Achievement } from '../../store/gameStore';

export function AchievementToast() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    const handleAchievement = (event: Event) => {
      const customEvent = event as CustomEvent<Achievement>;
      setAchievements((current) => [...current, customEvent.detail]);
      window.setTimeout(() => {
        setAchievements((current) => current.filter((achievement) => achievement.id !== customEvent.detail.id));
      }, 4500);
    };

    window.addEventListener('achievement-unlocked', handleAchievement);
    return () => window.removeEventListener('achievement-unlocked', handleAchievement);
  }, []);

  if (achievements.length === 0) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-24 z-50 flex -translate-x-1/2 flex-col gap-2">
      {achievements.map((achievement) => (
        <div key={achievement.id} className="flex items-center rounded-sm border border-amber-300/60 bg-[#111827]/95 p-4 shadow-[0_0_20px_rgba(252,211,77,0.25)] backdrop-blur-md">
          <div className="mr-4 shrink-0 rounded-full bg-amber-300/20 p-3 text-amber-300">
            <Award size={26} />
          </div>
          <div>
            <div className="mb-1 text-xs font-bold tracking-widest text-amber-300">成就解锁</div>
            <h3 className="mb-1 text-lg font-bold leading-tight text-white">{achievement.title}</h3>
            <p className="text-xs text-sky-200">奖励: {achievement.rewardDesc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
