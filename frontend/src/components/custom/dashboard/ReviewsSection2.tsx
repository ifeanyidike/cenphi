
import { useState } from "react";
import { Grid, List, Download, ChevronRight, X, SearchX, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import { Badge } from "@/components/ui/badge";
import { Review } from "@/types/types";
import { ReviewCardView } from "@/components/custom/dashboard/ReviewCardView";
import { ReviewListView } from "@/components/custom/dashboard/ReviewListView";
import FilterMenu from "@/components/custom/dashboard/FilterMenu";  
import { useNavigate } from "react-router-dom"; 
// import { useRouter } from "next/router"; // Import router for navigation

interface ExtendedReview extends Review {
  mediaType: "text" | "audio" | "video" | "image";
  mediaUrl?: string;
  thumbnailUrl?: string; 
  duration?: string; 
}

export const ReviewsSection2 = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("card"); 
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  // const [playingMedia, setPlayingMedia] = useState<number | null>(null);
  
  const filterOptions = [
    {
      title: "Status",
      options: [
        { id: "status-new", value: "New", label: "New" },
        { id: "status-replied", value: "Replied", label: "Replied" },
        { id: "status-verified", value: "Verified", label: "Verified" },
        { id: "status-featured", value: "Featured", label: "Featured" },
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
        { id: "time-today", value: "Today", label: "Today" },
        { id: "time-week", value: "Week", label: "This Week" },
        { id: "time-month", value: "Month", label: "This Month" },
        { id: "time-year", value: "Year", label: "This Year" },
      ],
    },
    {
      title: "Media Type",
      options: [
        { id: "media-text", value: "Text", label: "Text Only" },
        { id: "media-image", value: "Image", label: "With Images" },
        { id: "media-video", value: "Video", label: "With Videos" },
        { id: "media-audio", value: "Audio", label: "With Audio" },
      ],
    },
  ];
  
  // Enhanced reviews with different media types - now showing five reviews
  const recentReviews: ExtendedReview[] = [
    {
      id: 1,
      name: "John Doe",
      initials: "JD",
      rating: 5,
      timeAgo: "2 days ago",
      content: "The product exceeded all my expectations. The team was incredibly responsive and helpful throughout the entire process.",
      status: "New",
      mediaType: "text"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      initials: "SJ",
      rating: 5,
      timeAgo: "3 days ago",
      content: "Simply amazing! I've tried many similar products but this one stands head and shoulders above the rest.",
      status: "Replied",
      mediaType: "audio",
      mediaUrl: "/audio/review-sarah.mp3",
      duration: "1:45"
    },
    {
      id: 3,
      name: "Michael Wong",
      initials: "MW",
      rating: 4,
      timeAgo: "1 week ago",
      content: "Great product with intuitive design. Would recommend to colleagues looking for similar solutions.",
      status: "Verified",
      mediaType: "image",
      thumbnailUrl: "/images/review-michael.jpg"
    },
    {
      id: 4,
      name: "David Chen",
      initials: "DC",
      rating: 5,
      timeAgo: "1 day ago",
      content: "Love the product quality. Highly recommended!",
      status: "New",
      mediaType: "audio",
      mediaUrl: "/audio/review-david.mp3",
      duration: "0:58"
    },
    {
      id: 5,
      name: "Emily Rodriguez",
      initials: "ER",
      rating: 4,
      timeAgo: "5 days ago",
      content: "The customer service team went above and beyond. I'm really impressed with how they handled my questions.",
      status: "Featured",
      mediaType: "text"
    }
  ];

  // Filter reviews based on activeFilters
  const filteredReviews = recentReviews.filter(review => {
    // Filter logic remains the same...
    if (activeFilters.length === 0) return true;
    
    const statusMatch = activeFilters.some(filter => filter === review.status);
    const ratingMatch = activeFilters.some(filter => filter === `${review.rating}-star`);
    const mediaMatch = activeFilters.some(filter => filter === review.mediaType);
    
    const timeMatch = activeFilters.some(filter => {
      if (filter === "today" && review.timeAgo.includes("day")) return true;
      if (filter === "week" && review.timeAgo.includes("week")) return true;
      if (filter === "month" && review.timeAgo.includes("month")) return true;
      if (filter === "older" && !review.timeAgo.includes("day") && !review.timeAgo.includes("week")) return true;
      return false;
    });
    
    return statusMatch || ratingMatch || timeMatch || mediaMatch;
  });

  // Function to clear all filters
  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <CardTitle className="text-xl font-semibold">
              Recent Reviews
            </CardTitle>
            <button 
             onClick={() => navigate("/all-reviewpage")} 
              className="text-purple-600 flex items-center font-medium text-sm hover:underline"
            >
              View All Reviews <ChevronRight className="h-4 w-4 ml-1" />
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
            
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Download className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Show active filters if any */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {activeFilters.map(filter => (
              <Badge 
                key={filter} 
                variant="outline" 
                className="px-3 py-1 bg-purple-50 text-purple-600"
              >
                {filter}
                <button 
                  className="ml-2 text-purple-400 hover:text-purple-700"
                  onClick={() => setActiveFilters(activeFilters.filter(f => f !== filter))}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        {filteredReviews.length > 0 ? (
          viewMode === "card" ? (
            <ReviewCardView reviews={filteredReviews} />
          ) : (
            <ReviewListView reviews={filteredReviews} />
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
            
            <div className="mt-8 flex space-x-4">
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