// import { Users, ThumbsUp, Award, Clock, Filter, Check, X, Star, Calendar } from 'lucide-react';
// import { Testimonial } from '@/types/testimonial';
// import { AIInsights } from "@/components/custom/dashboard/sentimentanalysis/AllInsight"
// import { ResponseTemplates } from "@/components/custom/dashboard/sentimentanalysis/ResponseSelector"
// import { ActionToolbar } from '@/components/custom/dashboard/sentimentanalysis/ActionToolBar';
// import { CustomTags } from "@/components/custom/dashboard/sentimentanalysis/CustomTag"


// interface StatusPanelProps {
//   statuses: string[];
//   currentStatus: string;
//   onStatusChange: (status: string) => void;
//   selectedTestimonial: Testimonial | null;
//   isDarkMode: boolean;
// }

// const getDayWithSuffix = (day: number) => {
//   const suffixes = ["th", "st", "nd", "rd"];
//   const value = day % 100;
//   const suffix = suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];
//   return `${day}${suffix}`;
// };
// export function StatusPanel({ 
//   statuses, 
//   currentStatus, 
//   onStatusChange, 
//   selectedTestimonial,
//   isDarkMode 
// }: StatusPanelProps) {
//   // Generate status options with appropriate icons
//   const statusOptions = [
//     { id: 'approved', label: 'Approved', icon: <Check size={18} className="text-emerald-400" /> },
//     { id: 'pending', label: 'Pending', icon: <Clock size={18} className="text-amber-400" /> },
//     { id: 'rejected', label: 'Rejected', icon: <X size={18} className="text-red-400" /> },
//     { id: 'featured', label: 'Featured', icon: <Award size={18} className="text-indigo-400" /> },
//     { id: 'scheduled', label: 'Scheduled', icon: <Calendar size={18} className="text-blue-400" /> }
//   ].filter(option => statuses.includes(option.id));

//   // Function to get the sentiment color using the Testimonial type
//   const getSentimentColor = (sentiment: Testimonial['sentiment']): string => {
//     if (!sentiment) return isDarkMode ? "bg-gray-600" : "bg-gray-300";
    
//     switch (sentiment.label) {
//       case "positive": return "bg-emerald-500";
//       case "negative": return "bg-red-500";
//       case "neutral": return isDarkMode ? "bg-gray-500" : "bg-gray-400";
//       default: return isDarkMode ? "bg-gray-600" : "bg-gray-300";
//     }
//   };

//   // Function to get sentiment icon based on label, using Testimonial's sentiment type
//   const getSentimentIcon = (sentiment: Testimonial['sentiment']) => {
//     if (!sentiment) return null;
    
//     switch (sentiment.label) {
//       case "positive": return <ThumbsUp size={16} className="text-white" />;
//       case "negative": return <ThumbsUp size={16} className="text-white rotate-180" />;
//       case "neutral": return <div className="w-4 h-4 rounded-full border-2 border-white" />;
//       default: return null;
//     }
//   };

//   return (
//     <div className={`flex flex-col h-full ${isDarkMode 
//       ? "bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl border-slate-700" 
//       : "bg-gradient-to-br from-slate-100 to-white shadow-lg border-slate-200"
//     } overflow-hidden border transition-colors`}>
//       <div className={`px-6 py-5 ${isDarkMode 
//         ? "bg-slate-800 border-slate-700" 
//         : "bg-white border-slate-200"
//       } border-b`}>
//         <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"} flex items-center`}>
//           <Filter className={isDarkMode ? "mr-2 text-indigo-400" : "mr-2 text-indigo-600"} size={24} />
//           Testimonial Status
//         </h2>
//       </div>

//       <div className={`flex flex-wrap p-4 ${isDarkMode 
//         ? "bg-slate-800/50 border-slate-700" 
//         : "bg-slate-100/50 border-slate-200"
//       } border-b gap-2`}>
//         {statusOptions.map((status) => (
//           <button
//             key={status.id}
//             onClick={() => onStatusChange(status.id)}
//             className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all ${
//               currentStatus === status.id
//                 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
//                 : isDarkMode 
//                   ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
//                   : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
//             }`}
//           >
//             <span className="mr-2">{status.icon}</span>
//             {status.label}
//           </button>
//         ))}
//       </div>

