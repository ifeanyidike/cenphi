import React, { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, TrendingUp, Users, DollarSign, Clock } from "lucide-react";

const CustomerTransformation = () => {
  const [activeStory, setActiveStory] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const transformationStories = [
    {
      company: "TechFlow",
      industry: "B2B SaaS",
      size: "50-200 employees",
      challenge: "Scattered testimonials across emails and spreadsheets. No systematic approach to collecting or using customer feedback.",
      solution: "Implemented automated collection workflows and AI analysis to identify high-converting testimonials.",
      avatar: "TF",
      timeline: "3 months",
      before: {
        testimonials: 23,
        conversionRate: 2.1,
        timeSpent: "12 hours/week",
        revenue: "$45K/month"
      },
      after: {
        testimonials: 847,
        conversionRate: 4.7,
        timeSpent: "1 hour/week",
        revenue: "$73K/month"
      },
      quote: "Cenphi didn't just organize our testimonials - it completely transformed how we think about customer feedback. The AI insights helped us understand what really drives conversions.",
      author: "Sarah Chen",
      role: "VP of Growth"
    },
    {
      company: "RetailPlus",
      industry: "E-commerce",
      size: "200-1000 employees",
      challenge: "Low response rates for testimonial requests. Difficulty showcasing customer satisfaction to drive more sales.",
      solution: "Deployed smart collection triggers and video testimonial workflows across customer touchpoints.",
      avatar: "RP",
      timeline: "6 months",
      before: {
        testimonials: 156,
        conversionRate: 3.2,
        timeSpent: "20 hours/week",
        revenue: "$180K/month"
      },
      after: {
        testimonials: 2840,
        conversionRate: 6.8,
        timeSpent: "3 hours/week",
        revenue: "$340K/month"
      },
      quote: "The automated workflows are incredible. We're now collecting 10x more testimonials with less effort, and our conversion rates have more than doubled.",
      author: "Marcus Rodriguez",
      role: "Head of Marketing"
    },
    {
      company: "GrowthLab",
      industry: "Marketing Agency",
      size: "10-50 employees",
      challenge: "Managing testimonials for multiple clients manually. No way to prove ROI or track testimonial performance.",
      solution: "White-label solution with client-specific analytics and automated content generation from testimonials.",
      avatar: "GL",
      timeline: "4 months",
      before: {
        testimonials: 67,
        conversionRate: 1.8,
        timeSpent: "25 hours/week",
        revenue: "$28K/month"
      },
      after: {
        testimonials: 1230,
        conversionRate: 5.4,
        timeSpent: "4 hours/week",
        revenue: "$67K/month"
      },
      quote: "We can now offer testimonial management as a premium service to our clients. It's become one of our most profitable service lines.",
      author: "Emily Watson",
      role: "Agency Owner"
    }
  ];

  const currentStory = transformationStories[activeStory];

  const MetricCard = ({ label, before, after, icon: Icon, format = "number" }: any) => {
    const formatValue = (value: any) => {
      if (format === "currency") return `$${value}`;
      if (format === "percentage") return `${value}%`;
      if (format === "time") return value;
      return value.toLocaleString();
    };

    const improvement = format === "time" ?
      `${Math.round(((parseFloat(before.toString()) - parseFloat(after.toString())) / parseFloat(before.toString())) * 100)}% less time` :
      `+${Math.round(((after - before) / before) * 100)}%`;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900">{label}</h4>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-500">Before</div>
              <div className="text-2xl font-bold text-gray-400">{formatValue(before)}</div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">After</div>
              <div className="text-2xl font-bold text-green-600">{formatValue(after)}</div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-sm font-semibold text-green-800">{improvement}</div>
            <div className="text-xs text-green-600">improvement</div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <section ref={ref} className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-gray-900">Real customers,</span>
            <br />
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              remarkable results
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            See how companies like yours have transformed their testimonial strategy
            and achieved measurable business growth.
          </p>
        </motion.div>

        {/* Story Navigation */}
        <div className="flex justify-center mb-16">
          <div className="flex gap-2 p-2 bg-gray-100 rounded-2xl">
            {transformationStories.map((story, index) => (
              <button
                key={index}
                onClick={() => setActiveStory(index)}
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  activeStory === index
                    ? "bg-white text-gray-900 shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {story.company}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStory}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="space-y-16"
          >
            {/* Company Info & Challenge */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                    {currentStory.avatar}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{currentStory.company}</h3>
                    <div className="text-gray-600">{currentStory.industry} • {currentStory.size}</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">The Challenge</h4>
                    <p className="text-gray-600 leading-relaxed">{currentStory.challenge}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">The Solution</h4>
                    <p className="text-gray-600 leading-relaxed">{currentStory.solution}</p>
                  </div>

                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-semibold">
                        {currentStory.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <blockquote className="text-gray-900 font-medium mb-3 leading-relaxed">
                          "{currentStory.quote}"
                        </blockquote>
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900">{currentStory.author}</div>
                          <div className="text-gray-600">{currentStory.role}, {currentStory.company}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl"></div>
                  <div className="relative">
                    <h4 className="text-xl font-bold mb-6">Transformation Timeline</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <span>Started with manual processes</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <span>Implemented Cenphi platform</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span>Achieved results in {currentStory.timeline}</span>
                      </div>
                    </div>

                    <div className="mt-8 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-1">
                          {Math.round(((currentStory.after.revenue - currentStory.before.revenue) / currentStory.before.revenue) * 100)}%
                        </div>
                        <div className="text-sm opacity-80">Revenue Growth</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Metrics */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                label="Testimonials Collected"
                before={currentStory.before.testimonials}
                after={currentStory.after.testimonials}
                icon={Users}
              />
              <MetricCard
                label="Conversion Rate"
                before={currentStory.before.conversionRate}
                after={currentStory.after.conversionRate}
                icon={TrendingUp}
                format="percentage"
              />
              <MetricCard
                label="Monthly Revenue"
                before={currentStory.before.revenue}
                after={currentStory.after.revenue}
                icon={DollarSign}
                format="currency"
              />
              <MetricCard
                label="Time Investment"
                before={currentStory.before.timeSpent}
                after={currentStory.after.timeSpent}
                icon={Clock}
                format="time"
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 text-center"
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-12 border border-blue-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Your transformation starts here
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              These results aren't outliers - they're the norm for companies that systematically
              leverage their customer testimonials with AI-powered insights.
            </p>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">Average</div>
                <div className="text-lg font-semibold text-gray-900 mb-1">156% More</div>
                <div className="text-sm text-gray-600">Testimonials Collected</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">Average</div>
                <div className="text-lg font-semibold text-gray-900 mb-1">89% Higher</div>
                <div className="text-sm text-gray-600">Conversion Rates</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">Average</div>
                <div className="text-lg font-semibold text-gray-900 mb-1">73% Less</div>
                <div className="text-sm text-gray-600">Time Investment</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CustomerTransformation;