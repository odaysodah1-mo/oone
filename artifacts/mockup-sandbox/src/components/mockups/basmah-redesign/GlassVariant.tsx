export function GlassVariant() {
  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", background: "#060912", minHeight: "100vh", color: "#fff", overflow: "hidden" }}>

      {/* BG blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, right: -100, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(186,255,0,0.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,150,255,0.1) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "40%", left: "40%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(186,255,0,0.05) 0%, transparent 70%)" }} />
      </div>

      {/* NAV */}
      <nav style={{
        position: "relative", zIndex: 10, padding: "18px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(6,9,18,0.8)", backdropFilter: "blur(20px)"
      }}>
        <div style={{ display: "flex", gap: 28 }}>
          {["الفرق","الطلبات","تتبع طلبي","إحصائيات"].map(l => (
            <span key={l} style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>{l}</span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#BAFF00", boxShadow: "0 0 10px #BAFF00" }} />
          <span style={{ fontSize: 20, fontWeight: 900, background: "linear-gradient(135deg, #BAFF00 0%, #00FFB2 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2 }}>بصمة</span>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", zIndex: 1, padding: "100px 40px 80px", textAlign: "center" }}>

        {/* pill badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28,
          padding: "8px 20px", borderRadius: 999,
          border: "1px solid rgba(186,255,0,0.25)",
          background: "rgba(186,255,0,0.06)", backdropFilter: "blur(10px)"
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#BAFF00", boxShadow: "0 0 6px #BAFF00" }} />
          <span style={{ fontSize: 12, color: "rgba(186,255,0,0.8)", letterSpacing: 1.5, textTransform: "uppercase" }}>تصميم قمصان الأردن</span>
        </div>

        <h1 style={{ fontSize: 90, fontWeight: 900, lineHeight: 0.95, margin: "0 0 24px", letterSpacing: -4 }}>
          اترك{" "}
          <span style={{ background: "linear-gradient(135deg, #BAFF00 0%, #00E5FF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            بصمتك
          </span>
        </h1>

        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.8, fontWeight: 400 }}>
          صمم قميص فريقك المفضل باسمك ورقمك. ارتدي هويتك في الملعب.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center" }}>
          <button style={{
            padding: "16px 44px", borderRadius: 8, cursor: "pointer", border: "none",
            background: "linear-gradient(135deg, #BAFF00 0%, #00E5A0 100%)",
            color: "#000", fontWeight: 800, fontSize: 15, fontFamily: "inherit",
            boxShadow: "0 0 30px rgba(186,255,0,0.3)"
          }}>
            ابدأ التصميم الآن ←
          </button>
          <button style={{
            padding: "16px 28px", borderRadius: 8, cursor: "pointer",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)", backdropFilter: "blur(10px)",
            color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 14, fontFamily: "inherit"
          }}>
            استعرض الفرق
          </button>
        </div>

        {/* stats row */}
        <div style={{ display: "flex", gap: 40, justifyContent: "center", marginTop: 60 }}>
          {[["١٠٠+","فريق وكلوب"],["٢٤","لون متاح"],["تسليم سريع","أردن-واسع"]].map(([n,l]) => (
            <div key={n} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#BAFF00" }}>{n}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* GLASS CARDS — STEPS */}
      <section style={{ position: "relative", zIndex: 1, padding: "20px 40px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[
            { n: "01", t: "اختر فريقك", d: "اختر من بين أقوى الفرق والمنتخبات.", icon: "🏆" },
            { n: "02", t: "ضع بصمتك", d: "اختر اللون، المقاس، واطبع اسمك ورقمك.", icon: "✏️" },
            { n: "03", t: "استلم قميصك", d: "أكمل الطلب واستلم قميصك الفريد.", icon: "📦" }
          ].map(item => (
            <div key={item.n} style={{
              padding: "28px 24px", borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)",
              position: "relative", overflow: "hidden"
            }}>
              <div style={{
                position: "absolute", top: 0, right: 0, width: 80, height: 80,
                background: "radial-gradient(circle, rgba(186,255,0,0.12) 0%, transparent 70%)"
              }} />
              <div style={{ fontSize: 28, marginBottom: 16 }}>{item.icon}</div>
              <div style={{ fontSize: 11, color: "rgba(186,255,0,0.7)", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>{item.n}</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{item.t}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{item.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TEAMS */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 40px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>الفرق <span style={{ color: "#BAFF00" }}>الشائعة</span></h2>
          <span style={{ fontSize: 12, color: "rgba(186,255,0,0.7)", cursor: "pointer", letterSpacing: 1 }}>عرض الكل ←</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {["الأرجنتين","إسبانيا","إنجلترا","الأردن"].map(name => (
            <div key={name} style={{
              padding: "20px 16px", borderRadius: 12, textAlign: "center", cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.025)", backdropFilter: "blur(10px)",
              transition: "border-color 0.2s"
            }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>👕</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
              <div style={{
                display: "inline-block", marginTop: 8, padding: "3px 10px", borderRadius: 999,
                background: "rgba(186,255,0,0.1)", color: "#BAFF00", fontSize: 11, fontWeight: 700
              }}>35 د.أ</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
