import { supabase } from './src/lib/supabase-db.ts';
const { data, error } = await supabase.from('marketplace_designs').select('*, shops!inner(*)').limit(1).maybeSingle();
console.log('data:', JSON.stringify(data));
console.log('error:', error?.message);
