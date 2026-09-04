import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { AuthGateProvider } from "@/components/auth/AuthGateContext";
import { getHomepageStats } from "@/features/jobs/queries";
import { getCurrentUser } from "@/features/profile/queries";

export const metadata: Metadata = {
  title: "Aviation Careers",
  description: "Find your next job in aviation.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetched once here (not per-modal-open) so the sign-up modal's stat row
  // is real data without every trigger point needing its own query.
  // getCurrentUser() is called again here alongside Header's own call --
  // MobileNav needs the same isSignedIn flag and there's no clean way to
  // share one server-side fetch across two sibling components under the
  // App Router without a context provider of its own, which is more
  // machinery than one cheap auth check warrants.
  const [stats, user] = await Promise.all([getHomepageStats(), getCurrentUser()]);

  return (
    <html lang="en">
      <body className="text-slate-900 antialiased">
        <AuthGateProvider stats={{ jobCount: stats.jobCount, companyCount: stats.companyCount }}>
          <Header />
          <main>{children}</main>
          <Footer />
          <MobileNav isSignedIn={!!user} />
        </AuthGateProvider>
      </body>
    </html>
  );
}
