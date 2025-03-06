// import React, { useState, useEffect } from "react";
// import {
//   ArrowRight,
//   Share2,
//   Code,
//   MessageSquare,
//   Sparkles,
//   ExternalLink,
//   Check,
// } from "lucide-react";

// const TestimonialPlatformShowcase = () => {
//   const [activeTab, setActiveTab] = useState("widget");
//   const [isAnimating, setIsAnimating] = useState(false);

//   // Simulated testimonial data
//   const testimonials = [
//     {
//       id: 1,
//       author: "Sarah J.",
//       company: "TechVision",
//       avatar: "https://randomuser.me/api/portraits/women/22.jpg",
//       content:
//         "This platform transformed how we display social proof. Our conversion rate increased by 37% in just two weeks!",
//     },
//     {
//       id: 2,
//       author: "Michael R.",
//       company: "Crowdsurge",
//       avatar: "https://randomuser.me/api/portraits/women/33.jpg",
//       content:
//         "The embeddable widgets are so seamless and elegant. Our website visitors now spend 2x more time on our pages.",
//     },
//     {
//       id: 3,
//       author: "Elena K.",
//       company: "Novastride",
//       avatar: "https://randomuser.me/api/portraits/women/44.jpg",
//       content:
//         "I can't believe how easy it is to collect and showcase testimonials. This is truly a game-changer for our startup.",
//     },
//   ];

//   // Demo website preview
//   const websitePreview = () => (
//     <div className="relative w-full overflow-hidden rounded-xl shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
//       <div className="h-8 bg-gray-200 flex items-center px-4 space-x-2">
//         <div className="w-3 h-3 rounded-full bg-red-500"></div>
//         <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
//         <div className="w-3 h-3 rounded-full bg-green-500"></div>
//         <div className="ml-4 text-xs text-gray-500 flex-1 text-center">
//           www.example.com
//         </div>
//       </div>
//       <div className="p-6">
//         <div className="mb-6">
//           <div className="h-8 w-3/4 bg-gray-300 rounded mb-3"></div>
//           <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
//           <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
//           <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
//         </div>

//         <div className="mb-6 relative">
//           <div className="absolute -top-10 -right-10 z-10">
//             <div className="animate-ping absolute inline-flex h-32 w-32 rounded-full bg-purple-400 opacity-10"></div>
//             <div className="relative inline-flex rounded-full h-12 w-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 items-center justify-center">
//               <div className="text-white text-xs font-bold">Widget</div>
//             </div>
//           </div>
//           <div className="relative z-0 p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 shadow-inner border border-purple-100">
//             <div className="h-6 w-48 bg-gradient-to-r from-indigo-500 to-purple-500 rounded mb-4 text-white text-xs flex items-center justify-center font-medium">
//               Our Customer Stories
//             </div>
//             <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
//               {testimonials.map((testimonial) => (
//                 <div
//                   key={testimonial.id}
//                   className="flex-shrink-0 w-64 p-3 bg-white rounded-lg shadow-md border border-purple-100 transform transition hover:-translate-y-1"
//                 >
//                   <div className="flex items-center mb-2">
//                     <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-300 to-purple-300 flex items-center justify-center text-white text-xs">
//                       {testimonial.author.split(" ")[0][0]}
//                       {testimonial.author.split(" ")[1][0]}
//                     </div>
//                     <div className="ml-3">
//                       <div className="text-sm font-semibold">
//                         {testimonial.author}
//                       </div>
//                       <div className="text-xs text-gray-500">
//                         {testimonial.company}
//                       </div>
//                     </div>
//                   </div>
//                   <div className="text-xs text-gray-700">
//                     {testimonial.content}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         <div>
//           <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
//           <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
//           <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
//         </div>
//       </div>
//     </div>
//   );

//   // Social media preview
//   const socialMediaPreview = () => (
//     <div className="grid grid-cols-2 gap-4">
//       <div className="rounded-xl overflow-hidden shadow-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
//         <div className="h-10 bg-blue-600 flex items-center px-4">
//           <div className="text-white text-sm font-semibold">Social Network</div>
//         </div>
//         <div className="p-4">
//           <div className="flex items-start mb-3">
//             <div className="w-10 h-10 rounded-full bg-blue-300 flex-shrink-0"></div>
//             <div className="ml-3 flex-1">
//               <div className="text-sm font-semibold">Your Company</div>
//               <div className="text-xs text-gray-500 mb-2">1h ago</div>
//               <div className="text-xs mb-2">
//                 Hear what our customers are saying about us!
//               </div>
//               <div className="p-3 bg-white rounded-lg border border-blue-200 text-xs mb-2">
//                 "{testimonials[0].content}" - {testimonials[0].author},{" "}
//                 {testimonials[0].company}
//               </div>
//               <div className="flex text-xs text-gray-500">
//                 <div className="mr-3 flex items-center">
//                   <div className="mr-1">❤️</div> 24
//                 </div>
//                 <div className="flex items-center">
//                   <div className="mr-1">💬</div> 3
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="rounded-xl overflow-hidden shadow-lg bg-gradient-to-r from-pink-50 to-red-50 border border-red-200">
//         <div className="h-10 bg-gradient-to-r from-pink-500 to-red-500 flex items-center px-4">
//           <div className="text-white text-sm font-semibold">
//             Visual Platform
//           </div>
//         </div>
//         <div className="p-4">
//           <div className="flex items-start">
//             <div className="w-10 h-10 rounded-full bg-pink-300 flex-shrink-0"></div>
//             <div className="ml-3 flex-1">
//               <div className="text-sm font-semibold">Your Company</div>
//               <div className="text-xs text-gray-500 mb-2">3h ago</div>
//               <div className="mb-2 bg-gradient-to-r from-pink-200 to-red-200 h-32 rounded-lg flex items-center justify-center">
//                 <div className="bg-white p-3 rounded-lg shadow-md w-4/5 text-xs text-center">
//                   "{testimonials[1].content}" - {testimonials[1].author}
//                 </div>
//               </div>
//               <div className="flex text-xs text-gray-500">
//                 <div className="mr-3 flex items-center">
//                   <div className="mr-1">❤️</div> 42
//                 </div>
//                 <div className="flex items-center">
//                   <div className="mr-1">💬</div> 7
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   // Embed code preview
//   const embedCodePreview = () => (
//     <div className="rounded-xl overflow-hidden shadow-lg bg-gray-900 border border-gray-700">
//       <div className="h-10 bg-gray-800 flex items-center px-4">
//         <div className="text-gray-300 text-sm font-semibold">
//           Embed Code Generator
//         </div>
//       </div>
//       <div className="p-4">
//         <div className="mb-4">
//           <div className="mb-2 text-xs text-gray-400">
//             Select your widget style:
//           </div>
//           <div className="grid grid-cols-3 gap-2 mb-4">
//             <div className="p-2 rounded-md bg-gray-800 border border-purple-500 text-center text-xs text-white">
//               Modern
//             </div>
//             <div className="p-2 rounded-md bg-gray-800 border border-gray-700 text-center text-xs text-gray-400">
//               Classic
//             </div>
//             <div className="p-2 rounded-md bg-gray-800 border border-gray-700 text-center text-xs text-gray-400">
//               Minimal
//             </div>
//           </div>
//           <div className="mb-2 text-xs text-gray-400">
//             Choose testimonials to display:
//           </div>
//           <div className="space-y-2 mb-4">
//             {testimonials.map((testimonial) => (
//               <div key={testimonial.id} className="flex items-center">
//                 <div className="w-4 h-4 rounded-sm bg-gray-800 border border-purple-500 flex items-center justify-center mr-2">
//                   <Check size={12} className="text-purple-500" />
//                 </div>
//                 <div className="text-xs text-gray-300">
//                   {testimonial.author} - {testimonial.company}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//         <div className="bg-gray-800 p-3 rounded-md font-mono text-xs text-green-400 mb-4">
//           <div>
//             &lt;script
//             src="https://testimonial-platform.com/widget.js"&gt;&lt;/script&gt;
//           </div>
//           <div>
//             &lt;div class="testimonial-widget" data-id="xyz123"
//             data-style="modern"&gt;&lt;/div&gt;
//           </div>
//         </div>
//         <button className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-2 rounded-md text-white text-xs font-semibold flex items-center justify-center">
//           <Code size={14} className="mr-2" /> Copy Embed Code
//         </button>
//       </div>
//     </div>
//   );

//   // For animation effect
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setIsAnimating(true);
//       setTimeout(() => setIsAnimating(false), 2000);
//     }, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div className="w-full bg-black py-20 px-8 relative overflow-hidden rounded-none lg:rounded-tr-[10%]">
//       {/* Background visual elements */}
//       <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
//         <div className="absolute top-10 left-10 w-32 h-32 bg-purple-600 rounded-full filter blur-3xl"></div>
//         <div className="absolute bottom-10 right-10 w-48 h-48 bg-blue-600 rounded-full filter blur-3xl"></div>
//         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-600 rounded-full filter blur-3xl"></div>

//         {/* Grid pattern */}
//         <div
//           className="absolute top-0 left-0 w-full h-full"
//           style={{
//             backgroundImage:
//               "radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
//             backgroundSize: "20px 20px",
//           }}
//         ></div>
//       </div>

