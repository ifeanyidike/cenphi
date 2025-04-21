// import React, { useState } from "react";
// import { 
//   CheckCircle, 
//   MoreHorizontal,
//   Calendar,
//   ArchiveIcon,
//   Star,
//   ChevronLeft,
//   ChevronRight
// } from "lucide-react";
// import { Testimonial } from "@/types/testimonial";
// import { useNavigate } from "react-router";
// import { motion } from "framer-motion";
// import { cn } from "@/lib/utils";

// interface RejectedListViewProps {
//   filteredTestimonials: Testimonial[];
//   selectedTestimonials: string[];
//   renderFormatIcon: (format: string) => React.ReactNode;
//   renderStars: (rating: number) => React.ReactNode;
//   toggleSelectTestimonial: (id: string) => void;
//   handleActionClick: (testimonial: Testimonial, action: 'approve' | 'reject' | 'feature' | 'archive') => void;
//   setSelectedTestimonials: React.Dispatch<React.SetStateAction<string[]>>;
//   bulkAction: (action: 'feature' | 'archive') => void;
//   onViewDetails: (testimonial: Testimonial) => void;
// }

// export const RejectedListView: React.FC<RejectedListViewProps> = ({
//   filteredTestimonials,
//   selectedTestimonials,
//   renderFormatIcon,
//   toggleSelectTestimonial,
//   handleActionClick,
//   setSelectedTestimonials,
//   bulkAction,
//   onViewDetails
// }) => {
//   const navigate = useNavigate();
  
//   // Pagination state
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 4; // Show 4 items per page as requested
//   const totalPages = Math.ceil(filteredTestimonials.length / itemsPerPage);
  
//   // Get current testimonials for the page
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentTestimonials = filteredTestimonials.slice(indexOfFirstItem, indexOfLastItem);
  
//   // Change page
//   const goToPage = (pageNumber: number): void => {
//     setCurrentPage(pageNumber);
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };
  
//   // Format date for display
//   const formatDate = (date: Date) => {
//     if (!date) return "No date";
//     return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
//   };

//   // Custom star rating renderer with improved design
//   const customRenderStars = (rating: number) => {
//     return (
//       <div className="flex items-center">
//         {[...Array(5)].map((_, i) => (
//           <Star
//             key={i}
//             className={cn(
//               "w-3 h-3",
//               i < rating 
//                 ? "text-amber-500 fill-amber-500" 
//                 : "text-gray-300"
//             )}
//           />
//         ))}
//         <span className="ml-2 text-xs font-medium text-slate-700">{rating.toFixed(1)}</span>
//       </div>
//     );
//   };

//   // Generate array of visible page numbers
//   const getVisiblePageNumbers = () => {
//     if (totalPages <= 5) {
//       // If we have 5 or fewer pages, show all page numbers
//       return Array.from({ length: totalPages }, (_, i) => i + 1);
//     }
    
//     // Always show first, last, and pages around current
//     const pageNumbers = [];
    
//     // Always include page 1
//     pageNumbers.push(1);
    
//     if (currentPage > 3) {
//       // Add ellipsis if current page is away from start
//       pageNumbers.push("...");
//     }
    
//     // Pages around current page
//     const startPage = Math.max(2, currentPage - 1);
//     const endPage = Math.min(totalPages - 1, currentPage + 1);
    
//     for (let i = startPage; i <= endPage; i++) {
//       pageNumbers.push(i);
//     }
    
//     if (currentPage < totalPages - 2) {
//       // Add ellipsis if current page is away from end
//       pageNumbers.push("...");
//     }
    
//     // Always include last page if it's not already included
//     if (totalPages > 1) {
//       pageNumbers.push(totalPages);
//     }
    
//     return pageNumbers;
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden">
     
//       {/* Header with selection and bulk actions */}
//       <div className="px-4 sm:px-6 py-4 border-b border-slate-300 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
//         <div className="flex items-center space-x-4">
//           <div className="relative inline-flex items-center">
//             <input 
//               type="checkbox"
//               className="w-5 h-5 rounded-md text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
//               checked={selectedTestimonials.length === currentTestimonials.length && currentTestimonials.length > 0}
//               onChange={() => {
//                 // If all current visible testimonials are selected, deselect them
//                 // Otherwise, select all visible testimonials
//                 const currentIds = currentTestimonials.map(t => t.id);
//                 const allCurrentSelected = currentIds.every(id => selectedTestimonials.includes(id));
                
