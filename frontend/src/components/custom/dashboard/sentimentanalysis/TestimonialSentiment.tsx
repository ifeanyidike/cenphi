

// import { useState, useEffect, createContext, useContext } from "react";
// import { SentimentPanel } from "@/components/custom/dashboard/sentimentanalysis/SentimentPanel";
// import { StatusPanel } from "@/components/custom/dashboard/sentimentanalysis/StatusPanel";
// import dataset from "@/data/dataset";
// import { Testimonial } from "@/types/testimonial";
// import { ThumbsUp, MessageSquare, LineChart, Sun, Moon, ChevronRight } from 'lucide-react';

// // Create a theme context
// const ThemeContext = createContext({
//   isDark: true,
//   toggleTheme: () => {}
// });

// export default function TestimonialSentiment() {
//   const [isDarkMode, setIsDarkMode] = useState(true);
//   const [selectedTestimonialIndex, setSelectedTestimonialIndex] = useState(0);
//   const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
//   // const [testimonials, setTestimonials] = useState([]);
//   const [filteredTestimonials, setFilteredTestimonials] = useState<Testimonial[]>([]);
//   const [currentStatus, setCurrentStatus] = useState("approved");
  
//   useEffect(() => {
//     // Check if user has a theme preference saved
//     const savedTheme = localStorage.getItem('theme');
//     if (savedTheme) {
//       setIsDarkMode(savedTheme === 'dark');
//     } else {
//       // Check system preference
//       const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
//       setIsDarkMode(prefersDark);
//     }
    
//     // Load testimonials data
//     if (dataset && Array.isArray(dataset)) {
//       setTestimonials(dataset);
//       // Initially filter to show approved testimonials
//       const approved = dataset.filter(item => item.status === "approved");
//       setFilteredTestimonials(approved);
//     }
//   }, []);
  
//   // Save theme preference whenever it changes
//   useEffect(() => {
//     localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
//   }, [isDarkMode]);
  
//   const toggleTheme = () => {
//     setIsDarkMode(!isDarkMode);
//   };
  
//   // Function to get sentiment icon and color based on theme
//   // interface SentimentDetails {
//   //   icon: JSX.Element;
//   //   color: string;
//   //   textColor: string;
//   // }

// interface SentimentDetails {
//   icon: React.ReactNode; // Use React.ReactNode instead of JSX.Element
//   color: string;
//   textColor: string;
// }

//   const getSentimentDetails = (testimonial: Testimonial): SentimentDetails => {
//     if (!testimonial.sentiment) {
//       return {
//         icon: <div className="w-4 h-4 bg-gray-300 rounded-full" />,
//         color: isDarkMode ? "bg-gray-600" : "bg-gray-200",
//         textColor: isDarkMode ? "text-gray-400" : "text-gray-500"
//       };
//     }
    
//     switch (testimonial.sentiment.label) {
//       case "positive":
//         return {
//           icon: <ThumbsUp size={16} className="text-white" />,
//           color: "bg-emerald-500",
//           textColor: isDarkMode ? "text-emerald-400" : "text-emerald-600"
//         };
//       case "negative":
//         return {
//           icon: <ThumbsUp size={16} className="text-white rotate-180" />,
//           color: "bg-red-500",
//           textColor: isDarkMode ? "text-red-400" : "text-red-600"
//         };
//       case "neutral":
//         return {
//           icon: <div className="w-3 h-3 bg-white rounded-full" />,
//           color: isDarkMode ? "bg-gray-500" : "bg-gray-400",
//           textColor: isDarkMode ? "text-gray-400" : "text-gray-600"
//         };
//       default:
//         return {
//           icon: <div className="w-4 h-4 bg-gray-300 rounded-full" />,
//           color: isDarkMode ? "bg-gray-600" : "bg-gray-200",
//           textColor: isDarkMode ? "text-gray-400" : "text-gray-500"
//         };
//     }
//   };
  
//   // Function to filter testimonials by status
//   interface FilterByStatusParams {
//     status: string;
//   }

//   const filterByStatus = (status: FilterByStatusParams['status']): void => {
//     setCurrentStatus(status);
//     const filtered = testimonials.filter((item: Testimonial) => 
//       status === "all" ? true : item.status === status
//     );
//     setFilteredTestimonials(filtered);
//     setSelectedTestimonialIndex(0); // Reset selected index when filtering
//   };
  
//   // Theme value to be passed to context provider
//   const themeValue = {
//     isDark: isDarkMode,
//     toggleTheme
//   };
  
