"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { Role } from "@/generated/prisma/enums";
import { getImageBase64 } from "@/lib/storage";
import {
  SearchEntityType,
  AdminGlobalSearchResults,
  AdminProductSearchResult,
  AdminOrderSearchResult,
  AdminCustomerSearchResult,
  AdminTicketSearchResult,
  AdminOfferSearchResult,
} from "@/schemas/admin/search";

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
 * Execute unified multi-entity admin search across products, orders, users, tickets, and store data.
 */
export async function adminGlobalSearchAction(
  query: string = "",
  type: SearchEntityType = "ALL",
  limit: number = 20,
): Promise<{
  success: boolean;
  message?: string;
  results?: AdminGlobalSearchResults;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized access." };
    }

    const cleanQuery = query.trim();

    // Query Products
    const shouldSearchProducts = type === "ALL" || type === "PRODUCTS";
    const productPromise = shouldSearchProducts
      ? db.product.findMany({
          where: cleanQuery
            ? {
                OR: [
                  { name: { contains: cleanQuery, mode: "insensitive" } },
                  { code: { contains: cleanQuery, mode: "insensitive" } },
                  { sku: { contains: cleanQuery, mode: "insensitive" } },
                  {
                    brand: {
                      name: { contains: cleanQuery, mode: "insensitive" },
                    },
                  },
                  {
                    subCategory: {
                      name: { contains: cleanQuery, mode: "insensitive" },
                    },
                  },
                  {
                    variants: {
                      some: {
                        OR: [
                          {
                            sku: { contains: cleanQuery, mode: "insensitive" },
                          },
                          {
                            attributes: {
                              some: {
                                value: {
                                  contains: cleanQuery,
                                  mode: "insensitive",
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              }
            : undefined,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            brand: { select: { name: true } },
            subCategory: { select: { name: true, category: true } },
            variants: {
              include: {
                attributes: true,
              },
            },
          },
        })
      : Promise.resolve([]);

    // Query Orders
    const shouldSearchOrders = type === "ALL" || type === "ORDERS";
    const orderPromise = shouldSearchOrders
      ? db.order.findMany({
          where: cleanQuery
            ? {
                OR: [
                  { code: { contains: cleanQuery, mode: "insensitive" } },
                  { name: { contains: cleanQuery, mode: "insensitive" } },
                  { email: { contains: cleanQuery, mode: "insensitive" } },
                  { phone: { contains: cleanQuery, mode: "insensitive" } },
                  { address: { contains: cleanQuery, mode: "insensitive" } },
                  { district: { contains: cleanQuery, mode: "insensitive" } },
                ],
              }
            : undefined,
          take: limit,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]);

    // Query Customers
    const shouldSearchCustomers = type === "ALL" || type === "CUSTOMERS";
    const customerPromise = shouldSearchCustomers
      ? db.user.findMany({
          where: cleanQuery
            ? {
                OR: [
                  { name: { contains: cleanQuery, mode: "insensitive" } },
                  { email: { contains: cleanQuery, mode: "insensitive" } },
                  { phone: { contains: cleanQuery, mode: "insensitive" } },
                  { code: { contains: cleanQuery, mode: "insensitive" } },
                  { district: { contains: cleanQuery, mode: "insensitive" } },
                ],
              }
            : undefined,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            orders: { select: { finalCost: true } },
          },
        })
      : Promise.resolve([]);

    // Query Tickets
    const shouldSearchTickets = type === "ALL" || type === "TICKETS";
    const ticketPromise = shouldSearchTickets
      ? db.supportTicket.findMany({
          where: cleanQuery
            ? {
                OR: [
                  { code: { contains: cleanQuery, mode: "insensitive" } },
                  { subject: { contains: cleanQuery, mode: "insensitive" } },
                  { message: { contains: cleanQuery, mode: "insensitive" } },
                  { category: { contains: cleanQuery, mode: "insensitive" } },
                  {
                    user: {
                      name: { contains: cleanQuery, mode: "insensitive" },
                    },
                  },
                  {
                    user: {
                      phone: { contains: cleanQuery, mode: "insensitive" },
                    },
                  },
                  {
                    order: {
                      code: { contains: cleanQuery, mode: "insensitive" },
                    },
                  },
                ],
              }
            : undefined,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
            order: {
              select: { code: true },
            },
          },
        })
      : Promise.resolve([]);

    // Query Offers & Store (Coupons, Campaigns, Brands)
    const shouldSearchOffers = type === "ALL" || type === "OFFERS";
    const couponsPromise = shouldSearchOffers
      ? db.coupon.findMany({
          where: cleanQuery
            ? {
                OR: [
                  { couponCode: { contains: cleanQuery, mode: "insensitive" } },
                  { name: { contains: cleanQuery, mode: "insensitive" } },
                ],
              }
            : undefined,
          take: 10,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]);

    const campaignsPromise = shouldSearchOffers
      ? db.campaign.findMany({
          where: cleanQuery
            ? {
                name: { contains: cleanQuery, mode: "insensitive" },
              }
            : undefined,
          take: 10,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]);

    const brandsPromise = shouldSearchOffers
      ? db.brand.findMany({
          where: cleanQuery
            ? {
                name: { contains: cleanQuery, mode: "insensitive" },
              }
            : undefined,
          take: 10,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]);

    // Parallel Execution
    const [
      rawProducts,
      rawOrders,
      rawCustomers,
      rawTickets,
      rawCoupons,
      rawCampaigns,
      rawBrands,
    ] = await Promise.all([
      productPromise,
      orderPromise,
      customerPromise,
      ticketPromise,
      couponsPromise,
      campaignsPromise,
      brandsPromise,
    ]);

    // Format Products
    const products: AdminProductSearchResult[] = await Promise.all(
      rawProducts.map(async (p) => {
        const resolvedThumb = await safeGetImageBase64(p.image);

        let totalStock = p.stock ?? 0;
        let sellingPrice = p.salePrice || p.regularPrice || "0";
        let minPrice: string | undefined;
        let maxPrice: string | undefined;
        let mappedVariants: AdminProductSearchResult["variants"] = undefined;

        if (p.isVariable && p.variants && p.variants.length > 0) {
          totalStock = p.variants.reduce((acc, v) => acc + (v.stock || 0), 0);

          const prices = p.variants
            .map((v) => parseFloat(v.salePrice || v.regularPrice || "0"))
            .filter((pr) => pr > 0);

          if (prices.length > 0) {
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            minPrice = min.toString();
            maxPrice = max.toString();
            sellingPrice = min === max ? min.toString() : `${min} - ৳${max}`;
          }

          mappedVariants = await Promise.all(
            p.variants.map(async (v) => {
              const variantThumb = await safeGetImageBase64(v.image);
              const label =
                v.attributes.map((a) => a.value).join(" / ") ||
                `Variant ${v.sku}`;
              return {
                id: v.id,
                sku: v.sku,
                price: v.salePrice || v.regularPrice || "0",
                stock: v.stock || 0,
                label,
                attributes: v.attributes.map((a) => ({
                  name: a.name,
                  value: a.value,
                })),
                image: variantThumb || null,
              };
            }),
          );
        }

        return {
          id: p.id,
          code: p.code,
          name: p.name,
          sku: p.sku,
          sellingPrice,
          minPrice,
          maxPrice,
          stock: totalStock,
          isVariable: p.isVariable,
          categoryName: p.subCategory.name,
          brandName: p.brand?.name || null,
          thumbnail: resolvedThumb || null,
          variants: mappedVariants,
        };
      }),
    );

    // Format Orders
    const orders: AdminOrderSearchResult[] = rawOrders.map((o) => ({
      id: o.id,
      code: o.code,
      customerName: o.name,
      customerEmail: o.email,
      customerPhone: o.phone,
      finalCost: o.finalCost,
      totalQuantity: o.totalQuantity,
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
    }));

    // Format Customers
    const customers: AdminCustomerSearchResult[] = await Promise.all(
      rawCustomers.map(async (c) => {
        const resolvedAvatar = await safeGetImageBase64(c.avatar);
        const totalOrdersCount = c.orders.length;
        const lifetimeSpent = c.orders.reduce(
          (sum, o) => sum + (parseFloat(o.finalCost || "0") || 0),
          0,
        );

        return {
          id: c.id,
          code: c.code,
          name: c.name,
          email: c.email,
          phone: c.phone,
          avatar: resolvedAvatar || null,
          district: c.district,
          role: c.role,
          totalOrdersCount,
          lifetimeSpent,
          createdAt: c.createdAt,
        };
      }),
    );

    // Format Tickets
    const tickets: AdminTicketSearchResult[] = rawTickets.map((t) => ({
      id: t.id,
      code: t.code,
      subject: t.subject,
      category: t.category,
      status: t.status,
      priority: t.priority,
      channel: t.channel,
      userName: t.user.name,
      userEmail: t.user.email,
      userPhone: t.user.phone,
      orderCode: t.order?.code || null,
      createdAt: t.createdAt,
    }));

    // Format Offers & Store Entities
    const offers: AdminOfferSearchResult[] = [
      ...rawCoupons.map((cpn) => ({
        id: cpn.id,
        code: cpn.couponCode,
        name: cpn.name,
        type: "COUPON" as const,
        details: `Min purchase ৳${cpn.minPurchaseAmount || 0} • ${cpn.discountType}`,
        link: "/admin/management/offers/coupons",
      })),
      ...rawCampaigns.map((cmp) => ({
        id: cmp.id,
        code: cmp.id.slice(0, 8).toUpperCase(),
        name: cmp.name,
        type: "CAMPAIGN" as const,
        details: `Ends: ${new Date(cmp.endsAt).toLocaleDateString()}`,
        link: "/admin/management/offers/campaigns",
      })),
      ...rawBrands.map((b) => ({
        id: b.id,
        code: b.slug,
        name: b.name,
        type: "BRAND" as const,
        details: "Store Brand",
        link: "/admin/management/store/brands",
      })),
    ];

    const totalMatches =
      products.length +
      orders.length +
      customers.length +
      tickets.length +
      offers.length;

    const results: AdminGlobalSearchResults = {
      query: cleanQuery,
      totalMatches,
      products,
      orders,
      customers,
      tickets,
      offers,
      counts: {
        products: products.length,
        orders: orders.length,
        customers: customers.length,
        tickets: tickets.length,
        offers: offers.length,
      },
    };

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error("[Action.Admin.GlobalSearch] Error:", error);
    return { success: false, message: "Search operation failed." };
  }
}
