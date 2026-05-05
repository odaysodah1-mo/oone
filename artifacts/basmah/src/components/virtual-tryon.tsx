/**
 * ShirtViewer3D — Jersey photo on a 3D rotating plane.
 *
 * Instead of mapping photos to a GLB shirt mesh (UV alignment issues),
 * the front and back jersey photos are rendered as textures on a flat
 * plane mesh. The plane can be dragged / orbited freely and flips to
 * show the back when rotated > 90°.
 *
 * International jersey text positions (% of canvas height):
 *   BACK  – name  : 24% from top  (below collar)
 *           number: 52% from top  (centre of back)
 *   FRONT – number: 50% from top  (chest centre)
 */

import { Suspense, useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { FONT_STYLES } from "./configurator-jersey";

/* ═══════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════ */

interface JerseyColors {
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
   TEXTURE BUILDER — jersey photo + name/number at standard positions
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

      /* Draw jersey photo — object-contain, centered */
      const aspect = img.width / img.height;
      let dw = SIZE, dh = SIZE, ox = 0, oy = 0;
      if (aspect > 1) { dh = SIZE / aspect; oy = (SIZE - dh) / 2; }
      else            { dw = SIZE * aspect;  ox = (SIZE - dw) / 2; }
      ctx.drawImage(img, ox, oy, dw, dh);

      /* Text overlay */
      if (opts.withCustomization && (opts.name || opts.number)) {
        const font   = FONT_STYLES.find(f => f.id === opts.fontId) ?? FONT_STYLES[0];
        const fStyle = font.style as Record<string, string>;

        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";

        const drawText = (text: string, x: number, y: number, size: number, ls: number) => {
          if (!text) return;
          ctx.save();
          ctx.font         = `900 ${size}px "${font.family}", Impact, sans-serif`;
          if (fStyle.fontStyle === "italic") ctx.font = `italic ${ctx.font}`;
          ctx.letterSpacing = `${ls}px`;
          ctx.shadowColor   = "rgba(0,0,0,0.95)";
          ctx.shadowBlur    = size * 0.25;
          ctx.shadowOffsetY = size * 0.05;
          ctx.fillStyle     = opts.trimColor;
          ctx.fillText(text, x, y, SIZE * 0.85);
          ctx.shadowColor   = "transparent";
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
      tex.needsUpdate = true;
      resolve(tex);
    };

    img.onerror = () => reject(new Error(`buildTexture: failed to load ${opts.url}`));
    img.src = opts.url;
  });
}

/* ═══════════════════════════════════════════════════════════════════
   FALLBACK TEXTURE — plain coloured panel when no photo is uploaded
═══════════════════════════════════════════════════════════════════ */

