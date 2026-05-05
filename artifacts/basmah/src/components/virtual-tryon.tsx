/**
 * VirtualTryOn3D — 3D Virtual Try-On using @react-three/fiber + @react-three/drei
 *
 * Loads tshirt.glb, traverses its material nodes, and applies user-uploaded
 * design images to the front / back sections in real-time.
 *
 * Public API:
 *   <VirtualTryOn3D onClose={fn} />
 *
 * handleDesignChange(section, imageFile)
 *   — Creates a THREE.Texture from the uploaded file, finds the correct
 *     mesh material(s) for that section, and swaps the `map` property.
 */

import {
  Suspense, useRef, useState, useCallback, useEffect,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import { X, Upload, RotateCcw } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   TEXTURE UTILITIES
═══════════════════════════════════════════════════════════════════ */

/**
 * createTextureFromFile — reads an image File and returns a THREE.Texture.
 * The object URL is revoked after the texture loads to avoid memory leaks.
 */
function createTextureFromFile(file: File): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const loader = new THREE.TextureLoader();
    loader.load(
      objectUrl,
      (texture) => {
        /* Use sRGB color space so colors render correctly on screen */
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        URL.revokeObjectURL(objectUrl); // free memory
        resolve(texture);
      },
      undefined,
      (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      },
    );
  });
}

/* ═══════════════════════════════════════════════════════════════════
   MESH / MATERIAL IDENTIFICATION
═══════════════════════════════════════════════════════════════════ */

/**
 * classifyMesh — determines whether a mesh belongs to the front, back,
 * or unclassified ("all") section based on its name.
 *
 * Naming conventions seen in common t-shirt GLBs:
 *   front / Front / FRONT / f_ / _front / mesh0 (index 0 = front)
 *   back  / Back  / BACK  / b_ / _back  / mesh1 (index 1 = back)
 */
function classifyMesh(
  meshName: string,
  meshIndex: number,
): "front" | "back" | "all" {
  const n = meshName.toLowerCase();
  if (n.includes("front") || n.startsWith("f_") || n.endsWith("_f")) return "front";
  if (n.includes("back")  || n.startsWith("b_") || n.endsWith("_b")) return "back";

  /* If the model has exactly two meshes and names are generic, treat
     the first as front and the second as back */
  if (meshIndex === 0) return "front";
  if (meshIndex === 1) return "back";

  /* Single-mesh shirt — texture covers both sides via UV layout */
  return "all";
}

/* ═══════════════════════════════════════════════════════════════════
   3-D SHIRT MODEL
═══════════════════════════════════════════════════════════════════ */

interface ShirtModelProps {
  /** Texture for the shirt front section (null = default material) */
  frontTexture: THREE.Texture | null;
  /** Texture for the shirt back section (null = default material) */
  backTexture:  THREE.Texture | null;
  /** Called after the model loads; reports discovered mesh names */
  onMeshesDiscovered?: (names: string[]) => void;
  /** Auto-rotate when idle */
  autoRotate?: boolean;
}

function ShirtModel({
  frontTexture,
  backTexture,
  onMeshesDiscovered,
  autoRotate = true,
}: ShirtModelProps) {
  /* Load the GLB — useGLTF caches it so subsequent renders are instant */
  const gltf = useGLTF("/jerseys/tshirt.glb");
  const groupRef = useRef<THREE.Group>(null);

  /* ── Step 1: Normalise model size and position ── */
  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    const box = new THREE.Box3().setFromObject(g);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    /* Scale so the longest axis fits inside a 2.2-unit cube */
    const scale = 2.2 / Math.max(size.x, size.y, size.z);
    g.scale.setScalar(scale);
    g.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
  }, [gltf.scene]);

  /* ── Step 2: Discover mesh names (once, after load) ── */
  useEffect(() => {
    const names: string[] = [];
    gltf.scene.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        names.push(node.name || "(unnamed)");
        /* Log for debugging — remove in production */
        console.log("[VirtualTryOn] Mesh:", node.name, "Material:", (node.material as THREE.Material)?.name);
      }
    });
    onMeshesDiscovered?.(names);
  }, [gltf.scene, onMeshesDiscovered]);

  /* ── Step 3: Apply uploaded textures to the correct materials ── */
  useEffect(() => {
    let meshIndex = 0;

    gltf.scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;

      const section = classifyMesh(node.name, meshIndex);
      meshIndex++;

      /* Normalise: material can be a single instance or an array */
      const materials = Array.isArray(node.material)
        ? node.material
        : [node.material];

      materials.forEach((mat) => {
        if (!(mat instanceof THREE.MeshStandardMaterial)) return;

        /* Apply the right texture based on the mesh section */
        if (section === "front" && frontTexture) {
          mat.map = frontTexture;
          mat.needsUpdate = true;
        } else if (section === "back" && backTexture) {
          mat.map = backTexture;
          mat.needsUpdate = true;
        } else if (section === "all") {
          /* Single-mesh shirt: front texture takes priority over back */
          if (frontTexture) { mat.map = frontTexture; mat.needsUpdate = true; }
        }
      });
    });
  }, [gltf.scene, frontTexture, backTexture]);

  /* ── Step 4: Gentle idle rotation ── */
  useFrame((_, delta) => {
    if (!autoRotate || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.25;
  });

  return (
    <primitive
      object={gltf.scene}
      ref={groupRef}
    />
  );
}

