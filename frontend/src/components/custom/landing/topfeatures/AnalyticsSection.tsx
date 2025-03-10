import React from "react";
import { ArrowUpRight, PieChart, Search, Users, Wallet } from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AnalyticsSection = () => {
  // More realistic data
  const chartData = [
    { month: "Jan", conversion: 48, testimonials: 42, revenue: 35 },
    { month: "Feb", conversion: 52, testimonials: 48, revenue: 40 },
    { month: "Mar", conversion: 67, testimonials: 53, revenue: 45 },
    { month: "Apr", conversion: 58, testimonials: 59, revenue: 52 },
    { month: "May", conversion: 63, testimonials: 64, revenue: 58 },
    { month: "Jun", conversion: 75, testimonials: 68, revenue: 65 },
    { month: "Jul", conversion: 82, testimonials: 72, revenue: 70 },
    { month: "Aug", conversion: 76, testimonials: 78, revenue: 72 },
    { month: "Sep", conversion: 88, testimonials: 84, revenue: 78 },
    { month: "Oct", conversion: 92, testimonials: 88, revenue: 82 },
    { month: "Nov", conversion: 85, testimonials: 92, revenue: 86 },
    { month: "Dec", conversion: 94, testimonials: 96, revenue: 88 },
  ];

  const [chartType, setChartType] = React.useState("area");

  return (
    <div className="absolute inset-0 p-4 md:p-6 flex flex-col text-white h-auto">
      {/* Header with improved controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h4 className="text-xl font-semibold">Performance Analytics</h4>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search metrics..."
              className="pl-10 pr-4 py-1.5 rounded-md bg-white/5 border border-white/10 text-sm w-40 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Key metrics row */}
      <div className="flex gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer w-80">
          <div className="flex justify-between items-start mb-3">
            <div className="text-sm text-gray-400">Total Testimonials</div>
            <div className="p-1.5 rounded-full bg-blue-500/20">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-bold">1,285</div>
          <div className="flex items-center gap-1 text-xs text-emerald-400 mt-2">
            <ArrowUpRight className="w-3 h-3" />
            <span>+12.5% from last month</span>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer w-80 ">
          <div className="flex justify-between items-start mb-3">
            <div className="text-sm text-gray-400">Avg. Rating</div>
            <div className="p-1.5 rounded-full bg-purple-500/20">
              <PieChart className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-bold">4.8/5</div>
          <div className="flex items-center gap-1 text-xs text-emerald-400 mt-2">
            <ArrowUpRight className="w-3 h-3" />
            <span>+0.3 from last month</span>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer w-80 ">
          <div className="flex justify-between items-start mb-3">
            <div className="text-sm text-gray-400">Revenue Impact</div>
            <div className="p-1.5 rounded-full bg-amber-500/20">
              <Wallet className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-bold">$42.8K</div>
          <div className="flex items-center gap-1 text-xs text-emerald-400 mt-2">
            <ArrowUpRight className="w-3 h-3" />
            <span>+18.3% from last month</span>
          </div>
        </div>
      </div>

      {/* Main chart */}
      <div className="flex-1 bg-white/5 rounded-lg border border-white/10 p-5">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h5 className="font-medium">Conversion Impact</h5>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 rounded-md ${
                  chartType === "area"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-transparent hover:bg-white/10 text-gray-400"
                } text-xs font-medium`}
                onClick={() => setChartType("area")}
              >
                Area
              </button>
              <button
                className={`px-3 py-1 rounded-md ${
                  chartType === "line"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-transparent hover:bg-white/10 text-gray-400"
                } text-xs font-medium`}
                onClick={() => setChartType("line")}
              >
                Line
              </button>
              <button
                className={`px-3 py-1 rounded-md ${
                  chartType === "bar"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-transparent hover:bg-white/10 text-gray-400"
                } text-xs font-medium`}
                onClick={() => setChartType("bar")}
              >
                Bar
              </button>
            </div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id="colorConversion"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorTestimonials"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <YAxis hide={true} />
                <CartesianGrid vertical={false} stroke="#ffffff10" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderColor: "#ffffff20",
                    borderRadius: "0.375rem",
                  }}
                  itemStyle={{ color: "#f3f4f6" }}
                  labelStyle={{ color: "#d1d5db" }}
                />
                <Area
                  type="monotone"
                  dataKey="conversion"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorConversion)"
                />
                <Area
                  type="monotone"
                  dataKey="testimonials"
                  stroke="#a855f7"
                  fillOpacity={1}
                  fill="url(#colorTestimonials)"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            ) : chartType === "line" ? (
              <RechartsLineChart data={chartData}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <YAxis hide={true} />
                <CartesianGrid vertical={false} stroke="#ffffff10" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderColor: "#ffffff20",
                    borderRadius: "0.375rem",
                  }}
                  itemStyle={{ color: "#f3f4f6" }}
                  labelStyle={{ color: "#d1d5db" }}
                />
                <Line
                  type="monotone"
                  dataKey="conversion"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="testimonials"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </RechartsLineChart>
            ) : (
              <BarChart data={chartData}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <YAxis hide={true} />
                <CartesianGrid vertical={false} stroke="#ffffff10" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderColor: "#ffffff20",
                    borderRadius: "0.375rem",
                  }}
                  itemStyle={{ color: "#f3f4f6" }}
                  labelStyle={{ color: "#d1d5db" }}
                />
                <Bar
                  dataKey="conversion"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="testimonials"
                  fill="#a855f7"
                  radius={[4, 4, 0, 0]}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer / Legend */}
      <div className="flex justify-between items-center mt-6 text-sm text-gray-400">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Conversion Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span>Testimonial Growth</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Revenue Impact</span>
          </div>
        </div>
        <div className="text-xs">
          <span className="text-gray-500">Updated: </span>
          <span>Today, 8:45 AM</span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSection;
