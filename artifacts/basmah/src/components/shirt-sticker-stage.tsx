/**
 * ShirtStickerStage — 2D sticker-on-jersey customizer
 * Supports both SVG jersey and real photo jersey.
 * When a photo is used, name + number are overlaid as text on top.
 */
import {
  useState, useRef, useCallback, useEffect,
  type PointerEvent as RPointerEvent,
  type MouseEvent as RMouseEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfiguratorJersey, type JerseyColors } from "@/components/configurator-jersey";
import { getStickerCanvas, type StickerDef } from "@/components/sticker-library";

interface PlacedSticker {
  uid: string;
  stickerDef: StickerDef;
  x: number;   // % relative to jersey container
  y: number;
  size: number;
  side: "front" | "back";
}

function StickerImg({ s, className, style }: {
  s: StickerDef; className?: string; style?: React.CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const src = getStickerCanvas(s);
    if (!src || !canvasRef.current) return;
    canvasRef.current.width  = src.width;
    canvasRef.current.height = src.height;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, src.width, src.height);
    ctx.drawImage(src, 0, 0);
  }, [s]);
  return <canvas ref={canvasRef} className={className} style={style} />;
}

export interface ShirtStickerStageProps {
  colors: JerseyColors;
  name: string;
  number: string;
  fontId: string;
  photoFront?: string;
  photoBack?: string;
  pendingSticker: StickerDef | null;
  onStickerPlaced: () => void;
  accentColor?: string;
  /* force view from outside (optional) */
  view?: "front" | "back";
  onViewChange?: (v: "front" | "back") => void;
}

