export function StreetVariant() {
  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", background: "#050505", minHeight: "100vh", color: "#fff", overflow: "hidden" }}>
      {/* NAV */}
      <nav style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", gap: 32 }}>
          {["الفرق","الطلبات","تتبع طلبي","إحصائيات"].map(l => (
            <span key={l} style={{ fontSize: 13, fontWeight: 600, color: "#888", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>{l}</span>
          ))}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#BAFF00", letterSpacing: 3, textTransform: "uppercase" }}>بصمة</div>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", padding: "80px 40px 100px", overflow: "hidden" }}>
        {/* noise texture overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px"
        }} />

        {/* diagonal accent line */}
        <div style={{
          position: "absolute", top: 0, left: "55%", width: 2, height: "100%",
          background: "#BAFF00", transform: "skewX(-15deg)", opacity: 0.15
        }} />
        <div style={{
          position: "absolute", top: 0, left: "57%", width: 1, height: "100%",
          background: "#BAFF00", transform: "skewX(-15deg)", opacity: 0.06
        }} />

        {/* big background text */}
        <div style={{
          position: "absolute", bottom: -20, right: -10, fontSize: 200, fontWeight: 900,
          color: "#BAFF00", opacity: 0.03, lineHeight: 1, userSelect: "none",
          letterSpacing: -10
        }}>BASMAH</div>

        <div style={{ position: "relative", maxWidth: 700 }}>
          {/* tag */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24, padding: "6px 14px", border: "1px solid #2a2a2a", background: "#111" }}>
            <div style={{ width: 6, height: 6, background: "#BAFF00", borderRadius: "50%" }} />
            <span style={{ fontSize: 11, color: "#888", letterSpacing: 2, textTransform: "uppercase" }}>Custom Jersey — Jordan</span>
          </div>

          <h1 style={{ fontSize: 88, fontWeight: 900, lineHeight: 0.95, margin: 0, textTransform: "uppercase", letterSpacing: -4 }}>
            اترك<br />
            <span style={{ color: "#BAFF00", WebkitTextStroke: "0px", position: "relative" }}>
              بصمتك
              <span style={{
                position: "absolute", bottom: 4, left: 0, right: 0, height: 6,
                background: "#BAFF00", opacity: 0.3
              }} />
            </span>
          </h1>

          <p style={{ marginTop: 28, fontSize: 16, color: "#F5F0E8", opacity: 0.6, maxWidth: 480, lineHeight: 1.7, fontWeight: 400 }}>
            صمم قميص فريقك المفضل باسمك ورقمك.<br />ارتدي هويتك في الملعب.
          </p>

          <div style={{ marginTop: 40, display: "flex", gap: 12, alignItems: "center" }}>
            <button style={{
              padding: "16px 40px", background: "#BAFF00", color: "#000",
              fontWeight: 900, fontSize: 15, border: "none", cursor: "pointer",
              letterSpacing: 1, textTransform: "uppercase", fontFamily: "inherit",
              clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))"
            }}>
              ابدأ التصميم ←
            </button>
            <span style={{ fontSize: 13, color: "#555", letterSpacing: 1 }}>/ مجانًا بدون تسجيل</span>
          </div>
        </div>

        {/* jersey silhouette */}
        <div style={{ position: "absolute", left: 80, top: "50%", transform: "translateY(-50%)", opacity: 0.08, fontSize: 280, lineHeight: 1 }}>
          👕
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "60px 40px", background: "#0A0A0A", borderTop: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
          <h2 style={{ fontSize: 13, color: "#555", letterSpacing: 3, textTransform: "uppercase", fontWeight: 700, margin: 0 }}>كيف تعمل بصمة؟</h2>
          <div style={{ width: 40, height: 1, background: "#BAFF00", marginTop: 8 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "#1a1a1a" }}>
          {[
            { n: "01", t: "اختر فريقك", d: "اختر من بين أقوى الفرق والمنتخبات." },
            { n: "02", t: "ضع بصمتك", d: "اختر اللون، المقاس، اطبع اسمك ورقمك." },
            { n: "03", t: "استلم قميصك", d: "أكمل الطلب واستلم قميصك في أسرع وقت." }
          ].map(item => (
            <div key={item.n} style={{ background: "#050505", padding: "32px 28px", position: "relative", overflow: "hidden" }}>
              <div style={{ fontSize: 64, fontWeight: 900, color: "#BAFF00", opacity: 0.08, position: "absolute", top: -10, right: 16, lineHeight: 1 }}>{item.n}</div>
              <div style={{ fontSize: 12, color: "#BAFF00", fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>{item.n} /</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{item.t}</div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>{item.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TEAMS STRIP */}
      <section style={{ padding: "60px 40px", borderTop: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 900, margin: 0, textTransform: "uppercase", letterSpacing: -1 }}>الفرق <span style={{ color: "#BAFF00" }}>الأكثر شعبية</span></h2>
          </div>
          <button style={{ fontSize: 12, color: "#BAFF00", background: "transparent", border: "1px solid #BAFF00", padding: "8px 20px", cursor: "pointer", fontFamily: "inherit", letterSpacing: 1 }}>
            عرض الكل →
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, background: "#1a1a1a" }}>
          {["الأرجنتين", "إسبانيا", "إنجلترا", "الأردن"].map((name, i) => (
            <div key={name} style={{
              background: "#0a0a0a", padding: "28px 20px", textAlign: "center", cursor: "pointer",
              transition: "background 0.2s", position: "relative", overflow: "hidden"
            }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>👕</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{name}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 4, letterSpacing: 1 }}>35 د.أ</div>
              <div style={{ position: "absolute", top: 8, left: 8, fontSize: 10, color: "#333", fontWeight: 700, letterSpacing: 1 }}>0{i + 1}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
