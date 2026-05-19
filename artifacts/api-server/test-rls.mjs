import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://garubydkynlycfwkllvn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhcnVieWRreW5seWNmd2tsbHZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2MjEzMCwiZXhwIjoyMDkzNzM4MTMwfQ.C2B8aXk_z6SVKkpDUcax0UxEwEA1S4QktmtEowQaYtc';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  // Try to select from a system table
  const { data, error } = await supabase.rpc('rls_auto_enable');
  console.log('rpc result:', data, 'error:', error?.message);
  
  // Try to query with select=count
  const { count, error: ce } = await supabase.from('teams').select('*', { count: 'exact', head: true });
  console.log('count:', count, 'error:', ce?.message);
}

main();
