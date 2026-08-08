import { getAllUsers } from "@/actions/admin/security/users/get-all";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Role } from "@/generated/prisma/enums";
import { ShieldAlert, Users } from "lucide-react";
import { UsersTable } from "@/components/admin/security/users/users-table";

export default async function UsersPage() {
  const res = await getAllUsers();

  if (!res?.success) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {res?.message ?? "You are not authorized to view this page."}
          </p>
        </div>
      </div>
    );
  }

  const users = res.users ?? [];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage all registered users and their roles.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-2xl">{users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Admins</CardDescription>
            <CardTitle className="text-2xl">
              {users.filter((u) => u.role === Role.ADMIN).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Owners</CardDescription>
            <CardTitle className="text-2xl">
              {users.filter((u) => u.role === Role.OWNER).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            A complete list of all users in the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <UsersTable users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
