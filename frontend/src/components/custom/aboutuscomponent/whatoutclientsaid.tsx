import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: "Sarah M.",
    role: "Project Manager",
    text: "Our team collaboration has improved dramatically. The intuitive interface and seamless integration have transformed how we manage projects on time, every time.",
    rating: 5
  },
  {
    name: "John D.",
    role: "Marketing Director",
    text: "A must-have for every growing business. Powerful project management features that keep our team aligned and productive.",
    rating: 5
  },
  {
    name: "Emily R.",
    role: "Operations Lead",
    text: "Task management made simple and efficient. Streamlined workflows and real-time tracking have been game-changing for our team.",
    rating: 5
  },
  {
    name: "Michael T.",
    role: "Startup Founder",
    text: "The recurring task feature has been a lifesaver. Taskable makes sure of our most critical daily tasks, keeping our productivity focused.",
    rating: 5
  },
  {
    name: "Lisa G.",
    role: "Design Manager",
    text: "Hands-down collaboration tool. It's intuitive, quick, and integrates seamlessly with our existing workflow.",
    rating: 5
  },
  {
    name: "David M.",
    role: "Remote Team Lead",
    text: "The ultimate tool for remote collaboration. Boosted our productivity in no time, with amazing features that keep our distributed team connected.",
    rating: 5
  }
];

const TestimonialCard = ({ name, role, text, rating }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.03 }}
      className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-8 space-y-6 relative overflow-hidden shadow-2xl hover:shadow-4xl transition-all duration-300 group"
    >
      {/* Quote Icon */}
      <Quote className="absolute top-4 left-4 w-12 h-12 text-blue-400/20 group-hover:text-blue-400/40 transition-colors duration-300" />

      {/* Rating Stars */}
      <div className="flex space-x-1 mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star 
            key={i} 
            className="w-6 h-6 text-yellow-400 fill-yellow-400"
          />
        ))}
      </div>

      {/* Testimonial Text */}
      <p className="text-gray-300 text-lg leading-relaxed mb-6 relative z-10">
        {text}
      </p>

      {/* User Info */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
          {name.charAt(0)}
        </div>
        <div>
          <h4 className="text-white font-semibold">{name}</h4>
          <p className="text-gray-400 text-sm">{role}</p>
        </div>
      </div>

      {/* Subtle Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
    </motion.div>
  );
};

const TestimonialGrid = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-16 px-6">
      <div className="container mx-auto">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-4">
            What Our Users Say
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Real insights from businesses that have transformed their workflow with our platform.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialGrid;