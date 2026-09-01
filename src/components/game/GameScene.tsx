import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, OrbitControls, PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useGameStore, BuildingType } from '../../store/gameStore';
import { Building } from './Building';
import { Grid } from './Grid';
import { Environment } from './Environment';

interface GameSceneProps {
    selectedBuilding: BuildingType | null;
    onBuildingPlaced: () => void;
}

export function GameScene({ selectedBuilding, onBuildingPlaced }: GameSceneProps) {
    const buildings = useGameStore(state => state.buildings);
    const addBuilding = useGameStore(state => state.addBuilding);
    const graphicsQuality = useGameStore(state => state.graphicsQuality);
    const setGraphicsQuality = useGameStore(state => state.setGraphicsQuality);

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
                        <Building key={b.id} type={b.type} position={[b.x, 0, b.z]} />
                    ))}
                    
                    <OrbitControls 
                        makeDefault
                        regress
                        target={[0, 1.5, 0]}
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        enableDamping
                        dampingFactor={0.07}
                        maxPolarAngle={Math.PI / 2.16}
                        minPolarAngle={Math.PI / 7}
                        minDistance={10}
                        maxDistance={74}
                    />
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
        </div>
    );
}