//       {/* Main content */}
//       <div className="relative z-10 max-w-6xl mx-auto">
//         <div className="text-center mb-14">
//           <div className="inline-block px-4 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full text-xs text-white font-medium mb-4">
//             Revolutionary Testimonial Sharing
//           </div>
//           <h2 className="text-4xl font-bold text-white mb-4">
//             Showcase Trust{" "}
//             <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
//               Everywhere
//             </span>
//           </h2>
//           <p className="text-gray-300 max-w-2xl mx-auto">
//             Share powerful customer stories across multiple platforms with our
//             cutting-edge embedding technology
//           </p>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-14">
//           <div
//             className={`bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-700 shadow-xl transform transition duration-500 ${
//               isAnimating ? "translate-y-2" : ""
//             }`}
//           >
//             <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center mb-4">
//               <Code size={20} className="text-white" />
//             </div>
//             <h3 className="text-white text-xl font-semibold mb-2">
//               Embeddable Widgets
//             </h3>
//             <p className="text-gray-400 mb-4 text-sm">
//               Add beautiful testimonial widgets to any website with a simple
//               embed code. Fully customizable and responsive.
//             </p>
//             <button className="text-indigo-300 text-sm flex items-center font-medium">
//               Learn more <ArrowRight size={16} className="ml-2" />
//             </button>
//           </div>

//           {/* <div
//             className={`bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-700 shadow-xl transform transition duration-500 ${
//               isAnimating ? "translate-y-2" : ""
//             }`}
//           >
//             <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center mb-4">
//               <Code size={20} className="text-white" />
//             </div>
//             <h3 className="text-white text-xl font-semibold mb-2">
//               Smart AI Placement
//             </h3>
//             <p className="text-gray-400 mb-4 text-sm">
//               Our AI analyzes your site to determine the optimal placement for
//               testimonials, maximizing conversion impact."
//             </p>
//             <button className="text-indigo-300 text-sm flex items-center font-medium">
//               Learn more <ArrowRight size={16} className="ml-2" />
//             </button>
//           </div> */}

//           <div
//             className={`bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-700 shadow-xl transform transition duration-500 ${
//               isAnimating ? "translate-y-2" : ""
//             } delay-100`}
//           >
//             <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
//               <Share2 size={20} className="text-white" />
//             </div>
//             <h3 className="text-white text-xl font-semibold mb-2">
//               Social Media Sharing
//             </h3>
//             <p className="text-gray-400 mb-4 text-sm">
//               Share testimonials directly to social platforms with beautiful,
//               branded templates that drive engagement.
//             </p>
//             <button className="text-blue-300 text-sm flex items-center font-medium">
//               Learn more <ArrowRight size={16} className="ml-2" />
//             </button>
//           </div>

//           <div
//             className={`bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-700 shadow-xl transform transition duration-500 ${
//               isAnimating ? "translate-y-2" : ""
//             } delay-200`}
//           >
//             <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center mb-4">
//               <Sparkles size={20} className="text-white" />
//             </div>
//             <h3 className="text-white text-xl font-semibold mb-2">
//               AI-Enhanced Display
//             </h3>
//             <p className="text-gray-400 mb-4 text-sm">
//               Our AI technology highlights the most impactful testimonials based
//               on your visitors' behavior and interests.
//             </p>
//             <button className="text-pink-300 text-sm flex items-center font-medium">
//               Learn more <ArrowRight size={16} className="ml-2" />
//             </button>
//           </div>
//         </div>

//         <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-8 border border-gray-700 shadow-xl">
//           <div className="flex flex-col md:flex-row md:items-center mb-8">
//             <div className="mb-6 md:mb-0 md:mr-8 md:flex-1">
//               <h3 className="text-white text-2xl font-semibold mb-4">
//                 Experience the{" "}
//                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
//                   Future
//                 </span>{" "}
//                 of Testimonial Sharing
//               </h3>
//               <p className="text-gray-300 mb-6">
//                 Our revolutionary platform makes it effortless to collect,
//                 showcase, and share authentic customer stories across every
//                 digital touchpoint.
//               </p>

//               <div className="flex space-x-3 mb-6">
//                 <button
//                   onClick={() => setActiveTab("widget")}
//                   className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center ${
//                     activeTab === "widget"
//                       ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
//                       : "text-gray-300 hover:bg-gray-700"
//                   }`}
//                 >
//                   <Code size={16} className="mr-2" /> Widget Embed
//                 </button>
//                 <button
//                   onClick={() => setActiveTab("social")}
//                   className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center ${
//                     activeTab === "social"
//                       ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
//                       : "text-gray-300 hover:bg-gray-700"
//                   }`}
//                 >
//                   <Share2 size={16} className="mr-2" /> Social Media
//                 </button>
//                 <button
//                   onClick={() => setActiveTab("code")}
//                   className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center ${
//                     activeTab === "code"
//                       ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
//                       : "text-gray-300 hover:bg-gray-700"
//                   }`}
//                 >
//                   <MessageSquare size={16} className="mr-2" /> Code Generator
//                 </button>
//               </div>

