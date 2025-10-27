import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Lightbulb, Sparkles } from 'lucide-react';
import { authStore } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface FollowUpSuggestionsProps {
  sessionId: string | null;
  onSelectSuggestion: (suggestion: string) => void;
}

const FollowUpSuggestions: React.FC<FollowUpSuggestionsProps> = observer(
  ({ sessionId, onSelectSuggestion }) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSuggestions = async () => {
      if (!sessionId) {
        // Show default suggestions if no session
        setSuggestions([
          'What do customers love most about our service?',
          'Summarize all feedback related to pricing',
          'List common pain points mentioned',
          'What are the top 3 recurring themes?',
        ]);
        return;
      }

      setLoading(true);
      try {
        const tokenInfo = await authStore.getToken();
        const response = await fetch(`${API_BASE_URL}/ai/chat-with-data/follow-ups/${sessionId}`, {
          headers: {
            Authorization: `Bearer ${tokenInfo.token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Failed to fetch follow-up suggestions:', error);
        // Fallback to generic suggestions
        setSuggestions([
          'Can you provide more details about that?',
          'What other insights can you share?',
          'How does this trend compare over time?',
        ]);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchSuggestions();
    }, [sessionId]);

    if (loading) {
      return (
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <Sparkles className="h-4 w-4 text-slate-400 animate-pulse" />
          <span className="text-xs text-slate-500">Generating suggestions...</span>
        </div>
      );
    }

    if (suggestions.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-medium text-slate-700">Suggested questions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSelectSuggestion(suggestion)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left text-xs text-slate-700 transition-colors group"
            >
              <span className="flex items-center gap-1.5">
                <span className="flex-1">{suggestion}</span>
                <Sparkles className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }
);

export default FollowUpSuggestions;
