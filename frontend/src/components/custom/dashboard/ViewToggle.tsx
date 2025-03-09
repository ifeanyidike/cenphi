import { Grid, List } from "lucide-react";

export const ViewToggle = ({ 
  viewMode, 
  setViewMode 
}: { 
  viewMode: string; 
  setViewMode: (mode: string) => void 
}) => (
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
);