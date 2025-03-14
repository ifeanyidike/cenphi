import { Filter, Search, X, Check } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    function handleClickOutside(event: MouseEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
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
      <Button
        onClick={() => setFilterMenuOpen(!filterMenuOpen)}
        variant="ghost"
        size="icon"
        className={`p-2 rounded-lg transition-all duration-300 ${
          filterMenuOpen || activeFilters.length > 0 || searchQuery
            ? "bg-purple-100 dark:bg-gray-700 text-purple-600 dark:text-purple-300"
            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
        }`}
      >
        <Filter className="h-5 w-5" />
        {(activeFilters.length > 0 || searchQuery) && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
            {activeFilters.length + (searchQuery ? 1 : 0)}
          </span>
        )}
      </Button>

      {filterMenuOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg z-50 border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-800 dark:text-gray-200">
                Filter Reviews
              </h3>
              {(activeFilters.length > 0 || searchQuery) && (
                <Button
                  onClick={clearFilters}
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 p-0 flex items-center"
                >
                  <span>Clear all</span>
                  <X className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>

            <div className="mt-3 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search by name or content..."
                value={searchInput}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-9 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setSearchQuery("");
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {filterGroup.title}
                </h4>
                <div className="space-y-2">
                  {filterGroup.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center space-x-3 cursor-pointer group"
                    >
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          id={option.id}
                          className="peer appearance-none h-5 w-5 border border-gray-300 dark:border-gray-600 rounded checked:bg-purple-600 checked:border-0 transition-colors duration-200"
                          checked={activeFilters.includes(option.value)}
                          onChange={() => toggleFilter(option.value)}
                        />
                        <Check className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                      <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        {option.icon && <option.icon className="h-4 w-4" />}
                        <span>{option.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600">
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow-md"
              onClick={() => setFilterMenuOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterMenu;
