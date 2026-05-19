import http from "http";

const API = "http://localhost:3000/api/admin/marketplace";
const KEY = "JS+ZRS9IkT5sOR5giwugEo6MTzsiH9j05Aq7byYmbD4=";

async function api(method: string, path: string, body?: any) {
  return new Promise<any>((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const req = http.request(`${API}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": KEY,
        ...(data ? { "Content-Length": Buffer.byteLength(data).toString() } : {}),
      },
    }, (res) => {
      let body = "";
      res.on("data", c => body += c);
      res.on("end", () => resolve(JSON.parse(body || "{}")));
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // Create shops
  const shopData = [
    { name: "مطابع الأقصى", slug: "al-aqsa", description: "مطابع متخصصة في طباعة التيشيرتات والتصاميم الرياضية", contactPhone: "0791111111", commissionPercent: 10, isActive: true },
    { name: "استوديو كرييتف", slug: "creative", description: "تصاميم عصرية وجرافيك حديث", contactPhone: "0792222222", commissionPercent: 15, isActive: true },
    { name: "دار النقش", slug: "al-naqsh", description: "طباعة حرارية وتطريز احترافي", contactPhone: "0793333333", commissionPercent: 12, isActive: true },
  ];

  const shopIds = [];
  for (const s of shopData) {
    const res = await api("POST", "/shops", s);
    shopIds.push(res.id);
    console.log(`✅ Shop: ${res.name} (id=${res.id})`);
  }

  // Create designs
  const designs = [
    { shopId: shopIds[0], title: "تيشيرت أوفرسايز — لوجو مينيمال", price: 18, category: "مودرن", imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600", description: "تصميم مودرن بطباعة لوجو مينيمال", isActive: true },
    { shopId: shopIds[1], title: "تيشيرت جرافيك — طباعة سلك سكرين", price: 15, category: "رياضي", imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600", description: "تيشيرت جرافيك بطباعة سلك سكرين متينة", isActive: true },
    { shopId: shopIds[0], title: "هودي بقلنسوة — أوفرسايز", price: 28, category: "مودرن", imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600", isActive: true },
    { shopId: shopIds[2], title: "تيشيرت خط عربي — كاليغرافي", price: 22, category: "كلاسيك", imageUrl: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=600", isActive: true },
    { shopId: shopIds[1], title: "بومبر جاكيت — شتوي", price: 35, category: "مودرن", imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600", isActive: true },
    { shopId: shopIds[0], title: "تيشيرت رياضي — دراي فيت", price: 20, category: "رياضي", imageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600", isActive: true },
    { shopId: shopIds[2], title: "تيشيرت شورت — طقم صيفي", price: 25, category: "رياضي", imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600", isActive: true },
    { shopId: shopIds[1], title: "تيشيرت ون بيس — أنمي", price: 19, category: "مودرن", imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600", isActive: true },
    { shopId: shopIds[0], title: "كاب — تطريز", price: 12, category: "إكسسوارات", imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600", isActive: true },
    { shopId: shopIds[2], title: "تيشيرت زوم — طباعة ديجيتال", price: 17, category: "مودرن", imageUrl: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600", isActive: true },
    { shopId: shopIds[1], title: "شنطة قماش — توت باج", price: 14, category: "إكسسوارات", imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600", isActive: true },
  ];

  for (const d of designs) {
    const res = await api("POST", "/designs", d);
    console.log(`✅ Design: ${d.title} (id=${res.id})`);
  }

  console.log(`\n🎉 ${shopIds.length} shops + ${designs.length} designs seeded!`);
}

main().catch(console.error);
