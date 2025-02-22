"use client";
// Due to length, this will be split into multiple parts. Here's Part 1 - Imports and Core Components:

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useScroll,
  AnimatePresence,
  MotionValue,
} from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  Star,
  Quote,
  MessageSquare,
  Award,
  Sparkles,
  Shield,
  Target,
  TrendingUp,
  ArrowRight,
  Users,
  Globe,
  Zap,
} from "lucide-react";

// Custom hook for smooth mouse tracking
const useSmoothMouse = () => {
  const mouse = {
    x: useMotionValue(0),
    y: useMotionValue(0),
  };

  const smoothMouse = {
    x: useSpring(mouse.x, { stiffness: 300, damping: 30, mass: 0.5 }),
    y: useSpring(mouse.y, { stiffness: 300, damping: 30, mass: 0.5 }),
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x.set(e.clientX);
      mouse.y.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return { mouse, smoothMouse };
};

// WebGL shader for background effect
const fragmentShader = `
  precision mediump float;
  uniform float time;
  uniform vec2 resolution;
  uniform vec2 mousePosition;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec2 mouse = mousePosition / resolution.xy;

    float dist = length(uv - mouse);
    vec3 color1 = vec3(0.3, 0.2, 0.5);
    vec3 color2 = vec3(0.9, 0.4, 0.7);

    float wave = sin(dist * 10.0 - time) * 0.5 + 0.5;
    vec3 color = mix(color1, color2, wave);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const vertexShader = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Enhanced WebGL Background with interactive fluid effect
const WebGLBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { mouse } = useSmoothMouse();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2");
    if (!gl) return;

    // Initialize shaders
    const program = gl.createProgram()!;
    const vShader = gl.createShader(gl.VERTEX_SHADER)!;
    const fShader = gl.createShader(gl.FRAGMENT_SHADER)!;

    gl.shaderSource(vShader, vertexShader);
    gl.shaderSource(fShader, fragmentShader);
    gl.compileShader(vShader);
    gl.compileShader(fShader);
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Set up attributes and uniforms
    const positionLocation = gl.getAttribLocation(program, "position");
    const timeLocation = gl.getUniformLocation(program, "time");
    const resolutionLocation = gl.getUniformLocation(program, "resolution");
    const mouseLocation = gl.getUniformLocation(program, "mousePosition");

    // Create vertex buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    // Animation loop
    let animationFrame: number;
    const render = (time: number) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform1f(timeLocation, time * 0.001);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform2f(mouseLocation, mouse.x.get(), mouse.y.get());

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrame = requestAnimationFrame(render);
    };

    render(0);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0"
      style={{ opacity: 0.8 }}
    />
  );
};

// Particle System
const ParticleSystem = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { smoothMouse } = useSmoothMouse();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      life: number;
      opacity: number;
    }

    const particles: Particle[] = [];
    const particleCount = 100;

    const createParticle = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 2,
      speedY: (Math.random() - 0.5) * 2,
      life: Math.random() * 100 + 100,
      opacity: Math.random(),
    });

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.life--;
        particle.opacity = particle.life / 200;

        // Mouse interaction
        const dx = particle.x - smoothMouse.x.get();
        const dy = particle.y - smoothMouse.y.get();
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 100) {
          particle.x += dx * 0.02;
          particle.y += dy * 0.02;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 51, 234, ${particle.opacity})`;
        ctx.fill();

        if (particle.life <= 0) {
          particles[index] = createParticle();
        }
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />
  );
};

// Part 2 - Interactive Components and Animations:

// Enhanced Magnetic Button with ripple effect
const MagneticButton = ({
  children,
  className,
  primary = false,
}: {
  children: React.ReactNode;
  className?: string;
  primary?: boolean;
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<
    Array<{ x: number; y: number; id: number }>
  >([]);
  const rippleId = useRef(0);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);

  const mouseX = useSpring(x, { stiffness: 500, damping: 50 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 50 });
  const mouseScale = useSpring(scale, { stiffness: 500, damping: 50 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    x.set(distanceX * 0.1);
    y.set(distanceY * 0.1);
    scale.set(1.05);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    scale.set(1);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    rippleId.current += 1;
    setRipples((prev) => [...prev, { x, y, id: rippleId.current }]);

    setTimeout(() => {
      setRipples((prev) =>
        prev.filter((ripple) => ripple.id !== rippleId.current)
      );
    }, 1000);
  };

  return (
    <motion.button
      ref={buttonRef}
      style={{
        x: mouseX,
        y: mouseY,
        scale: mouseScale,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`relative overflow-hidden ${
        primary
          ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white"
          : "bg-white/5 text-white backdrop-blur-lg border border-white/10"
      } rounded-full px-8 py-4 font-semibold ${className}`}
      whileTap={{ scale: 0.95 }}
    >
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full"
          initial={{
            width: 0,
            height: 0,
            x: ripple.x,
            y: ripple.y,
            opacity: 0.5,
          }}
          animate={{
            width: 500,
            height: 500,
            x: ripple.x - 250,
            y: ripple.y - 250,
            opacity: 0,
          }}
          transition={{
            duration: 1,
            ease: "easeOut",
          }}
        />
      ))}
      {children}
    </motion.button>
  );
};