//                 if (allCurrentSelected) {
//                   // Remove currently visible testimonials from selection
//                   setSelectedTestimonials(prevSelected => 
//                     prevSelected.filter(id => !currentIds.includes(id))
//                   );
//                 } else {
//                   // Add currently visible testimonials to selection
//                   setSelectedTestimonials(prevSelected => {
//                     const newSelected = [...prevSelected];
//                     currentIds.forEach(id => {
//                       if (!newSelected.includes(id)) {
//                         newSelected.push(id);
//                       }
//                     });
//                     return newSelected;
//                   });
//                 }
//               }}
//             />
//             <span className="text-sm font-medium text-slate-700 ml-3">
//               {selectedTestimonials.length > 0 
//                 ? `${selectedTestimonials.length} selected` 
//                 : 'Select all'}
//             </span>
//           </div>
//         </div>
        
//         <div className="flex flex-wrap gap-2">
//           {selectedTestimonials.length > 0 ? (
//             <>
//               <button 
//                 className="text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm"
//                 onClick={() => bulkAction('feature')}
//               >
//                 <CheckCircle className="w-4 h-4" />
//                 <span>Approve</span>
//               </button>
//               <button 
//                 className="text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm"
//                 onClick={() => bulkAction('archive')}
//               >
//                 <ArchiveIcon className="w-4 h-4" />
//                 <span>Delete Selected</span>
//               </button>
//             </>
//           ) : (
//             <div className="text-sm text-slate-400 italic">Select testimonials to perform bulk actions</div>
//           )}
//         </div>
//       </div>

//       {/* Testimonial List */}
//       {filteredTestimonials.length === 0 ? (
//         <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
//           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
//             <MoreHorizontal className="w-8 h-8 text-slate-400" />
//           </div>
//           <h3 className="text-lg font-medium text-slate-700 mb-1">No Rejected testimonials</h3>
//           <p className="text-slate-400 max-w-md">There are currently no rejected testimonials. New submissions will appear here.</p>
//         </div>
//       ) : (
//         <div className="divide-y divide-slate-300">
//           {currentTestimonials.map((testimonial, index) => (
//             <motion.div 
//               key={testimonial.id} 
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.2, delay: index * 0.05 }}
//               className="group cursor-pointer hover:bg-slate-50 transition-all duration-200"
//               onClick={() => onViewDetails(testimonial)}
//             >
//               <div className="p-4 sm:p-6">
//                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
//                   {/* Mobile header - only visible on small screens */}
//                   <div className="lg:hidden col-span-1 flex items-center justify-between w-full mb-2">
//                     <div className="flex items-center">
//                       <input 
//                         type="checkbox"
//                         className="rounded-md text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
//                         checked={selectedTestimonials.includes(testimonial.id)}
//                         onChange={(e) => {
//                           e.stopPropagation();
//                           toggleSelectTestimonial(testimonial.id);
//                         }}
//                       />
//                       <div className="ml-4">
//                         {customRenderStars(testimonial.rating ?? 0)}
//                       </div>
//                     </div>
                    
//                     <div className="flex items-center text-xs text-slate-400">
//                       <Calendar className="w-3 h-3 mr-1" />
//                       {formatDate(testimonial.created_at)}
//                     </div>
//                   </div>
                
//                   {/* Checkbox - prevent row click when checkbox is clicked */}
//                   <div 
//                     className="hidden lg:flex lg:col-span-1 items-center"
//                     onClick={(e) => e.stopPropagation()}
//                   >
//                     <input 
//                       type="checkbox"
//                       className="rounded-md text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
//                       checked={selectedTestimonials.includes(testimonial.id)}
//                       onChange={() => toggleSelectTestimonial(testimonial.id)}
//                     />
//                   </div>

//                   {/* Profile */}
//                   <div className="lg:col-span-3 flex items-center">
//                     <div className="relative">
//                       <div 
//                         className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-lg ring-2 ring-white shadow-sm overflow-hidden"
//                       >
//                         {testimonial.customer_profile?.avatar_url ? (
//                           <img 
//                             src={testimonial.customer_profile.avatar_url} 
//                             alt={testimonial.customer_profile.name} 
//                             className="w-full h-full object-cover"
//                           />
//                         ) : (
//                           <img 
//                             src={`https://ui-avatars.com/api/?name=${testimonial.customer_profile?.name}&background=random`} 
//                             alt={testimonial.customer_profile?.name} 
//                             className="w-full h-full object-cover"
//                           />
//                         )}
//                       </div>
//                       <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
//                         {renderFormatIcon(testimonial.format)}
//                       </div>
//                     </div>
//                     <div className="ml-4">
//                       <div className="text-sm font-medium text-slate-700">
//                         {testimonial.customer_profile?.name}
//                       </div>
//                       <div className="text-xs text-slate-400 flex flex-wrap items-center">
//                         {testimonial.customer_profile?.title || 'Customer'} 
//                         {testimonial.customer_profile?.company && (
//                           <>
//                             <span className="mx-1.5 text-slate-300">•</span>
//                             <span>{testimonial.customer_profile.company}</span>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Rating - Only visible on desktop */}
//                   <div className="hidden lg:flex lg:col-span-2 items-center">
//                     {customRenderStars(testimonial.rating ?? 0)}
//                   </div>

