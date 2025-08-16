// components/ai-studio/TestimonialSelector.tsx
import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Check,
  FileText,
  PlayCircle,
  Star,
  X,
  ChevronDown,
  AlertCircle,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Testimonial } from "@/types/testimonial";
import { workspaceHub } from "@/repo/workspace_hub";
import { TestimonialStateManager } from "@/utils/TestimonialStateManager";
import { runInAction } from "mobx";

interface TestimonialSelectorProps {
  selectedTestimonials: string[];
  onSelectionChange: (testimonialIds: string[]) => void;
  isCompact?: boolean;
}

const AIStudioTestimonialSelector: React.FC<TestimonialSelectorProps> =
  observer(({ selectedTestimonials, onSelectionChange, isCompact = false }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [isExpanded, setIsExpanded] = useState(
      !isCompact || selectedTestimonials.length === 0
    );

    const testimonials = workspaceHub.testimonialManager.testimonials || [];
    const isLoading = workspaceHub.testimonialManager.loading_testimonials;

    // Load testimonials if not already loaded
    useEffect(() => {
      if (!testimonials.length) {
        workspaceHub.testimonialManager.getTestimonials();
      }
    }, [testimonials.length]);

    useEffect(() => {
      if (testimonials.length) {
        runInAction(
          () => (workspaceHub.testimonialManager.loading_testimonials = false)
        );
      }
    }, [testimonials.length]);

    // Filter testimonials
    const filteredTestimonials = testimonials.filter((testimonial) => {
      const matchesSearch =
        !searchQuery ||
        testimonial.author_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        testimonial.author_company
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        testimonial.content?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filterType === "all" ||
        (filterType === "video" && testimonial.type === "video") ||
        (filterType === "text" && testimonial.type === "text") ||
        (filterType === "high_rating" && (testimonial.rating || 0) >= 4);

      return matchesSearch && matchesFilter;
    });

    const handleToggleSelect = (testimonialId: string) => {
      const updated = selectedTestimonials.includes(testimonialId)
        ? selectedTestimonials.filter((id) => id !== testimonialId)
        : [...selectedTestimonials, testimonialId];

      onSelectionChange(updated);
      TestimonialStateManager.saveSelectedTestimonials(updated);
    };

    const handleSelectAll = () => {
      const allIds = filteredTestimonials.map((t) => t.id);
      onSelectionChange(allIds);
      TestimonialStateManager.saveSelectedTestimonials(allIds);
    };

    const handleClearSelection = () => {
      onSelectionChange([]);
      TestimonialStateManager.clearSelectedTestimonials();
    };

    const selectedTestimonialData =
      TestimonialStateManager.getTestimonialsByIds(
        selectedTestimonials,
        testimonials
      );

    if (isCompact) {
      return (
        <Card className="w-full">
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-lg">
                      Selected Testimonials
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700"
                    >
                      {selectedTestimonials.length}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedTestimonials.length === 0 && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="pt-0">
                {selectedTestimonials.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-4">
                      No testimonials selected
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Choose testimonials below to process with AI services
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    {selectedTestimonialData.map((testimonial) => (
                      <SelectedTestimonialItem
                        key={testimonial.id}
                        testimonial={testimonial}
                        onRemove={() => handleToggleSelect(testimonial.id)}
                      />
                    ))}
                  </div>
                )}

                <TestimonialPicker
                  testimonials={filteredTestimonials}
                  selectedIds={selectedTestimonials}
                  searchQuery={searchQuery}
                  filterType={filterType}
                  onSearchChange={setSearchQuery}
                  onFilterChange={setFilterType}
                  onToggleSelect={handleToggleSelect}
                  onSelectAll={handleSelectAll}
                  onClearSelection={handleClearSelection}
                  isLoading={isLoading}
                />
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      );
    }

    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              Choose Testimonials to Process
            </CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {selectedTestimonials.length} selected
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <TestimonialPicker
            testimonials={filteredTestimonials}
            selectedIds={selectedTestimonials}
            searchQuery={searchQuery}
            filterType={filterType}
            onSearchChange={setSearchQuery}
            onFilterChange={setFilterType}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    );
  });

// Selected Testimonial Item Component
interface SelectedTestimonialItemProps {
  testimonial: Testimonial;
  onRemove: () => void;
}

const SelectedTestimonialItem: React.FC<SelectedTestimonialItemProps> = ({
  testimonial,
  onRemove,
}) => {
  return (
    <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-2 flex-1">
        {testimonial.type === "video" ? (
          <PlayCircle className="w-4 h-4 text-blue-600" />
        ) : (
          <FileText className="w-4 h-4 text-green-600" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {testimonial.author_name || "Anonymous"}
          </p>
          <p className="text-xs text-gray-600 truncate">
            {testimonial.content?.substring(0, 50)}...
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-gray-400 hover:text-red-600 p-1"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

// Testimonial Picker Component
interface TestimonialPickerProps {
  testimonials: Testimonial[];
  selectedIds: string[];
  searchQuery: string;
  filterType: string;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: string) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  isLoading: boolean;
}

const TestimonialPicker: React.FC<TestimonialPickerProps> = ({
  testimonials,
  selectedIds,
  searchQuery,
  filterType,
  onSearchChange,
  onFilterChange,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center space-x-2 text-gray-600">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading testimonials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search testimonials..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {["all", "video", "text", "high_rating"].map((filter) => (
            <Button
              key={filter}
              variant={filterType === filter ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(filter)}
              className="capitalize text-xs"
            >
              {filter === "high_rating" ? "High Rating" : filter}
            </Button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">
          {testimonials.length} testimonial
          {testimonials.length !== 1 ? "s" : ""} available
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSelectAll}>
            <CheckSquare className="w-4 h-4 mr-1" />
            Select All
          </Button>
          {selectedIds.length > 0 && (
            <Button variant="outline" size="sm" onClick={onClearSelection}>
              <Square className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Testimonials List */}
      <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
        {testimonials.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No testimonials found</p>
          </div>
        ) : (
          <AnimatePresence>
            {testimonials.map((testimonial) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedIds.includes(testimonial.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => onToggleSelect(testimonial.id)}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedIds.includes(testimonial.id)
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedIds.includes(testimonial.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {testimonial.type === "video" ? (
                      <PlayCircle className="w-4 h-4 text-blue-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-green-600" />
                    )}
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        testimonial.type === "video"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {testimonial.type}
                    </Badge>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {testimonial.author_name || "Anonymous"}
                      </p>
                      {testimonial.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-gray-600">
                            {testimonial.rating}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {testimonial.content?.substring(0, 80)}...
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AIStudioTestimonialSelector;
