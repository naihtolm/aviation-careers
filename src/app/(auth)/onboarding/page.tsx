import { getCareerCategories } from "@/features/careers/queries";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const categories = await getCareerCategories();
  return <OnboardingWizard categories={categories} />;
}
