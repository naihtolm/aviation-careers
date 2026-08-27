// lib/supabase/server.ts
//
// Server Component / Server Action / Route Handler client. Reads the
// user's session from cookies and respects RLS as that user — this is
// the client every "createServerActionClient()" reference in the
// ingestion + admin screen code (app/admin/jobs/review/*) resolves to.
//
// Never use this for privileged writes that should bypass RLS — use
// lib/supabase/service.ts for that, and only from trusted server code
// that has already independently verified the caller's role.
//
// Async because Next's cookies() is async in current versions, and
// getAll/setAll is the current @supabase/ssr cookie interface (the
// original draft used the older sync get/set/remove API, which no
// longer exists in current package versions).

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createServerActionClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render, where cookies can't
            // be mutated — safe to ignore since middleware (once added)
            // is what keeps the session refreshed in that case.
          }
        },
      },
    }
  );
}
