// components/job-system/JobSystemProvider.tsx
import { FC, ReactNode } from "react";
import { observer } from "mobx-react-lite";
import NotificationCenter, { useNotifications } from "./NotificationCenter";

/**
 * JobSystemProvider - Simplified provider for notifications only
 * The new studio system uses SSE directly for job tracking,
 * so this component now only handles notifications.
 */
const JobSystemProvider: FC<{ children: ReactNode }> = observer(
  ({ children }) => {
    const notifications = useNotifications();

    return (
      <>
        {children}

        <NotificationCenter
          notifications={notifications.notifications}
          onDismiss={notifications.dismissNotification}
          onDismissAll={notifications.dismissAll}
        />
      </>
    );
  }
);

export default JobSystemProvider;
