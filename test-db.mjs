import pg from 'pg';
const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:oDay%400788712344@db.garubydkynlycfwkllvn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
try {
  const r = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log(JSON.stringify(r.rows.map(x => x.table_name)));
} catch(e) {
  console.error('ERROR:', e.message);
}
await pool.end();