//       <div className="p-5 flex-1 overflow-auto">
//         {selectedTestimonial ? (
//           <div className={`${isDarkMode 
//             ? "bg-slate-800/40 border-slate-700 hover:border-indigo-500/50" 
//             : "bg-white border-slate-200 hover:border-indigo-300/70"
//           } rounded-lg p-5 border transition-all shadow-lg`}>
//             <div className="flex justify-between items-start mb-4">
//               <div>
//                 <h3 className={`font-bold text-xl ${isDarkMode ? "text-white" : "text-slate-800"}`}>
//                   {selectedTestimonial.title || "Untitled"}
//                 </h3>
//                 <div className="flex items-center mt-1">
//                   <div className={`w-6 h-6 rounded-full ${getSentimentColor(selectedTestimonial.sentiment)} flex items-center justify-center mr-2`}>
//                     {getSentimentIcon(selectedTestimonial.sentiment)}
//                   </div>
//                   <span className={isDarkMode ? "text-indigo-400" : "text-indigo-600"}>
//                     {selectedTestimonial.sentiment?.label || "No sentiment"} 
//                     {selectedTestimonial.sentiment?.score && ` (${(selectedTestimonial.sentiment.score * 100).toFixed(0)}%)`}
//                   </span>
//                 </div>
//               </div>
//               <div className={`${isDarkMode 
//                 ? "bg-slate-900/70" 
//                 : "bg-slate-200"
//               } rounded-full px-3 py-1 uppercase text-xs font-bold tracking-wider ${isDarkMode ? "text-white" : "text-slate-700"}`}>
//                 {selectedTestimonial.status}
//               </div>
//             </div>
            
//             <div className={`${isDarkMode 
//               ? "bg-slate-900/30 border-slate-700/50" 
//               : "bg-slate-100 border-slate-200/70"
//             } rounded-xl p-4 mb-4 border`}>
//               <p className={isDarkMode ? "text-slate-300 italic" : "text-slate-600 italic"}>
//                 {selectedTestimonial.content}
//               </p>
//             </div>
            
//             <div className="grid grid-cols-2 gap-4">
//               <div className={`${isDarkMode 
//                 ? "bg-slate-900/20 border-slate-700/50" 
//                 : "bg-slate-100 border-slate-200"
//               } p-3 rounded-lg border`}>
//                 <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"} mb-1`}>AUTHOR</p>
//                 {/* <p className={isDarkMode ? "text-white" : "text-slate-800"}>
//                   {selectedTestimonial.customer_profile.name || "Anonymous"}
//                 </p> */}
//                 <p className={isDarkMode ? "text-white" : "text-slate-800"}>
//   {selectedTestimonial.customer_profile.name
//     ? `${selectedTestimonial.customer_profile.name.split(' ')[0]} ${selectedTestimonial.customer_profile.name.split(' ').pop()}`
//     : "Anonymous"}
// </p>

//               </div>
//               <div className={`${isDarkMode 
//                 ? "bg-slate-900/20 border-slate-700/50" 
//                 : "bg-slate-100 border-slate-200"
//               } p-3 rounded-lg border`}>
//                 <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"} mb-1`}>DATE</p>
//                 {/* <p className={isDarkMode ? "text-white" : "text-slate-800"}>
//                   {selectedTestimonial.created_at ? new Date(selectedTestimonial.created_at).toLocaleDateString() : "N/A"}
//                 </p> */}
// {/* <p className={isDarkMode ? "text-white" : "text-slate-800"}>
//   {selectedTestimonial.created_at
//     ? new Date(selectedTestimonial.created_at).toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric',
//       })
//     : "N/A"}
// </p> */}


// <p className={isDarkMode ? "text-white" : "text-slate-800"}>
//   {selectedTestimonial.created_at
//     ? new Date(selectedTestimonial.created_at).toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric',
//       }).replace(/\d+/, (day) => getDayWithSuffix(Number(day)))
//     : "N/A"}
// </p>

