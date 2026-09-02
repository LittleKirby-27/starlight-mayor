import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore, BuildingType } from '../../store/gameStore';
import * as THREE from 'three';

// Building Colors
const BUILDING_COLORS: Record<BuildingType, { body: number, roof: number }> = {
  residential: { body: 0xFFD700, roof: 0xFF6B6B },
  commercial:  { body: 0x4ECDC4, roof: 0x2C3E50 },
  industrial:  { body: 0x95A5A6, roof: 0x7F8C8D },
  park:        { body: 0x2ECC71, roof: 0x27AE60 },
  school:      { body: 0xF39C12, roof: 0xE67E22 },
  subway:      { body: 0x3498DB, roof: 0x2980B9 },
  wind:        { body: 0xECF0F1, roof: 0xBDC3C7 },
  solar:       { body: 0x1ABC9C, roof: 0x16A085 },
  hospital:    { body: 0xFFFFFF, roof: 0xE74C3C },
  police:      { body: 0x34495E, roof: 0x2980B9 },
  fire_station:{ body: 0xC0392B, roof: 0x7F8C8D },
  library:     { body: 0xF5B041, roof: 0x8E44AD },
  luxury_residential: { body: 0xBDC3C7, roof: 0x34495E },
  skyscraper:  { body: 0x85C1E9, roof: 0x2E86C1 },
  stadium:     { body: 0xECF0F1, roof: 0x1ABC9C },
};

const BUILDING_GEOMETRY: Record<BuildingType, { bodyHeight: number, bodyRadius?: number, roofType: 'cone' | 'flat' | 'none', roofHeight?: number }> = {
  residential: { bodyHeight: 1.5, roofType: 'none' }, // Now a cluster
  commercial:  { bodyHeight: 4, roofType: 'flat' },
  industrial:  { bodyHeight: 2, roofType: 'none' }, // Now a cluster
  park:        { bodyHeight: 0.2, roofType: 'none' },
  school:      { bodyHeight: 1.5, roofType: 'flat' },
  subway:      { bodyHeight: 0.8, roofType: 'none' },
  wind:        { bodyHeight: 3, bodyRadius: 0.1, roofType: 'none' },
  solar:       { bodyHeight: 0.5, roofType: 'none' },
  hospital:    { bodyHeight: 2, roofType: 'flat' },
  police:      { bodyHeight: 1.8, roofType: 'flat' },
  fire_station:{ bodyHeight: 1.8, roofType: 'flat' },
  library:     { bodyHeight: 1.5, roofType: 'cone', roofHeight: 0.5 },
  luxury_residential: { bodyHeight: 3.5, roofType: 'flat' },
  skyscraper:  { bodyHeight: 6, roofType: 'flat' },
  stadium:     { bodyHeight: 1, bodyRadius: 1.25, roofType: 'none' },
};

const textureCache: Record<string, { map: THREE.CanvasTexture, emissiveMap: THREE.CanvasTexture } | null> = {};
const FACADE_TEXTURE_SIZE = 768;

function stableHash(value: string) {
    return value.split('').reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
}

function lightenHex(color: number, amount: number) {
    const source = new THREE.Color(color);
    source.lerp(new THREE.Color(0xffffff), amount);
    return `#${source.getHexString()}`;
}

function darkenHex(color: number, amount: number) {
    const source = new THREE.Color(color);
    source.lerp(new THREE.Color(0x000000), amount);
    return `#${source.getHexString()}`;
}

