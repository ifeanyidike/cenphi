import { Users, LineChart, Brain, ArrowUpRight, Target } from 'lucide-react';
import { Testimonial } from '@/types/testimonial';

interface AIInsightsProps {
  testimonial: Testimonial;
  isDarkMode: boolean;
}

export function AIInsights({ testimonial, isDarkMode }: AIInsightsProps) {
  // In a real application, these values would be derived from actual testimonial analysis
  const priority = testimonial.sentiment?.label === 'negative' ? 'High' : 'Medium';
  const priorityColor = priority === 'High' ? 
    (isDarkMode ? "text-red-400" : "text-red-600") : 
    (isDarkMode ? "text-emerald-400" : "text-emerald-600");

  const topicAnalysis = 'Product UX'; // Example topic
  const similarCases = 3; // Example count
  // Removed unused sentimentStrength variable
  const customerValue = 'High'; // Example value

  return (
    <div className={`px-6 py-4 ${isDarkMode ? "bg-slate-800/60 border-slate-700" : "bg-indigo-50/50 border-slate-200"} border-t`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className={`p-1 rounded ${isDarkMode ? "bg-indigo-500/20" : "bg-indigo-100"}`}>
            <Brain size={14} className={isDarkMode ? "text-indigo-400" : "text-indigo-600"} />
          </div>
          <h4 className={`ml-2 font-medium ${isDarkMode ? "text-indigo-400" : "text-indigo-700"}`}>AI Insights</h4>
        </div>
        <button className={`text-xs flex items-center ${isDarkMode ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"}`}>
          View Full Analysis <ArrowUpRight size={12} className="ml-1" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-2 rounded ${isDarkMode ? "bg-slate-900/40" : "bg-white"} text-center`}>
          <div className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Response Priority</div>
          <div className={`text-lg font-bold ${priorityColor}`}>{priority}</div>
        </div>
        <div className={`p-2 rounded ${isDarkMode ? "bg-slate-900/40" : "bg-white"} text-center`}>
          <div className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Topic Analysis</div>
          <div className={`text-lg font-bold ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>{topicAnalysis}</div>
        </div>
        <div className={`p-2 rounded ${isDarkMode ? "bg-slate-900/40" : "bg-white"} text-center`}>
          <div className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Similar Cases</div>
          <div className={`text-lg font-bold ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>{similarCases} Found</div>
        </div>
        <div className={`p-2 rounded ${isDarkMode ? "bg-slate-900/40" : "bg-white"} text-center`}>
          <div className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Customer Value</div>
          <div className={`text-lg font-bold ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>{customerValue}</div>
        </div>
      </div>
    </div>
  );
}