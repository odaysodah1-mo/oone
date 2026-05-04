export function BoldVariant() {
  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", background: "#000", minHeight: "100vh", color: "#fff", overflow: "hidden" }}>

      {/* GRID BACKGROUND */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(186,255,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(186,255,0,0.03) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />

      {/* TOP TICKER */}
      <div style={{ position: "relative", zIndex: 10, background: "#BAFF00", padding: "8px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 60, animation: "none", whiteSpace: "nowrap" }}>
          {Array(6).fill(0).map((_, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 900, color: "#000", letterSpacing: 3, textTransform: "uppercase" }}>
              بصمة ★ BASMAH ★ قمصان مخصصة ★
            </span>
          ))}
        </div>
      </div>

      {/* NAV */}
      <nav style={{
        position: "relative", zIndex: 10, padding: "20px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid #111"
      }}>
        <div style={{ display: "flex", gap: 24 }}>
          {["الفرق","الطلبات","تتبع","إحصائيات"].map(l => (
            <span key={l} style={{ fontSize: 12, fontWeight: 700, color: "#444", cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}>{l}</span>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#BAFF00", letterSpacing: 4, textTransform: "uppercase" }}>بصمة</span>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", zIndex: 1, padding: "70px 40px 80px", borderBottom: "1px solid #111" }}>

        {/* scanline overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)",
          opacity: 0.15
        }} />

        {/* BIG NUMBER */}
        <div style={{
          position: "absolute", left: -20, top: "50%", transform: "translateY(-50%)",
          fontSize: 320, fontWeight: 900, color: "#BAFF00", opacity: 0.03,
          lineHeight: 1, userSelect: "none", letterSpacing: -20
        }}>1</div>

        <div style={{ position: "relative" }}>
          {/* label strip */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <div style={{ width: 40, height: 2, background: "#BAFF00" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#BAFF00", letterSpacing: 3, textTransform: "uppercase" }}>Custom Jersey Platform — Jordan</span>
          </div>

          <h1 style={{ fontSize: 96, fontWeight: 900, lineHeight: 0.88, margin: "0 0 0", letterSpacing: -5, textTransform: "uppercase" }}>
            اترك<br />
            <span style={{
              color: "#000",
              background: "#BAFF00",
              padding: "0 16px",
              display: "inline-block",
              transform: "skewX(-4deg)",
              marginTop: 8
            }}>
              بصمتك
            </span>
          </h1>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 60, marginTop: 40 }}>
            <p style={{ fontSize: 15, color: "#555", maxWidth: 360, lineHeight: 1.8, margin: 0, fontWeight: 400 }}>
              صمم قميص فريقك المفضل باسمك ورقمك. ارتدي هويتك في الملعب.
            </p>
            <div>
              <button style={{
                padding: "18px 48px", background: "#BAFF00", color: "#000",
                fontWeight: 900, fontSize: 14, border: "none", cursor: "pointer",
                letterSpacing: 2, textTransform: "uppercase", fontFamily: "inherit",
                transform: "skewX(-4deg)", display: "block", marginBottom: 12
              }}>
                <span style={{ display: "inline-block", transform: "skewX(4deg)" }}>ابدأ التصميم ←</span>
              </button>
              <div style={{ fontSize: 11, color: "#333", letterSpacing: 1, textAlign: "center" }}>مجانًا • بدون تسجيل</div>
            </div>
          </div>
        </div>
      </section>

      {/* STEPS — horizontal numbered */}
      <section style={{ position: "relative", zIndex: 1, padding: "50px 40px", borderBottom: "1px solid #111" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, border: "1px solid #111" }}>
          {[
            { n: "01", t: "اختر فريقك", d: "أقوى الفرق والمنتخبات العالمية والمحلية." },
            { n: "02", t: "ضع بصمتك", d: "لون، مقاس، اسم، ورقم. كل شيء بيدك." },
            { n: "03", t: "استلم قميصك", d: "أكمل الطلب واستلم قميصك الفريد سريعاً." }
          ].map((item, i) => (
            <div key={item.n} style={{
              padding: "36px 28px",
              borderLeft: i < 2 ? "1px solid #111" : "none",
              position: "relative", overflow: "hidden"
            }}>
              <div style={{
                position: "absolute", inset: 0, opacity: 0,
                background: "#BAFF00", transition: "opacity 0.2s"
              }} />
              <div style={{ fontSize: 11, color: "#BAFF00", fontWeight: 700, letterSpacing: 3, marginBottom: 16 }}>{item.n} /</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10, letterSpacing: -0.5 }}>{item.t}</div>
              <div style={{ fontSize: 13, color: "#444", lineHeight: 1.7 }}>{item.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TEAMS */}
      <section style={{ position: "relative", zIndex: 1, padding: "50px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 28 }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, margin: 0, textTransform: "uppercase", letterSpacing: -2 }}>
            <span style={{ color: "#BAFF00" }}>الفرق</span> الشائعة
          </h2>
          <button style={{
            fontSize: 11, color: "#000", background: "#BAFF00", border: "none",
            padding: "8px 20px", cursor: "pointer", fontFamily: "inherit",
            fontWeight: 900, letterSpacing: 2, textTransform: "uppercase"
          }}>عرض الكل ←</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "#111" }}>
          {["الأرجنتين","إسبانيا","إنجلترا","الأردن"].map((name, i) => (
            <div key={name} style={{ background: "#000", padding: "28px 20px", textAlign: "center", cursor: "pointer", position: "relative" }}>
              <div style={{ position: "absolute", top: 10, right: 12, fontSize: 10, color: "#BAFF00", fontWeight: 900, letterSpacing: 2 }}>0{i+1}</div>
              <div style={{ fontSize: 52, marginBottom: 10 }}>👕</div>
              <div style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>{name}</div>
              <div style={{
                marginTop: 10, display: "inline-block",
                padding: "2px 0", borderBottom: "2px solid #BAFF00",
                fontSize: 12, fontWeight: 700, color: "#BAFF00"
              }}>35 د.أ</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
