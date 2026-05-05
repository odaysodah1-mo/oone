/**
 * ShirtViewer3D — GLB-based 3D jersey viewer.
 *
 * Applies the actual jersey photo directly as the mesh's diffuse texture
 * (front image when facing camera, back image when rotated away).
 * Fabric sheen material, IBL, contact shadows, ACES tonemapping.
 */

import {
  Suspense, useRef, useState, useEffect, useCallback, useMemo,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useGLTF, Environment, ContactShadows, OrbitControls,
} from "@react-three/drei";
import * as THREE from "three";
import { FONT_STYLES } from "./configurator-jersey";

/* ═══════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════ */

export interface JerseyColors {
  body: string; sleeves: string; collar: string; trim: string;
}

interface TextureOptions {
  url:       string;
  side:      "front" | "back";
  name:      string;
  number:    string;
  fontId:    string;
  trimColor: string;
  withCustomization: boolean;
}

/* ═══════════════════════════════════════════════════════════════════
   CANVAS TEXTURE BUILDER — jersey photo + name/number composited
═══════════════════════════════════════════════════════════════════ */

function buildTexture(opts: TextureOptions): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const SIZE = 1024;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = SIZE;
      const ctx = canvas.getContext("2d")!;

      /* fill with white to avoid transparent edges on the mesh */
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, SIZE, SIZE);

      const aspect = img.width / img.height;
      let dw = SIZE, dh = SIZE, ox = 0, oy = 0;
      if (aspect > 1) { dh = SIZE / aspect; oy = (SIZE - dh) / 2; }
      else            { dw = SIZE * aspect;  ox = (SIZE - dw) / 2; }
      ctx.drawImage(img, ox, oy, dw, dh);

      if (opts.withCustomization && (opts.name || opts.number)) {
        const font   = FONT_STYLES.find(f => f.id === opts.fontId) ?? FONT_STYLES[0];
        const fStyle = font.style as Record<string, string>;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";

        const drawText = (text: string, x: number, y: number, size: number, ls: number) => {
          if (!text) return;
          ctx.save();
          ctx.font = `900 ${size}px "${font.family}", Impact, sans-serif`;
          if (fStyle.fontStyle === "italic") ctx.font = `italic ${ctx.font}`;
          ctx.letterSpacing = `${ls}px`;
          ctx.shadowColor = "rgba(0,0,0,0.95)"; ctx.shadowBlur = size * 0.25;
          ctx.fillStyle = opts.trimColor;
          ctx.fillText(text, x, y, SIZE * 0.85);
          ctx.shadowColor = "transparent";
          ctx.fillText(text, x, y, SIZE * 0.85);
          ctx.restore();
        };

        if (opts.side === "back") {
          drawText(opts.name.toUpperCase(), SIZE / 2, SIZE * 0.24, 58, 4);
          drawText(opts.number,            SIZE / 2, SIZE * 0.52, 260, -8);
        } else {
          drawText(opts.number, SIZE / 2, SIZE * 0.50, 180, -6);
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace  = THREE.SRGBColorSpace;
      tex.flipY       = true;
      tex.needsUpdate = true;
      resolve(tex);
    };
    img.onerror = () => reject(new Error(`buildTexture: failed to load ${opts.url}`));
    img.src = opts.url;
  });
}

