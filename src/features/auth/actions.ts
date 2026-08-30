"use server";

import { redirect } from "next/navigation";
import { createServerActionClient } from "@/lib/supabase/server";
import { getEmployerContext } from "@/features/employers/queries";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createServerActionClient();

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  // handle_new_user() (migration 009) creates the profiles + job_seeker
  // role row automatically on the auth trigger — nothing else to do here.
  redirect("/onboarding");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createServerActionClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const employerContext = await getEmployerContext(user!.id);
  if (employerContext) redirect("/employer/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user!.id)
    .maybeSingle();

  redirect(profile?.onboarding_completed ? "/dashboard" : "/onboarding");
}

export async function signOut() {
  const supabase = await createServerActionClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const supabase = await createServerActionClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password/confirm`,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function updatePassword(newPassword: string) {
  const supabase = await createServerActionClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { error: null };
}
