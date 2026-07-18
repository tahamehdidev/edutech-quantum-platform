import { useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
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
// matching a natural "north pole on top" view); physics x/y become three.js x/z. radius (default
// 1, matching a pure-state Bloch vector) is only ever <1 for the t2_dephasing mode -- every other
// mode's state is always a pure state, whose vector genuinely has length 1 by definition, so
// leaving this prop unset there is correct, not an oversight.
function BlochArrow({ theta, phi, radius = 1, color }) {
  const arrowRef = useRef(null);
  const { invalidate } = useThree();

  // Bug fix ("the arrow keeps glitching," reported live on the landing hero, whose idle-rotation
  // loop changes theta/phi on every animation frame): setDirection() is a raw three.js mutation,
  // invisible to R3F's own reconciler -- the Canvas above uses frameloop="demand", which only
  // auto-schedules a repaint when it applies a JSX-driven prop to a host three.js element itself
  // (via applyProps). theta/phi here are plain props on this custom component, consumed manually,
  // so that auto-invalidation never fired; the canvas only ever repainted when something UNRELATED
  // happened to trigger one (a drag event, a resize), so the arrow's visible position lagged
  // several frames behind its real state and then jumped when a repaint finally landed -- the
  // "glitch." Two fixes, both required: useLayoutEffect (not useEffect) applies the mutation
  // synchronously before the browser paints, matching R3F's own documented pattern for mutating
  // three.js objects outside React's reactive prop system; invalidate() (from useThree) then
  // explicitly tells the demand-mode renderer a new frame is actually needed, every time.
  useLayoutEffect(() => {
    if (!arrowRef.current) return;
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);
    arrowRef.current.setDirection(new THREE.Vector3(x, z, y).normalize());
    // headLength/headWidth scale down with radius too (not held constant) -- at radius 1 this is
    // exactly the original 0.22/0.14, and the Math.max floor keeps the arrowhead from growing
    // larger than the shaft it's attached to once the shaft has shrunk to almost nothing.
    const headScale = Math.max(radius, 0.4);
    arrowRef.current.setLength(radius, 0.22 * headScale, 0.14 * headScale);
    invalidate();
  }, [theta, phi, radius, invalidate]);

  // Length 1.0, exactly the sphere radius -- a Bloch vector's tip lies ON the sphere surface by
  // definition (|psi> is always normalized), so anything longer/shorter than the radius was
  // physically wrong, not just a visual mismatch (bug fix, not a style tweak). headLength/
  // headWidth scaled down to match so the arrowhead cone doesn't dominate the now-shorter shaft.
  return (
    <arrowHelper
      ref={arrowRef}
      args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 1, color, 0.22, 0.14]}
    />
  );
}

// Renders nothing -- no invisible mesh, deliberately (see below). Drives free-placement dragging
// entirely from native pointer events on the canvas element plus analytic camera/sphere math, not
// R3F's synthetic per-mesh pointer events (which only fire when a ray actually hits a mesh).
//
// The previous version used an invisible mesh + R3F's onPointerMove, which raycasts against real
// scene geometry: once the pointer's screen position moved outside that mesh's projected
// silhouette, the raycast had no hit, so R3F never called the handler and dragging silently froze
// (the actual bug). The fix: always resolve *some* point on the unit sphere for any pointer
// position, using the exact ray-sphere intersection when the camera ray actually crosses the
// sphere, and the closest point on that ray to the sphere's center (projected onto the surface)
// when it doesn't -- continuous across the boundary (they agree exactly at the silhouette edge),
// so dragging past the visible edge keeps rotating the vector instead of getting stuck.
function DraggableSphere({ onDrag, onDragEnd }) {
  const { camera, gl } = useThree();
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const canvas = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const toCenter = new THREE.Vector3();
    const point = new THREE.Vector3();

    function pointToAnglesFromClient(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(ndc, camera);
      origin.copy(raycaster.ray.origin);
      direction.copy(raycaster.ray.direction); // already unit length

      // Ray-sphere intersection against the mathematical unit sphere at the origin (radius 1,
      // matching the visible sphere/arrow exactly) -- not a mesh raycast, so there is nothing to
      // "miss". toCenter = sphere center (0,0,0) minus ray origin.
      toCenter.set(0, 0, 0).sub(origin);
      const tca = toCenter.dot(direction);
      const d2 = toCenter.lengthSq() - tca * tca;

      if (d2 <= 1) {
        // Real intersection -- identical result to the old mesh-raycast for any pointer position
        // still within the sphere's silhouette. thc/near-t per the standard analytic formula.
        const thc = Math.sqrt(1 - d2);
        const t = tca - thc > 0 ? tca - thc : tca + thc;
        point.copy(origin).addScaledVector(direction, Math.max(t, 0));
      } else {
        // No intersection (pointer is past the visible edge) -- fall back to the closest point on
        // the ray to the sphere's center, projected onto the sphere surface. Continuous with the
        // branch above: right at the silhouette edge, d2 == 1 and both branches agree.
        point.copy(origin).addScaledVector(direction, Math.max(tca, 0));
      }
      return threeJsPointToAngles(point);
    }

    function handlePointerDown(event) {
      isDraggingRef.current = true;
      canvas.setPointerCapture(event.pointerId);
      onDrag(pointToAnglesFromClient(event.clientX, event.clientY));
    }
    function handlePointerMove(event) {
      if (!isDraggingRef.current) return;
      onDrag(pointToAnglesFromClient(event.clientX, event.clientY));
    }
    function handlePointerUp(event) {
      isDraggingRef.current = false;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      onDragEnd?.();
    }

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [camera, gl, onDrag, onDragEnd]);

  return null;
}

