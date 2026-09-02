import { useEffect, useRef, useState, type ComponentRef, type MutableRefObject, type PointerEvent as ReactPointerEvent } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface JoystickAxis {
  x: number;
  y: number;
}

export function CameraRig({ joystick }: { joystick: MutableRefObject<JoystickAxis> }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const keys = useRef(new Set<string>());
  const { camera } = useThree();
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const movement = useRef(new THREE.Vector3());

  useEffect(() => {
    const updateKey = (event: KeyboardEvent, pressed: boolean) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      const key = event.key.toLowerCase();
      if (!['w', 'a', 's', 'd', 'q', 'e', 'shift'].includes(key)) return;
      if (pressed) keys.current.add(key);
      else keys.current.delete(key);
      event.preventDefault();
    };
    const onKeyDown = (event: KeyboardEvent) => updateKey(event, true);
    const onKeyUp = (event: KeyboardEvent) => updateKey(event, false);
    const onBlur = () => keys.current.clear();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useFrame((_, delta) => {
    const orbit = controls.current;
    if (!orbit) return;

    const horizontal = (keys.current.has('d') ? 1 : 0) - (keys.current.has('a') ? 1 : 0) + joystick.current.x;
    const vertical = (keys.current.has('w') ? 1 : 0) - (keys.current.has('s') ? 1 : 0) - joystick.current.y;
    const speed = (keys.current.has('shift') ? 20 : 11) * Math.min(delta, 0.05);

    camera.getWorldDirection(forward.current);
    forward.current.y = 0;
    if (forward.current.lengthSq() < 0.001) forward.current.set(0, 0, -1);
    forward.current.normalize();
    right.current.crossVectors(forward.current, camera.up).normalize();
    movement.current.copy(forward.current).multiplyScalar(vertical).addScaledVector(right.current, horizontal);
    if (movement.current.lengthSq() > 1) movement.current.normalize();
    if (movement.current.lengthSq() > 0.001) {
      movement.current.multiplyScalar(speed);
      camera.position.add(movement.current);
      orbit.target.add(movement.current);
    }

    const lift = (keys.current.has('e') ? 1 : 0) - (keys.current.has('q') ? 1 : 0);
    if (lift !== 0) {
      const nextY = THREE.MathUtils.clamp(camera.position.y + lift * speed, 8, 58);
      const applied = nextY - camera.position.y;
      camera.position.y = nextY;
      orbit.target.y = THREE.MathUtils.clamp(orbit.target.y + applied * 0.35, 0, 16);
    }
    orbit.update();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      regress
      target={[0, 1.5, 0]}
      enablePan
      enableZoom
      enableRotate
      enableDamping
      dampingFactor={0.07}
      maxPolarAngle={Math.PI / 2.16}
      minPolarAngle={Math.PI / 7}
      minDistance={10}
      maxDistance={74}
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
    />
  );
}

export function MobileJoystick({ axis }: { axis: MutableRefObject<JoystickAxis> }) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);

  const update = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = baseRef.current?.getBoundingClientRect();
    if (!rect) return;
    const radius = rect.width * 0.34;
    let x = event.clientX - (rect.left + rect.width / 2);
    let y = event.clientY - (rect.top + rect.height / 2);
    const length = Math.hypot(x, y);
    if (length > radius) {
      x = (x / length) * radius;
      y = (y / length) * radius;
    }
    axis.current = { x: x / radius, y: y / radius };
    setKnob({ x, y });
  };

  const release = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    axis.current = { x: 0, y: 0 };
    setKnob({ x: 0, y: 0 });
  };

  return (
    <div className="camera-joystick-shell" aria-label="移动镜头摇杆">
      <div
        ref={baseRef}
        className="camera-joystick"
        onPointerDown={(event) => {
          activePointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          update(event);
        }}
        onPointerMove={(event) => {
          if (activePointer.current === event.pointerId) update(event);
        }}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <div className="camera-joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>
      <span>移动视角</span>
    </div>
  );
}
