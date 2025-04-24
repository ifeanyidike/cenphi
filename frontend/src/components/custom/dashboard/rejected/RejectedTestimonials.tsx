
// import React, { useState, useMemo, useEffect } from "react";
// import { 
//   Star, 
//   CheckCircle,  
//   ArchiveIcon,
//   FileText, 
//   Video, 
//   Volume2,
//   Grid,
//   List,
//   Image,
//   Download,
//   X,
//   RefreshCw
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { Testimonial } from "@/types/testimonial";
// import { RejectedListView } from "@/components/custom/dashboard/rejected/RejectedListView";
// import { RejectedCardView } from "@/components/custom/dashboard/rejected/RejectedCardView";
// import { useNavigate } from "react-router-dom";
// import StatusFilterMenu from "@/components/custom/dashboard/approved/StatusFilterMenu";
// import { statusFilterOptions } from "@/types/d";
// import { Badge } from "@/components/ui/badge";

// interface RejectedReviewsProps {
//   testimonials: Testimonial[];
//   onAction?: (id: string, action: 'approve' | 'reject' | 'feature' | 'archive') => void;
// }

// export const RejectedTestimonials: React.FC<RejectedReviewsProps> = ({ 
//   testimonials, 
//   onAction 
// }) => {
//   const navigate = useNavigate();
//   const [activeFilter, setActiveFilter] = useState<'all' | 'text' | 'video' | 'audio' | 'image'>('all');
//   const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
//   const [rejectedfilterMenuOpen, setRejectedFilterMenuOpen] = useState(false);
//   const [activeFilters, setActiveFilters] = useState<string[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>([]);
//   const [confirmationModal, setConfirmationModal] = useState<{
//     isOpen: boolean;
//     type: 'approve' | 'reject' | 'feature' | 'archive' | null;
//     testimonial: Testimonial | null;
//   }>({
//     isOpen: false,
//     type: null,
//     testimonial: null
//   });

//   // Synchronize format filter buttons with activeFilters
//   useEffect(() => {
//     if (activeFilter !== 'all') {
//       // Add format filter if it doesn't exist
//       if (!activeFilters.some(filter => 
//           filter.toLowerCase() === activeFilter.toLowerCase())) {
//         // Remove any existing format filters
//         const nonFormatFilters = activeFilters.filter(f => 
//           !['text', 'video', 'audio', 'image'].includes(f.toLowerCase()));
        
//         // Add the new format filter with proper capitalization
//         setActiveFilters([...nonFormatFilters, activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)]);
//       }
//     } else {
//       // Remove all format filters when 'all' is selected
//       setActiveFilters(activeFilters.filter(f => 
//         !['Text', 'Video', 'Audio', 'Image'].includes(f)));
//     }
//   }, [activeFilter]);

//   // Update the top format filter when format is changed in activeFilters
//   useEffect(() => {
//     const formatFilters = activeFilters.filter(f => 
//       ['Text', 'Video', 'Audio', 'Image'].includes(f));
    
//     if (formatFilters.length === 0) {
//       // If no format filters, set to 'all'
//       setActiveFilter('all');
//     } else if (formatFilters.length === 1) {
//       // If exactly one format filter, synchronize with activeFilter
//       setActiveFilter(formatFilters[0].toLowerCase() as any);
//     }
//     // If multiple format filters, we don't change activeFilter
//   }, [activeFilters]);

//   // Filter testimonials based on search query and active filters
//   const filteredTestimonials = useMemo(() => {
//     return testimonials.filter(testimonial => {
//       // First apply name search filter if present
//       if (searchQuery && 
//           !(testimonial.customer_profile?.name ?? "")
//             .toLowerCase()
//             .includes(searchQuery.toLowerCase())) {
//         return false;
//       }
      
//       // Then apply category filters
//       if (activeFilters.length === 0) return testimonial.status === 'rejected';
  