//   return (
//     <ThemeContext.Provider value={themeValue}>
//       <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
//       <div className={`flex max-w-5xl mx-auto ${
//         isDarkMode 
//           ? "bg-gradient-to-br from-slate-900 to-slate-800 text-white" 
//           : "bg-gradient-to-br from-slate-100 to-white text-slate-800"
//       } min-h-screen transition-colors duration-300`}>
//         <div className="flex-1 p-6">
//           <div className="flex items-center justify-between mb-6">
//             <div className="flex items-center">
//               <LineChart className={isDarkMode ? "text-indigo-400" : "text-indigo-600"} size={28} />
//               <h1 className="text-3xl font-bold ml-3">Sentiment Analysis Dashboard</h1>
//             </div>
            
//             {/* Theme Toggle Button */}
//             <button 
//               onClick={toggleTheme}
//               className={`p-2 rounded-full ${
//                 isDarkMode 
//                   ? "bg-slate-700 hover:bg-slate-600" 
//                   : "bg-slate-200 hover:bg-slate-300"
//               } transition-colors`}
//               aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
//             >
//               {isDarkMode ? (
//                 <Sun size={20} className="text-yellow-300" />
//               ) : (
//                 <Moon size={20} className="text-slate-700" />
//               )}
//             </button>
//           </div>
          
//           {filteredTestimonials.length > 0 && (
//             <div className={`${
//               isDarkMode 
//                 ? "bg-slate-800/60 border-slate-700" 
//                 : "bg-white border-slate-200"
//             } rounded-xl border shadow-xl p-6 mb-6 transition-colors`}>
//               <SentimentPanel 
//                 testimonial={filteredTestimonials[selectedTestimonialIndex]} 
//                 isDarkMode={isDarkMode} 
//               />
//             </div>
//           )}
          
//           <div className="mt-8">
//             <div className="flex items-center justify-between mb-4">
//               <div className="flex items-center">
//                 <MessageSquare className={isDarkMode ? "text-indigo-400" : "text-indigo-600"} size={20} />
//                 <h2 className="text-xl font-bold ml-2">Recent Testimonials</h2>
//               </div>
//               <div className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
//                 Showing {filteredTestimonials.length} {currentStatus} testimonials
//               </div>
//             </div>
            
//             <div className="grid grid-cols-1 gap-3">
//               {filteredTestimonials.map((testimonial, index) => {
//                 const sentimentDetails = getSentimentDetails(testimonial);
                
//                 return (
//                   <div 
//                     key={testimonial.id}
//                     className={`p-4 rounded-lg cursor-pointer transition-all ${
//                       selectedTestimonialIndex === index 
//                         ? isDarkMode
//                           ? 'bg-indigo-600/20 border border-indigo-500' 
//                           : 'bg-indigo-100 border border-indigo-300'
//                         : isDarkMode
//                           ? 'bg-slate-800/40 border border-slate-700 hover:border-slate-600'
//                           : 'bg-white border border-slate-200 hover:border-slate-300'
//                     }`}
//                     onClick={() => setSelectedTestimonialIndex(index)}
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className={`w-10 h-10 flex items-center justify-center ${sentimentDetails.color} rounded-full`}>
//                         {sentimentDetails.icon}
//                       </div>
//                       <div className="flex-1">
//                         <div className="flex justify-between">
//                           <p className="font-medium text-lg">{testimonial.title || "Untitled"}</p>
//                           <span className={`text-xs uppercase font-bold tracking-wider ${sentimentDetails.textColor} flex items-center`}>
//                             {testimonial.sentiment?.label || "Unknown"}
//                             <ChevronRight size={16} className={
//                               selectedTestimonialIndex === index 
//                                 ? isDarkMode ? "text-indigo-400" : "text-indigo-600" 
//                                 : isDarkMode ? "text-slate-600" : "text-slate-400"
//                             } />
//                           </span>
//                         </div>
//                         <p className={`line-clamp-1 text-sm ${
//                           isDarkMode ? "text-slate-400" : "text-slate-500"
//                         }`}>
//                           {testimonial.summary || (testimonial.content ?? '').substring(0, 60)}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>
        
//         {/* Right sidebar */}
//         <div className={`w-96 border-l ${
//           isDarkMode ? "border-slate-700" : "border-slate-200"
//         } transition-colors`}>
//           <StatusPanel 
//             statuses={["approved", "pending", "rejected", "featured", "scheduled"]}
//             currentStatus={currentStatus}
//             onStatusChange={filterByStatus}
//             selectedTestimonial={filteredTestimonials[selectedTestimonialIndex]}
//             isDarkMode={isDarkMode}
//           />
//         </div>
//       </div>
//       </div>
      
