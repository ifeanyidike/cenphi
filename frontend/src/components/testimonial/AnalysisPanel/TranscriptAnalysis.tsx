// components/AnalysisPanel/TranscriptAnalysis.tsx

import React, { useState } from "react";
import { motion } from "framer-motion";

interface TranscriptAnalysisProps {
  data: {
    transcript: string;
    confidence: number;
    speakerSegments?: Array<{
      speaker: string;
      start: number;
      end: number;
      text: string;
    }>;
  };
}

const TranscriptAnalysis: React.FC<TranscriptAnalysisProps> = ({ data }) => {
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  // Format time (seconds) to mm:ss format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // For display purposes, limit transcript length if it's too long
  const displayTranscript = showFullTranscript
    ? data.transcript
    : data.transcript.length > 300
      ? `${data.transcript.substring(0, 300)}...`
      : data.transcript;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Transcript Analysis</h3>
        <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
          {(data.confidence * 100).toFixed(1)}% confidence
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
        <p className="text-slate-700 whitespace-pre-line">
          {displayTranscript}
        </p>

        {data.transcript.length > 300 && (
          <button
            className="text-blue-500 hover:text-blue-700 mt-2 text-sm font-medium"
            onClick={() => setShowFullTranscript(!showFullTranscript)}
          >
            {showFullTranscript ? "Show less" : "Show full transcript"}
          </button>
        )}
      </div>

      {data.speakerSegments && data.speakerSegments.length > 0 && (
        <div>
          <h4 className="font-medium text-slate-700 mb-3">Speaker Segments</h4>
          <div className="space-y-3">
            {data.speakerSegments.map((segment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm"
              >
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-blue-600">
                    {segment.speaker}
                  </span>
                  <span className="text-sm text-slate-500">
                    {formatTime(segment.start)} - {formatTime(segment.end)}
                  </span>
                </div>
                <p className="text-slate-700 text-sm">{segment.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <div className="flex space-x-2">
          <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Edit
          </button>
          <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              />
            </svg>
            Export
          </button>
        </div>

        <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
          Refine Transcript
        </button>
      </div>
    </div>
  );
};

export default TranscriptAnalysis;
