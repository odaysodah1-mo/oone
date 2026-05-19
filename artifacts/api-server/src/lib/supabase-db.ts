import { createClient } from "@supabase/supabase-js";

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env: ${key}`);
  return val;
}

const supabaseUrl = getEnv("SUPABASE_URL");
const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

export const supabase = createClient(supabaseUrl, serviceRoleKey);

export function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

export function toCamelCaseArr(rows: any[]): any[] {
  return rows.map((r) => toCamelCase(r));
}

export function toCamelCaseSingle(row: any): any {
  if (!row) return null;
  return toCamelCase(row);
}
