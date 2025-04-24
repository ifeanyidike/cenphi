
import { AppSidebar } from "@/components/dashboard-main/AppSidebar";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";


import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Grid, List, Download, ArrowLeft, X, SearchX, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReviewCardView } from "@/components/custom/dashboard/ReviewCardView";
import { ReviewListView } from "@/components/custom/dashboard/ReviewListView";
import FilterMenu from "@/components/custom/dashboard/FilterMenu";
import { useNavigate } from "react-router";
import { Testimonial } from "@/types/testimonial";
import {filterOptions} from "@/types/d";
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import testimonials from "@/data/dataset";

const Reviews = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState("card");
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [visibleReviews, setVisibleReviews] = useState<Testimonial[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loaderRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 6;
  
   
    // Complete list of reviews
    const allReviews: Testimonial[] = useMemo(() => {
      return testimonials.map(testimonial => ({
      ...testimonial,
    })) 
  },
  []);

  const filteredReviews = useMemo(() => {
    return allReviews.filter(testimonial => {
      // First apply name search filter if present
      if (searchQuery && 
          !(testimonial.customer_profile?.name ?? "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Then apply category filters
      if (activeFilters.length === 0) return true;
  
      return activeFilters.every((filter: string) => {
        switch (filter) {
          // Status filters
          case "pending":
          case "approved":
          case "rejected":
          case "archived":
          case "featured":
          case "scheduled":
            return testimonial.status === filter;
          
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
          case "Image":
          case "Video":
          case "Audio":
            return testimonial.format.toLowerCase() === filter.toLowerCase();
          
          default:
            return false;
        }
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
    console.log("Load more triggered, hasMore:", hasMore);
    
    if (!hasMore) return;
  
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    console.log(`Loading page ${page}, items ${startIndex} to ${endIndex}`);
    
    const nextReviews = filteredReviews.slice(startIndex, endIndex);
    console.log("New reviews to add:", nextReviews.length);
    
    if (nextReviews.length === 0) {
      console.log("No more reviews to load");
      setHasMore(false);
      return;
    }
    
    setVisibleReviews(prev => [...prev, ...nextReviews]);
    setPage(prev => prev + 1);
  }, [hasMore, page, filteredReviews, itemsPerPage]);
  
  

  // Setup the intersection observer for infinite scrolling
 
  useEffect(() => {
    const currentLoaderRef = loaderRef.current;
    console.log("Setting up intersection observer, loader element exists:", !!currentLoaderRef);
    
    if (!currentLoaderRef || !hasMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
       
        if (entry.isIntersecting && hasMore) {
          console.log("Loading more reviews due to scroll");
          loadMoreReviews()
        }
      },
      { threshold: 0.1 }
    );
  if(loaderRef.current){
    observer.observe(currentLoaderRef);
  }
   
    return () => {
      observer.disconnect();
    };
  }, [hasMore, visibleReviews.length]);
  


useEffect(() => {

},[hasMore])
  
  useEffect(() => {
    // console.log("Filter/Search changed, resetting reviews");
    setVisibleReviews([]);
    setPage(1);
    setHasMore(true);
  
    // Load the first batch after reset
    const firstPageReviews = filteredReviews.slice(0, itemsPerPage);
    // console.log("Initial load:", firstPageReviews.length, "reviews");
    setVisibleReviews(firstPageReviews);
    setPage(2);
    setHasMore(itemsPerPage < filteredReviews.length);
  }, [filteredReviews, itemsPerPage]);
  
  return (
    <SidebarProvider className="flex w-screen">
 <AppSidebar />
 <SidebarInset className="flex-1">
  <header className="flex h-16 shrink-0 items-center transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center justify-between w-full px-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="/dashboard">
                        Dashboard
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Reviews</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              
            </div>
          </header>
    <div className="p-4 lg:p-8">
      <Card className="hover:shadow-lg transition-shadow max-w-5xl mx-auto">
        <CardHeader className="p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)} 
                className="text-gray-500 hover:text-purple-600 p-1 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
                
              </button>
              <CardTitle className="text-xl font-semibold">
                Back to Dashboard
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
    <div className="w-full space-y-8">
      {/* Enhanced premium grid layout with animated transitions */}
      {viewMode === "card" ? (
        <div className="relative">
          {/* Decorative premium elements */}
          <div className="absolute -top-8 -left-8 w-24 h-24 bg-gradient-to-br from-purple-300/20 to-indigo-300/20 rounded-full blur-xl" />
          <div className="absolute -bottom-12 -right-8 w-32 h-32 bg-gradient-to-tr from-pink-300/20 to-purple-300/20 rounded-full blur-xl" />
          
          <TransitionGroup className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {visibleReviews.map((testimonial, index) => (
              <CSSTransition
                key={testimonial.id}
                timeout={500}
                classNames={{
                  enter: "opacity-0 transform translate-y-8",
                  enterActive: "opacity-100 transform translate-y-0 transition duration-1000 ease-out",
                  exit: "opacity-100",
                  exitActive: "opacity-0 transition duration-300 ease-in"
                }}
              >
                <div 
                  className="relative group flex justify-center items-center"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    transform: "perspective(1000px)"
                  }}
                >
                  {/* Premium shadow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl -m-1 transform scale-105 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 blur-lg" />
                  
                  {/* Subtle shimmer effect on hover */}
                  <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-700">
                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-40 group-hover:animate-shine" />
                  </div>
                  
                  {/* Card container with consistent dimensions */}
                  <div className="w-full h-full z-10 transform transition-all duration-500 group-hover:translate-y-px">
                    <ReviewCardView testimonials={[testimonial]} />
                  </div>
                </div>
              </CSSTransition>
            ))}
          </TransitionGroup>
        </div>
      ) : (
        <div className="relative">
          {/* List view premium background effects */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-purple-400/5 to-indigo-400/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-tr from-pink-400/5 to-fuchsia-400/5 rounded-full blur-3xl" />
          
          <TransitionGroup component="div" className="flex flex-col gap-6 relative z-10">
            {visibleReviews.map((testimonial, index) => (
              <CSSTransition
                key={testimonial.id}
                timeout={500}
                classNames={{
                  enter: "opacity-0 transform -translate-x-4",
                  enterActive: "opacity-100 transform translate-x-0 transition duration-500 ease-out",
                  exit: "opacity-100",
                  exitActive: "opacity-0 transition duration-300 ease-in"
                }}
              >
                <div 
                 className="bg-white rounded-xl p-5 relative overflow-hidden group transition-all duration-500 transform"
      
                  style={{ 
                    animationDelay: `${index * 150}ms`,
                    background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(252,252,255,0.95) 100%)"
                  }}
                >
                  {/* Subtle shimmer effect on hover */}
                  <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-20 transition-opacity duration-700">
                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-40 group-hover:animate-shine" />
                  </div>
                  
                  <div className="relative z-10">
                    <ReviewListView testimonials={[testimonial]} />
                  </div>
                </div>
              </CSSTransition>
            ))}
          </TransitionGroup>
        </div>
      )}

      {/* Premium loading indicator */}
      <div ref={loaderRef} className="py-12 text-center w-full">
        {hasMore && (
          <div className="flex justify-center items-center space-x-4">
            <div className="relative">
              {/* Glowing effect behind loader */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full blur-xl opacity-30 animate-pulse" />
              
              <div className="relative flex space-x-3">
                <div className="h-3 w-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-3 w-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-3 w-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="text-center py-16">
      {filteredReviews.length === 0 ? (
        <div className="max-w-2xl mx-auto">
          {/* Premium empty state with animated gradient */}
          <div className="relative">
            {/* Animated background blur effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-pink-500/20 rounded-full blur-3xl opacity-70 animate-pulse-slow" />
            
            <div className="relative backdrop-blur-md bg-white/90 border border-white/20 p-12 rounded-3xl shadow-2xl">
              {/* Premium icon container with gradient */}
              <div className="relative mx-auto w-24 h-24 mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full blur opacity-50 animate-pulse" />
                <div className="relative bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full p-6 shadow-lg">
                  <SearchX className="h-12 w-12 text-white" />
                </div>
              </div>
              
              <h3 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                No Matching Reviews Found
              </h3>
              
              <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                We couldn't find any reviews matching your current filters. Try adjusting your criteria to see more results.
              </p>
              
              <div className="flex justify-center gap-5">
                <button
                  onClick={clearAllFilters}
                  className="relative group overflow-hidden bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {/* Button shine effect on hover */}
                  <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                  
                  <div className="flex items-center relative z-10">
                    <RefreshCw className="h-5 w-5 mr-2 group-hover:animate-spin-slow" />
                    <span>Reset All Filters</span>
                  </div>
                </button>
                
                <button
                  onClick={() => navigate("/all-reviewpage")}
                  className="px-8 py-4 rounded-xl font-medium border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 shadow-sm hover:shadow"
                >
                  Browse All Reviews
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-64">
          {/* Premium loading state */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400 rounded-full blur-2xl opacity-20 animate-pulse" />
            
            <div className="flex space-x-2 relative">
              <div className="w-4 h-24 bg-gradient-to-t from-purple-600 to-indigo-600 rounded-full transform origin-bottom animate-wave" style={{ animationDelay: '0ms' }} />
              <div className="w-4 h-24 bg-gradient-to-t from-indigo-600 to-purple-600 rounded-full transform origin-bottom animate-wave" style={{ animationDelay: '100ms' }} />
              <div className="w-4 h-24 bg-gradient-to-t from-purple-600 to-indigo-600 rounded-full transform origin-bottom animate-wave" style={{ animationDelay: '200ms' }} />
              <div className="w-4 h-24 bg-gradient-to-t from-indigo-600 to-purple-600 rounded-full transform origin-bottom animate-wave" style={{ animationDelay: '300ms' }} />
              <div className="w-4 h-24 bg-gradient-to-t from-purple-600 to-indigo-600 rounded-full transform origin-bottom animate-wave" style={{ animationDelay: '400ms' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )}
</CardContent>
      </Card>
    </div>
    </SidebarInset>
    </SidebarProvider>
  );
};

export default Reviews;




    

    