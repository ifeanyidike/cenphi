
import { useState } from "react";
import { 
  CheckCircle, 
  ArchiveIcon, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Testimonial } from "@/types/testimonial";

interface RenderCardViewProps {
  filteredTestimonials: Testimonial[];
  viewMode: 'card' | 'list';
  renderFormatIcon: (format: string) => React.ReactNode;
  renderStars: (rating: number) => React.ReactNode;
  handleActionClick: (testimonial: Testimonial, action: 'approve' | 'reject' | 'feature' | 'archive') => void;
}

export const ApprovedCardView: React.FC<RenderCardViewProps> = ({
  filteredTestimonials,
  viewMode,
  renderFormatIcon,
  handleActionClick
}) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const testimonialsPerPage = viewMode === 'card' ? 6 : 4;
  const totalPages = Math.ceil(filteredTestimonials.length / testimonialsPerPage);
  
  // Get current testimonials
  const indexOfLastTestimonial = currentPage * testimonialsPerPage;
  const indexOfFirstTestimonial = indexOfLastTestimonial - testimonialsPerPage;
  const currentTestimonials = filteredTestimonials.slice(indexOfFirstTestimonial, indexOfLastTestimonial);
  
  // Change page
  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCardTestimonial = (testimonial: Testimonial) => {
    const commonClasses = "bg-white rounded-2xl border border-slate-300/50";
    const listViewClasses = "p-6 space-y-4 transition-all duration-300 ease-in-out";

    return (
      <div 
        key={testimonial.id}
        className={cn(
          commonClasses, 
          "overflow-hidden group shadow-sm hover:shadow-xl",
          "transform transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]",
          listViewClasses,
          "relative"
        )}
      >
        {/* Premium ribbon for featured testimonials */}
        {testimonial.status === "approved" && (
          <div className="absolute -right-11 top-5 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-12 py-1 rotate-45 shadow-md text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Approved
        </div>
        )}
        
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row justify-center items-start space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div 
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-semibold text-lg ring-2 ring-white overflow-hidden shadow-md"
                >
                  {testimonial.customer_profile?.avatar_url ? (
                    <img 
                      src={testimonial.customer_profile.avatar_url} 
                      alt={testimonial.customer_profile.name} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <img 
                      src={`https://ui-avatars.com/api/?name=${testimonial.customer_profile?.name}&background=random`} 
                      alt={testimonial.customer_profile?.name} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                  {renderFormatIcon(testimonial.format)}
                </div>
              </div>
              <div className="ml-1">
                <div className="text-xs font-semibold text-slate-700">
                  {testimonial.customer_profile?.name}
                </div>
                <div className="line-clamp-1 text-xs truncate text-slate-400">
                  {testimonial.customer_profile?.title}
                </div>
                <div className="text-xs truncate font-medium text-blue-500">
                  {testimonial.customer_profile?.company}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-0.5 bg-slate-50 px-3 py-1 rounded-full">
              {customRenderStars(testimonial.rating ?? 0)}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-slate-700 italic 
              line-clamp-4 bg-slate-50 p-4 rounded-xl border-l-4 border-blue-400">
              {testimonial.content}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center 
            pt-4 border-t border-slate-300/50 space-y-4 sm:space-y-0">
            <div className="flex space-x-2">
              <button 
                onClick={() => handleActionClick(testimonial, 'feature')}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg 
                  hover:from-blue-600 hover:to-purple-600 transition-all shadow-sm hover:shadow-md flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Feature
              </button>
              <button 
                onClick={() => handleActionClick(testimonial, 'archive')}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg 
                  hover:bg-slate-50 transition-colors flex items-center shadow-sm"
              >
                <ArchiveIcon className="w-4 h-4 mr-2 text-slate-400" />
                Archive
              </button>
            </div>
            <button className="text-slate-400 hover:text-slate-700 bg-slate-50 p-2 rounded-full">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
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
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="space-y-8">
      <div className={viewMode === 'card' 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" 
        : "space-y-6"
      }>
        {currentTestimonials.map(testimonial => renderCardTestimonial(testimonial))}
      </div>
      
      {/* Pagination UI */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 pt-8 border-t border-slate-50">
          <button
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={cn(
              "p-2 rounded-full flex items-center justify-center",
              currentPage === 1 
                ? "text-slate-300 cursor-not-allowed" 
                : "text-slate-700 hover:bg-blue-400/10"
            )}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {getVisiblePageNumbers().map((page, index) => (
            typeof page === "number" ? (
              <button
                key={index}
                onClick={() => goToPage(page)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all",
                  currentPage === page 
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md" 
                    : "text-slate-700 hover:bg-blue-400/10"
                )}
              >
                {page}
              </button>
            ) : (
              <span key={index} className="text-slate-400">
                {page}
              </span>
            )
          ))}
          
          <button
            onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={cn(
              "p-2 rounded-full flex items-center justify-center",
              currentPage === totalPages 
                ? "text-slate-300 cursor-not-allowed" 
                : "text-slate-700 hover:bg-blue-400/10"
            )}
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {/* Page statistics */}
      <div className="text-center text-sm text-slate-400">
        Showing {indexOfFirstTestimonial + 1}-{Math.min(indexOfLastTestimonial, filteredTestimonials.length)} of {filteredTestimonials.length} testimonials
      </div>
    </div>
  );
};