//       return activeFilters.every((filter: string) => {
//         switch (filter) {
//           // Status filters - only show rejected as base filter
//           case "rejected":
//             return testimonial.status === filter;
//           // case "featured":
//           //   return testimonial.status === "rejected" && testimonial.is_featured;
          
//           // Rating filters
//           case "5":
//           case "4":
//           case "3":
//           case "2":
//           case "1":
//             return testimonial.rating === parseInt(filter);
          
//           // Time filters
//           case "Today": {
//             const today = new Date();
//             const createdDate = new Date(testimonial.created_at);
//             return testimonial.status === "rejected" && today.toDateString() === createdDate.toDateString();
//           }
//           case "Week": {
//             const today = new Date();
//             const createdDate = new Date(testimonial.created_at);
//             const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
//             return testimonial.status === "rejected" && createdDate >= oneWeekAgo && createdDate <= today;
//           }
//           case "Month": {
//             const today = new Date();
//             const createdDate = new Date(testimonial.created_at);
//             return testimonial.status === "rejected" && 
//                    createdDate.getMonth() === today.getMonth() && 
//                    createdDate.getFullYear() === today.getFullYear();
//           }
//           case "Year": {
//             const today = new Date();
//             const createdDate = new Date(testimonial.created_at);
//             return testimonial.status === "rejected" && createdDate.getFullYear() === today.getFullYear();
//           }
          
//           // Media type filters
//           case "Text":
//           case "Image":
//           case "Video":
//           case "Audio":
//             return testimonial.status === "rejected" && testimonial.format.toLowerCase() === filter.toLowerCase();
          
//           default:
//             return testimonial.status === "rejected";
//         }
//       });
//     });
//   }, [activeFilters, testimonials, searchQuery]);

//   // Clear all filters function
//   const clearAllFilters = () => {
//     setActiveFilters([]);
//     setSearchQuery("");
//     setActiveFilter('all');
//   };

//   // Handle format filter click
//   const handleFormatFilterClick = (filter: 'all' | 'text' | 'video' | 'audio' | 'image') => {
//     setActiveFilter(filter);
//   };

//   const renderFormatIcon = (format: string) => {
//     switch(format) {
//       case 'text': return <FileText className="w-4 h-4 text-[#6366F1]" />;
//       case 'video': return <Video className="w-4 h-4 text-[#10B981]" />;
//       case 'audio': return <Volume2 className="w-4 h-4 text-[#8B5CF6]" />;
//       case 'image': return <Image className="w-4 h-4 text-[#2c2440]" />;
//       default: return null;
//     }
//   };

//   const handleViewDetails = (testimonial: Testimonial) => {
//     navigate(`/testimonials/${testimonial.id}`);
//   };

//   const handleActionClick = (testimonial: Testimonial, action: 'approve' | 'reject' | 'feature' | 'archive') => {
//     setConfirmationModal({
//       isOpen: true,
//       type: action,
//       testimonial: testimonial
//     });
//   };

//   const confirmAction = () => {
//     if (confirmationModal.testimonial && confirmationModal.type && onAction) {
//       onAction(confirmationModal.testimonial.id, confirmationModal.type);
//       setConfirmationModal({ isOpen: false, type: null, testimonial: null });
//     }
//   };

//   const closeConfirmationModal = () => {
//     setConfirmationModal({ isOpen: false, type: null, testimonial: null });
//   };

//   const toggleSelectTestimonial = (testimonialId: string) => {
//     setSelectedTestimonials(prev => 
//       prev.includes(testimonialId)
//         ? prev.filter(id => id !== testimonialId)
//         : [...prev, testimonialId]
//     );
//   };

//   const bulkAction = (action: 'feature' | 'archive') => {
//     if (onAction) {
//       selectedTestimonials.forEach(id => {
//         const testimonial = filteredTestimonials.find(t => t.id === id);
//         if (testimonial) {
//           onAction(testimonial.id, action);
//         }
//       });
//       setSelectedTestimonials([]);
//     }
//   };

