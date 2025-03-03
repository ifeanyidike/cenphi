import PremiumHero from "@/components/custom/collection/Hero/Premiumhero";
import TestimonialHero from "@/components/custom/collection/Hero/TestimonialHero";
import Navbar from "@/components/custom/nav";

const TestimonialHeroPage = () => {
  return (
    <>
      <Navbar alwaysDarkText={false} />
      <TestimonialHero />
      <PremiumHero />
    </>
  );
};

export default TestimonialHeroPage;
