import { z } from "zod";

export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  sku: z.string().nullable().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
  discount: z.number().default(0),
  total: z.number(),
  attributes: z.record(z.string(), z.string()).optional(),
});

export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

export const invoiceDataSchema = z.object({
  orderId: z.string(),
  invoiceCode: z.string(),
  createdAt: z.string(),
  formattedDate: z.string(),

  // Company Info
  company: z.object({
    name: z.string().default("MEAWLAND"),
    mobile: z.string().default("+880 1888271704"),
    email: z.string().default("info@meawland.com"),
    web: z.string().default("www.meawland.com"),
    address: z.string().default("Dhaka, Bangladesh"),
  }),

  // Customer / Billing Info
  customer: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string(),
    clientId: z.string(),
    trackingId: z.string().default("not available"),
    address: z.string(),
    district: z.string(),
    fullAddress: z.string(),
  }),

  // Order Items
  items: z.array(invoiceItemSchema),

  // Financials
  subTotal: z.number(),
  deliveryCharge: z.number(),
  discountAmount: z.number().default(0),
  grossTotal: z.number(),
  paidAmount: z.number().default(0),
  dueAmount: z.number().default(0),
  amountInWords: z.string(),

  // Payment metadata & Notes
  paymentMethod: z.string(),
  paymentStatus: z.string(),
  trxID: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export type InvoiceData = z.infer<typeof invoiceDataSchema>;
