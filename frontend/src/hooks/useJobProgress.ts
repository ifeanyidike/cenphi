import { useState, useEffect, useRef, useCallback } from 'react';
import { authStore } from '@/stores/authStore';

interface JobStatus {
  job_id: string;
  status: string;
  progress: number;
  stage?: string;
  message?: string;
  testimonial_id?: string;
  error?: string;
}

interface UseJobProgressReturn {
  jobStatus: JobStatus | null;
  isConnected: boolean;
  error: string | null;
  startTracking: (jobId: string) => void;
  stopTracking: () => void;
}

export const useJobProgress = (): UseJobProgressReturn => {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const stopTracking = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setError(null);
  }, []);

  const startTracking = useCallback(async (jobId: string) => {
    // Close existing connection
    stopTracking();

    try {
      const token = await authStore.user?.getIdToken();
      if (!token) {
        setError('Authentication required');
        return;
      }
      // Use studio SSE endpoint (sessionID-based, not job_id query param)
      const sseUrl = `${import.meta.env.VITE_API_URL}/studio/sessions/${jobId}/stream`;
      console.log('[useJobProgress] Starting SSE connection:', sseUrl);
      eventSourceRef.current = new EventSource(sseUrl);

      eventSourceRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle compression events
          if (data.type === 'upload_complete') {
            setJobStatus({
              job_id: jobId,
              status: 'processing',
              progress: 0,
              message: data.message || 'Upload complete, optimizing...',
            });
          } else if (data.type === 'compression_progress') {
            setJobStatus({
              job_id: jobId,
              status: 'processing',
              progress: data.data?.progress || 0,
              message: data.message || `Optimizing: ${data.data?.progress}%`,
            });
          } else if (data.type === 'compression_complete') {
            setJobStatus({
              job_id: jobId,
              status: 'processing',
              progress: 100,
              message: data.message || 'Video optimized successfully',
            });
          } else if (data.type === 'compression_error') {
            setJobStatus({
              job_id: jobId,
              status: 'failed',
              progress: 0,
              message: data.message || 'Compression failed',
              error: data.data?.error || 'Compression failed',
            });
          } else if (data.type === 'compression_warning') {
            // Compression skipped but processing continues
            console.warn('Compression skipped:', data.message);
            setJobStatus({
              job_id: jobId,
              status: 'processing',
              progress: 0,
              message: 'Processing video...',
            });
          } else if (data.job_id === jobId) {
            // Regular job status update
            setJobStatus(data);
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err);
          setError('Failed to parse job status update');
        }
      };

      eventSourceRef.current.onerror = (event) => {
        console.error('SSE connection error:', event);
        setIsConnected(false);
        setError('Connection lost. Retrying...');

        // Auto-retry connection after 3 seconds
        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            startTracking(jobId);
          }
        }, 3000);
      };

    } catch (err) {
      console.error('Failed to start SSE connection:', err);
      setError('Failed to start progress tracking');
    }
  }, [stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return stopTracking;
  }, [stopTracking]);

  return {
    jobStatus,
    isConnected,
    error,
    startTracking,
    stopTracking,
  };
};