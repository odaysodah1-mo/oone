import { db, teamsTable, jerseyColorsTable, nahfatPresetsTable, stickersTable, settingsTable, branchesTable } from "@workspace/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding Supabase database...");

  // ── Clear existing data ──
  await db.delete(stickersTable);
  await db.delete(nahfatPresetsTable);
  await db.delete(jerseyColorsTable);
  await db.delete(branchesTable);
  await db.delete(settingsTable);
  await db.delete(teamsTable);
  console.log("  ✓ cleared existing data");

  // ── Teams ──
  const teams = [
    { name: "برشلونة", nameEn: "Barcelona", league: "La Liga", country: "Spain", primaryColor: "#A50044", secondaryColor: "#004D98", availableColors: JSON.stringify(["#A50044", "#004D98", "#FFED02"]), availableSizes: JSON.stringify(["XS", "S", "M", "L", "XL", "XXL"]), basePrice: 89, isPopular: true },
    { name: "ريال مدريد", nameEn: "Real Madrid", league: "La Liga", country: "Spain", primaryColor: "#FEBE10", secondaryColor: "#000000", availableColors: JSON.stringify(["#FEBE10", "#000000"]), availableSizes: JSON.stringify(["XS", "S", "M", "L", "XL", "XXL"]), basePrice: 89, isPopular: true },
    { name: "الأرجنتين", nameEn: "Argentina", league: "International", country: "Argentina", primaryColor: "#75AADB", secondaryColor: "#FFFFFF", availableColors: JSON.stringify(["#75AADB", "#FFFFFF"]), availableSizes: JSON.stringify(["XS", "S", "M", "L", "XL", "XXL"]), basePrice: 99, isPopular: true },
    { name: "البرازيل", nameEn: "Brazil", league: "International", country: "Brazil", primaryColor: "#F7C221", secondaryColor: "#009739", availableColors: JSON.stringify(["#F7C221", "#009739", "#003F87"]), availableSizes: JSON.stringify(["XS", "S", "M", "L", "XL", "XXL"]), basePrice: 99, isPopular: true },
    { name: "ألمانيا", nameEn: "Germany", league: "International", country: "Germany", primaryColor: "#000000", secondaryColor: "#FFFFFF", availableColors: JSON.stringify(["#000000", "#FFFFFF"]), availableSizes: JSON.stringify(["XS", "S", "M", "L", "XL", "XXL"]), basePrice: 99, isPopular: false },
    { name: "فرنسا", nameEn: "France", league: "International", country: "France", primaryColor: "#002395", secondaryColor: "#FFFFFF", availableColors: JSON.stringify(["#002395", "#FFFFFF", "#ED2939"]), availableSizes: JSON.stringify(["XS", "S", "M", "L", "XL", "XXL"]), basePrice: 99, isPopular: true },
    { name: "الهلال", nameEn: "Al Hilal", league: "Saudi League", country: "Saudi Arabia", primaryColor: "#0031A5", secondaryColor: "#FFFFFF", availableColors: JSON.stringify(["#0031A5", "#FFFFFF"]), availableSizes: JSON.stringify(["XS", "S", "M", "L", "XL", "XXL"]), basePrice: 79, isPopular: false },
    { name: "النصر", nameEn: "Al Nassr", league: "Saudi League", country: "Saudi Arabia", primaryColor: "#FCD301", secondaryColor: "#0055A5", availableColors: JSON.stringify(["#FCD301", "#0055A5"]), availableSizes: JSON.stringify(["XS", "S", "M", "L", "XL", "XXL"]), basePrice: 79, isPopular: false },
  ];

  for (const t of teams) {
    await db.insert(teamsTable).values(t);
  }
  console.log(`  ✓ ${teams.length} teams`);

  // ── Jersey Colors ──
  const dbTeams = await db.select().from(teamsTable);
  const teamMap = Object.fromEntries(dbTeams.map(t => [t.nameEn, t.id]));

  const colors = [
    { teamId: teamMap["Barcelona"], name: "أحمر", hexCode: "#A50044", secondaryHexCode: "#004D98", isDefault: true, sortOrder: 0, frontImageUrl: "/jersey-file/faisali.png", backImageUrl: null },
    { teamId: teamMap["Real Madrid"], name: "ذهبي", hexCode: "#FEBE10", secondaryHexCode: "#000000", isDefault: true, sortOrder: 0, frontImageUrl: "/jersey-file/faisali.png", backImageUrl: null },
    { teamId: teamMap["Argentina"], name: "أزرق", hexCode: "#75AADB", secondaryHexCode: "#FFFFFF", isDefault: true, sortOrder: 0, frontImageUrl: "/jersey-file/jordan.png", backImageUrl: "/jersey-file/jordan-back.png" },
    { teamId: teamMap["Brazil"], name: "أصفر", hexCode: "#F7C221", secondaryHexCode: "#009739", isDefault: true, sortOrder: 0, frontImageUrl: "/jersey-file/jordan-real.png", backImageUrl: "/jersey-file/jordan-back.png" },
    { teamId: teamMap["France"], name: "أزرق", hexCode: "#002395", secondaryHexCode: "#FFFFFF", isDefault: true, sortOrder: 0, frontImageUrl: "/jersey-file/wehdat.png", backImageUrl: null },
  ];

  for (const c of colors) {
    await db.insert(jerseyColorsTable).values(c);
  }
  console.log(`  ✓ ${colors.length} jersey colors`);

  // ── Branch ──
  const pwHash = await bcrypt.hash("123456", 12);
  await db.insert(branchesTable).values({
    username: "branch1",
    passwordHash: pwHash,
    governorate: "عمان",
    commissionRate: 0.1,
    active: true,
  });
  console.log("  ✓ 1 branch (branch1 / 123456)");

  // ── Settings ──
  await db.insert(settingsTable).values({ key: "phrase_print_price", value: "15" });
  console.log("  ✓ settings");

  // ── Nahfat ──
  await db.insert(nahfatPresetsTable).values({
    text: "كلاسيك", category: "عربي", isActive: true, sortOrder: 0,
  });
  console.log("  ✓ nahfat");

  // ── Stickers ──
  await db.insert(stickersTable).values({
    name: "نجمة", url: "/stickers/star.svg", category: "عام", isActive: true, sortOrder: 0,
  });
  console.log("  ✓ stickers");

  console.log("\n✅ Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
