"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import {
  Role,
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import { recordAuditLog } from "@/lib/audit-logger";
import { getImageBase64 } from "@/lib/storage";
import { revalidatePath } from "next/cache";
import {
  AdminCustomerSummary,
  AdminCustomerDetails,
  AdminCustomerStats,
  AdminUpdateCustomerInput,
  adminUpdateCustomerSchema,
} from "@/schemas/admin/support-marketing/support/customers";

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
 * Fetch all customers with lifetime stats and order summaries.
 */
export async function getAdminCustomersAction(): Promise<{
  success: boolean;
  message?: string;
  customers?: AdminCustomerSummary[];
  stats?: AdminCustomerStats;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized access." };
    }

    const rawUsers = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          select: {
            id: true,
            finalCost: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        supportTickets: {
          select: { id: true },
        },
      },
    });

    let activeBuyersCount = 0;
    let totalRevenueSum = 0;
    let totalInquiriesCount = 0;

    const customers: AdminCustomerSummary[] = await Promise.all(
      rawUsers.map(async (u) => {
        const resolvedAvatar = await safeGetImageBase64(u.avatar);
        const totalOrdersCount = u.orders.length;
        const lifetimeSpent = u.orders.reduce(
          (sum, o) => sum + (parseFloat(o.finalCost || "0") || 0),
          0,
        );
        const supportTicketsCount = u.supportTickets.length;
        const lastOrderDate = u.orders[0]?.createdAt || null;

        if (totalOrdersCount > 0) activeBuyersCount++;
        totalRevenueSum += lifetimeSpent;
        totalInquiriesCount += supportTicketsCount;

        return {
          id: u.id,
          code: u.code,
          name: u.name,
          email: u.email,
          phone: u.phone,
          avatar: resolvedAvatar || null,
          district: u.district,
          address: u.address,
          role: u.role,
          hasGoogleLinked: Boolean(u.googleId),
          createdAt: u.createdAt,
          totalOrdersCount,
          lifetimeSpent,
          supportTicketsCount,
          lastOrderDate,
        };
      }),
    );

    const stats: AdminCustomerStats = {
      totalCustomers: customers.length,
      activeBuyers: activeBuyersCount,
      totalRevenue: totalRevenueSum,
      totalInquiries: totalInquiriesCount,
    };

    return {
      success: true,
      customers,
      stats,
    };
  } catch (error) {
    console.error("[Action.Admin.Support.Customers.Get] Error:", error);
    return { success: false, message: "Failed to load customers." };
  }
}

/**
 * Fetch 360 detailed view of a customer.
 */
export async function getAdminCustomerDetailsAction(
  customerId: string,
): Promise<{
  success: boolean;
  message?: string;
  customer?: AdminCustomerDetails;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const u = await db.user.findUnique({
      where: { id: customerId },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            code: true,
            finalCost: true,
            totalQuantity: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
        supportTickets: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            code: true,
            subject: true,
            category: true,
            status: true,
            priority: true,
            channel: true,
            createdAt: true,
          },
        },
      },
    });

    if (!u) {
      return { success: false, message: "Customer not found." };
    }

    const resolvedAvatar = await safeGetImageBase64(u.avatar);
    const totalOrdersCount = u.orders.length;
    const lifetimeSpent = u.orders.reduce(
      (sum, o) => sum + (parseFloat(o.finalCost || "0") || 0),
      0,
    );
    const supportTicketsCount = u.supportTickets.length;
    const lastOrderDate = u.orders[0]?.createdAt || null;

    return {
      success: true,
      customer: {
        id: u.id,
        code: u.code,
        name: u.name,
        email: u.email,
        phone: u.phone,
        avatar: resolvedAvatar || null,
        district: u.district,
        address: u.address,
        role: u.role,
        hasGoogleLinked: Boolean(u.googleId),
        createdAt: u.createdAt,
        totalOrdersCount,
        lifetimeSpent,
        supportTicketsCount,
        lastOrderDate,
        recentOrders: u.orders,
        supportTickets: u.supportTickets,
      },
    };
  } catch (error) {
    console.error("[Action.Admin.Support.Customers.Details] Error:", error);
    return { success: false, message: "Failed to load customer details." };
  }
}

/**
 * Update customer profile details from admin.
 */
export async function adminUpdateCustomerAction(
  input: AdminUpdateCustomerInput,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const parsed = adminUpdateCustomerSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid customer data.",
      };
    }

    const { id, name, phone, district, address } = parsed.data;

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, message: "Customer not found." };
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        name,
        phone: phone || null,
        district: district || null,
        address: address || null,
      },
    });

    await recordAuditLog({
      action: AuditAction.UPDATE,
      entity: AuditEntity.CUSTOMER,
      entityId: updated.id,
      entityName: updated.name,
      summary: `Customer profile updated for ${updated.name} (${updated.email})`,
      severity: AuditSeverity.INFO,
      previousState: existing as Record<string, unknown>,
      newState: { name, phone, district, address },
      userId: session.id,
      path: "/admin/support-marketing/support/customers",
    });

    revalidatePath("/admin/support-marketing/support/customers");
    revalidatePath("/admin/support-marketing/support/tickets");

    return {
      success: true,
      message: "Customer updated successfully.",
    };
  } catch (error) {
    console.error("[Action.Admin.Support.Customers.Update] Error:", error);
    return { success: false, message: "Failed to update customer." };
  }
}

/**
 * Delete customer account (requires OWNER or ADMIN privilege).
 */
export async function adminDeleteCustomerAction(customerId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.OWNER) {
      return {
        success: false,
        message: "Only owners can delete customer accounts.",
      };
    }

    const existing = await db.user.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, email: true, phone: true },
    });

    await db.user.delete({
      where: { id: customerId },
    });

    await recordAuditLog({
      action: AuditAction.DELETE,
      entity: AuditEntity.CUSTOMER,
      entityId: customerId,
      entityName: existing?.name || "Customer",
      summary: `Customer account deleted: ${existing?.name || customerId} (${existing?.email || "No email"})`,
      severity: AuditSeverity.WARNING,
      previousState: existing as Record<string, unknown>,
      userId: session.id,
      path: "/admin/support-marketing/support/customers",
    });

    revalidatePath("/admin/support-marketing/support/customers");
    revalidatePath("/admin/support-marketing/support/tickets");

    return {
      success: true,
      message: "Customer account deleted.",
    };
  } catch (error) {
    console.error("[Action.Admin.Support.Customers.Delete] Error:", error);
    return { success: false, message: "Failed to delete customer." };
  }
}