function buildFallbackTexture(
  side: "front" | "back", bodyColor: string, trimColor: string,
  name: string, number: string, fontId: string, withCustomization: boolean,
): THREE.Texture {
  const SIZE = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = bodyColor; ctx.fillRect(0, 0, SIZE, SIZE);

  if (withCustomization) {
    const font   = FONT_STYLES.find(f => f.id === fontId) ?? FONT_STYLES[0];
    const fStyle = font.style as Record<string, string>;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const draw = (text: string, y: number, size: number) => {
      if (!text) return;
      ctx.save();
      ctx.font = `900 ${size}px "${font.family}", Impact, sans-serif`;
      if (fStyle.fontStyle === "italic") ctx.font = `italic ${ctx.font}`;
      ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 20;
      ctx.fillStyle = trimColor;
      ctx.fillText(text, SIZE / 2, y, SIZE * 0.85);
      ctx.restore();
    };
    if (side === "back") { draw(name.toUpperCase(), SIZE * 0.24, 58); draw(number, SIZE * 0.52, 260); }
    else { draw(number, SIZE * 0.50, 180); }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY      = true;
  tex.needsUpdate = true;
  return tex;
}

/* ═══════════════════════════════════════════════════════════════════
   GLB SHIRT MESH — texture applied directly to the mesh surface
═══════════════════════════════════════════════════════════════════ */

interface ShirtMeshProps {
  frontTex:   THREE.Texture;
  backTex:    THREE.Texture;
  autoRotate: boolean;
  onOrbitChange: (front: boolean) => void;
}

useGLTF.preload("/tshirt.glb");

function ShirtMesh({ frontTex, backTex, autoRotate, onOrbitChange }: ShirtMeshProps) {
  const groupRef   = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { scene }  = useGLTF("/tshirt.glb");

  /* clone scene so multiple instances don't share materials */
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  /* build the fabric material — front texture starts by default */
  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    map:            frontTex,
    roughness:      0.82,
    metalness:      0.0,
    sheen:          0.55,
    sheenRoughness: 0.65,
    envMapIntensity: 0.45,
    side: THREE.FrontSide,
  }), []); // eslint-disable-line

  /* keep the map in sync when textures change externally */
  useEffect(() => {
    material.map = frontTex;
    material.needsUpdate = true;
  }, [frontTex, material]);

  /* apply material to every mesh in the GLB */
  useEffect(() => {
    clonedScene.traverse(node => {
      const mesh = node as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.material    = material;
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
      }
    });
  }, [clonedScene, material]);

  /* camera default position */
  useEffect(() => {
    camera.position.set(0, 0.1, 3.2);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  /* auto-rotate + swap texture front/back */
  const lastFrontRef = useRef(true);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (autoRotate) groupRef.current.rotation.y += delta * 0.35;

    const y = ((groupRef.current.rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const isFront = y < Math.PI * 0.5 || y > Math.PI * 1.5;

    /* swap texture when side changes */
    if (isFront !== lastFrontRef.current) {
      lastFrontRef.current = isFront;
      material.map = isFront ? frontTex : backTex;
      material.needsUpdate = true;
      onOrbitChange(isFront);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LOADING SPINNER
═══════════════════════════════════════════════════════════════════ */

function ShirtLoader() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
      <div className="w-8 h-8 border-4 border-[#bfff00]/30 border-t-[#bfff00] rounded-full animate-spin" />
      <p className="text-xs text-white/30 font-bold tracking-widest">تحميل…</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FRONT / BACK BADGE
═══════════════════════════════════════════════════════════════════ */

function ViewBadge({ isFront }: { isFront: boolean }) {
  return (
    <div className="absolute top-3 left-3 pointer-events-none"
      style={{
        background: "rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 6, padding: "2px 8px",
        fontSize: 10, fontWeight: 800,
        color: "rgba(255,255,255,0.35)",
        backdropFilter: "blur(6px)", letterSpacing: "1px",
      }}>
      {isFront ? "FRONT" : "BACK"}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════════ */

export interface ShirtViewer3DProps {
  frontImageUrl?:     string | null;
  backImageUrl?:      string | null;
  name?:              string;
  number?:            string;
  fontId?:            string;
  colors?:            JerseyColors;
  withCustomization?: boolean;
}

export function ShirtViewer3D({
  frontImageUrl, backImageUrl,
  name = "", number = "", fontId = "block",
  colors = { body: "#cc0000", sleeves: "#ffffff", collar: "#cc0000", trim: "#ffffff" },
  withCustomization = true,
}: ShirtViewer3DProps) {
  const [frontTex,  setFrontTex]  = useState<THREE.Texture | null>(null);
  const [backTex,   setBackTex]   = useState<THREE.Texture | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFront,   setIsFront]   = useState(true);

  const trimColor = colors.trim;

  const buildOrFallback = useCallback((
    url: string | null | undefined,
    side: "front" | "back",
    setter: (t: THREE.Texture) => void,
  ) => {
    const textOpts = { name, number, fontId, trimColor, withCustomization };
    if (!url) {
      setter(buildFallbackTexture(side, colors.body, trimColor, name, number, fontId, withCustomization));
      return () => {};
    }
    let cancelled = false;
    buildTexture({ url, side, ...textOpts })
      .then(tex => { if (!cancelled) setter(tex); })
      .catch(() => { if (!cancelled) setter(buildFallbackTexture(side, colors.body, trimColor, name, number, fontId, withCustomization)); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontImageUrl, backImageUrl, name, number, fontId, trimColor, withCustomization, colors.body]);

  useEffect(() => {
    const cf = buildOrFallback(frontImageUrl, "front", t => setFrontTex(old => { old?.dispose(); return t; }));
    const cb = buildOrFallback(backImageUrl,  "back",  t => setBackTex(old  => { old?.dispose(); return t; }));
    return () => { cf(); cb(); };
  }, [buildOrFallback, frontImageUrl, backImageUrl]);

  useEffect(() => () => { frontTex?.dispose(); backTex?.dispose(); }, []); // eslint-disable-line

  if (!frontTex || !backTex) {
    return (
      <div className="relative w-full h-full" style={{ background: "#080808" }}>
        <ShirtLoader />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 60% 55% at 50% 44%, ${colors.body}22 0%, transparent 68%)`,
      }} />

      <Canvas
        camera={{ position: [0, 0.1, 3.2], fov: 38 }}
        style={{ background: "transparent" }}
        gl={{
          alpha: true, antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        shadows
      >
        {/* Environment IBL */}
        <Environment preset="studio" background={false} environmentIntensity={0.6} />

        {/* Key light */}
        <directionalLight position={[1.5, 3.5, 4]} intensity={1.6} color="#fff8ee" castShadow
          shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} />

        {/* Rim lights */}
        <directionalLight position={[-3.5, 2, -3]}  intensity={0.8}  color="#4488ff" />
        <directionalLight position={[3,   -1.5, -2]} intensity={0.45} color="#bfff00" />

        {/* Ambient fill */}
        <ambientLight intensity={0.4} />

        {/* Contact shadow */}
        <ContactShadows position={[0, -1.62, 0]} opacity={0.5} scale={4} blur={2.5} far={2} />

        <Suspense fallback={null}>
          <ShirtMesh
            frontTex={frontTex}
            backTex={backTex}
            autoRotate={autoRotate}
            onOrbitChange={setIsFront}
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.6}
          maxDistance={6}
          minPolarAngle={Math.PI * 0.18}
          maxPolarAngle={Math.PI * 0.82}
          onStart={() => setAutoRotate(false)}
          onEnd={() => { setTimeout(() => setAutoRotate(true), 3500); }}
        />
      </Canvas>

      <ViewBadge isFront={isFront} />

      <p className="absolute bottom-3 inset-x-0 text-center text-[10px] text-white/20
                    pointer-events-none select-none tracking-widest">
        اسحب للتدوير · انقر مرتين للتكبير
      </p>
    </div>
  );
}
