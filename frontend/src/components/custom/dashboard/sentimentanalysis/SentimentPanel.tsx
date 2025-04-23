// import { Eye, Clock, BarChart2 } from "lucide-react";
// import { Testimonial } from "@/types/testimonial";

// interface SentimentPanelProps {
//   testimonial: Testimonial;
// }

// export function SentimentPanel({ testimonial }: SentimentPanelProps) {
//   if (!testimonial) return null;

//   const sentiment = testimonial.sentiment || { 
//     score: 0.5, 
//     label: "neutral",
//     count: 0,
//     keywords: []
//   };

//   // Helper function to render an emotion bar
//   const renderEmotionBar = (emotion: string, value: number) => {
//     const width = value * 100; // Assuming value is between 0 and 1
//     return (
//       <div className="mb-3">
//         <div className="flex justify-between mb-1">
//           <span className="capitalize">{emotion}</span>
//         </div>
//         <div className="w-full bg-gray-200 rounded-full h-2.5">
//           <div 
//             className={`${getSentimentColor(sentiment.label)} h-2.5 rounded-full`} 
//             style={{ width: `${width}%` }}
//           ></div>
//         </div>
//       </div>
//     );
//   };

//   // Helper function to get color based on sentiment
//   const getSentimentColor = (label: string) => {
//     switch (label) {
//       case "positive": return "bg-green-300";
//       case "negative": return "bg-red-300";
//       case "neutral": return "bg-gray-300";
//       default: return "bg-blue-300";
//     }
//   };

//   // Helper function to get background color based on sentiment
//   const getSentimentBgColor = (label: string) => {
//     switch (label) {
//       case "positive": return "bg-green-200";
//       case "negative": return "bg-red-200";
//       case "neutral": return "bg-gray-200";
//       default: return "bg-blue-200";
//     }
//   };

//   // Helper function to get emoji based on sentiment
//   const getSentimentEmoji = (label: string) => {
//     switch (label) {
//       case "positive": return (
//         <div className="w-5 h-5 flex flex-col items-center">
//           <div className="w-4 h-1 bg-gray-800 rounded-full mb-1"></div>
//           <div className="w-4 border-2 border-gray-800 rounded-full h-2"></div>
//         </div>
//       );
//       case "negative": return (
//         <div className="w-5 h-5 flex flex-col items-center">
//           <div className="w-4 border-2 border-gray-800 rounded-full h-2 mb-1"></div>
//           <div className="w-4 h-1 bg-gray-800 rounded-full"></div>
//         </div>
//       );
//       default: return (
//         <div className="w-5 h-5 flex flex-col items-center">
//           <div className="w-4 h-1 bg-gray-800 rounded-full"></div>
//         </div>
//       );
//     }
//   };

//   return (
//     <div className="bg-white rounded-lg shadow p-4">
//       <div className="bg-gray-50 rounded-lg p-4 mb-4">
//         <h3 className="font-medium mb-2">{testimonial.title || "Untitled"}</h3>
//         <p className="text-gray-700">
//           {testimonial.content}
//         </p>
//       </div>
      
//       <div className="p-4">
//         <h3 className="text-lg font-semibold mb-2">Sentiment</h3>
//         <div className="flex items-center gap-3 mb-4">
//           <div className={`w-10 h-10 ${getSentimentBgColor(sentiment.label)} rounded-full flex items-center justify-center`}>
//             {getSentimentEmoji(sentiment.label)}
//           </div>
//           <span className="text-2xl capitalize">{sentiment.label}</span>
//         </div>
        
//         <h3 className="text-lg font-semibold mb-2">Emotion</h3>
//         <div className="mb-4">
//           {renderEmotionBar("joy", sentiment.score > 0.5 ? sentiment.score : 0.2)}
//           {renderEmotionBar("anger", sentiment.score < 0.5 ? 1 - sentiment.score : 0.1)}
//         </div>
        
//         <h3 className="text-lg font-semibold mb-2">Keywords</h3>
//         <div className="grid grid-cols-4 gap-2 mb-4">
//           {/* Simple bar chart */}
//           <div className="bg-gray-100 p-2 rounded-lg flex items-center justify-center">
//             <div className="flex gap-1">
//               {[...Array(3)].map((_, i) => (
//                 <div 
//                   key={i} 
//                   className={`w-1 ${getSentimentColor(sentiment.label)} self-end`} 
//                   style={{ height: `${(i + 2) * 8}px` }}
//                 ></div>
//               ))}
//             </div>
//           </div>
          