//   const renderStars = (rating: number) => {
//     return Array.from({ length: 5 }, (_, i) => (
//       <Star
//         key={i}
//         className={`w-4 h-4 ${
//           i < rating ? "text-amber-400 fill-current" : "text-gray-300"
//         }`}
//       />
//     ));
//   };

//   return (
//     <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
//       <div className="max-w-5xl mx-auto">
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
//           <div>
//             <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
//               Rejected Testimonials
//               <span className="ml-3 bg-indigo-100 text-indigo-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
//                 {filteredTestimonials.length}
//               </span>
//             </h1>
//             <p className="text-gray-500 mt-2 text-sm sm:text-base">
//               Review and manage your rejected testimonials
//             </p>
//           </div>
          
//           <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
//             <div className="flex flex-wrap justify-center space-x-1 sm:space-x-2 bg-white border border-gray-200 rounded-lg p-1 mr-0 sm:mr-4">
//               {['all', 'text', 'video', 'audio', 'image'].map((filter) => (
//                 <button
//                   key={filter}
//                   onClick={() => handleFormatFilterClick(filter as any)}
//                   className={cn(
//                     "px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm transition-all duration-300",
//                     activeFilter === filter 
//                       ? "bg-[#6366F1] text-white" 
//                       : "text-gray-600 hover:bg-gray-100"
//                   )}
//                 >
//                   {filter.charAt(0).toUpperCase() + filter.slice(1)}
//                 </button>
//               ))}
//             </div>
//           </div>
          
//           <div className="flex space-x-2">
//             {/* View toggle buttons */}
//             <div className="mr-2 flex bg-gray-100 rounded-lg p-1">
//               <button 
//                 onClick={() => setViewMode("card")}
//                 className={`p-2 rounded-lg transition-all duration-300 ${
//                   viewMode === "card" 
//                   ? "bg-white text-purple-600 shadow-sm" 
//                   : "text-gray-500 hover:bg-gray-200"
//                 }`}
//               >
//                 <Grid className="h-5 w-5" />
//               </button>
//               <button 
//                 onClick={() => setViewMode("list")}
//                 className={`p-2 rounded-lg transition-all duration-300 ${
//                   viewMode === "list" 
//                   ? "bg-white text-purple-600 shadow-sm" 
//                   : "text-gray-500 hover:bg-gray-200"
//                 }`}
//               >
//                 <List className="h-5 w-5" />
//               </button>
//             </div>
            
//             {/* ApprovedFilterMenu component with search functionality */}
//             <StatusFilterMenu
//               statusfilterMenuOpen={rejectedfilterMenuOpen}
//               setFilterMenuOpen={setRejectedFilterMenuOpen}
//               activeFilters={activeFilters}
//               setActiveFilters={setActiveFilters}
//               statusFilterOptions={statusFilterOptions}
//               searchQuery={searchQuery}
//               setSearchQuery={setSearchQuery}
//             />
            
//             <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
//               <Download className="h-5 w-5 text-gray-500" />
//             </button>
//           </div>
//         </div>

//         {/* Show active filters and search query if any */}
//         {(activeFilters.length > 0 || searchQuery) && (
//           <div className="flex flex-wrap gap-2 mt-4 mb-6">
//             {searchQuery && (
//               <Badge 
//                 variant="outline" 
//                 className="px-3 py-1 bg-purple-50 text-purple-600"
//               >
//                 Name: {searchQuery}
//                 <button 
//                   className="ml-2 text-purple-400 hover:text-purple-700"
//                   onClick={() => setSearchQuery("")}
//                 >
//                   <X className="h-3 w-3" />
//                 </button>
//               </Badge>
//             )}
//             {activeFilters.map(filter => (
//               <Badge 
//                 key={filter} 
//                 variant="outline" 
//                 className="px-3 py-1 bg-purple-50 text-purple-600"
//               >
//                 {filter}
//                 <button 
//                   className="ml-2 text-purple-400 hover:text-purple-700"
//                   onClick={() => {
//                     setActiveFilters(activeFilters.filter(f => f !== filter));
//                     // If removing a format filter, update activeFilter as well
//                     if (['Text', 'Video', 'Audio', 'Image'].includes(filter)) {
//                       setActiveFilter('all');
//                     }
//                   }}
//                 >
//                   <X className="h-3 w-3" />
//                 </button>
//               </Badge>
//             ))}
            
