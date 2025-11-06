import { observer } from "mobx-react-lite";
import Navbar from "@/components/landing/Navbar";
import SalesHero from "@/components/landing/segments/SalesHero";
import ServicesShowcase from "@/components/landing/ServicesShowcase";
import Footer from "@/components/custom/footer";
import SEO from "@/components/SEO";

const SalesLanding = observer(() => {
  return (
    <>
      <SEO
        title="Close Deals Faster with Social Proof | Cenphi for Sales Teams"
        description="73% higher close rates with the right testimonials. Find perfect case studies in seconds, prove ROI instantly, and accelerate deal velocity."
        keywords="sales enablement, case studies, social proof for sales, deal velocity, sales tools, B2B sales"
        url="https://cenphi.io/for-sales"
      />
      <div className="min-h-screen bg-white">
        <Navbar />
        <SalesHero />
        <ServicesShowcase />
        <Footer />
      </div>
    </>
  );
});

export default SalesLanding;
