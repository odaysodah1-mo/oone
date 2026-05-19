import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://garubydkynlycfwkllvn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhcnVieWRreW5seWNmd2tsbHZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2MjEzMCwiZXhwIjoyMDkzNzM4MTMwfQ.C2B8aXk_z6SVKkpDUcax0UxEwEA1S4QktmtEowQaYtc'
);
const { data } = await supabase.from('teams').select('*').limit(1).single();
console.log(JSON.stringify(Object.keys(data)));
console.log(JSON.stringify(data));