//           {/* Half circle chart */}
//           <div className="bg-gray-100 p-2 rounded-lg flex items-center justify-center">
//             <div className="h-6 w-6">
//               <div className={`${getSentimentColor(sentiment.label)} h-3 w-6 rounded-t-full`}></div>
//             </div>
//           </div>
          
//           {/* Bar chart */}
//           <div className="bg-gray-100 p-2 rounded-lg flex items-center justify-center">
//             <div className="flex gap-1">
//               {[...Array(3)].map((_, i) => (
//                 <div 
//                   key={i} 
//                   className={`w-1 ${getSentimentColor(sentiment.label)} self-end`} 
//                   style={{ height: `${(i + 1) * 10}px` }}
//                 ></div>
//               ))}
//             </div>
//           </div>
          
//           {/* Pie chart */}
//           <div className="bg-gray-100 p-2 rounded-lg flex items-center justify-center">
//             <div className="w-6 h-6 rounded-full relative">
//               <div className={`${getSentimentColor(sentiment.label)} h-6 w-6 rounded-full absolute top-0 left-0`}></div>
//               <div 
//                 className="bg-white h-6 absolute top-0 left-0" 
//                 style={{ 
//                   width: `${(1 - sentiment.score) * 100}%`, 
//                   borderTopRightRadius: '50%', 
//                   borderBottomRightRadius: '50%' 
//                 }}
//               ></div>
//             </div>
//           </div>
//         </div>
        
//         <div className="flex justify-between text-gray-600">
//           <div className="flex items-center gap-1">
//             <Eye size={16} />
//             <span>{testimonial.view_count || 0}</span>
//           </div>
//           <div className="flex items-center gap-1">
//             <Clock size={16} />
//             <span>{testimonial.share_count || 0}</span>
//           </div>
//           <div className="flex items-center gap-1">
//             <BarChart2 size={16} />
//             <span>{sentiment.count || 0}</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



import { Eye, Clock, BarChart2, TrendingUp, Award, Zap } from "lucide-react";
import { Testimonial } from "@/types/testimonial";
import { SentimentMiniCharts } from "@/components/custom/dashboard/sentimentanalysis/Chart";

interface SentimentPanelProps {
  testimonial: Testimonial;
  // isDarkMode?: boolean; // Commented out dark mode prop
}

