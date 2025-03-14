import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Grid,
  List,
  Download,
  ChevronRight,
  X,
  Plus,
  Send,
  ThumbsUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import FilterMenu from "@/components/custom/dashboard/FilterMenu";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { workspaceRepo } from "@/repositories/workspaceRepository";
import { ReviewCard } from "./ReviewCard";
import { ReviewListItem } from "./ReviewListItem";
import LoadingSkeleton from "./LoadingSkeleton";

interface ReviewsSectionProps {
  fullWidth?: boolean;
}

export const ReviewsSection = observer(
  ({ fullWidth = false }: ReviewsSectionProps) => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState("card");
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [activeTab, setActiveTab] = useState("all");
    const isLoading = workspaceRepo.testimonialManager.loading_testimonials;
    const recentTestimonials =
      workspaceRepo.testimonialManager.testimonials?.slice(0, 6) || [];

    // Sample Data
    // const recentTestimonials = [
    //   {
    //     id: "123",
    //     collection_method: "direct_link" as CollectionMethod,
    //     conversion_count: 100,
    //     created_at: new Date(),
    //     share_count: 10,
    //     status: "approved" as "approved" | "pending_review" | "featured",
    //     type: "text" as "text",
    //     updated_at: new Date(),
    //     view_count: 12,
    //     workspace_id: "123",
    //     categories: [],
    //     content: "I love this",
    //     custom_fields: {},
    //     customer_avatar_url: "",
    //     customer_company: "Cenphi",
    //     customer_email: "ifeanyi@gmail.com",
    //     customer_location: "PHI",
    //     customer_metadata: {},
    //     customer_name: "ifeanyi",
    //     customer_title: "Tech Support",
    //     engagement_metrics: {},
    //     language: "EN",
    //     media_urls: [],
    //     rating: 4,
    //     verified_at: new Date(),
    //   },
    // ];

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
      {
        title: "Platform",
        options: [
          { id: "platform-website", value: "Website", label: "Website" },
          { id: "platform-app", value: "App", label: "Mobile App" },
          { id: "platform-google", value: "Google", label: "Google Reviews" },
          { id: "platform-facebook", value: "Facebook", label: "Facebook" },
        ],
      },
    ];

    // Filter reviews based on activeFilters and tab
    const filteredReviews = recentTestimonials.filter((review) => {
      // First filter by tab
      if (activeTab !== "all") {
        switch (activeTab) {
          case "new":
            if (review.status !== "pending_review") return false;
            break;
          case "featured":
            if (review.status !== "featured") return false;
            break;
          case "verified":
            if (!review.verified_at) return false;
            break;
          case "media":
            if (review.type === "text") return false;
            break;
        }
      }

      // Then apply manual filters
      if (activeFilters.length === 0) return true;

      // Search by name or content
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (
          !review.customer_name?.toLowerCase()?.includes(searchLower) &&
          !review.content?.toLowerCase()?.includes(searchLower)
        ) {
          return false;
        }
      }

      const statusMatch = activeFilters.some(
        (filter) => filter === review.status
      );
      const ratingMatch = activeFilters.some(
        (filter) => filter === review.rating?.toString()
      );
      const mediaMatch = activeFilters.some((filter) => filter === review.type);
      const platformMatch = activeFilters.some(
        (filter) => filter === review.collection_method
      );

      const timeMatch = activeFilters.some((filter) => {
        const now = new Date();
        const reviewDate = new Date(review.created_at);
        const diffTime = now.getTime() - reviewDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        switch (filter) {
          case "Today":
            // Compare date strings (ignoring time) to see if it's the same day.
            return now.toDateString() === reviewDate.toDateString();
          case "Week":
            // Check if the review was created within the last 7 days.
            return diffDays < 7;
          case "Month":
            // Check if the review was created within the last 30 days.
            return diffDays < 30;
          case "Year":
            // Check if the review was created within the last 365 days.
            return diffDays < 365;
          default:
            return false;
        }
      });

      return (
        statusMatch || ratingMatch || timeMatch || mediaMatch || platformMatch
      );
    });

    // Function to clear all filters
    const clearAllFilters = () => {
      setActiveFilters([]);
      setSearchQuery("");
    };

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                Reviews & Testimonials
              </CardTitle>
              <Button
                onClick={() => navigate("/all-reviewpage")}
                variant="link"
                className="text-purple-600 hover:text-purple-800 font-medium text-sm hover:underline p-0"
              >
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="flex space-x-2 self-end sm:self-auto">
              {/* View toggle buttons */}
              <div className="mr-2 flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <Button
                  onClick={() => setViewMode("card")}
                  variant="ghost"
                  size="icon"
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === "card"
                      ? "bg-white dark:bg-gray-800 text-purple-600 shadow-sm"
                      : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <Grid className="h-5 w-5" />
                </Button>
                <Button
                  onClick={() => setViewMode("list")}
                  variant="ghost"
                  size="icon"
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === "list"
                      ? "bg-white dark:bg-gray-800 text-purple-600 shadow-sm"
                      : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <List className="h-5 w-5" />
                </Button>
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

              <Button
                variant="ghost"
                size="icon"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Download className="h-5 w-5 text-gray-500" />
              </Button>
            </div>
          </div>

          {/* Category tabs */}
          <div className="mt-4 overflow-x-auto scrollbar-hide">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="mt-4"
            >
              <TabsList className="bg-gray-100 dark:bg-gray-700 p-1">
                <TabsTrigger
                  value="all"
                  className="text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                >
                  All Reviews
                </TabsTrigger>
                <TabsTrigger
                  value="new"
                  className="text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                >
                  New
                </TabsTrigger>
                <TabsTrigger
                  value="featured"
                  className="text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                >
                  Featured
                </TabsTrigger>
                <TabsTrigger
                  value="verified"
                  className="text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                >
                  Verified
                </TabsTrigger>
                <TabsTrigger
                  value="media"
                  className="text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                >
                  With Media
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Show active filters if any */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {activeFilters.map((filter) => (
                <Badge
                  key={filter}
                  variant="outline"
                  className="px-3 py-1 bg-purple-50 dark:bg-gray-700 text-purple-600 dark:text-purple-300"
                >
                  {filter}
                  <button
                    className="ml-2 text-purple-400 hover:text-purple-700 dark:hover:text-purple-200"
                    onClick={() =>
                      setActiveFilters(
                        activeFilters.filter((f) => f !== filter)
                      )
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="link"
                className="text-xs text-purple-600 dark:text-purple-300 hover:text-purple-800 p-0 h-6 ml-2"
                onClick={clearAllFilters}
              >
                Clear all
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <LoadingSkeleton />
          ) : filteredReviews.length > 0 ? (
            <AnimatePresence mode="wait">
              {viewMode === "card" ? (
                <motion.div
                  key="card-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`grid grid-cols-1 ${
                    fullWidth
                      ? "md:grid-cols-2 xl:grid-cols-3"
                      : "md:grid-cols-2"
                  } gap-4`}
                >
                  {filteredReviews.map((review) => (
                    <ReviewCard key={review.id} review={review!} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="list-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {filteredReviews.map((review) => (
                    <ReviewListItem key={review.id} review={review!} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>
    );
  }
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gradient-to-b from-white to-gray-50">
    <div className="relative mb-8">
      <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center">
        <ThumbsUp className="h-10 w-10 text-indigo-600" />
      </div>
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 1, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "loop",
        }}
        className="absolute -inset-4 rounded-full border-4 border-indigo-100/50"
      />
      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.1, 0.5, 0.1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "loop",
        }}
        className="absolute -inset-8 rounded-full border-4 border-indigo-100/30"
      />
    </div>

    <h3 className="text-xl font-bold text-gray-900 mb-3">
      No Testimonials Yet
    </h3>
    <p className="text-gray-500 max-w-md mb-8">
      We couldn't find any reviews that match your current filter criteria. Try
      adjusting your filters to see more results.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md w-full">
      <Button className="w-full py-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
        <Plus className="h-5 w-5 mr-2" />
        Add Testimonial
      </Button>
      <Button
        variant="outline"
        className="w-full py-6 border-2 hover:bg-gray-50"
      >
        <Send className="h-5 w-5 mr-2" />
        Send Request
      </Button>
    </div>
  </div>
);
