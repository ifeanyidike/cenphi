import HeroSection from "@/components/custom/herosection";
import Navbar from "@/components/custom/nav-bar-simple";
import TransformationCard from "@/components/custom/transformationcard";
import TestimonialShowcase from "@/components/custom/testimonialshowcase";
import TestimonialsSection from "@/components/custom/testimonialsection";
import HowItWorks from "@/components/custom/howitworksection";



const LandingPage = () => {
  return (
    <>
      <Navbar />
      <HeroSection />
      <TransformationCard />
      <TestimonialShowcase />
      <TestimonialsSection />
      <HowItWorks />
      <h1>My name is Edward. I am a forex trader and developer</h1>
    </>
  );
};

export default LandingPage;