//                   {/* Date - Only visible on desktop */}
//                   <div className="hidden lg:flex lg:col-span-2 items-center text-sm text-slate-400">
//                     <Calendar className="w-4 h-4 mr-2 text-blue-400" />
//                     {formatDate(testimonial.created_at)}
//                   </div>

//                   {/* Testimonial Content */}
//                   <div className="lg:col-span-4 text-sm text-slate-700">
//                     <p className="line-clamp-2 italic">{testimonial.content}</p>
//                   </div>

//                   {/* Actions */}
//                   <div 
//                     className="lg:col-span-2 flex justify-end items-center space-x-1"
//                     onClick={(e) => e.stopPropagation()}
//                   >
//                     <div className="flex space-x-1">
//                       <button 
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleActionClick(testimonial, 'feature');
//                         }}
//                         className="text-purple-600 bg-purple-400 bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
//                         title="Feature"
//                       >
//                         <CheckCircle className="w-4 h-4" />
//                       </button>
//                       <button 
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleActionClick(testimonial, 'archive');
//                         }}
//                         className="text-blue-600 bg-blue-400 bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
//                         title="Archive"
//                       >
//                         <ArchiveIcon className="w-4 h-4" />
//                       </button>
//                     </div>
//                     <button 
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         navigate('/pending_detail');
//                       }} 
//                       className="text-blue-600 hover:bg-blue-400 hover:bg-opacity-20 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
//                     >
//                       View
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           ))}
//         </div>
//       )}
      
//       {/* Footer with enhanced pagination */}
//       <div className="px-6 py-4 bg-slate-50 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4">
//         <div className="text-sm text-slate-400">
//           Showing <span className="font-medium">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTestimonials.length)}</span> of <span className="font-medium">{filteredTestimonials.length}</span> testimonials
//         </div>
        
//         {totalPages > 1 && (
//           <nav aria-label="Testimonials pagination" className="flex items-center space-x-2">
//             {/* Previous Button */}
//             <button 
//               onClick={() => goToPage(Math.max(1, currentPage - 1))}
//               disabled={currentPage === 1}
//               className={cn(
//                 "flex items-center justify-center px-3 py-1 rounded-md border text-sm",
//                 currentPage === 1 
//                   ? "border-slate-300 bg-slate-50 text-slate-400 cursor-not-allowed" 
//                   : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
//               )}
//               aria-label="Previous page"
//             >
//               <ChevronLeft className="w-4 h-4 mr-1" />
//               Previous
//             </button>
            
//             {/* Page Numbers */}
//             {getVisiblePageNumbers().map((page, index) => (
//               typeof page === 'number' ? (
//                 <button
//                   key={index}
//                   onClick={() => goToPage(page)}
//                   className={cn(
//                     "w-8 h-8 rounded-md flex items-center justify-center text-sm font-medium",
//                     currentPage === page 
//                       ? "bg-blue-500 text-white hover:bg-blue-600"
//                       : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
//                   )}
//                   aria-label={`Page ${page}`}
//                   aria-current={currentPage === page ? "page" : undefined}
//                 >
//                   {page}
//                 </button>
//               ) : (
//                 <span key={index} className="text-slate-400">
//                   {page}
//                 </span>
//               )
//             ))}
            
//             {/* Next Button */}
//             <button 
//               onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
//               disabled={currentPage === totalPages}
//               className={cn(
//                 "flex items-center justify-center px-3 py-1 rounded-md border text-sm",
//                 currentPage === totalPages 
//                   ? "border-slate-300 bg-slate-50 text-slate-400 cursor-not-allowed" 
//                   : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
//               )}
//               aria-label="Next page"
//             >
//               Next
//               <ChevronRight className="w-4 h-4 ml-1" />
//             </button>
//           </nav>
//         )}
//       </div>
//     </div>
//   );
// };



import React, { useState } from "react";
import { 
  CheckCircle, 
  MoreHorizontal,
  Calendar,
  ArchiveIcon,
  Star,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RotateCcw
} from "lucide-react";
import { Testimonial } from "@/types/testimonial";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RejectedListViewProps {
  filteredTestimonials: Testimonial[];
  selectedTestimonials: string[];
  renderFormatIcon: (format: string) => React.ReactNode;
  renderStars: (rating: number) => React.ReactNode;
  toggleSelectTestimonial: (id: string) => void;
  handleActionClick: (testimonial: Testimonial, action: 'approve' | 'reject' | 'feature' | 'archive' | 'delete' | 'return_to_pending') => void;
  setSelectedTestimonials: React.Dispatch<React.SetStateAction<string[]>>;
  bulkAction: (action: 'return_to_pending' | 'delete') => void;
  onViewDetails: (testimonial: Testimonial) => void;
}

export const RejectedListView: React.FC<RejectedListViewProps> = ({
  filteredTestimonials,
  selectedTestimonials,
  renderFormatIcon,
  toggleSelectTestimonial,
  handleActionClick,
  setSelectedTestimonials,
  bulkAction,
  onViewDetails
}) => {
  const navigate = useNavigate();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // Show 4 items per page as requested
  const totalPages = Math.ceil(filteredTestimonials.length / itemsPerPage);
  
  // Get current testimonials for the page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTestimonials = filteredTestimonials.slice(indexOfFirstItem, indexOfLastItem);
  
  // Change page
  const goToPage = (pageNumber: number): void => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    if (!date) return "No date";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Custom star rating renderer with improved design
  const customRenderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "w-3 h-3",
              i < rating 
                ? "text-amber-500 fill-amber-500" 
                : "text-gray-300"
            )}
          />
        ))}
        <span className="ml-2 text-xs font-medium text-slate-700">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Generate array of visible page numbers
  const getVisiblePageNumbers = () => {
    if (totalPages <= 5) {
      // If we have 5 or fewer pages, show all page numbers
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Always show first, last, and pages around current
    const pageNumbers = [];
    
    // Always include page 1
    pageNumbers.push(1);
    
    if (currentPage > 3) {
      // Add ellipsis if current page is away from start
      pageNumbers.push("...");
    }
    
    // Pages around current page
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    if (currentPage < totalPages - 2) {
      // Add ellipsis if current page is away from end
      pageNumbers.push("...");
    }
    
    // Always include last page if it's not already included
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden">
     
      {/* Header with selection and bulk actions */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-300 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div className="flex items-center space-x-4">
          <div className="relative inline-flex items-center">
            <input 
              type="checkbox"
              className="w-5 h-5 rounded-md text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              checked={selectedTestimonials.length === currentTestimonials.length && currentTestimonials.length > 0}
              onChange={() => {
                // If all current visible testimonials are selected, deselect them
                // Otherwise, select all visible testimonials
                const currentIds = currentTestimonials.map(t => t.id);
                const allCurrentSelected = currentIds.every(id => selectedTestimonials.includes(id));
                
                if (allCurrentSelected) {
                  // Remove currently visible testimonials from selection
                  setSelectedTestimonials(prevSelected => 
                    prevSelected.filter(id => !currentIds.includes(id))
                  );
                } else {
                  // Add currently visible testimonials to selection
                  setSelectedTestimonials(prevSelected => {
                    const newSelected = [...prevSelected];
                    currentIds.forEach(id => {
                      if (!newSelected.includes(id)) {
                        newSelected.push(id);
                      }
                    });
                    return newSelected;
                  });
                }
              }}
            />
            <span className="text-sm font-medium text-slate-700 ml-3">
              {selectedTestimonials.length > 0 
                ? `${selectedTestimonials.length} selected` 
                : 'Select all'}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {selectedTestimonials.length > 0 ? (
            <>
              <button 
                className="text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm border border-amber-300"
                onClick={() => bulkAction('return_to_pending')}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Return to Pending</span>
              </button>
              <button 
                className="text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm border border-red-300"
                onClick={() => bulkAction('delete')}
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected</span>
              </button>
            </>
          ) : (
            <div className="text-sm text-slate-400 italic">Select testimonials to perform bulk actions</div>
          )}
        </div>
      </div>

      {/* Testimonial List */}
      {filteredTestimonials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <MoreHorizontal className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 mb-1">No Rejected testimonials</h3>
          <p className="text-slate-400 max-w-md">There are currently no rejected testimonials. New submissions will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-300">
          {currentTestimonials.map((testimonial, index) => (
            <motion.div 
              key={testimonial.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="group cursor-pointer hover:bg-slate-50 transition-all duration-200"
              onClick={() => onViewDetails(testimonial)}
            >
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Mobile header - only visible on small screens */}
                  <div className="lg:hidden col-span-1 flex items-center justify-between w-full mb-2">
                    <div className="flex items-center">
                      <input 
                        type="checkbox"
                        className="rounded-md text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        checked={selectedTestimonials.includes(testimonial.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectTestimonial(testimonial.id);
                        }}
                      />
                      <div className="ml-4">
                        {customRenderStars(testimonial.rating ?? 0)}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-xs text-slate-400">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(testimonial.created_at)}
                    </div>
                  </div>
                
                  {/* Checkbox - prevent row click when checkbox is clicked */}
                  <div 
                    className="hidden lg:flex lg:col-span-1 items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input 
                      type="checkbox"
                      className="rounded-md text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      checked={selectedTestimonials.includes(testimonial.id)}
                      onChange={() => toggleSelectTestimonial(testimonial.id)}
                    />
                  </div>

                  {/* Profile */}
                  <div className="lg:col-span-3 flex items-center">
                    <div className="relative">
                      <div 
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-lg ring-2 ring-white shadow-sm overflow-hidden"
                      >
                        {testimonial.customer_profile?.avatar_url ? (
                          <img 
                            src={testimonial.customer_profile.avatar_url} 
                            alt={testimonial.customer_profile.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img 
                            src={`https://ui-avatars.com/api/?name=${testimonial.customer_profile?.name}&background=random`} 
                            alt={testimonial.customer_profile?.name} 
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                        {renderFormatIcon(testimonial.format)}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-slate-700">
                        {testimonial.customer_profile?.name}
                      </div>
                      <div className="text-xs text-slate-400 flex flex-wrap items-center">
                        {testimonial.customer_profile?.title || 'Customer'} 
                        {testimonial.customer_profile?.company && (
                          <>
                            <span className="mx-1.5 text-slate-300">•</span>
                            <span>{testimonial.customer_profile.company}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating - Only visible on desktop */}
                  <div className="hidden lg:flex lg:col-span-2 items-center">
                    {customRenderStars(testimonial.rating ?? 0)}
                  </div>

                  {/* Date - Only visible on desktop */}
                  <div className="hidden lg:flex lg:col-span-2 items-center text-sm text-slate-400">
                    <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                    {formatDate(testimonial.created_at)}
                  </div>

                  {/* Testimonial Content */}
                  <div className="lg:col-span-4 text-sm text-slate-700">
                    <p className="line-clamp-2 italic">{testimonial.content}</p>
                  </div>

                  {/* Actions */}
                  <div 
                    className="lg:col-span-2 flex justify-end items-center space-x-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex space-x-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionClick(testimonial, 'return_to_pending');
                        }}
                        className="text-amber-700 bg-amber-100 hover:bg-amber-200 p-2 rounded-lg transition-colors border border-amber-300"
                        title="Return to Pending"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionClick(testimonial, 'delete');
                        }}
                        className="text-red-700 bg-red-100 hover:bg-red-200 p-2 rounded-lg transition-colors border border-red-300"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/pending_detail');
                      }} 
                      className="text-blue-600 hover:bg-blue-400 hover:bg-opacity-20 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Footer with enhanced pagination */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-slate-400">
          Showing <span className="font-medium">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTestimonials.length)}</span> of <span className="font-medium">{filteredTestimonials.length}</span> testimonials
        </div>
        
        {totalPages > 1 && (
          <nav aria-label="Testimonials pagination" className="flex items-center space-x-2">
            {/* Previous Button */}
            <button 
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={cn(
                "flex items-center justify-center px-3 py-1 rounded-md border text-sm",
                currentPage === 1 
                  ? "border-slate-300 bg-slate-50 text-slate-400 cursor-not-allowed" 
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              )}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            
            {/* Page Numbers */}
            {getVisiblePageNumbers().map((page, index) => (
              typeof page === 'number' ? (
                <button
                  key={index}
                  onClick={() => goToPage(page)}
                  className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center text-sm font-medium",
                    currentPage === page 
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </button>
              ) : (
                <span key={index} className="text-slate-400">
                  {page}
                </span>
              )
            ))}
            
            {/* Next Button */}
            <button 
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                "flex items-center justify-center px-3 py-1 rounded-md border text-sm",
                currentPage === totalPages 
                  ? "border-slate-300 bg-slate-50 text-slate-400 cursor-not-allowed" 
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              )}
              aria-label="Next page"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
};