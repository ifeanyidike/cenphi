// import { useState } from 'react';
// import { Tag, X, Plus } from 'lucide-react';
// import { Testimonial } from '@/types/testimonial';

// interface CustomTagsProps {
//   testimonial: Testimonial;
//   isDarkMode: boolean;
// }

// export function CustomTags({ isDarkMode }: Omit<CustomTagsProps, 'testimonial'>) {
//   // Sample tags - in a real app, these would come from the testimonial data
//   const [tags, setTags] = useState([
//     { id: '1', name: 'Support Inquiry', color: 'purple' },
//     { id: '2', name: 'Feature Request', color: 'blue' },
//     { id: '3', name: 'Premium Customer', color: 'pink' }
//   ]);
  
//   const [newTagInput, setNewTagInput] = useState(false);
  
//   const getTagColor = (color: string) => {
//     switch (color) {
//       case 'purple':
//         return isDarkMode ? "bg-purple-900/40 text-purple-300" : "bg-purple-100 text-purple-800";
//       case 'blue':
//         return isDarkMode ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-800";
//       case 'pink':
//         return isDarkMode ? "bg-pink-900/40 text-pink-300" : "bg-pink-100 text-pink-800";
//       case 'green':
//         return isDarkMode ? "bg-green-900/40 text-green-300" : "bg-green-100 text-green-800";
//       case 'amber':
//         return isDarkMode ? "bg-amber-900/40 text-amber-300" : "bg-amber-100 text-amber-800";
//       default:
//         return isDarkMode ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-700";
//     }
//   };
  
//   const removeTag = (tagId: string) => {
//     setTags(tags.filter(tag => tag.id !== tagId));
//   };
  
//   const addTag = () => {
//     setNewTagInput(true);
//   };
  
//   const handleSubmitTag = (e: React.FormEvent) => {
//     e.preventDefault();
//     const input = document.getElementById('newTag') as HTMLInputElement;
//     if (input && input.value.trim()) {
//       const newTag = {
//         id: Date.now().toString(),
//         name: input.value.trim(),
//         color: ['purple', 'blue', 'pink', 'green', 'amber'][Math.floor(Math.random() * 5)]
//       };
//       setTags([...tags, newTag]);
//       setNewTagInput(false);
//     }
//   };

//   return (
//     <div className={`px-6 py-4 ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"} border-t`}>
//       <div className="flex justify-between items-center mb-3">
//         <div className="flex items-center">
//           <div className={`p-1 rounded ${isDarkMode ? "bg-teal-500/20" : "bg-teal-100"}`}>
//             <Tag size={14} className={isDarkMode ? "text-teal-400" : "text-teal-600"} />
//           </div>
//           <h4 className={`ml-2 font-medium ${isDarkMode ? "text-teal-400" : "text-teal-700"}`}>Custom Tags</h4>
//         </div>
//         <button 
//           onClick={addTag} 
//           className={`text-xs flex items-center ${isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"}`}
//         >
//           <Plus size={12} className="mr-1" /> Add Tag
//         </button>
//       </div>
      
//       <div className="flex flex-wrap gap-2">
//         {tags.map(tag => (
//           <span 
//             key={tag.id}
//             className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getTagColor(tag.color)}`}
//           >
//             {tag.name}
//             <button onClick={() => removeTag(tag.id)} className="ml-1">
//               <X size={12} className="hover:opacity-70" />
//             </button>
//           </span>
//         ))}
        
//         {newTagInput && (
//           <form onSubmit={handleSubmitTag} className="inline-block">
//             <input
//               id="newTag"
//               type="text"
//               autoFocus
//               className={`px-2 py-1 rounded-full text-xs ${
//                 isDarkMode 
//                   ? "bg-slate-700 text-white border-slate-600" 
//                   : "bg-white text-slate-800 border-slate-300"
//               } border`}
//               placeholder="Type tag name..."
//               onBlur={() => setNewTagInput(false)}
//             />
//           </form>
//         )}
        
//         {!newTagInput && (
//           <button 
//             onClick={addTag}
//             className={`px-2 py-1 rounded-full text-xs flex items-center ${
//               isDarkMode 
//                 ? "bg-slate-700 text-slate-400 hover:bg-slate-600" 
//                 : "bg-slate-200 text-slate-600 hover:bg-slate-300"
//             }`}
//           >
//             <Plus size={12} className="mr-1" /> Tag
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from 'react';
import { Tag, X, Plus } from 'lucide-react';
import { Testimonial } from '@/types/testimonial';

interface CustomTagsProps {
  testimonial: Testimonial;
  isDarkMode: boolean;
  onTagsChange?: (tags: Array<{id: string, name: string, color: string}>) => void;
}

