// import PricingSection from "@/components/custom/pricingfreesection";
// import PricingPreiumSection from "@/components/custom/presingsectionpremium";
// import FAQSection from "@/components/custom/faq";
// import TestimonialSection4 from "@/components/custom/testimonialsection4";
// import ReviewSection from "@/components/custom/reviewsection";
// import Footer from "@/components/custom/footer";
// import PricingComponent from "@/components/pricing";

// const Pricing = () => {
//   return (
//     <>
//       <PricingComponent />
//       <PricingSection />
//       <PricingPreiumSection />
//       <FAQSection />
//       <TestimonialSection4 />
//       <ReviewSection />
//       <Footer />
//     </>
//   );
// };

// export default Pricing;

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Decoration from "@/components/pricing/Decoration";
import Header from "@/components/pricing/Header";
import { containerVariants, plans } from "@/components/pricing/data";
import PricingCard from "@/components/pricing/PricingCard";
import TestimonialSlider from "@/components/pricing/TestimonialSlider";
import FAQ from "@/components/pricing/FAQ";
import CTA from "@/components/pricing/CTA";
import Navbar from "@/components/nav";
import Footer from "@/components/custom/footer";

const PricingPage = () => {
  const [annual, setAnnual] = useState(true);
  const [activePlan, setActivePlan] = useState("accelerate");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothMouseX = useSpring(mouseX, { damping: 50, stiffness: 400 });
  const smoothMouseY = useSpring(mouseY, { damping: 50, stiffness: 400 });

  useEffect(() => {
    mouseX.set(mousePosition.x);
    mouseY.set(mousePosition.y);
  }, [mousePosition, mouseX, mouseY]);

  return (
    <div className="min-h-screen text-black overflow-hidden">
      <Navbar alwaysDarkText />
      <Decoration />

      {/* Content */}
      <div className="relative mt-6">
        {/* Header */}
        <Header
          annual={annual}
          setAnnual={setAnnual}
          smoothMouseX={smoothMouseX}
          smoothMouseY={smoothMouseY}
        />

        {/* Pricing cards */}
        <div className="relative z-10 px-8 pb-24">
          <motion.div
            ref={containerRef}
            className="max-w-screen-lg mx-auto grid grid-cols-1 md:grid-cols-2   gap-16"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
              x: useTransform(smoothMouseX, [0, window.innerWidth], [20, -20]),
              y: useTransform(smoothMouseY, [0, window.innerHeight], [10, -10]),
            }}
          >
            {plans.map((plan) => (
              <PricingCard
                plan={plan}
                activePlan={activePlan}
                setActivePlan={setActivePlan}
                annual={annual}
              />
            ))}
          </motion.div>
        </div>

        {/* Testimonial slider */}
        <TestimonialSlider />

        {/* FAQ section */}
        <FAQ />

        {/* CTA section */}
        <CTA />
      </div>
      <Footer />
    </div>
  );
};

export default PricingPage;