//     </ThemeContext.Provider>
//   );
// }

// // Export the context for use in child components
// export const useTheme = () => useContext(ThemeContext);


// import { useState, useEffect } from "react";
// import { SentimentPanel } from "@/components/custom/dashboard/sentimentanalysis/SentimentPanel";
// import { StatusPanel } from "@/components/custom/dashboard/sentimentanalysis/StatusPanel";
// import dataset from "@/data/dataset";
// import { Testimonial } from "@/types/testimonial";
// import { ThumbsUp, MessageSquare, LineChart, ChevronRight } from 'lucide-react';
// // import { ThemeContext } from "@/pages/Sentiment" // Import from parent page (commented out)

// export default function TestimonialSentiment() {
//   // Comment out theme context usage
//   // const { isDark: isDarkMode, toggleTheme } = useContext(ThemeContext);
  
//   // Default to light theme for now
//   // const isDarkMode = false;
  
//   const [selectedTestimonialIndex, setSelectedTestimonialIndex] = useState(0);
//   const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
//   const [filteredTestimonials, setFilteredTestimonials] = useState<Testimonial[]>([]);
//   const [currentStatus, setCurrentStatus] = useState("approved");
  
//   useEffect(() => {
//     // Load testimonials data
//     if (dataset && Array.isArray(dataset)) {
//       setTestimonials(dataset);
//       // Initially filter to show approved testimonials
//       const approved = dataset.filter(item => item.status === "approved");
//       setFilteredTestimonials(approved);
//     }
//   }, []);
  
//   interface SentimentDetails {
//     icon: React.ReactNode;
//     color: string;
//     textColor: string;
//   }

//   const getSentimentDetails = (testimonial: Testimonial): SentimentDetails => {
//     if (!testimonial.sentiment) {
//       return {
//         icon: <div className="w-4 h-4 bg-gray-300 rounded-full" />,
//         color: "bg-gray-200",
//         textColor: "text-gray-500"
//       };
//     }
    
//     switch (testimonial.sentiment.label) {
//       case "positive":
//         return {
//           icon: <ThumbsUp size={16} className="text-white" />,
//           color: "bg-emerald-500",
//           textColor: "text-emerald-600"
//         };
//       case "negative":
//         return {
//           icon: <ThumbsUp size={16} className="text-white rotate-180" />,
//           color: "bg-red-500",
//           textColor: "text-red-600"
//         };
//       case "neutral":
//         return {
//           icon: <div className="w-3 h-3 bg-white rounded-full" />,
//           color: "bg-gray-400",
//           textColor: "text-gray-600"
//         };
//       default:
//         return {
//           icon: <div className="w-4 h-4 bg-gray-300 rounded-full" />,
//           color: "bg-gray-200",
//           textColor: "text-gray-500"
//         };
//     }
//   };
  
//   // Function to filter testimonials by status
//   interface FilterByStatusParams {
//     status: string;
//   }

//   const filterByStatus = (status: FilterByStatusParams['status']): void => {
//     setCurrentStatus(status);
//     const filtered = testimonials.filter((item: Testimonial) => 
//       status === "all" ? true : item.status === status
//     );
//     setFilteredTestimonials(filtered);
//     setSelectedTestimonialIndex(0); // Reset selected index when filtering
//   };
  
//   return (
//     <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
//       <div className="flex max-w-5xl mx-auto bg-gradient-to-br from-slate-100 to-white text-slate-800 min-h-screen">
//         <div className="flex-1 p-6">
//           <div className="flex items-center justify-between mb-6">
//             <div className="flex items-center">
//               <LineChart className="text-indigo-600" size={28} />
//               <h1 className="text-3xl font-bold ml-3">Sentiment Analysis Dashboard</h1>
//             </div>
            
//             {/* Theme Toggle Button (commented out) */}
//             {/* <button 
//               onClick={toggleTheme}
//               className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors"
//               aria-label="Switch to dark mode"
//             >
//               <Moon size={20} className="text-slate-700" />
//             </button> */}
//           </div>
          
//           {filteredTestimonials.length > 0 && (
//             <div className="bg-white border-slate-200 rounded-xl border shadow-xl p-6 mb-6">
//               <SentimentPanel 
//                 testimonial={filteredTestimonials[selectedTestimonialIndex]} 
//                 // isDarkMode={false} 
//               />
//             </div>
//           )}
          