//             {(activeFilters.length > 0 || searchQuery) && (
//               <button 
//                 onClick={clearAllFilters}
//                 className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 flex items-center text-sm"
//               >
//                 <RefreshCw className="h-3 w-3 mr-1" />
//                 Clear all
//               </button>
//             )}
//           </div>
//         )}

//         {filteredTestimonials.length === 0 ? (
//           <div className="bg-white rounded-2xl border border-gray-200/50 p-8 sm:p-12 text-center">
//             <div className="flex flex-col items-center justify-center space-y-4">
//               <div className="relative mx-auto w-20 h-20 mb-4">
//                 <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full blur opacity-50 animate-pulse"></div>
//                 <div className="relative bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full p-5 shadow-lg">
//                   <RefreshCw className="h-10 w-10 text-white" />
//                 </div>
//               </div>
              
//               <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
//                 No Matching Testimonials Found
//               </h3>
              
//               <p className="text-gray-500 max-w-md mx-auto mb-6">
//                 We couldn't find any rejected testimonials matching your current filters. Try adjusting your criteria to see more results.
//               </p>
              
//               <button
//                 onClick={clearAllFilters}
//                 className="relative group overflow-hidden bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
//               >
//                 <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine"></div>
                
//                 <div className="flex items-center relative z-10">
//                   <RefreshCw className="h-4 w-4 mr-2 group-hover:animate-spin-slow" />
//                   <span>Reset All Filters</span>
//                 </div>
//               </button>
//             </div>
//           </div>
//         ) : (
//           viewMode === 'list' ? (
//             <RejectedListView 
//               filteredTestimonials={filteredTestimonials}
//               selectedTestimonials={selectedTestimonials}
//               renderFormatIcon={renderFormatIcon}
//               renderStars={renderStars}
//               toggleSelectTestimonial={toggleSelectTestimonial}
//               handleActionClick={handleActionClick}
//               setSelectedTestimonials={setSelectedTestimonials}
//               bulkAction={bulkAction}
//               onViewDetails={handleViewDetails}
//             />
//           ) : (
//             <RejectedCardView 
//               filteredTestimonials={filteredTestimonials}
//               viewMode={viewMode}
//               renderFormatIcon={renderFormatIcon}
//               renderStars={renderStars}
//               handleActionClick={handleActionClick}
//             />
//           )
//         )}

//         {/* Confirmation Modal */}
//         {confirmationModal.isOpen && confirmationModal.testimonial && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center max-w-sm w-full">
//               {confirmationModal.type === 'feature' ? (
//                 <CheckCircle 
//                   className="mx-auto mb-4 text-green-600" 
//                   size={80} 
//                   strokeWidth={1.5} 
//                 />
//               ) : (
//                 <ArchiveIcon   
//                   className="mx-auto mb-4 text-red-600" 
//                   size={80} 
//                   strokeWidth={1.5} 
//                 />
//               )}
              
//               <h2 className="text-xl sm:text-2xl font-bold mb-4">
//                 {confirmationModal.type === 'feature' ? 'Testimonial Featured' : 'Testimonial Archived'}
//               </h2>
              
//               <p className="text-gray-600 mb-6 text-sm sm:text-base">
//                 {confirmationModal.type === 'feature' 
//                   ? 'The testimonial has been successfully featured.' 
//                   : 'The testimonial has been archived.'}
//               </p>
              
