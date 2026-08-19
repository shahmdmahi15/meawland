"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { generateId } from "@/lib/generate-code";
import { revalidatePath } from "next/cache";
import {
  CreateSupportTicketInput,
  createSupportTicketSchema,
  SupportTicketSummary,
  UserOrderOption,
} from "@/schemas/root/account/support";

/**
 * Creates a new support ticket in the database with a generated unique ticket code.
 */
export async function createSupportTicketAction(
  input: CreateSupportTicketInput,
): Promise<{
  success: boolean;
  message?: string;
  ticketCode?: string;
}> {
  try {
    const sessionUser = await getMeAction();
    if (!sessionUser) {
      return {
        success: false,
        message: "Please sign in to submit a support ticket.",
      };
    }

    const parsed = createSupportTicketSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message:
          parsed.error.issues[0]?.message || "Invalid support ticket data.",
      };
    }

    const { subject, category, message, priority, channel, orderId } =
      parsed.data;

    let validOrderId: string | null = null;
    if (orderId && orderId !== "none") {
      const order = await db.order.findFirst({
        where: {
          id: orderId,
          userId: sessionUser.id,
        },
        select: { id: true },
      });
      if (order) {
        validOrderId = order.id;
      }
    }

    // Generate unique code e.g. "MEAWTKT00001" using the database counter
    const ticketCode = await generateId("TICKET");

    await db.supportTicket.create({
      data: {
        code: ticketCode,
        subject,
        category,
        message,
        priority,
        channel,
        userId: sessionUser.id,
        orderId: validOrderId,
      },
    });

    revalidatePath("/account/support");

    return {
      success: true,
      message: `Support ticket #${ticketCode} submitted successfully! Our team will get back to you shortly.`,
      ticketCode,
    };
  } catch (error) {
    console.error("[Action.Customer.Support.CreateTicket] Error:", error);
    return {
      success: false,
      message: "Failed to submit support ticket. Please try again.",
    };
  }
}

/**
 * Retrieves the customer's previous support tickets.
 */
export async function getUserSupportTicketsAction(): Promise<{
  success: boolean;
  tickets?: SupportTicketSummary[];
}> {
  try {
    const sessionUser = await getMeAction();
    if (!sessionUser) {
      return { success: false, tickets: [] };
    }

    const rawTickets = await db.supportTicket.findMany({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            id: true,
            code: true,
            finalCost: true,
            status: true,
          },
        },
      },
    });

    const tickets: SupportTicketSummary[] = rawTickets.map((t) => ({
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
      order: t.order
        ? {
            id: t.order.id,
            code: t.order.code,
            finalCost: t.order.finalCost,
            status: t.order.status,
          }
        : null,
    }));

    return {
      success: true,
      tickets,
    };
  } catch (error) {
    console.error("[Action.Customer.Support.GetTickets] Error:", error);
    return { success: false, tickets: [] };
  }
}

/**
 * Retrieves customer orders to populate the ticket creation order dropdown.
 */
export async function getUserOrdersForSupportAction(): Promise<{
  success: boolean;
  orders?: UserOrderOption[];
}> {
  try {
    const sessionUser = await getMeAction();
    if (!sessionUser) {
      return { success: false, orders: [] };
    }

    const orders = await db.order.findMany({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        code: true,
        createdAt: true,
        finalCost: true,
        status: true,
      },
    });

    return {
      success: true,
      orders,
    };
  } catch (error) {
    console.error("[Action.Customer.Support.GetOrders] Error:", error);
    return { success: false, orders: [] };
  }
}
