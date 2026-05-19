import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://garubydkynlycfwkllvn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhcnVieWRreW5seWNmd2tsbHZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2MjEzMCwiZXhwIjoyMDkzNzM4MTMwfQ.C2B8aXk_z6SVKkpDUcax0UxEwEA1S4QktmtEowQaYtc';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  // Try to query teams table
  const { data, error } = await supabase.from('teams').select('*').limit(1);
  console.log('teams query result:', JSON.stringify(data), 'error:', error?.message);

  // Try marketplace designs
  const { data: d, error: de } = await supabase.from('marketplace_designs').select('*').limit(1);
  console.log('designs query result:', JSON.stringify(d), 'error:', de?.message);
}

main();
