import React from "react";
import { motion } from "framer-motion";
import {
  Star,
  Sparkles,
  Diamond,
  Award,
  BookOpen,
  Crown,
  Heart,
  Check,
} from "lucide-react";

const DemoSuccessView = () => {
  // Simplified demo version
  const testimonialType = "transformational";

  // Dynamic content based on testimonial type
  const getThematicContent = () => {
    return {
      heading: "Transcendent",
      subheading: "Your wisdom illuminates paths",
      message:
        "Your perspective transcends ordinary testimonials, creating ripples of transformation that reach beyond what you can imagine.",
      quote:
        "When we share our truth, we ignite the possibility of transformation in others.",
      iconColor: "from-violet-400 to-indigo-500",
      accentColor: "rgba(139,92,246,0.2)",
      gradientText: "from-violet-200 via-indigo-100 to-violet-200",
    };
  };

  const thematicContent = getThematicContent();

  // Static particles for demo
  const demoParticles = [
    {
      id: "p1",
      x: 20,
      y: 20,
      size: 4,
      opacity: 0.6,
      color: "#c7d2fe",
      blur: 1,
    },
    {
      id: "p2",
      x: 75,
      y: 35,
      size: 6,
      opacity: 0.5,
      color: "#ddd6fe",
      blur: 3,
    },
    {
      id: "p3",
      x: 30,
      y: 60,
      size: 5,
      opacity: 0.7,
      color: "#c4b5fd",
      blur: 1,
    },
    {
      id: "p4",
      x: 65,
      y: 70,
      size: 7,
      opacity: 0.4,
      color: "#a5b4fc",
      blur: 2,
    },
    {
      id: "p5",
      x: 80,
      y: 25,
      size: 4,
      opacity: 0.6,
      color: "#818cf8",
      blur: 1,
    },
    {
      id: "p6",
      x: 40,
      y: 80,
      size: 5,
      opacity: 0.5,
      color: "#93c5fd",
      blur: 3,
    },
    {
      id: "p7",
      x: 90,
      y: 60,
      size: 4,
      opacity: 0.7,
      color: "#c7d2fe",
      blur: 1,
    },
    {
      id: "p8",
      x: 15,
      y: 45,
      size: 6,
      opacity: 0.6,
      color: "#ddd6fe",
      blur: 2,
    },
  ];

  return (
    <div className="relative overflow-hidden h-screen w-full flex items-center justify-center bg-black">
      {/* Base background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-black to-black opacity-90" />
      <div
        className="absolute inset-0 bg-grid-white/[0.02]"
        // style={{
        //   backgroundImage:
        //     "url(\"data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.5 0H0V1.5V28.5V30H1.5H28.5H30V28.5V1.5V0H28.5H1.5ZM28.5 28.5H1.5V1.5H28.5V28.5Z' fill='white'/%3E%3C/svg%3E%0A\")",
        //   backgroundSize: "30px 30px",
        // }}
      />

      {/* Accent lighting */}
      <div
        className="absolute opacity-30 pointer-events-none"
        style={{
          width: "600px",
          height: "600px",
          borderRadius: "100%",
          background: `radial-gradient(circle, ${thematicContent.accentColor} 0%, transparent 70%)`,
          left: "calc(50% - 300px)",
          top: "calc(50% - 300px)",
          filter: "blur(100px)",
        }}
      />

      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {demoParticles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full mix-blend-screen"
            initial={{ opacity: particle.opacity, scale: 1 }}
            animate={{
              scale: [1, 1.2, 1],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
              repeatType: "reverse",
            }}
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: particle.color,
              filter: `blur(${particle.blur}px)`,
            }}
          />
        ))}
      </div>

      {/* Main content container */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Success icon with layered animations */}
        <div className="relative w-52 h-52 mx-auto mb-16">
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full opacity-80"
            style={{
              background: `conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,0) 0%, ${thematicContent.accentColor} 50%, rgba(255,255,255,0) 100%)`,
              filter: "blur(30px)",
            }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />

          {/* Middle animated ring */}
          <motion.div
            className="absolute top-4 left-4 right-4 bottom-4 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${thematicContent.accentColor} 0%, transparent 80%)`,
              backdropFilter: "blur(5px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            animate={{ rotate: [0, -360] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />

          {/* Pulsing middle layer */}
          <motion.div
            className="absolute top-10 left-10 right-10 bottom-10 rounded-full bg-black/40 backdrop-blur-md"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Inner success circle with icon */}
          <motion.div
            className={`absolute top-16 left-16 right-16 bottom-16 rounded-full bg-gradient-to-br ${thematicContent.iconColor} 
              flex items-center justify-center shadow-lg`}
            style={{ boxShadow: `0 10px 40px ${thematicContent.accentColor}` }}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <Diamond className="w-16 h-16 text-white" strokeWidth={1.5} />
          </motion.div>

          {/* Orbiting particles */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          >
            <Star className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-5 h-5 text-white/30" />
            <Sparkles className="absolute top-4 -right-4 w-6 h-6 text-white/40" />
            <Crown className="absolute -bottom-4 left-1/3 w-6 h-6 text-white/30" />
            <BookOpen className="absolute top-1/3 -left-6 w-5 h-5 text-white/40" />
          </motion.div>
        </div>

        {/* Text content */}
        <div className="space-y-4 mb-12">
          <motion.div className="overflow-hidden relative">
            <motion.h1
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 1 }}
              className={`text-7xl font-serif font-extralight mb-2 text-transparent bg-clip-text bg-gradient-to-r ${thematicContent.gradientText}`}
            >
              {thematicContent.heading}
            </motion.h1>

            <motion.div
              className="h-px w-20 bg-white/40 mx-auto mt-3 mb-4"
              initial={{ width: 0 }}
              animate={{ width: 80 }}
              transition={{ delay: 0.8, duration: 1 }}
            />
          </motion.div>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="text-3xl font-extralight text-white/90 tracking-wide"
          >
            {thematicContent.subheading}
          </motion.p>
        </div>

        {/* Main message */}
        <motion.div
          className="max-w-xl mx-auto mb-12 space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 1.2 }}
        >
          <p className="text-xl text-white/80 leading-relaxed font-light">
            {thematicContent.message}
          </p>

          <motion.div
            className="h-px w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.2, duration: 1.5 }}
          />

          <motion.p
            className="text-lg text-white/60 italic font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 1 }}
          >
            "{thematicContent.quote}"
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default DemoSuccessView;
