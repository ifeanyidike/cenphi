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
    tooltips: {
      enabled: true,
      callbacks: {
        label: (context: any) => {
          return `${context.text}: ${context.value} mentions`;
        },
      },
    },
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
      // Create a styled tooltip
      const sentimentColor = word.sentiment === 'positive' ? '#10b981' :
                            word.sentiment === 'negative' ? '#ef4444' : '#64748b';
      const sentimentLabel = word.sentiment.charAt(0).toUpperCase() + word.sentiment.slice(1);

      return `<div style="
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 6px 10px;
        font-family: 'Urbanist', sans-serif;
        font-size: 11px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        max-width: 200px;
      ">
        <div style="font-weight: 600; color: #1e293b; margin-bottom: 2px;">${word.text}</div>
        <div style="color: #64748b; font-size: 10px;">
          <span style="font-weight: 500;">${word.value}</span> mentions
        </div>
        <div style="
          display: inline-block;
          margin-top: 3px;
          padding: 2px 6px;
          background: ${sentimentColor}15;
          color: ${sentimentColor};
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        ">${sentimentLabel}</div>
      </div>`;
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
