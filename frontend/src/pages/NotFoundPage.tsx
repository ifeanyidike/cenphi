import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useAnimation,
  useInView,
} from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  ArrowRight,
  X,
  RefreshCw,
  ChevronRight,
  Menu,
  MoveLeft,
  ExternalLink,
  Github,
  Twitter,
  Compass,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";

// Helper types
type Coordinates = {
  x: number;
  y: number;
};

type Particle = {
  id: number;
  position: Coordinates;
  velocity: Coordinates;
  size: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
};

// Custom hooks
const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState<Coordinates>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  return mousePosition;
};

const useParticles = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  mousePosition: Coordinates,
  particleSettings: {
    count: number;
    maxLife: number;
    colors: string[];
    sizeRange: [number, number];
    speedRange: [number, number];
  }
) => {
  const particles = useRef<Particle[]>([]);
  const animationFrameId = useRef<number>(0);
  const lastEmitTime = useRef<number>(0);
  const lastMousePosition = useRef<Coordinates>({ x: 0, y: 0 });

  const createParticle = (x: number, y: number, id: number): Particle => {
    const { colors, sizeRange, speedRange, maxLife } = particleSettings;
    const angle = Math.random() * Math.PI * 2;
    const speed =
      speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);

    return {
      id,
      position: { x, y },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.8 + Math.random() * 0.2,
      life: 0,
      maxLife,
    };
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle canvas resize
    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Animation loop
    const animate = (time: number) => {
      if (!ctx || !canvas) return;

      // Clear canvas with a slight fade effect
      ctx.fillStyle = "rgba(2, 6, 23, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Emit particles on mouse movement
      const mouseMoved =
        Math.abs(mousePosition.x - lastMousePosition.current.x) > 2 ||
        Math.abs(mousePosition.y - lastMousePosition.current.y) > 2;

      if (mouseMoved && time - lastEmitTime.current > 20) {
        lastEmitTime.current = time;

        // Add 2-4 particles
        const newParticleCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < newParticleCount; i++) {
          const newId =
            particles.current.length > 0
              ? Math.max(...particles.current.map((p) => p.id)) + 1
              : 0;

          particles.current.push(
            createParticle(mousePosition.x, mousePosition.y, newId)
          );
        }

        // Keep particle count reasonable
        if (particles.current.length > particleSettings.count) {
          particles.current = particles.current.slice(-particleSettings.count);
        }

        lastMousePosition.current = { ...mousePosition };
      }

      // Update and draw particles
      particles.current = particles.current.filter((particle) => {
        // Update life
        particle.life += 1;
        if (particle.life > particle.maxLife) return false;

        // Update position
        particle.position.x += particle.velocity.x;
        particle.position.y += particle.velocity.y;

        // Add slight gravity
        particle.velocity.y += 0.01;

        // Fade out near end of life
        const lifeRatio = particle.life / particle.maxLife;
        const opacity =
          lifeRatio < 0.7
            ? particle.opacity
            : particle.opacity * (1 - (lifeRatio - 0.7) / 0.3);

        // Draw particle
        ctx.beginPath();
        ctx.arc(
          particle.position.x,
          particle.position.y,
          particle.size * (1 - lifeRatio * 0.5), // Shrink as it ages
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `${particle.color}${Math.floor(opacity * 255)
          .toString(16)
          .padStart(2, "0")}`;
        ctx.fill();

        return true;
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [canvasRef, mousePosition, particleSettings]);
};

// UI components
const DigitalGlitchText: React.FC<{
  text: string;
  delay?: number;
  className?: string;
}> = ({ text, delay = 0, className = "" }) => {
  const controls = useAnimation();
  const [displayText, setDisplayText] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    let timeout: number;

    const glitchReveal = async () => {
      await new Promise((resolve) => {
        timeout = setTimeout(resolve, delay);
      });

      // Start with digital gibberish
      const chars = "01010101";
      const duration = 1500; // ms
      const steps = 20;
      const stepTime = duration / steps;

      let step = 0;
      const interval = setInterval(() => {
        step++;

        if (step < steps) {
          // Calculate how many characters to reveal
          const revealIndex = Math.floor((text.length * step) / steps);

          // Generate a string with revealed characters and gibberish
          let result = "";
          for (let i = 0; i < text.length; i++) {
            if (i < revealIndex) {
              result += text[i];
            } else {
              // Random gibberish for unrevealed characters
              result += chars[Math.floor(Math.random() * chars.length)];
            }
          }
          setDisplayText(result);
        } else {
          // Final step - show the actual text
          setDisplayText(text);
          setIsRevealed(true);
          clearInterval(interval);
        }
      }, stepTime);

      await controls.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 },
      });
    };

    glitchReveal();

    return () => {
      clearTimeout(timeout);
    };
  }, [text, delay, controls]);

  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={controls}
      className={`inline-block ${className} ${
        isRevealed ? "text-white" : "text-cyan-400"
      } transition-colors duration-300`}
    >
      {displayText || text.replace(/./g, "0")}
    </motion.span>
  );
};

