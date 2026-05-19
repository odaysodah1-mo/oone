import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://garubydkynlycfwkllvn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhcnVieWRreW5seWNmd2tsbHZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2MjEzMCwiZXhwIjoyMDkzNzM4MTMwfQ.C2B8aXk_z6SVKkpDUcax0UxEwEA1S4QktmtEowQaYtc';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  // Try full select with limit
  const { data, error } = await supabase.from('teams').select('*').limit(1);
  console.log('select limit 1:', data ? 'ok ' + JSON.stringify(data).slice(0,80) : 'null', 'error:', error?.message);

  // Try count again
  const { count, error: ce } = await supabase.from('teams').select('*', { count: 'exact', head: true });
  console.log('count:', count, 'error:', ce?.message);

  // Try marketplace designs
  const { data: d, error: de } = await supabase.from('marketplace_designs').select('*').limit(1);
  console.log('designs:', d ? 'ok' : 'null', 'error:', de?.message);

  // Count marketplace designs
  const { count: dc, error: dce } = await supabase.from('marketplace_designs').select('*', { count: 'exact', head: true });
  console.log('designs count:', dc, 'error:', dce?.message);

  // Try shops
  const { data: s, error: se } = await supabase.from('shops').select('*').limit(1);
  console.log('shops:', s ? 'ok' : 'null', 'error:', se?.message);
}

main();