export function CustomTags({ testimonial, isDarkMode, onTagsChange }: CustomTagsProps) {
  // Initialize tags from testimonial data if available, otherwise use default tags
  const [tags, setTags] = useState<Array<{id: string, name: string, color: string}>>([]);
  const [newTagInput, setNewTagInput] = useState(false);
  
  // Load tags from testimonial when component mounts or testimonial changes
  useEffect(() => {
    if (testimonial && testimonial.tags) {
      const tagsFromTestimonial = testimonial.customer_profile?.custom_fields?.tags;
      if (Array.isArray(tagsFromTestimonial)) {
        setTags(tagsFromTestimonial as Array<{ id: string; name: string; color: string }>);
      } else {
        setTags([]);
      }
    } else {
      // Fallback to default tags if testimonial doesn't have any
      setTags([
        { id: '1', name: 'Support Inquiry', color: 'purple' },
        { id: '2', name: 'Feature Request', color: 'blue' },
        { id: '3', name: 'Premium Customer', color: 'pink' }
      ]);
    }
  }, [testimonial]);

  // Notify parent component when tags change
  useEffect(() => {
    if (onTagsChange) {
      onTagsChange(tags);
    }
  }, [tags, onTagsChange]);
  
  const getTagColor = (color: string) => {
    switch (color) {
      case 'purple':
        return isDarkMode ? "bg-purple-900/40 text-purple-300" : "bg-purple-100 text-purple-800";
      case 'blue':
        return isDarkMode ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-800";
      case 'pink':
        return isDarkMode ? "bg-pink-900/40 text-pink-300" : "bg-pink-100 text-pink-800";
      case 'green':
        return isDarkMode ? "bg-green-900/40 text-green-300" : "bg-green-100 text-green-800";
      case 'amber':
        return isDarkMode ? "bg-amber-900/40 text-amber-300" : "bg-amber-100 text-amber-800";
      default:
        return isDarkMode ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-700";
    }
  };
  
  const removeTag = (tagId: string) => {
    const updatedTags = tags.filter(tag => tag.id !== tagId);
    setTags(updatedTags);
  };
  
  const addTag = () => {
    setNewTagInput(true);
  };
  
  const handleSubmitTag = (e: React.FormEvent) => {
    e.preventDefault();
    const input = document.getElementById('newTag') as HTMLInputElement;
    if (input && input.value.trim()) {
      const newTag = {
        id: Date.now().toString(),
        name: input.value.trim(),
        color: ['purple', 'blue', 'pink', 'green', 'amber'][Math.floor(Math.random() * 5)]
      };
      setTags([...tags, newTag]);
      setNewTagInput(false);
    }
  };

  // Display testimonial info in the header if available
  const testimonialInfo = testimonial ? 
    `${testimonial.customer_profile?.name?.split(' ')[0] || ''}${testimonial.customer_profile?.company ? ` from ${testimonial.customer_profile?.company}` : ''}` : 
    'Testimonial';

  return (
    <div className={`px-6 py-4 ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"} border-t`}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <div className={`p-1 rounded ${isDarkMode ? "bg-teal-500/20" : "bg-teal-100"}`}>
            <Tag size={14} className={isDarkMode ? "text-teal-400" : "text-teal-600"} />
          </div>
          <h4 className={`ml-2 font-medium ${isDarkMode ? "text-teal-400" : "text-teal-700"}`}>
            Custom Tags for {testimonialInfo}
          </h4>
        </div>
        <button 
  onClick={addTag} 
  className={`text-xs flex items-center whitespace-nowrap ${isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"}`}
>
  <Plus size={12} className="mr-1" /> Add Tag
</button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span 
            key={tag.id}
            className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getTagColor(tag.color)}`}
          >
            {tag.name}
            <button onClick={() => removeTag(tag.id)} className="ml-1">
              <X size={12} className="hover:opacity-70" />
            </button>
          </span>
        ))}
        
        {newTagInput && (
          <form onSubmit={handleSubmitTag} className="inline-block">
            <input
              id="newTag"
              type="text"
              autoFocus
              className={`px-2 py-1 rounded-full text-xs ${
                isDarkMode 
                  ? "bg-slate-700 text-white border-slate-600" 
                  : "bg-white text-slate-800 border-slate-300"
              } border`}
              placeholder="Type tag name..."
              onBlur={() => setNewTagInput(false)}
            />
          </form>
        )}
        
        {!newTagInput && tags.length > 0 && (
          <button 
            onClick={addTag}
            className={`px-2 py-1 rounded-full text-xs flex items-center ${
              isDarkMode 
                ? "bg-slate-700 text-slate-400 hover:bg-slate-600" 
                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
            }`}
          >
            <Plus size={12} className="mr-1" /> Tag
          </button>
        )}
      </div>
    </div>
  );
}