import { getFeaturedJobs, getHomepageStats } from "@/features/jobs/queries";
import { getCareerCategories } from "@/features/careers/queries";
import { getFeaturedCompanies } from "@/features/companies/queries";
import { getAirports } from "@/features/airports/queries";
import { getSectorStats } from "@/features/sectors/queries";
import { getCurrentUser } from "@/features/profile/queries";
import { SignedInHome } from "@/components/home/SignedInHome";
import { GatedHome } from "@/components/home/GatedHome";

export default async function HomePage() {
  const user = await getCurrentUser();

  // Signed-out visitors get the teaser homepage, which only ever needs
  // featured jobs + the stat counts -- categories/sectors/airports/
  // companies are all real navigation into the full product, so there's
  // no reason to fetch them for a page that's about to gate all of that
  // anyway.
  if (!user) {
    const [featuredJobs, stats] = await Promise.all([getFeaturedJobs(6), getHomepageStats()]);
    return <GatedHome featuredJobs={featuredJobs} stats={stats} />;
  }

  const [featuredJobs, categories, companies, airports, stats, sectors] = await Promise.all([
    getFeaturedJobs(6),
    getCareerCategories(),
    getFeaturedCompanies(6),
    getAirports(),
    getHomepageStats(),
    getSectorStats(),
  ]);

  return (
    <SignedInHome
      featuredJobs={featuredJobs}
      categories={categories}
      companies={companies}
      airports={airports}
      stats={stats}
      sectors={sectors}
    />
  );
}