function buildFallbackTexture(
  side: "front" | "back",
  bodyColor: string,
  trimColor: string,
  name: string, number: string,
  fontId: string,
  withCustomization: boolean,
): THREE.Texture {
  const SIZE = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  /* Background */
  ctx.fillStyle = bodyColor;
  ctx.fillRect(0, 0, SIZE, SIZE);

  /* Accent stripe */
  ctx.fillStyle = trimColor;
  ctx.fillRect(0, SIZE * 0.32, SIZE, SIZE * 0.04);

  if (withCustomization) {
    const font   = FONT_STYLES.find(f => f.id === fontId) ?? FONT_STYLES[0];
    const fStyle = font.style as Record<string, string>;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    const drawText = (text: string, y: number, size: number) => {
      if (!text) return;
      ctx.save();
      ctx.font         = `900 ${size}px "${font.family}", Impact, sans-serif`;
      if (fStyle.fontStyle === "italic") ctx.font = `italic ${ctx.font}`;
      ctx.shadowColor  = "rgba(0,0,0,0.7)";
      ctx.shadowBlur   = 20;
      ctx.fillStyle    = trimColor;
      ctx.fillText(text, SIZE / 2, y, SIZE * 0.85);
      ctx.restore();
    };

    if (side === "back") {
      drawText(name.toUpperCase(), SIZE * 0.24, 58);
      drawText(number, SIZE * 0.52, 260);
    } else {
      drawText(number, SIZE * 0.50, 180);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace  = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/* ═══════════════════════════════════════════════════════════════════
   JERSEY PLANE — front & back as a two-sided plane
═══════════════════════════════════════════════════════════════════ */

interface JerseyPlaneProps {
  frontTexture: THREE.Texture;
  backTexture:  THREE.Texture;
  autoRotate:   boolean;
}

function JerseyPlane({ frontTexture, backTexture, autoRotate }: JerseyPlaneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  /* Initial camera setup */
  useEffect(() => {
    camera.position.set(0, 0, 3.2);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame((_, delta) => {
    if (!autoRotate || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.35;
  });

  /* Jersey card proportions: standard jersey is ~0.75 wide × 0.9 tall */
  const W = 1.8, H = 2.16;

  return (
    <group ref={groupRef}>
      {/* FRONT face — faces +Z toward camera */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial
          map={frontTexture}
          side={THREE.FrontSide}
          roughness={0.55}
          metalness={0.05}
          transparent
        />
      </mesh>

      {/* BACK face — rotated 180° on Y, faces –Z */}
      <mesh rotation={[0, Math.PI, 0]} position={[0, 0, -0.005]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial
          map={backTexture}
          side={THREE.FrontSide}
          roughness={0.55}
          metalness={0.05}
          transparent
        />
      </mesh>
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
      <p className="text-xs text-white/30 font-bold">تحميل…</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════════ */

export interface ShirtViewer3DProps {
  frontImageUrl?:    string | null;
  backImageUrl?:     string | null;
  name?:             string;
  number?:           string;
  fontId?:           string;
  colors?:           JerseyColors;
  withCustomization?: boolean;
}

export function ShirtViewer3D({
  frontImageUrl, backImageUrl,
  name = "", number = "", fontId = "block",
  colors = { body: "#cc0000", sleeves: "#ffffff", collar: "#cc0000", trim: "#ffffff" },
  withCustomization = true,
}: ShirtViewer3DProps) {
  const [frontTex, setFrontTex] = useState<THREE.Texture | null>(null);
  const [backTex,  setBackTex]  = useState<THREE.Texture | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);

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
      .catch(() => {
        if (!cancelled)
          setter(buildFallbackTexture(side, colors.body, trimColor, name, number, fontId, withCustomization));
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontImageUrl, backImageUrl, name, number, fontId, trimColor, withCustomization, colors.body]);

  useEffect(() => {
    const cancelFront = buildOrFallback(frontImageUrl, "front", t => setFrontTex(old => { old?.dispose(); return t; }));
    const cancelBack  = buildOrFallback(backImageUrl,  "back",  t => setBackTex(old  => { old?.dispose(); return t; }));
    return () => { cancelFront(); cancelBack(); };
  }, [buildOrFallback, frontImageUrl, backImageUrl]);

  useEffect(() => () => { frontTex?.dispose(); backTex?.dispose(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!frontTex || !backTex) {
    return (
      <div className="relative w-full h-full bg-[#080808]">
        <ShirtLoader />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 42 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={1.1} />
        <directionalLight position={[3,  5,  5]} intensity={1.2} />
        <directionalLight position={[-3, 2, -4]} intensity={0.6} color="#b0ccff" />

        <Suspense fallback={null}>
          <JerseyPlane
            frontTexture={frontTex}
            backTexture={backTex}
            autoRotate={autoRotate}
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.5}
          maxDistance={6}
          minPolarAngle={Math.PI * 0.2}
          maxPolarAngle={Math.PI * 0.8}
          onStart={() => setAutoRotate(false)}
          onEnd={() => { setTimeout(() => setAutoRotate(true), 3000); }}
        />
      </Canvas>

      <p className="absolute bottom-3 inset-x-0 text-center text-[10px] text-white/20
                    pointer-events-none select-none tracking-widest">
        اسحب للتدوير · اسحب للتكبير
      </p>
    </div>
  );
}
