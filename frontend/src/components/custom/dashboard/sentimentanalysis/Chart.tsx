// import { 
//   BarChart, Bar, PieChart, Pie, Cell, 
//   ResponsiveContainer, XAxis, YAxis, Tooltip, 
//   AreaChart, CartesianGrid, Area,
//   RadialBarChart, RadialBar
// } from 'recharts';
// import { Testimonial } from "@/types/testimonial";

// interface SentimentMiniChartsProps {
//   testimonial: Testimonial | null | undefined;
//   isDarkMode?: boolean;
// }

// export function SentimentMiniCharts({ testimonial, isDarkMode = true }: SentimentMiniChartsProps) {
//   // Default sentiment values to use when no data is available
//   const defaultSentimentScore = 0.5;
//   const defaultSentimentData = {
//     label: "neutral" as "positive" | "neutral" | "negative",
//     score: 0.5,
//     count: 0,
//     keywords: []
//   };
  
//   // Safely extract sentiment analysis from the analyses array with proper null checks
//   const sentimentAnalysis = testimonial?.analyses?.find(analysis => 
//     analysis.analysis_type === "sentiment"
//   );
  
//   // Extract sentiment data or use defaults if not available
//   const sentimentScore = sentimentAnalysis?.sentiment_score ?? defaultSentimentScore;
//   const sentimentData = sentimentAnalysis?.analysis_data?.sentiment ?? defaultSentimentData;
  
//   // Generate keyword data for charts
//   const generateKeywordData = () => {
//     // If no keywords are provided or it's an empty array, create sample data
//     if (
//       typeof sentimentData === "object" &&
//       sentimentData !== null &&
//       "keywords" in sentimentData &&
//       Array.isArray(sentimentData.keywords) &&
//       sentimentData.keywords.length === 0
//     ) {
//       return [
//         { name: 'excellent', value: 12, score: 0.8 },
//         { name: 'service', value: 8, score: 0.7 },
//         { name: 'helpful', value: 6, score: 0.75 },
//         { name: 'quality', value: 5, score: 0.65 },
//         { name: 'recommend', value: 4, score: 0.85 }
//       ];
//     }
    
//     // Convert string keywords to chart data format with randomized values
//     return sentimentData.keywords.map((keyword, index) => {
//       // Generate a score between 0.6 and 0.95 based on index
//       const keywordScore = 0.6 + (index % 4) * 0.1;
//       // Generate a value (occurrence) between 3 and 15
//       const occurrences = 3 + Math.floor((index % 5) * 3);
      
//       return {
//         name: keyword,
//         value: occurrences,
//         score: keywordScore
//       };
//     }).slice(0, 5); // Limit to top 5
//   };

//   const keywordData = generateKeywordData();
  
//   // Sentiment score indicator data - use the direct sentiment_score
//   const sentimentScoreData = [
//     { name: 'Score', value: sentimentScore * 100 }
//   ];
  
//   // Sentiment distribution data based on the sentiment label
//   const distributionData = [
//     { 
//       name: 'Positive', 
//       value: sentimentData.label === 'positive' ? 60 : 30 
//     },
//     { 
//       name: 'Neutral', 
//       value: sentimentData.label === 'neutral' ? 50 : 20 
//     },
//     { 
//       name: 'Negative', 
//       value: sentimentData.label === 'negative' ? 50 : 20 
//     }
//   ];

//   // Historical data (simulated)
//   const historyData = [
//     { date: 'Mon', score: 0.65 },
//     { date: 'Tue', score: 0.72 },
//     { date: 'Wed', score: 0.58 },
//     { date: 'Thu', score: sentimentScore },
//     { date: 'Fri', score: sentimentScore + 0.05 > 1 ? 0.98 : sentimentScore + 0.05 }
//   ];

//   // Color scheme
//   const COLORS = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'];

//   // Dynamic styles based on theme
//   const cardBg = isDarkMode 
//     ? "bg-slate-800/30 border-slate-700/50" 
//     : "bg-white border-slate-200";
  
//   const textColor = isDarkMode ? "text-slate-300" : "text-slate-600";
//   const legendTextColor = isDarkMode ? "text-slate-400" : "text-slate-500";
  
