import { useState } from "react";

const PALETTE = [
  "#000000","#1a1a2e","#16213e","#ffffff","#f5f5f5","#cccccc",
  "#e63946","#c1121f","#ff6b6b","#023e8a","#0077b6","#00b4d8",
  "#2d6a4f","#40916c","#52b788","#ffd60a","#fca311","#e9c46a",
  "#6d6875","#b5838d","#6a4c93","#ff9f1c","#2ec4b6","#e71d36",
];

const COLOR_NAMES: Record<string, string> = {
  "#000000":"أسود","#1a1a2e":"كحلي","#16213e":"نيلي","#ffffff":"أبيض","#f5f5f5":"فضي","#cccccc":"رمادي",
  "#e63946":"أحمر","#c1121f":"قرمزي","#ff6b6b":"سلموني","#023e8a":"أزرق","#0077b6":"سماوي","#00b4d8":"فيروزي",
  "#2d6a4f":"زيتي","#40916c":"أخضر","#52b788":"نعناعي","#ffd60a":"أصفر","#fca311":"برتقالي","#e9c46a":"ذهبي",
  "#6d6875":"بنفسجي","#b5838d":"وردي","#6a4c93":"بنفسجي غامق","#ff9f1c":"عسلي","#2ec4b6":"فيروزي فاتح","#e71d36":"أحمر فاتح",
};

type Zone = "body"|"sleeves"|"collar"|"trim";

const ZONE_LABELS: Record<Zone, string> = {
  body: "الجسم", sleeves: "الأكمام", collar: "الطوق", trim: "الاسم/الرقم"
};

const ZONE_ICONS: Record<Zone, string> = {
  body: "👕", sleeves: "💪", collar: "🔵", trim: "🔢"
};

