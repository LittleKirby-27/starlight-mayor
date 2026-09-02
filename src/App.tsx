import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { AchievementToast } from './components/ui/AchievementToast';
import { AchievementsUI } from './components/ui/AchievementsUI';
import { AIAssistant } from './components/ui/AIAssistant';
import { AudioDirector } from './components/ui/AudioDirector';
import { AudioSettings } from './components/ui/AudioSettings';
import { ChallengePicker } from './components/ui/ChallengePicker';
import { EventModal } from './components/ui/EventModal';
import { GameOverScreen } from './components/ui/GameOverScreen';
import { LeftPanel } from './components/ui/LeftPanel';
import { LevelCompleteScreen } from './components/ui/LevelCompleteScreen';
import { MainMenu } from './components/ui/MainMenu';
import { PlaytestFeedback } from './components/ui/PlaytestFeedback';
import { SideMenu } from './components/ui/SideMenu';
import { TopBar } from './components/ui/TopBar';
import { recordGameRun } from './db/analytics';
import { TURN_DURATION_MS, type BuildingType, useGameStore } from './store/gameStore';

const GameScene = lazy(() => import('./components/game/GameScene').then((module) => ({ default: module.GameScene })));

const App = () => {
  const [screen, setScreen] = useState<'menu' | 'playing'>('menu');
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [sideMenuCollapsed, setSideMenuCollapsed] = useState(false);
  const recordedResults = useRef(new Set<string>());
  const audioWasPaused = useRef(false);
  const achievementsWerePaused = useRef(false);

  const state = useGameStore();

  useEffect(() => {
    if (screen !== 'playing' || state.isGameOver || state.isPaused) return;
    const turnTimer = window.setInterval(state.nextTurn, TURN_DURATION_MS);
    return () => window.clearInterval(turnTimer);
  }, [screen, state.isGameOver, state.isPaused, state.nextTurn]);

  useEffect(() => {
    if (screen !== 'playing' || state.isGameOver || state.isPaused) return;
    const secondTimer = window.setInterval(state.tickTime, 1000);
    return () => window.clearInterval(secondTimer);
  }, [screen, state.isGameOver, state.isPaused, state.tickTime]);

  useEffect(() => {
    const result = state.levelComplete ? 'level_complete' : state.gameResult;
    if (!result) return;
    const key = `${result}-${state.currentLevel}-${state.levelStartedAt}`;
    if (recordedResults.current.has(key)) return;
    recordedResults.current.add(key);
    void recordGameRun({
      completedLevel: state.currentLevel,
      result,
      stars: state.stars,
      environment: state.environment,
      satisfaction: state.satisfaction,
      money: state.money,
      durationSeconds: (Date.now() - state.levelStartedAt) / 1000,
    });
  }, [
    state.currentLevel,
    state.environment,
    state.gameResult,
    state.levelComplete,
    state.levelStartedAt,
    state.money,
    state.satisfaction,
    state.stars,
  ]);

  const startGame = () => {
    setSelectedBuilding(null);
    setScreen('playing');
  };

  const openAudioSettings = () => {
    audioWasPaused.current = state.isPaused;
    if (screen === 'playing' && !state.isPaused && !state.isGameOver && !state.levelComplete) state.setPaused(true);
    setShowAudioSettings(true);
  };

  const closeAudioSettings = () => {
    setShowAudioSettings(false);
    if (screen === 'playing' && !audioWasPaused.current && !state.isGameOver && !state.levelComplete) state.setPaused(false);
  };

  const openAchievements = () => {
    achievementsWerePaused.current = state.isPaused;
    if (!state.isPaused && !state.isGameOver && !state.levelComplete) state.setPaused(true);
    setShowAchievements(true);
  };

  const closeAchievements = () => {
    setShowAchievements(false);
    if (!achievementsWerePaused.current && !state.isGameOver && !state.levelComplete) state.setPaused(false);
  };

  return (
    <div className={`relative h-screen w-screen overflow-hidden bg-[#07101c] font-sans ${sideMenuCollapsed ? 'mobile-menu-collapsed' : ''} ${screen === 'playing' && state.timeLeft <= 60 && !state.isGameOver ? 'critical-time-frame' : ''}`}>
      <AudioDirector />

      {screen === 'menu' && (
        <MainMenu
          onStartGame={startGame}
          onOpenFeedback={() => setShowFeedback(true)}
          onOpenAudioSettings={openAudioSettings}
        />
      )}

      {screen === 'playing' && (
        <>
          <Suspense fallback={<div className="absolute inset-0 grid place-items-center bg-[#07101c] text-sm text-cyan-100">正在构建 3D 城市…</div>}>
            <GameScene selectedBuilding={selectedBuilding} onBuildingPlaced={() => setSelectedBuilding(null)} />
          </Suspense>
          <TopBar onOpenAchievements={openAchievements} onOpenAudioSettings={openAudioSettings} />
          <LeftPanel />
          <SideMenu
            selectedBuilding={selectedBuilding}
            onSelectBuilding={setSelectedBuilding}
            collapsed={sideMenuCollapsed}
            onToggleCollapsed={() => setSideMenuCollapsed((value) => !value)}
          />
          <EventModal />
          <ChallengePicker />
          <AIAssistant />
          <AchievementToast />

          {state.isPaused && state.activeChallengeId && !state.isGameOver && !state.levelComplete && (
            <button className="pause-chip" onClick={() => state.setPaused(false)}>
              <Pause size={16} />
              游戏已暂停
              <span>点击继续</span>
              <Play size={14} fill="currentColor" />
            </button>
          )}

          {showAchievements && <AchievementsUI onClose={closeAchievements} />}
          <LevelCompleteScreen onOpenFeedback={() => setShowFeedback(true)} />
          {state.isGameOver && (
            <GameOverScreen
              onBackToMenu={() => setScreen('menu')}
              onOpenFeedback={() => setShowFeedback(true)}
            />
          )}
        </>
      )}

      {showFeedback && <PlaytestFeedback currentLevel={state.currentLevel} onClose={() => setShowFeedback(false)} />}
      {showAudioSettings && <AudioSettings onClose={closeAudioSettings} />}
    </div>
  );
};

export default App;