//               <div className="flex flex-wrap gap-3">
//                 <div className="bg-gray-900 px-3 py-1 rounded-md text-xs text-gray-400 flex items-center">
//                   <Check size={12} className="mr-1 text-green-500" /> Fully
//                   Responsive
//                 </div>
//                 <div className="bg-gray-900 px-3 py-1 rounded-md text-xs text-gray-400 flex items-center">
//                   <Check size={12} className="mr-1 text-green-500" /> 100%
//                   Customizable
//                 </div>
//                 <div className="bg-gray-900 px-3 py-1 rounded-md text-xs text-gray-400 flex items-center">
//                   <Check size={12} className="mr-1 text-green-500" /> SEO
//                   Friendly
//                 </div>
//                 <div className="bg-gray-900 px-3 py-1 rounded-md text-xs text-gray-400 flex items-center">
//                   <Check size={12} className="mr-1 text-green-500" /> Analytics
//                   Built-in
//                 </div>
//               </div>
//             </div>

//             <div className="md:flex-1 relative">
//               <div className="absolute -top-10 -left-10 -right-10 -bottom-10 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl filter blur-xl"></div>
//               <div className="relative p-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-2xl">
//                 <div className="bg-gray-800 w-full h-full rounded-lg p-4">
//                   {activeTab === "widget" && websitePreview()}
//                   {activeTab === "social" && socialMediaPreview()}
//                   {activeTab === "code" && embedCodePreview()}
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="border-t border-gray-700 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
//             <div className="mb-4 sm:mb-0">
//               <div className="text-sm text-gray-400 mb-1">
//                 Trusted by 2,500+ companies worldwide
//               </div>
//               <div className="flex space-x-6">
//                 <div className="w-16 h-6 bg-gray-700 rounded-md"></div>
//                 <div className="w-16 h-6 bg-gray-700 rounded-md"></div>
//                 <div className="w-16 h-6 bg-gray-700 rounded-md"></div>
//                 <div className="w-16 h-6 bg-gray-700 rounded-md"></div>
//               </div>
//             </div>
//             <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-6 py-3 rounded-lg text-white font-medium text-sm flex items-center justify-center transition-all shadow-lg shadow-purple-900/30">
//               Start Showcasing Testimonials{" "}
//               <ExternalLink size={16} className="ml-2" />
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TestimonialPlatformShowcase;

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation, Variants } from "framer-motion";
import {
  ArrowRight,
  Share2,
  Code,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Check,
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  ChevronRight,
  Star,
} from "lucide-react";

// Types
type Testimonial = {
  id: number;
  author: string;
  company: string;
  position: string;
  avatar: string;
  rating: number;
  content: string;
  industry?: string;
  verifiedCustomer: boolean;
  date: string;
};

type Platform = {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
};

type Device = {
  id: string;
  name: string;
  icon: React.ReactNode;
};

// Component Props
interface PlatformIconProps {
  platform: Platform;
  isActive: boolean;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  variant?: "default" | "social" | "minimal";
  delay?: number;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay: number;
  buttonText: string;
  buttonColor: string;
}