//           <div className="mt-8">
//             <div className="flex items-center justify-between mb-4">
//               <div className="flex items-center">
//                 <MessageSquare className="text-indigo-600" size={20} />
//                 <h2 className="text-xl font-bold ml-2">Recent Testimonials</h2>
//               </div>
//               <div className="text-slate-500">
//                 Showing {filteredTestimonials.length} {currentStatus} testimonials
//               </div>
//             </div>
            
//             <div className="grid grid-cols-1 gap-3">
//               {filteredTestimonials.map((testimonial, index) => {
//                 const sentimentDetails = getSentimentDetails(testimonial);
                
//                 return (
//                   <div 
//                     key={testimonial.id}
//                     className={`p-4 rounded-lg cursor-pointer transition-all ${
//                       selectedTestimonialIndex === index 
//                         ? 'bg-indigo-100 border border-indigo-300'
//                         : 'bg-white border border-slate-200 hover:border-slate-300'
//                     }`}
//                     onClick={() => setSelectedTestimonialIndex(index)}
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className={`w-10 h-10 flex items-center justify-center ${sentimentDetails.color} rounded-full`}>
//                         {sentimentDetails.icon}
//                       </div>
//                       <div className="flex-1">
//                         <div className="flex justify-between">
//                           <p className="font-medium text-lg">{testimonial.title || "Untitled"}</p>
//                           <span className={`text-xs uppercase font-bold tracking-wider ${sentimentDetails.textColor} flex items-center`}>
//                             {testimonial.sentiment?.label || "Unknown"}
//                             <ChevronRight size={16} className={
//                               selectedTestimonialIndex === index 
//                                 ? "text-indigo-600" 
//                                 : "text-slate-400"
//                             } />
//                           </span>
//                         </div>
//                         <p className="line-clamp-1 text-sm text-slate-500">
//                           {testimonial.summary || (testimonial.content ?? '').substring(0, 60)}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>
        
//         {/* Right sidebar */}
//         <div className="w-96 border-l border-slate-200">
//           <StatusPanel 
//             statuses={["approved", "pending", "rejected", "featured", "scheduled"]}
//             currentStatus={currentStatus}
//             onStatusChange={filterByStatus}
//             selectedTestimonial={filteredTestimonials[selectedTestimonialIndex]}
//             isDarkMode={false}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { SentimentPanel } from "@/components/custom/dashboard/sentimentanalysis/SentimentPanel";
import { StatusPanel } from "@/components/custom/dashboard/sentimentanalysis/StatusPanel";
import dataset from "@/data/dataset";
import { Testimonial } from "@/types/testimonial";
import { ThumbsUp, MessageSquare, LineChart, ChevronRight } from 'lucide-react';

// Interface for our derived sentiment data
interface SentimentData {
  score: number | undefined;
  label: string | undefined;
  keywords: string[];
}