//               <div className="flex justify-center space-x-2 sm:space-x-4">
//                 <button 
//                   onClick={confirmAction}
//                   className={`px-4 sm:px-6 py-2 rounded-lg text-white text-sm sm:text-base ${
//                     confirmationModal.type === 'feature' 
//                       ? 'bg-green-500 hover:bg-green-600' 
//                       : 'bg-red-500 hover:bg-red-600'
//                   }`}
//                 >
//                   Confirm
//                 </button>
//                 <button 
//                   onClick={closeConfirmationModal}
//                   className="px-4 sm:px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm sm:text-base"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };



import React, { useState, useMemo, useEffect } from "react";
import { 
  Star, 
  CheckCircle,  
  ArchiveIcon,
  FileText, 
  Video, 
  Volume2,
  Grid,
  List,
  Image,
  Download,
  X,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Testimonial } from "@/types/testimonial";
import { RejectedListView } from "@/components/custom/dashboard/rejected/RejectedListView";
import { RejectedCardView } from "@/components/custom/dashboard/rejected/RejectedCardView";
import { useNavigate } from "react-router-dom";
import StatusFilterMenu from "@/components/custom/dashboard/approved/StatusFilterMenu";
import { statusFilterOptions } from "@/types/d";
import { Badge } from "@/components/ui/badge";

type ActionType = 'approve' | 'reject' | 'feature' | 'archive' | 'delete' | 'pending' | 'view_more' | 'return_to_pending';

interface RejectedReviewsProps {
  testimonials: Testimonial[];
  onAction?: (id: string, action: ActionType) => void;
}

