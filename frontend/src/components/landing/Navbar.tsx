import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Sparkles, Video, BarChart3, Zap, LayoutDashboard, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { authStore } from "@/stores/authStore";
import { observer } from "mobx-react-lite";

const Navbar = observer(() => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeDropdown = () => setActiveDropdown(null);

  const services = [
    {
      name: "AI Content Generation",
      desc: "Transform testimonials into marketing content",
      icon: Sparkles,
      color: "text-blue-600",
    },
    {
      name: "Video Processing",
      desc: "Collect and enhance video testimonials",
      icon: Video,
      color: "text-gray-600",
    },
    {
      name: "Performance Analytics",
      desc: "Track ROI and conversion impact",
      icon: BarChart3,
      color: "text-blue-600",
    },
    {
      name: "Smart Automation",
      desc: "Automate collection and management",
      icon: Zap,
      color: "text-gray-600",
    },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-black/95 backdrop-blur-xl shadow-2xl border-b border-white/10"
          : "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo - Micro Minimal */}
          <Link to="/" className="flex items-center">
            <span
              className={`text-xs font-bold tracking-widest uppercase transition-colors duration-500 ${
                isScrolled ? "text-white" : "text-gray-900"
              }`}
            >
              Cenphi
            </span>
          </Link>

          {/* Navigation - Floating Pills */}
          <div
            className={`hidden lg:flex items-center backdrop-blur-lg rounded-full p-1 border transition-all duration-500 ${
              isScrolled
                ? "bg-white/10 border-white/20"
                : "bg-gray-100/80 border-gray-200"
            }`}
          >
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown("services")}
              onMouseLeave={closeDropdown}
            >
              <button
                className={`flex items-center gap-1 px-4 py-2 text-xs font-medium rounded-full transition-all duration-300 ${
                  isScrolled
                    ? "text-white/90 hover:text-white hover:bg-white/10"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-200/80"
                }`}
              >
                Services
                <ChevronDown className="h-3 w-3 transition-transform duration-200" />
              </button>
              <AnimatePresence>
                {activeDropdown === "services" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-3 w-96 backdrop-blur-xl rounded-2xl border overflow-hidden shadow-2xl ${
                      isScrolled
                        ? "bg-black/95 border-white/20"
                        : "bg-white/95 border-gray-200"
                    }`}
                  >
                    <div className="p-4">
                      <div
                        className={`text-xs font-medium uppercase tracking-wider mb-4 ${
                          isScrolled ? "text-white/60" : "text-gray-500"
                        }`}
                      >
                        AI-Powered Services
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {services.map((service, i) => (
                          <motion.button
                            key={i}
                            onClick={() => navigate("/studio")}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 text-left group ${
                              isScrolled
                                ? "hover:bg-white/10"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            <div
                              className={`${service.color} mt-1 group-hover:scale-110 transition-transform duration-300`}
                            >
                              <service.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div
                                className={`text-xs font-semibold transition-colors duration-300 ${
                                  isScrolled
                                    ? "text-white group-hover:text-blue-300"
                                    : "text-gray-900 group-hover:text-blue-600"
                                }`}
                              >
                                {service.name}
                              </div>
                              <div
                                className={`text-xs mt-1 leading-relaxed ${
                                  isScrolled ? "text-white/60" : "text-gray-600"
                                }`}
                              >
                                {service.desc}
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                      <div
                        className={`border-t mt-4 pt-4 ${
                          isScrolled ? "border-white/10" : "border-gray-200"
                        }`}
                      >
                        <button
                          onClick={() => navigate("/studio")}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium py-2.5 px-4 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg"
                        >
                          Try All Services →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a
              href="#platform"
              className={`px-4 py-2 text-xs font-medium rounded-full transition-all duration-300 ${
                isScrolled
                  ? "text-white/90 hover:text-white hover:bg-white/10"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-200/80"
              }`}
            >
              Platform
            </a>
            <a
              href="#customers"
              className={`px-4 py-2 text-xs font-medium rounded-full transition-all duration-300 ${
                isScrolled
                  ? "text-white/90 hover:text-white hover:bg-white/10"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-200/80"
              }`}
            >
              Customers
            </a>
            <a
              href="#resources"
              className={`px-4 py-2 text-xs font-medium rounded-full transition-all duration-300 ${
                isScrolled
                  ? "text-white/90 hover:text-white hover:bg-white/10"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-200/80"
              }`}
            >
              Resources
            </a>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            {authStore.isAuthenticated ? (
              <>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  isScrolled
                    ? "text-white/70 bg-white/10"
                    : "text-gray-600 bg-gray-100"
                }`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  Logged in
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 text-xs font-medium h-8 px-4 rounded-full shadow-lg hover:shadow-blue-500/25 transition-all duration-300 border-0 flex items-center gap-2"
                >
                  <LayoutDashboard className="h-3 w-3" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => authStore.logout()}
                  className={`text-xs font-medium h-8 px-3 rounded-full border transition-all duration-500 flex items-center gap-2 ${
                    isScrolled
                      ? "text-white/90 hover:text-white hover:bg-white/10 border-white/20"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300"
                  }`}
                >
                  <LogOut className="h-3 w-3" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                  className={`text-xs font-medium h-8 px-3 rounded-full border transition-all duration-500 ${
                    isScrolled
                      ? "text-white/90 hover:text-white hover:bg-white/10 border-white/20"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300"
                  }`}
                >
                  Sign in
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/signup")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 text-xs font-medium h-8 px-4 rounded-full shadow-lg hover:shadow-blue-500/25 transition-all duration-300 border-0"
                >
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
});

export default Navbar;
