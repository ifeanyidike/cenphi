import { useState } from "react";
import { motion } from "framer-motion";

const PreloaderAnimation = () => {
  const [letterArray] = useState("CENPHI AI".split(""));

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden perspective-1000"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.8, delay: 4, ease: [0.76, 0, 0.24, 1] }}
    >
      {/* Dynamic grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(25,25,25,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(25,25,25,0.5)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-500/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* 3D rotating frame */}
      <motion.div
        className="absolute w-64 h-64 border border-blue-500/20 rounded-lg"
        animate={{
          rotateX: [0, 360],
          rotateY: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          transformStyle: "preserve-3d",
        }}
      />

      <div className="relative z-10">
        {/* Main content container */}
        <motion.div
          className="flex flex-col items-center justify-center space-y-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated logo */}
          <motion.div
            className="relative w-24 h-24 mb-8"
            animate={{
              rotateY: 360,
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-full h-full border-4 border-blue-500/30 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute w-16 h-16 border-4 border-purple-500/30 rounded-full"
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>

          {/* Animated text with 3D effect */}
          <div className="flex flex-wrap justify-center max-w-sm">
            {letterArray.map((letter, index) => (
              <motion.span
                key={index}
                className={`text-4xl font-bold ${
                  letter === " " ? "w-4" : "text-white"
                } transform perspective-1000`}
                initial={{ opacity: 0, rotateX: -90 }}
                animate={{ opacity: 1, rotateX: 0 }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.1,
                  ease: [0.76, 0, 0.24, 1],
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Progress bar */}
          <div className="relative w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="absolute h-full w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          {/* Animated subtitle */}
          <motion.div
            className="relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
          >
            <motion.p
              className="text-gray-400 text-sm tracking-wider uppercase"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              Transforming Mortgage Intelligence
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PreloaderAnimation;
