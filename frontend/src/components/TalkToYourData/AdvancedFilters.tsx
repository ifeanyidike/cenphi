import React, { useState } from 'react';
import { X, Filter, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface AdvancedFiltersType {
  rating?: { min: number; max: number };
  companies?: string[];
  tags?: string[];
  testimonialType?: string[];
  sentiment?: string[];
  collectionMethod?: string[];
}

interface AdvancedFiltersProps {
  filters: AdvancedFiltersType;
  onFiltersChange: (filters: AdvancedFiltersType) => void;
  availableCompanies?: string[];
  availableTags?: string[];
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  availableCompanies = [],
  availableTags = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<AdvancedFiltersType>(filters);

  const testimonialTypes = ['video', 'text'];
  const sentiments = ['positive', 'neutral', 'negative'];
  const collectionMethods = ['widget', 'email', 'dashboard_import', 'drive_import'];

  const handleRatingChange = (type: 'min' | 'max', value: number) => {
    setLocalFilters((prev) => ({
      ...prev,
      rating: {
        ...prev.rating,
        min: prev.rating?.min || 1,
        max: prev.rating?.max || 5,
        [type]: value,
      },
    }));
  };

  const toggleArrayFilter = (key: keyof AdvancedFiltersType, value: string) => {
    setLocalFilters((prev) => {
      const currentArray = (prev[key] as string[]) || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((v) => v !== value)
        : [...currentArray, value];

      return {
        ...prev,
        [key]: newArray.length > 0 ? newArray : undefined,
      };
    });
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters: AdvancedFiltersType = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    setIsOpen(false);
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-300 text-slate-700 hover:bg-slate-50 h-8 px-3 text-xs relative"
        >
          <Filter className="h-3 w-3 mr-1.5" />
          Advanced Filters
          {activeFilterCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-medium">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className="h-3 w-3 ml-1.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Advanced Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {/* Rating Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Rating</label>
              <div className="flex items-center gap-2">
                <select
                  value={localFilters.rating?.min || 1}
                  onChange={(e) => handleRatingChange('min', parseInt(e.target.value))}
                  className="flex-1 h-8 px-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {[1, 2, 3, 4, 5].map((val) => (
                    <option key={val} value={val}>
                      {val} star{val > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-600">to</span>
                <select
                  value={localFilters.rating?.max || 5}
                  onChange={(e) => handleRatingChange('max', parseInt(e.target.value))}
                  className="flex-1 h-8 px-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {[1, 2, 3, 4, 5].map((val) => (
                    <option key={val} value={val}>
                      {val} star{val > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Testimonial Type */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Type</label>
              <div className="flex flex-wrap gap-2">
                {testimonialTypes.map((type) => {
                  const isSelected = localFilters.testimonialType?.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleArrayFilter('testimonialType', type)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="inline h-3 w-3 mr-1" />}
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sentiment */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Sentiment</label>
              <div className="flex flex-wrap gap-2">
                {sentiments.map((sentiment) => {
                  const isSelected = localFilters.sentiment?.includes(sentiment);
                  const colorClass =
                    sentiment === 'positive'
                      ? isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : sentiment === 'negative'
                      ? isSelected
                        ? 'bg-red-600 text-white'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                      : isSelected
                      ? 'bg-slate-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200';

                  return (
                    <button
                      key={sentiment}
                      onClick={() => toggleArrayFilter('sentiment', sentiment)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${colorClass}`}
                    >
                      {isSelected && <Check className="inline h-3 w-3 mr-1" />}
                      {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collection Method */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Collection Method</label>
              <div className="flex flex-wrap gap-2">
                {collectionMethods.map((method) => {
                  const isSelected = localFilters.collectionMethod?.includes(method);
                  return (
                    <button
                      key={method}
                      onClick={() => toggleArrayFilter('collectionMethod', method)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="inline h-3 w-3 mr-1" />}
                      {method.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Companies - if available */}
            {availableCompanies.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Companies</label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {availableCompanies.slice(0, 10).map((company) => {
                    const isSelected = localFilters.companies?.includes(company);
                    return (
                      <button
                        key={company}
                        onClick={() => toggleArrayFilter('companies', company)}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
                          isSelected
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="inline h-3 w-3 mr-1" />}
                        {company}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags - if available */}
            {availableTags.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Tags</label>
                <div className="flex flex-wrap gap-1">
                  {availableTags.slice(0, 15).map((tag) => {
                    const isSelected = localFilters.tags?.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleArrayFilter('tags', tag)}
                        className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                          isSelected
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected && <Check className="inline h-2.5 w-2.5 mr-0.5" />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-slate-600 hover:text-slate-900"
            >
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={applyFilters}
                className="bg-slate-900 text-white hover:bg-slate-800 text-xs"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default AdvancedFilters;
