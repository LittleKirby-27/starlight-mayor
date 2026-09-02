import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useGameStore, BuildingType } from '../../store/gameStore';
import { Building } from './Building';
import { Grid } from './Grid';
import { Environment } from './Environment';
import { CameraRig, MobileJoystick, type JoystickAxis } from './CameraControls';
import { getCitizenFeedbackCandidates } from '../../game/lighting';

interface GameSceneProps {
    selectedBuilding: BuildingType | null;
    onBuildingPlaced: () => void;
}

export function GameScene({ selectedBuilding, onBuildingPlaced }: GameSceneProps) {
    const buildings = useGameStore(state => state.buildings);
    const addBuilding = useGameStore(state => state.addBuilding);
    const graphicsQuality = useGameStore(state => state.graphicsQuality);
    const setGraphicsQuality = useGameStore(state => state.setGraphicsQuality);
    const auditMode = useGameStore(state => state.auditMode);
    const selectedCityBuildingId = useGameStore(state => state.selectedCityBuildingId);
    const selectCityBuilding = useGameStore(state => state.selectCityBuilding);
    const lightPollution = useGameStore(state => state.lightPollution);
    const recordCitizenFeedback = useGameStore(state => state.recordCitizenFeedback);
    const joystick = useRef<JoystickAxis>({ x: 0, y: 0 });
    const [bubbleCandidateId, setBubbleCandidateId] = useState<string | null>(null);
    const [bubbleExpanded, setBubbleExpanded] = useState(false);
    const feedbackCandidates = useMemo(() => getCitizenFeedbackCandidates(buildings, lightPollution), [buildings, lightPollution]);
    const bubbleCandidate = feedbackCandidates.find((candidate) => candidate.id === bubbleCandidateId) ?? null;

    useEffect(() => {
        if (feedbackCandidates.length === 0) {
            setBubbleCandidateId(null);
            return;
        }
        const choose = () => {
            const next = feedbackCandidates[Math.floor(Math.random() * feedbackCandidates.length)];
            setBubbleCandidateId(next.id);
            setBubbleExpanded(false);
        };
        const openingTimer = window.setTimeout(choose, 1800);
        const cycleTimer = window.setInterval(choose, 9000);
        return () => {
            window.clearTimeout(openingTimer);
            window.clearInterval(cycleTimer);
        };
    }, [feedbackCandidates]);

    const handlePlaceBuilding = (x: number, z: number) => {
        if (selectedBuilding) {
            const success = addBuilding({ type: selectedBuilding, x, z });
            if (success) {
                onBuildingPlaced();
            }
        }
    };

    return (
        <div className="w-full h-full absolute inset-0 z-0">
            <Canvas
                shadows={graphicsQuality === 'high' ? 'soft' : false}
                dpr={graphicsQuality === 'high' ? [1, 1.65] : [0.75, 1]}
                camera={{ position: [34, 30, 34], fov: 44, near: 0.1, far: 180 }}
                gl={{ antialias: graphicsQuality === 'high', powerPreference: 'high-performance', alpha: false, stencil: false }}
                performance={{ min: 0.5, max: 1, debounce: 220 }}
                onCreated={({ gl }) => {
                    gl.toneMapping = THREE.ACESFilmicToneMapping;
                    gl.toneMappingExposure = 1.05;
                    gl.outputColorSpace = THREE.SRGBColorSpace;
                }}
            >
                <Suspense fallback={null}>
                    <Environment />
                    <Grid onPlaceBuilding={handlePlaceBuilding} selectedBuilding={selectedBuilding} />
                    
                    {buildings.map(b => (
                        <Building
                            key={b.id}
                            id={b.id}
                            type={b.type}
                            position={[b.x, 0, b.z]}
                            retrofits={b.retrofits}
                            auditMode={auditMode}
                            selected={selectedCityBuildingId === b.id}
                            onSelect={() => selectCityBuilding(b.id)}
                            bubble={bubbleCandidate?.buildingId === b.id ? bubbleCandidate : null}
                            bubbleExpanded={bubbleExpanded && bubbleCandidate?.buildingId === b.id}
                            onBubbleClick={() => {
                                if (!bubbleCandidate) return;
                                setBubbleExpanded(true);
                                recordCitizenFeedback({
                                    id: bubbleCandidate.id,
                                    text: bubbleCandidate.text,
                                    reason: bubbleCandidate.reason,
                                    tone: bubbleCandidate.tone,
                                });
                            }}
                        />
                    ))}
                    
                    <CameraRig joystick={joystick} />
                    <AdaptiveDpr pixelated />
                    <PerformanceMonitor
                        flipflops={3}
                        onDecline={() => {
                            if (graphicsQuality === 'high') setGraphicsQuality('low');
                        }}
                    />
                    {graphicsQuality === 'high' && (
                        <EffectComposer multisampling={0}>
                            <Bloom intensity={0.45} luminanceThreshold={0.72} luminanceSmoothing={0.35} mipmapBlur />
                            <Vignette eskil={false} offset={0.18} darkness={0.48} />
                        </EffectComposer>
                    )}
                </Suspense>
            </Canvas>
            <MobileJoystick axis={joystick} />
            <div className="camera-help" aria-hidden="true">WASD 移动 · Q/E 升降 · 鼠标旋转</div>
        </div>
    );
}
