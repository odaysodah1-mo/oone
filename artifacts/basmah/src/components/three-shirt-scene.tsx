/**
 * ThreeShirtScene — R3F 3-D shirt customizer with drag-and-drop stickers
 * Uses @react-three/fiber + @react-three/drei + three.js
 */
import {
  Suspense, useRef, useState, useCallback, useEffect,
} from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════
   STICKER LIBRARY
═══════════════════════════════════════════════════════ */
export interface StickerDef {
  id: string;
  label: string;
  category: string;
  emoji?: string;
  text?: string;
  textColor?: string;
  isArabic?: boolean;
}

export const STICKER_LIBRARY: StickerDef[] = [
  /* Trending / Memes */
  { id: "fire",       label: "🔥",     category: "ترند",  emoji: "🔥" },
  { id: "skull",      label: "💀",     category: "ترند",  emoji: "💀" },
  { id: "100",        label: "💯",     category: "ترند",  emoji: "💯" },
  { id: "lightning",  label: "⚡",     category: "ترند",  emoji: "⚡" },
  { id: "crown",      label: "👑",     category: "ترند",  emoji: "👑" },
  { id: "muscle",     label: "💪",     category: "ترند",  emoji: "💪" },
  { id: "rocket",     label: "🚀",     category: "ترند",  emoji: "🚀" },
  { id: "alien",      label: "👾",     category: "ترند",  emoji: "👾" },
  { id: "cool",       label: "😎",     category: "ترند",  emoji: "😎" },
  { id: "moai",       label: "🗿",     category: "ترند",  emoji: "🗿" },
  { id: "clown",      label: "🤡",     category: "ترند",  emoji: "🤡" },
  { id: "pepe",       label: "😤",     category: "ترند",  emoji: "😤" },
  /* Jordan / Football */
  { id: "jo_flag",    label: "🇯🇴",    category: "أردن",  emoji: "🇯🇴" },
  { id: "ball",       label: "⚽",     category: "أردن",  emoji: "⚽" },
  { id: "trophy",     label: "🏆",     category: "أردن",  emoji: "🏆" },
  { id: "star",       label: "⭐",     category: "أردن",  emoji: "⭐" },
  { id: "medal",      label: "🥇",     category: "أردن",  emoji: "🥇" },
  { id: "diamond",    label: "💎",     category: "أردن",  emoji: "💎" },
  { id: "eagle",      label: "🦅",     category: "أردن",  emoji: "🦅" },
  { id: "boom",       label: "💥",     category: "أردن",  emoji: "💥" },
  /* English text */
  { id: "goat",    label: "GOAT",   category: "نص",    text: "GOAT",   textColor: "#ffd700" },
  { id: "mvp",     label: "MVP",    category: "نص",    text: "MVP",    textColor: "#ffffff" },
  { id: "legend",  label: "LEGEND", category: "نص",    text: "LEGEND", textColor: "#ff4444" },
  { id: "king_en", label: "KING",   category: "نص",    text: "KING",   textColor: "#ffd700" },
  { id: "beast",   label: "BEAST",  category: "نص",    text: "BEAST",  textColor: "#00ff88" },
  /* Arabic text */
  { id: "ar_king",   label: "ملك",    category: "عربي", text: "ملك",    textColor: "#ffd700", isArabic: true },
  { id: "ar_legend", label: "أسطورة", category: "عربي", text: "أسطورة", textColor: "#ff4444", isArabic: true },
  { id: "ar_goat",   label: "الأفضل", category: "عربي", text: "الأفضل", textColor: "#00ff88", isArabic: true },
  { id: "ar_champ",  label: "بطل",    category: "عربي", text: "بطل",    textColor: "#00b4d8", isArabic: true },
  { id: "ar_boss",   label: "رئيس",   category: "عربي", text: "رئيس",   textColor: "#ff9900", isArabic: true },
];

