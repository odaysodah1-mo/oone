/**
 * ShirtViewer3D — GLB-based 3D jersey viewer.
 *
 * UV layout of tshirt.glb (derived from mesh analysis):
 *   Front body  : U 0.10-0.40, V 0.30-0.60  →  LEFT  half of atlas
 *   Left sleeve : U 0.10-0.40, V 0.00-0.20  →  LEFT  half, top area
 *   Back body   : U 0.60-0.90, V 0.30-0.80  →  RIGHT half of atlas
 *   Right sleeve: U 0.60-0.90, V 0.00-0.20  →  RIGHT half, top area
 *
 * We build ONE combined 2048×1024 texture atlas:
 *   Left  half  (0-1024 px) = front jersey image
 *   Right half  (1024-2048) = back jersey image
 * No UV offset needed — the UV map routes each part automatically.
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

/* ═══════════════════════════════════════════════════════════════════
   TEXTURE ATLAS BUILDER
   Creates a 2048×1024 canvas: front image on left half, back on right.
   Aligns exactly with the GLB's UV island layout.
═══════════════════════════════════════════════════════════════════ */

interface AtlasOptions {
  frontUrl?:  string | null;
  backUrl?:   string | null;
  bodyColor:  string;
  name:       string;
  number:     string;
  fontId:     string;
  trimColor:  string;
  withCustomization: boolean;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
  });
}

function drawJersey(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  fallbackColor: string,
  x: number, y: number, w: number, h: number,
) {
  if (!img) {
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(x, y, w, h);
    return;
  }
  /* draw image cover-fit into the half */
  const aspect = img.width / img.height;
  let dw = w, dh = h, ox = 0, oy = 0;
  if (aspect > w / h) { dh = w / aspect; oy = (h - dh) / 2; }
  else                 { dw = h * aspect; ox = (w - dw) / 2; }
  ctx.drawImage(img, x + ox, y + oy, dw, dh);
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string, cx: number, cy: number,
  size: number, ls: number, color: string, fontId: string,
) {
  if (!text) return;
  const font   = FONT_STYLES.find(f => f.id === fontId) ?? FONT_STYLES[0];
  const fStyle = font.style as Record<string, string>;
  ctx.save();
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = `900 ${size}px "${font.family}", Impact, sans-serif`;
  if (fStyle.fontStyle === "italic") ctx.font = `italic ${ctx.font}`;
  ctx.letterSpacing = `${ls}px`;
  ctx.shadowColor = "rgba(0,0,0,0.95)"; ctx.shadowBlur = size * 0.22;
  ctx.fillStyle = color;
  ctx.fillText(text, cx, cy, 900);
  ctx.shadowColor = "transparent";
  ctx.fillText(text, cx, cy, 900);
  ctx.restore();
}