//   // Chart theme colors
//   const axisColor = isDarkMode ? "#475569" : "#cbd5e1";
//   const tickColor = isDarkMode ? "#cbd5e1" : "#64748b";
//   const gridColor = isDarkMode ? "#334155" : "#e2e8f0";
//   const tooltipBg = isDarkMode ? "#1e293b" : "#ffffff";
//   const tooltipBorder = isDarkMode ? "#475569" : "#cbd5e1";

//   // Custom tooltip for charts
//   const CustomTooltip = ({ active, payload, label }: any) => {
//     if (active && payload && payload.length) {
//       return (
//         <div className={`${isDarkMode ? "bg-slate-800" : "bg-white"} p-2 border ${isDarkMode ? "border-slate-700" : "border-slate-200"} rounded shadow text-sm`}>
//           <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}>
//             {`${label || payload[0].name}`}
//           </p>
//           <p className={isDarkMode ? "text-emerald-400" : "text-emerald-600"}>
//             {`Value: ${payload[0].value}`}
//           </p>
//           {payload[0].payload.score && (
//             <p className={isDarkMode ? "text-blue-400" : "text-blue-600"}>
//               {`Score: ${(payload[0].payload.score * 100).toFixed(0)}%`}
//             </p>
//           )}
//         </div>
//       );
//     }
//     return null;
//   };

//   return (
//     <div className="space-y-6">
//       {/* Top row: Main charts */}
//       <div className="grid grid-cols-2 gap-6">
//         {/* Keyword importance - Radial bars */}
//         <div className={`${cardBg} p-4 rounded-lg border`}>
//           <h4 className={`text-sm font-medium ${textColor} mb-2 text-center`}>Key Terms Impact</h4>
//           <ResponsiveContainer width="100%" height={180}>
//             <RadialBarChart 
//               cx="50%" 
//               cy="50%" 
//               innerRadius="20%" 
//               outerRadius="90%" 
//               data={keywordData} 
//               startAngle={180} 
//               endAngle={0}
//             >
//               <RadialBar
//                 background
//                 dataKey="score"
//                 cornerRadius={12}
//                 fill="#3b82f6"
//               >
//                 {keywordData.map((_, index) => (
//                   <Cell 
//                     key={`cell-${index}`} 
//                     fill={COLORS[index % COLORS.length]} 
//                     fillOpacity={0.8}
//                   />
//                 ))}
//               </RadialBar>
//               <Tooltip content={<CustomTooltip />} />
//             </RadialBarChart>
//           </ResponsiveContainer>
//           <div className="flex justify-center mt-2">
//             <div className="flex flex-wrap justify-center gap-2">
//               {keywordData.map((entry, index) => (
//                 <div key={`legend-${index}`} className="flex items-center">
//                   <div 
//                     className="w-3 h-3 rounded-full mr-1" 
//                     style={{ backgroundColor: COLORS[index % COLORS.length] }}
//                   />
//                   <span className={`text-xs ${legendTextColor}`}>{entry.name}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Sentiment distribution - Pie chart */}
//         <div className={`${cardBg} p-4 rounded-lg border`}>
//           <h4 className={`text-sm font-medium ${textColor} mb-2 text-center`}>Sentiment Distribution</h4>
//           <ResponsiveContainer width="100%" height={180}>
//             <PieChart>
//               <defs>
//                 <linearGradient id="piePositive" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
//                   <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
//                 </linearGradient>
//                 <linearGradient id="pieNeutral" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="0%" stopColor={isDarkMode ? "#94a3b8" : "#64748b"} stopOpacity={0.9} />
//                   <stop offset="100%" stopColor={isDarkMode ? "#94a3b8" : "#64748b"} stopOpacity={0.6} />
//                 </linearGradient>
//                 <linearGradient id="pieNegative" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
//                   <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
//                 </linearGradient>
//               </defs>
//               <Pie
//                 data={distributionData}
//                 cx="50%"
//                 cy="50%"
//                 innerRadius={50}
//                 outerRadius={70}
//                 paddingAngle={3}
//                 dataKey="value"
//                 stroke="none"
//               >
//                 <Cell fill="url(#piePositive)" />
//                 <Cell fill="url(#pieNeutral)" />
//                 <Cell fill="url(#pieNegative)" />
//               </Pie>
//               <Tooltip content={<CustomTooltip />} />
//             </PieChart>
//           </ResponsiveContainer>
//           <div className="flex justify-center gap-4 mt-2">
//             <div className="flex items-center">
//               <div className="w-3 h-3 rounded-full bg-emerald-500 mr-1" />
//               <span className={`text-xs ${legendTextColor}`}>Positive</span>
//             </div>
//             <div className="flex items-center">
//               <div className="w-3 h-3 rounded-full bg-slate-400 mr-1" />
//               <span className={`text-xs ${legendTextColor}`}>Neutral</span>
//             </div>
//             <div className="flex items-center">
//               <div className="w-3 h-3 rounded-full bg-red-500 mr-1" />
//               <span className={`text-xs ${legendTextColor}`}>Negative</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Bottom row: Additional charts */}
//       <div className="grid grid-cols-2 gap-6">
//         {/* Sentiment score - Gauge chart */}
//         <div className={`${cardBg} p-4 rounded-lg border`}>
//           <h4 className={`text-sm font-medium ${textColor} mb-2 text-center`}>Sentiment Score</h4>
//           <ResponsiveContainer width="100%" height={120}>
//             <BarChart data={sentimentScoreData} layout="vertical">
//               <defs>
//                 <linearGradient id="sentimentGradient" x1="0" y1="0" x2="1" y2="0">
//                   <stop offset="0%" stopColor="#ef4444" />
//                   <stop offset="50%" stopColor="#f59e0b" />
//                   <stop offset="100%" stopColor="#10b981" />
//                 </linearGradient>
//               </defs>
//               <XAxis 
//                 type="number" 
//                 domain={[0, 100]} 
//                 tick={{fill: tickColor, fontSize: 12}}
//                 tickFormatter={(value) => `${value}%`}
//                 axisLine={{ stroke: axisColor }}
//                 tickLine={{ stroke: axisColor }}
//               />
//               <YAxis 
//                 type="category" 
//                 dataKey="name" 
//                 hide={true}
//               />
//               <Tooltip 
//                 formatter={(value: number) => [`${value}%`, 'Score']} 
//                 contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
//               />
//               <Bar 
//                 dataKey="value" 
//                 fill="url(#sentimentGradient)" 
//                 radius={[8, 8, 8, 8]} 
//                 barSize={24}
//               />
//               <text
//                 x="50%"
//                 y="50%"
//                 textAnchor="middle"
//                 dominantBaseline="middle"
//                 className={isDarkMode ? "fill-white" : "fill-slate-800"}
//                 style={{ fontWeight: 'bold', fontSize: '18px' }}
//               >
//                 {`${Math.round(sentimentScore * 100)}%`}
//               </text>
//             </BarChart>
//           </ResponsiveContainer>
//           <div className="flex justify-between text-xs mt-2">
//             <span className={isDarkMode ? "text-red-400" : "text-red-600"}>Negative</span>
//             <span className={isDarkMode ? "text-amber-400" : "text-amber-600"}>Neutral</span>
//             <span className={isDarkMode ? "text-emerald-400" : "text-emerald-600"}>Positive</span>
//           </div>
//         </div>

