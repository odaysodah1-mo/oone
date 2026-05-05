/**
 * Sticker library — definitions + canvas-texture generator
 * Pure Canvas API, zero Three.js / WebGL dependency.
 */
/* ═══════════════════════════════════════════════════════
   STICKER DEFINITIONS
═══════════════════════════════════════════════════════ */
export interface StickerDef {
  id: string;
  label: string;
  category: string;
  /** Remote image URL for admin-managed stickers */
  url?: string;
  /** Inline emoji rendered on canvas */
  emoji?: string;
  /** Inline text rendered on canvas */
  text?: string;
  textColor?: string;
  isArabic?: boolean;
}

/* ═══════════════════════════════════════════════════════
   TEXTURE GENERATORS (Canvas API only)
═══════════════════════════════════════════════════════ */
function makeEmojiCanvas(emoji: string): HTMLCanvasElement {
  const S = 256;
  const canvas = document.createElement("canvas");
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, S, S);
  ctx.font = `${Math.round(S * 0.76)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, S / 2, S / 2);
  return canvas;
}

function makeTextCanvas(text: string, color = "#ffffff", isArabic = false): HTMLCanvasElement {
  const W = 512; const H = 256;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  const fontSize = Math.min(170, Math.floor(W / (text.length * 0.62 + 1)));
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
  return canvas;
}

/** Returns a raw HTMLCanvasElement (no Three.js) */
export function getStickerCanvas(s: StickerDef): HTMLCanvasElement {
  if (s.emoji) return makeEmojiCanvas(s.emoji);
  if (s.text)  return makeTextCanvas(s.text, s.textColor ?? "#ffffff", s.isArabic);
  return makeEmojiCanvas("⭐");
}

/** For backward compat with three-shirt-scene imports */
export function getStickerTexture(s: StickerDef): { image: HTMLCanvasElement } {
  return { image: getStickerCanvas(s) };
}
