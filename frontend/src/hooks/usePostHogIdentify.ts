import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { auth } from "@/config/firebase";
import { workspaceHub } from "@/repo/workspace_hub";
import { reaction } from "mobx";

/**
 * Hook to identify users in PostHog with their account details
 * Automatically tracks logged-in users with their profile and workspace info
 */
export function usePostHogIdentify() {
  const posthog = usePostHog();

  useEffect(() => {
    // Track auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && posthog) {
        // Identify the user with their Firebase UID
        const userProps = {
          email: user.email,
          name: user.displayName,
          avatar: user.photoURL,
          email_verified: user.emailVerified,
          created_at: user.metadata.creationTime,
          last_sign_in: user.metadata.lastSignInTime,
          provider: user.providerData[0]?.providerId,
        };

        // Add workspace info if available
        if (workspaceHub.workspace?.id) {
          Object.assign(userProps, {
            workspace_id: workspaceHub.workspace.id,
            workspace_name: workspaceHub.workspace.name,
            workspace_plan: workspaceHub.workspace.plan,
          });
        }

        posthog.identify(user.uid, userProps);

        // Set user properties for better segmentation
        posthog.setPersonProperties({
          email: user.email,
          name: user.displayName,
          workspace_plan: workspaceHub.workspace?.plan,
        });

        // Group by workspace if available
        if (workspaceHub.workspace?.id) {
          posthog.group("workspace", workspaceHub.workspace.id, {
            name: workspaceHub.workspace.name,
            plan: workspaceHub.workspace.plan,
            created_at: workspaceHub.workspace.created_at,
          });
        }
      } else if (posthog) {
        // User logged out - reset identity
        posthog.reset();
      }
    });

    // React to workspace changes
    const disposeWorkspaceReaction = reaction(
      () => ({
        workspaceId: workspaceHub.workspace?.id,
        workspaceName: workspaceHub.workspace?.name,
        workspacePlan: workspaceHub.workspace?.plan,
      }),
      ({ workspaceId, workspaceName, workspacePlan }) => {
        const currentUser = auth.currentUser;
        if (currentUser && posthog && workspaceId) {
          // Update user properties with workspace info
          posthog.setPersonProperties({
            workspace_id: workspaceId,
            workspace_name: workspaceName,
            workspace_plan: workspacePlan,
          });

          // Update workspace group
          posthog.group("workspace", workspaceId, {
            name: workspaceName,
            plan: workspacePlan,
            created_at: workspaceHub.workspace?.created_at,
          });
        }
      }
    );

    return () => {
      unsubscribe();
      disposeWorkspaceReaction();
    };
  }, [posthog]);
}
