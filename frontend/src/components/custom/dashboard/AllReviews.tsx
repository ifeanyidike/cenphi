import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Grid, List, Download, ArrowLeft, X, SearchX, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReviewCardView } from "@/components/custom/dashboard/ReviewCardView";
import { ReviewListView } from "@/components/custom/dashboard/ReviewListView";
import FilterMenu from "@/components/custom/dashboard/FilterMenu";
import { useNavigate } from "react-router";
import { ExtendedReview } from "@/types/types";

const AllReviews = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState("card");
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [visibleReviews, setVisibleReviews] = useState<ExtendedReview[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loaderRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const initialLoadDone = useRef(false);
    const itemsPerPage = 5;
  
             // Complete filter options
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
   
    // Complete list of reviews
    const allReviews = [
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
        rating: 4,
        timeAgo: "1 week ago",
        content: "Great product overall. The only issue I had was with the delivery time, but the quality made up for it.",
        status: "Replied",
        mediaType: "text"
      },
      {
        id: 3,
        name: "Michael Brown",
        initials: "MB",
        rating: 5,
        timeAgo: "3 days ago",
        content: "Absolutely fantastic service! I've recommended this to all my colleagues.",
        status: "Verified",
        mediaType: "image"
      },
      {
        id: 4,
        name: "Emily Wilson",
        initials: "EW",
        rating: 3,
        timeAgo: "2 weeks ago",
        content: "The product is good but could use some improvements. Customer service was helpful when I reached out.",
        status: "Featured",
        mediaType: "text"
      },
      {
        id: 5,
        name: "David Lee",
        initials: "DL",
        rating: 5,
        timeAgo: "1 day ago",
        content: "Exactly what I needed for my project. Will definitely purchase again in the future.",
        status: "New",
        mediaType: "video"
      },
      {
        id: 6,
        name: "Lisa Martinez",
        initials: "LM",
        rating: 2,
        timeAgo: "3 weeks ago",
        content: "I expected more from this product. It didn't solve my problem as advertised.",
        status: "Replied",
        mediaType: "text"
      },
      {
        id: 7,
        name: "Robert Taylor",
        initials: "RT",
        rating: 4,
        timeAgo: "5 days ago",
        content: "Very satisfied with my purchase. The quality is excellent and it arrived earlier than expected.",
        status: "Verified",
        mediaType: "image"
      },
      {
        id: 8,
        name: "Jennifer Adams",
        initials: "JA",
        rating: 5,
        timeAgo: "1 month ago",
        content: "Best customer service I've ever experienced. They went above and beyond to help me.",
        status: "Featured",
        mediaType: "text"
      },
      {
        id: 9,
        name: "Thomas Wilson",
        initials: "TW",
        rating: 3,
        timeAgo: "2 days ago",
        content: "The product is average. It works, but there are better options available on the market.",
        status: "New",
        mediaType: "text"
      },
      {
        id: 10,
        name: "Amanda Clark",
        initials: "AC",
        rating: 5,
        timeAgo: "1 week ago",
        content: "Impressive quality and attention to detail. This product has made my daily tasks so much easier.",
        status: "Verified",
        mediaType: "video"
      },
      {
        id: 11,
        name: "Kevin Rodriguez",
        initials: "KR",
        rating: 4,
        timeAgo: "4 days ago",
        content: "Good value for money. The product is durable and well-designed.",
        status: "Replied",
        mediaType: "text"
      },
      {
        id: 12,
        name: "Patricia Moore",
        initials: "PM",
        rating: 5,
        timeAgo: "2 weeks ago",
        content: "Excellent product! The features are intuitive and it solved my problem perfectly.",
        status: "Featured",
        mediaType: "image"
      },
      {
      id: 13,
      name: "Vincent Tilon",
      initials: "VT",
      rating: 4.5,
      timeAgo: "1 days ago",
      content: "Very satisfied with my purchase. The quality is excellent and it arrived earlier than expected.",
      status: "Verified",
      mediaType: "audio"
    },

      {
        id: 14,
        name: "Emily Rodriguez",
        initials: "ER",
        rating: 3,
        timeAgo: "2 weeks ago",
        content: "The product works well for my basic needs, but I found some features difficult to navigate. Customer service was helpful though.",
        status: "Featured",
        mediaType: "video",
        mediaUrl: "/videos/review-emily.mp4",
        thumbnailUrl: "/images/review-emily-thumb.jpg",
        duration: "2:35"
      },
    ];

  const filteredReviews = useMemo(() => {
    return allReviews.filter(review => {
      // First apply name search filter if present
      if (searchQuery && !review.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Then apply category filters
      if (activeFilters.length === 0) return true;
      
      return activeFilters.some((filter: string) => {
        if (filter === "New" || filter === "Replied" || filter === "Verified" || filter === "Featured") {
          return review.status === filter;
        }
        
        if (filter === "5" || filter === "4" || filter === "3" || filter === "2" || filter === "1") {
          return review.rating === parseInt(filter);
        }
        
        if (filter === "Today") {
          return review.timeAgo.includes("day");
        }
        if (filter === "Week") {
          return review.timeAgo.includes("week") || review.timeAgo.includes("day");
        }
        if (filter === "Month") {
          return review.timeAgo.includes("month") || review.timeAgo.includes("week") || review.timeAgo.includes("day");
        }
        
        if (filter === "Text" || filter === "Image" || filter === "Video" || filter === "Audio") {
          return review.mediaType.toLowerCase() === filter.toLowerCase();
        }
        
        return false;
      });
    });
  }, [activeFilters, allReviews, searchQuery]);

  // Clear all filters function
  const clearAllFilters = () => {
    setActiveFilters([]);
    setSearchQuery("");
  };

  // Function to load more reviews - Refactored to eliminate state changes that cause loops
  const loadMoreReviews = useCallback(() => {
    if (!hasMore) return;
    
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const nextReviews = filteredReviews.slice(startIndex, endIndex);

    if (nextReviews.length === 0) {
      setHasMore(false);
      return;
    }
    
    setVisibleReviews(prev => [...prev, ...nextReviews]);
    setPage(prev => prev + 1);
    setHasMore(endIndex < filteredReviews.length);
  }, [filteredReviews, hasMore, page, itemsPerPage]);

  // Effect to reset pagination when filters change
  useEffect(() => {
    // Reset pagination without creating infinite loops
    setVisibleReviews([]);
    setPage(1);
    setHasMore(true);

    // Immediately load the first batch of reviews after filter changes
    const firstPageReviews = filteredReviews.slice(0, itemsPerPage);
    setVisibleReviews(firstPageReviews);
    setPage(2);
    setHasMore(itemsPerPage < filteredReviews.length);
    
  }, [filteredReviews, itemsPerPage]);

  // Setup the intersection observer for infinite scrolling
  useEffect(() => {
    // Guard against creating multiple observers
    if (!loaderRef.current || !hasMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        // Only trigger once per intersection
        if (entries[0].isIntersecting && hasMore) {
          loadMoreReviews();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loaderRef.current);
    
    // Proper cleanup to prevent memory leaks
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
      observer.disconnect();
    };
  }, [loaderRef, hasMore, loadMoreReviews]);
  
  return (
    <div className="p-4 lg:p-8">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)} // React Router's back navigation
                className="text-gray-500 hover:text-purple-600 p-1 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <CardTitle className="text-xl font-semibold">
                All Reviews
              </CardTitle>
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
              
              {/* FilterMenu component with search functionality */}
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
          
         {/* Show active filters and search query if any */}
         {(activeFilters.length > 0 || searchQuery) && (
            <div className="flex flex-wrap gap-2 mt-4">
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
          {visibleReviews.length > 0 ? (
            <>
              {viewMode === "card" ? (
                <ReviewCardView reviews={visibleReviews} />
              ) : (
                <ReviewListView reviews={visibleReviews} />
              )}

              {/* Loading indicator */}
              {hasMore && (
                <div ref={loaderRef} className="py-4 text-center text-gray-500">
                  Loading more reviews...
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-8 text-gray-500">
              {filteredReviews.length === 0 
                ?  (
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
                )
                : "Loading initial reviews..."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AllReviews;


