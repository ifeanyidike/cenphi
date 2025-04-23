// import { Check, X, Award, Calendar, Star, Flag, Share2 } from 'lucide-react';
// import { Testimonial } from '@/types/testimonial';

// interface ActionToolbarProps {
//   testimonial: Testimonial; // Removed as it is unused
//   isDarkMode: boolean;
//   onStatusChange: (status: string) => void;
// }

// export function ActionToolbar({ isDarkMode, onStatusChange }: Omit<ActionToolbarProps, 'testimonial'>) {
//   return (
//     <div className={`px-6 py-5 ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200"} border-t flex flex-wrap items-center gap-4 overflow-x-auto`}>
//       <span className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
//         Quick Actions:
//       </span>
//       <div className="flex flex-grow flex-wrap gap-3">
//         <button 
//           onClick={() => onStatusChange('approved')}
//           className={`flex items-center px-3 py-2 rounded text-sm ${isDarkMode ? "text-emerald-400 hover:bg-slate-700" : "text-emerald-600 hover:bg-slate-200"} transition-colors`}
//         >
//           <Check size={16} className="mr-2" /> Approve
//         </button>
//         <button 
//           onClick={() => onStatusChange('rejected')}
//           className={`flex items-center px-3 py-2 rounded text-sm ${isDarkMode ? "text-red-400 hover:bg-slate-700" : "text-red-600 hover:bg-slate-200"} transition-colors`}
//         >
//           <X size={16} className="mr-2" /> Reject
//         </button>
//         <button 
//           onClick={() => onStatusChange('featured')}
//           className={`flex items-center px-3 py-2 rounded text-sm ${isDarkMode ? "text-indigo-400 hover:bg-slate-700" : "text-indigo-600 hover:bg-slate-200"} transition-colors`}
//         >
//           <Award size={16} className="mr-2" /> Feature
//         </button>
//         <button 
//           onClick={() => onStatusChange('scheduled')}
//           className={`flex items-center px-3 py-2 rounded text-sm ${isDarkMode ? "text-blue-400 hover:bg-slate-700" : "text-blue-600 hover:bg-slate-200"} transition-colors`}
//         >
//           <Calendar size={16} className="mr-2" /> Schedule
//         </button>
//         <span className="h-6 w-px bg-slate-600/50 self-center"></span>
//         <button className={`flex items-center px-3 py-2 rounded text-sm ${isDarkMode ? "text-amber-400 hover:bg-slate-700" : "text-amber-600 hover:bg-slate-200"} transition-colors`}>
//           <Star size={16} className="mr-2" /> Add to Collection
//         </button>
//         <button className={`flex items-center px-3 py-2 rounded text-sm ${isDarkMode ? "text-purple-400 hover:bg-slate-700" : "text-purple-600 hover:bg-slate-200"} transition-colors`}>
//           <Flag size={16} className="mr-2" /> Flag for Review
//         </button>
//         <button className={`flex items-center px-3 py-2 rounded text-sm ${isDarkMode ? "text-slate-300 hover:bg-slate-700" : "text-slate-600 hover:bg-slate-200"} transition-colors`}>
//           <Share2 size={16} className="mr-2" /> Share
//         </button>
//       </div>
//     </div>
//   );
// }


import { Check, X, Award, Calendar, Star, Flag, Share2 } from 'lucide-react';
import { Testimonial } from '@/types/testimonial';

interface ActionToolbarProps {
  testimonial: Testimonial;
  isDarkMode: boolean;
  onStatusChange: (status: string) => void;
}

export function ActionToolbar({ testimonial, isDarkMode, onStatusChange }: ActionToolbarProps) {
  // Function to get relevant testimonial info for tooltips or additional functionality
  const getTestimonialInfo = () => {
    return `${testimonial.customer_profile?.name} - ${testimonial.customer_profile?.company || 'Unknown'}`;
  };

  return (
    <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
      <div className="mb-2 font-medium">Quick Actions:</div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onStatusChange('approved')}
          title={`Approve testimonial from ${getTestimonialInfo()}`}
          className={`flex items-center gap-1 px-3 py-2 rounded text-sm ${
            isDarkMode ? "text-emerald-400 hover:bg-slate-700" : "text-emerald-600 hover:bg-slate-200"
          } transition-colors`}
        >
          <Check size={16} />
          Approve
        </button>
        
        <button
          onClick={() => onStatusChange('rejected')}
          title={`Reject testimonial from ${getTestimonialInfo()}`}
          className={`flex items-center gap-1 px-3 py-2 rounded text-sm ${
            isDarkMode ? "text-red-400 hover:bg-slate-700" : "text-red-600 hover:bg-slate-200"
          } transition-colors`}
        >
          <X size={16} />
          Reject
        </button>
        
        <button
          onClick={() => onStatusChange('featured')}
          title={`Feature testimonial from ${getTestimonialInfo()}`}
          className={`flex items-center gap-1 px-3 py-2 rounded text-sm ${
            isDarkMode ? "text-indigo-400 hover:bg-slate-700" : "text-indigo-600 hover:bg-slate-200"
          } transition-colors`}
        >
          <Award size={16} />
          Feature
        </button>
        
        <button
          onClick={() => onStatusChange('scheduled')}
          title={`Schedule testimonial from ${getTestimonialInfo()}`}
          className={`flex items-center gap-1 px-3 py-2 rounded text-sm ${
            isDarkMode ? "text-blue-400 hover:bg-slate-700" : "text-blue-600 hover:bg-slate-200"
          } transition-colors`}
        >
          <Calendar size={16} />
          Schedule
        </button>
        
        <button
          onClick={() => onStatusChange('collection')}
          title="Add to collection"
          className={`flex items-center gap-1 px-3 py-2 rounded text-sm ${
            isDarkMode ? "text-amber-400 hover:bg-slate-700" : "text-amber-600 hover:bg-slate-200"
          } transition-colors`}
        >
          <Star size={16} />
          Add to Collection
        </button>
        
        <button
          onClick={() => onStatusChange('flagged')}
          title="Flag for review"
          className={`flex items-center gap-1 px-3 py-2 rounded text-sm ${
            isDarkMode ? "text-orange-400 hover:bg-slate-700" : "text-orange-600 hover:bg-slate-200"
          } transition-colors`}
        >
          <Flag size={16} />
          Flag for Review
        </button>
        
        <button
          onClick={() => {
            // Create a shareable link or open a share dialog
            const shareUrl = `${window.location.origin}/testimonials/${testimonial.id}`;
            navigator.clipboard.writeText(shareUrl);
            alert('Testimonial link copied to clipboard!');
          }}
          title="Share testimonial"
          className={`flex items-center gap-1 px-3 py-2 rounded text-sm ${
            isDarkMode ? "text-purple-400 hover:bg-slate-700" : "text-purple-600 hover:bg-slate-200"
          } transition-colors`}
        >
          <Share2 size={16} />
          Share
        </button>
      </div>
    </div>
  );
}