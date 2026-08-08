import { Sidebar, SidebarRail } from "@/components/ui/sidebar";
import { AdminSidebarHeader } from "./sidebar-header";
import { AdminSidebarContent } from "./sidebar-content";
import { AdminSidebarFooter } from "./sidebar-footer";
import { NavbarAccount } from "@/actions/auth/get-navbar-account";

export function AdminSidebar({ user }: { user: NavbarAccount }) {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <AdminSidebarHeader />
      <AdminSidebarContent user={user} />
      <AdminSidebarFooter user={user} />
      <SidebarRail />
    </Sidebar>
  );
}
