import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://garubydkynlycfwkllvn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhcnVieWRreW5seWNmd2tsbHZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2MjEzMCwiZXhwIjoyMDkzNzM4MTMwfQ.C2B8aXk_z6SVKkpDUcax0UxEwEA1S4QktmtEowQaYtc';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  // Test full select from ALL critical tables
  const tables = ['teams', 'marketplace_designs', 'shops', 'orders', 'branches', 'stickers', 'settings', 'jersey_colors', 'jersey_color_images', 'nahfat_presets', 'visitors', 'marketplace_orders'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`${table}: ❌ ${error.message}`);
      } else {
        console.log(`${table}: ✅ ${data.length} rows`);
      }
    } catch(e) {
      console.log(`${table}: 💥 ${e.message}`);
    }
  }
}

main();
