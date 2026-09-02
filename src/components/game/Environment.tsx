import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

const seeded = (seed: number) => {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
};

function RainParticles() {
  const weather = useGameStore((state) => state.weather);
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);
  const rainRef = useRef<THREE.Points>(null);
  const rainData = useMemo(() => {
    const random = seeded(8172);
    const count = graphicsQuality === 'high' ? 1400 : 600;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (random() - 0.5) * 75;
      positions[index * 3 + 1] = random() * 38;
      positions[index * 3 + 2] = (random() - 0.5) * 75;
      velocities[index] = 14 + random() * 12;
    }
    return { positions, velocities };
  }, [graphicsQuality]);

  useFrame((_, delta) => {
    if (weather !== 'rainy' || !rainRef.current) return;
    const positions = rainRef.current.geometry.attributes.position.array as Float32Array;
    for (let index = 0; index < rainData.velocities.length; index += 1) {
      positions[index * 3 + 1] -= rainData.velocities[index] * delta;
      if (positions[index * 3 + 1] < -1) positions[index * 3 + 1] = 38;
    }
    rainRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (weather !== 'rainy') return null;
  return (
    <points ref={rainRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[rainData.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.12} color="#c7e7ff" transparent opacity={0.58} depthWrite={false} />
    </points>
  );
}

function CloudLayer() {
  const weather = useGameStore((state) => state.weather);
  const groupRef = useRef<THREE.Group>(null);
  const clouds = useMemo(() => {
    const random = seeded(4419);
    return Array.from({ length: 12 }, (_, index) => ({
      id: index,
      x: (random() - 0.5) * 72,
      y: 17 + random() * 9,
      z: (random() - 0.5) * 72,
      scale: 1.3 + random() * 2.2,
    }));
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.x += delta * 0.42;
    if (groupRef.current.position.x > 12) groupRef.current.position.x = -12;
  });

  if (weather === 'sunny') return null;
  const color = weather === 'rainy' ? '#4b5c73' : weather === 'foggy' ? '#cbd1d8' : '#eef4f8';
  const opacity = weather === 'foggy' ? 0.38 : weather === 'rainy' ? 0.68 : 0.78;

  return (
    <group ref={groupRef}>
      {clouds.map((cloud) => (
        <group key={cloud.id} position={[cloud.x, cloud.y, cloud.z]} scale={cloud.scale}>
          <mesh position={[-0.62, 0, 0]}>
            <sphereGeometry args={[0.9, 10, 8]} />
            <meshLambertMaterial color={color} transparent opacity={opacity} depthWrite={false} />
          </mesh>
          <mesh position={[0.48, 0.08, 0.08]}>
            <sphereGeometry args={[0.82, 10, 8]} />
            <meshLambertMaterial color={color} transparent opacity={opacity} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.32, -0.12]}>
            <sphereGeometry args={[1.08, 10, 8]} />
            <meshLambertMaterial color={color} transparent opacity={opacity} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function StarField() {
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);
  const isNight = useGameStore((state) => state.isNight);
  const starsIndex = useGameStore((state) => state.stars);
  const weather = useGameStore((state) => state.weather);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const visibilityRef = useRef(isNight ? 1 : 0);

  const starData = useMemo(() => {
    const random = seeded(98231);
    const count = graphicsQuality === 'high' ? 3600 : 1400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const theta = random() * Math.PI * 2;
      const milkyWay = random() < 0.46;
      const phi = milkyWay ? Math.PI / 2 + (random() - 0.5) * 0.34 : Math.acos(random() * 2 - 1);
      const radius = 78 + random() * 30;
      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = Math.abs(radius * Math.cos(phi)) + 7;
      positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      const brightness = milkyWay ? 0.72 + random() * 0.28 : 0.48 + random() * 0.45;
      colors[index * 3] = brightness * (random() > 0.92 ? 0.75 : 1);
      colors[index * 3 + 1] = brightness * (random() > 0.5 ? 0.92 : 1);
      colors[index * 3 + 2] = Math.min(1, brightness * 1.1);
    }
    return { positions, colors };
  }, [graphicsQuality]);

  useFrame((state, delta) => {
    if (!materialRef.current) return;
    visibilityRef.current = THREE.MathUtils.damp(visibilityRef.current, isNight ? 1 : 0, 2.2, delta);
    const weatherPenalty = weather === 'rainy' || weather === 'foggy' ? 0.04 : weather === 'cloudy' ? 0.32 : 1;
    const intensity = visibilityRef.current * Math.max(0.06, starsIndex / 100) * weatherPenalty;
    materialRef.current.opacity = intensity * (0.88 + Math.sin(state.clock.elapsedTime * 1.2) * 0.08);
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.0025;
  });

  return (
    <group ref={groupRef} rotation={[0.18, 0, -0.18]}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starData.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[starData.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={materialRef}
          vertexColors
          transparent
          opacity={0}
          size={graphicsQuality === 'high' ? 0.68 : 0.9}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <mesh position={[0, 48, -72]} rotation={[0, 0, -0.35]}>
        <planeGeometry args={[72, 16]} />
        <meshBasicMaterial color="#8db6ff" transparent opacity={(isNight ? 1 : 0) * (starsIndex / 100) * 0.045} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function CelestialBodies({ progress }: { progress: MutableRefObject<number> }) {
  const sunRef = useRef<THREE.Group>(null);
  const moonRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const value = progress.current;
    if (sunRef.current) {
      sunRef.current.position.set(24 - value * 48, 20 - value * 10, -34);
      sunRef.current.visible = value < 0.75;
    }
    if (moonRef.current) {
      moonRef.current.position.set(-20 + (1 - value) * 10, 18 + value * 9, -30);
      moonRef.current.visible = value > 0.3;
    }
  });

  return (
    <>
      <group ref={sunRef} position={[24, 20, -34]}>
        <mesh>
          <sphereGeometry args={[2.3, 24, 24]} />
          <meshBasicMaterial color="#ffe59a" />
        </mesh>
        <pointLight color="#ffd58a" intensity={12} distance={22} decay={2} />
      </group>
      <group ref={moonRef} position={[-20, 25, -30]}>
        <mesh>
          <sphereGeometry args={[1.45, 24, 24]} />
          <meshStandardMaterial color="#dfeaff" emissive="#9ebdff" emissiveIntensity={0.45} roughness={0.9} />
        </mesh>
      </group>
    </>
  );
}

export function Environment() {
  const isNight = useGameStore((state) => state.isNight);
  const lightPollution = useGameStore((state) => state.lightPollution);
  const weather = useGameStore((state) => state.weather);
  const ambientRef = useRef<THREE.HemisphereLight>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const progressRef = useRef(isNight ? 1 : 0);
  const palette = useMemo(() => ({
    day: new THREE.Color('#78b9df'),
    dusk: new THREE.Color('#e88466'),
    night: new THREE.Color('#05091b'),
    rainy: new THREE.Color('#33465f'),
    foggy: new THREE.Color('#a6afb9'),
    cloudy: new THREE.Color('#657b91'),
    current: new THREE.Color(),
  }), []);

  useFrame((state, delta) => {
    progressRef.current = THREE.MathUtils.damp(progressRef.current, isNight ? 1 : 0, 0.9, delta);
    const progress = progressRef.current;
    const dayBase = weather === 'rainy' ? palette.rainy : weather === 'foggy' ? palette.foggy : weather === 'cloudy' ? palette.cloudy : palette.day;
    if (progress < 0.5) palette.current.lerpColors(dayBase, palette.dusk, progress * 2);
    else palette.current.lerpColors(palette.dusk, palette.night, (progress - 0.5) * 2);
    state.scene.background = palette.current;
    const skyGlowFog = isNight ? (lightPollution / 100) * 0.012 : 0;
    state.scene.fog = new THREE.FogExp2(palette.current.getHex(), (weather === 'foggy' ? 0.055 : weather === 'rainy' ? 0.028 : weather === 'cloudy' ? 0.02 : 0.012) + skyGlowFog);

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(weather === 'sunny' ? 0.9 : 0.58, 0.28, progress);
      ambientRef.current.color.set(progress > 0.55 ? '#88a8ff' : '#dff6ff');
      ambientRef.current.groundColor.set(progress > 0.55 ? '#071120' : '#54764b');
    }
    if (sunRef.current) {
      const angle = THREE.MathUtils.lerp(Math.PI / 5, Math.PI * 0.92, progress);
      sunRef.current.position.set(Math.cos(angle) * 32, Math.sin(angle) * 28, 16);
      sunRef.current.intensity = THREE.MathUtils.lerp(weather === 'sunny' ? 2.1 : 1.05, 0.18, progress);
      sunRef.current.color.set(progress < 0.45 ? '#fff4d6' : '#9bb6ff');
    }
  });

  return (
    <>
      <hemisphereLight ref={ambientRef} intensity={0.85} color="#dff6ff" groundColor="#54764b" />
      <directionalLight
        ref={sunRef}
        position={[18, 30, 18]}
        intensity={2}
        castShadow
        shadow-mapSize-width={1536}
        shadow-mapSize-height={1536}
        shadow-camera-left={-32}
        shadow-camera-right={32}
        shadow-camera-top={32}
        shadow-camera-bottom={-32}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0003}
      />
      {isNight && <pointLight position={[0, 8, 0]} intensity={6 + lightPollution * 0.28} color={lightPollution > 55 ? '#ff9b62' : '#4f7cff'} distance={42} decay={2} />}
      <CelestialBodies progress={progressRef} />
      <StarField />
      <RainParticles />
      <CloudLayer />
    </>
  );
}
