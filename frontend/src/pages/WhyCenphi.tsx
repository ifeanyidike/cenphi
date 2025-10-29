import AboutOurStory from "@/components/custom/aboutuscomponent/AboutOurStory";
import AboutUsBanner from "@/components/custom/aboutuscomponent/AboutUsBanner";
import CustomerReaction from "@/components/custom/aboutuscomponent/whatoutclientsaid";
import SEO from "@/components/SEO";
import { pageSEO } from "@/config/seo";

const WhyCenphi = () => {
  return (
    <>
      <SEO
        title={pageSEO.whyCenphi.title}
        description={pageSEO.whyCenphi.description}
        keywords={pageSEO.whyCenphi.keywords}
        url={pageSEO.whyCenphi.url}
        structuredData={pageSEO.whyCenphi.structuredData}
      />
      <div>
        <AboutUsBanner />
        <AboutOurStory />
        <CustomerReaction />
      </div>
    </>
  );
};

export default WhyCenphi;