/* ═══════════════════════════════════════════════════════
   TEXTURE GENERATORS
═══════════════════════════════════════════════════════ */
function makeEmojiTexture(emoji: string): THREE.CanvasTexture {
  const S = 256;
  const canvas = document.createElement("canvas");
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, S, S);
  ctx.font = `${Math.round(S * 0.78)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, S / 2, S / 2);
  return new THREE.CanvasTexture(canvas);
}

function makeTextTexture(
  text: string,
  color = "#ffffff",
  isArabic = false,
): THREE.CanvasTexture {
  const W = 512; const H = 256;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  const fontSize = Math.min(170, Math.floor(W / (text.length * 0.65 + 1)));
  ctx.font = `900 ${fontSize}px Impact, 'Arial Black', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (isArabic) ctx.direction = "rtl";
  ctx.strokeStyle = "rgba(0,0,0,0.92)";
  ctx.lineWidth = fontSize * 0.14;
  ctx.lineJoin = "round";
  ctx.strokeText(text, W / 2, H / 2);
  ctx.fillStyle = color;
  ctx.fillText(text, W / 2, H / 2);
  return new THREE.CanvasTexture(canvas);
}

export function getStickerTexture(s: StickerDef): THREE.CanvasTexture {
  if (s.emoji) return makeEmojiTexture(s.emoji);
  if (s.text)  return makeTextTexture(s.text, s.textColor ?? "#ffffff", s.isArabic);
  return makeEmojiTexture("⭐");
}

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */
interface PlacedSticker {
  uid: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  texture: THREE.CanvasTexture;
  scaleX: number;
  scaleY: number;
}