export default function TestimonialSentiment() {
  const [selectedTestimonialIndex, setSelectedTestimonialIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<(Testimonial & { sentimentData?: SentimentData })[]>([]);
  const [filteredTestimonials, setFilteredTestimonials] = useState<(Testimonial & { sentimentData?: SentimentData })[]>([]);
  const [currentStatus, setCurrentStatus] = useState("approved");
  
  useEffect(() => {
    // Load testimonials data
    if (dataset && Array.isArray(dataset)) {
      // Process the data to extract sentiment from analyses array
      const processedData = dataset.map(testimonial => {
        // Find sentiment analyses and sort by creation date (newest first)
        const sentimentAnalyses = testimonial.analyses
          ?.filter(analysis => analysis.analysis_type === "sentiment")
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];
        
        // Get the most recent sentiment analysis
        const latestSentiment = sentimentAnalyses[0];
        
        // Extract sentiment data following the correct structure
        const sentimentData = latestSentiment ? {
          score: latestSentiment.sentiment_score,
          label: (latestSentiment.analysis_data as { sentiment?: { label?: string } }).sentiment?.label,
          keywords: (latestSentiment.analysis_data as { sentiment?: { keywords?: string[] } }).sentiment?.keywords || []
        } : undefined;
        
        // Return testimonial with extracted sentiment data
        return {
          ...testimonial,
          sentimentData
        };
      });
      
      setTestimonials(processedData);
      // Initially filter to show approved testimonials
      const approved = processedData.filter(item => item.status === "approved");
      setFilteredTestimonials(approved);
    }
  }, []);
  
  interface SentimentDetails {
    icon: React.ReactNode;
    color: string;
    textColor: string;
  }

  const getSentimentDetails = (testimonial: Testimonial & { sentimentData?: SentimentData }): SentimentDetails => {
    if (!testimonial.sentimentData || !testimonial.sentimentData.label) {
      return {
        icon: <div className="w-4 h-4 bg-gray-300 rounded-full" />,
        color: "bg-gray-200",
        textColor: "text-gray-500"
      };
    }
    
    switch (testimonial.sentimentData.label) {
      case "positive":
      case "very_positive":
        return {
          icon: <ThumbsUp size={16} className="text-white" />,
          color: "bg-emerald-500",
          textColor: "text-emerald-600"
        };
      case "negative":
      case "very_negative":
        return {
          icon: <ThumbsUp size={16} className="text-white rotate-180" />,
          color: "bg-red-500",
          textColor: "text-red-600"
        };
      case "neutral":
        return {
          icon: <div className="w-3 h-3 bg-white rounded-full" />,
          color: "bg-gray-400",
          textColor: "text-gray-600"
        };
      default:
        return {
          icon: <div className="w-4 h-4 bg-gray-300 rounded-full" />,
          color: "bg-gray-200",
          textColor: "text-gray-500"
        };
    }
  };
  
  // Function to filter testimonials by status
  interface FilterByStatusParams {
    status: string;
  }

  const filterByStatus = (status: FilterByStatusParams['status']): void => {
    setCurrentStatus(status);
    const filtered = testimonials.filter((item) => 
      status === "all" ? true : item.status === status
    );
    setFilteredTestimonials(filtered);
    setSelectedTestimonialIndex(0); // Reset selected index when filtering
  };
  
  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="flex max-w-5xl mx-auto bg-gradient-to-br from-slate-100 to-white text-slate-800 min-h-screen">
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <LineChart className="text-indigo-600" size={28} />
              <h1 className="text-3xl font-bold ml-3">Sentiment Analysis Dashboard</h1>
            </div>
          </div>
          
          {filteredTestimonials.length > 0 && (
            <div className="bg-white border-slate-200 rounded-xl border shadow-xl p-6 mb-6">
              <SentimentPanel 
                testimonial={filteredTestimonials[selectedTestimonialIndex]} 
              />
            </div>
          )}
          
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <MessageSquare className="text-indigo-600" size={20} />
                <h2 className="text-xl font-bold ml-2">Recent Testimonials</h2>
              </div>
              <div className="text-slate-500">
                Showing {filteredTestimonials.length} {currentStatus} testimonials
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {filteredTestimonials.map((testimonial, index) => {
                const sentimentDetails = getSentimentDetails(testimonial);
                
                return (
                  <div 
                    key={testimonial.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedTestimonialIndex === index 
                        ? 'bg-indigo-100 border border-indigo-300'
                        : 'bg-white border border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedTestimonialIndex(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 flex items-center justify-center ${sentimentDetails.color} rounded-full`}>
                        {sentimentDetails.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium text-lg">{testimonial.title || "Untitled"}</p>
                          <span className={`text-xs uppercase font-bold tracking-wider ${sentimentDetails.textColor} flex items-center`}>
                            {testimonial.sentimentData?.label || "Unknown"}
                            {testimonial.sentimentData?.score !== undefined && (
                              <span className="ml-1">({(testimonial.sentimentData.score * 100).toFixed(0)}%)</span>
                            )}
                            <ChevronRight size={16} className={
                              selectedTestimonialIndex === index 
                                ? "text-indigo-600" 
                                : "text-slate-400"
                            } />
                          </span>
                        </div>
                        <p className="line-clamp-1 text-sm text-slate-500">
                          {testimonial.summary || (testimonial.content ?? '').substring(0, 60)}
                        </p>
                        {testimonial.sentimentData?.keywords && testimonial.sentimentData.keywords.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {testimonial.sentimentData.keywords.map((keyword, i) => (
                              <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Right sidebar */}
        <div className="w-96 border-l border-slate-200">
          <StatusPanel 
            statuses={["approved", "pending", "rejected", "featured", "scheduled"]}
            currentStatus={currentStatus}
            onStatusChange={filterByStatus}
            selectedTestimonial={filteredTestimonials[selectedTestimonialIndex]}
            isDarkMode={false}
          />
        </div>
      </div>
    </div>
  );
}