//         {/* Historical trend - Area chart */}
//         <div className={`${cardBg} p-4 rounded-lg border`}>
//           <h4 className={`text-sm font-medium ${textColor} mb-2 text-center`}>Sentiment Trend</h4>
//           <ResponsiveContainer width="100%" height={120}>
//             <AreaChart data={historyData}>
//               <defs>
//                 <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
//                   <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
//                 </linearGradient>
//               </defs>
//               <XAxis 
//                 dataKey="date" 
//                 tick={{fill: tickColor, fontSize: 12}}
//                 axisLine={{ stroke: axisColor }}
//                 tickLine={{ stroke: axisColor }}
//               />
//               <YAxis 
//                 hide={true}
//                 domain={[0, 1]}
//               />
//               <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
//               <Tooltip 
//                 formatter={(value: number) => [`${(value * 100).toFixed(0)}%`, 'Score']} 
//                 contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
//               />
//               <Area 
//                 type="monotone" 
//                 dataKey="score" 
//                 stroke="#3b82f6" 
//                 strokeWidth={2}
//                 fill="url(#trendGradient)" 
//               />
//             </AreaChart>
//           </ResponsiveContainer>
//         </div>
//       </div>
//     </div>
//   );
// }


import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  ResponsiveContainer, XAxis, YAxis, Tooltip, 
  AreaChart, CartesianGrid, Area,
  RadialBarChart, RadialBar
} from 'recharts';
import { Testimonial } from "@/types/testimonial";

