import { pool as refPool } from '@workspace/db';
import pg from 'pg';
import dns from 'dns';

const pw = 'oDay%400788712344';
const ref = 'garubydkynlycfwkllvn';

const regions = [
  'eu-west-1','eu-west-2','eu-west-3',
  'eu-central-1','eu-central-2',
  'eu-north-1','eu-south-1','eu-south-2',
  'us-east-1','us-east-2',
  'us-west-1','us-west-2',
  'ap-southeast-1','ap-southeast-2','ap-southeast-3','ap-southeast-4',
  'ap-northeast-1','ap-northeast-2','ap-northeast-3',
  'ap-south-1','ap-south-2',
  'ca-central-1',
  'sa-east-1',
  'me-central-1','me-south-1',
  'af-south-1'
];

async function testRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const pool = new pg.Pool({
    connectionString: `postgresql://postgres.${ref}:${pw}@${host}:6543/postgres?pgbouncer=true`,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });
  try {
    const c = await pool.connect();
    const r = await c.query('SELECT 1 as test');
    c.release();
    await pool.end();
    return { region, status: 'connected' };
  } catch(e) {
    await pool.end();
    const msg = e?.message || '';
    if (msg.includes('Tenant') || msg.includes('tenant')) return { region, status: 'tenant_not_found' };
    if (e.code === 'ENOTFOUND' || e.code === 'ENETUNREACH') return null; // skip
    if (e.code === 'ETIMEOUT') return { region, status: 'timeout' };
    return { region, status: 'error', msg: msg.slice(0,60) };
  }
}

async function main() {
  const results = [];
  for (const region of regions) {
    const r = await testRegion(region);
    if (r) results.push(r);
    process.stdout.write(r ? `${r.region}=${r.status} ` : '');
  }
  console.log('\n---');
  for (const r of results) {
    console.log(`${r.region}: ${r.status}${r.msg ? ' - ' + r.msg : ''}`);
  }
}
main();