const TestimonialPlatformShowcase: React.FC = () => {
  // States
  const [activeTab, setActiveTab] = useState<string>("widget");
  const [activePlatform, setActivePlatform] = useState<string>("website");
  const [activeDevice, setActiveDevice] = useState<string>("desktop");
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] =
    useState<number>(0);

  // Refs
  const showcaseRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  // Platforms data
  const platforms: Platform[] = [
    {
      id: "website",
      name: "Website",
      icon: <Globe size={18} />,
      color: "from-violet-500 to-purple-600",
    },
    {
      id: "social",
      name: "Social Media",
      icon: <Share2 size={18} />,
      color: "from-blue-500 to-cyan-400",
    },
    {
      id: "email",
      name: "Email",
      icon: <MessageSquare size={18} />,
      color: "from-amber-500 to-orange-600",
    },
    {
      id: "code",
      name: "API/Code",
      icon: <Code size={18} />,
      color: "from-emerald-500 to-green-600",
    },
  ];

  // Devices data
  const devices: Device[] = [
    { id: "desktop", name: "Desktop", icon: <Monitor size={18} /> },
    { id: "tablet", name: "Tablet", icon: <Tablet size={18} /> },
    { id: "mobile", name: "Mobile", icon: <Smartphone size={18} /> },
  ];

  // Enhanced testimonial data
  const testimonials: Testimonial[] = [
    {
      id: 1,
      author: "Sarah Johnson",
      position: "Chief Marketing Officer",
      company: "TechVision",
      avatar: "https://randomuser.me/api/portraits/women/22.jpg",
      rating: 5,
      content:
        "This platform transformed how we display social proof. Our conversion rate increased by 37% in just two weeks! The seamless integration across all our digital touchpoints has created a consistent brand experience.",
      industry: "Technology",
      verifiedCustomer: true,
      date: "2025-01-15",
    },
    {
      id: 2,
      author: "Michael Roberts",
      position: "Director of Growth",
      company: "Crowdsurge",
      avatar: "https://randomuser.me/api/portraits/women/33.jpg",
      rating: 5,
      content:
        "The embeddable widgets are so seamless and elegant. Our website visitors now spend 2x more time on our pages. The AI-powered placement has significantly improved our conversion rates across all devices.",
      industry: "Marketing",
      verifiedCustomer: true,
      date: "2025-02-03",
    },
    {
      id: 3,
      author: "Elena Kwon",
      position: "Founder & CEO",
      company: "Novastride",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      rating: 5,
      content:
        "I can't believe how easy it is to collect and showcase testimonials. This is truly a game-changer for our startup. We've seen a 43% increase in trust signals and our customer acquisition cost has dropped by 27%.",
      industry: "E-commerce",
      verifiedCustomer: true,
      date: "2025-01-28",
    },
    {
      id: 4,
      author: "David Chen",
      position: "VP of Product",
      company: "FlexMatrix",
      avatar: "https://randomuser.me/api/portraits/women/55.jpg",
      rating: 5,
      content:
        "The cross-platform compatibility is unmatched. We're displaying our customer stories everywhere, from our website to social media, emails, and even digital ads. Everything stays on brand and looks incredible.",
      industry: "SaaS",
      verifiedCustomer: true,
      date: "2025-02-12",
    },
  ];

  // Animation variants
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1.0],
      },
    }),
  };

  const fadeInUpVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1.0],
      },
    },
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  // Intersection observer effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          controls.start("visible");
        }
      },
      { threshold: 0.1 }
    );

    if (showcaseRef.current) {
      observer.observe(showcaseRef.current);
    }

    return () => {
      if (showcaseRef.current) {
        observer.unobserve(showcaseRef.current);
      }
    };
  }, [controls]);

  // Testimonial rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prevIndex) =>
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, 6000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Platform Icon Component
  const PlatformIcon: React.FC<PlatformIconProps> = ({
    platform,
    isActive,
  }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setActivePlatform(platform.id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
        isActive
          ? `bg-gradient-to-r ${platform.color} text-white shadow-lg`
          : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/70"
      }`}
    >
      <span>{platform.icon}</span>
      <span>{platform.name}</span>
    </motion.button>
  );

  // Testimonial Card Component
  const TestimonialCard: React.FC<TestimonialCardProps> = ({
    testimonial,
    variant = "default",
    delay = 0,
  }) => {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        custom={delay}
        whileHover={{
          y: -5,
          boxShadow:
            "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        }}
        className={`bg-white/10 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-xl ${
          variant === "social" ? "w-full" : "w-72 flex-shrink-0"
        }`}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs overflow-hidden">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-3">
                <div className="text-sm font-semibold text-white">
                  {testimonial.author}
                </div>
                <div className="text-xs text-gray-400">
                  {testimonial.position} @ {testimonial.company}
                </div>
              </div>
            </div>
            {testimonial.verifiedCustomer && (
              <div className="bg-green-500/20 p-1 rounded-full">
                <Check size={12} className="text-green-400" />
              </div>
            )}
          </div>

          <div className="flex mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={
                  i < testimonial.rating
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-600"
                }
              />
            ))}
          </div>

          <div className="text-sm text-gray-300 mb-3 line-clamp-4">
            "{testimonial.content}"
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500">
            <div>
              {new Date(testimonial.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
            {testimonial.industry && (
              <div className="px-2 py-1 rounded-full bg-gray-800/60 text-gray-400">
                {testimonial.industry}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // Feature Card Component
  const FeatureCard: React.FC<FeatureCardProps> = ({
    icon,
    title,
    description,
    gradient,
    delay,
    buttonText,
    buttonColor,
  }) => {
    return (
      <motion.div
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={fadeInUpVariants}
        custom={delay}
        whileHover={{
          y: -5,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
        }}
        className="bg-gradient-to-b from-gray-800/50 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl"
      >
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${gradient} flex items-center justify-center mb-4 shadow-lg`}
        >
          {icon}
        </div>
        <h3 className="text-white text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-400 mb-4 text-sm leading-relaxed">
          {description}
        </p>
        <motion.button
          whileHover={{ x: 5 }}
          className={`text-${buttonColor} text-sm flex items-center font-medium`}
        >
          {buttonText} <ArrowRight size={16} className="ml-2" />
        </motion.button>
      </motion.div>
    );
  };

  // Website preview component
  const WebsitePreview: React.FC = () => (
    <div className="relative w-full overflow-hidden rounded-xl shadow-lg bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
      <div className="h-10 bg-gray-800 flex items-center px-4 space-x-2">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <div className="ml-4 text-xs text-gray-400 flex-1 text-center">
          www.example.com
        </div>
      </div>
      <div className="p-6">
        <div className="mb-6">
          <div className="h-8 w-3/4 bg-gray-700/50 rounded-lg mb-3"></div>
          <div className="h-4 w-full bg-gray-700/50 rounded-lg mb-2"></div>
          <div className="h-4 w-full bg-gray-700/50 rounded-lg mb-2"></div>
          <div className="h-4 w-1/2 bg-gray-700/50 rounded-lg"></div>
        </div>

        <motion.div
          className="mb-6 relative"
          animate={{
            boxShadow: [
              "0 0 0 rgba(139, 92, 246, 0.1)",
              "0 0 15px rgba(139, 92, 246, 0.3)",
              "0 0 0 rgba(139, 92, 246, 0.1)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <motion.div
            className="absolute -top-10 -right-10 z-10"
            animate={{
              rotate: [0, 10, 0, -10, 0],
              scale: [1, 1.05, 1, 1.05, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="animate-ping absolute inline-flex h-32 w-32 rounded-full bg-purple-400 opacity-10"></div>
            <div className="relative inline-flex rounded-full h-12 w-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 items-center justify-center">
              <div className="text-white text-xs font-bold">Widget</div>
            </div>
          </motion.div>
          <div className="relative z-0 p-4 rounded-lg bg-gradient-to-r from-indigo-900/30 to-purple-900/30 shadow-inner border border-purple-500/20">
            <div className="h-6 w-48 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg mb-4 text-white text-xs flex items-center justify-center font-medium">
              Our Customer Stories
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
              <AnimatePresence>
                {testimonials.map((testimonial, index) => (
                  <TestimonialCard
                    key={testimonial.id}
                    testimonial={testimonial}
                    delay={index * 0.2}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <div>
          <div className="h-4 w-full bg-gray-700/50 rounded-lg mb-2"></div>
          <div className="h-4 w-full bg-gray-700/50 rounded-lg mb-2"></div>
          <div className="h-4 w-1/2 bg-gray-700/50 rounded-lg"></div>
        </div>
      </div>
    </div>
  );

  // Social media preview component
  const SocialMediaPreview: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="rounded-xl overflow-hidden shadow-lg bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-500/20 backdrop-blur-sm"
      >
        <div className="h-10 bg-gradient-to-r from-blue-600 to-blue-500 flex items-center px-4">
          <div className="text-white text-sm font-semibold">Social Network</div>
        </div>
        <div className="p-4">
          <div className="flex items-start mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src="https://randomuser.me/api/portraits/women/22.jpg"
                alt="Company Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="ml-3 flex-1">
              <div className="text-sm font-semibold text-white">
                Your Company
              </div>
              <div className="text-xs text-gray-400 mb-2">Just now</div>
              <div className="text-xs text-gray-300 mb-2">
                Hear what our amazing customers are saying about us! 🙌
              </div>
              <motion.div
                className="p-3 bg-white/10 rounded-lg border border-blue-500/20 text-xs mb-2 backdrop-blur-sm"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                "{testimonials[currentTestimonialIndex].content}"
                <div className="mt-2 font-medium text-blue-400">
                  - {testimonials[currentTestimonialIndex].author},{" "}
                  {testimonials[currentTestimonialIndex].company}
                </div>
              </motion.div>
              <div className="flex text-xs text-gray-400">
                <div className="mr-3 flex items-center">
                  <motion.div
                    className="mr-1"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    ❤️
                  </motion.div>{" "}
                  42
                </div>
                <div className="flex items-center">
                  <div className="mr-1">💬</div> 7
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        className="rounded-xl overflow-hidden shadow-lg bg-gradient-to-r from-pink-900/30 to-red-900/30 border border-pink-500/20 backdrop-blur-sm"
      >
        <div className="h-10 bg-gradient-to-r from-pink-500 to-red-500 flex items-center px-4">
          <div className="text-white text-sm font-semibold">
            Visual Platform
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start">
            <div className="w-10 h-10 rounded-full bg-pink-500 flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src="https://randomuser.me/api/portraits/women/22.jpg"
                alt="Company Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="ml-3 flex-1">
              <div className="text-sm font-semibold text-white">
                Your Company
              </div>
              <div className="text-xs text-gray-400 mb-2">3h ago</div>
              <motion.div
                className="mb-2 bg-gradient-to-r from-pink-500/30 to-red-500/30 h-40 rounded-lg flex items-center justify-center relative overflow-hidden border border-pink-500/20"
                animate={{
                  background: [
                    "linear-gradient(to right, rgba(236, 72, 153, 0.3), rgba(239, 68, 68, 0.3))",
                    "linear-gradient(to right, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))",
                    "linear-gradient(to right, rgba(236, 72, 153, 0.3), rgba(239, 68, 68, 0.3))",
                  ],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: "url('/api/placeholder/400/160')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0.2,
                  }}
                />
                <motion.div
                  className="bg-white/10 p-3 rounded-lg shadow-xl backdrop-blur-sm border border-white/10 w-4/5 text-sm text-center text-white z-10"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  "
                  {testimonials[
                    (currentTestimonialIndex + 1) % testimonials.length
                  ].content.substring(0, 100)}
                  ..."
                  <div className="mt-2 font-medium text-pink-300">
                    -{" "}
                    {
                      testimonials[
                        (currentTestimonialIndex + 1) % testimonials.length
                      ].author
                    }
                  </div>
                </motion.div>
              </motion.div>
              <div className="flex text-xs text-gray-400">
                <div className="mr-3 flex items-center">
                  <motion.div
                    className="mr-1"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                  >
                    ❤️
                  </motion.div>{" "}
                  128
                </div>
                <div className="flex items-center">
                  <div className="mr-1">💬</div> 23
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  // Email preview component
  const EmailPreview: React.FC = () => (
    <div className="relative w-full overflow-hidden rounded-xl shadow-lg bg-gradient-to-br from-gray-50 to-white border border-gray-200">
      <div className="h-10 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center px-4">
        <div className="text-white text-sm font-semibold">Email Campaign</div>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <div className="h-8 w-1/2 bg-gray-200 rounded-lg mb-3"></div>
          <div className="h-4 w-full bg-gray-100 rounded-lg mb-2"></div>
          <div className="h-4 w-full bg-gray-100 rounded-lg mb-2"></div>
        </div>

        <motion.div
          className="mb-6 border border-amber-200 p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50"
          animate={{
            boxShadow: [
              "0 0 0 rgba(251, 191, 36, 0.1)",
              "0 0 15px rgba(251, 191, 36, 0.3)",
              "0 0 0 rgba(251, 191, 36, 0.1)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="text-center mb-4">
            <div className="inline-block px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs text-white font-medium">
              What Our Customers Say
            </div>
          </div>

          <motion.div
            className="bg-white rounded-lg p-4 shadow-md border border-amber-100 mb-3"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src="https://randomuser.me/api/portraits/women/22.jpg"
                  alt={testimonials[currentTestimonialIndex].author}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-3">
                <div className="text-sm font-semibold text-gray-900">
                  {testimonials[currentTestimonialIndex].author}
                </div>
                <div className="text-xs text-gray-500">
                  {testimonials[currentTestimonialIndex].position},{" "}
                  {testimonials[currentTestimonialIndex].company}
                </div>
              </div>
              <div className="ml-auto flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className="text-amber-400 fill-amber-400"
                  />
                ))}
              </div>
            </div>
            <div className="text-sm text-gray-600 italic">
              "{testimonials[currentTestimonialIndex].content}"
            </div>
          </motion.div>

          <div className="text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-white text-xs font-semibold shadow-lg"
            >
              View All Testimonials
            </motion.button>
          </div>
        </motion.div>

        <div>
          <div className="h-4 w-full bg-gray-100 rounded-lg mb-2"></div>
          <div className="h-4 w-3/4 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    </div>
  );

  // Code preview component
  const CodePreview: React.FC = () => (
    <div className="rounded-xl overflow-hidden shadow-lg bg-gray-900 border border-gray-700/50">
      <div className="h-10 bg-gradient-to-r from-gray-800 to-gray-900 flex items-center px-4 border-b border-gray-700/50">
        <div className="text-gray-300 text-sm font-semibold flex items-center">
          <Code size={14} className="mr-2" />
          API &amp; Integration
        </div>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <div className="mb-2 text-xs text-gray-400 font-medium">
            Choose your platform:
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 text-center text-xs text-white font-medium shadow-lg"
            >
              Javascript
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-md bg-gray-800 border border-gray-700 text-center text-xs text-gray-400 hover:border-purple-500/50 hover:text-gray-300 transition-all"
            >
              React
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-md bg-gray-800 border border-gray-700 text-center text-xs text-gray-400 hover:border-purple-500/50 hover:text-gray-300 transition-all"
            >
              REST API
            </motion.div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="text-xs text-gray-400 font-medium">
              Display options:
            </div>
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                className="flex items-center"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-4 h-4 rounded-sm bg-gray-800 border border-purple-500 flex items-center justify-center mr-2">
                  <Check size={12} className="text-purple-500" />
                </div>
                <div className="text-xs text-gray-300">
                  {testimonial.author} - {testimonial.company}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          className="bg-gray-800 p-3 rounded-md font-mono text-xs text-green-400 mb-4 relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="absolute top-0 left-0 h-full w-2 bg-gradient-to-b from-indigo-500 to-purple-500"
            animate={{
              opacity: [0.5, 1, 0.5],
              height: ["0%", "100%", "0%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
          <div className="text-gray-300">
            <div>// Initialize the testimonial widget</div>
            <div>
              <span className="text-purple-400">const</span> testimonialWidget ={" "}
              <span className="text-yellow-300">new</span> TestimonialWidget(
              {"{"}
            </div>
            <div className="pl-4">
              apiKey: <span className="text-orange-400">'your-api-key'</span>,
            </div>
            <div className="pl-4">
              container:{" "}
              <span className="text-orange-400">'#testimonial-container'</span>,
            </div>
            <div className="pl-4">
              theme: <span className="text-orange-400">'custom'</span>,
            </div>
            <div className="pl-4">display: {"{"}</div>
            <div className="pl-8">
              carousel: <span className="text-blue-400">true</span>,
            </div>
            <div className="pl-8">
              limit: <span className="text-yellow-300">4</span>,
            </div>
            <div className="pl-8">
              sorting: <span className="text-orange-400">'recent'</span>
            </div>
            <div className="pl-4">{"}"}</div>
            <div>
              {")"};{/* Close TestimonialWidget initialization */}
            </div>

            <div>
              testimonialWidget.
              {/* <span className="text-blue-400">on</span>(
              <span className="text-orange-400">'loaded'</span>, () => {'{'} */}
            </div>
            <div className="pl-4">
              console.
              <span className="text-blue-400">log</span>(
              <span className="text-orange-400">
                'Testimonials loaded successfully!'
              </span>
              );
            </div>
            <div>{"});"}</div>
          </div>
        </motion.div>

        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full text-white text-xs font-semibold shadow-lg flex items-center justify-center mx-auto"
          >
            <div className="mr-1">Copy Code</div>
            <Code size={12} />
          </motion.button>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={showcaseRef} className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
          Display Testimonials Anywhere
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Seamlessly integrate powerful social proof across all your digital
          touchpoints with our flexible display options.
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-col space-y-8">
        <motion.div
          className="flex justify-center mb-6"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          <div className="flex bg-gray-800/60 backdrop-blur-sm p-1 rounded-full space-x-2 border border-gray-700/50">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab("widget")}
              className={`px-6 py-2 rounded-full text-sm transition-all ${
                activeTab === "widget"
                  ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Testimonial Widgets
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab("integrations")}
              className={`px-6 py-2 rounded-full text-sm transition-all ${
                activeTab === "integrations"
                  ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Platform Integrations
            </motion.button>
          </div>
        </motion.div>

        {/* Platform Selector */}
        {activeTab === "integrations" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col space-y-6"
          >
            <div className="flex justify-center space-x-3">
              {platforms.map((platform) => (
                <PlatformIcon
                  key={platform.id}
                  platform={platform}
                  isActive={activePlatform === platform.id}
                />
              ))}
            </div>

            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl">
              <AnimatePresence mode="wait">
                {activePlatform === "website" && (
                  <WebsitePreview key="website" />
                )}
                {activePlatform === "social" && (
                  <SocialMediaPreview key="social" />
                )}
                {activePlatform === "email" && <EmailPreview key="email" />}
                {activePlatform === "code" && <CodePreview key="code" />}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Widget Display */}
        {activeTab === "widget" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col space-y-6"
          >
            <div className="flex justify-center space-x-3">
              {devices.map((device) => (
                <motion.button
                  key={device.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveDevice(device.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeDevice === device.id
                      ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg"
                      : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/70"
                  }`}
                >
                  <span>{device.icon}</span>
                  <span>{device.name}</span>
                </motion.button>
              ))}
            </div>

            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl">
              <WebsitePreview />
            </div>
          </motion.div>
        )}
      </div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-16"
      >
        <h3 className="text-2xl font-bold text-center text-white mb-10">
          Features That Make A Difference
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Sparkles size={20} className="text-white" />}
            title="Smart AI Placement"
            description="Our AI analyzes your site to determine the optimal placement for testimonials, maximizing conversion impact."
            gradient="from-blue-500 to-cyan-400"
            delay={0}
            buttonText="Learn More"
            buttonColor="blue-400"
          />
          <FeatureCard
            icon={<Share2 size={20} className="text-white" />}
            title="Cross-Platform Display"
            description="Seamlessly showcase your testimonials across your website, social media, email campaigns, and more."
            gradient="from-violet-500 to-purple-600"
            delay={0.2}
            buttonText="See Integrations"
            buttonColor="purple-400"
          />
          <FeatureCard
            icon={<Code size={20} className="text-white" />}
            title="Developer Friendly"
            description="Extensive API and SDK options for complete customization and control over your testimonial displays."
            gradient="from-emerald-500 to-green-600"
            delay={0.4}
            buttonText="View Documentation"
            buttonColor="emerald-400"
          />
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-16 text-center"
      >
        <motion.button
          whileHover={{
            scale: 1.05,
            boxShadow: "0 10px 25px -5px rgba(139, 92, 246, 0.4)",
          }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full text-white font-medium shadow-lg flex items-center mx-auto"
        >
          Get Started For Free <ExternalLink size={16} className="ml-2" />
        </motion.button>
        <p className="text-gray-500 text-sm mt-4">
          No credit card required • 14-day free trial
        </p>
      </motion.div>
    </div>
  );
};

export default TestimonialPlatformShowcase;
