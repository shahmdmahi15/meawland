"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  MapPin,
  Headphones,
  Settings,
  LogOut,
  User,
  ShieldUser,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NavbarAccount } from "@/actions/auth/get-navbar-account";
import { logoutAction } from "@/actions/auth/logout";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

const navLinks = [
  { label: "Dashboard", href: "/account", icon: LayoutDashboard },
  { label: "Orders", href: "/account/orders", icon: ShoppingBag },
  { label: "Tracking", href: "/account/tracking", icon: MapPin },
  { label: "Support", href: "/account/support", icon: Headphones },
  { label: "Settings", href: "/account/settings", icon: Settings },
];

interface AccountSidebarProps {
  user: NavbarAccount | null;
  isAdmin: boolean;
}

export function AccountSidebar({ user, isAdmin }: AccountSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const result = await logoutAction();

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.replace("/login");
    } catch (error) {
      console.log("[Component.Admin.Sidebar.Footer] Error: ", { error });
      toast.error("Internal Form Error");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="flex flex-col w-55 min-w-50 shrink-0 py-6 px-3 gap-1">
      {/* User Profile */}
      <div className="flex flex-col items-center gap-2 mb-6 px-2">
        <div className="relative">
          <Avatar
            className="size-18 ring-2 ring-[#56C8D8]/30"
            style={{ width: 80, height: 80 }}
          >
            {user?.avatar ? (
              <AvatarImage src={user.avatar} alt={user?.name || "User"} />
            ) : null}
            <AvatarFallback className="bg-[#e0f7fa] text-[#0097a7] text-lg font-bold">
              {user?.name ? (
                getInitials(user.name)
              ) : (
                <User className="w-6 h-6" />
              )}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-900 text-sm leading-tight">
            {user?.name || "Guest User"}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">{user?.email || ""}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 bg-orange-400/80 ring-orange-600 text-white hover:bg-orange-400"
          >
            <ShieldUser className="w-4 h-4 shrink-0" />
            Admin
          </Link>
        )}
        {navLinks.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-white text-[#56C8D8] ring-1 ring-[#56C8D8]/30 shadow-sm"
                  : "text-gray-600 hover:bg-white/60 hover:text-gray-900",
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isActive ? "text-[#56C8D8]" : "text-gray-400",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="mt-2">
        <button
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all duration-150 w-full"
          onClick={() => setLogoutOpen(true)}
        >
          <LogOut className="w-4 h-4 shrink-0 text-red-500" />
          Sign Out
        </button>
      </div>
      {/* Logout Alert Dialog */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <LogOut />
            </AlertDialogMedia>
            <AlertDialogTitle>Ready to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will end your current session. You can log back in at
              any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleLogout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
