const { Pool } = require("pg");

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Shops
  const shops = [
    { name: "مطابع الأقصى", slug: "al-aqsa", desc: "مطابع متخصصة في طباعة التيشيرتات والتصاميم الرياضية", phone: "0791111111", commission: 10 },
    { name: "استوديو كرييتف", slug: "creative", desc: "تصاميم عصرية وجرافيك حديث", phone: "0792222222", commission: 15 },
    { name: "دار النقش", slug: "al-naqsh", desc: "طباعة حرارية وتطريز احترافي", phone: "0793333333", commission: 12 },
  ];

  const shopIds = [];

  for (const s of shops) {
    const { rows } = await pool.query(
      `INSERT INTO shops (name, slug, description, contact_phone, commission_percent, is_active)
       VALUES ($1,$2,$3,$4,$5,true) ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
      [s.name, s.slug, s.desc, s.phone, s.commission],
    );
    shopIds.push(rows[0].id);
  }

  console.log(`✅ ${shopIds.length} shops ready`);

  // Designs
  const designs = [
    { title: "تيشيرت أوفرسايز — لوجو مينيمال", price: 18, cat: "مودرن", img: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600", shop: 0 },
    { title: "تيشيرت جرافيك — طباعة سلك سكرين", price: 15, cat: "رياضي", img: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600", shop: 1 },
    { title: "هودي بقلنسوة — أوفرسايز", price: 28, cat: "مودرن", img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600", shop: 0 },
    { title: "تيشيرت خط عربي — كاليغرافي", price: 22, cat: "كلاسيك", img: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=600", shop: 2 },
    { title: "بومبر جاكيت — شتوي", price: 35, cat: "مودرن", img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600", shop: 1 },
    { title: "تيشيرت رياضي — دراي فيت", price: 20, cat: "رياضي", img: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600", shop: 0 },
    { title: "تيشيرت شورت — طقم صيفي", price: 25, cat: "رياضي", img: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600", shop: 2 },
    { title: "تيشيرت ون بيس — أنمي", price: 19, cat: "مودرن", img: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600", shop: 1 },
    { title: "كاب — تطريز", price: 12, cat: "إكسسوارات", img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600", shop: 0 },
    { title: "تيشيرت زوم — طباعة ديجيتال", price: 17, cat: "مودرن", img: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600", shop: 2 },
    { title: "شنطة قماش — توت باج", price: 14, cat: "إكسسوارات", img: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600", shop: 1 },
  ];

  let count = 0;
  for (const d of designs) {
    const sid = shopIds[d.shop % shopIds.length];
    await pool.query(
      `INSERT INTO marketplace_designs (shop_id, title, description, image_url, price, category, tags, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true) ON CONFLICT DO NOTHING`,
      [sid, d.title, `تصميم ${d.title} — جودة عالية وخامة ممتازة`, d.img, d.price, d.cat, d.cat],
    );
    count++;
  }

  console.log(`✅ ${count} designs seeded`);
  await pool.end();
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
