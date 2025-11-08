import React from 'react';
import ReactWordcloud from 'react-wordcloud';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface WordCloudChartProps {
  data: {
    words: Array<{
      text: string;
      value: number;
      sentiment: string;
    }>;
  } | null;
  loading?: boolean;
}

const WordCloudChart: React.FC<WordCloudChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">Word Cloud</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse text-slate-500 text-xs">Loading word cloud...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.words || data.words.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">Keyword Cloud</CardTitle>
          <CardDescription className="text-xs text-slate-600 mt-1">
            Most frequently mentioned words in testimonials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-slate-500 text-xs">No word data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for react-wordcloud
  const words = data.words.map((word) => ({
    text: word.text,
    value: word.value,
    sentiment: word.sentiment,
  }));

  const options = {
    rotations: 2,
    rotationAngles: [0, 90] as [number, number],
    fontSizes: [14, 60] as [number, number],
    padding: 2,
    enableTooltip: true,
    deterministic: true,
    fontFamily: 'Urbanist, sans-serif',
    fontWeight: '600',
  };

  const callbacks = {
    getWordColor: (word: any) => {
      switch (word.sentiment) {
        case 'positive':
          return '#10b981';
        case 'negative':
          return '#ef4444';
        default:
          return '#64748b';
      }
    },
    onWordClick: (word: any) => {
      console.log('Word clicked:', word);
    },
    getWordTooltip: (word: any) => {
      const sentimentLabel = word.sentiment.charAt(0).toUpperCase() + word.sentiment.slice(1);

      // Return plain text tooltip - react-wordcloud doesn't support HTML tooltips
      return `${word.text}\n${word.value} mentions • ${sentimentLabel}`;
    },
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-slate-900">Keyword Cloud</CardTitle>
        <CardDescription className="text-xs text-slate-600 mt-1">
          Most frequently mentioned words in testimonials
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height: '320px', width: '100%' }}>
          <ReactWordcloud
            words={words}
            options={options}
            callbacks={callbacks}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500"></div>
            <span className="text-slate-600">Positive</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-500"></div>
            <span className="text-slate-600">Neutral</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-slate-600">Negative</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WordCloudChart;
