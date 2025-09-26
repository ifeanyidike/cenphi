import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowLeft, MoreHorizontal } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";

interface BreadcrumbNavProps {
  showBackButton?: boolean;
  showHomeButton?: boolean;
  maxVisibleItems?: number;
  className?: string;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  showBackButton = true,
  showHomeButton = true,
  maxVisibleItems = 4,
  className = "",
}) => {
  const navigate = useNavigate();
  const { breadcrumbs, currentPage, isOnDashboard } = useBreadcrumb();

  const handleBack = () => {
    window.history.back();
  };

  const handleNavigate = (href: string) => {
    navigate(href);
  };

  // Handle breadcrumb overflow for mobile/small screens
  const shouldCollapse = breadcrumbs.length > maxVisibleItems;
  const visibleBreadcrumbs = shouldCollapse
    ? [
        breadcrumbs[0], // Always show home/dashboard
        ...breadcrumbs.slice(-(maxVisibleItems - 1)), // Show last few items
      ]
    : breadcrumbs;

  const hiddenBreadcrumbs = shouldCollapse
    ? breadcrumbs.slice(1, -(maxVisibleItems - 1))
    : [];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <AnimatePresence>
        {/* Back Button */}
        {showBackButton && !isOnDashboard && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-8 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Go back</span>
            </Button>
          </motion.div>
        )}

        {/* Home/Dashboard Quick Access */}
        {showHomeButton && !isOnDashboard && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigate("/dashboard")}
              className="h-8 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="sr-only">Go to dashboard</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumb Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex-1"
      >
        <Breadcrumb>
          <BreadcrumbList>
            {visibleBreadcrumbs.map((item, index) => {
              const isLast = index === visibleBreadcrumbs.length - 1;
              const isFirst = index === 0;

              return (
                <React.Fragment key={item.href}>
                  {/* Show collapsed indicator after first item if there are hidden items */}
                  {isFirst &&
                    shouldCollapse &&
                    hiddenBreadcrumbs.length > 0 && (
                      <>
                        <BreadcrumbItem>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1 hover:text-foreground transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">
                                Show more breadcrumbs
                              </span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {hiddenBreadcrumbs.map((hiddenItem) => (
                                <DropdownMenuItem
                                  key={hiddenItem.href}
                                  onClick={() =>
                                    handleNavigate(hiddenItem.href)
                                  }
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    {hiddenItem.icon && (
                                      <hiddenItem.icon className="h-4 w-4" />
                                    )}
                                    {hiddenItem.label}
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block">
                          <ChevronRight className="h-4 w-4" />
                        </BreadcrumbSeparator>
                      </>
                    )}

                  <BreadcrumbItem className={isLast ? "" : "hidden md:block"}>
                    {isLast ? (
                      <BreadcrumbPage className="flex items-center gap-2 font-medium">
                        {item.icon && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2, delay: 0.3 }}
                          >
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                          </motion.div>
                        )}
                        <span className="truncate max-w-[150px] sm:max-w-none">
                          {item.label}
                        </span>
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        onClick={() => handleNavigate(item.href)}
                        className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer max-w-[100px] sm:max-w-none truncate"
                      >
                        {item.icon && (
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="truncate">{item.label}</span>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>

                  {!isLast && (
                    <BreadcrumbSeparator className="hidden md:block">
                      <ChevronRight className="h-4 w-4" />
                    </BreadcrumbSeparator>
                  )}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>

      {/* Current Page Info for Mobile */}
      <div className="flex md:hidden items-center text-sm text-muted-foreground">
        <span className="truncate max-w-[120px]">{currentPage}</span>
      </div>
    </div>
  );
};
