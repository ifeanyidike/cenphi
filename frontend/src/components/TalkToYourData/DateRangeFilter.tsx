import React, { useState } from "react";
import { Calendar, X, Info } from "lucide-react";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onClear: () => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  dateRange,
  onDateRangeChange,
  onClear,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    onDateRangeChange({
      from: date,
      to: dateRange.to,
    });
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    onDateRangeChange({
      from: dateRange.from,
      to: date,
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const hasDateFilter = dateRange.from || dateRange.to;

  const quickFilters = [
    {
      label: "Today",
      onClick: () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        onDateRangeChange({ from: start, to: end });
      },
    },
    {
      label: "Yesterday",
      onClick: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
        onDateRangeChange({ from: start, to: end });
      },
    },
    {
      label: "Last 7 days",
      onClick: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        onDateRangeChange({ from: start, to: end });
      },
    },
    {
      label: "Last 30 days",
      onClick: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        onDateRangeChange({ from: start, to: end });
      },
    },
    {
      label: "This month",
      onClick: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        onDateRangeChange({ from: start, to: end });
      },
    },
    {
      label: "Last month",
      onClick: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        onDateRangeChange({ from: start, to: end });
      },
    },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 text-gray-400" />
          <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Date Filter</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasDateFilter && (
            <button
              onClick={onClear}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            {isExpanded ? "Less" : "More"}
          </button>
        </div>
      </div>

      {/* Active Filter Display */}
      {hasDateFilter && (
        <div className="mb-3 p-2 bg-gray-50 border border-gray-100 rounded">
          <div className="text-xs text-gray-600">
            <span className="font-medium">Active:</span>{" "}
            {dateRange.from && formatDisplayDate(dateRange.from)}
            {dateRange.from && dateRange.to && " to "}
            {dateRange.to && formatDisplayDate(dateRange.to)}
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1 mb-3">
        {quickFilters.map((filter) => (
          <button
            key={filter.label}
            onClick={filter.onClick}
            className="px-2 py-1 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range */}
      {isExpanded && (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={formatDate(dateRange.from)}
                onChange={handleFromDateChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={formatDate(dateRange.to)}
                onChange={handleToDateChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 p-2 bg-gray-50 border border-gray-100 rounded">
            <Info className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-500">
              <p className="font-medium mb-1">Tip:</p>
              <p>
                Use natural language like "last month's testimonials" or precise date filtering above.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};