export const RejectedTestimonials: React.FC<RejectedReviewsProps> = ({ 
  testimonials, 
  onAction 
}) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | 'text' | 'video' | 'audio' | 'image'>('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [rejectedfilterMenuOpen, setRejectedFilterMenuOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>([]);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: ActionType | null;
    testimonial: Testimonial | null;
    batchMode: boolean;
  }>({
    isOpen: false,
    type: null,
    testimonial: null,
    batchMode: false
  });

  // Optimize format filter synchronization
  useEffect(() => {
    const formatFilters = ['Text', 'Video', 'Audio', 'Image'];
    const currentFormatFilters = activeFilters.filter(f => formatFilters.includes(f));
    
    if (activeFilter !== 'all') {
      const capitalizedFilter = activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1);
      
      if (!currentFormatFilters.includes(capitalizedFilter)) {
        // Remove any existing format filters and add the new one
        const nonFormatFilters = activeFilters.filter(f => !formatFilters.includes(f));
        setActiveFilters([...nonFormatFilters, capitalizedFilter]);
      }
    } else if (currentFormatFilters.length > 0 && activeFilter === 'all') {
      // Remove all format filters when 'all' is selected
      setActiveFilters(activeFilters.filter(f => !formatFilters.includes(f)));
    }
  }, [activeFilter]);

  // Update the top format filter when format changes in activeFilters
  useEffect(() => {
    const formatFilters = activeFilters.filter(f => 
      ['Text', 'Video', 'Audio', 'Image'].includes(f));
    
    if (formatFilters.length === 0 && activeFilter !== 'all') {
      setActiveFilter('all');
    } else if (formatFilters.length === 1) {
      const newFilter = formatFilters[0].toLowerCase() as 'text' | 'video' | 'audio' | 'image';
      if (activeFilter !== newFilter) {
        setActiveFilter(newFilter);
      }
    }
  }, [activeFilters]);

  // Filter testimonials with memoization for performance
  const filteredTestimonials = useMemo(() => {
    return testimonials.filter(testimonial => {
      // Apply name search filter if present
      if (searchQuery && 
          !(testimonial.customer_profile?.name ?? "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Apply all filters or just show base rejected status
      if (activeFilters.length === 0) return testimonial.status === 'rejected';
  
      return activeFilters.every((filter: string) => {
        // Always ensure we're only working with rejected testimonials
        const baseCheck = testimonial.status === 'rejected';
        if (!baseCheck) return false;

        switch (filter) {
          // Rating filters
          case "5":
          case "4":
          case "3":
          case "2":
          case "1":
            return testimonial.rating === parseInt(filter);
          
          // Time filters
          case "Today": {
            const today = new Date();
            const createdDate = new Date(testimonial.created_at);
            return today.toDateString() === createdDate.toDateString();
          }
          case "Week": {
            const today = new Date();
            const createdDate = new Date(testimonial.created_at);
            const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return createdDate >= oneWeekAgo && createdDate <= today;
          }
          case "Month": {
            const today = new Date();
            const createdDate = new Date(testimonial.created_at);
            return createdDate.getMonth() === today.getMonth() && 
                   createdDate.getFullYear() === today.getFullYear();
          }
          case "Year": {
            const today = new Date();
            const createdDate = new Date(testimonial.created_at);
            return createdDate.getFullYear() === today.getFullYear();
          }
          
          // Media type filters
          case "Text":
          case "Video":
          case "Audio":
          case "Image":
            return testimonial.format.toLowerCase() === filter.toLowerCase();
          
          default:
            return true; // Pass any other filters
        }
      });
    });
  }, [activeFilters, testimonials, searchQuery]);

  // Clear all filters function
  const clearAllFilters = () => {
    setActiveFilters([]);
    setSearchQuery("");
    setActiveFilter('all');
  };

  // Handle format filter click
  const handleFormatFilterClick = (filter: 'all' | 'text' | 'video' | 'audio' | 'image') => {
    setActiveFilter(filter);
  };

  const renderFormatIcon = (format: string) => {
    switch(format) {
      case 'text': return <FileText className="w-4 h-4 text-[#6366F1]" aria-label="Text format" />;
      case 'video': return <Video className="w-4 h-4 text-[#10B981]" aria-label="Video format" />;
      case 'audio': return <Volume2 className="w-4 h-4 text-[#8B5CF6]" aria-label="Audio format" />;
      case 'image': return <Image className="w-4 h-4 text-[#2c2440]" aria-label="Image format" />;
      default: return null;
    }
  };

  const handleViewDetails = (testimonial: Testimonial) => {
    navigate(`/testimonials/${testimonial.id}`);
  };

  const handleActionClick = (testimonial: Testimonial, action: ActionType) => {
    setConfirmationModal({
      isOpen: true,
      type: action,
      testimonial: testimonial,
      batchMode: false
    });
  };

  const confirmAction = () => {
    if (confirmationModal.batchMode) {
      if (confirmationModal.type && onAction && selectedTestimonials.length > 0) {
        selectedTestimonials.forEach(id => {
          onAction(id, confirmationModal.type as ActionType);
        });
        setSelectedTestimonials([]);
        setConfirmationModal({ isOpen: false, type: null, testimonial: null, batchMode: false });
      }
    } else if (confirmationModal.testimonial && confirmationModal.type && onAction) {
      onAction(confirmationModal.testimonial.id, confirmationModal.type);
      setConfirmationModal({ isOpen: false, type: null, testimonial: null, batchMode: false });
    }
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({ isOpen: false, type: null, testimonial: null, batchMode: false });
  };

  const toggleSelectTestimonial = (testimonialId: string) => {
    setSelectedTestimonials(prev => 
      prev.includes(testimonialId)
        ? prev.filter(id => id !== testimonialId)
        : [...prev, testimonialId]
    );
  };

  const bulkAction = (action: ActionType) => {
    if (selectedTestimonials.length === 0) return;
    
    setConfirmationModal({
      isOpen: true,
      type: action,
      testimonial: null,
      batchMode: true
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-amber-400 fill-current" : "text-gray-300"
        }`}
        aria-hidden="true"
      />
    ));
  };

  // Get action details for the confirmation modal
  const getActionDetails = (action: ActionType | null) => {
    switch(action) {
      case 'feature':
        return {
          icon: <CheckCircle className="mx-auto mb-4 text-green-600" size={80} strokeWidth={1.5} />,
          title: "Feature Testimonial",
          description: "This testimonial will be featured on your site. Continue?",
          confirmClass: "bg-green-500 hover:bg-green-600"
        };
      case 'archive':
        return {
          icon: <ArchiveIcon className="mx-auto mb-4 text-amber-600" size={80} strokeWidth={1.5} />,
          title: "Archive Testimonial",
          description: "This testimonial will be moved to the archive. Continue?",
          confirmClass: "bg-amber-500 hover:bg-amber-600"
        };
      case 'delete':
        return {
          icon: <AlertCircle className="mx-auto mb-4 text-red-600" size={80} strokeWidth={1.5} />,
          title: "Delete Testimonial",
          description: "This action cannot be undone. Are you sure you want to delete?",
          confirmClass: "bg-red-500 hover:bg-red-600"
        };
      case 'pending':
        return {
          icon: <RefreshCw className="mx-auto mb-4 text-blue-600" size={80} strokeWidth={1.5} />,
          title: "Return to Pending",
          description: "Move this testimonial back to pending review. Continue?",
          confirmClass: "bg-blue-500 hover:bg-blue-600"
        };
      default:
        return {
          icon: <CheckCircle className="mx-auto mb-4 text-purple-600" size={80} strokeWidth={1.5} />,
          title: "Confirm Action",
          description: "Are you sure you want to proceed with this action?",
          confirmClass: "bg-purple-500 hover:bg-purple-600"
        };
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
              Rejected Testimonials
              <span className="ml-3 bg-indigo-100 text-indigo-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                {filteredTestimonials.length}
              </span>
            </h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              Review and manage your rejected testimonials
            </p>
          </div>
          
          {/* Format filter buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <div className="flex flex-wrap justify-center space-x-1 sm:space-x-2 bg-white border border-gray-200 rounded-lg p-1 mr-0 sm:mr-4">
              {['all', 'text', 'video', 'audio', 'image'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFormatFilterClick(filter as any)}
                  className={cn(
                    "px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm transition-all duration-300",
                    activeFilter === filter 
                      ? "bg-[#6366F1] text-white" 
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                  aria-pressed={activeFilter === filter}
                  aria-label={`Filter by ${filter} format`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* View toggle and action buttons */}
          <div className="flex space-x-2">
            {/* View toggle buttons */}
            <div className="mr-2 flex bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setViewMode("card")}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  viewMode === "card" 
                  ? "bg-white text-purple-600 shadow-sm" 
                  : "text-gray-500 hover:bg-gray-200"
                }`}
                aria-pressed={viewMode === "card"}
                aria-label="Card view"
              >
                <Grid className="h-5 w-5" aria-hidden="true" />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  viewMode === "list" 
                  ? "bg-white text-purple-600 shadow-sm" 
                  : "text-gray-500 hover:bg-gray-200"
                }`}
                aria-pressed={viewMode === "list"}
                aria-label="List view"
              >
                <List className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            
            {/* FilterMenu component */}
            <StatusFilterMenu
              statusfilterMenuOpen={rejectedfilterMenuOpen}
              setFilterMenuOpen={setRejectedFilterMenuOpen}
              activeFilters={activeFilters}
              setActiveFilters={setActiveFilters}
              statusFilterOptions={statusFilterOptions}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
            
            {/* Download button */}
            <button 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Download testimonials"
            >
              <Download className="h-5 w-5 text-gray-500" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Active filters section */}
        {(activeFilters.length > 0 || searchQuery) && (
          <div className="flex flex-wrap gap-2 mt-4 mb-6">
            {/* Search query badge */}
            {searchQuery && (
              <Badge 
                variant="outline" 
                className="px-3 py-1 bg-purple-50 text-purple-600"
              >
                Name: {searchQuery}
                <button 
                  className="ml-2 text-purple-400 hover:text-purple-700"
                  onClick={() => setSearchQuery("")}
                  aria-label={`Remove search filter for "${searchQuery}"`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            )}
            
            {/* Filter badges */}
            {activeFilters.map(filter => (
              <Badge 
                key={filter} 
                variant="outline" 
                className="px-3 py-1 bg-purple-50 text-purple-600"
              >
                {filter}
                <button 
                  className="ml-2 text-purple-400 hover:text-purple-700"
                  onClick={() => {
                    setActiveFilters(activeFilters.filter(f => f !== filter));
                    // If removing a format filter, update activeFilter as well
                    if (['Text', 'Video', 'Audio', 'Image'].includes(filter)) {
                      setActiveFilter('all');
                    }
                  }}
                  aria-label={`Remove filter: ${filter}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            ))}
            
            {/* Clear all filters button */}
            {(activeFilters.length > 0 || searchQuery) && (
              <button 
                onClick={clearAllFilters}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 flex items-center text-sm"
                aria-label="Clear all filters"
              >
                <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" />
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {filteredTestimonials.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200/50 p-8 sm:p-12 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative mx-auto w-20 h-20 mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full blur opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full p-5 shadow-lg">
                  <RefreshCw className="h-10 w-10 text-white" aria-hidden="true" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                No Matching Testimonials Found
              </h3>
              
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                We couldn't find any rejected testimonials matching your current filters. Try adjusting your criteria to see more results.
              </p>
              
              <button
                onClick={clearAllFilters}
                className="relative group overflow-hidden bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine"></div>
                
                <div className="flex items-center relative z-10">
                  <RefreshCw className="h-4 w-4 mr-2 group-hover:animate-spin-slow" aria-hidden="true" />
                  <span>Reset All Filters</span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          // List or Card view based on viewMode
          viewMode === 'list' ? (
            <RejectedListView 
              filteredTestimonials={filteredTestimonials}
              selectedTestimonials={selectedTestimonials}
              renderFormatIcon={renderFormatIcon}
              renderStars={renderStars}
              toggleSelectTestimonial={toggleSelectTestimonial}
              handleActionClick={handleActionClick}
              setSelectedTestimonials={setSelectedTestimonials}
              bulkAction={bulkAction}
              onViewDetails={handleViewDetails}
            />
          ) : (
            <RejectedCardView 
              filteredTestimonials={filteredTestimonials}
              viewMode={viewMode}
              renderFormatIcon={renderFormatIcon}
              renderStars={renderStars}
              handleActionClick={handleActionClick}
            />
          )
        )}

        {/* Enhanced Confirmation Modal */}
        {confirmationModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
               role="dialog"
               aria-modal="true"
               aria-labelledby="confirmation-title">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-full"
                 onClick={(e) => e.stopPropagation()}>
              
              {getActionDetails(confirmationModal.type).icon}
              
              <h2 id="confirmation-title" className="text-xl sm:text-2xl font-bold mb-4">
                {getActionDetails(confirmationModal.type).title}
              </h2>
              
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                {confirmationModal.batchMode 
                  ? `This action will affect ${selectedTestimonials.length} selected testimonials. Continue?` 
                  : getActionDetails(confirmationModal.type).description}
              </p>
              
              <div className="flex justify-center space-x-2 sm:space-x-4">
                <button 
                  onClick={confirmAction}
                  className={`px-4 sm:px-6 py-2 rounded-lg text-white text-sm sm:text-base ${getActionDetails(confirmationModal.type).confirmClass}`}
                >
                  Confirm
                </button>
                <button 
                  onClick={closeConfirmationModal}
                  className="px-4 sm:px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};