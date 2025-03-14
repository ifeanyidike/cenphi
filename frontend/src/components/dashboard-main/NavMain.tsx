import { ArrowRight, ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { motion } from "framer-motion";
import { useState } from "react";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: { title: string; url: string }[];
  }[];
}) {
  const [activeItem, setActiveItem] = useState<string | null>(
    items.find((item) => item.isActive)?.title || null
  );
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-medium text-sidebar-muted px-3 pt-6 pb-2">
        Platform
      </SidebarGroupLabel>
      <SidebarMenu className="px-0 space-y-1">
        {items.map((item) => {
          const isActive = activeItem === item.title;
          const isHovered = hoveredItem === item.title;

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              onOpenChange={(open) => open && setActiveItem(item.title)}
              className="group/collapsible relative"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={`relative rounded-lg transition-all duration-200
                      ${
                        isActive
                          ? "bg-sidebar-item-active text-sidebar-item-active-foreground hover:!text-white font-medium"
                          : "hover:bg-sidebar-item-hover "
                      }`}
                    onMouseEnter={() => setHoveredItem(item.title)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNavBackground"
                        className="absolute inset-0 bg-gradient-to-br from-sidebar-accent/30 to-sidebar-accent/10 rounded-lg"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                    {item.icon && (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        // text-sidebar-item-active-icon
                        className={`${
                          isActive ? "" : "text-sidebar-item-icon"
                        }`}
                      >
                        <item.icon className="size-5" />
                      </motion.div>
                    )}
                    <span className="truncate">{item.title}</span>
                    <motion.div
                      animate={{ rotate: isActive ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-auto"
                    >
                      <ChevronRight
                        className={`size-4 transition-transform duration-200 ${
                          isActive ? "" : "text-sidebar-item-icon"
                        }`}
                      />
                    </motion.div>
                    {(isActive || isHovered) && (
                      <motion.div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-sidebar-accent rounded-r-full"
                        layoutId="activeNavIndicator"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="animate-in slide-in-from-left-4 duration-200">
                  <SidebarMenuSub className="pl-9 pr-3 mt-1 space-y-1">
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          className="rounded-md py-1.5 px-2 transition-colors duration-150 hover:bg-sidebar-subitem-hover text-sidebar-subitem-foreground/85"
                        >
                          <a
                            href={subItem.url}
                            className="group flex items-center"
                          >
                            <span className="truncate text-sm">
                              {subItem.title}
                            </span>
                            <motion.div
                              initial={{ opacity: 0, x: -5 }}
                              whileHover={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.2 }}
                              className="ml-auto"
                            >
                              <ArrowRight className="size-3.5 text-sidebar-subitem-icon opacity-0 group-hover:opacity-70 transition-opacity duration-200" />
                            </motion.div>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