const GlitchEffect: React.FC<{
  children: React.ReactNode;
  active?: boolean;
}> = ({ children, active = true }) => {
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    if (!active) return;

    // Random glitch effect
    const triggerGlitch = () => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200 + Math.random() * 300);
    };

    triggerGlitch();
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        triggerGlitch();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [active]);

  if (!active) return <>{children}</>;

  return (
    <div className="relative">
      {/* Original content */}
      <div className={glitchActive ? "opacity-0" : "opacity-100"}>
        {children}
      </div>

      {/* Glitch layers */}
      {glitchActive && (
        <>
          <div className="absolute inset-0 text-cyan-400 left-[2px] top-[1px] opacity-70 clip-glitch1">
            {children}
          </div>
          <div className="absolute inset-0 text-rose-500 left-[-2px] top-[-1px] opacity-70 clip-glitch2">
            {children}
          </div>
        </>
      )}
    </div>
  );
};

const ScanLine: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1] opacity-10">
      <div className="absolute inset-0 scanlines" />
    </div>
  );
};

const CircuitAnimation: React.FC = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-[0]">
      <svg
        width="100%"
        height="100%"
        className="opacity-5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="circuit-pattern"
            x="0"
            y="0"
            width="200"
            height="200"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M10 10 L50 10 L50 50 L90 50 L90 90 L130 90 L130 130 L170 130 L170 170"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-cyan-500 animate-circuit"
            />
            <path
              d="M190 10 L150 10 L150 50 L110 50 L110 90 L70 90 L70 130 L30 130 L30 170"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-purple-500 animate-circuit-reverse"
            />
            <path
              d="M10 190 L50 190 L50 150 L90 150 L90 110 L130 110 L130 70 L170 70 L170 30"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-teal-500 animate-circuit-delay"
            />
            <path
              d="M190 190 L150 190 L150 150 L110 150 L110 110 L70 110 L70 70 L30 70 L30 30"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-blue-500 animate-circuit-delay-reverse"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
      </svg>
    </div>
  );
};

// const ImageGrid: React.FC<{
//   images: string[];
// }> = ({ images }) => {
//   return (
//     <div className="grid grid-cols-3 gap-1 max-w-md mx-auto mt-6 opacity-70">
//       {images.map((_, index) => (
//         <motion.div
//           key={index}
//           initial={{ opacity: 0, scale: 0.8 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{
//             duration: 0.5,
//             delay: 0.1 * index,
//             ease: "easeOut",
//           }}
//           className="aspect-square bg-slate-800/50 backdrop-blur-sm rounded-md overflow-hidden"
//         >
//           <div className="w-full h-full flex items-center justify-center text-cyan-400/70">
//             <img
//               src={`/api/placeholder/${Math.floor(Math.random() * 100) + 200}/${
//                 Math.floor(Math.random() * 100) + 200
//               }`}
//               alt="placeholder"
//               className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500 hover:scale-110"
//             />
//           </div>
//         </motion.div>
//       ))}
//     </div>
//   );
// };

