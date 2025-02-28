import Navbar from "@/components/custom/nav-bar-simple";
import TransformationCard from "@/components/custom/transformationcard";
import MyHeroSection from "@/components/custom/herosection2";
import ProductTestimonial from "@/components/custom/producttextimonialsection";
import FeaturedCarousel1 from "@/components/custom/featuredcarousel";
import Widget from "@/components/custom/widgetcomponent";
import TestimonialSection2 from "@/components/custom/testimonialsection2";
import IntegrationSection from "@/components/custom/integrationsection";
import TestimonialSharingSection3 from "@/components/custom/testimonialsection3";
import ReviewSection from "@/components/custom/reviewsection";
import Footer from "@/components/custom/footer";

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
      <TestimonialSharingSection3 />
      <ReviewSection />
      <Footer />
      {/* <HeroSection />
      {/* <TestimonialShowcase />
      <TestimonialsSection />
      <HowItWorks /> */}
    </>
  );
};

export default LandingPage;
