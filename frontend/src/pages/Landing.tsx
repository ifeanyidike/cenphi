import AIFeaturesShowcase from "@/components/custom/landing/AIShowcase";
import UserTestimonial from "@/components/custom/landing/hero/UserTestimonial";
import TestimonialHero from "@/components/custom/landing/hero/TestimonialHero";
import HowItWorksSection from "@/components/custom/landing/HowItWorksSection";
import Navbar from "@/components/custom/nav";
import CollectionSection from "@/components/custom/landing/CollectionSection";
import FeatureSection from "@/components/custom/landing/topfeatures";
import Footer from "@/components/custom/footer";

const LandingPage = () => {
  return (
    <>
      <Navbar alwaysDarkText={false} />
      <TestimonialHero />
      <HowItWorksSection />

      <UserTestimonial />
      <FeatureSection />
      <AIFeaturesShowcase />
      <CollectionSection />
      <Footer />
    </>
  );
};

export default LandingPage;
