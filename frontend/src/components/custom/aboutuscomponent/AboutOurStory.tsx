
import { motion } from 'framer-motion';
import { Trophy, Globe, Zap } from 'lucide-react';
import CollaborativeTeam from "@/assets/collaborativeteam.jpg"

const AboutUsPage = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
      {/* Subtle Geometric Background Layers */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 bg-gradient-to-tr from-blue-900 via-purple-900 to-indigo-900 mix-blend-overlay z-0"
      />

      {/* Animated Geometric Shapes */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <motion.div 
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ scale: 1, opacity: 0.1, rotate: 0 }}
          transition={{ duration: 2, type: "spring" }}
          className="absolute top-[-10%] left-[-10%] w-2/3 h-1/2 bg-white/10 rounded-full blur-3xl"
        />
        <motion.div 
          initial={{ scale: 0, opacity: 0, rotate: 180 }}
          animate={{ scale: 1, opacity: 0.1, rotate: 0 }}
          transition={{ duration: 2, type: "spring", delay: 0.3 }}
          className="absolute bottom-[-10%] right-[-10%] w-2/3 h-1/2 bg-white/10 rounded-full blur-3xl"
        />
      </div>

      {/* Content Container */}
      <div className="relative z-20 container mx-auto px-6 py-16">
       
        
        {/* Header with Gradient Text */}
        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-12"
        >
          Our Story
        </motion.h1>
        
        {/* Content Section */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Text Content with Advanced Styling */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl"
          >
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400 mb-8">
              Our Story
            </h2>
            <div className="space-y-6">
              <p className="text-gray-300 leading-relaxed text-lg">
                We are a dynamic team of innovators dedicated to pushing the boundaries of technology and creativity. Our journey began with a simple belief: that great ideas can transform the world.
              </p>
              <p className="text-gray-300 leading-relaxed text-lg">
                Bringing together diverse talents and perspectives, we collaborate to solve complex challenges and deliver exceptional solutions that make a real difference.
              </p>
            </div>

            {/* Key Values Section */}
            <div className="mt-12 grid grid-cols-2 gap-6">
              <div className="flex items-center space-x-4">
                <Trophy className="w-10 h-10 text-blue-400" />
                <span className="text-gray-300">Excellence</span>
              </div>
              <div className="flex items-center space-x-4">
                <Globe className="w-10 h-10 text-purple-400" />
                <span className="text-gray-300">Innovation</span>
              </div>
              <div className="flex items-center space-x-4">
                <Zap className="w-10 h-10 text-pink-400" />
                <span className="text-gray-300">Speed</span>
              </div>
            </div>
          </motion.div>
          
          {/* Team Image with Advanced Effects */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-3xl mix-blend-multiply z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 opacity-20 rounded-3xl group-hover:opacity-30 transition-all duration-500 z-20"></div>
            <img 
              src={CollaborativeTeam} 
              alt="Team Collaboration" 
              className="w-full h-full object-cover rounded-3xl filter grayscale group-hover:grayscale-0 transition-all duration-500 z-30"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;