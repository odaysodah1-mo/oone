import { useState } from "react";

const PALETTE = [
  "#000000","#1a1a2e","#16213e","#ffffff","#f5f5f5","#cccccc",
  "#e63946","#c1121f","#ff6b6b","#023e8a","#0077b6","#00b4d8",
  "#2d6a4f","#40916c","#52b788","#ffd60a","#fca311","#e9c46a",
  "#6d6875","#b5838d","#6a4c93","#ff9f1c","#2ec4b6","#e71d36",
];

const ZONE_LABELS: Record<string, string> = {
  body: "لون الجسم", sleeves: "الأكمام", collar: "الطوق", trim: "الاسم والرقم"
};

function ZoneStrip({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.025)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, backgroundColor: value, border: "1px solid rgba(255,255,255,0.18)" }} />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", letterSpacing: 1 }}>{value.toUpperCase()}</span>
        </div>
      </div>
      {/* Horizontal scrollable strip */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {PALETTE.map(c => (
          <button key={c} onClick={() => onChange(c)}
            style={{
              width: 28, height: 28, flexShrink: 0, borderRadius: 5,
              backgroundColor: c, border: "none", cursor: "pointer",
              outline: value === c ? "2.5px solid #BAFF00" : "2px solid rgba(255,255,255,0.08)",
              outlineOffset: 1.5,
              boxShadow: value === c ? "0 0 10px rgba(186,255,0,0.5)" : "none",
              transform: value === c ? "scale(1.15) translateY(-1px)" : "scale(1)",
              transition: "transform 0.12s"
            }} />
        ))}
      </div>
    </div>
  );
}

export function StripCard() {
  const [colors, setColors] = useState({ body: "#e63946", sleeves: "#ffffff", collar: "#e63946", trim: "#ffd60a" });
  const [tab, setTab] = useState<"colors"|"name"|"size">("colors");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [size, setSize] = useState("");

  const tabs = [{ id: "colors" as const, label: "الألوان" }, { id: "name" as const, label: "الاسم" }, { id: "size" as const, label: "المقاس" }];
  const sizes = ["XS","S","M","L","XL","XXL"];
  const sizeInfo: Record<string,string> = { XS:"< 160 سم", S:"160–170", M:"170–178", L:"178–186", XL:"186–194", XXL:"> 194" };

  const fontStyles = [
    { id: "block", label: "BLOCK",   family: "Impact, Arial Black, sans-serif", preview: "AHMED" },
    { id: "sport", label: "SPORT",   family: "Arial Black, sans-serif",          preview: "AHMED" },
    { id: "classic",label:"Classic", family: "Georgia, serif",                   preview: "Ahmed" },
    { id: "slim",  label: "Slim",    family: "Trebuchet MS, Verdana, sans-serif", preview: "AHMED" },
  ];
  const [font, setFont] = useState("block");

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", background: "#070707", height: "100vh", display: "flex", flexDirection: "column", width: 300 }}>
      {/* Tabs — clean text only */}
      <div style={{ display: "flex", background: "#0e0e0e", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 8px" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: "16px 0", fontSize: 13, fontWeight: 800, letterSpacing: 0.3,
              background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit",
              color: tab === t.id ? "#BAFF00" : "rgba(255,255,255,0.25)",
              borderBottom: tab === t.id ? "2px solid #BAFF00" : "2px solid transparent"
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {tab === "colors" && (
          <>
            {/* Preview card showing all 4 zones at once */}
            <div style={{
              padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
              display: "flex", gap: 8, alignItems: "center"
            }}>
              {(["body","sleeves","collar","trim"] as const).map(z => (
                <div key={z} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, alignItems: "center" }}>
                  <div style={{ width: "100%", height: 32, borderRadius: 6, backgroundColor: colors[z], border: "1px solid rgba(255,255,255,0.12)" }} />
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textAlign: "center", lineHeight: 1.2 }}>{ZONE_LABELS[z].replace("لون ","")}</span>
                </div>
              ))}
            </div>

            {/* Zone strips */}
            {(["body","sleeves","collar","trim"] as const).map(z => (
              <ZoneStrip key={z} label={ZONE_LABELS[z]} value={colors[z]} onChange={c => setColors(p => ({...p, [z]: c}))} />
            ))}
          </>
        )}

        {tab === "name" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 10 }}>اسمك</label>
              <input value={name} onChange={e => setName(e.target.value.toUpperCase())} placeholder="AHMED" maxLength={12}
                style={{ width: "100%", padding: "12px 14px", background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 20, fontWeight: 900, fontFamily: "Impact, sans-serif", letterSpacing: 2, boxSizing: "border-box", outline: "none", borderRadius: 6 }} />
            </div>
            <div style={{ padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 10 }}>رقمك</label>
              <input value={number} onChange={e => setNumber(e.target.value.replace(/\D/g,"").slice(0,2))} placeholder="10" maxLength={2}
                style={{ width: "100%", padding: "16px", background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", color: "#BAFF00", fontSize: 60, fontWeight: 900, textAlign: "center", fontFamily: "Impact, sans-serif", boxSizing: "border-box", outline: "none", borderRadius: 6 }} />
            </div>
            {/* Font selector */}
            <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>نمط الخط</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {fontStyles.map(f => (
                  <button key={f.id} onClick={() => setFont(f.id)}
                    style={{
                      padding: "10px 8px", borderRadius: 6, cursor: "pointer", fontFamily: f.family,
                      background: font === f.id ? "rgba(186,255,0,0.08)" : "rgba(255,255,255,0.02)",
                      border: font === f.id ? "1.5px solid #BAFF00" : "1.5px solid rgba(255,255,255,0.07)",
                      color: font === f.id ? "#BAFF00" : "rgba(255,255,255,0.35)", fontSize: 14, fontWeight: 700
                    }}>
                    {f.preview}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "size" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: "0 0 8px" }}>اختر المقاس المناسب</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {sizes.map(s => (
                <button key={s} onClick={() => setSize(s)}
                  style={{
                    padding: "16px 8px", borderRadius: 8, fontSize: 18, fontWeight: 900,
                    background: size === s ? "rgba(186,255,0,0.1)" : "rgba(255,255,255,0.025)",
                    border: size === s ? "1.5px solid #BAFF00" : "1.5px solid rgba(255,255,255,0.07)",
                    color: size === s ? "#BAFF00" : "rgba(255,255,255,0.4)",
                    cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 4
                  }}>
                  <span>{s}</span>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontWeight: 500 }}>{sizeInfo[s]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {!size && <p style={{ fontSize: 10, textAlign: "center", color: "rgba(255,196,0,0.5)", marginBottom: 8 }}>اختر مقاسك لإتمام الطلب</p>}
        <button style={{
          width: "100%", padding: "15px", fontSize: 16, fontWeight: 900, borderRadius: 8, border: "none",
          background: size ? "linear-gradient(135deg,#BAFF00,#7ecf00)" : "#111",
          color: size ? "#000" : "#333", cursor: size ? "pointer" : "default", fontFamily: "inherit",
          boxShadow: size ? "0 4px 24px rgba(186,255,0,0.25)" : "none"
        }}>
          {size ? "إتمام الطلب ←" : "اختر المقاس أولاً"}
        </button>
      </div>
    </div>
  );
}
