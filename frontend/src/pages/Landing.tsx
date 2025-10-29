import { observer } from "mobx-react-lite";
import Navbar from "@/components/landing/Navbar";
import HomeLandingHero from "@/components/landing/HomeLandingHero";
import FutureShowcase from "@/components/landing/FutureShowcase";
import ServicesShowcase from "@/components/landing/ServicesShowcase";
import RevolutionizeCollection from "@/components/landing/RevolutionizeCollection";
import SimpleProof from "@/components/landing/SimpleProof";
import Footer from "@/components/custom/footer";
import SEO from "@/components/SEO";
import { pageSEO } from "@/config/seo";

const LandingPage = observer(() => {
  return (
    <>
      <SEO
        title={pageSEO.home.title}
        description={pageSEO.home.description}
        keywords={pageSEO.home.keywords}
        url={pageSEO.home.url}
        structuredData={pageSEO.home.structuredData}
      />
      <div className="min-h-screen bg-white">
        <Navbar />
        <HomeLandingHero />
        <FutureShowcase />
        <ServicesShowcase />
        <RevolutionizeCollection />
        <SimpleProof />
        <Footer />
      </div>
    </>
  );
});

export default LandingPage;
