import { useState, useCallback } from "react";
import { Grid, List, Download, ChevronRight, X, SearchX, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Testimonial,
} from "@/types/testimonial";
import { ReviewCardView } from "@/components/custom/dashboard/ReviewCardView";
import { ReviewListView } from "@/components/custom/dashboard/ReviewListView";
import FilterMenu from "@/components/custom/dashboard/FilterMenu";  
import { useNavigate } from "react-router-dom"; 
import { testimonials as allTestimonials } from "@/data/dataset";

export const ReviewsSection2 = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"card" | "list">("card"); 
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Define filter options based on the Testimonial types
  const filterOptions = [
    {
      title: "Status",
      options: [
        { id: "status-pending", value: "pending_review", label: "Pending Review" },
        { id: "status-approved", value: "approved", label: "Approved" },
        { id: "status-rejected", value: "rejected", label: "Rejected" },
        { id: "status-archived", value: "archived", label: "Archived" },
        { id: "status-featured", value: "featured", label: "Featured" },
      ],
    },
    {
      title: "Rating",
      options: [
        { id: "rating-5", value: "5", label: "5 Stars" },
        { id: "rating-4", value: "4", label: "4 Stars" },
        { id: "rating-3", value: "3", label: "3 Stars" },
        { id: "rating-2", value: "2", label: "2 Stars" },
        { id: "rating-1", value: "1", label: "1 Star" },
      ],
    },
    {
      title: "Time",
      options: [
        { id: "time-today", value: "today", label: "Today" },
        { id: "time-week", value: "week", label: "This Week" },
        { id: "time-month", value: "month", label: "This Month" },
        { id: "time-year", value: "year", label: "This Year" },
      ],
    },
    {
      title: "Media Type",
      options: [
        { id: "media-text", value: "text", label: "Text Only" },
        { id: "media-image", value: "image", label: "With Images" },
        { id: "media-video", value: "video", label: "With Videos" },
        { id: "media-audio", value: "audio", label: "With Audio" },
      ],
    },
  ];
  
  // Fixed variable name from Testimonials to allTestimonials
  const testimonials: Testimonial[] = allTestimonials as Testimonial[];
 
  // Filter reviews based on activeFilters and searchQuery
  const filteredTestimonials = testimonials.filter(testimonial => {
    // Search filter
    if (searchQuery && !testimonial.type == "text"?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !testimonial.customer_title?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (activeFilters.length === 0) return true;
    
    const statusMatch = activeFilters.some(filter => filter === testimonial.status);
    const ratingMatch = activeFilters.some(filter => testimonial.rating && filter === testimonial.rating.toString());
    const typeMatch = activeFilters.some(filter => filter === testimonial.type);
    
    // Time-based filtering using created_at date
    const timeMatch = activeFilters.some(filter => {
      if (!testimonial.created_at) return false;
      
      const createdDate = new Date(testimonial.created_at);
      const today = new Date();
      const dayDiff = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (filter === "today" && dayDiff < 1) return true;
      if (filter === "week" && dayDiff < 7) return true;
      if (filter === "month" && dayDiff < 30) return true;
      if (filter === "year" && dayDiff < 365) return true;
      
      return false;
    });
    
    return statusMatch || ratingMatch || timeMatch || typeMatch;
  });

  // Handle review actions (approve, reject, feature, archive)
  const handleReviewAction = useCallback((id: string, action: 'approve' | 'reject' | 'feature' | 'archive') => {
    // In a real app, this would call an API endpoint to update the status
    console.log(`Review ${id} action: ${action}`);
   
  }, []);

  // Function to clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveFilters([]);
    setSearchQuery("");
  }, []);

  // Function to remove a single filter
  const removeFilter = useCallback((filter: string) => {
    setActiveFilters(prev => prev.filter(f => f !== filter));
  }, []);

  // Get a label for a filter value
  const getFilterLabel = (value: string) => {
    for (const category of filterOptions) {
      const option = category.options.find(opt => opt.value === value);
      if (option) return option.label;
    }
    return value;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="p-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <CardTitle className="text-xl font-semibold">
              Recent Reviews
            </CardTitle>
            <button 
              onClick={() => navigate("/reviews")} 
              className="text-purple-600 flex items-center font-medium text-sm hover:underline"
            >
              All Reviews <ChevronRight className="h-4 w-4 ml-1" />
            </button>
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
                aria-label="Card view"
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
                aria-label="List view"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
            
            {/* FilterMenu component */}
            <FilterMenu
              filterMenuOpen={filterMenuOpen}
              setFilterMenuOpen={setFilterMenuOpen}
              activeFilters={activeFilters}
              setActiveFilters={setActiveFilters}
              filterOptions={filterOptions}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
            
            <button 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Download reviews"
              title="Export reviews"
            >
              <Download className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Show active filters if any */}
        {(activeFilters.length > 0 || searchQuery) && (
          <div className="flex flex-wrap gap-2 mt-4 items-center">
            {searchQuery && (
              <Badge 
                className="px-3 py-1 bg-purple-50 text-purple-600 border border-purple-200 rounded"
              >
                Search: {searchQuery}
                <button 
                  className="ml-2 text-purple-400 hover:text-purple-700"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {activeFilters.map(filter => (
              <Badge 
                key={filter} 
                className="px-3 py-1 bg-purple-50 text-purple-600 border border-purple-200 rounded"
              >
                {getFilterLabel(filter)}
                <button 
                  className="ml-2 text-purple-400 hover:text-purple-700"
                  onClick={() => removeFilter(filter)}
                  aria-label={`Remove ${filter} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            
            {(activeFilters.length > 0 || searchQuery) && (
              <button 
                onClick={clearAllFilters}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium ml-2"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        {filteredTestimonials.length > 0 ? (
          viewMode === "card" ? (
            <ReviewCardView 
              testimonials={filteredTestimonials} 
              onReviewAction={handleReviewAction}
            />
          ) : (
            <ReviewListView 
              testimonials={filteredTestimonials} 
              onReviewAction={handleReviewAction}
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 rounded-full opacity-30 blur"></div>
              <div className="relative bg-white p-4 rounded-full shadow-lg">
                <SearchX className="h-16 w-16 text-purple-500 opacity-80" />
              </div>
            </div>
            
            <h3 className="mt-8 text-2xl font-bold text-gray-800">No matching reviews found</h3>
            <p className="mt-2 text-gray-500 text-center max-w-md">
              We couldn't find any reviews that match your current filter criteria. Try adjusting your filters to see more results.
            </p>
            
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <button 
                onClick={clearAllFilters}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Clear All Filters
              </button>
              <button 
                onClick={() => navigate("/all-reviewpage")}
                className="px-6 py-3 bg-white border border-purple-200 text-purple-700 font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              >
                View All Reviews
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};