function getBuildingTextures(type: string, bodyColor: number) {
    let rows = 0, cols = 0;
    if (type === 'skyscraper') { rows = 12; cols = 4; }
    else if (type === 'commercial') { rows = 6; cols = 3; }
    else if (type === 'residential') { rows = 4; cols = 2; }
    else if (type === 'hospital') { rows = 5; cols = 5; }
    else if (type === 'luxury_residential') { rows = 8; cols = 3; }
    else if (type === 'police' || type === 'fire_station' || type === 'library' || type === 'school') { rows = 3; cols = 3; }

    if (rows === 0) return null;

    const key = `${type}_${bodyColor}`;
    if (textureCache[key] !== undefined) return textureCache[key];

    const canvas = document.createElement('canvas');
    canvas.width = FACADE_TEXTURE_SIZE; canvas.height = FACADE_TEXTURE_SIZE;
    const ctx = canvas.getContext('2d')!;
    
    const eCanvas = document.createElement('canvas');
    eCanvas.width = FACADE_TEXTURE_SIZE; eCanvas.height = FACADE_TEXTURE_SIZE;
    const eCtx = eCanvas.getContext('2d')!;

    // Layered facade: soft vertical gradient, floor bands and framed windows.
    const size = FACADE_TEXTURE_SIZE;
    const scale = size / 512;
    const facadeGradient = ctx.createLinearGradient(0, 0, size, 0);
    facadeGradient.addColorStop(0, darkenHex(bodyColor, 0.14));
    facadeGradient.addColorStop(0.48, lightenHex(bodyColor, 0.08));
    facadeGradient.addColorStop(1, darkenHex(bodyColor, 0.2));
    ctx.fillStyle = facadeGradient;
    ctx.fillRect(0, 0, size, size);
    eCtx.fillStyle = '#000000';
    eCtx.fillRect(0, 0, size, size);

    // Fine facade seams keep surfaces readable when viewed at a shallow camera angle.
    ctx.strokeStyle = 'rgba(235, 245, 248, 0.1)';
    ctx.lineWidth = Math.max(1, 1.25 * scale);
    for (let x = 0; x <= size; x += 64 * scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size);
        ctx.stroke();
    }

    const seed = stableHash(`${type}_${bodyColor}`);
    const padX = 24 * scale;
    const padY = 20 * scale;
    const w = (size - padX * (cols + 1)) / cols;
    const h = (size - padY * (rows + 1)) / rows;

    for (let i = 0; i < rows; i++) {
        ctx.fillStyle = 'rgba(25, 35, 45, 0.22)';
        ctx.fillRect(0, padY + i * (h + padY) + h + 5 * scale, size, 5 * scale);
        for (let j = 0; j < cols; j++) {
            const x = padX + j * (w + padX);
            const y = padY + i * (h + padY);
            ctx.fillStyle = '#b8cbd5';
            ctx.fillRect(x - 4 * scale, y - 4 * scale, w + 8 * scale, h + 8 * scale);
            const windowGradient = ctx.createLinearGradient(x, y, x + w, y + h);
            windowGradient.addColorStop(0, '#183247');
            windowGradient.addColorStop(0.48, '#31566f');
            windowGradient.addColorStop(0.52, '#203d52');
            windowGradient.addColorStop(1, '#102838');
            ctx.fillStyle = windowGradient;
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = 'rgba(210, 235, 245, 0.25)';
            ctx.fillRect(x + 3 * scale, y + 3 * scale, Math.max(2 * scale, w * 0.08), h - 6 * scale);
            ctx.fillStyle = 'rgba(205, 228, 238, 0.38)';
            ctx.fillRect(x + w * 0.5 - scale, y, 2 * scale, h);
            ctx.fillStyle = 'rgba(235, 245, 248, 0.3)';
            ctx.fillRect(x, y + h * 0.52 - scale, w, 2 * scale);
            ctx.fillStyle = 'rgba(10, 25, 34, 0.42)';
            ctx.fillRect(x - 5 * scale, y + h + 2 * scale, w + 10 * scale, 3 * scale);

            // Deterministic lighting avoids buildings changing appearance on reload.
            if (((seed + i * 17 + j * 29) % 10) >= 3) {
                const glow = eCtx.createLinearGradient(x, y, x, y + h);
                glow.addColorStop(0, '#fff5b8');
                glow.addColorStop(1, '#f0b542');
                eCtx.fillStyle = glow;
                eCtx.fillRect(x, y, w, h);
            }
        }
    }

    const map = new THREE.CanvasTexture(canvas);
    map.minFilter = THREE.LinearMipmapLinearFilter;
    map.magFilter = THREE.LinearFilter;
    map.generateMipmaps = true;
    map.colorSpace = THREE.SRGBColorSpace;
    const emissiveMap = new THREE.CanvasTexture(eCanvas);
    emissiveMap.minFilter = THREE.LinearMipmapLinearFilter;
    emissiveMap.magFilter = THREE.LinearFilter;
    emissiveMap.generateMipmaps = true;
    emissiveMap.colorSpace = THREE.SRGBColorSpace;
    
    textureCache[key] = { map, emissiveMap };
    return textureCache[key];
}

function Entrance({ width = 0.5, position = [0, 0.34, 0.53], accent = '#7bdff2' }: {
  width?: number;
  position?: [number, number, number];
  accent?: string;
}) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[width, 0.58, 0.05]} />
        <meshPhysicalMaterial color="#294657" roughness={0.12} metalness={0.22} clearcoat={0.75} />
      </mesh>
      <mesh position={[0, 0.36, 0.08]} castShadow>
        <boxGeometry args={[width + 0.18, 0.08, 0.28]} />
        <meshStandardMaterial color={accent} roughness={0.28} metalness={0.22} />
      </mesh>
      <mesh position={[-0.02, -0.33, 0.14]} receiveShadow>
        <boxGeometry args={[width + 0.34, 0.08, 0.38]} />
        <meshStandardMaterial color="#c5cbd0" roughness={0.9} />
      </mesh>
    </group>
  );
}

function RoofEquipment({ y, wide = false }: { y: number; wide?: boolean }) {
  return (
    <group position={[0, y, 0]}>
      <mesh position={[-0.24, 0.11, 0.08]} castShadow>
        <boxGeometry args={[wide ? 0.42 : 0.3, 0.22, 0.32]} />
        <meshStandardMaterial color="#aab4bb" roughness={0.56} metalness={0.42} />
      </mesh>
      <mesh position={[0.25, 0.09, -0.16]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.18, 12]} />
        <meshStandardMaterial color="#7f8c8d" roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
  );
}

