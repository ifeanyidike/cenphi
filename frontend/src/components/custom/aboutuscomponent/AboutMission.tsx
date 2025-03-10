import React from 'react';
import { motion } from 'framer-motion';
import { 
    Target, 
    Rocket, 
    Globe, 
    Zap, 
    ArrowRight 
} from 'lucide-react';

const MissionSection = ({ approachRef }: { approachRef: React.RefObject<HTMLDivElement> }) => {
  const featureVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: (custom: number) => ({
      opacity: 1, 
      y: 0,
      scale: 1, 
      transition: { 
        delay: custom * 0.2,
        duration: 0.8,
        type: "spring",
        stiffness: 120,
        damping: 10
      }
    })
  };

  const handleApproachScroll = () => {
    if (approachRef && approachRef.current) {
      approachRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      icon: Target,
      title: "Precision Strategy",
      description: "Meticulously engineered approaches synergizing data-driven insights with cutting-edge strategic frameworks to optimize your business trajectory.",
      color: "text-blue-400",
      gradient: "from-blue-400 to-indigo-500"
    },
    {
      icon: Rocket,
      title: "Innovative Solutions",
      description: "Revolutionary technologies and transformative methodologies that propel your enterprise beyond conventional boundaries of performance and potential.",
      color: "text-purple-400",
      gradient: "from-purple-400 to-fuchsia-500"
    },
    {
      icon: Globe,
      title: "Global Perspective",
      description: "Comprehensive, geographically-nuanced strategic intelligence that transcends traditional market limitations and unlocks unprecedented global opportunities.",
      color: "text-violet-400",
      gradient: "from-violet-400 to-pink-500"
    },
    {
      icon: Zap,
      title: "Rapid Execution",
      description: "Hyper-efficient implementation protocols designed to instantaneously transform visionary concepts into tangible, high-impact business realities.",
      color: "text-cyan-400",
      gradient: "from-cyan-400 to-sky-500"
    }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-16 px-6 overflow-hidden">
      {/* Advanced Geometric Background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-blue-800/20 to-purple-800/20 transform -skew-x-12 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-indigo-800/20 to-violet-800/20 transform skew-x-12 animate-pulse"></div>
        
        {/* Subtle Particle Effect */}
        {[...Array(50)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-white/10 rounded-full"
            style={{
              width: `${Math.random() * 4}px`,
              height: `${Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${2 + Math.random() * 3}s ease-in-out infinite`
            }}
          />
        ))}
      </div>

      {/* Content Container */}
      <div className="relative z-10 container mx-auto max-w-6xl">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center mb-16"
        >
          <h2 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-500 to-violet-600 mb-6 drop-shadow-[0_0_20px_rgba(79,70,229,0.3)]">
            Our Mission
          </h2>
          <p className="text-2xl text-slate-200 max-w-4xl mx-auto leading-relaxed tracking-wide">
            Pioneering transformative strategies that transcend conventional boundaries, converting complex challenges into extraordinary opportunities through innovative, precision-driven solutions.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-12">
          {features.map((feature, index) => {
            const FeatureIcon = feature.icon;
            return (
              <motion.div
                key={index}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={featureVariants}
                className="bg-white/5 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
              >
                <div className="flex items-center mb-6">
                  <div className={`w-16 h-16 mr-6 bg-gradient-to-br ${feature.gradient} rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform`}>
                    <FeatureIcon 
                      className={`w-8 h-8 text-white`}
                    />
                  </div>
                  <h3 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-slate-300 leading-relaxed text-lg font-light tracking-wide">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <button 
            onClick={handleApproachScroll}
            className="group relative px-12 py-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-full shadow-2xl hover:shadow-xl transition-all duration-300 flex items-center justify-center mx-auto space-x-4"
          >
            <span>Explore Our Approach</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            <span className="absolute inset-0 border-2 border-white/30 rounded-full opacity-0 transition-all duration-300"></span>
          </button>
        </motion.div>
      </div>
     
    </div>
  );
};

export default MissionSection;