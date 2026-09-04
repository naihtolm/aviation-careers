// proxy.ts
//
// Two jobs on every request:
//
// 1. Refreshes the Supabase auth session cookie. Without this, a
//    signed-in user's session can go stale in Server Components (which
//    can only read cookies, never write them) — this is the officially
//    recommended pattern for @supabase/ssr + Next.js App Router.
//
// 2. Enforces the account wall at the route level. The homepage gate
//    (AuthGateContext/GatedHome/HeaderNav) only intercepts *navigation*
//    into the job-search product — without this, a signed-out visitor
//    who typed /jobs directly into the URL bar still reached the real
//    page, because nothing server-side ever checked.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// The actual job-search product -- gated. Everything else (the homepage
// itself, /resources guide content, /employers marketing + signup,
// /sign-in, /sign-up, /auth/*, /onboarding, /admin, static assets, API
// routes) stays reachable directly; see GatedHome.tsx and HeaderNav.tsx
// for the same boundary drawn at the navigation-UI level.
const GATED_PREFIXES = ["/jobs", "/careers", "/salaries", "/airports", "/companies", "/sectors"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isGated = GATED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

  if (isGated && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    // Read by AutoOpenGate.tsx to open the sign-up modal on arrival, so
    // landing here still reads as "you hit a gate," not a silent
    // redirect to a page that looks like nothing happened.
    url.searchParams.set("gate", "1");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)"],
};
