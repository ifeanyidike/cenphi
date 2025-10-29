import { AppSidebar } from "@/components/dashboard-main/AppSidebar";
import { motion } from "framer-motion";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { BreadcrumbNav } from "./BreadCrumbNav";
import { GlobalProcessingMonitor } from "@/components/common/GlobalProcessingMonitor";

import { observer } from "mobx-react-lite";
import { PropsWithChildren } from "react";
import { containerVariants } from "../dashboard-landing/constants";

export const DashboardWrapper = observer(({ children }: PropsWithChildren) => {
  return (
    <SidebarProvider className="flex w-screen bg-white">
      <AppSidebar />
      <SidebarInset className="flex-1 bg-white">
        <header className="flex h-16 shrink-0 items-center transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between w-full px-3 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <SidebarTrigger className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" />

              {/* Dynamic Breadcrumb Navigation */}
              <BreadcrumbNav
                showBackButton={true}
                showHomeButton={true}
                maxVisibleItems={2}
                className="flex-1 min-w-0"
              />
            </div>

            {/* Additional header actions can go here */}
            <div className="flex items-center gap-2">
              {/* Future: notifications, user menu, etc. */}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 bg-white min-h-screen">
          <motion.div
            initial="hidden"
            animate="show"
            variants={containerVariants}
            className="max-w-screen-xl mx-auto"
          >
            {children}
          </motion.div>
        </div>

        {/* Global Processing Monitor - Fixed position in bottom-right */}
        <GlobalProcessingMonitor />
      </SidebarInset>
    </SidebarProvider>
  );
});
