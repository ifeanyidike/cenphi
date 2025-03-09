import { motion } from "framer-motion";

const Decoration = () => {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10%] opacity-20">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#7C3AED" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#EC4899" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <g fill="url(#grad1)">
              <circle cx="25" cy="25" r="25" opacity="0.4" />
              <circle cx="75" cy="75" r="20" opacity="0.6" />
              <circle cx="75" cy="25" r="15" opacity="0.5" />
              <circle cx="25" cy="75" r="10" opacity="0.7" />
            </g>
          </svg>
        </div>
      </div>

      {/* Noise texture overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>

      {/* Floating sparkling elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full bg-white opacity-20 w-1 h-1"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>
    </>
  );
};

export default Decoration;
