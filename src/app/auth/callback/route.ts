// app/auth/callback/route.ts
//
// Exchanges a Supabase auth code (password recovery links, and OAuth
// providers like Google once that's wired up) for a real session, then
// redirects to `next`. Shared by every flow that needs this exchange
// rather than duplicating it per flow.

import { NextResponse } from "next/server";
import { createServerActionClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerActionClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in`);
}
