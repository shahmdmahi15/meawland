"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import {
  Role,
  SupportTicketStatus,
  SupportTicketPriority,
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import { recordAuditLog } from "@/lib/audit-logger";
import { generateId } from "@/lib/generate-code";
import { getImageBase64 } from "@/lib/storage";
import { revalidatePath } from "next/cache";
import {
  AdminSupportTicket,
  AdminTicketStats,
  AdminCreateTicketInput,
  adminCreateTicketSchema,
  adminUpdateTicketStatusSchema,
  adminUpdateTicketPrioritySchema,
} from "@/schemas/admin/support-marketing/support/tickets";

async function safeGetImageBase64(
  key: string | null | undefined,
): Promise<string> {
  if (!key) return "";
  if (
    key.startsWith("data:") ||
    key.startsWith("http://") ||
    key.startsWith("https://") ||
    key.startsWith("/")
  ) {
    return key;
  }
  try {
    return await getImageBase64(key);
  } catch (error) {
    console.error(`[Storage.GetBase64] Failed for key "${key}":`, error);
    return "";
  }
}

/**
 * Fetch all support tickets for admin management.
 */
export async function getAdminSupportTicketsAction(): Promise<{
  success: boolean;
  message?: string;
  tickets?: AdminSupportTicket[];
  stats?: AdminTicketStats;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized access." };
    }

    const rawTickets = await db.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            code: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            district: true,
          },
        },
        order: {
          select: {
            id: true,
            code: true,
            status: true,
            finalCost: true,
            totalQuantity: true,
            createdAt: true,
          },
        },
      },
    });

    const tickets: AdminSupportTicket[] = await Promise.all(
      rawTickets.map(async (t) => {
        const resolvedAvatar = await safeGetImageBase64(t.user.avatar);
        return {
          id: t.id,
          code: t.code,
          subject: t.subject,
          message: t.message,
          category: t.category,
          status: t.status,
          priority: t.priority,
          channel: t.channel,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          user: {
            id: t.user.id,
            code: t.user.code,
            name: t.user.name,
            email: t.user.email,
            phone: t.user.phone,
            avatar: resolvedAvatar || null,
            district: t.user.district,
          },
          order: t.order
            ? {
                id: t.order.id,
                code: t.order.code,
                status: t.order.status,
                finalCost: t.order.finalCost,
                totalQuantity: t.order.totalQuantity,
                createdAt: t.order.createdAt,
              }
            : null,
        };
      }),
    );

    let openTickets = 0;
    let inProgressTickets = 0;
    let resolvedTickets = 0;
    let urgentTickets = 0;

    for (const t of tickets) {
      if (t.status === SupportTicketStatus.OPEN) openTickets++;
      if (t.status === SupportTicketStatus.IN_PROGRESS) inProgressTickets++;
      if (t.status === SupportTicketStatus.RESOLVED) resolvedTickets++;
      if (t.priority === SupportTicketPriority.URGENT) urgentTickets++;
    }

    const stats: AdminTicketStats = {
      totalTickets: tickets.length,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      urgentTickets,
    };

    return {
      success: true,
      tickets,
      stats,
    };
  } catch (error) {
    console.error("[Action.Admin.Support.Tickets.Get] Error:", error);
    return { success: false, message: "Failed to load support tickets." };
  }
}

/**
 * Update support ticket status.
 */
export async function adminUpdateTicketStatusAction(
  ticketId: string,
  status: SupportTicketStatus,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const parsed = adminUpdateTicketStatusSchema.safeParse({
      ticketId,
      status,
    });
    if (!parsed.success) {
      return { success: false, message: "Invalid status data." };
    }

    await db.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    });

    revalidatePath("/admin/support-marketing/support/tickets");
    revalidatePath("/account/support");

    await recordAuditLog({
      action: AuditAction.STATUS_CHANGE,
      entity: AuditEntity.SUPPORT_TICKET,
      entityId: ticketId,
      summary: `Support Ticket status changed to ${status}`,
      severity: AuditSeverity.INFO,
      newState: { status },
      userId: session.id,
      path: "/admin/support-marketing/support/tickets",
    });

    return {
      success: true,
      message: `Ticket status updated to ${status}.`,
    };
  } catch (error) {
    console.error("[Action.Admin.Support.UpdateStatus] Error:", error);
    return { success: false, message: "Failed to update ticket status." };
  }
}

/**
 * Update support ticket priority.
 */
export async function adminUpdateTicketPriorityAction(
  ticketId: string,
  priority: SupportTicketPriority,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const parsed = adminUpdateTicketPrioritySchema.safeParse({
      ticketId,
      priority,
    });
    if (!parsed.success) {
      return { success: false, message: "Invalid priority data." };
    }

    await db.supportTicket.update({
      where: { id: ticketId },
      data: { priority },
    });

    revalidatePath("/admin/support-marketing/support/tickets");
    revalidatePath("/account/support");

    return {
      success: true,
      message: `Ticket priority updated to ${priority}.`,
    };
  } catch (error) {
    console.error("[Action.Admin.Support.UpdatePriority] Error:", error);
    return { success: false, message: "Failed to update ticket priority." };
  }
}

/**
 * Create support ticket on behalf of a customer.
 */
export async function adminCreateSupportTicketAction(
  input: AdminCreateTicketInput,
): Promise<{
  success: boolean;
  message: string;
  ticketCode?: string;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const parsed = adminCreateTicketSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid ticket data.",
      };
    }

    const { userId, subject, category, message, priority, channel, orderId } =
      parsed.data;

    const ticketCode = await generateId("TICKET");

    await db.supportTicket.create({
      data: {
        code: ticketCode,
        userId,
        subject,
        category,
        message,
        priority,
        channel,
        orderId: orderId && orderId !== "none" ? orderId : null,
      },
    });

    revalidatePath("/admin/support-marketing/support/tickets");
    revalidatePath("/account/support");

    await recordAuditLog({
      action: AuditAction.CREATE,
      entity: AuditEntity.SUPPORT_TICKET,
      entityName: `#${ticketCode}`,
      summary: `Support Ticket #${ticketCode} created for user (${subject})`,
      severity: AuditSeverity.INFO,
      newState: { code: ticketCode, userId, subject, priority, channel },
      userId: session.id,
      path: "/admin/support-marketing/support/tickets",
    });

    return {
      success: true,
      message: `Support ticket #${ticketCode} created successfully!`,
      ticketCode,
    };
  } catch (error) {
    console.error("[Action.Admin.Support.CreateTicket] Error:", error);
    return { success: false, message: "Failed to create support ticket." };
  }
}

/**
 * Delete support ticket.
 */
export async function adminDeleteSupportTicketAction(
  ticketId: string,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    await db.supportTicket.delete({
      where: { id: ticketId },
    });

    revalidatePath("/admin/support-marketing/support/tickets");
    revalidatePath("/account/support");

    await recordAuditLog({
      action: AuditAction.DELETE,
      entity: AuditEntity.SUPPORT_TICKET,
      entityId: ticketId,
      summary: `Support Ticket was permanently deleted`,
      severity: AuditSeverity.WARNING,
      userId: session.id,
      path: "/admin/support-marketing/support/tickets",
    });

    return {
      success: true,
      message: "Support ticket deleted successfully.",
    };
  } catch (error) {
    console.error("[Action.Admin.Support.DeleteTicket] Error:", error);
    return { success: false, message: "Failed to delete support ticket." };
  }
}
