import AIFeaturesShowcase from "@/components/landing/AIShowcase";
import UserTestimonial from "@/components/landing/hero/UserTestimonial";
import TestimonialHero from "@/components/landing/hero/TestimonialHero";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import Navbar from "@/components/nav";
import CollectionSection from "@/components/landing/CollectionSection";
import FeatureSection from "@/components/landing/topfeatures";
import Footer from "@/components/custom/footer";
import { observer } from "mobx-react-lite";

const LandingPage = observer(() => {
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
});

export default LandingPage;