export function SentimentPanel({ testimonial /* , isDarkMode = true */ }: SentimentPanelProps) {
  if (!testimonial) return null;

  const sentimentAnalysis = testimonial.analyses?.find(analysis => 
    analysis.analysis_type === "sentiment"
  );

  const sentiment: { score: number; label: string; count: number; keywords: string[] } = 
  (sentimentAnalysis?.analysis_data.sentiment as { score: number; label: string; count: number; keywords: string[] }) || {
  score: 0.5,
  label: "neutral",
  count: 0,
  keywords: []
};

  // Get color based on emotion type
  const getEmotionColor = (type: string) => {
    switch (type) {
      // case "joy": return isDarkMode ? "bg-emerald-500" : "bg-emerald-400";
      case "joy": return "bg-emerald-400";
      // case "anger": return isDarkMode ? "bg-red-500" : "bg-red-400";
      case "anger": return "bg-red-400";
      // case "interest": return isDarkMode ? "bg-blue-500" : "bg-blue-400";
      case "interest": return "bg-blue-400";
      // case "surprise": return isDarkMode ? "bg-amber-500" : "bg-amber-400";
      case "surprise": return "bg-amber-400";
      // case "fear": return isDarkMode ? "bg-violet-500" : "bg-violet-400";
      case "fear": return "bg-violet-400";
      // default: return isDarkMode ? "bg-slate-500" : "bg-slate-400";
      default: return "bg-slate-400";
    }
  };

  // Get text color based on emotion type
  const getEmotionTextColor = (type: string) => {
    switch (type) {
      // case "joy": return isDarkMode ? "text-emerald-400" : "text-emerald-600";
      case "joy": return "text-emerald-600";
      // case "anger": return isDarkMode ? "text-red-400" : "text-red-600";
      case "anger": return "text-red-600";
      // case "interest": return isDarkMode ? "text-blue-400" : "text-blue-600";
      case "interest": return "text-blue-600";
      // case "surprise": return isDarkMode ? "text-amber-400" : "text-amber-600";
      case "surprise": return "text-amber-600";
      // case "fear": return isDarkMode ? "text-violet-400" : "text-violet-600";
      case "fear": return "text-violet-600";
      // default: return isDarkMode ? "text-slate-400" : "text-slate-600";
      default: return "text-slate-600";
    }
  };

  // Helper function to get text color
  const getSentimentTextColor = (label: string) => {
    switch (label) {
      // case "positive": return isDarkMode ? "text-emerald-400" : "text-emerald-600";
      case "positive": return "text-emerald-600";
      // case "negative": return isDarkMode ? "text-red-400" : "text-red-600";
      case "negative": return "text-red-600";
      // case "neutral": return isDarkMode ? "text-slate-400" : "text-slate-600";
      case "neutral": return "text-slate-600";
      // default: return isDarkMode ? "text-blue-400" : "text-blue-600";
      default: return "text-blue-600";
    }
  };

  // Helper function to get background color for sentiment
  const getSentimentBgColor = (label: string) => {
    switch (label) {
      // case "positive": return isDarkMode ? "bg-emerald-400/10" : "bg-emerald-100";
      case "positive": return "bg-emerald-100";
      // case "negative": return isDarkMode ? "bg-red-400/10" : "bg-red-100";
      case "negative": return "bg-red-100";
      // case "neutral": return isDarkMode ? "bg-slate-400/10" : "bg-slate-100";
      case "neutral": return "bg-slate-100";
      // default: return isDarkMode ? "bg-blue-400/10" : "bg-blue-100";
      default: return "bg-blue-100";
    }
  };

  // Helper function to render an emotion bar with specific color
  const renderEmotionBar = (emotion: string, value: number, icon: React.ReactNode) => {
    const width = value * 100; // Assuming value is between 0 and 1
    const emotionType = emotion.toLowerCase();
    
    return (
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            <div className={`p-1 rounded-md ${getEmotionColor(emotionType)}/20 mr-2`}>
              {icon}
            </div>
            <span className={`capitalize font-medium ${getEmotionTextColor(emotionType)}`}>{emotion}</span>
          </div>
          <span className={`text-slate-600 bg-slate-200/50 text-sm font-mono px-2 py-1 rounded`}>
            {Math.round(value * 100)}%
          </span>
        </div>
        <div className={`w-full bg-slate-200 rounded-full h-2.5`}>
          <div 
            className={`${getEmotionColor(emotionType)} h-2.5 rounded-full`} 
            style={{ width: `${width}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Render sentiment emoji/face with appropriate color
  const renderSentimentFace = (label: string) => {
    if (label === "positive") {
      return (
        <div className={getSentimentTextColor(label)}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="28" cy="28" r="28" fill="currentColor" fillOpacity="0.1" />
            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="2" />
            <circle cx="19" cy="22" r="3" fill="currentColor" />
            <circle cx="37" cy="22" r="3" fill="currentColor" />
            <path d="M16 34C19 39 37 39 40 34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      );
    } else if (label === "negative") {
      return (
        <div className={getSentimentTextColor(label)}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="28" cy="28" r="28" fill="currentColor" fillOpacity="0.1" />
            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="2" />
            <circle cx="19" cy="22" r="3" fill="currentColor" />
            <circle cx="37" cy="22" r="3" fill="currentColor" />
            <path d="M16 38C19 33 37 33 40 38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className={getSentimentTextColor(label)}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="28" cy="28" r="28" fill="currentColor" fillOpacity="0.1" />
            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="2" />
            <circle cx="19" cy="22" r="3" fill="currentColor" />
            <circle cx="37" cy="22" r="3" fill="currentColor" />
            <path d="M16 34H40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      );
    }
  };

  // Dynamic background styles based on theme - Now hardcoded to light mode values
  // const containerBg = isDarkMode 
  //   ? "bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700" 
  //   : "bg-gradient-to-br from-slate-50 to-white border-slate-200";
  const containerBg = "bg-gradient-to-br from-slate-50 to-white border-slate-200";
  
  // const sectionBg = isDarkMode 
  //   ? "bg-slate-800/30 border-slate-700/50" 
  //   : "bg-slate-100 border-slate-200/50";
  const sectionBg = "bg-slate-100 border-slate-200/50";
  
  // const cardBg = isDarkMode 
  //   ? "bg-slate-800/40 border-slate-700/50" 
  //   : "bg-white border-slate-200";
  const cardBg = "bg-white border-slate-200";
  
  // const textColor = isDarkMode ? "text-white" : "text-slate-800";
  const textColor = "text-slate-800";
  // const subTextColor = isDarkMode ? "text-slate-300" : "text-slate-600";
  const subTextColor = "text-slate-600";
  // const iconColor = isDarkMode ? "text-indigo-400" : "text-indigo-600";
  const iconColor = "text-indigo-600";

  return (
    <div className={`rounded-xl overflow-hidden ${containerBg} border shadow-xl transition-colors`}>
      {/* Header with sentiment preview */}
      <div className={`p-5 border-b border-slate-200/50 flex justify-between items-center`}>
        <h2 className={`text-xl font-bold ${textColor} flex items-center`}>
          <BarChart2 className={`mr-2 ${iconColor}`} size={20} />
          Sentiment Analysis
        </h2>
        <div className={`px-3 py-1 rounded-full ${getSentimentBgColor(sentiment.label)} ${getSentimentTextColor(sentiment.label)} text-sm font-medium uppercase tracking-wider`}>
          {sentiment.label}
        </div>
      </div>
      
      {/* Testimonial Content */}
      <div className={`${sectionBg} p-5 border-b`}>
        <h3 className={`font-bold mb-3 ${textColor} text-lg`}>{testimonial.title || "Untitled"}</h3>
        <p className={`${subTextColor} leading-relaxed`}>
          {testimonial.content}
        </p>
      </div>
      
      <div className="p-6">
        {/* Sentiment Section */}
        <div className="mb-8">
          <h3 className={`text-lg font-bold mb-4 ${textColor} flex items-center`}>
            <Zap size={18} className={`mr-2 ${iconColor}`} />
            Sentiment Score
          </h3>
          <div className={`flex items-center gap-6 mb-4 ${cardBg} p-4 rounded-xl border`}>
            {renderSentimentFace(sentiment.label)}
            <div className="flex flex-col">
              <span className={`text-2xl font-bold capitalize ${getSentimentTextColor(sentiment.label)}`}>
                {sentiment.label}
              </span>
              <span className="text-slate-600">
                {sentiment.score && `Confidence: ${(sentiment.score * 100).toFixed(0)}%`}
              </span>
            </div>
          </div>
        </div>
        
        {/* Emotion Section */}
        <div className="mb-8">
          <h3 className={`text-lg font-bold mb-4 ${textColor} flex items-center`}>
            <Award size={18} className={`mr-2 ${iconColor}`} />
            Emotion Analysis
          </h3>
          <div className={`${cardBg} p-4 rounded-xl border`}>
            {renderEmotionBar("Joy", sentiment.score > 0.5 ? sentiment.score : 0.6, 
              <Zap size={16} className="text-emerald-600" />)}
            {renderEmotionBar("Anger", sentiment.score < 0.5 ? 1 - sentiment.score : 0.3, 
              <Clock size={16} className="text-red-600" />)}
            {(testimonial.content?.length ?? 0) > 100 && renderEmotionBar("Interest", 0.7, 
              <Eye size={16} className="text-blue-600" />)}
          </div>
        </div>
        
        {/* Keywords/Charts Section */}
        <div className="mb-6">
          <h3 className={`text-lg font-bold mb-4 ${textColor} flex items-center`}>
            <TrendingUp size={18} className={`mr-2 ${iconColor}`} />
            Keyword Analysis
          </h3>
          <div className={`${cardBg} p-4 rounded-xl border`}>
            {/* Recharts Integration - Explicitly set isDarkMode to false */}
            <SentimentMiniCharts sentiment={sentiment} isDarkMode={false} />
          </div>
        </div>
        
        {/* Stats Footer */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className={`${cardBg} p-3 rounded-lg border flex items-center justify-center`}>
            <Eye size={16} className={`${iconColor} mr-2`} />
            <span className={textColor + " font-medium"}>{testimonial.view_count || 325}</span>
            <span className="text-slate-600 ml-1 text-sm">views</span>
          </div>
          <div className={`${cardBg} p-3 rounded-lg border flex items-center justify-center`}>
            <Clock size={16} className={`${iconColor} mr-2`} />
            <span className={textColor + " font-medium"}>{testimonial.share_count || 40}</span>
            <span className="text-slate-600 ml-1 text-sm">shares</span>
          </div>
          <div className={`${cardBg} p-3 rounded-lg border flex items-center justify-center`}>
            <BarChart2 size={16} className={`${iconColor} mr-2`} />
            <span className={textColor + " font-medium"}>{sentiment.count || 5}</span>
            <span className="text-slate-600 ml-1 text-sm">analyses</span>
          </div>
        </div>
      </div>
    </div>
  );
}