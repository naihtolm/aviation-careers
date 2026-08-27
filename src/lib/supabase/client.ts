// lib/supabase/client.ts
//
// Browser-side Supabase client. Use in Client Components only.
// Respects RLS as the currently signed-in user — never has elevated access.

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
