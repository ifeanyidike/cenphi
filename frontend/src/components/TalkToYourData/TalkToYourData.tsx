import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Clock,
  Calendar,
  X,
  Filter,
  ChevronDown,
  BarChart3,
} from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { DateRangeFilter } from "./DateRangeFilter";
import AnalyticsDashboard from "./AnalyticsDashboard";
import ConversationHistory from "./ConversationHistory";
import FollowUpSuggestions from "./FollowUpSuggestions";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { workspaceHub } from "@/repo/workspace_hub";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface StreamingMessage {
  content: string;
  isComplete: boolean;
}

interface DateRange {
  from: Date | null;
  to: Date | null;
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8081/api";

export const TalkToYourData: React.FC = observer(() => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] =
    useState<StreamingMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: null,
    to: null,
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const workspace = workspaceHub.workspace;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const generateMessageId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const handleSendMessage = async (content: string) => {
    if (!workspace?.id) {
      setError("No workspace selected");
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: generateMessageId(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setStreamingMessage({ content: "", isComplete: false });

    try {
      const requestBody: any = {
        message: content,
        workspace_id: workspace.id,
      };

      // Include session ID if exists
      if (currentSessionId) {
        requestBody.session_id = currentSessionId;
      }

      // Include date range if specified
      if (dateRange.from) {
        requestBody.date_from = dateRange.from.toISOString();
      }
      if (dateRange.to) {
        requestBody.date_to = dateRange.to.toISOString();
      }
      const tokenInfo = await authStore.getToken();
      const response = await fetch(`${API_BASE_URL}/ai/chat-with-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenInfo.token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body reader available");
      }

      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data.trim() === "") continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.done) {
                // Extract and store session ID if present
                if (parsed.session_id && !currentSessionId) {
                  setCurrentSessionId(parsed.session_id);
                }

                // Complete the streaming message
                setStreamingMessage((prev) =>
                  prev ? { ...prev, isComplete: true } : null
                );

                // Add the complete assistant message
                const assistantMessage: Message = {
                  id: generateMessageId(),
                  role: "assistant",
                  content: accumulatedContent,
                  timestamp: new Date(),
                };

                setMessages((prev) => [...prev, assistantMessage]);
                setStreamingMessage(null);
                break;
              } else if (parsed.content) {
                accumulatedContent += parsed.content;
                setStreamingMessage({
                  content: accumulatedContent,
                  isComplete: false,
                });
              }
            } catch (e) {
              console.warn("Failed to parse SSE data:", data);
            }
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while processing your request"
      );
      setStreamingMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingMessage(null);
    setError(null);
    setCurrentSessionId(null);
  };

  const handleSelectSession = (sessionId: string, sessionMessages: any[]) => {
    // Load messages from the selected session
    const loadedMessages: Message[] = sessionMessages.map((msg: any) => ({
      id: generateMessageId(),
      role: msg.role as "user" | "assistant",
      content: msg.content,
      timestamp: new Date(msg.timestamp),
    }));

    setMessages(loadedMessages);
    setCurrentSessionId(sessionId);
    setError(null);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  const clearDateRange = () => {
    setDateRange({ from: null, to: null });
  };

  const insightCategories = [
    {
      label: "Customer Sentiment",
      queries: [
        "What do customers love most about our service?",
        "Show sentiment analysis of recent testimonials",
        "Analyze overall customer satisfaction",
      ],
    },
    {
      label: "Product Feedback",
      queries: [
        "Which features get mentioned most frequently?",
        "List common pain points mentioned in testimonials",
        "What improvements do customers suggest?",
      ],
    },
    {
      label: "Trends & Patterns",
      queries: [
        "What are the top 3 recurring themes?",
        "What trends do you see in the last 30 days?",
        "How has feedback changed over time?",
      ],
    },
  ];

  const quickInsights = [
    { label: "Top Pain Points", icon: AlertCircle },
    { label: "Sentiment Overview", icon: TrendingUp },
    { label: "Feature Mentions", icon: MessageSquare },
    { label: "Recent Feedback", icon: Clock },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white">
      {/* Ultra Sleek Header */}
      <div className="flex-shrink-0 border-b border-gray-100 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                Data Intelligence
              </h1>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                AI-powered insights from your testimonials
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "chat" && (
              <ConversationHistory onSelectSession={handleSelectSession} />
            )}
            {messages.length > 0 && activeTab === "chat" && (
              <button
                onClick={clearChat}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all"
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-3">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="bg-slate-100 p-1 h-9">
              <TabsTrigger
                value="chat"
                className="text-xs flex items-center gap-1.5"
              >
                <MessageSquare className="h-3 w-3" />
                Chat
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="text-xs flex items-center gap-1.5"
              >
                <BarChart3 className="h-3 w-3" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Smart Date Filter Bar */}
      <div className="flex-shrink-0 px-6 py-2 bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-gray-800">
                Time Period
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const today = new Date();
                  const start = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate()
                  );
                  const end = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate(),
                    23,
                    59,
                    59
                  );
                  setDateRange({ from: start, to: end });
                }}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                  dateRange.from &&
                  dateRange.to &&
                  dateRange.from.toDateString() === new Date().toDateString() &&
                  dateRange.to.toDateString() === new Date().toDateString()
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - 7);
                  setDateRange({ from: start, to: end });
                }}
                className="px-3 py-1 text-xs font-medium bg-white text-gray-600 border border-gray-200 rounded-full hover:border-indigo-300 hover:text-indigo-600 transition-all"
              >
                7 days
              </button>
              <button
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - 30);
                  setDateRange({ from: start, to: end });
                }}
                className="px-3 py-1 text-xs font-medium bg-white text-gray-600 border border-gray-200 rounded-full hover:border-indigo-300 hover:text-indigo-600 transition-all"
              >
                30 days
              </button>
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-white text-gray-600 border border-gray-200 rounded-full hover:border-indigo-300 hover:text-indigo-600 transition-all"
              >
                <Calendar className="w-3 h-3" />
                Custom
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showDateFilter ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(dateRange.from || dateRange.to) && (
              <>
                <div className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold">
                  {dateRange.from &&
                    dateRange.from.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  {dateRange.from && dateRange.to && " → "}
                  {dateRange.to &&
                    dateRange.to.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                </div>
                <button
                  onClick={clearDateRange}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Compact Date Filter Toggle */}
      {showDateFilter && (
        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-b border-gray-100">
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onClear={clearDateRange}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white">
        {activeTab === "analytics" ? (
          <div className="p-6">
            <AnalyticsDashboard dateRange={dateRange} />
          </div>
        ) : (
          <>
            {messages.length === 0 && !streamingMessage ? (
              <div className="h-full flex items-center justify-center p-8">
                <div className="max-w-4xl mx-auto">
                  {/* Premium Insights Bar */}
                  <div className="flex justify-center gap-3 mb-10">
                    {quickInsights.map((insight, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          handleSendMessage(
                            `Analyze ${insight.label.toLowerCase()}`
                          )
                        }
                        className="group flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:text-indigo-600 hover:border-indigo-300 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                          <insight.icon className="w-4 h-4 group-hover:text-indigo-600 transition-colors" />
                        </div>
                        <span>{insight.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Premium Category Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {insightCategories.map((category, categoryIndex) => (
                      <div
                        key={categoryIndex}
                        className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-indigo-200 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-indigo-600" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                            {category.label}
                          </h3>
                        </div>
                        <div className="space-y-2">
                          {category.queries.map((query, queryIndex) => (
                            <button
                              key={queryIndex}
                              onClick={() => handleSendMessage(query)}
                              className="block w-full text-left text-sm text-gray-600 hover:text-indigo-600 py-2.5 px-3 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                            >
                              {query}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Elegant hint */}
                  <div className="text-center mt-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-xs text-gray-500 font-medium shadow-sm">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      Ask any question about your testimonials
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Chat messages - Clean Layout */
              <div className="max-w-4xl mx-auto px-6 py-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}

                  {streamingMessage && (
                    <ChatMessage
                      message={{
                        id: "streaming",
                        role: "assistant",
                        content: streamingMessage.content,
                        timestamp: new Date(),
                      }}
                      isStreaming={!streamingMessage.isComplete}
                    />
                  )}

                  {/* Follow-up suggestions */}
                  {messages.length > 0 && !isLoading && !streamingMessage && (
                    <div className="mt-6 pt-4 border-t border-slate-200">
                      <FollowUpSuggestions
                        sessionId={currentSessionId}
                        onSelectSuggestion={handleSelectSuggestion}
                      />
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}

            {/* Elegant Error Display */}
            {error && (
              <div className="mx-6 mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-red-800 font-semibold">
                      Something went wrong
                    </p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Premium Input Section - Only show in chat tab */}
      {activeTab === "chat" && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={!workspace?.id}
            isLoading={isLoading}
            placeholder={
              !workspace?.id
                ? "Select a workspace to begin analysis..."
                : "Ask anything about your testimonials..."
            }
          />
        </div>
      )}
    </div>
  );
});
