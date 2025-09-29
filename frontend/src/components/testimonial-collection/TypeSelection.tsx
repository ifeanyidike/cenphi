import React from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Star,
  Shield,
  Award,
  Clock,
  Target,
  Users,
  TrendingUp,
  BarChart3,
} from "lucide-react";

// Statistics for social proof
const STATS = [
  { value: "50K+", label: "Happy Customers", icon: Users },
  { value: "94%", label: "Satisfaction Rate", icon: TrendingUp },
  { value: "2.4M+", label: "Revenue Generated", icon: BarChart3 },
];

// Example testimonials for background
const EXAMPLE_TESTIMONIALS = [
  {
    name: "Sarah Chen",
    company: "TechFlow",
    rating: 5,
    text: "Increased our conversion rate by 47%",
  },
  {
    name: "Marcus Rodriguez",
    company: "GrowthLabs",
    rating: 5,
    text: "40x more testimonials processed",
  },
  {
    name: "Emily Watson",
    company: "ScaleUp",
    rating: 5,
    text: "Saves us 15 hours per week",
  },
];

interface TypeSelectionProps {
  onSelectType: (type: "video" | "text") => void;
}

const TypeSelection: React.FC<TypeSelectionProps> = ({ onSelectType }) => {
  return (
    <div className="relative max-w-6xl mx-auto">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-80 h-80 bg-blue-100/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-purple-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Share Your Success Story
            </h1>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Join thousands of customers who've shared their experience and
              helped others make informed decisions.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mb-6">
              {STATS.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <stat.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-green-500" />
                <span>100% Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="h-3 w-3 text-blue-500" />
                <span>Featured Reviews</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-purple-500" />
                <span>2 Min Setup</span>
              </div>
            </div>
          </motion.div>

          {/* Type Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -4, scale: 1.02 }}
              onClick={() => onSelectType("video")}
              className="relative group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all text-left overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Video Testimonial
                    </h3>
                    <p className="text-sm text-gray-500">Recording studio</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  Record a personal video message with our recording studio.
                  More engaging and builds stronger trust.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>2 min max</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span>Guided</span>
                    </div>
                  </div>
                  <div className="text-blue-600 font-semibold text-sm">
                    Recommended
                  </div>
                </div>
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ y: -4, scale: 1.02 }}
              onClick={() => onSelectType("text")}
              className="relative group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-300 hover:shadow-lg transition-all text-left overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Written Review
                    </h3>
                    <p className="text-sm text-gray-500">Quick & detailed</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  Share your experience in writing with our guided form. Perfect
                  for detailed feedback.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>3 min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span>Structured</span>
                    </div>
                  </div>
                  <div className="text-green-600 font-semibold text-sm">
                    Fast Track
                  </div>
                </div>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Example testimonials */}
        <div className="mt-12">
          <p className="text-center text-sm text-gray-500 mb-4">
            See how others have shared their success
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {EXAMPLE_TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-3 w-3 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  "{testimonial.text}"
                </p>
                <div className="text-xs text-gray-500">
                  <div className="font-medium">{testimonial.name}</div>
                  <div>{testimonial.company}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypeSelection;