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
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Testimonial } from "@/types/testimonial";
import { PendingListView } from "@/components/custom/dashboard/pending/PendingListView";
import { PendingCardView } from "@/components/custom/dashboard/pending/PendingCardView";
import { useNavigate } from "react-router-dom";
import StatusFilterMenu from "@/components/custom/dashboard/approved/StatusFilterMenu";
import { statusFilterOptions } from "@/types/d";
import { Badge } from "@/components/ui/badge";

interface PendingReviewsProps {
  testimonials: Testimonial[];
  onAction?: (id: string, action: 'approve' | 'reject' | 'feature' | 'archive') => void;
}

export const PendingReviews: React.FC<PendingReviewsProps> = ({ 
  testimonials, 
  onAction 
}) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | 'text' | 'video' | 'audio' | 'image'>('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [statusfilterMenuOpen, setApprovedFilterMenuOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>([]);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject' | 'feature' | 'archive' | null;
    testimonial: Testimonial | null;
  }>({
    isOpen: false,
    type: null,
    testimonial: null
  });

  // Synchronize format filter buttons with activeFilters
  useEffect(() => {
    if (activeFilter !== 'all') {
      // Add format filter if it doesn't exist
      if (!activeFilters.some(filter => 
          filter.toLowerCase() === activeFilter.toLowerCase())) {
        // Remove any existing format filters
        const nonFormatFilters = activeFilters.filter(f => 
          !['text', 'video', 'audio', 'image'].includes(f.toLowerCase()));
        
        // Add the new format filter with proper capitalization
        setActiveFilters([...nonFormatFilters, activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)]);
      }
    } else {
      // Remove all format filters when 'all' is selected
      setActiveFilters(activeFilters.filter(f => 
        !['Text', 'Video', 'Audio', 'Image'].includes(f)));
    }
  }, [activeFilter]);

  // Update the top format filter when format is changed in activeFilters
  useEffect(() => {
    const formatFilters = activeFilters.filter(f => 
      ['Text', 'Video', 'Audio', 'Image'].includes(f));
    
    if (formatFilters.length === 0) {
      // If no format filters, set to 'all'
      setActiveFilter('all');
    } else if (formatFilters.length === 1) {
      // If exactly one format filter, synchronize with activeFilter
      setActiveFilter(formatFilters[0].toLowerCase() as any);
    }
    // If multiple format filters, we don't change activeFilter
  }, [activeFilters]);

  // Filter testimonials based on search query and active filters
  const filteredTestimonials = useMemo(() => {
    return testimonials.filter(testimonial => {
      // First apply name search filter if present
      if (searchQuery && 
          !(testimonial.customer_profile?.name ?? "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Then apply category filters
      if (activeFilters.length === 0) return testimonial.status === 'pending';
  
      return activeFilters.every((filter: string) => {
        switch (filter) {
          // Status filters - only show approved as base filter
          case "pending":
            return testimonial.status === filter;
          case "rejected":
            return testimonial.status === "rejected"
          
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
            return testimonial.status === "pending" && today.toDateString() === createdDate.toDateString();
          }
          case "Week": {
            const today = new Date();
            const createdDate = new Date(testimonial.created_at);
            const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return testimonial.status === "pending" && createdDate >= oneWeekAgo && createdDate <= today;
          }
          case "Month": {
            const today = new Date();
            const createdDate = new Date(testimonial.created_at);
            return testimonial.status === "pending" && 
                   createdDate.getMonth() === today.getMonth() && 
                   createdDate.getFullYear() === today.getFullYear();
          }
          case "Year": {
            const today = new Date();
            const createdDate = new Date(testimonial.created_at);
            return testimonial.status === "pending" && createdDate.getFullYear() === today.getFullYear();
          }
          
          // Media type filters
          case "Text":
          case "Image":
          case "Video":
          case "Audio":
            return testimonial.status === "pending" && testimonial.format.toLowerCase() === filter.toLowerCase();
          
          default:
            return testimonial.status === "pending";
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
      case 'text': return <FileText className="w-4 h-4 text-[#6366F1]" />;
      case 'video': return <Video className="w-4 h-4 text-[#10B981]" />;
      case 'audio': return <Volume2 className="w-4 h-4 text-[#8B5CF6]" />;
      case 'image': return <Image className="w-4 h-4 text-[#2c2440]" />;
      default: return null;
    }
  };

  const handleViewDetails = (testimonial: Testimonial) => {
    navigate(`/testimonials/${testimonial.id}`);
  };

  const handleActionClick = (testimonial: Testimonial, action: 'approve' | 'reject' | 'feature' | 'archive') => {
    setConfirmationModal({
      isOpen: true,
      type: action,
      testimonial: testimonial
    });
  };

  const confirmAction = () => {
    if (confirmationModal.testimonial && confirmationModal.type && onAction) {
      onAction(confirmationModal.testimonial.id, confirmationModal.type);
      setConfirmationModal({ isOpen: false, type: null, testimonial: null });
    }
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({ isOpen: false, type: null, testimonial: null });
  };

  const toggleSelectTestimonial = (testimonialId: string) => {
    setSelectedTestimonials(prev => 
      prev.includes(testimonialId)
        ? prev.filter(id => id !== testimonialId)
        : [...prev, testimonialId]
    );
  };

  const bulkAction = (action: 'approve' | 'reject') => {
    if (onAction) {
      selectedTestimonials.forEach(id => {
        const testimonial = filteredTestimonials.find(t => t.id === id);
        if (testimonial) {
          onAction(testimonial.id, action);
        }
      });
      setSelectedTestimonials([]);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-amber-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
              Pending Testimonials
              <span className="ml-3 bg-indigo-100 text-indigo-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                {filteredTestimonials.length}
              </span>
            </h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              Review and manage your pending testimonials
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <div className="flex flex-wrap justify-center space-x-1 sm:space-x-2 bg-white border border-gray-200 rounded-lg p-1 mr-0 sm:mr-4">
              {['all', 'text', 'video', 'audio', 'image'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFormatFilterClick(filter as any)}
                  className={cn(
                    "px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition-all duration-300",
                    activeFilter === filter 
                      ? " bg-gradient-to-r from-blue-500 to-purple-500 text-white" 
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
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
              >
                <Grid className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  viewMode === "list" 
                  ? "bg-white text-purple-600 shadow-sm" 
                  : "text-gray-500 hover:bg-gray-200"
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
            
            {/* ApprovedFilterMenu component with search functionality */}
            <StatusFilterMenu
              statusfilterMenuOpen={statusfilterMenuOpen}
              setFilterMenuOpen={setApprovedFilterMenuOpen}
              activeFilters={activeFilters}
              setActiveFilters={setActiveFilters}
              statusFilterOptions={statusFilterOptions}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
            
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Download className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Show active filters and search query if any */}
        {(activeFilters.length > 0 || searchQuery) && (
          <div className="flex flex-wrap gap-2 mt-4 mb-6">
            {searchQuery && (
              <Badge 
                variant="outline" 
                className="px-3 py-1 bg-purple-50 text-purple-600"
              >
                Name: {searchQuery}
                <button 
                  className="ml-2 text-purple-400 hover:text-purple-700"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
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
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            
            {(activeFilters.length > 0 || searchQuery) && (
              <button 
                onClick={clearAllFilters}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 flex items-center text-sm"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Clear all
              </button>
            )}
          </div>
        )}

        {filteredTestimonials.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200/50 p-8 sm:p-12 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative mx-auto w-20 h-20 mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full blur opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full p-5 shadow-lg">
                  <RefreshCw className="h-10 w-10 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                No Matching Testimonials Found
              </h3>
              
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                We couldn't find any pending testimonials matching your current filters. Try adjusting your criteria to see more results.
              </p>
              
              <button
                onClick={clearAllFilters}
                className="relative group overflow-hidden bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine"></div>
                
                <div className="flex items-center relative z-10">
                  <RefreshCw className="h-4 w-4 mr-2 group-hover:animate-spin-slow" />
                  <span>Reset All Filters</span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          viewMode === 'list' ? (
            <PendingListView 
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
            <PendingCardView 
              filteredTestimonials={filteredTestimonials}
              viewMode={viewMode}
              renderFormatIcon={renderFormatIcon}
              renderStars={renderStars}
              handleActionClick={handleActionClick}
            />
          )
        )}

        {/* Confirmation Modal */}
        {confirmationModal.isOpen && confirmationModal.testimonial && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center max-w-sm w-full">
              {confirmationModal.type === 'feature' ? (
                <CheckCircle 
                  className="mx-auto mb-4 text-green-600" 
                  size={80} 
                  strokeWidth={1.5} 
                />
              ) : (
                <ArchiveIcon   
                  className="mx-auto mb-4 text-red-600" 
                  size={80} 
                  strokeWidth={1.5} 
                />
              )}
              
              <h2 className="text-xl sm:text-2xl font-bold mb-4">
                {confirmationModal.type === 'approve' ? 'Testimonial Approved' : 'Testimonial Rejcted'}
              </h2>
              
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                {confirmationModal.type === 'approve' 
                  ? 'The testimonial has been successfully approved.' 
                  : 'The testimonial has been rejected.'}
              </p>
              
              <div className="flex justify-center space-x-2 sm:space-x-4">
                <button 
                  onClick={confirmAction}
                  className={`px-4 sm:px-6 py-2 rounded-lg text-white text-sm sm:text-base ${
                    confirmationModal.type === 'feature' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
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