async function buildAtlasTexture(opts: AtlasOptions): Promise<THREE.Texture> {
  /* load both images in parallel (null if no URL) */
  const [frontImg, backImg] = await Promise.all([
    opts.frontUrl ? loadImage(opts.frontUrl).catch(() => null) : Promise.resolve(null),
    opts.backUrl  ? loadImage(opts.backUrl ).catch(() => null) : Promise.resolve(null),
  ]);

  const W = 2048, H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  /* white base */
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  /* left half = front jersey */
  drawJersey(ctx, frontImg, opts.bodyColor, 0, 0, W / 2, H);

  /* right half = back jersey */
  drawJersey(ctx, backImg,  opts.bodyColor, W / 2, 0, W / 2, H);

  /* text overlays */
  if (opts.withCustomization) {
    const midLeft  = W / 4;        // center of front half
    const midRight = (W * 3) / 4;  // center of back half

    /* FRONT: number only */
    if (opts.number) {
      drawText(ctx, opts.number, midLeft, H * 0.52, 200, -8, opts.trimColor, opts.fontId);
    }

    /* BACK: name + big number */
    if (opts.name) {
      drawText(ctx, opts.name.toUpperCase(), midRight, H * 0.24, 52, 4, opts.trimColor, opts.fontId);
    }
    if (opts.number) {
      drawText(ctx, opts.number, midRight, H * 0.52, 220, -8, opts.trimColor, opts.fontId);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace  = THREE.SRGBColorSpace;
  tex.flipY       = true;
  tex.needsUpdate = true;
  return tex;
}

/* ═══════════════════════════════════════════════════════════════════
   GLB SHIRT MESH
═══════════════════════════════════════════════════════════════════ */

interface ShirtMeshProps {
  atlasTex:   THREE.Texture;
  autoRotate: boolean;
  onOrbitChange: (front: boolean) => void;
}

useGLTF.preload("/tshirt.glb");

function ShirtMesh({ atlasTex, autoRotate, onOrbitChange }: ShirtMeshProps) {
  const groupRef   = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { scene }  = useGLTF("/tshirt.glb");
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    map:             atlasTex,
    roughness:       0.82,
    metalness:       0.0,
    sheen:           0.55,
    sheenRoughness:  0.65,
    envMapIntensity: 0.45,
    side: THREE.FrontSide,
  }), []); // eslint-disable-line

  useEffect(() => {
    material.map = atlasTex;
    material.needsUpdate = true;
  }, [atlasTex, material]);

  useEffect(() => {
    clonedScene.traverse(node => {
      const mesh = node as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.material      = material;
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
      }
    });
  }, [clonedScene, material]);

  useEffect(() => {
    camera.position.set(0, 0.1, 3.2);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  const lastFrontRef = useRef(true);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (autoRotate) groupRef.current.rotation.y += delta * 0.35;
    const y = ((groupRef.current.rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const isFront = y < Math.PI * 0.5 || y > Math.PI * 1.5;
    if (isFront !== lastFrontRef.current) {
      lastFrontRef.current = isFront;
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
   SPINNER
═══════════════════════════════════════════════════════════════════ */

function ShirtLoader() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
      <div className="w-8 h-8 border-4 border-[#d4af55]/30 border-t-[#d4af55] rounded-full animate-spin" />
      <p className="text-xs text-white/30 font-bold tracking-widest">تحميل…</p>
    </div>
  );
}

function ViewBadge({ isFront }: { isFront: boolean }) {
  return (
    <div className="absolute top-3 left-3 pointer-events-none"
      style={{
        background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 800,
        color: "rgba(255,255,255,0.35)", backdropFilter: "blur(6px)", letterSpacing: "1px",
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
  const [atlasTex,   setAtlasTex]   = useState<THREE.Texture | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFront,    setIsFront]    = useState(true);

  useEffect(() => {
    let cancelled = false;
    buildAtlasTexture({
      frontUrl: frontImageUrl, backUrl: backImageUrl,
      bodyColor: colors.body, name, number, fontId,
      trimColor: colors.trim, withCustomization,
    }).then(tex => {
      if (!cancelled) setAtlasTex(old => { old?.dispose(); return tex; });
    });
    return () => { cancelled = true; };
  }, [frontImageUrl, backImageUrl, name, number, fontId, colors.body, colors.trim, withCustomization]);

  useEffect(() => () => { atlasTex?.dispose(); }, []); // eslint-disable-line

  if (!atlasTex) {
    return (
      <div className="relative w-full h-full" style={{ background: "#080808" }}>
        <ShirtLoader />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
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
        <Environment preset="studio" background={false} environmentIntensity={0.6} />
        <directionalLight position={[1.5, 3.5, 4]} intensity={1.6} color="#fff8ee" castShadow
          shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} />
        <directionalLight position={[-3.5, 2, -3]}  intensity={0.8}  color="#4488ff" />
        <directionalLight position={[3,   -1.5, -2]} intensity={0.45} color="#d4af55" />
        <ambientLight intensity={0.4} />
        <ContactShadows position={[0, -1.62, 0]} opacity={0.5} scale={4} blur={2.5} far={2} />

        <Suspense fallback={null}>
          <ShirtMesh
            atlasTex={atlasTex}
            autoRotate={autoRotate}
            onOrbitChange={setIsFront}
          />
        </Suspense>

        <OrbitControls
          enablePan={false} enableZoom={true}
          minDistance={1.6} maxDistance={6}
          minPolarAngle={Math.PI * 0.18} maxPolarAngle={Math.PI * 0.82}
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
