import * as React from 'react';
import {
  CalendarDaysIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  PlusCircleIcon,
  UsersIcon,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/store/authStore';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthStore((state) => state.user);
  const isJefe = useAuthStore((state) => state.esJefe());
  const isAdmin = useAuthStore((state) => state.esAdmin());
  const canManageArea = isJefe || isAdmin;

  const navMain = [
    {
      title: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboardIcon,
    },
    {
      title: 'Capacitaciones',
      to: '/capacitaciones',
      icon: CalendarDaysIcon,
    },
    ...(canManageArea
      ? [
          {
            title: 'Crear capacitacion',
            to: '/capacitaciones/crear',
            icon: PlusCircleIcon,
          },
          {
            title: 'Mi area',
            to: '/dashboard/area',
            icon: UsersIcon,
          },
        ]
      : []),
  ];

  const navSecondary = [
    {
      title: 'Reportes',
      to: '/dashboard',
      icon: ClipboardListIcon,
    },
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <CalendarDaysIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Agenda Tracker</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} showCreate={canManageArea} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <NavUser
            user={{
              name: `${user.nombre} ${user.apellido}`,
              email: user.email,
              avatar: '',
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
