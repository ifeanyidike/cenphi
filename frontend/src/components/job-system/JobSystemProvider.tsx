// components/job-system/JobSystemProvider.tsx
import { useState, useEffect, FC, ReactNode } from "react";
import { observer } from "mobx-react-lite";
import GlobalJobStatusIndicator from "./GlobalJobStatusIndicator";
import NotificationCenter, { useNotifications } from "./NotificationCenter";
import StreamingJobModal from "./StreamingJobModal";
import { ProcessingJob } from "@/types/ai-service";
import { runInAction } from "mobx";

const JobSystemProvider: FC<{ children: ReactNode }> = observer(
  ({ children }) => {
    const notifications = useNotifications();
    const [streamingJob, setStreamingJob] = useState<ProcessingJob | null>(
      null
    );
    const [isInitialized, setIsInitialized] = useState(false);
    const [aiStudioManager, setAiStudioManager] = useState<any>(null);

    useEffect(() => {
      // Delay initialization to avoid circular dependency
      const initializeServices = async () => {
        try {
          // Dynamic import to break circular dependency
          const { aiStudioManager: manager } = await import(
            "@/repo/managers/ai_studio_manager"
          );

          // Wait a tick to ensure everything is initialized
          setTimeout(() => {
            // Use runInAction for MobX operations
            runInAction(() => {
              if (
                manager &&
                manager.jobsManager &&
                manager.jobsManager.setNotificationHandler
              ) {
                setAiStudioManager(manager);
                manager.jobsManager.setNotificationHandler(notifications);
                setIsInitialized(true);
                console.log(
                  "JobSystemProvider initialized with",
                  manager.jobs.length,
                  "jobs"
                );
              }
            });
          }, 100);
        } catch (error) {
          console.error("Failed to initialize job system:", error);
          setIsInitialized(true);
        }
      };

      initializeServices();
    }, [notifications]);

    useEffect(() => {
      if (!isInitialized || !aiStudioManager) return;

      const checkForStreamingJobs = () => {
        try {
          runInAction(() => {
            const newStreamingJob = aiStudioManager.jobs?.find(
              (job: ProcessingJob) =>
                job.status === "streaming" &&
                (job.service === "content_generation" ||
                  job.service === "text_polishing" ||
                  job.service === "translation") &&
                !job.metadata?.modalShown &&
                // Also check if this is a very recent job (within last 5 seconds) to catch immediate streaming
                Date.now() - new Date(job.startTime).getTime() < 5000
            );

            if (
              newStreamingJob &&
              (!streamingJob || streamingJob.id !== newStreamingJob.id)
            ) {
              setStreamingJob(newStreamingJob);
              newStreamingJob.metadata = {
                ...newStreamingJob.metadata,
                modalShown: true,
              };
            }

            // Close modal if streaming job is no longer active or completed
            if (streamingJob) {
              //   const currentJob = aiStudioManager.jobs?.find(
              //     (j: ProcessingJob) => j.id === streamingJob.id
              //   );
              //   if (
              //     !currentJob ||
              //     currentJob.status === "completed" ||
              //     currentJob.status === "failed"
              //   ) {
              //     setStreamingJob(null);
              //   }
            }
          });
        } catch (error) {
          console.error("Error checking streaming jobs:", error);
        }
      };

      const interval = setInterval(checkForStreamingJobs, 500); // Check more frequently
      return () => clearInterval(interval);
    }, [isInitialized, aiStudioManager, streamingJob]);
    console.log("aiStudioManager.jobs", aiStudioManager?.jobs);
    return (
      <>
        {children}

        {isInitialized && aiStudioManager && (
          <>
            <GlobalJobStatusIndicator jobs={aiStudioManager.jobs || []} />
            {/* <GlobalJobStatusIndicator jobs={[mockJob]} /> */}

            <NotificationCenter
              notifications={notifications.notifications}
              onDismiss={notifications.dismissNotification}
              onDismissAll={notifications.dismissAll}
            />

            {streamingJob && (
              <StreamingJobModal
                isOpen={true}
                job={streamingJob}
                streamingResult={
                  aiStudioManager.streamingResults?.[streamingJob.id]
                }
                onClose={() => setStreamingJob(null)}
                onSave={async (content) => {
                  try {
                    await aiStudioManager.saveArtifact(
                      streamingJob,
                      content,
                      true
                    );
                  } catch (error) {
                    console.error("Failed to save streaming content:", error);
                  }
                }}
                onNavigateToResult={() => {
                  try {
                    const path =
                      aiStudioManager.jobsManager?.getJobNavigationPath(
                        streamingJob
                      );
                    if (path) {
                      window.location.href = path;
                    }
                  } catch (error) {
                    console.error("Failed to navigate to result:", error);
                  }
                }}
              />
            )}
          </>
        )}
      </>
    );
  }
);

export default JobSystemProvider;
