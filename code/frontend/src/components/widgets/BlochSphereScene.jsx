import { useRef, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Inverse of BlochArrow's physics -> three.js axis mapping below -- converts a drag point on the
// rendered sphere back into the (theta, phi) it represents.
function threeJsPointToAngles(point) {
  const normalized = point.clone().normalize();
  const theta = Math.acos(clamp(normalized.y, -1, 1));
  const phi = Math.atan2(normalized.z, normalized.x);
  return { theta, phi: phi < 0 ? phi + 2 * Math.PI : phi };
}

// physics (theta, phi) -> three.js scene axes: physics' pole axis (z) becomes three.js Y (up,
// matching a natural "north pole on top" view); physics x/y become three.js x/z.
function BlochArrow({ theta, phi, color }) {
  const arrowRef = useRef(null);

  useEffect(() => {
    if (!arrowRef.current) return;
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);
    arrowRef.current.setDirection(new THREE.Vector3(x, z, y).normalize());
  }, [theta, phi]);

  return (
    <arrowHelper
      ref={arrowRef}
      args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 1.3, color, 0.28, 0.18]}
    />
  );
}

// Invisible slightly-larger sphere carrying the free-placement drag handlers -- separate from the
// visible wireframe sphere so the visible one can stay a plain, non-interactive mesh.
function DraggableSphere({ onDrag }) {
  function handlePointerDown(event) {
    event.stopPropagation();
    onDrag(threeJsPointToAngles(event.point));
    event.target.setPointerCapture(event.pointerId);
  }
  function handlePointerMove(event) {
    if (event.buttons !== 1) return;
    event.stopPropagation();
    onDrag(threeJsPointToAngles(event.point));
  }
  return (
    <mesh onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}>
      <sphereGeometry args={[1.05, 24, 16]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

// The actual WebGL 3D rendering -- deliberately its own module, kept out of BlochSphere.jsx, so
// tests can mock this one piece. jsdom has neither a ResizeObserver nor a WebGL context (both
// confirmed missing, not partially stubbed), so this module is inherently unrenderable in tests --
// the same category of environment gap as Milestone 2's <dialog> polyfill, handled the same way:
// accepted and isolated, not fought. Real visual/interaction verification happens in a real
// browser, which has both.
export function BlochSphereScene({ theta, phi, arrowColor, draggable, onDrag }) {
  const axisGeometry = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -1.3, 0),
        new THREE.Vector3(0, 1.3, 0),
      ]),
    []
  );

  return (
    // frameloop="demand": render only on invalidation (any state change to a component inside
    // this Canvas auto-invalidates), not on every requestAnimationFrame tick regardless of
    // whether anything moved. Without this, the default "always" mode keeps re-rendering the
    // WebGL scene at the display refresh rate even while the arrow is frozen (reduced-motion,
    // or the landing hero after a visitor drags it and the ambient loop stops) -- real,
    // avoidable GPU/battery cost on low-end devices for a scene that isn't visibly changing.
    <Canvas frameloop="demand" camera={{ position: [0, 0.6, 3.2], fov: 35 }}>
      <ambientLight intensity={1.2} />
      <mesh>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color="#61728f" wireframe transparent opacity={0.35} />
      </mesh>
      <line geometry={axisGeometry}>
        <lineBasicMaterial color="#61728f" />
      </line>
      <BlochArrow theta={theta} phi={phi} color={arrowColor} />
      {draggable && <DraggableSphere onDrag={onDrag} />}
    </Canvas>
  );
}
