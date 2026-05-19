import { db, teamsTable } from '@workspace/db';
try {
  const r = await db.select().from(teamsTable).limit(1);
  console.log('success:', JSON.stringify(r));
} catch(e) {
  console.error('error:', e?.message || e);
}