// The actual WebGL 3D rendering -- deliberately its own module, kept out of BlochSphere.jsx, so
// tests can mock this one piece. jsdom has neither a ResizeObserver nor a WebGL context (both
// confirmed missing, not partially stubbed), so this module is inherently unrenderable in tests --
// the same category of environment gap as Milestone 2's <dialog> polyfill, handled the same way:
// accepted and isolated, not fought. Real visual/interaction verification happens in a real
// browser, which has both.
export function BlochSphereScene({
  theta,
  phi,
  radius = 1,
  arrowColor,
  wireframeColor = "#6E8B9D", // --color-border-strong (site-wide identity migration)
  draggable,
  onDrag,
  onDragEnd,
}) {
  // Matches the sphere radius (was 1.3, poking past the poles for no physical reason and eating
  // into the frustum-margin budget below) -- same "content radius is exactly 1.0" rule the arrow
  // fix above relies on, so the camera only has to clear one radius, not two different ones.
  const axisGeometry = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(0, 1, 0),
      ]),
    []
  );

  return (
    // frameloop="demand": render only on invalidation -- a JSX-driven prop change on a host
    // three.js element auto-invalidates, but a ref-driven imperative mutation (BlochArrow's own
    // setDirection call, above) does not; that call now pairs with an explicit invalidate() for
    // exactly this reason (see BlochArrow's own comment -- its absence was the "glitching arrow"
    // bug). Without frameloop="demand" at all, the default "always" mode would keep re-rendering
    // the WebGL scene at the display refresh rate even while the arrow is genuinely frozen
    // (reduced-motion, or the landing hero after a visitor drags it and the ambient loop stops)
    // -- real, avoidable GPU/battery cost on low-end devices for a scene that isn't changing.
    //
    // Camera: all scene content now maxes out at radius 1.0 (sphere, arrow, axis all fixed to
    // match). At [0, 0.6, 3.2]/fov 35, the sphere's silhouette subtended ~17.9deg -- MORE than
    // the 17.5deg half-fov, clipping the sphere itself at every edge (bug 2), not just a
    // near-miss. Pulled back and widened for real headroom: at [0, 0.5, 4.2]/fov 38, radius-1
    // content subtends ~13.68deg against a 19deg half-fov -- verified live (not just calculated)
    // against the actual rendered canvas: computedAspect exactly 1, halfFovVerticalDeg ==
    // halfFovHorizontalDeg == 19, marginRatio 1.389 (39% margin) on both axes. Both usage
    // contexts (BlochSphere.css's 320x320 widget, LandingHeroVisual.css's up-to-760x760 hero) are
    // always square (fixed size or aspect-ratio:1), so this single camera config holds in both --
    // fiber's Canvas already keeps camera.aspect and the canvas's backing store in sync with the
    // container via its own ResizeObserver, no manual resize handling needed here.
    <Canvas frameloop="demand" camera={{ position: [0, 0.5, 4.2], fov: 38 }}>
      <ambientLight intensity={1.2} />
      {/* A solid shaded inner surface + point light were tried here for the landing-page hero
          specifically (gated behind a since-removed `decorative` prop) -- critique-confirmed P1:
          it made the marketing-only render more visually sophisticated than the real teaching
          widget it's supposed to be a lighter echo of, inverting PRODUCT.md's "one instrument,
          not a toy" -- a learner's first touch shouldn't look more impressive than what they
          actually get once enrolled. Reverted to one plain wireframe render for both contexts;
          the landing hero's own atmosphere now lives entirely outside this component (pole
          labels + CSS glow in LandingHeroVisual.jsx/.css), not in the 3D render's own fidelity. */}
      <mesh>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.35} />
      </mesh>
      <line geometry={axisGeometry}>
        <lineBasicMaterial color={wireframeColor} />
      </line>
      <BlochArrow theta={theta} phi={phi} radius={radius} color={arrowColor} />
      {draggable && <DraggableSphere onDrag={onDrag} onDragEnd={onDragEnd} />}
    </Canvas>
  );
}
