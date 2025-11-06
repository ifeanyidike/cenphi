import { observer } from "mobx-react-lite";
import Navbar from "@/components/landing/Navbar";
import MarketingHero from "@/components/landing/segments/MarketingHero";
import ServicesShowcase from "@/components/landing/ServicesShowcase";
import Footer from "@/components/custom/footer";
import SEO from "@/components/SEO";

const MarketingLanding = observer(() => {
  return (
    <>
      <SEO
        title="Content Marketing Automation for Teams & Agencies | Cenphi"
        description="Turn one testimonial into 13+ marketing assets in 30 seconds. Save 15 hours/week on content creation. Perfect for marketing teams and agencies."
        keywords="marketing automation, content creation, testimonial marketing, social media automation, content repurposing, marketing agency tools"
        url="https://cenphi.io/for-marketing"
      />
      <div className="min-h-screen bg-white">
        <Navbar />
        <MarketingHero />
        <ServicesShowcase />
        <Footer />
      </div>
    </>
  );
});

export default MarketingLanding;
