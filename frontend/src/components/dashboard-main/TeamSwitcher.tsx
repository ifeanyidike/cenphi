import { useState } from "react";
import { CheckIcon, ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { AnimatePresence, motion } from "framer-motion";

export function TeamSwitcher({
  teams,
}: {
  teams: { name: string; logo: React.ElementType; plan: string }[];
}) {
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = useState(teams[0]);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <motion.div whileTap={{ scale: 0.97 }}>
              <SidebarMenuButton
                size="lg"
                className="group transition-all duration-300 hover:bg-sidebar-accent/40 data-[state=open]:bg-sidebar-accent/80 data-[state=open]:text-sidebar-accent-foreground rounded-xl"
              >
                <motion.div
                  className="flex aspect-square size-10 items-center justify-center rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-secondary text-sidebar-primary-foreground shadow-md"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <activeTeam.logo className="size-5" />
                </motion.div>
                <div className="grid flex-1 text-left text-sm leading-tight pl-2">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={activeTeam.name}
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -5, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="truncate font-semibold tracking-tight"
                    >
                      {activeTeam.name}
                    </motion.span>
                  </AnimatePresence>
                  <span className="truncate text-xs text-sidebar-muted">
                    {activeTeam.plan}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="ml-auto"
                >
                  <ChevronsUpDown className="size-4 text-sidebar-icon" />
                </motion.div>
              </SidebarMenuButton>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl border border-dropdown-border/30 bg-dropdown-bg/95 backdrop-blur-lg shadow-2xl"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={8}
          >
            <DropdownMenuLabel className="text-xs font-medium text-dropdown-muted px-3 py-2">
              Select Team
            </DropdownMenuLabel>
            <div className="max-h-80 overflow-y-auto py-1 scrollbar-thin">
              {teams.map((team, index) => (
                <DropdownMenuItem
                  key={team.name}
                  onClick={() => setActiveTeam(team)}
                  className={`gap-3 p-2.5 mx-1 rounded-lg transition-colors duration-150 ${
                    activeTeam.name === team.name
                      ? "bg-dropdown-accent/20"
                      : "hover:bg-dropdown-hover"
                  }`}
                >
                  <motion.div
                    className={`flex size-8 items-center justify-center rounded-lg ${
                      activeTeam.name === team.name
                        ? "bg-gradient-to-br from-dropdown-primary to-dropdown-secondary shadow-md"
                        : "border border-dropdown-border"
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <team.logo
                      className={`size-4 shrink-0 ${
                        activeTeam.name === team.name ? "text-white" : ""
                      }`}
                    />
                  </motion.div>
                  <div className="flex flex-col">
                    <span className="font-medium">{team.name}</span>
                    {team.plan && (
                      <span className="text-xs text-dropdown-muted">
                        {team.plan}
                      </span>
                    )}
                  </div>
                  {activeTeam.name === team.name && (
                    <motion.div
                      className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-dropdown-selected text-dropdown-selected-foreground"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    >
                      <CheckIcon className="size-3" />
                    </motion.div>
                  )}
                  <DropdownMenuShortcut className="text-xs text-dropdown-muted-foreground">
                    ⌘{index + 1}
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem className="gap-3 p-2.5 mx-1 my-1 rounded-lg hover:bg-dropdown-hover group">
              <div className="flex size-8 items-center justify-center rounded-lg border border-dashed border-dropdown-border bg-dropdown-bg group-hover:border-dropdown-primary/50 transition-colors duration-200">
                <Plus className="size-4 text-dropdown-muted group-hover:text-dropdown-primary" />
              </div>
              <div className="font-medium text-dropdown-muted group-hover:text-dropdown-foreground transition-colors duration-200">
                Add team
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
