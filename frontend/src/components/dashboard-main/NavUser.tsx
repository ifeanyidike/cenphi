import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { motion } from "framer-motion";

export function NavUser({
  user,
}: {
  user: { name: string; email: string; avatar: string };
}) {
  const { isMobile } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SidebarMenu className="px-2 py-3">
      <SidebarMenuItem>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <motion.div whileTap={{ scale: 0.97 }}>
              <SidebarMenuButton
                size="lg"
                className="group transition-all duration-300 hover:bg-sidebar-user-hover/30 data-[state=open]:bg-sidebar-user-active/50 rounded-xl"
              >
                <motion.div className="relative" whileHover={{ scale: 1.05 }}>
                  <Avatar className="h-10 w-10 rounded-xl border-2 border-sidebar-user-border shadow-md overflow-hidden">
                    <AvatarImage
                      src={user.avatar}
                      alt={user.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-sidebar-user-fallback-from to-sidebar-user-fallback-to text-sidebar-user-fallback-text font-medium">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-sidebar-bg" />
                </motion.div>
                <div className="grid flex-1 text-left text-sm leading-tight pl-2">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-sidebar-muted">
                    {user.email}
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
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 p-3 text-left">
                <div className="relative">
                  <Avatar className="h-12 w-12 rounded-xl border-2 border-dropdown-user-border shadow-md overflow-hidden">
                    <AvatarImage
                      src={user.avatar}
                      alt={user.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-dropdown-user-fallback-from to-dropdown-user-fallback-to text-dropdown-user-fallback-text font-medium">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-dropdown-bg" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="font-semibold text-base">{user.name}</span>
                  <span className="text-sm text-dropdown-muted">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="group flex gap-2 rounded-lg m-1 p-2.5 hover:bg-dropdown-primary/10 transition-colors duration-150">
                <div className="flex items-center justify-center size-8 rounded-lg bg-dropdown-primary/10 text-dropdown-primary">
                  <Sparkles className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">Upgrade to Pro</span>
                  <span className="text-xs text-dropdown-muted">
                    Unlock premium features
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="flex gap-2 rounded-lg m-1 p-2.5 hover:bg-dropdown-hover transition-colors duration-150">
                <BadgeCheck className="size-4 text-dropdown-icon" />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex gap-2 rounded-lg m-1 p-2.5 hover:bg-dropdown-hover transition-colors duration-150">
                <CreditCard className="size-4 text-dropdown-icon" />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex gap-2 rounded-lg m-1 p-2.5 hover:bg-dropdown-hover transition-colors duration-150">
                <Bell className="size-4 text-dropdown-icon" />
                <span>Notifications</span>
                <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-dropdown-badge text-dropdown-badge-foreground text-xs font-medium">
                  3
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem className="flex gap-2 rounded-lg m-1 p-2.5 hover:bg-dropdown-hover transition-colors duration-150">
              <LogOut className="size-4 text-dropdown-icon" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
