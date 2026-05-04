import { useState } from "react";

const PALETTE = [
  "#000000","#1a1a2e","#16213e","#ffffff","#f5f5f5","#cccccc",
  "#e63946","#c1121f","#ff6b6b","#023e8a","#0077b6","#00b4d8",
  "#2d6a4f","#40916c","#52b788","#ffd60a","#fca311","#e9c46a",
  "#6d6875","#b5838d","#6a4c93","#ff9f1c","#2ec4b6","#e71d36",
];

function ZonePicker({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>{label}</span>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: value, borderColor: "rgba(255,255,255,0.25)" }} />
          <span className="text-[10px] font-mono uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>{value}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PALETTE.map(c => (
          <button key={c} onClick={() => onChange(c)}
            className="w-7 h-7 rounded-full transition-all"
            style={{
              backgroundColor: c,
              border: value === c ? "2.5px solid #bfff00" : "2px solid rgba(255,255,255,0.10)",
              boxShadow: value === c ? "0 0 10px rgba(191,255,0,0.65)" : "none",
              transform: value === c ? "scale(1.2)" : "scale(1)",
            }} />
        ))}
      </div>
    </div>
  );
}

export function Current() {
  const [tab, setTab] = useState<"colors"|"name"|"size">("colors");
  const [colors, setColors] = useState({ body: "#cc0000", sleeves: "#ffffff", collar: "#cc0000", trim: "#ffffff" });
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [size, setSize] = useState("");
  const tabs = [
    { id: "colors" as const, icon: "🎨", label: "الألوان" },
    { id: "name"   as const, icon: "✏️",  label: "الاسم"  },
    { id: "size"   as const, icon: "📐",  label: "المقاس" },
  ];
  const sizes = ["XS","S","M","L","XL","XXL"];
  const sizeInfo: Record<string,string> = { XS:"< 160 سم", S:"160–170", M:"170–178", L:"178–186", XL:"186–194", XXL:"> 194" };

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", background: "#0a0a0a", height: "100vh", display: "flex", flexDirection: "column", width: 300 }}>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              padding: "14px 0 10px", gap: 2, fontSize: 12, fontWeight: 900,
              background: tab === t.id ? "rgba(191,255,0,0.05)" : "transparent",
              color: tab === t.id ? "#bfff00" : "rgba(255,255,255,0.3)",
              borderBottom: tab === t.id ? "2px solid #bfff00" : "2px solid transparent",
              border: "none", cursor: "pointer", fontFamily: "inherit"
            }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
        {tab === "colors" && (
          <>
            <ZonePicker label="لون الجسم" value={colors.body} onChange={c => setColors(p => ({...p, body: c}))} />
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
            <ZonePicker label="لون الأكمام" value={colors.sleeves} onChange={c => setColors(p => ({...p, sleeves: c}))} />
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
            <ZonePicker label="لون الطوق" value={colors.collar} onChange={c => setColors(p => ({...p, collar: c}))} />
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
            <ZonePicker label="الاسم والرقم" value={colors.trim} onChange={c => setColors(p => ({...p, trim: c}))} />
          </>
        )}
        {tab === "name" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 8 }}>الاسم</label>
              <input value={name} onChange={e => setName(e.target.value.toUpperCase())} placeholder="AHMED" maxLength={12}
                style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff", fontSize: 18, fontWeight: 900, fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 8 }}>الرقم</label>
              <input value={number} onChange={e => setNumber(e.target.value.replace(/\D/g,"").slice(0,2))} placeholder="10" maxLength={2}
                style={{ width: "100%", padding: "16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff", fontSize: 48, fontWeight: 900, textAlign: "center", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
          </div>
        )}
        {tab === "size" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sizes.map(s => (
              <button key={s} onClick={() => setSize(s)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 16px", border: `1px solid ${size === s ? "#bfff00" : "rgba(255,255,255,0.07)"}`,
                  background: size === s ? "rgba(191,255,0,0.08)" : "rgba(255,255,255,0.02)",
                  color: size === s ? "#bfff00" : "rgba(255,255,255,0.5)", fontSize: 22, fontWeight: 900,
                  cursor: "pointer", fontFamily: "inherit"
                }}>
                <span>{s}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{sizeInfo[s]}</span>
                {size === s && <span>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.6)" }}>
        {!size && <p style={{ fontSize: 10, textAlign: "center", color: "rgba(255,196,0,0.7)", marginBottom: 8 }}>⚠ اختر المقاس من تبويب 📐</p>}
        <button style={{
          width: "100%", padding: "16px", fontSize: 18, fontWeight: 900, border: "none",
          background: size ? "linear-gradient(135deg,#bfff00 0%,#7ecf00 100%)" : "#1a1a1a",
          color: size ? "#000" : "#444", cursor: size ? "pointer" : "default", fontFamily: "inherit",
          boxShadow: size ? "0 0 30px rgba(191,255,0,0.30)" : "none"
        }}>
          {size ? "🛒 إتمام الطلب" : "اختر المقاس أولاً"}
        </button>
      </div>
    </div>
  );
}