// The main 404 component
const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>("main");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isInView = useInView(containerRef);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const mousePosition = useMousePosition();

  // Particle colors - cyberpunk theme
  const particleColors = [
    "#00ffff", // cyan
    "#ff00aa", // magenta
    "#f5f5f5", // white
    "#0077ff", // blue
    "#00eeff", // light blue
  ];

  // Configure particles
  useParticles(canvasRef, mousePosition, {
    count: isMobile ? 50 : 100,
    maxLife: 100,
    colors: particleColors,
    sizeRange: [0.5, 3],
    speedRange: [0.3, 1.5],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setIsLoading(true);
    // Simulate search delay
    setTimeout(() => {
      setIsLoading(false);
      navigate(`/search?q=${encodeURIComponent(searchValue)}`);
    }, 800);
  };

  const handleGoHome = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate("/");
    }, 300);
  };

  const handleNavigation = (path: string) => {
    setIsLoading(true);
    setTimeout(() => {
      navigate(path);
    }, 300);
  };

  const suggestions = [
    "Dashboard",
    "Profile",
    "Settings",
    "Projects",
    "Analytics",
    "Team",
  ];

  const sections = [
    {
      id: "main",
      title: "404",
    },
    {
      id: "explore",
      title: "Explore",
    },
    {
      id: "recent",
      title: "Recent",
    },
  ];

  useEffect(() => {
    // Auto-focus search field
    if (isInView && searchInputRef.current && activeSection === "main") {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 1500);
    }
  }, [isInView, activeSection]);

  const recentPages = [
    {
      title: "Dashboard Overview",
      path: "/dashboard",
      time: "5 minutes ago",
    },
    {
      title: "User Profile",
      path: "/profile",
      time: "Yesterday",
    },
    {
      title: "Project Analytics",
      path: "/analytics",
      time: "2 days ago",
    },
    {
      title: "Team Management",
      path: "/team",
      time: "Last week",
    },
    {
      title: "System Settings",
      path: "/settings",
      time: "2 weeks ago",
    },
  ];

  const quickLinks = [
    {
      title: "Homepage",
      path: "/",
      icon: <Home className="w-4 h-4" />,
      description: "Return to the starting point",
    },
    {
      title: "Search",
      path: "/search",
      icon: <Search className="w-4 h-4" />,
      description: "Find what you're looking for",
    },
    {
      title: "Explore",
      path: "/explore",
      icon: <Compass className="w-4 h-4" />,
      description: "Discover new content",
    },
  ];

  // Main content sections
  const renderMainSection = () => (
    <motion.div
      key="main-section"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto text-center"
    >
      <div className="mb-6 relative">
        <GlitchEffect>
          <h1 className="font-mono text-7xl sm:text-9xl font-bold mb-2 tracking-tight text-white">
            <span className="inline-block">
              <DigitalGlitchText text="4" delay={300} />
            </span>
            <span className="inline-block text-cyan-400">
              <DigitalGlitchText text="0" delay={500} />
            </span>
            <span className="inline-block">
              <DigitalGlitchText text="4" delay={700} />
            </span>
          </h1>
        </GlitchEffect>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="font-mono text-lg sm:text-xl text-white/80 mb-8 max-w-lg mx-auto tracking-tight leading-relaxed"
        >
          <span className="text-cyan-400">[ERROR::</span> Page not found.{" "}
          <span className="text-cyan-400">]</span>
          <br />
          <span className="text-white/60 text-sm">
            System has detected you've entered an unmapped digital territory.
          </span>
        </motion.h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="mb-10 relative z-10"
      >
        <form onSubmit={handleSearch} className="relative group">
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search to recalibrate your destination..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full h-14 px-6 pr-14 rounded-lg border-2 border-cyan-500/30 bg-slate-900/70 backdrop-blur-xl text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 font-mono shadow-lg shadow-cyan-500/5"
          />
          <button
            type="submit"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-cyan-400 transition-colors duration-300 group-hover:right-5"
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </button>

          {/* Search suggestions */}
          {showSuggestions && searchValue && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-cyan-500/20 bg-slate-900/95 backdrop-blur-xl overflow-hidden z-50 shadow-xl shadow-cyan-500/10"
            >
              <ul className="py-1">
                {suggestions
                  .filter((sugg) =>
                    sugg.toLowerCase().includes(searchValue.toLowerCase())
                  )
                  .map((suggestion, index) => (
                    <li
                      key={index}
                      className="px-2 py-1 hover:bg-cyan-500/10 cursor-pointer transition-colors duration-150"
                    >
                      <button
                        onClick={() => {
                          setSearchValue(suggestion);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left text-white/80 hover:text-cyan-400 flex items-center px-3 py-2"
                      >
                        <Search className="w-4 h-4 mr-3 text-white/40" />
                        <span className="font-mono">{suggestion}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            </motion.div>
          )}
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.5 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
      >
        <Button
          onClick={handleGoHome}
          className="h-12 px-6 rounded-md bg-cyan-500 hover:bg-cyan-600 text-slate-900 hover:text-white border-none transition-all duration-300 font-mono uppercase tracking-wide text-sm shadow-lg shadow-cyan-500/20"
        >
          <Home className="w-4 h-4 mr-2" />
          Return Home
        </Button>

        <Button
          onClick={() => setActiveSection("explore")}
          variant="outline"
          className="h-12 px-6 rounded-md bg-transparent backdrop-blur-sm border-2 border-cyan-500/40 text-white hover:border-cyan-400 hover:text-cyan-400 hover:bg-slate-900/50 transition-all duration-300 font-mono uppercase tracking-wide text-sm"
        >
          <Compass className="w-4 h-4 mr-2" />
          Explore Options
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.1, duration: 1 }}
        className="mt-16"
      >
        <p className="text-white/40 text-sm mb-3 font-mono">
          System Suggestions:
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {quickLinks.map((link, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.1 + index * 0.1, duration: 0.5 }}
              onClick={() => handleNavigation(link.path)}
              className="px-4 py-2 rounded-md bg-slate-800/50 backdrop-blur-md border border-white/10 text-white/70 hover:text-cyan-400 hover:border-cyan-400/30 transition-all duration-300 flex items-center text-sm"
            >
              <span className="mr-2 text-cyan-400/70">{link.icon}</span>
              {link.title}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  const renderExploreSection = () => (
    <motion.div
      key="explore-section"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="flex items-center mb-6">
        <button
          onClick={() => setActiveSection("main")}
          className="text-white/60 hover:text-cyan-400 transition-colors duration-300 mr-4"
        >
          <MoveLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-mono text-white">
          <span className="text-cyan-400">[</span> Explore{" "}
          <span className="text-cyan-400">]</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/70 backdrop-blur-lg border border-cyan-500/20 rounded-lg p-5">
          <h3 className="text-lg font-mono text-white mb-4 flex items-center">
            <Compass className="w-4 h-4 mr-2 text-cyan-400" />
            Quick Navigation
          </h3>
          <ul className="space-y-3">
            {quickLinks.map((link, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
              >
                <button
                  onClick={() => handleNavigation(link.path)}
                  className="w-full text-left px-4 py-3 rounded-md hover:bg-cyan-500/10 text-white/80 hover:text-cyan-400 transition-colors duration-150 flex items-center group"
                >
                  <span className="mr-3 text-cyan-400/70">{link.icon}</span>
                  <div>
                    <div className="font-medium">{link.title}</div>
                    <div className="text-white/50 text-sm">
                      {link.description}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-300 text-cyan-400" />
                </button>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-lg border border-cyan-500/20 rounded-lg p-5">
          <h3 className="text-lg font-mono text-white mb-4 flex items-center">
            <Search className="w-4 h-4 mr-2 text-cyan-400" />
            Popular Searches
          </h3>

          <ul className="space-y-2">
            {[
              "Dashboard analytics",
              "User profiles",
              "System settings",
              "Project management",
              "Team collaboration",
              "Performance metrics",
            ].map((term, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
              >
                <button
                  onClick={() => {
                    setSearchValue(term);
                    setActiveSection("main");
                    setTimeout(() => {
                      searchInputRef.current?.focus();
                    }, 500);
                  }}
                  className="w-full text-left px-4 py-2 rounded-md hover:bg-cyan-500/10 text-white/70 hover:text-cyan-400 transition-colors duration-150 flex items-center group"
                >
                  <Search className="w-4 h-4 mr-3 text-white/40" />
                  <span className="font-mono text-sm">{term}</span>
                </button>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 bg-slate-900/70 backdrop-blur-lg border border-cyan-500/20 rounded-lg p-5">
        <h3 className="text-lg font-mono text-white mb-4 flex items-center">
          <ExternalLink className="w-4 h-4 mr-2 text-cyan-400" />
          External Resources
        </h3>

        {/* <ImageGrid
          images={Array(9)
            .fill("")
            .map((_, i) => `image-${i}`)}
        /> */}
      </div>
    </motion.div>
  );

  const renderRecentSection = () => (
    <motion.div
      key="recent-section"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="flex items-center mb-6">
        <button
          onClick={() => setActiveSection("main")}
          className="text-white/60 hover:text-cyan-400 transition-colors duration-300 mr-4"
        >
          <MoveLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-mono text-white">
          <span className="text-cyan-400">[</span> Recent Activity{" "}
          <span className="text-cyan-400">]</span>
        </h2>
      </div>

      <div className="bg-slate-900/70 backdrop-blur-lg border border-cyan-500/20 rounded-lg p-5">
        <h3 className="text-lg font-mono text-white mb-4 flex items-center">
          <Clock className="w-4 h-4 mr-2 text-cyan-400" />
          Recently Visited Pages
        </h3>
        <ul className="space-y-2">
          {recentPages.map((page, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
            >
              <button
                onClick={() => handleNavigation(page.path)}
                className="w-full text-left p-3 rounded-md hover:bg-cyan-500/10 text-white/80 hover:text-cyan-400 transition-colors duration-150 flex items-center justify-between group"
              >
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-3 text-cyan-400/50" />
                  <span>{page.title}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-white/40 text-xs mr-2">
                    {page.time}
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-300 text-cyan-400" />
                </div>
              </button>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-slate-900/70 backdrop-blur-lg border border-cyan-500/20 rounded-lg p-5">
          <h3 className="text-lg font-mono text-white mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Server Uptime</span>
              <span className="text-cyan-400 font-mono">99.98%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">API Response</span>
              <span className="text-green-400 font-mono">23ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Database Status</span>
              <span className="text-green-400 font-mono">Online</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Memory Usage</span>
              <span className="text-amber-400 font-mono">76%</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-lg border border-cyan-500/20 rounded-lg p-5">
          <h3 className="text-lg font-mono text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                label: "Refresh Cache",
                icon: <RefreshCw className="w-4 h-4" />,
              },
              { label: "Clear Data", icon: <X className="w-4 h-4" /> },
              { label: "Report Bug", icon: <Github className="w-4 h-4" /> },
              { label: "Get Support", icon: <Twitter className="w-4 h-4" /> },
            ].map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                className="p-3 rounded-md bg-slate-800/50 text-white/70 hover:text-cyan-400 hover:bg-slate-800 transition-all duration-200 flex flex-col items-center justify-center text-sm"
              >
                <span className="text-cyan-400/70 mb-2">{action.icon}</span>
                {action.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-slate-950 text-white overflow-x-hidden"
    >
      {/* Background elements */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full -z-10"
      />
      <CircuitAnimation />
      <ScanLine />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950 -z-5 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950 -z-5 pointer-events-none" />

      {/* Glitch noise effect */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay -z-5" />

      {/* Brand logo */}
      <div className="absolute top-8 left-8 z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-white font-mono text-xl tracking-widest font-light flex items-center"
        >
          <span>Cenphi</span>
          <span className="text-cyan-400 ml-1">.</span>
        </motion.div>
      </div>

      {/* Section navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2.5 }}
        className="absolute top-8 right-8 z-10 hidden sm:block"
      >
        <ul className="flex space-x-1">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 text-sm font-mono rounded-md transition-all duration-300 ${
                  activeSection === section.id
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {section.title}
              </button>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Mobile menu button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2.5 }}
        className="absolute top-8 right-8 z-10 sm:hidden"
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-10 h-10 p-0 rounded-md bg-slate-900/60 backdrop-blur-sm border border-white/10 text-white hover:border-cyan-400/30 hover:text-cyan-400 transition-all duration-300"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900/95 backdrop-blur-lg border border-cyan-500/20 rounded-lg p-4 shadow-2xl shadow-cyan-500/5 max-w-[90vw] w-full">
            <div className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    document.querySelector('[role="dialog"]')?.remove();
                  }}
                  className={`w-full px-4 py-3 text-left text-white/70 hover:text-cyan-400 transition-colors duration-150 rounded-md ${
                    activeSection === section.id
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "hover:bg-slate-800/50"
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <main className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
        <AnimatePresence mode="wait">
          {activeSection === "main" && renderMainSection()}
          {activeSection === "explore" && renderExploreSection()}
          {activeSection === "recent" && renderRecentSection()}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute bottom-8 w-full text-center text-white/30 text-sm font-mono"
      >
        <p className="mb-1">
          © {new Date().getFullYear()} Cenphi. All rights reserved.
        </p>
        <div className="flex justify-center space-x-4 text-xs">
          <button className="hover:text-cyan-400 transition-colors duration-300">
            Terms
          </button>
          <button className="hover:text-cyan-400 transition-colors duration-300">
            Privacy
          </button>
          <button className="hover:text-cyan-400 transition-colors duration-300">
            Contact
          </button>
        </div>
      </motion.div>
      <style>
        {`
@keyframes scanline {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

@keyframes circuit {
  0% {
    stroke-dashoffset: 400;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes circuit-reverse {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: 400;
  }
}

.scanlines::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 2px;
  background: rgba(0, 255, 255, 0.1);
  animation: scanline 6s linear infinite;
}

.bg-noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

.clip-glitch1 {
  clip-path: polygon(0 15%, 100% 10%, 100% 45%, 0 50%);
}

.clip-glitch2 {
  clip-path: polygon(0 60%, 100% 55%, 100% 90%, 0 95%);
}

.animate-circuit {
  stroke-dasharray: 400;
  animation: circuit 20s linear infinite;
}

.animate-circuit-reverse {
  stroke-dasharray: 400;
  animation: circuit-reverse 20s linear infinite;
}

.animate-circuit-delay {
  stroke-dasharray: 400;
  animation: circuit 20s linear infinite;
  animation-delay: -10s;
}

.animate-circuit-delay-reverse {
  stroke-dasharray: 400;
  animation: circuit-reverse 20s linear infinite;
  animation-delay: -10s;
}

/* Custom fonts should be imported here */
/* Example: @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100;300;400;500;700&display=swap'); */
`}
      </style>
    </div>
  );
};

export default NotFoundPage;
