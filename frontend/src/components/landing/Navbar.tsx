import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Sparkles,
  Video,
  BarChart3,
  Zap,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
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
      name: "Content Generation",
      desc: "Transform testimonials into marketing assets",
      icon: Sparkles,
    },
    {
      name: "Video Processing",
      desc: "Multi-platform video optimization",
      icon: Video,
    },
    {
      name: "Analytics & Insights",
      desc: "Track performance and ROI",
      icon: BarChart3,
    },
    {
      name: "Automation",
      desc: "Streamline collection and distribution",
      icon: Zap,
    },
  ];

  const solutions = [
    {
      name: "For Marketing Teams",
      desc: "Content creation & social media automation",
      link: "/for-marketing",
      metric: "15 hrs/week saved",
    },
    {
      name: "For Sales Teams",
      desc: "Close deals faster with social proof",
      link: "/for-sales",
      metric: "+73% close rate",
    },
    {
      name: "For Product Teams",
      desc: "Optimize conversions with testimonials",
      link: "/for-product",
      metric: "+47% conversions",
    },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/98 backdrop-blur-xl shadow-lg border-b border-gray-200"
          : "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-sm uppercase font-bold tracking-wide text-gray-900 transition-colors duration-300">
              Cenphi
            </span>
          </Link>

          {/* Navigation */}
          <div className="hidden lg:flex items-center bg-gray-50 rounded-full px-1 py-1 border border-gray-200 gap-1">
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown("services")}
              onMouseLeave={closeDropdown}
            >
              <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full transition-all duration-200 text-gray-700 hover:text-gray-900 hover:bg-white">
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
                    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-96 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xl"
                  >
                    <div className="p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide mb-4 text-gray-500">
                        Our Services
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {services.map((service, i) => (
                          <motion.button
                            key={i}
                            onClick={() => navigate("/studio")}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-3 p-3 rounded-lg transition-all duration-200 text-left group hover:bg-gray-50"
                          >
                            <div className="text-gray-600 mt-1">
                              <service.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="text-xs font-semibold mb-0.5 text-gray-900">
                                {service.name}
                              </div>
                              <div className="text-xs leading-relaxed text-gray-600">
                                {service.desc}
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                      <div className="border-t border-gray-200 mt-4 pt-4">
                        <button
                          onClick={() => navigate("/studio")}
                          className="w-full bg-blue-600 text-white text-xs font-medium py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
                        >
                          Explore Platform →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown("solutions")}
              onMouseLeave={closeDropdown}
            >
              <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full transition-all duration-200 text-gray-700 hover:text-gray-900 hover:bg-white">
                Solutions
                <ChevronDown className="h-3 w-3 transition-transform duration-200" />
              </button>
              <AnimatePresence>
                {activeDropdown === "solutions" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xl"
                  >
                    <div className="p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide mb-4 text-gray-500">
                        Choose Your Team
                      </div>
                      <div className="space-y-2">
                        {solutions.map((solution, i) => (
                          <motion.button
                            key={i}
                            onClick={() => navigate(solution.link)}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 text-left group hover:bg-gray-50"
                          >
                            <div className="flex-1">
                              <div className="text-xs font-semibold mb-0.5 text-gray-900">
                                {solution.name}
                              </div>
                              <div className="text-xs leading-relaxed text-gray-600">
                                {solution.desc}
                              </div>
                            </div>
                            <div className="ml-3 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold whitespace-nowrap">
                              {solution.metric}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/why-cenphi"
              className="px-4 py-2 text-xs font-medium rounded-full transition-all duration-200 text-gray-700 hover:text-gray-900 hover:bg-white"
            >
              Why Cenphi
            </Link>
            {/* <Link
              to="/pricing"
              className="px-4 py-2 text-xs font-medium rounded-full transition-all duration-200 text-gray-700 hover:text-gray-900 hover:bg-white"
            >
              Pricing
            </Link> */}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            {authStore.isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                  Logged in
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium h-9 px-4 rounded-full shadow-sm hover:shadow-md transition-all duration-200 border-0 flex items-center gap-2"
                >
                  <LayoutDashboard className="h-3 w-3" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => authStore.logout()}
                  className="text-xs font-medium h-9 px-3 rounded-full border transition-all duration-200 flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300"
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
                  className="text-xs font-medium h-9 px-3 rounded-full border transition-all duration-200 text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300"
                >
                  Sign in
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/signup")}
                  className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium h-9 px-4 rounded-full shadow-sm hover:shadow-md transition-all duration-200 border-0"
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
