/**
 * ShirtViewer3D — Inline 3D t-shirt viewer with proper name/number compositing.
 *
 * International jersey standards applied to the texture canvas:
 *   BACK  — name  : centered, ~18% from top of jersey UV
 *           number: centered, ~38% from top, large
 *   FRONT — number: centered, ~42% from top, medium
 *
 * Public API:
 *   <ShirtViewer3D frontImageUrl={url} backImageUrl={url}
 *                  name="SALEH" number="10" fontId="block"
 *                  colors={...} withCustomization />
 */

import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
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

/**
 * Draws the jersey photo + text overlay onto a 1024×1024 UV canvas.
 *
 * International standard positions (% of canvas height):
 *   back  — name  : y ≈ 24%   (just below collar)
 *           number: y ≈ 52%   (center of back panel)
 *   front — number: y ≈ 50%   (chest center)
 */
function buildTexture(opts: TextureOptions): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const SIZE = 1024;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = SIZE;
      const ctx = canvas.getContext("2d")!;

      /* ── Draw jersey photo, object-contain centered ── */
      const aspect = img.width / img.height;
      let dw = SIZE, dh = SIZE, ox = 0, oy = 0;
      if (aspect > 1) { dh = SIZE / aspect; oy = (SIZE - dh) / 2; }
      else            { dw = SIZE * aspect;  ox = (SIZE - dw) / 2; }
      ctx.drawImage(img, ox, oy, dw, dh);

      /* ── Text overlay (only when customization is on) ── */
      if (opts.withCustomization && (opts.name || opts.number)) {
        const font   = FONT_STYLES.find(f => f.id === opts.fontId) ?? FONT_STYLES[0];
        const fStyle = font.style as Record<string, string>;
        const color  = opts.trimColor;

        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";

        /* Helper: draw text with shadow */
        const drawText = (text: string, x: number, y: number, size: number, ls: number) => {
          if (!text) return;
          ctx.save();
          ctx.font = `900 ${size}px "${font.family}", "Impact", sans-serif`;
          if (fStyle.fontStyle === "italic") ctx.font = `italic ${ctx.font}`;
          /* Shadow pass */
          ctx.shadowColor   = "rgba(0,0,0,0.95)";
          ctx.shadowBlur    = size * 0.25;
          ctx.shadowOffsetY = size * 0.05;
          ctx.letterSpacing = `${ls}px`;
          ctx.fillStyle = color;
          ctx.fillText(text, x, y, SIZE * 0.85);
          /* Crisp pass */
          ctx.shadowColor = "transparent";
          ctx.fillText(text, x, y, SIZE * 0.85);
          ctx.restore();
        };

        if (opts.side === "back") {
          /* ── BACK: name near collar, number large below ── */
          /* Name — ~24% from top */
          drawText(opts.name.toUpperCase(), SIZE / 2, SIZE * 0.24, 58, 4);
          /* Number — ~52% from top, very large */
          drawText(opts.number, SIZE / 2, SIZE * 0.52, 260, -8);

        } else {
          /* ── FRONT: number on chest center, no name ── */
          drawText(opts.number, SIZE / 2, SIZE * 0.50, 180, -6);
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace  = THREE.SRGBColorSpace;
      tex.wrapS       = THREE.ClampToEdgeWrapping;
      tex.wrapT       = THREE.ClampToEdgeWrapping;
      tex.needsUpdate = true;
      resolve(tex);
    };

    img.onerror = () => reject(new Error(`ShirtViewer3D: failed to load ${opts.url}`));
    img.src = opts.url;
  });
}

/* ═══════════════════════════════════════════════════════════════════
   MESH CLASSIFICATION
═══════════════════════════════════════════════════════════════════ */

function classifyMesh(name: string, index: number): "front" | "back" | "all" {
  const n = name.toLowerCase();
  if (n.includes("front") || n.startsWith("f_") || n.endsWith("_f")) return "front";
  if (n.includes("back")  || n.startsWith("b_") || n.endsWith("_b")) return "back";
  if (index === 0) return "front";
  if (index === 1) return "back";
  return "all";
}

/* ═══════════════════════════════════════════════════════════════════
   3-D SHIRT MODEL
═══════════════════════════════════════════════════════════════════ */

interface ShirtModelProps {
  frontTexture: THREE.Texture | null;
  backTexture:  THREE.Texture | null;
  autoRotate:   boolean;
}

