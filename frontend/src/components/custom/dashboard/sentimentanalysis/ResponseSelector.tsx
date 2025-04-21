import { useState } from 'react';
import { MessageSquare, Copy, Check, Edit } from 'lucide-react';
import { Testimonial } from '@/types/testimonial';

interface ResponseTemplatesProps {
  testimonial: Testimonial;
  isDarkMode: boolean;
}

export function ResponseTemplates({ testimonial, isDarkMode }: ResponseTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const templates = [
    { id: 'thank', name: 'Thank You', text: 'Thank you for your valuable feedback! We appreciate you taking the time to share your experience.' },
    { id: 'apology', name: 'Apology', text: 'We sincerely apologize for the inconvenience caused. We are looking into this issue right away.' },
    { id: 'followup', name: 'Follow-up', text: 'We do love to learn more about your experience. Would you be available for a quick call?' }
  ];
  
  const handleCopy = () => {
    if (selectedTemplate) {
      navigator.clipboard.writeText(templates.find(t => t.id === selectedTemplate)?.text || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  return (
    <div className={`px-6 py-4 ${isDarkMode ? "bg-slate-800/30 border-slate-700" : "bg-slate-50 border-slate-200"} border-t`}>
      <div className="flex items-center mb-3">
        <div className={`p-1 rounded ${isDarkMode ? "bg-blue-500/20" : "bg-blue-100"}`}>
          <MessageSquare size={14} className={isDarkMode ? "text-blue-400" : "text-blue-600"} />
        </div>
        <h4 className={`ml-2 font-medium ${isDarkMode ? "text-blue-400" : "text-blue-700"}`}>Response Templates</h4>
      </div>
      
      <div className="flex gap-2 mb-3">
        {templates.map(template => (
          <button
            key={template.id}
            className={`px-3 py-1 rounded text-sm ${
              selectedTemplate === template.id 
              ? isDarkMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-600 text-white'
              : isDarkMode 
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            {template.name}
          </button>
        ))}
      </div>
      
      {selectedTemplate && (
        <div className={`flex ${isDarkMode ? "bg-slate-900/40 border-slate-700" : "bg-white border-slate-200"} border rounded p-2`}>
          <p className={`text-sm flex-1 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
            {templates.find(t => t.id === selectedTemplate)?.text}
          </p>
          <div className="flex gap-1">
            <button 
              className={`p-1 rounded ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
              title="Edit template"
            >
              <Edit size={16} className={isDarkMode ? "text-slate-400" : "text-slate-500"} />
            </button>
            <button 
              className={`p-1 rounded ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
              onClick={handleCopy}
              title={copied ? "Copied!" : "Copy to clipboard"}
            >
              {copied ? 
                <Check size={16} className="text-emerald-500" />
                : 
                <Copy size={16} className={isDarkMode ? "text-slate-400" : "text-slate-500"} />
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}