/* Preload GLB so it starts fetching immediately when the module imports */
useGLTF.preload("/jerseys/tshirt.glb");

/* ═══════════════════════════════════════════════════════════════════
   UPLOAD BUTTON
═══════════════════════════════════════════════════════════════════ */

interface UploadBtnProps {
  label:    string;
  preview?: string | null;   // data-URL preview of the uploaded image
  loading:  boolean;
  onClick:  () => void;
  onClear:  () => void;
  accent:   string;           // e.g. "#bfff00" or "#00b4ff"
}

function UploadBtn({ label, preview, loading, onClick, onClear, accent }: UploadBtnProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{label}</p>

      {preview ? (
        /* Show thumbnail + clear button once an image is chosen */
        <div className="relative">
          <img
            src={preview}
            alt={label}
            className="w-16 h-16 object-contain rounded-xl border-2"
            style={{ borderColor: accent }}
          />
          <button
            onClick={onClear}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] hover:bg-red-500 transition-colors"
            title="إزالة التصميم"
          >
            <X size={10} />
          </button>
        </div>
      ) : (
        <button
          onClick={onClick}
          disabled={loading}
          className="w-16 h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          style={{ borderColor: `${accent}60`, background: `${accent}0a` }}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: `${accent}60`, borderTopColor: "transparent" }} />
          ) : (
            <Upload size={18} style={{ color: accent }} />
          )}
          <span className="text-[9px] font-bold" style={{ color: accent }}>رفع</span>
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LOADING FALLBACK (shown while GLB downloads)
═══════════════════════════════════════════════════════════════════ */

function ShirtLoader() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
      <div className="w-10 h-10 border-4 border-[#bfff00]/30 border-t-[#bfff00] rounded-full animate-spin" />
      <p className="text-xs text-white/30 font-bold">تحميل النموذج ثلاثي الأبعاد…</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */

export interface VirtualTryOnProps {
  /** Called when the user clicks the close (×) button */
  onClose: () => void;
}

