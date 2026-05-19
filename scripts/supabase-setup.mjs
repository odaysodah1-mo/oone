const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "jerseys";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const api = `${SUPABASE_URL}/storage/v1`;

async function main() {
  // List buckets
  const list = await fetch(`${api}/bucket`, {
    headers: { Authorization: `Bearer ${SERVICE_KEY}` },
  });
  const buckets = await list.json();
  if (buckets?.some?.((b) => b.name === BUCKET)) {
    console.log(`Bucket "${BUCKET}" already exists`);
    return;
  }
  // Create bucket
  const res = await fetch(`${api}/bucket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: BUCKET,
      public: true,
      file_size_limit: 5 * 1024 * 1024,
    }),
  });
  const data = await res.json();
  if (res.ok) {
    console.log(`Bucket "${BUCKET}" created successfully`);
  } else {
    console.error("Failed to create bucket:", data);
    process.exit(1);
  }
}

main().catch(console.error);
