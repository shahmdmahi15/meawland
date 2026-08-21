import { Category, Role } from "@/generated/prisma/enums";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRoleBadgeVariant(role: Role) {
  switch (role) {
    case Role.OWNER:
      return "default" as const;
    case Role.ADMIN:
      return "secondary" as const;
    case Role.USER:
      return "outline" as const;
    default:
      return "outline" as const;
  }
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  }).format(new Date(date));
}

export function formatCategory(category: Category | string) {
  if (!category) return "";
  return category
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatEnumLabel(value?: string | null): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatSupportChannel(channel?: string | null): string {
  switch (channel) {
    case "WEB_TICKET":
      return "Web Helpdesk Ticket";
    case "WHATSAPP":
      return "WhatsApp Followup";
    case "MESSENGER":
      return "Messenger Followup";
    case "EMAIL":
      return "Email Support";
    case "PHONE":
      return "Phone Call";
    default:
      return formatEnumLabel(channel) || "Channel";
  }
}

export function formatSupportPriority(priority?: string | null): string {
  switch (priority) {
    case "LOW":
      return "Low Priority";
    case "MEDIUM":
      return "Medium Priority";
    case "HIGH":
      return "High Priority";
    case "URGENT":
      return "Urgent Priority";
    default:
      return formatEnumLabel(priority) || "Priority";
  }
}

export function formatSupportStatus(status?: string | null): string {
  switch (status) {
    case "OPEN":
      return "Open";
    case "IN_PROGRESS":
      return "In Progress";
    case "RESOLVED":
      return "Resolved";
    case "CLOSED":
      return "Closed";
    case "REOPENED":
      return "Reopened";
    default:
      return formatEnumLabel(status) || "Status";
  }
}
