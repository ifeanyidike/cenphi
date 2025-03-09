import { Search } from "lucide-react";

const SementicSearchSection = () => {
  return (
    <div className="absolute inset-0 p-6 flex flex-col text-white">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-xl font-medium">Semantic Search</h4>
        <div className="bg-white/10 text-xs p-1 rounded-lg">
          <Search className="w-4 h-4" />
        </div>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-white/70" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent"
          placeholder="Search by sentiment, content, or context..."
          defaultValue="customers who mention ease of use"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white/10 border border-white/10 rounded-lg p-3 flex flex-col"
          >
            <div className="flex justify-between mb-2">
              <div className="text-sm font-medium">Customer #{i + 1}</div>
              <div className="flex">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className="text-amber-300 text-xs">
                    ★
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-1 mb-2">
              <div className="h-2 bg-white/20 rounded-full w-full"></div>
              <div className="h-2 bg-white/20 rounded-full w-5/6"></div>
              <div className="h-2 bg-white/20 rounded-full w-3/4"></div>
            </div>
            <div className="mt-auto flex justify-between items-center text-xs text-white/70">
              <span>Match: 94%</span>
              <span className="px-2 py-0.5 bg-orange-500/30 rounded text-orange-100">
                Ease of use
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SementicSearchSection;
