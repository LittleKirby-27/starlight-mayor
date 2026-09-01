import { useEffect, useMemo, useRef, useState } from 'react';
import { type ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type BuildingType, useGameStore } from '../../store/gameStore';

const GRID_SIZE = 64;
const ROAD_LINES = [-12, 12];
const ROAD_WIDTH = 2.4;

const seeded = (seed: number) => {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
};

const isWater = (x: number, z: number) => {
  if (x >= -20.5 && x <= -15) return true;
  return Math.hypot(x - 17, z + 17) <= 9.5;
};

const isRoad = (x: number, z: number) => ROAD_LINES.some((line) => Math.abs(x - line) < ROAD_WIDTH || Math.abs(z - line) < ROAD_WIDTH);

function Waterways() {
  const riverRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const lakeRef = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame((state) => {
    const shimmer = 0.52 + Math.sin(state.clock.elapsedTime * 0.65) * 0.08;
    if (riverRef.current) riverRef.current.emissiveIntensity = shimmer;
    if (lakeRef.current) lakeRef.current.emissiveIntensity = shimmer * 0.88;
  });

  return (
    <group>
      <mesh position={[-17.75, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5.5, GRID_SIZE]} />
        <meshPhysicalMaterial
          ref={riverRef}
          color="#177ea2"
          emissive="#062f52"
          emissiveIntensity={0.5}
          roughness={0.18}
          metalness={0.05}
          clearcoat={0.85}
          clearcoatRoughness={0.15}
          transparent
          opacity={0.92}
        />
      </mesh>
      {[-20.7, -14.8].map((x) => (
        <mesh key={x} position={[x, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.24, GRID_SIZE]} />
          <meshBasicMaterial color="#d7f5ff" transparent opacity={0.45} />
        </mesh>
      ))}
      <mesh position={[17, -0.1, -17]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[9.5, 64]} />
        <meshPhysicalMaterial
          ref={lakeRef}
          color="#1c7fae"
          emissive="#07355d"
          emissiveIntensity={0.45}
          roughness={0.12}
          metalness={0.08}
          clearcoat={1}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh position={[17, -0.04, -17]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[9.25, 9.55, 64]} />
        <meshBasicMaterial color="#d7f5ff" transparent opacity={0.4} />
      </mesh>
      <mesh position={[-17.75, 0.04, -9]} rotation={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.4, 0.32, 2.1]} />
        <meshStandardMaterial color="#56616d" roughness={0.88} />
      </mesh>
      {[-20.6, -14.9].map((x) => (
        <mesh key={x} position={[x, 0.36, -9]} castShadow>
          <boxGeometry args={[0.16, 0.52, 2.2]} />
          <meshStandardMaterial color="#ccd5dc" metalness={0.3} roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

function RoadNetwork() {
  return (
    <group>
      {ROAD_LINES.map((line) => (
        <group key={`roads-${line}`}>
          <mesh position={[line, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[ROAD_WIDTH * 2, GRID_SIZE]} />
            <meshStandardMaterial color="#28313b" roughness={0.96} />
          </mesh>
          <mesh position={[0, 0.026, line]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[GRID_SIZE, ROAD_WIDTH * 2]} />
            <meshStandardMaterial color="#28313b" roughness={0.96} />
          </mesh>
          {Array.from({ length: 15 }, (_, index) => index * 4 - 28).map((offset) => (
            <group key={`mark-${line}-${offset}`}>
              <mesh position={[line, 0.035, offset]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.12, 1.7]} />
                <meshBasicMaterial color="#f6d56d" />
              </mesh>
              <mesh position={[offset, 0.036, line]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
                <planeGeometry args={[0.12, 1.7]} />
                <meshBasicMaterial color="#f6d56d" />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

function InstancedLandscape() {
  const treeTrunks = useRef<THREE.InstancedMesh>(null);
  const treeCrowns = useRef<THREE.InstancedMesh>(null);
  const lampPoles = useRef<THREE.InstancedMesh>(null);
  const lampBulbs = useRef<THREE.InstancedMesh>(null);
  const isNight = useGameStore((state) => state.isNight);

  const trees = useMemo(() => {
    const random = seeded(2507);
    const points: Array<[number, number, number]> = [];
    while (points.length < 54) {
      const x = Math.round((random() - 0.5) * 58);
      const z = Math.round((random() - 0.5) * 58);
      if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;
      if (isWater(x, z) || isRoad(x, z)) continue;
      points.push([x, 0, z]);
    }
    return points;
  }, []);

  const lamps = useMemo(() => {
    const points: Array<[number, number, number]> = [];
    for (const line of ROAD_LINES) {
      for (let offset = -28; offset <= 28; offset += 5) {
        if (!isWater(line - 2.8, offset)) points.push([line - 2.8, 0, offset]);
        if (!isWater(offset, line + 2.8)) points.push([offset, 0, line + 2.8]);
      }
    }
    return points;
  }, []);

  useEffect(() => {
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    trees.forEach(([x, , z], index) => {
      const treeScale = 0.72 + (index % 5) * 0.09;
      matrix.compose(new THREE.Vector3(x, 0.7 * treeScale, z), quaternion, scale.set(0.42 * treeScale, 1.4 * treeScale, 0.42 * treeScale));
      treeTrunks.current?.setMatrixAt(index, matrix);
      matrix.compose(new THREE.Vector3(x, 2 * treeScale, z), quaternion, scale.set(0.95 * treeScale, 1.2 * treeScale, 0.95 * treeScale));
      treeCrowns.current?.setMatrixAt(index, matrix);
    });
    if (treeTrunks.current) treeTrunks.current.instanceMatrix.needsUpdate = true;
    if (treeCrowns.current) treeCrowns.current.instanceMatrix.needsUpdate = true;

    lamps.forEach(([x, , z], index) => {
      matrix.compose(new THREE.Vector3(x, 1.05, z), quaternion, scale.set(0.07, 2.1, 0.07));
      lampPoles.current?.setMatrixAt(index, matrix);
      matrix.compose(new THREE.Vector3(x, 2.18, z), quaternion, scale.set(0.16, 0.16, 0.16));
      lampBulbs.current?.setMatrixAt(index, matrix);
    });
    if (lampPoles.current) lampPoles.current.instanceMatrix.needsUpdate = true;
    if (lampBulbs.current) lampBulbs.current.instanceMatrix.needsUpdate = true;
  }, [lamps, trees]);

  return (
    <>
      <instancedMesh ref={treeTrunks} args={[undefined, undefined, trees.length]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1.15, 1, 7]} />
        <meshStandardMaterial color="#744b2b" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={treeCrowns} args={[undefined, undefined, trees.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#2f7d4a" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={lampPoles} args={[undefined, undefined, lamps.length]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial color="#48515c" metalness={0.7} roughness={0.38} />
      </instancedMesh>
      <instancedMesh ref={lampBulbs} args={[undefined, undefined, lamps.length]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#ffe5a2" emissive="#ffcb58" emissiveIntensity={isNight ? 3.2 : 0.08} toneMapped={false} />
      </instancedMesh>
    </>
  );
}

function Traffic() {
  const group = useRef<THREE.Group>(null);
  const isPaused = useGameStore((state) => state.isPaused);

  useFrame((_, delta) => {
    if (!group.current || isPaused) return;
    group.current.children.forEach((car, index) => {
      car.position.z += delta * (1.7 + index * 0.18);
      if (car.position.z > 31) car.position.z = -31;
    });
  });

  return (
    <group ref={group}>
      {['#ff6b6b', '#4dc9ff', '#ffe06f', '#e8eef4'].map((color, index) => (
        <group key={color} position={[-11 + (index % 2) * 22, 0.25, -28 + index * 9]}>
          <mesh castShadow>
            <boxGeometry args={[0.82, 0.32, 1.45]} />
            <meshStandardMaterial color={color} metalness={0.18} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.26, -0.08]} castShadow>
            <boxGeometry args={[0.68, 0.28, 0.7]} />
            <meshStandardMaterial color="#bce3ef" metalness={0.3} roughness={0.18} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function TerrainDecor() {
  return (
    <group>
      <group position={[25, -0.2, 23]}>
        <mesh receiveShadow castShadow>
          <coneGeometry args={[9, 6, 10]} />
          <meshStandardMaterial color="#42794b" roughness={1} />
        </mesh>
        <mesh position={[-4, 1.6, 1]} receiveShadow castShadow>
          <coneGeometry args={[5.5, 4.3, 9]} />
          <meshStandardMaterial color="#3b6b45" roughness={1} />
        </mesh>
        <mesh position={[0, 3.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.1, 10]} />
          <meshStandardMaterial color="#dde7e8" roughness={0.9} />
        </mesh>
      </group>
      <group position={[-27, -0.4, 24]}>
        <mesh receiveShadow castShadow>
          <coneGeometry args={[6.5, 4.2, 9]} />
          <meshStandardMaterial color="#4c8154" roughness={1} />
        </mesh>
        <mesh position={[4, -0.2, -2]} receiveShadow castShadow>
          <coneGeometry args={[4.8, 3.2, 9]} />
          <meshStandardMaterial color="#3f7147" roughness={1} />
        </mesh>
      </group>
    </group>
  );
}

export function Grid({ onPlaceBuilding, selectedBuilding }: { onPlaceBuilding: (x: number, z: number) => void; selectedBuilding: BuildingType | null }) {
  const buildings = useGameStore((state) => state.buildings);
  const [hoverPos, setHoverPos] = useState<[number, number, number] | null>(null);
  const [canPlace, setCanPlace] = useState(false);

  const evaluatePosition = (x: number, z: number) => {
    const withinBounds = Math.abs(x) <= GRID_SIZE / 2 - 2 && Math.abs(z) <= GRID_SIZE / 2 - 2;
    const occupied = buildings.some((building) => Math.hypot(building.x - x, building.z - z) < 1.8);
    return withinBounds && !isWater(x, z) && !isRoad(x, z) && !occupied;
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!selectedBuilding) {
      setHoverPos(null);
      return;
    }
    event.stopPropagation();
    const x = Math.round(event.point.x / 2) * 2;
    const z = Math.round(event.point.z / 2) * 2;
    setHoverPos([x, 0.08, z]);
    setCanPlace(evaluatePosition(x, z));
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!selectedBuilding || !hoverPos || !canPlace) return;
    event.stopPropagation();
    onPlaceBuilding(hoverPos[0], hoverPos[2]);
  };

  return (
    <group>
      <mesh position={[0, -1.55, 0]} receiveShadow>
        <boxGeometry args={[GRID_SIZE, 3, GRID_SIZE]} />
        <meshStandardMaterial color="#775937" roughness={1} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onPointerMove={handlePointerMove}
        onPointerOut={() => setHoverPos(null)}
        onClick={handleClick}
      >
        <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
        <meshStandardMaterial color="#76a86a" roughness={0.96} />
      </mesh>
      <gridHelper args={[GRID_SIZE, GRID_SIZE / 2, '#c7e7a8', '#8fba78']} position={[0, 0.012, 0]} />
      <RoadNetwork />
      <Waterways />
      <InstancedLandscape />
      <Traffic />
      <TerrainDecor />

      {selectedBuilding && hoverPos && (
        <group position={hoverPos}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.7, 1.7]} />
            <meshBasicMaterial color={canPlace ? '#77ff9c' : '#ff5f6d'} transparent opacity={0.55} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[1.72, 0.4, 1.72]} />
            <meshBasicMaterial color={canPlace ? '#37d66b' : '#e54855'} wireframe transparent opacity={0.78} />
          </mesh>
        </group>
      )}
    </group>
  );
}
