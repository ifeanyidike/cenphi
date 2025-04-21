import { Check, X, Award, Clock, Calendar, Star, Flag, Share2 } from 'lucide-react';
import { Testimonial } from '@/types/testimonial';

interface ActionToolbarProps {
  testimonial: Testimonial;
  isDarkMode: boolean;
  onStatusChange: (status: string) => void;
}

export function ActionToolbar({ testimonial, isDarkMode, onStatusChange }: ActionToolbarProps) {
  return (
    <div className={`px-6 py-5 ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200"} border-t flex flex-wrap items-center gap-4 overflow-x-auto`}>
      <span className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
        Quick Actions:
      </span>
      <div className="flex flex-grow flex-wrap gap-3">
        <button 
          onClick={() => onStatusChange('approved')}
          className={`flex items-center px-3 py-2 rounded text-sm ${isDarkMode ? "text-emerald-400 hover:bg-slate-700" : "text-emerald-600 hover:bg-slate-200"} transition-colors`}
        >
          <Check size={16} className="mr-2" /> Approve
        </button>
        <button 
          onClick={() => onStatusChange('rejected')}
          className={`flex items-center px-3 py-2 rounded text-sm ${isDarkMode ? "text-red-400 hover:bg-slate-700" : "text-red-600 hover:bg-slate-200"} transition-colors`}
        >
          <X size={16} className="mr-2" /> Reject
        </button>
        <button 
          onClick={() => onStatusChange('featured')}
          className={`flex items-center px-3 py-2 rounded text-sm ${isDarkMode ? "text-indigo-400 hover:bg-slate-700" : "text-indigo-600 hover:bg-slate-200"} transition-colors`}
        >
          <Award size={16} className="mr-2" /> Feature
        </button>
        <button 
          onClick={() => onStatusChange('scheduled')}
          className={`flex items-center px-3 py-2 rounded text-sm ${isDarkMode ? "text-blue-400 hover:bg-slate-700" : "text-blue-600 hover:bg-slate-200"} transition-colors`}
        >
          <Calendar size={16} className="mr-2" /> Schedule
        </button>
        <span className="h-6 w-px bg-slate-600/50 self-center"></span>
        <button className={`flex items-center px-3 py-2 rounded text-sm ${isDarkMode ? "text-amber-400 hover:bg-slate-700" : "text-amber-600 hover:bg-slate-200"} transition-colors`}>
          <Star size={16} className="mr-2" /> Add to Collection
        </button>
        <button className={`flex items-center px-3 py-2 rounded text-sm ${isDarkMode ? "text-purple-400 hover:bg-slate-700" : "text-purple-600 hover:bg-slate-200"} transition-colors`}>
          <Flag size={16} className="mr-2" /> Flag for Review
        </button>
        <button className={`flex items-center px-3 py-2 rounded text-sm ${isDarkMode ? "text-slate-300 hover:bg-slate-700" : "text-slate-600 hover:bg-slate-200"} transition-colors`}>
          <Share2 size={16} className="mr-2" /> Share
        </button>
      </div>
    </div>
  );
}