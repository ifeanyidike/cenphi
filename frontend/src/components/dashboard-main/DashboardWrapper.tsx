import { AppSidebar } from "@/components/dashboard-main/AppSidebar";
import { motion } from "framer-motion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
// import SidebarContent from "./sidebar-content";

import { observer } from "mobx-react-lite";
import { PropsWithChildren } from "react";
import { containerVariants } from "../dashboard-landing/constants";
import { useLocation } from "react-router-dom";

interface DashboardWrapperProps extends PropsWithChildren {
  title?: string;
}

export const DashboardWrapper = observer(({ children, title }: DashboardWrapperProps) => {
  const location = useLocation();
  
  // Determine the page title based on the current route
  const getPageTitle = () => {
    if (title) return title;
    
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/settings':
        return 'Settings';
      case '/google-drive':
        return 'Google Drive';
      default:
        return 'Dashboard';
    }
  };
  return (
    <SidebarProvider className="flex w-screen">
      <AppSidebar />
      <SidebarInset className="flex-1">
        <header className="flex h-16 shrink-0 items-center transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center justify-between w-full px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{getPageTitle()}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8 bg-white/50 bg-grid-pattern min-h-screen">
          <motion.div
            initial="hidden"
            animate="show"
            variants={containerVariants}
            className="max-w-screen-xl mx-auto"
          >
            {children}
          </motion.div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
});