/* ═══════════════════════════════════════════════════════
   3-D SHIRT MODEL
═══════════════════════════════════════════════════════ */
function ShirtModel({
  placed,
  pending,
  hoverPos,
  hoverRot,
  onHover,
  onPlace,
}: {
  placed: PlacedSticker[];
  pending: StickerDef | null;
  hoverPos: THREE.Vector3 | null;
  hoverRot: THREE.Euler | null;
  onHover: (p: THREE.Vector3, r: THREE.Euler) => void;
  onPlace: (p: THREE.Vector3, r: THREE.Euler) => void;
}) {
  const gltf = useGLTF("/jerseys/shirt.glb");
  const groupRef = useRef<THREE.Group>(null);

  /* Normalize model to fit 2-unit bounding box */
  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    const box = new THREE.Box3().setFromObject(g);
    const sz  = box.getSize(new THREE.Vector3());
    const ctr = box.getCenter(new THREE.Vector3());
    const sc  = 2.2 / Math.max(sz.x, sz.y, sz.z);
    g.scale.setScalar(sc);
    g.position.set(-ctr.x * sc, -ctr.y * sc + 0.05, -ctr.z * sc);
  }, [gltf.scene]);

  function worldNormalRot(e: any): THREE.Euler {
    const fn = e.face?.normal?.clone() ?? new THREE.Vector3(0, 0, 1);
    const wn = fn.transformDirection(e.object.matrixWorld).normalize();
    const q  = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1), wn,
    );
    return new THREE.Euler().setFromQuaternion(q);
  }

  const onPM = useCallback((e: any) => {
    if (!pending) return;
    e.stopPropagation();
    onHover(e.point.clone(), worldNormalRot(e));
  }, [pending, onHover]);

  const onPD = useCallback((e: any) => {
    if (!pending) return;
    e.stopPropagation();
    onPlace(e.point.clone(), worldNormalRot(e));
  }, [pending, onPlace]);

  const STICKER_OFFSET = 0.003; // push sticker slightly in front of surface

  return (
    <>
      {/* ── The shirt model ── */}
      <primitive
        object={gltf.scene}
        ref={groupRef}
        onPointerMove={onPM}
        onPointerDown={onPD}
      />

      {/* ── Placed stickers ── */}
      {placed.map((s) => {
        const nx = s.rotation.x ? Math.sin(s.rotation.x) : 0;
        const nz = Math.cos(s.rotation.x);
        const offsetPos = s.position.clone().addScaledVector(
          new THREE.Vector3(nx, 0, nz), STICKER_OFFSET,
        );
        return (
          <mesh
            key={s.uid}
            position={offsetPos.toArray() as [number, number, number]}
            rotation={s.rotation}
          >
            <planeGeometry args={[s.scaleX, s.scaleY]} />
            <meshBasicMaterial
              map={s.texture}
              transparent
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-6}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      {/* ── Hover preview ── */}
      {pending && hoverPos && hoverRot && (() => {
        const isText  = !!pending.text;
        const baseS   = 0.20;
        const aspect  = isText ? Math.max(1.4, (pending.text?.length ?? 3) * 0.42) : 1;
        return (
          <mesh
            position={hoverPos.toArray() as [number, number, number]}
            rotation={hoverRot}
          >
            <planeGeometry args={[baseS * aspect, baseS]} />
            <meshBasicMaterial
              map={getStickerTexture(pending)}
              transparent
              depthWrite={false}
              opacity={0.72}
              polygonOffset
              polygonOffsetFactor={-6}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })()}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   SCENE CONTENT
═══════════════════════════════════════════════════════ */
function SceneContent({
  placed,
  pending,
  onPlace,
}: {
  placed: PlacedSticker[];
  pending: StickerDef | null;
  onPlace: (p: THREE.Vector3, r: THREE.Euler) => void;
}) {
  const [hoverPos, setHoverPos] = useState<THREE.Vector3 | null>(null);
  const [hoverRot, setHoverRot] = useState<THREE.Euler | null>(null);

  const handleHover  = useCallback((p: THREE.Vector3, r: THREE.Euler) => {
    setHoverPos(p); setHoverRot(r);
  }, []);

  const handlePlace  = useCallback((p: THREE.Vector3, r: THREE.Euler) => {
    setHoverPos(null);
    onPlace(p, r);
  }, [onPlace]);

  return (
    <>
      {/* ── Lighting ── */}
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 8, 4]}  intensity={1.3} castShadow />
      <directionalLight position={[-4, 3, -2]} intensity={0.45} color="#b0ccff" />
      <pointLight       position={[0, 4, 5]}   intensity={0.9} />
      <pointLight       position={[0, -3, 4]}  intensity={0.2} color="#3366ff" />

      {/* ── Model ── */}
      <Suspense fallback={null}>
        <ShirtModel
          placed={placed}
          pending={pending}
          hoverPos={hoverPos}
          hoverRot={hoverRot}
          onHover={handleHover}
          onPlace={handlePlace}
        />
      </Suspense>

      {/* ── Controls ── */}
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI * 0.85}
        minDistance={2}
        maxDistance={6}
        enabled={!pending}
        autoRotate={!pending}
        autoRotateSpeed={0.6}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   PUBLIC COMPONENT
═══════════════════════════════════════════════════════ */
export interface ThreeShirtSceneProps {
  pending: StickerDef | null;
  onPlaced: () => void;
  cursorHint?: boolean;
}

export function ThreeShirtScene({ pending, onPlaced, cursorHint = true }: ThreeShirtSceneProps) {
  const [placed, setPlaced] = useState<PlacedSticker[]>([]);

  const handlePlace = useCallback((pos: THREE.Vector3, rot: THREE.Euler) => {
    if (!pending) return;
    const isText = !!pending.text;
    const len    = pending.text?.length ?? 3;
    const aspect = isText ? Math.max(1.4, len * 0.42) : 1;
    const baseS  = 0.20;
    setPlaced((prev) => [
      ...prev,
      {
        uid:     `${pending.id}-${Date.now()}`,
        position: pos,
        rotation: rot,
        texture:  getStickerTexture(pending),
        scaleX:   baseS * aspect,
        scaleY:   baseS,
      },
    ]);
    onPlaced();
  }, [pending, onPlaced]);

  return (
    <div
      className="relative w-full h-full"
      style={{ cursor: pending ? "crosshair" : "grab" }}
    >
      <Canvas camera={{ position: [0, 0.2, 3.6], fov: 42 }} style={{ background: "transparent" }} shadows>
        <SceneContent placed={placed} pending={pending} onPlace={handlePlace} />
      </Canvas>

      {/* Instruction overlay */}
      {pending && cursorHint && (
        <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none">
          <div className="bg-black/70 border border-[#bfff00]/40 text-[#bfff00] text-xs font-bold px-4 py-2 rounded-full backdrop-blur-sm">
            انقر على القميص لوضع الستيكر
          </div>
        </div>
      )}
      {!pending && cursorHint && (
        <p className="absolute bottom-3 inset-x-0 text-center text-[10px] text-white/20 pointer-events-none select-none tracking-widest">
          اسحب للتدوير · ابحر للتكبير
        </p>
      )}
    </div>
  );
}