// Enhanced 3D Stats Card
const StatsCard = ({
  icon: Icon,
  value,
  label,
  delay = 0,
}: {
  icon: any;
  value: string;
  label: string;
  delay?: number;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [ref, inView] = useInView({ threshold: 0.2 });

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [30, -30]);
  const rotateY = useTransform(x, [-100, 100], [-30, 30]);
  const bgOpacity = useTransform(y, [-100, 0, 100], [0.2, 0.4, 0.2]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();

    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ perspective: 1000 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
      transition={{ duration: 0.8, delay }}
    >
      <motion.div
        ref={cardRef}
        className="relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/10"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ z: 10 }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-pink-500/20 rounded-xl"
          style={{ opacity: bgOpacity }}
        />

        <motion.div
          style={{ transform: "translateZ(20px)" }}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
        >
          <Icon className="w-8 h-8 text-purple-400 mb-4" />
          <motion.div
            className="text-3xl font-bold text-white mb-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: delay + 0.2 }}
          >
            {value}
          </motion.div>
          <motion.div
            className="text-gray-400"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: delay + 0.3 }}
          >
            {label}
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute -bottom-2 -right-2 w-20 h-20 bg-purple-500/10 rounded-full blur-xl"
          animate={{
            scale: isHovered ? 1.2 : 1,
            opacity: isHovered ? 0.8 : 0.4,
          }}
        />
      </motion.div>
    </motion.div>
  );
};

// Part 3 - Main Component and Advanced Features:

// Testimonial data type
interface Testimonial {
  id: string;
  content: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
  rating: number;
  tags: string[];
  featured?: boolean;
}

// Floating testimonial card with parallax effect
const TestimonialCard = ({
  testimonial,
  index,
}: {
  testimonial: Testimonial;
  index: number;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const x = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);
  const brightness = useTransform(y, [-100, 0, 100], [1.2, 1, 0.8]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      className="relative p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10"
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        filter: `brightness(${brightness})`,
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.2 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <div style={{ transform: "translateZ(20px)" }}>
        <Quote className="w-8 h-8 text-purple-400 mb-4" />
        <p className="text-white/90 text-lg mb-6">{testimonial.content}</p>

        <div className="flex items-center gap-4">
          {testimonial.avatar ? (
            <img
              src={testimonial.avatar}
              alt={testimonial.author}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                {testimonial.author[0]}
              </span>
            </div>
          )}

          <div>
            <h4 className="text-white font-semibold">{testimonial.author}</h4>
            <p className="text-gray-400 text-sm">
              {testimonial.role} at {testimonial.company}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
          ))}
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          {testimonial.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/70"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Main Hero Component
const TestimonialHero2 = () => {
  const [activeTab, setActiveTab] = useState("featured");
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const testimonials: Testimonial[] = [
    {
      id: "1",
      content:
        "This platform transformed how we collect and showcase customer feedback. The AI-powered insights are game-changing!",
      author: "Sarah Chen",
      role: "Head of Marketing",
      company: "TechVision",
      rating: 5,
      tags: ["AI-Powered", "Enterprise", "Marketing"],
      featured: true,
    },
    {
      id: "2",
      content:
        "This platform transformed how we collect and showcase customer feedback. The AI-powered insights are game-changing!",
      author: "Sarah Chen",
      role: "Head of Marketing",
      company: "TechVision",
      rating: 5,
      tags: ["AI-Powered", "Enterprise", "Marketing"],
      featured: true,
    },
    {
      id: "3",
      content:
        "This platform transformed how we collect and showcase customer feedback. The AI-powered insights are game-changing!",
      author: "Sarah Chen",
      role: "Head of Marketing",
      company: "TechVision",
      rating: 5,
      tags: ["AI-Powered", "Enterprise", "Marketing"],
      featured: true,
    },
    {
      id: "4",
      content:
        "This platform transformed how we collect and showcase customer feedback. The AI-powered insights are game-changing!",
      author: "Sarah Chen",
      role: "Head of Marketing",
      company: "TechVision",
      rating: 5,
      tags: ["AI-Powered", "Enterprise", "Marketing"],
      featured: true,
    },
    {
      id: "5",
      content:
        "This platform transformed how we collect and showcase customer feedback. The AI-powered insights are game-changing!",
      author: "Sarah Chen",
      role: "Head of Marketing",
      company: "TechVision",
      rating: 5,
      tags: ["AI-Powered", "Enterprise", "Marketing"],
      featured: true,
    },
    // Add more testimonials as needed
  ];

  const stats = [
    { icon: Users, value: "100K+", label: "Happy Customers" },
    { icon: Star, value: "4.9", label: "Average Rating" },
    { icon: MessageSquare, value: "1M+", label: "Testimonials Collected" },
    { icon: Award, value: "50+", label: "Industry Awards" },
  ];

  return (
    <motion.div
      className="min-h-screen bg-gray-900 relative overflow-hidden"
      style={{ opacity }}
    >
      <WebGLBackground />
      <ParticleSystem />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.h1
            className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-6"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            Voice of Success
          </motion.h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Transform your testimonials into powerful stories with our
            AI-powered platform
          </p>

          <div className="flex justify-center gap-4 mt-8">
            <MagneticButton primary>
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2 inline" />
            </MagneticButton>
            <MagneticButton>Watch Demo</MagneticButton>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <StatsCard
              key={stat.label}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              delay={index * 0.1}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {testimonials
              .filter(
                (t) =>
                  activeTab === "all" ||
                  (activeTab === "featured" && t.featured)
              )
              .map((testimonial, index) => (
                <TestimonialCard
                  key={testimonial.id}
                  testimonial={testimonial}
                  index={index}
                />
              ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default TestimonialHero2;
