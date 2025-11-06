import { observer } from "mobx-react-lite";
import Navbar from "@/components/landing/Navbar";
import ProductHero from "@/components/landing/segments/ProductHero";
import ServicesShowcase from "@/components/landing/ServicesShowcase";
import Footer from "@/components/custom/footer";
import SEO from "@/components/SEO";

const ProductLanding = observer(() => {
  return (
    <>
      <SEO
        title="Conversion Optimization with Testimonials | Cenphi for Product Teams"
        description="+47% conversion rates with data-driven testimonial placement. Perfect for SaaS and product teams focused on growth."
        keywords="conversion optimization, product-led growth, SaaS growth, user activation, testimonial optimization, conversion rate optimization"
        url="https://cenphi.io/for-product"
      />
      <div className="min-h-screen bg-white">
        <Navbar />
        <ProductHero />
        <ServicesShowcase />
        <Footer />
      </div>
    </>
  );
});

export default ProductLanding;
