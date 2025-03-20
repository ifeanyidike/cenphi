// First component: Fixed FilterMenu Component
import { Filter, Search, X } from "lucide-react";
import { useRef, useEffect, useState } from "react";

interface FilterMenuProps {
  filterMenuOpen: boolean;
  setFilterMenuOpen: (open: boolean) => void;
  activeFilters: string[];
  setActiveFilters: (filters: string[]) => void;
  filterOptions: {
    title: string;
    options: {
      id: string;
      value: string;
      label: string;
      icon?: React.ComponentType<{ className?: string }>;
    }[];
  }[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const FilterMenu: React.FC<FilterMenuProps> = ({
  filterMenuOpen,
  setFilterMenuOpen,
  activeFilters,
  setActiveFilters,
  filterOptions,
  searchQuery,
  setSearchQuery,
}) => {
  const filterRef = useRef<HTMLDivElement>(null);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close filter menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: { target: any }) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setFilterMenuOpen]);

  useEffect(() => {
    // Only update if they're different to prevent unnecessary renders
    if (searchInput !== searchQuery) {
      setSearchInput(searchQuery);
    }
  }, [searchQuery]);

  const toggleFilter = (filter: string) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter((f) => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSearchInput("");
    setSearchQuery("");
  };

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set a new timeout to update the search query after typing stops
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300); // 300ms debounce
  };

  // Clear timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative" ref={filterRef}>
      <button
        onClick={() => setFilterMenuOpen(!filterMenuOpen)}
        className={`p-2 rounded-lg transition-colors ${
          filterMenuOpen || activeFilters.length > 0 || searchQuery
            ? "bg-purple-100 text-purple-600"
            : "hover:bg-gray-100 text-gray-500"
        }`}
      >
        <Filter className="h-5 w-5" />
        {(activeFilters.length > 0 || searchQuery) && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-purple-600 text-white rounded-full text-xs flex items-center justify-center">
            {activeFilters.length + (searchQuery ? 1 : 0)}
          </span>
        )}
      </button>

      {filterMenuOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg z-50 border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-800">Filter Reviews</h3>
              {(activeFilters.length > 0 || searchQuery) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-purple-600 hover:text-purple-800 flex items-center space-x-1"
                >
                  <span>Clear all</span>
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="mt-3 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchInput}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setSearchQuery("");
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {filterOptions.map((filterGroup, index) => (
              <div
                key={index}
                className="px-4 py-3 border-b border-gray-100 last:border-b-0"
              >
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  {filterGroup.title}
                </h4>
                <div className="space-y-2">
                  {filterGroup.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center space-x-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        className="form-checkbox text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        checked={activeFilters.includes(option.value)}
                        onChange={() => toggleFilter(option.value)}
                      />
                      <div className="flex items-center space-x-2 text-gray-700 group-hover:text-purple-600">
                        {option.icon && <option.icon className="h-4 w-4" />}
                        <span>{option.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              onClick={() => setFilterMenuOpen(false)}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterMenu;