//               </div>
//               {selectedTestimonial.rating && (
//                 <div className={`${isDarkMode 
//                   ? "bg-slate-900/20 border-slate-700/50" 
//                   : "bg-slate-100 border-slate-200"
//                 } p-3 rounded-lg border`}>
//                   <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"} mb-1`}>RATING</p>
//                   <div className="flex items-center">
//                     <Star size={16} className="text-yellow-400 mr-1" fill="currentColor" />
//                     <span className={isDarkMode ? "text-white" : "text-slate-800"}>
//                       {selectedTestimonial.rating}/5
//                     </span>
//                   </div>
//                 </div>
//               )}
//               {selectedTestimonial.collection_method && (
//                 <div className={`${isDarkMode 
//                   ? "bg-slate-900/20 border-slate-700/50" 
//                   : "bg-slate-100 border-slate-200"
//                 } p-3 rounded-lg border`}>
//                   <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"} mb-1`}>SOURCE</p>
//                   <p className={isDarkMode ? "text-white" : "text-slate-800"}>
//                     {selectedTestimonial.collection_method}
//                   </p>
//                 </div>
//               )}
//             </div>

//             {selectedTestimonial.summary && (
//               <div className={`mt-4 ${isDarkMode 
//                 ? "bg-slate-900/20 border-slate-700/50" 
//                 : "bg-slate-100 border-slate-200"
//               } p-3 rounded-lg border`}>
//                 <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"} mb-1`}>SUMMARY</p>
//                 <p className={isDarkMode ? "text-slate-300" : "text-slate-600"}>
//                   {selectedTestimonial.summary}
//                 </p>
//               </div>
//             )}
            
//             <div className={`flex justify-end gap-2 mt-4 pt-4 border-t ${isDarkMode ? "border-slate-700/50" : "border-slate-200"}`}>
//               <button className={`${isDarkMode 
//                 ? "bg-slate-700 hover:bg-slate-600 text-white" 
//                 : "bg-slate-200 hover:bg-slate-300 text-slate-800"
//               } px-3 py-2 rounded transition-colors text-sm`}>
//                 Edit
//               </button>
//               <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded transition-colors text-sm">
//                 View Details
//               </button>
//             </div>
//           </div>
//         ) : (
//           <div className="flex flex-col items-center justify-center py-10 text-center">
//             <div className={`${isDarkMode ? "bg-slate-800/50" : "bg-slate-200/70"} p-5 rounded-full mb-4`}>
//               <Filter size={30} className={isDarkMode ? "text-slate-500" : "text-slate-400"} />
//             </div>
//             <h3 className={`text-xl font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
//               No testimonial selected
//             </h3>
//             <p className={isDarkMode ? "text-slate-500" : "text-slate-400"}>
//               Select a testimonial to view detailed information and sentiment analysis.
//             </p>
//           </div>
//         )}
//       </div>
      
//       {/* Additional features section - only show when a testimonial is selected */}
//       {selectedTestimonial && (
//         <>
//           <ActionToolbar 
//             testimonial={selectedTestimonial} 
//             isDarkMode={isDarkMode} 
//             onStatusChange={onStatusChange} 
//           />
          
//           <AIInsights 
//             testimonial={selectedTestimonial} 
//             isDarkMode={isDarkMode} 
//           />
          
//           <CustomTags
//             testimonial={selectedTestimonial}
//             isDarkMode={isDarkMode}   
//           />
          
//           <ResponseTemplates
//             testimonial={selectedTestimonial}
//             isDarkMode={isDarkMode}
//           />
//         </>
//       )}
      
//       <div className={`${isDarkMode 
//         ? "bg-slate-900/70 border-slate-700" 
//         : "bg-slate-100 border-slate-200"
//       } px-6 py-4 border-t flex justify-between items-center`}>
//         <span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
//           Status: <span className={`font-medium capitalize ${isDarkMode ? "text-white" : "text-slate-800"}`}>
//             {currentStatus}
//           </span>
//         </span>
//         <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded transition-colors font-medium flex items-center">
//           <Users size={16} className="mr-2" />
//           Manage All
//         </button>
//       </div>
//     </div>
//   );
// }


