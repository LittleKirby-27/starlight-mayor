import { Home, MessageSquareText, RefreshCw, Sparkles } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

interface GameOverScreenProps {
  onBackToMenu: () => void;
  onOpenFeedback: () => void;
}

export function GameOverScreen({ onBackToMenu, onOpenFeedback }: GameOverScreenProps) {
  const gameResult = useGameStore((state) => state.gameResult);
  const failReason = useGameStore((state) => state.failReason);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const money = useGameStore((state) => state.money);
  const environment = useGameStore((state) => state.environment);
  const stars = useGameStore((state) => state.stars);
  const satisfaction = useGameStore((state) => state.satisfaction);
  const resetGame = useGameStore((state) => state.resetGame);
  const retryCurrentLevel = useGameStore((state) => state.retryCurrentLevel);

  if (!gameResult) return null;
  const isWin = gameResult === 'win';

  const backToMenu = () => {
    resetGame();
    onBackToMenu();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#02050d]/90 p-4 text-white backdrop-blur-xl">
      <div className="glass-panel w-full max-w-2xl overflow-hidden text-center">
        <div className={`p-8 ${isWin ? 'bg-gradient-to-b from-cyan-300/12 to-transparent' : 'bg-gradient-to-b from-red-400/10 to-transparent'}`}>
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border ${isWin ? 'border-cyan-200/40 bg-cyan-300/10 text-cyan-100' : 'border-red-300/40 bg-red-400/10 text-red-200'}`}>
            {isWin ? <Sparkles size={34} /> : <RefreshCw size={30} />}
          </div>
          <p className="eyebrow">{isWin ? '完整通关' : `第 ${currentLevel} 关`}</p>
          <h1 className={`mt-2 text-4xl font-black tracking-tight ${isWin ? 'text-cyan-100' : 'text-red-200'}`}>
            {isWin ? '银河回归' : '本次治理未完成'}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
            {isWin ? '城市在发展与自然之间找到了新的平衡。今晚，小提琴彩蛋曲会与完整银河一起出现。' : failReason}
          </p>
        </div>

        <div className="px-6 pb-7">
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[['财政', money], ['环境', environment], ['星空', stars], ['满意度', satisfaction]].map(([label, value]) => (
              <div className="metric-card" key={String(label)}>
                <span className="text-[11px] text-slate-500">{label}</span>
                <strong className="mt-1 block font-mono text-xl">{value}</strong>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="secondary-button flex-1" onClick={onOpenFeedback}><MessageSquareText size={17} />试玩反馈</button>
            {!isWin && <button className="primary-button flex-1" onClick={retryCurrentLevel}><RefreshCw size={17} />重试本关</button>}
            <button className="secondary-button flex-1" onClick={backToMenu}><Home size={17} />返回主菜单</button>
          </div>
        </div>
      </div>
    </div>
  );
}