export function VirtualTryOn3D({ onClose }: VirtualTryOnProps) {
  /* Uploaded textures (null = use model default) */
  const [frontTexture, setFrontTexture] = useState<THREE.Texture | null>(null);
  const [backTexture,  setBackTexture]  = useState<THREE.Texture | null>(null);

  /* Thumbnail previews shown in the upload buttons */
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview,  setBackPreview]  = useState<string | null>(null);

  /* Loading spinners per button */
  const [frontLoading, setFrontLoading] = useState(false);
  const [backLoading,  setBackLoading]  = useState(false);

  /* Auto-rotate pauses while user interacts via OrbitControls */
  const [autoRotate, setAutoRotate] = useState(true);

  /* Discovered mesh names (for debug info) */
  const [meshNames, setMeshNames] = useState<string[]>([]);

  /* Hidden <input type="file"> refs — programmatically clicked */
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef  = useRef<HTMLInputElement>(null);

  /* ──────────────────────────────────────────────────────────
     handleDesignChange(section, imageFile)
     ──────────────────────────────────────────────────────────
     1. Creates a preview data-URL for the thumbnail button.
     2. Creates a THREE.Texture from the file using TextureLoader.
     3. Stores the texture in state — the ShirtModel useEffect
        picks it up and applies it to the correct material(s).
  ────────────────────────────────────────────────────────── */
  const handleDesignChange = useCallback(async (
    section: "front" | "back",
    imageFile: File,
  ) => {
    /* Show the thumbnail immediately from a FileReader data-URL */
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (section === "front") setFrontPreview(dataUrl);
      else                     setBackPreview(dataUrl);
    };
    reader.readAsDataURL(imageFile);

    /* Set loading state, create texture, then update state */
    if (section === "front") setFrontLoading(true);
    else                     setBackLoading(true);

    try {
      const texture = await createTextureFromFile(imageFile);
      if (section === "front") setFrontTexture(texture);
      else                     setBackTexture(texture);
    } catch (err) {
      console.error("[VirtualTryOn] Failed to load texture:", err);
    } finally {
      if (section === "front") setFrontLoading(false);
      else                     setBackLoading(false);
    }
  }, []);

  /* Clear a design and revert to the model's default material */
  const clearDesign = useCallback((section: "front" | "back") => {
    if (section === "front") {
      frontTexture?.dispose(); // free GPU memory
      setFrontTexture(null);
      setFrontPreview(null);
    } else {
      backTexture?.dispose();
      setBackTexture(null);
      setBackPreview(null);
    }
  }, [frontTexture, backTexture]);

  /* Dispose textures when the component unmounts */
  useEffect(() => {
    return () => {
      frontTexture?.dispose();
      backTexture?.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── File input change handlers ── */
  const onFrontFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleDesignChange("front", file);
    /* Reset input so the same file can be re-selected */
    e.target.value = "";
  }, [handleDesignChange]);

  const onBackFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleDesignChange("back", file);
    e.target.value = "";
  }, [handleDesignChange]);

  const handleMeshesDiscovered = useCallback((names: string[]) => {
    setMeshNames(names);
  }, []);

  /* ── Render ── */
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
      dir="rtl"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">👕</span>
          <div>
            <p className="text-sm font-black text-white">قيّس التيشيرت ثلاثي الأبعاد</p>
            <p className="text-[10px] text-white/30">ارفع تصميمك وشوفه على القميص مباشرة</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.1] transition-all"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── 3D Canvas ── */}
      <div className="flex-1 relative min-h-0">
        {/* Fallback shown while Suspense resolves */}
        <ShirtLoader />

        <Canvas
          camera={{ position: [0, 0.15, 3.8], fov: 40 }}
          style={{ background: "transparent" }}
          shadows
          onPointerDown={() => setAutoRotate(false)}
        >
          {/* Lighting */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[4,  8,  4]} intensity={1.4} castShadow />
          <directionalLight position={[-4, 3, -2]} intensity={0.5} color="#b0ccff" />
          <pointLight       position={[0,  4,  5]} intensity={0.9} />
          <pointLight       position={[0, -3,  4]} intensity={0.2} color="#3366ff" />

          {/* Environment for realistic material reflections */}
          <Environment preset="city" />

          {/* The shirt model */}
          <Suspense fallback={null}>
            <ShirtModel
              frontTexture={frontTexture}
              backTexture={backTexture}
              onMeshesDiscovered={handleMeshesDiscovered}
              autoRotate={autoRotate}
            />
          </Suspense>

          {/* Orbit controls — allow full rotation, disable pan */}
          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI * 0.15}
            maxPolarAngle={Math.PI * 0.88}
            minDistance={1.5}
            maxDistance={7}
            onStart={() => setAutoRotate(false)}
            onEnd={() => {
              /* Resume auto-rotate 3 s after the user stops interacting */
              setTimeout(() => setAutoRotate(true), 3000);
            }}
          />
        </Canvas>

        {/* Hint text overlaid on canvas */}
        <p className="absolute bottom-3 inset-x-0 text-center text-[10px] text-white/20 pointer-events-none select-none tracking-widest">
          اسحب للتدوير · ابحر للتكبير
        </p>

        {/* Mesh debug info (hidden until meshes are discovered) */}
        {meshNames.length > 0 && (
          <div className="absolute top-3 left-3 bg-black/50 text-white/30 text-[9px] px-2 py-1 rounded-lg pointer-events-none font-mono leading-relaxed">
            {meshNames.map((n, i) => <div key={i}>{i}: {n}</div>)}
          </div>
        )}
      </div>

      {/* ── Upload Controls ── */}
      <div className="shrink-0 border-t border-white/[0.07] px-5 py-4">
        <div className="flex items-center justify-center gap-8">

          {/* Front design upload */}
          <UploadBtn
            label="الأمام"
            preview={frontPreview}
            loading={frontLoading}
            onClick={() => frontInputRef.current?.click()}
            onClear={() => clearDesign("front")}
            accent="#bfff00"
          />

          {/* Reset auto-rotate */}
          <button
            onClick={() => { clearDesign("front"); clearDesign("back"); setAutoRotate(true); }}
            className="flex flex-col items-center gap-1 opacity-40 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
              <RotateCcw size={16} className="text-white" />
            </div>
            <span className="text-[9px] text-white/50">إعادة</span>
          </button>

          {/* Back design upload */}
          <UploadBtn
            label="الخلف"
            preview={backPreview}
            loading={backLoading}
            onClick={() => backInputRef.current?.click()}
            onClear={() => clearDesign("back")}
            accent="#00b4ff"
          />
        </div>

        <p className="text-center text-[10px] text-white/20 mt-3">
          ارفع صورة PNG أو JPG لتصميم الأمام والخلف — ستظهر على القميص فوراً
        </p>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={frontInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onFrontFileChange}
      />
      <input
        ref={backInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onBackFileChange}
      />
    </div>
  );
}
