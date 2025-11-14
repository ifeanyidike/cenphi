import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { History, MessageCircle, X, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { authStore } from '@/stores/authStore';
import { workspaceHub } from '@/repo/workspace_hub';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
}

interface ConversationSession {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  is_active: boolean;
  last_activity: string;
  created_at: string;
}

interface ConversationHistoryProps {
  onSelectSession: (sessionId: string, messages: ChatMessage[]) => void;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = observer(({ onSelectSession }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    sessionId: string | null;
  }>({
    isOpen: false,
    sessionId: null,
  });

  const workspace = workspaceHub.workspace;

  const fetchConversationHistory = async () => {
    if (!workspace?.id) return;

    setLoading(true);
    try {
      const tokenInfo = await authStore.getToken();
      const response = await fetch(`${API_BASE_URL}/ai/chat-with-data/sessions/${workspace.id}`, {
        headers: {
          Authorization: `Bearer ${tokenInfo.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversation history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeleteConfirm({
      isOpen: true,
      sessionId,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.sessionId) return;

    try {
      const tokenInfo = await authStore.getToken();
      const response = await fetch(`${API_BASE_URL}/ai/chat-with-data/sessions/${deleteConfirm.sessionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenInfo.token}`,
        },
      });

      if (response.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== deleteConfirm.sessionId));
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleSelectSession = (session: ConversationSession) => {
    onSelectSession(session.id, session.messages);
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen && workspace?.id) {
      fetchConversationHistory();
    }
  }, [isOpen, workspace?.id]);

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        >
          <History className="h-4 w-4 mr-1.5" />
          <span className="text-xs">History</span>
          {sessions.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-medium">
              {sessions.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <div className="p-3 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Conversation History</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-pulse text-slate-500 text-xs">Loading history...</div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-6 text-center">
                <MessageCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No conversation history yet</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Your chat sessions will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors group"
                    onClick={() => handleSelectSession(session)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <MessageCircle className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          <p className="text-xs font-medium text-slate-900 truncate">
                            {session.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>{session.messages.length} messages</span>
                          <span>•</span>
                          <span>{formatRelativeTime(session.last_activity)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteClick(session.id, e)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </PopoverContent>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, sessionId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </Popover>
  );
});

export default ConversationHistory;
