import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { motion } from "framer-motion";

export function NavProjects({
  projects,
}: {
  projects: { name: string; url: string; icon: LucideIcon }[];
}) {
  const { isMobile } = useSidebar();
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden mt-1">
      <SidebarGroupLabel className="text-xs font-medium text-sidebar-muted px-3 pt-6 pb-2">
        Projects
      </SidebarGroupLabel>
      <SidebarMenu className="px-2 space-y-1">
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              className="rounded-lg transition-all duration-200 hover:bg-sidebar-item-hover group relative"
              onMouseEnter={() => setHoveredProject(item.name)}
              onMouseLeave={() => setHoveredProject(null)}
            >
              <a href={item.url}>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="text-sidebar-project-icon"
                >
                  <item.icon className="size-5" />
                </motion.div>
                <span className="truncate">{item.name}</span>
                {hoveredProject === item.name && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-sidebar-project-accent rounded-r-full"
                    layoutId="hoveredProjectIndicator"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="rounded-full hover:bg-sidebar-action-hover transition-colors duration-150"
                >
                  <MoreHorizontal className="size-4 text-sidebar-action-icon" />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-xl border border-dropdown-border/30 bg-dropdown-bg/95 backdrop-blur-lg shadow-2xl"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
                sideOffset={8}
              >
                <DropdownMenuItem className="group flex gap-2 rounded-lg m-1 p-2.5 hover:bg-dropdown-hover transition-colors duration-150">
                  <Folder className="size-4 text-dropdown-icon group-hover:text-dropdown-icon-hover transition-colors duration-150" />
                  <span>View Project</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="group flex gap-2 rounded-lg m-1 p-2.5 hover:bg-dropdown-hover transition-colors duration-150">
                  <Forward className="size-4 text-dropdown-icon group-hover:text-dropdown-icon-hover transition-colors duration-150" />
                  <span>Share Project</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem className="group flex gap-2 rounded-lg m-1 p-2.5 hover:bg-dropdown-danger/10 text-dropdown-danger transition-colors duration-150">
                  <Trash2 className="size-4 text-dropdown-danger group-hover:text-dropdown-danger transition-colors duration-150" />
                  <span>Delete Project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-item-hover/50 transition-all duration-200 group">
            <div className="flex items-center justify-center p-0.5">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="text-sidebar-action-icon group-hover:text-sidebar-action-icon-hover transition-colors duration-200"
              >
                <MoreHorizontal className="size-5" />
              </motion.div>
            </div>
            <span className="truncate group-hover:text-sidebar-foreground transition-colors duration-200">
              More
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
