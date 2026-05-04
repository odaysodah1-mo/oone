import { useState } from "react";

const PALETTE_GROUPS = [
  { name: "داكن",   colors: ["#000000","#0d0d0d","#1a1a2e","#16213e","#0f3460","#1b1b2f"] },
  { name: "فاتح",  colors: ["#ffffff","#f5f5f5","#e8e8e8","#cccccc","#b0b0b0","#8a8a8a"] },
  { name: "أحمر",  colors: ["#e63946","#c1121f","#ff6b6b","#d62828","#9b2226","#ae2012"] },
  { name: "أزرق",  colors: ["#023e8a","#0077b6","#00b4d8","#0096c7","#48cae4","#90e0ef"] },
  { name: "أخضر",  colors: ["#2d6a4f","#40916c","#52b788","#74c69d","#1b4332","#081c15"] },
  { name: "أصفر",  colors: ["#ffd60a","#fca311","#e9c46a","#f4a261","#ffb703","#fb8500"] },
  { name: "بنفسجي",colors: ["#6d6875","#b5838d","#6a4c93","#7b2d8b","#9d4edd","#c77dff"] },
];

const ZONE_LABELS: Record<string, string> = {
  body: "الجسم", sleeves: "الأكمام", collar: "الطوق", trim: "الاسم والرقم"
};

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [group, setGroup] = useState("داكن");
  const currentGroup = PALETTE_GROUPS.find(g => g.name === group) ?? PALETTE_GROUPS[0];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Group tabs */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {PALETTE_GROUPS.map(g => (
          <button key={g.name} onClick={() => setGroup(g.name)}
            style={{
              padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
              background: group === g.name ? "#BAFF00" : "rgba(255,255,255,0.05)",
              color: group === g.name ? "#000" : "rgba(255,255,255,0.4)",
              border: "none", cursor: "pointer", fontFamily: "inherit"
            }}>
            {g.name}
          </button>
        ))}
      </div>
      {/* Swatches — larger squares */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6 }}>
        {currentGroup.colors.map(c => (
          <button key={c} onClick={() => onChange(c)}
            title={c}
            style={{
              width: "100%", aspectRatio: "1", borderRadius: 6, border: "none", cursor: "pointer",
              backgroundColor: c,
              outline: value === c ? "2px solid #BAFF00" : "2px solid transparent",
              outlineOffset: 2,
              boxShadow: value === c ? "0 0 12px rgba(186,255,0,0.6)" : "0 1px 4px rgba(0,0,0,0.4)",
              transform: value === c ? "scale(1.12)" : "scale(1)",
              transition: "transform 0.15s, outline 0.15s"
            }} />
        ))}
      </div>
      {/* Active color display */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: value, border: "1px solid rgba(255,255,255,0.15)", flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{currentGroup.colors.find(c => c === value) ? currentGroup.name : "مخصص"}</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", letterSpacing: 1 }}>{value.toUpperCase()}</div>
        </div>
        <div style={{ marginRight: "auto", width: 20, height: 20, borderRadius: "50%", background: "rgba(186,255,0,0.15)", display: value ? "flex" : "none", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#BAFF00", fontSize: 11, fontWeight: 900 }}>✓</span>
        </div>
      </div>
    </div>
  );
}

export function SwipeZone() {
  const [zone, setZone] = useState<"body"|"sleeves"|"collar"|"trim">("body");
  const [colors, setColors] = useState({ body: "#023e8a", sleeves: "#ffffff", collar: "#023e8a", trim: "#ffd60a" });
  const [tab, setTab] = useState<"colors"|"name"|"size">("colors");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [size, setSize] = useState("");

  const zones = ["body","sleeves","collar","trim"] as const;
  const sizes = ["XS","S","M","L","XL","XXL"];
  const sizeInfo: Record<string,string> = { XS:"< 160 سم", S:"160–170", M:"170–178", L:"178–186", XL:"186–194", XXL:"> 194" };

  const tabs = [
    { id: "colors" as const, label: "الألوان" },
    { id: "name"   as const, label: "الاسم"  },
    { id: "size"   as const, label: "المقاس" },
  ];

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", background: "#080808", height: "100vh", display: "flex", flexDirection: "column", width: 300 }}>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 4px" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: "14px 0", fontSize: 13, fontWeight: 800,
              background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit",
              color: tab === t.id ? "#BAFF00" : "rgba(255,255,255,0.3)",
              borderBottom: tab === t.id ? "2px solid #BAFF00" : "2px solid transparent",
              letterSpacing: 0.5
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {tab === "colors" && (
          <>
            {/* Zone selector pills */}
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>المنطقة</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {zones.map(z => (
                  <button key={z} onClick={() => setZone(z)}
                    style={{
                      padding: "10px 8px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                      display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "inherit",
                      background: zone === z ? "rgba(186,255,0,0.1)" : "rgba(255,255,255,0.03)",
                      border: zone === z ? "1.5px solid #BAFF00" : "1.5px solid rgba(255,255,255,0.06)",
                      color: zone === z ? "#BAFF00" : "rgba(255,255,255,0.45)"
                    }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: colors[z], border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }} />
                    {ZONE_LABELS[z]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

            {/* Color picker for selected zone */}
            <div>
              <div style={{ fontSize: 10, color: "rgba(186,255,0,0.8)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
                🎨 {ZONE_LABELS[zone]}
              </div>
              <ColorPicker value={colors[zone]} onChange={c => setColors(p => ({...p, [zone]: c}))} />
            </div>

            {/* All zones mini preview */}
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>ألوانك المختارة</div>
              <div style={{ display: "flex", gap: 8 }}>
                {zones.map(z => (
                  <div key={z} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ width: "100%", aspectRatio: "1", borderRadius: 6, backgroundColor: colors[z], border: "1px solid rgba(255,255,255,0.1)", marginBottom: 4 }} />
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 600, lineHeight: 1 }}>{ZONE_LABELS[z].split(" ")[0]}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "name" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 8 }}>الاسم على القميص</label>
              <input value={name} onChange={e => setName(e.target.value.toUpperCase())} placeholder="AHMED" maxLength={12}
                style={{ width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 22, fontWeight: 900, fontFamily: "Impact, sans-serif", letterSpacing: 2, boxSizing: "border-box", outline: "none", borderRadius: 6 }} />
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 4, textAlign: "left" }}>{name.length}/12</div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 8 }}>الرقم</label>
              <input value={number} onChange={e => setNumber(e.target.value.replace(/\D/g,"").slice(0,2))} placeholder="10" maxLength={2}
                style={{ width: "100%", padding: "20px 16px", background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#BAFF00", fontSize: 64, fontWeight: 900, textAlign: "center", fontFamily: "Impact, sans-serif", boxSizing: "border-box", outline: "none", borderRadius: 6 }} />
            </div>
          </div>
        )}

        {tab === "size" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 8 }}>اختر المقاس المناسب لطولك</p>
            {sizes.map(s => (
              <button key={s} onClick={() => setSize(s)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 16px", border: "none", borderRadius: 8,
                  background: size === s ? "rgba(186,255,0,0.1)" : "rgba(255,255,255,0.03)",
                  outline: size === s ? "1.5px solid #BAFF00" : "1.5px solid rgba(255,255,255,0.06)",
                  color: size === s ? "#BAFF00" : "rgba(255,255,255,0.5)", fontSize: 20, fontWeight: 900,
                  cursor: "pointer", fontFamily: "inherit"
                }}>
                <span>{s}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>{sizeInfo[s]}</span>
                {size === s && <span style={{ fontSize: 14, color: "#BAFF00" }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.7)" }}>
        {!size && <p style={{ fontSize: 10, textAlign: "center", color: "rgba(255,196,0,0.6)", marginBottom: 8 }}>اختر المقاس لإتمام الطلب</p>}
        <button style={{
          width: "100%", padding: "15px", fontSize: 16, fontWeight: 900, border: "none", borderRadius: 8,
          background: size ? "#BAFF00" : "#1a1a1a", color: size ? "#000" : "#444",
          cursor: size ? "pointer" : "default", fontFamily: "inherit",
          boxShadow: size ? "0 0 24px rgba(186,255,0,0.3)" : "none"
        }}>
          {size ? "إتمام الطلب ←" : "اختر المقاس أولاً"}
        </button>
      </div>
    </div>
  );
}