function CivicSiteDetails({ accent, isNight }: { accent: string; isNight: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.075, 0.79]} receiveShadow>
        <boxGeometry args={[0.62, 0.05, 0.46]} />
        <meshStandardMaterial color="#b7bdc0" roughness={0.93} />
      </mesh>
      {[-0.43, 0.43].map((x) => (
        <group key={x} position={[x, 0, 0.73]}>
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.045, 0.48, 10]} />
            <meshStandardMaterial color="#4d5b64" metalness={0.58} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.51, 0]}>
            <sphereGeometry args={[0.075, 12, 8]} />
            <meshStandardMaterial color="#fff0b5" emissive={isNight ? accent : '#000000'} emissiveIntensity={isNight ? 1.25 : 0} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Building({ type, position }: { type: BuildingType, position: [number, number, number] }) {
  const isNight = useGameStore(state => state.isNight);
  const colors = BUILDING_COLORS[type];
  const geo = BUILDING_GEOMETRY[type];
  const gl = useThree((state) => state.gl);
  
  const windBladeRef = useRef<THREE.Group>(null);
  const rotationY = useMemo(() => {
      const typeSeed = type.split('').reduce((total, letter) => total + letter.charCodeAt(0), 0);
      return ((Math.abs(position[0] * 7 + position[2] * 11 + typeSeed) % 4) * Math.PI) / 2;
  }, [position, type]);
  
  useFrame((_, delta) => {
      if (type === 'wind' && windBladeRef.current) {
          windBladeRef.current.rotation.z += delta * 2;
      }
  });

  const tex = useMemo(() => getBuildingTextures(type, colors.body), [type, colors.body]);

  useEffect(() => {
      if (!tex) return;
      const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      tex.map.anisotropy = anisotropy;
      tex.emissiveMap.anisotropy = anisotropy;
      tex.map.needsUpdate = true;
      tex.emissiveMap.needsUpdate = true;
  }, [gl, tex]);
  
  const emissiveColor = isNight && (!tex) && (type === 'commercial' || type === 'residential' || type === 'industrial' || type === 'luxury_residential' || type === 'skyscraper' || type === 'hospital' || type === 'police' || type === 'fire_station' || type === 'library' || type === 'stadium' || type === 'school') 
      ? new THREE.Color(colors.body).multiplyScalar(0.5) 
      : new THREE.Color(0x000000);

  const matProps = tex ? {
      color: 0xffffff,
      map: tex.map,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: tex.emissiveMap,
      emissiveIntensity: isNight ? 1.0 : 0
  } : {
      color: colors.body,
      emissive: emissiveColor,
      emissiveIntensity: isNight ? 0.5 : 0
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={1.34}>
      {type !== 'park' && type !== 'wind' && type !== 'solar' && type !== 'subway' && (
        <mesh position={[0, 0.06, 0]} receiveShadow>
          <boxGeometry args={[1.55, 0.12, 1.55]} />
          <meshStandardMaterial color="#87909a" roughness={0.94} />
        </mesh>
      )}
      {(['commercial', 'school', 'hospital', 'police', 'fire_station', 'library'] as BuildingType[]).includes(type) && (
        <CivicSiteDetails accent={`#${colors.roof.toString(16).padStart(6, '0')}`} isNight={isNight} />
      )}
      {/* Main Body */}
      {type === 'wind' ? (
          <mesh position={[0, geo.bodyHeight / 2, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[geo.bodyRadius, geo.bodyRadius, geo.bodyHeight, 8]} />
              <meshStandardMaterial {...matProps} roughness={0.7} />
          </mesh>
      ) : type === 'skyscraper' ? (
          <group>
              <mesh position={[-0.22, 2.75, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.92, 5.5, 1.15]} />
                  <meshStandardMaterial {...matProps} roughness={0.28} metalness={0.32} />
              </mesh>
              <mesh position={[0.46, 2.1, 0.1]} castShadow receiveShadow>
                  <boxGeometry args={[0.46, 4.2, 0.86]} />
                  <meshStandardMaterial color="#4f82a8" roughness={0.32} metalness={0.38} />
              </mesh>
              <mesh position={[-0.22, 5.72, 0]} castShadow>
                  <boxGeometry args={[1.08, 0.18, 1.28]} />
                  <meshStandardMaterial color="#d8edf7" emissive={isNight ? '#87c9ff' : '#000000'} emissiveIntensity={isNight ? 0.7 : 0} />
              </mesh>
              {[-0.69, 0.25].map(x => (
                  <mesh key={x} position={[x, 3.08, 0.58]} castShadow>
                      <boxGeometry args={[0.055, 4.85, 0.06]} />
                      <meshStandardMaterial color="#d7edf5" metalness={0.62} roughness={0.22} />
                  </mesh>
              ))}
              <mesh position={[-0.22, 0.52, 0.64]} castShadow>
                  <boxGeometry args={[0.68, 0.98, 0.14]} />
                  <meshPhysicalMaterial color="#16384e" roughness={0.06} metalness={0.28} clearcoat={1} />
              </mesh>
              <mesh position={[-0.22, 1.08, 0.74]} castShadow>
                  <boxGeometry args={[0.86, 0.08, 0.38]} />
                  <meshStandardMaterial color="#cce6ef" roughness={0.24} metalness={0.34} />
              </mesh>
              <RoofEquipment y={5.86} wide />
          </group>
      ) : type === 'stadium' ? (
          <group position={[0, geo.bodyHeight / 2, 0]}>
              <mesh position={[0, -geo.bodyHeight/2 + 0.1, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                  <circleGeometry args={[geo.bodyRadius! - 0.2, 32]} />
                  <meshStandardMaterial color="#27AE60" roughness={0.9} />
              </mesh>
              <mesh position={[0, -0.08, 0]} rotation={[-Math.PI/2, 0, 0]} castShadow receiveShadow>
                  <torusGeometry args={[geo.bodyRadius!, 0.38, 12, 40]} />
                  <meshStandardMaterial {...matProps} roughness={0.42} metalness={0.08} />
              </mesh>
              <mesh position={[0, 0.16, 0]} rotation={[-Math.PI/2, 0, 0]} castShadow>
                  <torusGeometry args={[0.92, 0.17, 10, 40]} />
                  <meshStandardMaterial color="#5f7280" roughness={0.58} />
              </mesh>
              <mesh position={[0, -0.39, 0]} rotation={[-Math.PI/2, 0, 0]}>
                  <ringGeometry args={[0.56, 0.58, 40]} />
                  <meshStandardMaterial color="#f4f4e8" roughness={0.8} />
              </mesh>
              {[-0.42, 0.42].map((x) => (
                  <mesh key={`field-${x}`} position={[x, -0.385, 0]} rotation={[-Math.PI/2, 0, 0]}>
                      <boxGeometry args={[0.025, 0.72, 0.012]} />
                      <meshStandardMaterial color="#ecf0f1" />
                  </mesh>
              ))}
              {[[-1.12, -0.82], [1.12, -0.82], [-1.12, 0.82], [1.12, 0.82]].map(([x, z], index) => (
                  <group key={`flood-${index}`} position={[x, 0.2, z]}>
                      <mesh position={[0, 0.62, 0]} castShadow>
                          <cylinderGeometry args={[0.025, 0.04, 1.25, 8]} />
                          <meshStandardMaterial color="#65747d" metalness={0.5} roughness={0.45} />
                      </mesh>
                      <mesh position={[0, 1.24, 0]} rotation={[0, index % 2 ? -0.35 : 0.35, 0]}>
                          <boxGeometry args={[0.28, 0.12, 0.08]} />
                          <meshStandardMaterial color="#f5f0d0" emissive={isNight ? '#fff3b0' : '#000000'} emissiveIntensity={isNight ? 1.4 : 0} />
                      </mesh>
                  </group>
              ))}
          </group>
      ) : type === 'solar' ? (
          <group position={[0, 0, 0]}>
              {/* Base structure */}
              <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
                  <boxGeometry args={[1.4, 0.2, 1.4]} />
                  <meshStandardMaterial color="#7F8C8D" roughness={0.8} />
              </mesh>
              {/* Solar panels */}
              {[-0.46, 0, 0.46].map(z => (
                  <group key={z} position={[0, 0.36, z]} rotation={[-Math.PI/6, 0, 0]}>
                      <mesh castShadow receiveShadow>
                          <boxGeometry args={[1.45, 0.06, 0.34]} />
                          <meshPhysicalMaterial color="#123f66" roughness={0.12} metalness={0.72} clearcoat={0.95} clearcoatRoughness={0.1} />
                      </mesh>
                      {[-0.48, 0, 0.48].map(x => (
                          <mesh key={x} position={[x, 0.035, 0]}>
                              <boxGeometry args={[0.018, 0.012, 0.32]} />
                              <meshStandardMaterial color="#b9d9e8" metalness={0.7} roughness={0.26} />
                          </mesh>
                      ))}
                      <mesh position={[0, 0.036, 0]}>
                          <boxGeometry args={[1.42, 0.012, 0.018]} />
                          <meshStandardMaterial color="#b9d9e8" metalness={0.7} roughness={0.26} />
                      </mesh>
                  </group>
              ))}
              {[-0.5, 0.5].map(x => (
                  <mesh key={`support-${x}`} position={[x, 0.23, 0]} rotation={[0, 0, x < 0 ? -0.1 : 0.1]} castShadow>
                      <boxGeometry args={[0.06, 0.42, 1.12]} />
                      <meshStandardMaterial color="#71808a" roughness={0.46} metalness={0.58} />
                  </mesh>
              ))}
          </group>
      ) : type === 'library' ? (
          <group>
              <mesh position={[0, 0.82, -0.16]} castShadow receiveShadow>
                  <boxGeometry args={[1.42, 1.5, 1.05]} />
                  <meshStandardMaterial {...matProps} roughness={0.66} />
              </mesh>
              {[-0.48, -0.16, 0.16, 0.48].map((x) => (
                  <mesh key={x} position={[x, 0.72, 0.47]} castShadow>
                      <cylinderGeometry args={[0.07, 0.08, 1.18, 10]} />
                      <meshStandardMaterial color="#f1dfbd" roughness={0.72} />
                  </mesh>
              ))}
              <mesh position={[0, 1.58, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                  <coneGeometry args={[1.02, 0.55, 4]} />
                  <meshStandardMaterial color={colors.roof} roughness={0.72} />
              </mesh>
              <mesh position={[0, 0.12, 0.68]} receiveShadow>
                  <boxGeometry args={[1.3, 0.12, 0.5]} />
                  <meshStandardMaterial color="#d7c8ae" roughness={0.9} />
              </mesh>
              <Entrance width={0.34} position={[0, 0.38, 0.56]} accent="#8e44ad" />
              <mesh position={[0, 1.12, 0.54]} castShadow>
                  <boxGeometry args={[0.62, 0.16, 0.06]} />
                  <meshStandardMaterial color="#6c3483" emissive={isNight ? '#8e44ad' : '#000000'} emissiveIntensity={isNight ? 0.55 : 0} />
              </mesh>
          </group>
      ) : type === 'commercial' ? (
          <group position={[0, 0, 0]}>
              <mesh position={[0, geo.bodyHeight / 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[1, geo.bodyHeight, 1]} />
                  <meshStandardMaterial {...matProps} roughness={0.42} metalness={0.12} />
              </mesh>
              <mesh position={[0, 0.46, 0.55]} castShadow>
                  <boxGeometry args={[0.82, 0.82, 0.12]} />
                  <meshPhysicalMaterial color="#204a61" roughness={0.08} metalness={0.25} clearcoat={0.8} />
              </mesh>
              {[-0.34, 0.34].map(x => (
                  <mesh key={x} position={[x, 2.35, 0.53]} castShadow>
                      <boxGeometry args={[0.055, 3.1, 0.06]} />
                      <meshStandardMaterial color="#d6e5ea" metalness={0.48} roughness={0.32} />
                  </mesh>
              ))}
              <mesh position={[-0.53, geo.bodyHeight / 2, 0]} castShadow>
                  <boxGeometry args={[0.07, 1.5, 0.62]} />
                  <meshStandardMaterial color="#E74C3C" emissive={isNight ? 0xE74C3C : 0} emissiveIntensity={isNight ? 1 : 0} />
              </mesh>
              <mesh position={[0.53, geo.bodyHeight * 0.8, 0]} castShadow>
                  <boxGeometry args={[0.07, 0.8, 0.82]} />
                  <meshStandardMaterial color="#3498DB" emissive={isNight ? 0x3498DB : 0} emissiveIntensity={isNight ? 1 : 0} />
              </mesh>
              <RoofEquipment y={4.12} wide />
          </group>
      ) : type === 'luxury_residential' ? (
          <group position={[0, 0, 0]}>
              {/* Base plot / garden */}
              <mesh position={[0, 0.05, 0]} receiveShadow>
                  <boxGeometry args={[1.4, 0.1, 1.4]} />
                  <meshStandardMaterial color="#229954" roughness={0.9} />
              </mesh>
              {/* Fences */}
              <mesh position={[-0.65, 0.2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.05, 0.3, 1.4]} />
                  <meshStandardMaterial color="#BDC3C7" />
              </mesh>
              {/* Main Mansion */}
              <mesh position={[-0.1, geo.bodyHeight/2, -0.2]} castShadow receiveShadow>
                  <boxGeometry args={[0.8, geo.bodyHeight, 0.8]} />
                  <meshStandardMaterial {...matProps} roughness={0.5} />
              </mesh>
              <mesh position={[-0.1, geo.bodyHeight + 0.2, -0.2]} rotation={[0, Math.PI/4, 0]} castShadow receiveShadow>
                  <coneGeometry args={[0.7, 0.6, 4]} />
                  <meshStandardMaterial color="#2C3E50" />
              </mesh>
              {/* Smaller wing */}
              <mesh position={[0.3, geo.bodyHeight/3, 0.2]} castShadow receiveShadow>
                  <boxGeometry args={[0.6, geo.bodyHeight*0.6, 0.5]} />
                  <meshStandardMaterial {...matProps} roughness={0.5} />
              </mesh>
              <mesh position={[0.3, geo.bodyHeight*0.6 + 0.15, 0.2]} rotation={[0, Math.PI/4, 0]} castShadow receiveShadow>
                  <coneGeometry args={[0.5, 0.4, 4]} />
                  <meshStandardMaterial color="#2C3E50" />
              </mesh>
              {/* Fountain / Pool */}
              <mesh position={[-0.3, 0.1, 0.4]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                  <circleGeometry args={[0.2, 16]} />
                  <meshPhysicalMaterial color="#3498DB" roughness={0.08} clearcoat={1} />
              </mesh>
              <mesh position={[-0.1, 0.62, 0.22]} castShadow>
                  <boxGeometry args={[0.28, 0.88, 0.08]} />
                  <meshPhysicalMaterial color="#28485c" roughness={0.08} clearcoat={0.88} />
              </mesh>
              <mesh position={[0.38, 1.28, 0.47]} castShadow>
                  <boxGeometry args={[0.38, 0.13, 0.18]} />
                  <meshStandardMaterial color="#d6e5ea" metalness={0.38} roughness={0.25} />
              </mesh>
          </group>
      ) : type === 'subway' ? (
          <group position={[0, 0, 0]}>
              <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
                  <boxGeometry args={[1.2, 0.2, 1.2]} />
                  <meshStandardMaterial color="#95A5A6" roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.24, 0.04]} receiveShadow>
                  <boxGeometry args={[0.72, 0.12, 0.92]} />
                  <meshStandardMaterial color="#17242e" roughness={0.76} />
              </mesh>
              {[0, 1, 2, 3].map(step => (
                  <mesh key={step} position={[0, 0.3 - step * 0.055, 0.38 - step * 0.16]} receiveShadow>
                      <boxGeometry args={[0.62, 0.06, 0.15]} />
                      <meshStandardMaterial color={step % 2 ? '#87939a' : '#aeb8bd'} roughness={0.9} />
                  </mesh>
              ))}
              <mesh position={[0, 0.58, -0.02]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.52, 0.52, 0.92, 20, 1, true, 0, Math.PI]} />
                  <meshPhysicalMaterial color="#9ad7ee" transparent opacity={0.58} roughness={0.08} metalness={0.08} clearcoat={1} side={THREE.DoubleSide} />
              </mesh>
              {[-0.45, 0.45].map(x => (
                  <mesh key={x} position={[x, 0.55, -0.02]} castShadow>
                      <boxGeometry args={[0.045, 0.8, 0.98]} />
                      <meshStandardMaterial color="#58717d" metalness={0.62} roughness={0.36} />
                  </mesh>
              ))}
              <mesh position={[0.48, 0.58, 0.28]} castShadow>
                  <cylinderGeometry args={[0.035, 0.045, 0.92, 10]} />
                  <meshStandardMaterial color="#52636c" metalness={0.45} roughness={0.44} />
              </mesh>
              <mesh position={[0.48, 1.04, 0.28]} rotation={[0, Math.PI / 2, 0]} castShadow>
                  <cylinderGeometry args={[0.2, 0.2, 0.08, 20]} />
                  <meshStandardMaterial color="#27AE60" emissive={isNight ? 0x27AE60 : 0x000000} emissiveIntensity={isNight ? 0.8 : 0} />
              </mesh>
              <mesh position={[0.48, 1.04, 0.325]} castShadow>
                  <torusGeometry args={[0.1, 0.025, 8, 18]} />
                  <meshStandardMaterial color="#ffffff" emissive={isNight ? '#ffffff' : '#000000'} emissiveIntensity={isNight ? 0.7 : 0} />
              </mesh>
          </group>
      ) : type === 'school' ? (
          <group position={[0, 0, 0]}>
              {/* U-shaped main building */}
              <mesh position={[0, geo.bodyHeight/2, -0.3]} castShadow receiveShadow>
                  <boxGeometry args={[1.4, geo.bodyHeight, 0.4]} />
                  <meshStandardMaterial {...matProps} roughness={0.7} />
              </mesh>
              <mesh position={[-0.5, geo.bodyHeight/2, 0.1]} castShadow receiveShadow>
                  <boxGeometry args={[0.4, geo.bodyHeight, 0.4]} />
                  <meshStandardMaterial {...matProps} roughness={0.7} />
              </mesh>
              <mesh position={[0.5, geo.bodyHeight/2, 0.1]} castShadow receiveShadow>
                  <boxGeometry args={[0.4, geo.bodyHeight, 0.4]} />
                  <meshStandardMaterial {...matProps} roughness={0.7} />
              </mesh>
              {/* Playground / Track */}
              <mesh position={[0, 0.05, 0.3]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                  <planeGeometry args={[0.8, 0.6]} />
                  <meshStandardMaterial color="#E67E22" roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.06, 0.3]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                  <planeGeometry args={[0.6, 0.4]} />
                  <meshStandardMaterial color="#2ECC71" roughness={0.9} />
              </mesh>
              <Entrance width={0.34} position={[0, 0.35, -0.515]} accent="#f39c12" />
              <mesh position={[-0.58, 1.62, -0.2]} castShadow>
                  <cylinderGeometry args={[0.018, 0.025, 1.18, 8]} />
                  <meshStandardMaterial color="#d9e0e3" metalness={0.5} roughness={0.36} />
              </mesh>
              <mesh position={[-0.43, 2.0, -0.2]} rotation={[0, 0, -0.18]} castShadow>
                  <planeGeometry args={[0.34, 0.2]} />
                  <meshStandardMaterial color="#e74c3c" side={THREE.DoubleSide} />
              </mesh>
          </group>
      ) : type === 'hospital' ? (
          <group>
              <mesh position={[0, 1.02, -0.12]} castShadow receiveShadow>
                  <boxGeometry args={[1.42, 2.04, 0.82]} />
                  <meshStandardMaterial {...matProps} roughness={0.48} />
              </mesh>
              <mesh position={[-0.45, 0.62, 0.37]} castShadow receiveShadow>
                  <boxGeometry args={[0.5, 1.18, 0.52]} />
                  <meshStandardMaterial color="#e8edf0" roughness={0.58} />
              </mesh>
              <mesh position={[0.45, 0.62, 0.37]} castShadow receiveShadow>
                  <boxGeometry args={[0.5, 1.18, 0.52]} />
                  <meshStandardMaterial color="#e8edf0" roughness={0.58} />
              </mesh>
              <Entrance width={0.42} position={[0, 0.38, 0.55]} accent="#e74c3c" />
              <mesh position={[0, 2.09, -0.1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                  <circleGeometry args={[0.42, 24]} />
                  <meshStandardMaterial color="#d9dfe2" roughness={0.8} />
              </mesh>
              <RoofEquipment y={2.1} />
          </group>
      ) : type === 'police' ? (
          <group position={[0, 0, 0]}>
              <mesh position={[0, geo.bodyHeight/2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[1.2, geo.bodyHeight, 1.2]} />
                  <meshStandardMaterial {...matProps} roughness={0.58} />
              </mesh>
              <mesh position={[0.46, 0.53, 0.42]} castShadow receiveShadow>
                  <boxGeometry args={[0.38, 0.95, 0.42]} />
                  <meshStandardMaterial color="#263a4b" roughness={0.58} />
              </mesh>
              <mesh position={[-0.4, geo.bodyHeight + 0.1, 0]} castShadow>
                  <boxGeometry args={[0.2, 0.1, 0.2]} />
                  <meshStandardMaterial color="#E74C3C" emissive={isNight ? 0xE74C3C : 0x000000} emissiveIntensity={isNight ? 1 : 0} />
              </mesh>
              <mesh position={[0.4, geo.bodyHeight + 0.1, 0]} castShadow>
                  <boxGeometry args={[0.2, 0.1, 0.2]} />
                  <meshStandardMaterial color="#3498DB" emissive={isNight ? 0x3498DB : 0x000000} emissiveIntensity={isNight ? 1 : 0} />
              </mesh>
              <mesh position={[0, geo.bodyHeight + 0.05, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                  <circleGeometry args={[0.4, 16]} />
                  <meshStandardMaterial color="#7F8C8D" />
              </mesh>
              <Entrance width={0.42} position={[-0.22, 0.37, 0.62]} accent="#3498db" />
              <mesh position={[0, 1.38, 0.63]} castShadow>
                  <boxGeometry args={[0.72, 0.2, 0.06]} />
                  <meshStandardMaterial color="#2980b9" emissive={isNight ? '#2980b9' : '#000000'} emissiveIntensity={isNight ? 0.65 : 0} />
              </mesh>
          </group>
      ) : type === 'fire_station' ? (
          <group position={[0, 0, 0]}>
              <mesh position={[0.2, geo.bodyHeight/2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[1.0, geo.bodyHeight, 1.2]} />
                  <meshStandardMaterial {...matProps} roughness={0.58} />
              </mesh>
              <mesh position={[-0.4, geo.bodyHeight/2 + 0.5, -0.4]} castShadow receiveShadow>
                  <boxGeometry args={[0.4, geo.bodyHeight + 1, 0.4]} />
                  <meshStandardMaterial color={colors.body} roughness={0.7} />
              </mesh>
              <mesh position={[0.2, 0.4, 0.61]} castShadow receiveShadow>
                  <boxGeometry args={[0.8, 0.8, 0.05]} />
                  <meshStandardMaterial color="#d8dadd" metalness={0.32} roughness={0.52} />
              </mesh>
              {[-0.18, 0.08, 0.34, 0.58].map(x => (
                  <mesh key={x} position={[x, 0.4, 0.645]}>
                      <boxGeometry args={[0.025, 0.76, 0.02]} />
                      <meshStandardMaterial color="#7a858a" metalness={0.4} roughness={0.45} />
                  </mesh>
              ))}
              <mesh position={[-0.4, 2.94, -0.4]} castShadow>
                  <boxGeometry args={[0.52, 0.16, 0.52]} />
                  <meshStandardMaterial color="#f1c40f" roughness={0.46} />
              </mesh>
              <mesh position={[0.2, 1.42, 0.64]} castShadow>
                  <boxGeometry args={[0.66, 0.18, 0.06]} />
                  <meshStandardMaterial color="#f5c542" emissive={isNight ? '#e74c3c' : '#000000'} emissiveIntensity={isNight ? 0.65 : 0} />
              </mesh>
          </group>
      ) : type === 'industrial' ? (
          <group position={[0, 0, 0]}>
              <mesh position={[0, 1, 0.2]} castShadow receiveShadow>
                  <boxGeometry args={[1.4, 2, 1.0]} />
                  <meshStandardMaterial {...matProps} roughness={0.8} />
              </mesh>
              <mesh position={[-0.4, 2, -0.4]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.15, 0.2, 4, 8]} />
                  <meshStandardMaterial color="#E74C3C" />
              </mesh>
              <mesh position={[-0.4, 3, -0.4]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.15, 0.15, 0.5, 8]} />
                  <meshStandardMaterial color="#ECF0F1" />
              </mesh>
              <mesh position={[0.4, 0.5, -0.4]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.3, 0.3, 1, 16]} />
                  <meshStandardMaterial color="#BDC3C7" roughness={0.4} metalness={0.6} />
              </mesh>
              <mesh position={[0.4, 1.03, -0.4]} castShadow>
                  <sphereGeometry args={[0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial color="#c7d0d4" roughness={0.38} metalness={0.58} />
              </mesh>
              {[-0.44, 0, 0.44].map(x => (
                  <mesh key={x} position={[x, 2.18, 0.2]} rotation={[0, 0, Math.PI / 4]} castShadow>
                      <boxGeometry args={[0.48, 0.48, 1.03]} />
                      <meshStandardMaterial color="#7d8a91" roughness={0.65} metalness={0.22} />
                  </mesh>
              ))}
              <mesh position={[0.1, 0.48, 0.73]} castShadow>
                  <boxGeometry args={[0.54, 0.76, 0.06]} />
                  <meshStandardMaterial color="#394b54" roughness={0.62} />
              </mesh>
          </group>
      ) : type === 'residential' ? (
          <group position={[0, 0, 0]}>
              {/* House 1 */}
              <mesh position={[-0.3, 0.6, -0.3]} castShadow receiveShadow>
                  <boxGeometry args={[0.6, 1.2, 0.6]} />
                  <meshStandardMaterial {...matProps} roughness={0.7} />
              </mesh>
              <mesh position={[-0.3, 1.5, -0.3]} rotation={[0, Math.PI/4, 0]} castShadow receiveShadow>
                  <coneGeometry args={[0.5, 0.6, 4]} />
                  <meshStandardMaterial color={colors.roof} />
              </mesh>
              <Entrance width={0.18} position={[-0.3, 0.31, 0.02]} accent="#f0c56b" />

              {/* House 2 */}
              <mesh position={[0.3, 0.8, 0.2]} castShadow receiveShadow>
                  <boxGeometry args={[0.7, 1.6, 0.7]} />
                  <meshStandardMaterial {...matProps} roughness={0.7} />
              </mesh>
              <mesh position={[0.3, 1.9, 0.2]} rotation={[0, Math.PI/4, 0]} castShadow receiveShadow>
                  <coneGeometry args={[0.6, 0.6, 4]} />
                  <meshStandardMaterial color={colors.roof} />
              </mesh>
              <Entrance width={0.2} position={[0.3, 0.34, 0.57]} accent="#f0c56b" />

              {/* House 3 */}
              <mesh position={[-0.3, 0.4, 0.3]} castShadow receiveShadow>
                  <boxGeometry args={[0.5, 0.8, 0.5]} />
                  <meshStandardMaterial {...matProps} roughness={0.7} />
              </mesh>
              <mesh position={[-0.3, 1.0, 0.3]} rotation={[0, Math.PI/4, 0]} castShadow receiveShadow>
                  <coneGeometry args={[0.4, 0.4, 4]} />
                  <meshStandardMaterial color={colors.roof} />
              </mesh>
              <mesh position={[0.04, 0.04, 0.55]} rotation={[-Math.PI / 2, 0, -0.35]} receiveShadow>
                  <planeGeometry args={[0.34, 1.18]} />
                  <meshStandardMaterial color="#c9b79d" roughness={1} />
              </mesh>
              <mesh position={[-0.5, 1.4, -0.36]} castShadow>
                  <boxGeometry args={[0.11, 0.48, 0.11]} />
                  <meshStandardMaterial color="#754d3a" roughness={0.92} />
              </mesh>
          </group>
      ) : (
          <mesh position={[0, geo.bodyHeight / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[1, geo.bodyHeight, 1]} />
              <meshStandardMaterial {...matProps} roughness={0.7} />
          </mesh>
      )}

      {/* Roof Overhang for flat buildings */}
      {geo.roofType === 'flat' && type !== 'stadium' && type !== 'solar' && type !== 'subway' && type !== 'school' && type !== 'police' && type !== 'fire_station' && (
          <mesh position={[0, geo.bodyHeight + 0.1, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.1, 0.2, 1.1]} />
              <meshStandardMaterial color={colors.roof} roughness={0.8} />
          </mesh>
      )}

      {/* Additional details for specific buildings */}
      {type === 'hospital' && (
          <group position={[0, geo.bodyHeight + 0.3, 0]}>
              <mesh castShadow receiveShadow position={[0, 0, 0]}>
                  <boxGeometry args={[0.6, 0.2, 0.2]} />
                  <meshStandardMaterial color={0xE74C3C} emissive={isNight ? 0xE74C3C : 0x000000} emissiveIntensity={isNight ? 0.8 : 0} />
              </mesh>
              <mesh castShadow receiveShadow position={[0, 0, 0]}>
                  <boxGeometry args={[0.2, 0.6, 0.2]} />
                  <meshStandardMaterial color={0xE74C3C} emissive={isNight ? 0xE74C3C : 0x000000} emissiveIntensity={isNight ? 0.8 : 0} />
              </mesh>
          </group>
      )}
      
      {/* Skyscraper Antenna */}
      {type === 'skyscraper' && (
          <mesh position={[0, geo.bodyHeight + 0.8, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.05, 1.5]} />
              <meshStandardMaterial color="#95A5A6" />
          </mesh>
      )}

      {/* Roof */}
      {geo.roofType === 'cone' && type !== 'library' && (
          <mesh position={[0, geo.bodyHeight + (geo.roofHeight || 1) / 2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
              <coneGeometry args={[0.8, geo.roofHeight || 1, 4]} />
              <meshStandardMaterial color={colors.roof} roughness={0.8} />
          </mesh>
      )}
      
      {/* Wind Blades */}
      {type === 'wind' && (
          <group ref={windBladeRef} position={[0, geo.bodyHeight, 0.2]}>
              <mesh castShadow>
                  <sphereGeometry args={[0.18, 12, 8]} />
                  <meshStandardMaterial color="#dce7ed" metalness={0.5} roughness={0.35} />
              </mesh>
              {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle) => (
                  <group key={angle} rotation={[0, 0, angle]}>
                      <mesh position={[0, 0.78, 0]} rotation={[0, 0, -0.12]} castShadow receiveShadow>
                          <boxGeometry args={[0.18, 1.48, 0.08]} />
                          <meshStandardMaterial color="#eef4f6" roughness={0.42} metalness={0.18} />
                      </mesh>
                  </group>
              ))}
          </group>
      )}
      
      {/* Park Tree */}
      {type === 'park' && (
          <group position={[0, 0.1, 0]}>
              <mesh position={[0, 0.02, 0]} receiveShadow>
                  <boxGeometry args={[1.55, 0.12, 1.55]} />
                  <meshStandardMaterial color="#41965a" roughness={1} />
              </mesh>
              {[[-0.42, -0.35, 0.82], [0.4, -0.2, 0.7], [0.18, 0.42, 0.62]].map(([x, z, size], index) => (
                  <group key={index} position={[x, 0, z]} scale={size}>
                      <mesh position={[0, 0.48, 0]} castShadow>
                          <cylinderGeometry args={[0.1, 0.13, 0.9, 7]} />
                          <meshStandardMaterial color="#7a4d2c" roughness={0.95} />
                      </mesh>
                      <mesh position={[0, 1.08, 0]} castShadow>
                          <icosahedronGeometry args={[0.5, 1]} />
                          <meshStandardMaterial color={index === 1 ? '#56ae5d' : colors.roof} roughness={0.92} />
                      </mesh>
                  </group>
              ))}
              <mesh position={[-0.28, 0.1, 0.38]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[0.28, 18]} />
                  <meshPhysicalMaterial color="#4eb8db" roughness={0.12} clearcoat={0.9} />
              </mesh>
              <mesh position={[0.54, 0.22, 0.48]} castShadow>
                  <boxGeometry args={[0.5, 0.1, 0.16]} />
                  <meshStandardMaterial color="#81583b" roughness={0.9} />
              </mesh>
          </group>
      )}
    </group>
  );
}
