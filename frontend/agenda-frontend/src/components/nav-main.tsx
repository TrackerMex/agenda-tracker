import { Link } from '@tanstack/react-router';
import { PlusCircleIcon, type LucideIcon } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function NavMain({
  items,
  showCreate = true,
}: {
  items: {
    title: string;
    to: string;
    icon?: LucideIcon;
  }[];
  showCreate?: boolean;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {showCreate && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Crear capacitacion"
                className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                <Link to="/capacitaciones/crear">
                  <PlusCircleIcon />
                  <span>Nueva capacitacion</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link
                  to={item.to}
                  activeProps={{
                    className: 'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                  }}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
