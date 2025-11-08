import { useEffect } from "react";
import { appService } from "./services/appService";
import { testimonialSSE } from "./services/testimonialSSE";
import { workspaceHub } from "./repo/workspace_hub";
import { authStore } from "./stores/authStore";
import { reaction } from "mobx";

const App = () => {
  useEffect(() => {
    // Start health check
    appService.startHealthCheck(4 * 60 * 60 * 1000);

    // Connect to testimonial SSE when workspace is loaded and user is authenticated
    const disposeReaction = reaction(
      () => ({
        workspaceId: workspaceHub.workspace?.id,
        userId: authStore.user?.uid,
      }),
      ({ workspaceId, userId }) => {
        if (workspaceId && userId) {
          console.log("[App] Workspace loaded, connecting to testimonial SSE");
          testimonialSSE.connect();
        } else {
          console.log("[App] No workspace or user, disconnecting SSE");
          testimonialSSE.disconnect();
        }
      },
      { fireImmediately: true }
    );

    return () => {
      appService.stopHealthCheck();
      testimonialSSE.disconnect();
      disposeReaction();
    };
  }, []);

  return <></>;
};

export default App;
