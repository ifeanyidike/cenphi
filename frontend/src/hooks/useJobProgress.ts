import { useState, useEffect, useRef, useCallback } from 'react';
import { authStore } from '@/stores/authStore';
import { connectSSE } from './sse/connection';

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
  const stopRef = useRef<(() => void) | null>(null);

  const stopTracking = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setIsConnected(false);
    setError(null);
  }, []);

  const startTracking = useCallback((jobId: string) => {
    stopTracking();
    setJobStatus(null);
    if (!jobId) return;
    stopRef.current = connectSSE(async () => {
      const token = await authStore.user?.getIdToken();
      if (!token) throw new Error("Authentication required");
      return `${import.meta.env.VITE_API_URL}/studio/sessions/${encodeURIComponent(jobId)}/stream?token=${encodeURIComponent(token)}`;
    }, {
      onOpen: () => { setIsConnected(true); setError(null); },
      onError: (message) => { setIsConnected(false); setError(message); },
      onMessage: (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!data || (data.session_id && data.session_id !== jobId)) return;

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
      },
    });
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