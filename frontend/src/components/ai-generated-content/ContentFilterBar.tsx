// components/ai-generated-content/ContentFilterBar.tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Filter,
  ChevronDown,
  LayoutGrid,
  LayoutList,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CONTENT_CATEGORIES,
  PLATFORM_TARGETS,
  ContentStats,
} from "./ContentCategorization";

interface ContentFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: "grid" | "masonry";
  onViewModeChange: (mode: "grid" | "masonry") => void;
  groupByCategory?: boolean;
  onToggleGrouping?: (grouped: boolean) => void;
  sortBy: "newest" | "oldest" | "popular";
  onSortChange: (sort: "newest" | "oldest" | "popular") => void;
  selectedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
  selectedPlatforms: string[];
  onTogglePlatform: (platformId: string) => void;
  selectedApprovalStatus?: string[];
  onToggleApprovalStatus?: (status: string) => void;
  onClearFilters: () => void;
  contentStats: ContentStats;
  filterOpen: boolean;
  onToggleFilter: () => void;
}

const ContentFilterBar: React.FC<ContentFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  groupByCategory,
  onToggleGrouping,
  sortBy,
  onSortChange,
  selectedCategories,
  onToggleCategory,
  selectedPlatforms,
  onTogglePlatform,
  selectedApprovalStatus = [],
  onToggleApprovalStatus,
  onClearFilters,
  contentStats,
  filterOpen,
  onToggleFilter,
}) => {
  const activeFiltersCount =
    selectedCategories.length + selectedPlatforms.length + selectedApprovalStatus.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="sticky top-4 z-20 mb-8"
    >
      <Card className="border-0 shadow-lg backdrop-blur-xl bg-white/95">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search across all content..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-10 text-[11px] border-slate-200/50 bg-white/50 focus:bg-white transition-colors"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 rounded-full hover:bg-slate-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode */}
              <div className="flex items-center bg-slate-100/80 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewModeChange("masonry")}
                  className={`h-8 px-2 sm:px-3 text-[10px] rounded-md ${viewMode === "masonry" ? "bg-white shadow-sm" : ""}`}
                >
                  <LayoutGrid className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Masonry</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewModeChange("grid")}
                  className={`h-8 px-2 sm:px-3 text-[10px] rounded-md ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}
                >
                  <LayoutList className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Grid</span>
                </Button>
              </div>

              {/* Group by Category Toggle */}
              {onToggleGrouping && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleGrouping(!groupByCategory)}
                  className={`h-10 px-3 sm:px-4 text-[10px] border-slate-200/50 transition-all ${
                    groupByCategory
                      ? "bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300"
                      : "bg-white/50 hover:bg-white"
                  }`}
                >
                  {groupByCategory ? <Check className="h-3 w-3 mr-1.5" /> : null}
                  <span className="hidden sm:inline">Group by Category</span>
                  <span className="sm:hidden">Group</span>
                </Button>
              )}

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-3 sm:px-4 text-[10px] border-slate-200/50 bg-white/50 hover:bg-white"
                  >
                    Sort
                    <ChevronDown className="h-3 w-3 ml-1.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onClick={() => onSortChange("newest")}
                    className="text-[10px]"
                  >
                    {sortBy === "newest" && <Check className="h-3 w-3 mr-2" />}
                    <span className={sortBy !== "newest" ? "ml-5" : ""}>
                      Newest First
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onSortChange("oldest")}
                    className="text-[10px]"
                  >
                    {sortBy === "oldest" && <Check className="h-3 w-3 mr-2" />}
                    <span className={sortBy !== "oldest" ? "ml-5" : ""}>
                      Oldest First
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onSortChange("popular")}
                    className="text-[10px]"
                  >
                    {sortBy === "popular" && <Check className="h-3 w-3 mr-2" />}
                    <span className={sortBy !== "popular" ? "ml-5" : ""}>
                      Most Popular
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Filters */}
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleFilter}
                className={`h-10 px-3 sm:px-4 text-[10px] border-slate-200/50 transition-all ${activeFiltersCount > 0 ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" : "bg-white/50 hover:bg-white"}`}
              >
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white h-5 px-1.5 text-[8px] font-semibold">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-4">
                  {/* Categories */}
                  <div>
                    <p className="text-[9px] font-bold text-slate-700 mb-3 uppercase tracking-wider">
                      Content Categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CONTENT_CATEGORIES.map((category) => {
                        const count = contentStats.byCategory[category.id] || 0;
                        const CategoryIcon = category.icon;
                        const isSelected = selectedCategories.includes(
                          category.id
                        );
                        return (
                          <Button
                            key={category.id}
                            variant="outline"
                            size="sm"
                            onClick={() => onToggleCategory(category.id)}
                            disabled={count === 0}
                            className={`h-8 text-[10px] transition-all ${
                              isSelected
                                ? "bg-gradient-to-r from-slate-900 to-slate-700 text-white border-0 shadow-lg"
                                : "border-slate-200/50 hover:border-slate-300 hover:shadow-sm"
                            }`}
                          >
                            <CategoryIcon className="h-3 w-3 mr-1.5" />
                            {category.label}
                            <Badge
                              className={`ml-2 h-4 px-1.5 text-[8px] ${
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {count}
                            </Badge>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Platforms */}
                  <div>
                    <p className="text-[9px] font-bold text-slate-700 mb-3 uppercase tracking-wider">
                      Target Platforms
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {PLATFORM_TARGETS.map((platform) => {
                        const count = contentStats.byPlatform[platform.id] || 0;
                        const PlatformIcon = platform.icon;
                        const isSelected = selectedPlatforms.includes(
                          platform.id
                        );
                        return (
                          <Button
                            key={platform.id}
                            variant="outline"
                            size="sm"
                            onClick={() => onTogglePlatform(platform.id)}
                            disabled={count === 0}
                            className={`h-8 text-[10px] transition-all ${
                              isSelected
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg"
                                : "border-slate-200/50 hover:border-slate-300 hover:shadow-sm"
                            }`}
                          >
                            <PlatformIcon className="h-3 w-3 mr-1.5" />
                            {platform.name}
                            <Badge
                              className={`ml-2 h-4 px-1.5 text-[8px] ${
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {count}
                            </Badge>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Approval Status */}
                  {onToggleApprovalStatus && (
                    <div>
                      <p className="text-[9px] font-bold text-slate-700 mb-3 uppercase tracking-wider">
                        Approval Status
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "approved", label: "Approved", color: "from-emerald-600 to-green-600" },
                          { id: "pending", label: "Pending", color: "from-amber-600 to-orange-600" },
                          { id: "draft", label: "Draft", color: "from-slate-600 to-gray-600" },
                          { id: "rejected", label: "Rejected", color: "from-rose-600 to-red-600" },
                        ].map((status) => {
                          const isSelected = selectedApprovalStatus.includes(status.id);
                          return (
                            <Button
                              key={status.id}
                              variant="outline"
                              size="sm"
                              onClick={() => onToggleApprovalStatus(status.id)}
                              className={`h-8 text-[10px] transition-all ${
                                isSelected
                                  ? `bg-gradient-to-r ${status.color} text-white border-0 shadow-lg`
                                  : "border-slate-200/50 hover:border-slate-300 hover:shadow-sm"
                              }`}
                            >
                              {status.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Clear Filters */}
                  {activeFiltersCount > 0 && (
                    <div className="flex justify-end pt-3 border-t border-slate-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        className="h-8 text-[10px] hover:bg-slate-100"
                      >
                        <X className="h-3 w-3 mr-1.5" />
                        Clear all filters ({activeFiltersCount})
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
};

export default ContentFilterBar;
