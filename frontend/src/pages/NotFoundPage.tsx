// 404.tsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Search, Compass, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  const router = useNavigate();
  const [searchValue, setSearchValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recentPages] = useState<string[]>([
    "/dashboard",
    "/profile",
    "/settings",
    "/analytics",
    "/projects",
  ]);

  // Handle background particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number;
      y: number;
      radius: number;
      color: string;
      velocity: {
        x: number;
        y: number;
      };
      alpha: number;
    }

    const particles: Particle[] = [];
    const particleCount = 50;

    const createParticle = () => {
      const radius = Math.random() * 2 + 0.5;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius,
        color: Math.random() > 0.5 ? "#d4af37" : "#f9f9f9",
        velocity: {
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5,
        },
        alpha: Math.random() * 0.4 + 0.1,
      };
    };

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }

    const animate = () => {
      requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;

        if (particle.x < 0 || particle.x > canvas.width) {
          particle.velocity.x = -particle.velocity.x;
        }

        if (particle.y < 0 || particle.y > canvas.height) {
          particle.velocity.y = -particle.velocity.y;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.alpha;
        ctx.fill();
      });
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setIsLoading(true);
    // Simulate search delay
    setTimeout(() => {
      setIsLoading(false);
      router(`/search?q=${encodeURIComponent(searchValue)}`);
    }, 1500);
  };

  const handleGoHome = () => {
    setIsLoading(true);
    setTimeout(() => {
      router("/");
    }, 500);
  };

  const navigateToPage = (path: string) => {
    setIsLoading(true);
    setTimeout(() => {
      router(path);
    }, 500);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Delay to allow clicking on suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const suggestions = [
    "Dashboard",
    "Profile Settings",
    "Analytics",
    "Projects Overview",
    "Team Management",
  ];

  return (
    <div className="relative bg-slate-950 overflow-hidden rounded-2xl">
      {/* Background canvas */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full -z-10"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950 -z-5" />

      {/* Brand logo */}
      <div className="absolute top-8 left-8 z-10">
        <div className="text-gold font-serif text-xl tracking-wider font-light">
          <span className="text-white">ELITE</span>
          <span className="text-amber-500">.</span>
        </div>
      </div>

      <main className="relative flex flex-col items-center justify-center max-h-screen h-[800px] px-4 sm:px-6 z-0">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-2xl mx-auto text-center"
          >
            <h1 className="font-serif text-6xl sm:text-8xl font-light text-white mb-4 tracking-tighter">
              4<span className="text-amber-400">0</span>4
            </h1>

            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="font-sans text-xl sm:text-2xl text-white/70 mb-10 max-w-lg mx-auto leading-relaxed"
            >
              We couldn't find the page you're looking for. It seems you've
              ventured into uncharted territory.
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mb-10"
            >
              <form onSubmit={handleSearch} className="relative group">
                <Input
                  type="text"
                  placeholder="Search to find what you're looking for..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className="w-full h-14 px-6 pr-14 rounded-full border border-white/10 bg-black/20 backdrop-blur-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all duration-300"
                />
                <button
                  type="submit"
                  className="absolute right-5 top-1/2 transform -translate-y-1/2 text-white/50 group-hover:text-amber-400 transition-colors duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>

                {/* Search suggestions */}
                {showSuggestions && searchValue && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-md overflow-hidden z-50 shadow-xl"
                  >
                    <ul className="py-2">
                      {suggestions
                        .filter((sugg) =>
                          sugg.toLowerCase().includes(searchValue.toLowerCase())
                        )
                        .map((suggestion, index) => (
                          <li
                            key={index}
                            className="px-4 py-2 hover:bg-white/5 cursor-pointer transition-colors duration-150"
                          >
                            <button
                              onClick={() => {
                                setSearchValue(suggestion);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left text-white/80 hover:text-amber-400 flex items-center"
                            >
                              <Search className="w-4 h-4 mr-3 text-white/40" />
                              {suggestion}
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
              transition={{ delay: 0.9, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="h-12 px-6 rounded-full bg-slate-900/50 backdrop-blur-sm border border-white/10 text-white hover:border-amber-400 hover:text-amber-400 hover:bg-slate-900/80 transition-all duration-300"
              >
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 px-6 rounded-full bg-slate-900/50 backdrop-blur-sm border border-white/10 text-white hover:border-amber-400 hover:text-amber-400 hover:bg-slate-900/80 transition-all duration-300"
                  >
                    <Compass className="w-4 h-4 mr-2" />
                    Explore Options
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl max-w-lg w-full">
                  <Tabs defaultValue="recent" className="mt-4">
                    <TabsList className="grid grid-cols-2 bg-slate-800/50 rounded-lg p-1">
                      <TabsTrigger
                        value="recent"
                        className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 px-4 py-2 rounded-md transition-all duration-200"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Recent Pages
                      </TabsTrigger>
                      <TabsTrigger
                        value="suggestions"
                        className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 px-4 py-2 rounded-md transition-all duration-200"
                      >
                        <Compass className="w-4 h-4 mr-2" />
                        Suggestions
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="recent" className="mt-4">
                      <ul className="space-y-2">
                        {recentPages.map((page, index) => (
                          <li key={index}>
                            <button
                              onClick={() => navigateToPage(page)}
                              className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-white/80 hover:text-amber-400 transition-colors duration-150 flex items-center"
                            >
                              <Clock className="w-4 h-4 mr-3 text-white/40" />
                              {page.slice(1).charAt(0).toUpperCase() +
                                page.slice(2)}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>

                    <TabsContent value="suggestions" className="mt-4">
                      <ul className="space-y-2">
                        {[
                          {
                            icon: <Home className="w-4 h-4" />,
                            label: "Home",
                            path: "/",
                          },
                          {
                            icon: <Search className="w-4 h-4" />,
                            label: "Search",
                            path: "/search",
                          },
                          {
                            icon: <Compass className="w-4 h-4" />,
                            label: "Explore",
                            path: "/explore",
                          },
                        ].map((item, index) => (
                          <li key={index}>
                            <button
                              onClick={() => navigateToPage(item.path)}
                              className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-white/80 hover:text-amber-400 transition-colors duration-150 flex items-center"
                            >
                              <span className="mr-3 text-white/40">
                                {item.icon}
                              </span>
                              {item.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent -z-5" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.2, duration: 1.5 }}
          className="absolute bottom-8 w-full text-center text-white/30 text-sm font-light"
        >
          © {new Date().getFullYear()} ELITE. All rights reserved.
        </motion.div>
      </main>
    </div>
  );
};

export default NotFoundPage;
