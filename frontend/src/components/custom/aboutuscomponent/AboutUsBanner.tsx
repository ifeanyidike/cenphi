import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronRight, ArrowDownRight } from 'lucide-react';
import AboutBackgroundVideo from "@/assets/aboutbannervideo.mp4"
import AboutMission from "@/components/custom/aboutuscomponent/AboutMission";

const AboutUsBanner = () => {
  const ref = useRef(null);
  const videoRef = useRef(null);
  const nextSectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  // Parallax and transform animations
  // const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "150%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const handleLearnMore = () => {
    if (nextSectionRef.current) {
      // Slight delay before scrolling
      setTimeout(() => {
        if (nextSectionRef.current) {
          nextSectionRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 300);
    }
  };

  return (
    <>
      <div 
        ref={ref}
        className="relative min-h-screen w-full overflow-hidden"
      >
        {/* Video Background with Overlay */}
        <div className="absolute inset-0 z-0">
          <video 
            ref={videoRef}
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.3] contrast-[0.8]"
          >
            <source 
              src={AboutBackgroundVideo} 
              type="video/mp4" 
            />
            Your browser does not support the video tag.
          </video>
          
          {/* Gradient Overlay */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-indigo-600/30 mix-blend-overlay z-10"
            style={{ backgroundColor: 'rgba(17,24,39,1)' }}
          />
        </div>

        {/* Content Container */}
        <motion.div 
          style={{ y: textY, opacity }}
          className="relative z-40 flex items-center justify-center min-h-screen text-center px-6"
        >
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center justify-center text-slate-300 mb-6 space-x-2"
            >
              <span>Home</span>
              <ChevronRight className="w-5 h-5 text-slate-400" />
              <span className="text-blue-400">About Us</span>
            </motion.div>

            {/* Main Title */}
            <motion.h1 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-violet-600 mb-8 leading-tight"
            >
              Crafting Innovative Solutions
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed"
            >
              We are a passionate team of innovators, designers, and problem-solvers dedicated to pushing the boundaries of technology and creativity.
            </motion.p>

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.9 }}
              className="flex justify-center"
            >
              <button 
                onClick={handleLearnMore}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-full shadow-2xl hover:shadow-xl transition-all duration-300 flex items-center space-x-3"
                style={{ 
                  backgroundColor: 'rgba(59,130,246,0.3)',
                  boxShadow: '0 0 15px rgba(59,130,246,0.3)'
                }}
              >
                <span>Learn More</span>
                <ArrowDownRight 
                  className="w-5 h-5 text-cyan-400 transition-transform group-hover:translate-x-1 group-hover:translate-y-1"
                />
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Subtle Animated Border */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="absolute inset-4 border-4 border-slate-700 rounded-3xl pointer-events-none z-50"
        />
      </div>

      {/* Next Section */}
      <div 
        ref={nextSectionRef} 
        
      >
        <AboutMission approachRef={nextSectionRef} />
        {/* <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-800">Our Next Section</h2>
          <p className="text-xl text-gray-600 mt-4">
            Scroll down to explore more about our innovative approach.
          </p>
        </div> */}
      </div>
    </>
  );
};

export default AboutUsBanner;