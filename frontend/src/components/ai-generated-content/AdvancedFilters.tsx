// components/ai-generated-content/AdvancedFilters.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Filter,
  Calendar,
  Users,
  Target,
  Layers,
  Globe,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { CONTENT_CATEGORIES, PLATFORM_TARGETS, EnhancedArtifact } from "./ContentCategorization";

export interface FilterState {
  search: string;
  categories: string[];
  platforms: string[];
  levels: number[];
  dateRange: string;
  sourceType: string;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  artifacts: EnhancedArtifact[];
  stats: any;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  // artifacts, // unused for now
  stats
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFiltersCount =
    filters.categories.length +
    filters.platforms.length +
    filters.levels.length +
    (filters.dateRange !== 'all' ? 1 : 0) +
    (filters.sourceType !== 'all' ? 1 : 0);

  const hasAnyFilters = activeFiltersCount > 0 || filters.search.length > 0;

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];

    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handlePlatformToggle = (platformId: string) => {
    const newPlatforms = filters.platforms.includes(platformId)
      ? filters.platforms.filter(id => id !== platformId)
      : [...filters.platforms, platformId];

    onFiltersChange({ ...filters, platforms: newPlatforms });
  };

  const handleLevelToggle = (level: number) => {
    const newLevels = filters.levels.includes(level)
      ? filters.levels.filter(l => l !== level)
      : [...filters.levels, level];

    onFiltersChange({ ...filters, levels: newLevels });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      categories: [],
      platforms: [],
      levels: [],
      dateRange: 'all',
      sourceType: 'all'
    });
    setIsExpanded(false);
  };

  // Quick filter presets
  const quickFilters = [
    { label: 'Videos', icon: Globe, action: () => onFiltersChange({ ...filters, categories: ['video_content'] }) },
    { label: 'Platform Content', icon: Target, action: () => onFiltersChange({ ...filters, categories: ['platform_optimized_video', 'platform_optimized_text'] }) },
    { label: 'Recent', icon: Calendar, action: () => onFiltersChange({ ...filters, dateRange: 'week' }) },
    { label: 'Multi-Source', icon: Users, action: () => onFiltersChange({ ...filters, sourceType: 'multi-testimonial' }) }
  ];

  const levelLabels = {
    1: 'Original Processing',
    2: 'Derived Content',
    3: 'Multi-Testimonial'
  };

  return (
    <div className="space-y-4">
      {/* Main Search and Quick Actions */}
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search AI-generated content..."
                  value={filters.search}
                  onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                  className="pl-10 h-10 text-sm bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Quick Filters and Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Quick Filter Pills */}
              <div className="hidden lg:flex items-center gap-1">
                {quickFilters.map((filter, index) => {
                  const Icon = filter.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={filter.action}
                      className="h-8 px-3 text-xs border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Icon className="h-3 w-3 mr-1.5" />
                      {filter.label}
                    </Button>
                  );
                })}
              </div>

              {/* Advanced Filters Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className={`h-8 px-3 text-xs border-gray-200 transition-colors ${
                  isExpanded ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <Filter className="h-3 w-3 mr-1.5" />
                Advanced
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-xs bg-blue-100 text-blue-700 border-blue-200">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>

              {hasAnyFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <Card className="border border-blue-100 bg-blue-50/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Active Filters</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filters.categories.map(categoryId => {
                const category = CONTENT_CATEGORIES.find(c => c.id === categoryId);
                return category ? (
                  <Badge
                    key={categoryId}
                    variant="secondary"
                    className="text-xs bg-white text-blue-700 border-blue-200 hover:bg-blue-50 cursor-pointer transition-colors group"
                    onClick={() => handleCategoryToggle(categoryId)}
                  >
                    <Layers className="h-2.5 w-2.5 mr-1" />
                    {category.label}
                    <X className="h-2.5 w-2.5 ml-1 opacity-50 group-hover:opacity-100" />
                  </Badge>
                ) : null;
              })}

              {filters.platforms.map(platformId => {
                const platform = PLATFORM_TARGETS.find(p => p.id === platformId);
                return platform ? (
                  <Badge
                    key={platformId}
                    variant="secondary"
                    className="text-xs bg-white text-purple-700 border-purple-200 hover:bg-purple-50 cursor-pointer transition-colors group"
                    onClick={() => handlePlatformToggle(platformId)}
                  >
                    <Target className="h-2.5 w-2.5 mr-1" />
                    {platform.name}
                    <X className="h-2.5 w-2.5 ml-1 opacity-50 group-hover:opacity-100" />
                  </Badge>
                ) : null;
              })}

              {filters.levels.map(level => (
                <Badge
                  key={level}
                  variant="secondary"
                  className="text-xs bg-white text-green-700 border-green-200 hover:bg-green-50 cursor-pointer transition-colors group"
                  onClick={() => handleLevelToggle(level)}
                >
                  <Globe className="h-2.5 w-2.5 mr-1" />
                  {levelLabels[level as keyof typeof levelLabels]}
                  <X className="h-2.5 w-2.5 ml-1 opacity-50 group-hover:opacity-100" />
                </Badge>
              ))}

              {filters.dateRange !== 'all' && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-white text-orange-700 border-orange-200 hover:bg-orange-50 cursor-pointer transition-colors group"
                  onClick={() => onFiltersChange({ ...filters, dateRange: 'all' })}
                >
                  <Calendar className="h-2.5 w-2.5 mr-1" />
                  {filters.dateRange === 'today' ? 'Today' :
                   filters.dateRange === 'week' ? 'This Week' :
                   filters.dateRange === 'month' ? 'This Month' :
                   filters.dateRange === 'quarter' ? 'This Quarter' : filters.dateRange}
                  <X className="h-2.5 w-2.5 ml-1 opacity-50 group-hover:opacity-100" />
                </Badge>
              )}

              {filters.sourceType !== 'all' && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 cursor-pointer transition-colors group"
                  onClick={() => onFiltersChange({ ...filters, sourceType: 'all' })}
                >
                  <Users className="h-2.5 w-2.5 mr-1" />
                  {filters.sourceType === 'single-testimonial' ? 'Single Source' :
                   filters.sourceType === 'multi-testimonial' ? 'Multi-Source' :
                   filters.sourceType === 'derived' ? 'Derived' : filters.sourceType}
                  <X className="h-2.5 w-2.5 ml-1 opacity-50 group-hover:opacity-100" />
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">

                  {/* Content Categories */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Layers className="h-4 w-4 text-blue-600" />
                      <h4 className="text-sm font-semibold text-gray-900">Content Types</h4>
                    </div>
                    <div className="space-y-3">
                      {CONTENT_CATEGORIES.map(category => {
                        const count = stats.byCategory[category.id] || 0;
                        const isSelected = filters.categories.includes(category.id);
                        return (
                          <div key={category.id} className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-gray-200'
                          }`} onClick={() => handleCategoryToggle(category.id)}>
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id={`category-${category.id}`}
                                checked={isSelected}
                                onChange={() => handleCategoryToggle(category.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                                    {category.label}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {count}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Platform Targets */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-4 w-4 text-purple-600" />
                      <h4 className="text-sm font-semibold text-gray-900">Platform Targets</h4>
                    </div>
                    <div className="space-y-3">
                      {PLATFORM_TARGETS.map(platform => {
                        const count = stats.byPlatform[platform.id] || 0;
                        const isSelected = filters.platforms.includes(platform.id);
                        const Icon = platform.icon;
                        return (
                          <div key={platform.id} className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                            isSelected ? 'bg-purple-50 border-purple-200' : 'hover:bg-gray-50 border-gray-200'
                          }`} onClick={() => handlePlatformToggle(platform.id)}>
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id={`platform-${platform.id}`}
                                checked={isSelected}
                                onChange={() => handlePlatformToggle(platform.id)}
                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <Icon className={`h-4 w-4 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className={`text-sm font-medium ${isSelected ? 'text-purple-900' : 'text-gray-700'}`}>
                                    {platform.name}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {count}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-500">{platform.aspectRatio}</span>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">{platform.maxDuration}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Processing Levels */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="h-4 w-4 text-green-600" />
                      <h4 className="text-sm font-semibold text-gray-900">Processing Level</h4>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(levelLabels).map(([level, label]) => {
                        const levelNum = parseInt(level);
                        const count = stats.byLevel[levelNum] || 0;
                        const isSelected = filters.levels.includes(levelNum);
                        const descriptions = {
                          1: 'Direct processing from source testimonials',
                          2: 'Content derived from other AI artifacts',
                          3: 'Compositions from multiple sources'
                        };
                        return (
                          <div key={level} className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                            isSelected ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50 border-gray-200'
                          }`} onClick={() => handleLevelToggle(levelNum)}>
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id={`level-${level}`}
                                checked={isSelected}
                                onChange={() => handleLevelToggle(levelNum)}
                                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className={`text-sm font-medium ${isSelected ? 'text-green-900' : 'text-gray-700'}`}>
                                    {label}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {count}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {descriptions[levelNum as keyof typeof descriptions]}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional Filters */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <h4 className="text-sm font-semibold text-gray-900">Date Range</h4>
                      </div>
                      <Select
                        value={filters.dateRange}
                        onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value })}
                      >
                        <SelectTrigger className="h-10 text-sm bg-gray-50 border-gray-200 hover:bg-white transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This week</SelectItem>
                          <SelectItem value="month">This month</SelectItem>
                          <SelectItem value="quarter">This quarter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="h-4 w-4 text-indigo-600" />
                        <h4 className="text-sm font-semibold text-gray-900">Source Type</h4>
                      </div>
                      <Select
                        value={filters.sourceType}
                        onValueChange={(value) => onFiltersChange({ ...filters, sourceType: value })}
                      >
                        <SelectTrigger className="h-10 text-sm bg-gray-50 border-gray-200 hover:bg-white transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All sources</SelectItem>
                          <SelectItem value="single-testimonial">Single testimonial</SelectItem>
                          <SelectItem value="multi-testimonial">Multiple testimonials</SelectItem>
                          <SelectItem value="derived">Derived from other content</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filter Stats */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Total content:</span>
                          <span className="font-medium text-gray-700">{stats.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active filters:</span>
                          <span className="font-medium text-blue-600">{activeFiltersCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Source testimonials:</span>
                          <span className="font-medium text-gray-700">{stats.sourceTestimonials.size}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedFilters;