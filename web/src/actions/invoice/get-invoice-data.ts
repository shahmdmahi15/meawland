"use server";

import prisma from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { Role, PaymentStatus } from "@/generated/prisma/enums";
import { convertAmountToWords } from "@/lib/number-to-words";
import { MEAWLAND_SOCIALS } from "@/lib/socials";
import type { InvoiceData, InvoiceItem } from "@/schemas/invoice";

export interface GetInvoiceResult {
  success: boolean;
  message?: string;
  data?: InvoiceData;
}

/**
 * Retrieves normalized and formatted invoice data for a given order code.
 * Accessible to admins and staff for all orders, and authenticated customers for their own orders.
 */
export async function getOrderInvoiceDataAction(
  orderCodeOrId: string,
): Promise<GetInvoiceResult> {
  try {
    if (!orderCodeOrId?.trim()) {
      return { success: false, message: "Order identifier is required." };
    }

    const cleanIdentifier = orderCodeOrId.trim();

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ code: cleanIdentifier }, { id: cleanIdentifier }],
      },
      include: {
        user: {
          select: {
            id: true,
            code: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        shipment: {
          select: {
            consignmentId: true,
            trackingCode: true,
            provider: true,
            status: true,
          },
        },
        payment: {
          select: {
            trxID: true,
            amount: true,
            customerMsisdn: true,
            status: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
            variant: {
              include: {
                product: {
                  select: {
                    name: true,
                  },
                },
                attributes: true,
              },
            },
            comboProduct: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return { success: false, message: "Order not found." };
    }

    // Check authorization: if customer, must own the order
    const sessionUser = await getMeAction();
    if (sessionUser) {
      const isStaffOrAdmin =
        sessionUser.role === Role.ADMIN || sessionUser.role === Role.OWNER;

      if (!isStaffOrAdmin && order.userId && order.userId !== sessionUser.id) {
        return {
          success: false,
          message: "Unauthorized access to this order invoice.",
        };
      }
    }

    // Format Date: e.g. "21 August 2026"
    const orderDate = new Date(order.createdAt);
    const formattedDate = orderDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Map items
    const items: InvoiceItem[] = order.orderItems.map((oi) => {
      const unitPrice = parseFloat(oi.unitPrice) || 0;
      const discount = parseFloat(oi.discountCost) || 0;
      const total = parseFloat(oi.finalCost) || unitPrice * oi.quanitity;

      let name = "Item";
      let sku = undefined;

      if (oi.variant) {
        sku = oi.variant.sku;
        const attrStr = oi.variant.attributes?.length
          ? oi.variant.attributes
              .map((a) => {
                const typeFormatted = a.type
                  ? a.type.charAt(0).toUpperCase() +
                    a.type.slice(1).toLowerCase()
                  : "";
                return typeFormatted ? `${typeFormatted}: ${a.name}` : a.name;
              })
              .join(", ")
          : "";
        name = oi.variant.product?.name
          ? `${oi.variant.product.name}${attrStr ? ` (${attrStr})` : ` (${oi.variant.sku})`}`
          : `Variant (${oi.variant.sku})`;
      } else if (oi.product) {
        name = oi.product.name;
        sku = oi.product.sku;
      } else if (oi.comboProduct) {
        name = oi.comboProduct.name;
        sku = oi.comboProduct.sku;
      }

      return {
        id: oi.id,
        name,
        sku,
        quantity: oi.quanitity,
        unitPrice,
        discount,
        total,
      };
    });

    const subTotal = parseFloat(order.totalPrice) || 0;
    const discountAmount = parseFloat(order.discountCost) || 0;
    const grossTotal = parseFloat(order.finalCost) || 0;
    const deliveryCharge = Math.max(
      0,
      grossTotal - Math.max(0, subTotal - discountAmount),
    );

    // Paid amount calculation
    let paidAmount = 0;
    if (order.paymentStatus === PaymentStatus.PAID) {
      paidAmount = grossTotal;
    } else if (
      order.payment?.amount &&
      order.payment.status === PaymentStatus.PAID
    ) {
      paidAmount = parseFloat(order.payment.amount) || 0;
    }

    const dueAmount = Math.max(0, grossTotal - paidAmount);
    const amountInWords = convertAmountToWords(grossTotal);

    // Client ID & Tracking ID
    const clientId =
      order.user?.code || order.user?.id || order.userId || "N/A";

    const trackingId =
      order.shipment?.trackingCode ||
      (order.shipment?.consignmentId ? String(order.shipment.consignmentId) : "not available");

    const fullAddress = [order.address, order.district]
      .filter(Boolean)
      .join(", ");

    const invoiceData: InvoiceData = {
      orderId: order.id,
      invoiceCode: order.code,
      createdAt: order.createdAt.toISOString(),
      formattedDate,
      company: {
        name: "MEAWLAND",
        mobile: MEAWLAND_SOCIALS.whatsapp.phoneFormatted,
        email: "info@meawland.com",
        web: "www.meawland.com",
        address: "Dhaka, Bangladesh",
      },
      customer: {
        name: order.name || "Valued Customer",
        phone: order.phone || "",
        email: order.email || "",
        clientId,
        trackingId,
        address: order.address || "",
        district: order.district || "",
        fullAddress,
      },
      items,
      subTotal,
      deliveryCharge,
      discountAmount,
      grossTotal,
      paidAmount,
      dueAmount,
      amountInWords,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      trxID: order.payment?.trxID || null,
      note: order.note || null,
    };

    return {
      success: true,
      data: invoiceData,
    };
  } catch (error) {
    console.error("[Action.Invoice.GetInvoiceData.Error]:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while generating invoice data.",
    };
  }
}