interface SentimentMiniChartsProps {
  testimonial: Testimonial | null | undefined;
  isDarkMode?: boolean;
}

export function SentimentMiniCharts({ testimonial, isDarkMode = true }: SentimentMiniChartsProps) {
  // Default sentiment values to use when no data is available
  const defaultSentimentScore = 0.5;
  const defaultSentimentData = {
    label: "neutral" as "positive" | "neutral" | "negative",
    score: 0.5,
    count: 0,
    keywords: []
  };
  
  // Safely extract sentiment analysis from the analyses array with proper null checks
  const sentimentAnalysis = testimonial?.analyses?.find(analysis => 
    analysis.analysis_type === "sentiment"
  );
  
  // Extract sentiment data or use defaults if not available
  const sentimentScore = sentimentAnalysis?.sentiment_score ?? defaultSentimentScore;
  const sentimentData = sentimentAnalysis?.analysis_data?.sentiment ?? defaultSentimentData;
  
  // Generate keyword data for charts
  const generateKeywordData = () => {
    // If no keywords are provided or it's an empty array, create sample data
    if (
      !sentimentData || 
      typeof sentimentData !== 'object' ||
      !('keywords' in sentimentData) ||
      !Array.isArray(sentimentData.keywords) || 
      sentimentData.keywords.length === 0
    ) {
      return [
        { name: 'excellent', value: 12, score: 0.8 },
        { name: 'service', value: 8, score: 0.7 },
        { name: 'helpful', value: 6, score: 0.75 },
        { name: 'quality', value: 5, score: 0.65 },
        { name: 'recommend', value: 4, score: 0.85 }
      ];
    }
    
    // Convert string keywords to chart data format with randomized values
    return sentimentData.keywords.map((keyword, index) => {
      // Generate a score between 0.6 and 0.95 based on index
      const keywordScore = 0.6 + (index % 4) * 0.1;
      // Generate a value (occurrence) between 3 and 15
      const occurrences = 3 + Math.floor((index % 5) * 3);
      
      return {
        name: keyword,
        value: occurrences,
        score: keywordScore
      };
    }).slice(0, 5); // Limit to top 5
  };

  const keywordData = generateKeywordData();
  
  // Sentiment score indicator data - use the direct sentiment_score
  const sentimentScoreData = [
    { name: 'Score', value: Math.round(sentimentScore * 100) }
  ];
  
  // Sentiment distribution data based on the sentiment label
  const sentimentLabel = typeof sentimentData === 'object' && sentimentData !== null && 'label' in sentimentData
    ? sentimentData.label
    : 'neutral';
  const distributionData = [
    { 
      name: 'Positive', 
      value: sentimentLabel === 'positive' ? 60 : 30 
    },
    { 
      name: 'Neutral', 
      value: sentimentLabel === 'neutral' ? 50 : 20 
    },
    { 
      name: 'Negative', 
      value: sentimentLabel === 'negative' ? 50 : 20 
    }
  ];

  // Historical data (simulated)
  const historyData = [
    { date: 'Mon', score: 0.65 },
    { date: 'Tue', score: 0.72 },
    { date: 'Wed', score: 0.58 },
    { date: 'Thu', score: sentimentScore },
    { date: 'Fri', score: sentimentScore + 0.05 > 1 ? 0.98 : sentimentScore + 0.05 }
  ];

  // Color scheme
  const COLORS = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'];

  // Dynamic styles based on theme
  const cardBg = isDarkMode 
    ? "bg-slate-800/30 border-slate-700/50" 
    : "bg-white border-slate-200";
  
  const textColor = isDarkMode ? "text-slate-300" : "text-slate-600";
  const legendTextColor = isDarkMode ? "text-slate-400" : "text-slate-500";
  
  // Chart theme colors
  const axisColor = isDarkMode ? "#475569" : "#cbd5e1";
  const tickColor = isDarkMode ? "#cbd5e1" : "#64748b";
  const gridColor = isDarkMode ? "#334155" : "#e2e8f0";
  const tooltipBg = isDarkMode ? "#1e293b" : "#ffffff";
  const tooltipBorder = isDarkMode ? "#475569" : "#cbd5e1";

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${isDarkMode ? "bg-slate-800" : "bg-white"} p-2 border ${isDarkMode ? "border-slate-700" : "border-slate-200"} rounded shadow text-sm`}>
          <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}>
            {`${label || payload[0].name}`}
          </p>
          <p className={isDarkMode ? "text-emerald-400" : "text-emerald-600"}>
            {`Value: ${payload[0].value}`}
          </p>
          {payload[0].payload.score !== undefined && (
            <p className={isDarkMode ? "text-blue-400" : "text-blue-600"}>
              {`Score: ${(payload[0].payload.score * 100).toFixed(0)}%`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top row: Main charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Keyword importance - Radial bars */}
        <div className={`${cardBg} p-4 rounded-lg border`}>
          <h4 className={`text-sm font-medium ${textColor} mb-2 text-center`}>Key Terms Impact</h4>
          <ResponsiveContainer width="100%" height={180}>
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="20%" 
              outerRadius="90%" 
              data={keywordData} 
              startAngle={180} 
              endAngle={0}
            >
              <RadialBar
                background
                dataKey="score"
                cornerRadius={12}
                fill="#3b82f6"
              >
                {keywordData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    fillOpacity={0.8}
                  />
                ))}
              </RadialBar>
              <Tooltip content={<CustomTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="flex justify-center mt-2">
            <div className="flex flex-wrap justify-center gap-2">
              {keywordData.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-1" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className={`text-xs ${legendTextColor}`}>{String(entry.name)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sentiment distribution - Pie chart */}
        <div className={`${cardBg} p-4 rounded-lg border`}>
          <h4 className={`text-sm font-medium ${textColor} mb-2 text-center`}>Sentiment Distribution</h4>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <defs>
                <linearGradient id="piePositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="pieNeutral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isDarkMode ? "#94a3b8" : "#64748b"} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={isDarkMode ? "#94a3b8" : "#64748b"} stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="pieNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                <Cell fill="url(#piePositive)" />
                <Cell fill="url(#pieNeutral)" />
                <Cell fill="url(#pieNegative)" />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-emerald-500 mr-1" />
              <span className={`text-xs ${legendTextColor}`}>Positive</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-slate-400 mr-1" />
              <span className={`text-xs ${legendTextColor}`}>Neutral</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-1" />
              <span className={`text-xs ${legendTextColor}`}>Negative</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Additional charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Sentiment score - Gauge chart */}
        <div className={`${cardBg} p-4 rounded-lg border`}>
          <h4 className={`text-sm font-medium ${textColor} mb-2 text-center`}>Sentiment Score</h4>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={sentimentScoreData} layout="vertical">
              <defs>
                <linearGradient id="sentimentGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <XAxis 
                type="number" 
                domain={[0, 100]} 
                tick={{fill: tickColor, fontSize: 12}}
                tickFormatter={(value) => `${value}%`}
                axisLine={{ stroke: axisColor }}
                tickLine={{ stroke: axisColor }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                hide={true}
              />
              <Tooltip 
                formatter={(value: number) => [`${value}%`, 'Score']} 
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
              />
              <Bar 
                dataKey="value" 
                fill="url(#sentimentGradient)" 
                radius={[8, 8, 8, 8]} 
                barSize={24}
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className={isDarkMode ? "fill-white" : "fill-slate-800"}
                style={{ fontWeight: 'bold', fontSize: '18px' }}
              >
                {`${Math.round(sentimentScore * 100)}%`}
              </text>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-between text-xs mt-2">
            <span className={isDarkMode ? "text-red-400" : "text-red-600"}>Negative</span>
            <span className={isDarkMode ? "text-amber-400" : "text-amber-600"}>Neutral</span>
            <span className={isDarkMode ? "text-emerald-400" : "text-emerald-600"}>Positive</span>
          </div>
        </div>

        {/* Historical trend - Area chart */}
        <div className={`${cardBg} p-4 rounded-lg border`}>
          <h4 className={`text-sm font-medium ${textColor} mb-2 text-center`}>Sentiment Trend</h4>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tick={{fill: tickColor, fontSize: 12}}
                axisLine={{ stroke: axisColor }}
                tickLine={{ stroke: axisColor }}
              />
              <YAxis 
                hide={true}
                domain={[0, 1]}
              />
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
              <Tooltip 
                formatter={(value: number) => [`${(value * 100).toFixed(0)}%`, 'Score']} 
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fill="url(#trendGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}