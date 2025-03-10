import { useState } from "react";
import { AppSidebar } from "@/components/custom/app-sidebar";

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
import SideBarContent2 from "@/components/custom/SideBarContent2"
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyDashboard from "@/components/custom/emptydashboardpage";

const FullscreenIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 3h6v2H5v4H3V3zm18 0h-6v2h4v4h2V3zM3 21h6v-2H5v-4H3v6zm18 0h-6v-2h4v-4h2v6z"
      fill="currentColor"
    />
  </svg>
);

const FullscreenExitIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 12h6v-2H5V6H3v6zm18 0h-6v-2h4V6h2v6zM3 18h6v2H5v4H3v-6zm18 0h-6v2h4v4h2v-6z"
      fill="currentColor"
    />
  </svg>
);

export default function DashboardWrapper() {
  const [hasUser, setHasUser] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleDashboard = () => {
    setHasUser((prev) => !prev);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
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
                    <BreadcrumbLink href="#">
                      Building Your Application
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </button>
          </div>
        </header>
        {/* <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <SidebarContent />
        </div>
        */}
        <div>
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              {!hasUser && <ArrowLeft className="h-4 w-4" />}
              <h2 className="text-lg font-semibold">
                {hasUser ? "" : "No Reviews"}
              </h2>
            </div>
            <Button variant="outline" onClick={toggleDashboard}>
              {hasUser ? "Reviews" : "Dashboard"}
            </Button>
          </div>

          {hasUser ? <SideBarContent2 /> : <EmptyDashboard />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
