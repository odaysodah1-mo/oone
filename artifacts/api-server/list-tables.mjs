import { db } from '@workspace/db';
import { sql } from 'drizzle-orm';
async function main() {
  try {
    const r = await db.execute(sql.raw("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"));
    console.log(JSON.stringify(r.rows.map(x => x.table_name)));
  } catch(e) {
    console.error('err:', e?.message);
  }
}
main();
