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
  emoji?: string;
  text?: string;
  textColor?: string;
  isArabic?: boolean;
}

export const STICKER_LIBRARY: StickerDef[] = [
  /* ── Trending / Memes ── */
  { id: "fire",      label: "🔥",     category: "ترند",  emoji: "🔥" },
  { id: "skull",     label: "💀",     category: "ترند",  emoji: "💀" },
  { id: "100",       label: "💯",     category: "ترند",  emoji: "💯" },
  { id: "lightning", label: "⚡",     category: "ترند",  emoji: "⚡" },
  { id: "crown",     label: "👑",     category: "ترند",  emoji: "👑" },
  { id: "muscle",    label: "💪",     category: "ترند",  emoji: "💪" },
  { id: "rocket",    label: "🚀",     category: "ترند",  emoji: "🚀" },
  { id: "alien",     label: "👾",     category: "ترند",  emoji: "👾" },
  { id: "cool",      label: "😎",     category: "ترند",  emoji: "😎" },
  { id: "moai",      label: "🗿",     category: "ترند",  emoji: "🗿" },
  { id: "clown",     label: "🤡",     category: "ترند",  emoji: "🤡" },
  { id: "rage",      label: "😤",     category: "ترند",  emoji: "😤" },
  { id: "nerd",      label: "🤓",     category: "ترند",  emoji: "🤓" },
  { id: "boom",      label: "💥",     category: "ترند",  emoji: "💥" },

  /* ── Jordan / Football ── */
  { id: "jo_flag",   label: "🇯🇴",    category: "أردن",  emoji: "🇯🇴" },
  { id: "ball",      label: "⚽",     category: "أردن",  emoji: "⚽" },
  { id: "trophy",    label: "🏆",     category: "أردن",  emoji: "🏆" },
  { id: "star",      label: "⭐",     category: "أردن",  emoji: "⭐" },
  { id: "medal",     label: "🥇",     category: "أردن",  emoji: "🥇" },
  { id: "diamond",   label: "💎",     category: "أردن",  emoji: "💎" },
  { id: "eagle",     label: "🦅",     category: "أردن",  emoji: "🦅" },
  { id: "heart",     label: "❤️",     category: "أردن",  emoji: "❤️" },

  /* ── English text ── */
  { id: "goat",    label: "GOAT",   category: "نص", text: "GOAT",   textColor: "#ffd700" },
  { id: "mvp",     label: "MVP",    category: "نص", text: "MVP",    textColor: "#ffffff" },
  { id: "legend",  label: "LEGEND", category: "نص", text: "LEGEND", textColor: "#ff4444" },
  { id: "king_en", label: "KING",   category: "نص", text: "KING",   textColor: "#ffd700" },
  { id: "beast",   label: "BEAST",  category: "نص", text: "BEAST",  textColor: "#00ff88" },
  { id: "grind",   label: "GRIND",  category: "نص", text: "GRIND",  textColor: "#ff9900" },

  /* ── Arabic text ── */
  { id: "ar_king",   label: "ملك",    category: "عربي", text: "ملك",    textColor: "#ffd700", isArabic: true },
  { id: "ar_legend", label: "أسطورة", category: "عربي", text: "أسطورة", textColor: "#ff4444", isArabic: true },
  { id: "ar_goat",   label: "الأفضل", category: "عربي", text: "الأفضل", textColor: "#00ff88", isArabic: true },
  { id: "ar_champ",  label: "بطل",    category: "عربي", text: "بطل",    textColor: "#00b4d8", isArabic: true },
  { id: "ar_boss",   label: "رئيس",   category: "عربي", text: "رئيس",   textColor: "#ff9900", isArabic: true },
  { id: "ar_nash",   label: "نشمي",   category: "عربي", text: "نشمي",   textColor: "#bfff00", isArabic: true },
];

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
