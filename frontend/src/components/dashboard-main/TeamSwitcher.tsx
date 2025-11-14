import { useState } from "react";
import { CheckIcon, ChevronsUpDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

type TeamLogo = React.ElementType | string;

interface Team {
  name: string;
  logo: TeamLogo;
  plan: string;
}

export function TeamSwitcher({ teams }: { teams: Team[] }) {
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = useState(teams[0]);
  const [isOpen, setIsOpen] = useState(false);

  // Helper to render logo (either component or image URL or fallback)
  const renderLogo = (team: Team, containerSize: string = "size-20") => {
    // If logo is a string (URL)
    if (typeof team.logo === "string") {
      return (
        <div
          className={`${containerSize} rounded-lg relative flex items-center justify-center p-3`}
        >
          {/* Subtle ring for contrast - barely visible but helps distinguish logo */}
          <div className="absolute inset-0 rounded-lg ring-1 ring-black/5" />
          <img
            src={team.logo}
            alt={`${team.name} logo`}
            className="w-full h-full object-contain relative z-10"
            style={{
              filter: "drop-shadow(0 0 1px rgba(0,0,0,0.1))",
            }}
          />
        </div>
      );
    }

    // If logo is a React component
    if (team.logo) {
      const LogoComponent = team.logo;
      return (
        <div
          className={`${containerSize} rounded-lg relative flex items-center justify-center p-3`}
        >
          {/* Subtle ring for contrast */}
          <div className="absolute inset-0 rounded-lg ring-1 ring-black/5" />
          <div
            className="w-full h-full relative z-10"
            style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.1))" }}
          >
            <LogoComponent className="w-full h-full" />
          </div>
        </div>
      );
    }

    // Fallback: Show first letter of workspace name in a circle
    const initial = team.name?.charAt(0)?.toUpperCase() || "W";
    return (
      <div
        className={`${containerSize} rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold`}
        style={{ fontSize: "1.5rem" }}
      >
        {initial}
      </div>
    );
  };

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
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {renderLogo(activeTeam, "size-16")}
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
                  <motion.div whileHover={{ scale: 1.05 }}>
                    {renderLogo(team, "size-10")}
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
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
