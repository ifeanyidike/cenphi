import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useScroll,
  AnimatePresence,
} from "framer-motion";
import { Quote, MessageSquare, Users, Award, TrendingUp } from "lucide-react";

// Artistic canvas background component
const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
    }> = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
    }

    const animate = () => {
      ctx.fillStyle = "rgba(17, 24, 39, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139, 92, 246, 0.5)";
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
};

// Dynamic text reveal component
const RevealText = ({ text }: { text: string }) => {
  return (
    <div className="overflow-hidden">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {text}
      </motion.div>
    </div>
  );
};

// Magnetic Button Component
const MagneticButton = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    x.set(mouseX - centerX);
    y.set(mouseY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const transformX = useTransform(mouseXSpring, [-100, 100], [-15, 15]);
  const transformY = useTransform(mouseYSpring, [-100, 100], [-15, 15]);

  return (
    <motion.button
      ref={ref}
      style={{ x: transformX, y: transformY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
};

// Interactive Stats Card
const StatsCard = ({
  icon: Icon,
  value,
  label,
}: {
  icon: any;
  value: string;
  label: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
      whileHover={{ scale: 1.05, rotateY: 10 }}
      animate={{ rotateX: isHovered ? 10 : 0 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl"
        animate={{
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1.1 : 1,
        }}
      />
      <div className="relative z-10">
        <Icon className="w-8 h-8 text-purple-400 mb-4" />
        <div className="text-3xl font-bold text-white mb-2">{value}</div>
        <div className="text-gray-400">{label}</div>
      </div>
    </motion.div>
  );
};

// Main Component
const UltraPremiumHero = () => {
  const [activeIndex] = useState(0);
  const { scrollYProgress } = useScroll();
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const testimonials = [
    {
      id: "1",
      content:
        "This platform has transformed how we engage with our customers. The innovative approach to testimonial collection has increased our conversion rate by 150%.",
      author: "Alexandra Chen",
      role: "Head of Customer Success",
      company: "InnovateX",
      rating: 5,
      imageUrl: "/api/placeholder/400/400",
      stats: { responses: "2.5K", satisfaction: "98%", growth: "+150%" },
    },
    {
      id: "2",
      content:
        "This platform has transformed how we engage with our customers. The innovative approach to testimonial collection has increased our conversion rate by 150%.",
      author: "Edward Ogon",
      role: "Head of Executive Success",
      company: "InnovateX",
      rating: 5,
      imageUrl: "/api/placeholder/400/400",
      stats: { responses: "2.5K", satisfaction: "98%", growth: "+150%" },
    },
    {
      id: "3",
      content:
        "This platform has transformed how we engage with our customers. The innovative approach to testimonial collection has increased our conversion rate by 150%.",
      author: "Desmond Sams",
      role: "Head of Engineering Success",
      company: "InnovateX",
      rating: 5,
      imageUrl: "/api/placeholder/400/400",
      stats: { responses: "2.5K", satisfaction: "98%", growth: "+150%" },
    },
    // Add more testimonials...
  ];

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const rotateX = useTransform(mouseY, [0, 300], [5, -5]);
  const rotateY = useTransform(mouseX, [0, 300], [-5, 5]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen bg-gray-900 overflow-hidden"
    >
      {/* Animated background */}
      <AnimatedBackground />

      {/* Main content */}
      <div className="relative container mx-auto px-4 py-24">
        <motion.div
          style={{ perspective: 1000 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
        >
          {/* Left column */}
          <div className="lg:col-span-6 space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <h1 className="text-6xl md:text-8xl font-bold">
                <RevealText text="Transform" />
                <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
                  <RevealText text="Testimonials" />
                </div>
                <RevealText text="Into Trust" />
              </h1>

              <p className="text-xl text-gray-400 max-w-xl">
                Experience the next generation of testimonial collection and
                showcase platform.
              </p>
            </motion.div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-6">
              <StatsCard icon={Users} value="50K+" label="Active Users" />
              <StatsCard
                icon={MessageSquare}
                value="100K+"
                label="Testimonials"
              />
              <StatsCard icon={Award} value="98%" label="Satisfaction" />
              <StatsCard icon={TrendingUp} value="150%" label="Avg. Growth" />
            </div>

            {/* CTA buttons */}
            <div className="flex gap-6">
              <MagneticButton className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transition-shadow">
                Start Free Trial
              </MagneticButton>
              <MagneticButton className="px-8 py-4 bg-white/5 backdrop-blur-lg rounded-full font-semibold text-white border border-white/10 hover:bg-white/10 transition-colors">
                View Demo
              </MagneticButton>
            </div>
          </div>

          {/* Right column - Testimonial showcase */}
          <div className="lg:col-span-6">
            <motion.div style={{ rotateX, rotateY }} className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl"
                >
                  {/* Decorative elements */}
                  <div className="absolute -top-4 -left-4 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl" />
                  <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl" />

                  {/* Content */}
                  <Quote className="w-12 h-12 text-purple-400 mb-6" />

                  <p className="text-2xl text-white mb-8 leading-relaxed">
                    {testimonials[activeIndex].content}
                  </p>

                  <div className="flex items-center gap-6">
                    <motion.img
                      src={testimonials[activeIndex].imageUrl}
                      alt={testimonials[activeIndex].author}
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-purple-500/20"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    />
                    <div>
                      <div className="text-xl text-white font-semibold">
                        {testimonials[activeIndex].author}
                      </div>
                      <div className="text-gray-400">
                        {testimonials[activeIndex].role} at{" "}
                        {testimonials[activeIndex].company}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-8 p-4 bg-white/5 rounded-xl">
                    <div className="text-center">
                      <div className="text-purple-400 font-medium">
                        Responses
                      </div>
                      <div className="text-2xl text-white font-bold">
                        {testimonials[activeIndex].stats.responses}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-400 font-medium">
                        Satisfaction
                      </div>
                      <div className="text-2xl text-white font-bold">
                        {testimonials[activeIndex].stats.satisfaction}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-400 font-medium">Growth</div>
                      <div className="text-2xl text-white font-bold">
                        {testimonials[activeIndex].stats.growth}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Scroll progress indicator */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"
        style={{ scaleX: scrollYProgress }}
        initial={{ scaleX: 0 }}
      />
    </div>
  );
};

export default UltraPremiumHero;
