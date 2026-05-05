/**
 * ShirtViewer3D — Inline 3D t-shirt viewer.
 *
 * Loads tshirt.glb and auto-applies admin-uploaded front / back
 * jersey photos as textures. Images are pre-processed onto a square
 * 1024×1024 canvas (contain + centre) to prevent UV distortion.
 *
 * Public API:
 *   <ShirtViewer3D frontImageUrl={url} backImageUrl={url} />
 */

import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════════
   TEXTURE UTILITIES
═══════════════════════════════════════════════════════════════════ */

/**
 * createTextureFromUrl
 *
 * Draws the jersey photo onto a 1024×1024 square canvas (object-contain,
 * centred) so the texture fills the UV space without distortion.
 * Uses crossOrigin so CDN-hosted images work correctly.
 */
function createTextureFromUrl(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const SIZE   = 1024;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = SIZE;
      const ctx    = canvas.getContext("2d")!;

      /* "contain" layout — centre the photo inside the square UV space */
      const aspect = img.width / img.height;
      let dw = SIZE, dh = SIZE, ox = 0, oy = 0;
      if (aspect > 1) { dh = SIZE / aspect; oy = (SIZE - dh) / 2; }
      else            { dw = SIZE * aspect;  ox = (SIZE - dw) / 2; }
      ctx.drawImage(img, ox, oy, dw, dh);

      const tex         = new THREE.CanvasTexture(canvas);
      tex.colorSpace    = THREE.SRGBColorSpace;
      tex.wrapS         = THREE.ClampToEdgeWrapping;
      tex.wrapT         = THREE.ClampToEdgeWrapping;
      tex.needsUpdate   = true;
      resolve(tex);
    };

    img.onerror = () => reject(new Error(`ShirtViewer3D: failed to load ${url}`));
    img.src     = url;
  });
}

/* ═══════════════════════════════════════════════════════════════════
   MESH CLASSIFICATION
═══════════════════════════════════════════════════════════════════ */

/**
 * classifyMesh — maps a mesh to front / back / all.
 *
 * Naming conventions checked (case-insensitive):
 *   front / f_ / _f  →  "front"
 *   back  / b_ / _b  →  "back"
 * Generic names: index 0 → front, index 1 → back, else → all.
 */
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

  /* Normalise model size and centre it in the scene */
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

  /* Apply / remove textures when props change */
  useEffect(() => {
    let idx = 0;

    gltf.scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;

      const section = classifyMesh(node.name, idx++);
      const mats    = Array.isArray(node.material) ? node.material : [node.material];

      mats.forEach((mat) => {
        if (!(mat instanceof THREE.MeshStandardMaterial)) return;

        /* Pick the right texture for this mesh section */
        const tex =
          section === "front" ? frontTexture :
          section === "back"  ? backTexture  :
          frontTexture ?? backTexture;        /* single-mesh fallback */

        if (tex) {
          mat.map   = tex;
          mat.color.set(0xffffff);   /* clear tint so photo colours show correctly */
        } else {
          mat.map   = null;
          mat.color.set(0xcccccc);   /* neutral grey while no image is loaded */
        }
        mat.needsUpdate = true;
      });
    });
  }, [gltf.scene, frontTexture, backTexture]);

  /* Gentle idle rotation — pauses when user grabs the model */
  useFrame((_, delta) => {
    if (autoRotate && groupRef.current)
      groupRef.current.rotation.y += delta * 0.25;
  });

  return <primitive object={gltf.scene} ref={groupRef} />;
}

/* Kick off GLB download as soon as the module is imported */
useGLTF.preload("/jerseys/tshirt.glb");

/* ═══════════════════════════════════════════════════════════════════
   LOADING SPINNER  (shown while GLB downloads)
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
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */

export interface ShirtViewer3DProps {
  /** URL of the jersey front photo (from admin panel) */
  frontImageUrl?: string | null;
  /** URL of the jersey back photo (from admin panel) */
  backImageUrl?:  string | null;
}

export function ShirtViewer3D({ frontImageUrl, backImageUrl }: ShirtViewer3DProps) {
  const [frontTexture, setFrontTexture] = useState<THREE.Texture | null>(null);
  const [backTexture,  setBackTexture]  = useState<THREE.Texture | null>(null);
  const [autoRotate,   setAutoRotate]   = useState(true);

  /* Reload front texture whenever the URL changes */
  useEffect(() => {
    if (!frontImageUrl) {
      setFrontTexture(old => { old?.dispose(); return null; });
      return;
    }
    let cancelled = false;
    createTextureFromUrl(frontImageUrl)
      .then(tex => { if (!cancelled) setFrontTexture(old => { old?.dispose(); return tex; }); })
      .catch(err => console.error("[ShirtViewer3D] front:", err));
    return () => { cancelled = true; };
  }, [frontImageUrl]);

  /* Reload back texture whenever the URL changes */
  useEffect(() => {
    if (!backImageUrl) {
      setBackTexture(old => { old?.dispose(); return null; });
      return;
    }
    let cancelled = false;
    createTextureFromUrl(backImageUrl)
      .then(tex => { if (!cancelled) setBackTexture(old => { old?.dispose(); return tex; }); })
      .catch(err => console.error("[ShirtViewer3D] back:", err));
    return () => { cancelled = true; };
  }, [backImageUrl]);

  /* Dispose GPU textures on unmount */
  useEffect(() => () => { frontTexture?.dispose(); backTexture?.dispose(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full h-full">
      <ShirtLoader />

      <Canvas
        camera={{ position: [0, 0.15, 3.8], fov: 40 }}
        style={{ background: "transparent" }}
        shadows
      >
        {/* Lighting rig */}
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
