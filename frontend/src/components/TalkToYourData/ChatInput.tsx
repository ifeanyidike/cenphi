import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  isLoading = false,
  placeholder = "Ask a question about your testimonials..."
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
      resetTextareaHeight();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // Approximately 5 lines
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const exampleQueries = [
    "What do customers love most about our service?",
    "Summarize feedback about pricing",
    "List common pain points mentioned",
    "What are the top 3 recurring themes?",
    "Show sentiment analysis of testimonials"
  ];

  return (
    <div className="bg-white p-6 border-t border-gray-100">
      {/* Premium example queries */}
      {message.length === 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {exampleQueries.slice(0, 3).map((query, index) => (
              <button
                key={index}
                onClick={() => setMessage(query)}
                disabled={disabled || isLoading}
                className="px-3 py-2 text-xs bg-gradient-to-r from-gray-50 to-indigo-50/50 hover:from-indigo-50 hover:to-purple-50 rounded-lg text-gray-700 hover:text-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-indigo-300 font-medium"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-4 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className="w-full px-5 py-4 border border-gray-200 rounded-2xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm leading-relaxed bg-gray-50 focus:bg-white transition-all shadow-sm focus:shadow-md"
            style={{ minHeight: '52px' }}
          />

          {message.length > 0 && (
            <div className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium">
              {message.length}/2000
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!message.trim() || disabled || isLoading}
          className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Send className="w-5 h-5 text-white" />
          )}
        </button>
      </form>

      <div className="mt-3 text-xs text-gray-500 font-medium">
        Press Enter to send • Shift+Enter for new line
      </div>
    </div>
  );
};