function ShirtModel({ frontTexture, backTexture, autoRotate }: ShirtModelProps) {
  const gltf     = useGLTF("/jerseys/tshirt.glb");
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    const box    = new THREE.Box3().setFromObject(g);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale  = 2.2 / Math.max(size.x, size.y, size.z);
    g.scale.setScalar(scale);
    g.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
  }, [gltf.scene]);

  useEffect(() => {
    let idx = 0;
    gltf.scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const section = classifyMesh(node.name, idx++);
      const mats    = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach((mat) => {
        if (!(mat instanceof THREE.MeshStandardMaterial)) return;
        const tex =
          section === "front" ? frontTexture :
          section === "back"  ? backTexture  :
          frontTexture ?? backTexture;
        if (tex) {
          mat.map   = tex;
          mat.color.set(0xffffff);
        } else {
          mat.map   = null;
          mat.color.set(0xcccccc);
        }
        mat.needsUpdate = true;
      });
    });
  }, [gltf.scene, frontTexture, backTexture]);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current)
      groupRef.current.rotation.y += delta * 0.25;
  });

  return <primitive object={gltf.scene} ref={groupRef} />;
}

useGLTF.preload("/jerseys/tshirt.glb");

/* ═══════════════════════════════════════════════════════════════════
   LOADING SPINNER
═══════════════════════════════════════════════════════════════════ */

function ShirtLoader() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
      <div className="w-10 h-10 border-4 border-[#bfff00]/30 border-t-[#bfff00] rounded-full animate-spin" />
      <p className="text-xs text-white/30 font-bold">تحميل النموذج…</p>
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
  const [frontTexture, setFrontTexture] = useState<THREE.Texture | null>(null);
  const [backTexture,  setBackTexture]  = useState<THREE.Texture | null>(null);
  const [autoRotate,   setAutoRotate]   = useState(true);

  const trimColor = colors.trim;

  /* Rebuild front texture whenever photo URL or text changes */
  useEffect(() => {
    if (!frontImageUrl) {
      setFrontTexture(old => { old?.dispose(); return null; });
      return;
    }
    let cancelled = false;
    buildTexture({
      url: frontImageUrl, side: "front",
      name, number, fontId, trimColor, withCustomization,
    })
      .then(tex => { if (!cancelled) setFrontTexture(old => { old?.dispose(); return tex; }); })
      .catch(err => console.error("[ShirtViewer3D] front:", err));
    return () => { cancelled = true; };
  }, [frontImageUrl, name, number, fontId, trimColor, withCustomization]);

  /* Rebuild back texture whenever photo URL or text changes */
  useEffect(() => {
    if (!backImageUrl) {
      setBackTexture(old => { old?.dispose(); return null; });
      return;
    }
    let cancelled = false;
    buildTexture({
      url: backImageUrl, side: "back",
      name, number, fontId, trimColor, withCustomization,
    })
      .then(tex => { if (!cancelled) setBackTexture(old => { old?.dispose(); return tex; }); })
      .catch(err => console.error("[ShirtViewer3D] back:", err));
    return () => { cancelled = true; };
  }, [backImageUrl, name, number, fontId, trimColor, withCustomization]);

  useEffect(() => () => { frontTexture?.dispose(); backTexture?.dispose(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full h-full">
      <ShirtLoader />

      <Canvas
        camera={{ position: [0, 0.15, 3.8], fov: 40 }}
        style={{ background: "transparent" }}
        shadows
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[4,  8,  4]} intensity={1.4} castShadow />
        <directionalLight position={[-4, 3, -2]} intensity={0.5} color="#b0ccff" />
        <pointLight       position={[0,  4,  5]} intensity={0.9} />
        <pointLight       position={[0, -3,  4]} intensity={0.2} color="#3366ff" />

        <Environment preset="city" />

        <Suspense fallback={null}>
          <ShirtModel
            frontTexture={frontTexture}
            backTexture={backTexture}
            autoRotate={autoRotate}
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.88}
          minDistance={1.5}
          maxDistance={7}
          onStart={() => setAutoRotate(false)}
          onEnd={() => { setTimeout(() => setAutoRotate(true), 3000); }}
        />
      </Canvas>

      <p className="absolute bottom-3 inset-x-0 text-center text-[10px] text-white/20
                    pointer-events-none select-none tracking-widest">
        اسحب للتدوير · ابحر للتكبير
      </p>
    </div>
  );
}
