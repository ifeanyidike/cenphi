import HeroSection from "@/components/custom/herosection";
import Navbar from "@/components/custom/nav-bar-simple";
import TransformationCard from "@/components/custom/transformationcard";
import TestimonialShowcase from "@/components/custom/testimonialshowcase";
import TestimonialsSection from "@/components/custom/testimonialsection";
import HowItWorks from "@/components/custom/howitworksection";
import MyHeroSection from "@/components/custom/herosection2";
import ProductTestimonial from "@/components/custom/producttextimonialsection";
import FeaturedCarousel1 from "@/components/custom/featuredcarousel";
import Widget from "@/components/custom/widgetcomponent";
import TestimonialSection2 from "@/components/custom/testimonialsection2";
import IntegrationSection from "@/components/custom/integrationsection";



const LandingPage = () => {
  return (
    <>
      <Navbar />
      <MyHeroSection />
      <TransformationCard />
      <ProductTestimonial />
      <FeaturedCarousel1 />
      <Widget />  
      <TestimonialSection2 />
      <IntegrationSection />
      {/* <TestimonialShowcase />
      <TestimonialsSection />
      <HowItWorks /> */}
      <h1>My name is Edward. I am a forex trader and developer</h1>
    </>
  );
};

export default LandingPage;