function HexColorGrid({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [hex, setHex] = useState(value);

  const handleHexChange = (v: string) => {
    setHex(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(v);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Big swatches — 6 per row, squared */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 5 }}>
        {PALETTE.map(c => (
          <button key={c} onClick={() => { onChange(c); setHex(c); }}
            style={{
              width: "100%", aspectRatio: "1", borderRadius: 5,
              backgroundColor: c, border: "none", cursor: "pointer",
              outline: value === c ? "2.5px solid #BAFF00" : "2px solid transparent",
              outlineOffset: 1.5,
              boxShadow: value === c ? "0 0 14px rgba(186,255,0,0.55)" : "inset 0 0 0 1px rgba(255,255,255,0.08)",
              transform: value === c ? "scale(1.1)" : "scale(1)",
              transition: "transform 0.12s, outline 0.12s"
            }} />
        ))}
      </div>

      {/* Selected color info + HEX input */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{
          width: 42, height: 42, borderRadius: 8, backgroundColor: value,
          border: "1px solid rgba(255,255,255,0.15)", flexShrink: 0,
          boxShadow: `0 0 16px ${value}66`
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{COLOR_NAMES[value] ?? "مخصص"}</div>
          <input value={hex} onChange={e => handleHexChange(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              color: "#BAFF00", fontFamily: "monospace", fontSize: 12, padding: "4px 8px",
              width: "100%", boxSizing: "border-box", borderRadius: 4, outline: "none", letterSpacing: 1
            }} />
        </div>
      </div>
    </div>
  );
}

export function BigSquares() {
  const [zone, setZone] = useState<Zone>("body");
  const [colors, setColors] = useState<Record<Zone, string>>({
    body: "#2d6a4f", sleeves: "#40916c", collar: "#2d6a4f", trim: "#ffd60a"
  });
  const [tab, setTab] = useState<"colors"|"name"|"size">("colors");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [size, setSize] = useState("");
  const [font, setFont] = useState("block");

  const tabs = [{ id: "colors" as const, label: "الألوان" }, { id: "name" as const, label: "الاسم" }, { id: "size" as const, label: "المقاس" }];
  const sizes = ["XS","S","M","L","XL","XXL"];
  const sizeInfo: Record<string,string> = { XS:"< 160 سم", S:"160–170", M:"170–178", L:"178–186", XL:"186–194", XXL:"> 194" };
  const fontStyles = [
    { id: "block",   label: "BLOCK",   family: "Impact, Arial Black, sans-serif" },
    { id: "sport",   label: "SPORT",   family: "Arial Black, sans-serif"          },
    { id: "classic", label: "Classic", family: "Georgia, serif"                   },
    { id: "slim",    label: "Slim",    family: "Trebuchet MS, sans-serif"         },
  ];
  const zones: Zone[] = ["body","sleeves","collar","trim"];

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", background: "#060606", height: "100vh", display: "flex", flexDirection: "column", width: 300 }}>
      {/* Tabs */}
      <div style={{ display: "flex", background: "#0b0b0b", padding: "0 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: "15px 0", fontSize: 13, fontWeight: 800,
              background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit",
              color: tab === t.id ? "#BAFF00" : "rgba(255,255,255,0.25)",
              borderBottom: tab === t.id ? "2px solid #BAFF00" : "2px solid transparent",
              letterSpacing: 0.3
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 0" }}>
        {tab === "colors" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Zone tabs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 5 }}>
              {zones.map(z => (
                <button key={z} onClick={() => setZone(z)}
                  style={{
                    padding: "8px 4px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                    background: zone === z ? "rgba(186,255,0,0.08)" : "rgba(255,255,255,0.02)",
                    border: zone === z ? "1.5px solid #BAFF00" : "1.5px solid rgba(255,255,255,0.06)",
                  }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 5, backgroundColor: colors[z],
                    border: "1px solid rgba(255,255,255,0.15)"
                  }} />
                  <span style={{ fontSize: 9, color: zone === z ? "#BAFF00" : "rgba(255,255,255,0.35)", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
                    {ZONE_LABELS[z]}
                  </span>
                </button>
              ))}
            </div>

            {/* Divider with active zone label */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.06)" }} />
              <span style={{ fontSize: 10, color: "#BAFF00", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase" }}>
                {ZONE_ICONS[zone]} {ZONE_LABELS[zone]}
              </span>
              <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>

            {/* Big color grid */}
            <HexColorGrid value={colors[zone]} onChange={c => setColors(p => ({...p, [zone]: c}))} />
          </div>
        )}

        {tab === "name" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>الاسم</div>
              <input value={name} onChange={e => setName(e.target.value.toUpperCase())} placeholder="AHMED" maxLength={12}
                style={{
                  width: "100%", padding: "12px 14px", background: "#0a0a0a", borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.1)", color: "#fff",
                  fontSize: 22, fontWeight: 900, fontFamily: "Impact, sans-serif", letterSpacing: 3,
                  boxSizing: "border-box", outline: "none"
                }} />
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", textAlign: "left", marginTop: 4 }}>{name.length}/12</div>
            </div>
            <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>الرقم</div>
              <input value={number} onChange={e => setNumber(e.target.value.replace(/\D/g,"").slice(0,2))} placeholder="10" maxLength={2}
                style={{
                  width: "100%", padding: "18px 14px", background: "#0a0a0a", borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.1)", color: "#BAFF00",
                  fontSize: 56, fontWeight: 900, textAlign: "center", fontFamily: "Impact, sans-serif",
                  boxSizing: "border-box", outline: "none"
                }} />
            </div>
            <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>نمط الخط</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {fontStyles.map(f => (
                  <button key={f.id} onClick={() => setFont(f.id)}
                    style={{
                      padding: "10px 6px", borderRadius: 6, cursor: "pointer", fontFamily: f.family,
                      background: font === f.id ? "rgba(186,255,0,0.08)" : "rgba(255,255,255,0.02)",
                      border: font === f.id ? "1.5px solid #BAFF00" : "1.5px solid rgba(255,255,255,0.06)",
                      color: font === f.id ? "#BAFF00" : "rgba(255,255,255,0.3)", fontSize: 14
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "size" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: "0 0 8px" }}>اختر المقاس المناسب لطولك</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
              {sizes.map(s => (
                <button key={s} onClick={() => setSize(s)}
                  style={{
                    padding: "18px 8px", borderRadius: 8, fontSize: 22, fontWeight: 900,
                    background: size === s ? "rgba(186,255,0,0.1)" : "rgba(255,255,255,0.02)",
                    border: size === s ? "2px solid #BAFF00" : "1.5px solid rgba(255,255,255,0.06)",
                    color: size === s ? "#BAFF00" : "rgba(255,255,255,0.35)",
                    cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 5
                  }}>
                  <span>{s}</span>
                  <span style={{ fontSize: 9, fontWeight: 500, color: "rgba(255,255,255,0.2)" }}>{sizeInfo[s]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: 14, borderTop: "1px solid rgba(255,255,255,0.05)", background: "#050505", marginTop: 14 }}>
        {!size && <p style={{ fontSize: 10, textAlign: "center", color: "rgba(255,186,0,0.5)", marginBottom: 8 }}>اختر مقاسك أولاً</p>}
        <button style={{
          width: "100%", padding: "14px", fontSize: 16, fontWeight: 900, border: "none", borderRadius: 8,
          background: size ? "#BAFF00" : "#0f0f0f",
          color: size ? "#000" : "#222", cursor: size ? "pointer" : "default", fontFamily: "inherit",
          boxShadow: size ? "0 0 28px rgba(186,255,0,0.28)" : "none",
          letterSpacing: 0.5
        }}>
          {size ? "إتمام الطلب ←" : "اختر المقاس أولاً"}
        </button>
      </div>
    </div>
  );
}
