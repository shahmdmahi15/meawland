"use client";

import { useCallback, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GetAllUsersType } from "@/actions/admin/security/users/get-all";
import { formatDate, getInitials, getRoleBadgeVariant } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EditingDialog } from "@/components/admin/security/users/editing-dialog";

export function UsersTable({ users }: { users: GetAllUsersType }) {
  const [search, setSearch] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const handleEditDialogChange = useCallback((open: boolean) => {
    if (!open) setEditingUserId(null);
  }, []);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = normalizedSearch
    ? users.filter((user) =>
        [user.id, user.code, user.name, user.email, user.role].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        ),
      )
    : users;

  return (
    <div>
      <div className="border-b p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by ID, code, name, email or role"
            aria-label="Search users by ID, code, name, email or role"
            className="h-9 pl-9 pr-9"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setSearch("")}
              className="absolute right-1 top-1/2 -translate-y-1/2"
              aria-label="Clear user search"
            >
              <X />
            </Button>
          )}
        </div>
        {search && (
          <p className="mt-2 text-xs text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        )}
      </div>

      <Table>
        {filteredUsers.length === 0 && (
          <TableCaption className="py-8">
            {users.length === 0
              ? "No users found."
              : "No matching users found."}
          </TableCaption>
        )}
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">User</TableHead>
            <TableHead>Id & Code</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Timestamps</TableHead>
            <TableHead className="pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id}>
              {/* User column — Avatar + Name */}
              <TableCell className="pl-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={user.avatar ?? undefined}
                      alt={user.name}
                    />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.name}</span>
                </div>
              </TableCell>

              {/* Code */}
              <TableCell className="flex flex-col gap-2 items-center">
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {user.id}
                </span>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
                  {user.code}
                </code>
              </TableCell>

              {/* Email */}
              <TableCell className="text-muted-foreground">
                {user.email}
              </TableCell>

              {/* Role */}
              <TableCell>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {user.role}
                </Badge>
              </TableCell>

              {/* Created At */}
              <TableCell className="text-muted-foreground flex flex-col gap-2 text-xs">
                <span>Created: {formatDate(user.createdAt)}</span>
                <span>Updated: {formatDate(user.updatedAt)}</span>
              </TableCell>

              {/* Updated At */}
              <TableCell className="pr-4 text-muted-foreground">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditingUserId(user.id)}
                  aria-label={`Edit ${user.name}`}
                  title={`Edit ${user.name}`}
                >
                  <Edit />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingUserId && (
        <EditingDialog
          userId={editingUserId}
          open={Boolean(editingUserId)}
          onOpenChange={handleEditDialogChange}
        />
      )}
    </div>
  );
}
