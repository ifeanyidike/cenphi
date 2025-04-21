import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, AlertCircle } from "lucide-react";

// Define types for our props
interface CustomerProfile {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  external_id: string;
  avatar_url: string;
}

interface Testimonial {
  id: string;
  customer_profile: CustomerProfile;
  created_at: string;
  sentiment: Sentiment;
  status: string;
  rating: number;
  format: string;
  content?: string;
}

interface SentimentSummary {
  positive: number;
  neutral: number;
  negative: number;
}

interface Sentiment  {
  score: number; // -1 to 1
  label: "positive" | "neutral" | "negative" | string;
  keywords: string[];
  count: number; // Number of sentiment keywords detected
};
interface SentimentAnalysisProps {
  testimonials: Testimonial[];
  sentimentSummary?: SentimentSummary;
}

// Define type for sentiment tracking
interface SentimentCounts {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

// Create a type guard to validate sentiment values
function isValidSentiment(sentiment: Sentiment['label']): sentiment is 'positive' | 'neutral' | 'negative' {
  return sentiment === 'positive' || sentiment === 'neutral' || sentiment === 'negative';
}

// Sample data moved to component level for when no props are provided
const sampleTestimonials: Testimonial[] = [
  {
    id: '1',
    customer_profile: {
      id: '1',
      name: 'Jane Smith',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      external_id: '123',
      avatar_url: ''
    },
    created_at: '2024-01-15',
    sentiment: { label: 'positive', score: 0.9, keywords: [], count: 0 },
    status: 'pending_reveiw',
    rating: 5,
    format: 'audio',
    content: 'Excellent product!'
  },
  {
    id: '2',
    customer_profile: {
      id: '2',
      name: 'John Doe',
      created_at: '2024-02-01',
      updated_at: '2024-02-01',
      external_id: '456',
      avatar_url: ''
    },
    created_at: '2024-02-10',
    sentiment: { label: 'neutral', score: 0, keywords: [], count: 0 },
    status: 'approved',
    rating: 3,
    format: 'video',
    content: 'Average experience.'
  },
  {
    id: '3',
    customer_profile: {
      id: '3',
      name: 'Alex Johnson',
      created_at: '2024-03-01',
      updated_at: '2024-03-01',
      external_id: '789',
      avatar_url: ''
    },
    created_at: '2024-03-05',
    sentiment: { label: 'negative', score: -0.5, keywords: [], count: 0 },
    status: 'approved',
    rating: 2,
    format: 'image',
    content: 'Not satisfied with support.'
  },
  {
    id: '4',
    customer_profile: {
      id: '4',
      name: 'Cletus highcent',
      created_at: '2024-03-01',
      updated_at: '2024-03-01',
      external_id: '654',
      avatar_url: ''
    },
    created_at: '2024-03-05',
    sentiment: { label: 'positive', score: 0.8, keywords: [], count: 0 },
    status: 'approved',
    rating: 2,
    format: 'text',
    content: 'Satisfied with the service.'
  }
];

const sampleSentimentSummary: SentimentSummary = {
  positive: 15,
  neutral: 8,
  negative: 5
};

export default function SentimentAnalysis({ 
  testimonials = [], 
  sentimentSummary 
}: SentimentAnalysisProps) {
  const [visualizationType, setVisualizationType] = useState('chart');
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  
  // Update to the useEffect in the SentimentAnalysis component
useEffect(() => {
  // Log incoming data for debugging with more detail
  console.log('Testimonials received from parent:', testimonials.length);
  console.log('Sample of received testimonials:', testimonials.slice(0, 2));
  console.log('Sentiment summary received from parent:', sentimentSummary);
  
  // Check if real data is provided
  const useRealData = testimonials.length > 0;
  setHasData(useRealData);
  setLoading(false);
  
  if (useRealData) {
    console.log('Using real data from parent component');
  } else {
    console.log('Falling back to sample data');
  }
}, [testimonials, sentimentSummary]);

  // Always use real data if available, otherwise use sample data
  const effectiveTestimonials = testimonials.length > 0 ? testimonials : sampleTestimonials;
  const effectiveSummary = sampleSentimentSummary;

  // Prepare data for charts
  const sentimentData = [
    { name: 'Positive', value: effectiveSummary.positive, color: '#22c55e' },
    { name: 'Neutral', value: effectiveSummary.neutral, color: '#6b7280' },
    { name: 'Negative', value: effectiveSummary.negative, color: '#ef4444' },
  ];

  // Calculate average rating
  const totalRatings = effectiveTestimonials.reduce((sum, testimonial) => sum + testimonial.rating, 0);
  const averageRating = effectiveTestimonials.length 
    ? (totalRatings / effectiveTestimonials.length).toFixed(1) 
    : '0.0';

  // Group testimonials by sentiment and format for additional insights
  const formatCounts = effectiveTestimonials.reduce((acc, testimonial) => {
    const format = testimonial.format || 'unknown';
    acc[format] = (acc[format] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatData = Object.entries(formatCounts).map(([name, value]) => ({
    name,
    value,
    color: name === 'text' ? '#3b82f6' : name === 'video' ? '#8b5cf6' : name === 'image' ? '#f59e0b' : name === 'audio' ? '#ef4444' : '#6b7280',
  }));

  // Prepare rating distribution data
  const ratingDistribution = effectiveTestimonials.reduce((acc, testimonial) => {
    acc[testimonial.rating] = (acc[testimonial.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const ratingData = [1, 2, 3, 4, 5].map(rating => ({
    name: `${rating} ★`,
    value: ratingDistribution[rating] || 0,
    color: rating >= 4 ? '#22c55e' : rating === 3 ? '#f59e0b' : '#ef4444',
  }));

  // Calculate sentiment percentages
  const total = effectiveSummary.positive + effectiveSummary.neutral + effectiveSummary.negative;
  const positivePercentage = total ? Math.round((effectiveSummary.positive / total) * 100) : 0;
  const neutralPercentage = total ? Math.round((effectiveSummary.neutral / total) * 100) : 0;
  const negativePercentage = total ? Math.round((effectiveSummary.negative / total) * 100) : 0;

  // Get sentiment trend over time with type safety fix
  const sentimentByMonth = effectiveTestimonials.reduce((acc: Record<string, SentimentCounts>, testimonial) => {
    const date = new Date(testimonial.created_at);
    const monthYear = `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
    
    if (!acc[monthYear]) {
      acc[monthYear] = { positive: 0, neutral: 0, negative: 0, total: 0 };
    }
    
    // Type-safe way to handle the sentiment property
    if (isValidSentiment(testimonial.sentiment.label)) {
      acc[monthYear][testimonial.sentiment.label] += 1;
    }
    
    acc[monthYear].total += 1;
    
    return acc;
  }, {});

  // Convert to array and sort by date
  const trendData = Object.entries(sentimentByMonth).map(([month, counts]) => ({
    month,
    positive: counts.positive,
    neutral: counts.neutral,
    negative: counts.negative,
    positiveRate: Math.round((counts.positive / counts.total) * 100),
    neutralRate: Math.round((counts.neutral / counts.total) * 100),
    negativeRate: Math.round((counts.negative / counts.total) * 100),
  })).sort((a, b) => {
    // Sort by month/year
    const [aMonth, aYear] = a.month.split('/');
    const [bMonth, bYear] = b.month.split('/');
    if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
    return parseInt(aMonth) - parseInt(bMonth);
  });

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm">Count: {payload[0].value}</p>
          {payload[0].payload.percentage !== undefined && (
            <p className="text-sm">Percentage: {payload[0].payload.percentage}%</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Table rendering for when visualizationType is 'table'
  const renderSentimentTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentiment</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Positive</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{effectiveSummary.positive}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{positivePercentage}%</td>
          </tr>
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Neutral</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{effectiveSummary.neutral}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{neutralPercentage}%</td>
          </tr>
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Negative</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{effectiveSummary.negative}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{negativePercentage}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sentiment data...</p>
        </div>
      </div>
    );
  }

  // Show data notice if using sample data
  const showDataWarning = !hasData;

  return (
    <div className="space-y-4">
      {showDataWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No data provided - displaying sample data. Please pass testimonials to the component.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visualization Type Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              visualizationType === 'chart' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
            }`}
            onClick={() => setVisualizationType('chart')}
          >
            Charts
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              visualizationType === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-l-0 border-gray-300'
            }`}
            onClick={() => setVisualizationType('table')}
          >
            Tables
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="bg-green-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Positive Sentiment</p>
              <p className="text-2xl font-bold">{positivePercentage}%</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Neutral Sentiment</p>
              <p className="text-2xl font-bold">{neutralPercentage}%</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Negative Sentiment</p>
              <p className="text-2xl font-bold">{negativePercentage}%</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <X className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ratings">Ratings</TabsTrigger>
          <TabsTrigger value="formats">Formats</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4 justify-between">
              {visualizationType === 'chart' ? (
                <>
                  {/* Sentiment Pie Chart */}
                  <div className="w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={sentimentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {sentimentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Sentiment Bar Chart */}
                  <div className="w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={sentimentData} layout="vertical">
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {sentimentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                renderSentimentTable()
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Ratings Tab */}
        <TabsContent value="ratings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Average Rating</p>
                  <div className="flex items-center justify-center">
                    <p className="text-4xl font-bold mr-2">{averageRating}</p>
                    <span className="text-xl text-yellow-500">★</span>
                  </div>
                </div>
              </div>
              
              {visualizationType === 'chart' ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ratingData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {ratingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ratingData.map((rating) => (
                        <tr key={rating.name}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rating.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rating.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Formats Tab */}
        <TabsContent value="formats" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Testimonial Formats</CardTitle>
            </CardHeader>
            <CardContent>
              {visualizationType === 'chart' ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={formatData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {formatData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formatData.map((format) => (
                        <tr key={format.name}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{format.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                visualizationType === 'chart' ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={trendData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="positive" name="Positive" fill="#22c55e" stackId="stack" />
                      <Bar dataKey="neutral" name="Neutral" fill="#6b7280" stackId="stack" />
                      <Bar dataKey="negative" name="Negative" fill="#ef4444" stackId="stack" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Positive</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Neutral</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Negative</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {trendData.map((trend) => (
                          <tr key={trend.month}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trend.month}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trend.positive}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trend.neutral}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trend.negative}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Not enough time-series data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="mr-2 mt-1">•</span>
              <span>
                {positivePercentage > 70 
                  ? "Strong positive sentiment dominates your testimonials, indicating high customer satisfaction."
                  : positivePercentage > 50
                  ? "Overall positive sentiment suggests good customer satisfaction with room for improvement."
                  : "There's significant opportunity to improve customer sentiment based on current feedback."}
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-1">•</span>
              <span>
                {negativePercentage > 30
                  ? "Address the higher than ideal negative sentiment by reviewing specific customer concerns."
                  : negativePercentage > 15
                  ? "A moderate level of negative feedback suggests some areas need attention."
                  : "Low negative sentiment indicates few customer concerns, but remain vigilant."}
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-1">•</span>
              <span>
                Average rating of {averageRating} stars {
                  parseFloat(averageRating) >= 4.5 
                    ? "is excellent and should be maintained."
                    : parseFloat(averageRating) >= 4.0
                    ? "is good, with room for reaching excellence."
                    : "indicates significant opportunity for improvement."
                }
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}