import { Users, ThumbsUp, Award, Clock, Filter, Check, X, Star, Calendar } from 'lucide-react';
import { Testimonial } from '@/types/testimonial';
import { AIInsights } from "@/components/custom/dashboard/sentimentanalysis/AllInsight"
import { ResponseTemplates } from "@/components/custom/dashboard/sentimentanalysis/ResponseSelector"
import { ActionToolbar } from '@/components/custom/dashboard/sentimentanalysis/ActionToolBar';
import { CustomTags } from "@/components/custom/dashboard/sentimentanalysis/CustomTag"


interface StatusPanelProps {
  statuses: string[];
  currentStatus: string;
  onStatusChange: (status: string) => void;
  selectedTestimonial: Testimonial | null;
  isDarkMode: boolean; // Keeping the prop to maintain interface compatibility
}

const getDayWithSuffix = (day: number) => {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = day % 100;
  const suffix = suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];
  return `${day}${suffix}`;
};

export function StatusPanel({ 
  statuses, 
  currentStatus, 
  onStatusChange, 
  selectedTestimonial,
  // isDarkMode parameter is still received but not used for conditional rendering
}: StatusPanelProps) {
  // Generate status options with appropriate icons
  const statusOptions = [
    { id: 'approved', label: 'Approved', icon: <Check size={18} className="text-emerald-400" /> },
    { id: 'pending', label: 'Pending', icon: <Clock size={18} className="text-amber-400" /> },
    { id: 'rejected', label: 'Rejected', icon: <X size={18} className="text-red-400" /> },
    { id: 'featured', label: 'Featured', icon: <Award size={18} className="text-indigo-400" /> },
    { id: 'scheduled', label: 'Scheduled', icon: <Calendar size={18} className="text-blue-400" /> }
  ].filter(option => statuses.includes(option.id));

  // Function to get the sentiment color using the Testimonial type
  const getSentimentColor = (sentiment: Testimonial['sentiment']): string => {
    if (!sentiment) return "bg-gray-300";
    
    switch (sentiment.label) {
      case "positive": return "bg-emerald-500";
      case "negative": return "bg-red-500";
      case "neutral": return "bg-gray-400";
      default: return "bg-gray-300";
    }
  };

  // Function to get sentiment icon based on label, using Testimonial's sentiment type
  const getSentimentIcon = (sentiment: Testimonial['sentiment']) => {
    if (!sentiment) return null;
    
    switch (sentiment.label) {
      case "positive": return <ThumbsUp size={16} className="text-white" />;
      case "negative": return <ThumbsUp size={16} className="text-white rotate-180" />;
      case "neutral": return <div className="w-4 h-4 rounded-full border-2 border-white" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-100 to-white shadow-lg border-slate-200 overflow-hidden border">
      <div className="px-6 py-5 bg-white border-slate-200 border-b">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center">
          <Filter className="mr-2 text-indigo-600" size={24} />
          Testimonial Status
        </h2>
      </div>

      <div className="flex flex-wrap p-4 bg-slate-100/50 border-slate-200 border-b gap-2">
        {statusOptions.map((status) => (
          <button
            key={status.id}
            onClick={() => onStatusChange(status.id)}
            className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all ${
              currentStatus === status.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <span className="mr-2">{status.icon}</span>
            {status.label}
          </button>
        ))}
      </div>

      <div className="p-5 flex-1 overflow-auto">
        {selectedTestimonial ? (
          <div className="bg-white border-slate-200 hover:border-indigo-300/70 rounded-lg p-5 border transition-all shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-xl text-slate-800">
                  {selectedTestimonial.title || "Untitled"}
                </h3>
                <div className="flex items-center mt-1">
                  <div className={`w-6 h-6 rounded-full ${getSentimentColor(selectedTestimonial.sentiment)} flex items-center justify-center mr-2`}>
                    {getSentimentIcon(selectedTestimonial.sentiment)}
                  </div>
                  <span className="text-indigo-600">
                    {selectedTestimonial.sentiment?.label || "No sentiment"} 
                    {selectedTestimonial.sentiment?.score && ` (${(selectedTestimonial.sentiment.score * 100).toFixed(0)}%)`}
                  </span>
                </div>
              </div>
              <div className="bg-slate-200 rounded-full px-3 py-1 uppercase text-xs font-bold tracking-wider text-slate-700">
                {selectedTestimonial.status}
              </div>
            </div>
            
            <div className="bg-slate-100 border-slate-200/70 rounded-xl p-4 mb-4 border">
              <p className="text-slate-600 italic">
                {selectedTestimonial.content}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-100 border-slate-200 p-3 rounded-lg border">
                <p className="text-xs text-slate-500 mb-1">AUTHOR</p>
                <p className="text-slate-800">
                  {selectedTestimonial.customer_profile.name
                    ? `${selectedTestimonial.customer_profile.name.split(' ')[0]} ${selectedTestimonial.customer_profile.name.split(' ').pop()}`
                    : "Anonymous"}
                </p>
              </div>
              <div className="bg-slate-100 border-slate-200 p-3 rounded-lg border">
                <p className="text-xs text-slate-500 mb-1">DATE</p>
                <p className="text-slate-800">
                  {selectedTestimonial.created_at
                    ? new Date(selectedTestimonial.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }).replace(/\d+/, (day) => getDayWithSuffix(Number(day)))
                    : "N/A"}
                </p>
              </div>
              {selectedTestimonial.rating && (
                <div className="bg-slate-100 border-slate-200 p-3 rounded-lg border">
                  <p className="text-xs text-slate-500 mb-1">RATING</p>
                  <div className="flex items-center">
                    <Star size={16} className="text-yellow-400 mr-1" fill="currentColor" />
                    <span className="text-slate-800">
                      {selectedTestimonial.rating}/5
                    </span>
                  </div>
                </div>
              )}
              {selectedTestimonial.collection_method && (
                <div className="bg-slate-100 border-slate-200 p-3 rounded-lg border">
                  <p className="text-xs text-slate-500 mb-1">SOURCE</p>
                  <p className="text-slate-800">
                    {selectedTestimonial.collection_method}
                  </p>
                </div>
              )}
            </div>

            {selectedTestimonial.summary && (
              <div className="mt-4 bg-slate-100 border-slate-200 p-3 rounded-lg border">
                <p className="text-xs text-slate-500 mb-1">SUMMARY</p>
                <p className="text-slate-600">
                  {selectedTestimonial.summary}
                </p>
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
              <button className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-2 rounded transition-colors text-sm">
                Edit
              </button>
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded transition-colors text-sm">
                View Details
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="bg-slate-200/70 p-5 rounded-full mb-4">
              <Filter size={30} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-slate-500">
              No testimonial selected
            </h3>
            <p className="text-slate-400">
              Select a testimonial to view detailed information and sentiment analysis.
            </p>
          </div>
        )}
      </div>
      
      {/* Additional features section - only show when a testimonial is selected */}
      {selectedTestimonial && (
        <>
          <ActionToolbar 
            testimonial={selectedTestimonial} 
            isDarkMode={false} 
            onStatusChange={onStatusChange} 
          />
          
          <AIInsights 
            testimonial={selectedTestimonial} 
            isDarkMode={false} 
          />
          
          <CustomTags
            testimonial={selectedTestimonial}
            isDarkMode={false}   
          />
          
          <ResponseTemplates
            testimonial={selectedTestimonial}
            isDarkMode={false}
          />
        </>
      )}
      
      <div className="bg-slate-100 border-slate-200 px-6 py-4 border-t flex justify-between items-center">
        <span className="text-slate-500">
          Status: <span className="font-medium capitalize text-slate-800">
            {currentStatus}
          </span>
        </span>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded transition-colors font-medium flex items-center">
          <Users size={16} className="mr-2" />
          Manage All
        </button>
      </div>
    </div>
  );
}