export function ShirtStickerStage({
  colors, name, number, fontId,
  photoFront, photoBack,
  pendingSticker, onStickerPlaced,
  accentColor,
  view: externalView,
  onViewChange,
}: ShirtStickerStageProps) {

  const [internalView, setInternalView] = useState<"front" | "back">("front");
  const view    = externalView ?? internalView;
  const setView = (v: "front" | "back") => {
    if (onViewChange) onViewChange(v);
    else setInternalView(v);
  };

  const [flipping, setFlipping] = useState(false);
  const [scaleX, setScaleX]     = useState(1);
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [preview, setPreview]   = useState<{ x: number; y: number } | null>(null);

  const draggingUid  = useRef<string | null>(null);
  const dragOffset   = useRef({ x: 0, y: 0 });
  const flipDrag     = useRef(false);
  const flipLastX    = useRef(0);
  const flipAccum    = useRef(0);
  const jerseyRef    = useRef<HTMLDivElement>(null);

  const glow    = accentColor ?? colors.body;
  const isFront = view === "front";
  const hasPhoto = !!photoFront;

  const doFlip = useCallback(() => {
    if (flipping) return;
    setFlipping(true);
    setScaleX(0);
    setTimeout(() => {
      setView(v => v === "front" ? "back" : "front");
      setScaleX(1);
      setTimeout(() => setFlipping(false), 300);
    }, 260);
  }, [flipping]);

  function getJerseyPct(e: PointerEvent | RPointerEvent<HTMLDivElement>): { x: number; y: number } | null {
    if (!jerseyRef.current) return null;
    const rect = jerseyRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width)  * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }

  const onJerseyPointerDown = useCallback((e: RPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (pendingSticker) return;
    flipDrag.current  = true;
    flipLastX.current = e.clientX;
    flipAccum.current = 0;
  }, [pendingSticker]);

  const onJerseyPointerMove = useCallback((e: RPointerEvent<HTMLDivElement>) => {
    if (pendingSticker) { setPreview(getJerseyPct(e)); return; }
    if (!flipDrag.current) return;
    const dx = e.clientX - flipLastX.current;
    flipLastX.current = e.clientX;
    flipAccum.current += dx;
    if (Math.abs(flipAccum.current) > 100) { doFlip(); flipAccum.current = 0; }
  }, [pendingSticker, doFlip]);

  const onJerseyPointerUp = useCallback((e: RPointerEvent<HTMLDivElement>) => {
    flipDrag.current = false;
    if (!pendingSticker) return;
    const pct = getJerseyPct(e);
    if (!pct) return;
    setStickers(prev => [...prev, {
      uid: `${pendingSticker.id}-${Date.now()}`,
      stickerDef: pendingSticker,
      x: pct.x, y: pct.y,
      size: pendingSticker.text ? 72 : 58,
      side: view,
    }]);
    setPreview(null);
    onStickerPlaced();
  }, [pendingSticker, view, onStickerPlaced]);

  const onJerseyPointerLeave = useCallback(() => {
    setPreview(null);
    flipDrag.current = false;
  }, []);

  const onStickerPointerDown = useCallback((uid: string, e: RPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (pendingSticker) return;
    draggingUid.current = uid;
    const sticker = stickers.find(s => s.uid === uid);
    if (!sticker || !jerseyRef.current) return;
    const rect = jerseyRef.current.getBoundingClientRect();
    const curX = (sticker.x / 100) * rect.width  + rect.left;
    const curY = (sticker.y / 100) * rect.height + rect.top;
    dragOffset.current = { x: e.clientX - curX, y: e.clientY - curY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [pendingSticker, stickers]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingUid.current || !jerseyRef.current) return;
      const rect = jerseyRef.current.getBoundingClientRect();
      const x = ((e.clientX - dragOffset.current.x - rect.left) / rect.width)  * 100;
      const y = ((e.clientY - dragOffset.current.y - rect.top)  / rect.height) * 100;
      setStickers(prev => prev.map(s =>
        s.uid === draggingUid.current
          ? { ...s, x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) }
          : s,
      ));
    };
    const onUp = () => { draggingUid.current = null; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, []);

  const removeSticker = useCallback((uid: string, e: RMouseEvent) => {
    e.stopPropagation();
    setStickers(prev => prev.filter(s => s.uid !== uid));
  }, []);

  const visibleStickers = stickers.filter(s => s.side === view);
  const currentPhoto = isFront ? photoFront : (photoBack ?? photoFront);

  /* font for text overlay on photos */
  const fontMap: Record<string, string> = {
    block:   "Impact, Arial Black, sans-serif",
    sport:   "Arial Black, Helvetica, sans-serif",
    classic: "Georgia, Times New Roman, serif",
    slim:    "Trebuchet MS, Verdana, sans-serif",
  };
  const overlayFont = fontMap[fontId] ?? fontMap.block;

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden"
      style={{ cursor: pendingSticker ? "crosshair" : "ew-resize" }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 70% 65% at 50% 44%, ${glow}1e 0%, transparent 65%)`,
        transition: "background 0.9s ease",
      }} />

      {/* Jersey container */}
      <div
        ref={jerseyRef}
        className="relative z-10"
        style={{
          width:  hasPhoto ? "min(340px,64vw)" : "min(400px,74vw)",
          height: hasPhoto ? "min(460px,65vh)" : "min(500px,70vh)",
          transform: `scaleX(${scaleX})`,
          transition: `transform ${flipping ? "0.26s" : "0s"} cubic-bezier(0.4,0,0.6,1)`,
          filter: "drop-shadow(0 30px 55px rgba(0,0,0,0.86))",
        }}
        onPointerDown={onJerseyPointerDown}
        onPointerMove={onJerseyPointerMove}
        onPointerUp={onJerseyPointerUp}
        onPointerLeave={onJerseyPointerLeave}
      >
        {/* Jersey visual */}
        {hasPhoto ? (
          <>
            {/* Photo */}
            <img
              src={currentPhoto}
              alt={view}
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center top", userSelect: "none" }}
            />

            {/* Name + Number overlay on photo */}
            {(name || number) && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center"
                style={{ userSelect: "none" }}>
                {/* Name — positioned at ~45% from top */}
                {name && (
                  <div style={{
                    position: "absolute",
                    top: isFront ? "28%" : "30%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily: overlayFont,
                    fontWeight: 900,
                    fontSize: "clamp(14px, 4vw, 26px)",
                    color: colors.trim,
                    textShadow: "0 2px 12px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.6)",
                    letterSpacing: "3px",
                    whiteSpace: "nowrap",
                    maxWidth: "70%",
                    textAlign: "center",
                  }}>
                    {name.toUpperCase()}
                  </div>
                )}
                {/* Number — positioned at ~55-70% from top */}
                {number && (
                  <div style={{
                    position: "absolute",
                    top: isFront ? "44%" : "42%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily: overlayFont,
                    fontWeight: 900,
                    fontSize: "clamp(40px, 14vw, 110px)",
                    color: colors.trim,
                    textShadow: "0 4px 20px rgba(0,0,0,0.95), 0 0 40px rgba(0,0,0,0.7)",
                    letterSpacing: "-4px",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                  }}>
                    {number}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <ConfiguratorJersey
            colors={colors}
            name={name || "BASMAH"}
            number={number || "10"}
            view={view}
            fontId={fontId}
          />
        )}

        {/* Placed stickers */}
        {visibleStickers.map(s => (
          <div key={s.uid} className="absolute group"
            style={{
              left: `${s.x}%`, top: `${s.y}%`,
              transform: "translate(-50%, -50%)",
              cursor: pendingSticker ? "crosshair" : "move",
              zIndex: 10, touchAction: "none",
            }}
            onPointerDown={e => onStickerPointerDown(s.uid, e)}
            onDoubleClick={e => removeSticker(s.uid, e)}>
            <StickerImg s={s.stickerDef} style={{
              width: s.size, height: s.size, display: "block",
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.7))", objectFit: "contain",
            }} />
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100
                            transition-opacity bg-red-600/80 text-white text-[8px] font-bold px-1.5 py-0.5
                            rounded pointer-events-none whitespace-nowrap">
              دبل-كليك للحذف
            </div>
          </div>
        ))}

        {/* Pending sticker cursor preview */}
        {pendingSticker && preview && (
          <div className="absolute pointer-events-none"
            style={{ left: `${preview.x}%`, top: `${preview.y}%`, transform: "translate(-50%,-50%)", opacity: 0.72, zIndex: 20 }}>
            <StickerImg s={pendingSticker} style={{
              width: pendingSticker.text ? 80 : 56, height: pendingSticker.text ? 40 : 56,
              filter: "drop-shadow(0 2px 12px rgba(191,255,0,0.5))",
            }} />
          </div>
        )}
      </div>

      {/* Ground shadow */}
      <div className="pointer-events-none" style={{
        width: "min(260px,52vw)", height: "12px", marginTop: "6px",
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0.60) 0%, transparent 72%)",
        flexShrink: 0,
      }} />

      {/* Hint / pending */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
        {pendingSticker ? (
          <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="bg-black/70 border border-[#bfff00]/40 text-[#bfff00] text-xs font-black px-5 py-2 rounded-full backdrop-blur-sm">
            انقر على القميص لوضع الستيكر ✦
          </motion.div>
        ) : (
          <p className="text-[10px] text-white/18 tracking-widest select-none">
            اسحب لقلب القميص  ↔  دبل-كليك على ستيكر لحذفه
          </p>
        )}
      </div>

      {/* View indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/[0.05] px-2.5 py-1 rounded-full border border-white/[0.08]">
        <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${isFront ? "bg-[#bfff00]" : "bg-white/40"}`} />
        <span className="text-[10px] text-white/30 font-bold">{isFront ? "الأمام" : "الخلف"}</span>
      </div>

      {stickers.length > 0 && (
        <div className="absolute top-4 right-4 bg-[#bfff00]/10 border border-[#bfff00]/25 text-[#bfff00] text-[9px] font-black px-2 py-1 rounded-full">
          {stickers.length} ستيكر
        </div>
      )}
    </div>
  );
}
