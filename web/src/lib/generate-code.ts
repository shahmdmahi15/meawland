import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/db";

const CONFIG = {
  CUSTOMER: { prefix: "MEAWCUS", padding: 5 },
  PRODUCT: { prefix: "MEAWPDT", padding: 5 },
  ORDER: { prefix: "MEAWORD", padding: 6 },
  INVOICE: { prefix: "MEAWINV", padding: 6 },
  PAYMENT: { prefix: "MEAWPAY", padding: 6 },
  REFUND: { prefix: "MEAWRFD", padding: 5 },
  SHIPMENT: { prefix: "MEAWSHP", padding: 6 },
  COUPON: { prefix: "MEAWCPN", padding: 5 },
  GIFTCARD: { prefix: "MEAWGFT", padding: 5 },
  VENDOR: { prefix: "MEAWVND", padding: 4 },
  WHITELABEL: { prefix: "MEAWWTL", padding: 4 },
  LABEL: { prefix: "MEAWLBL", padding: 4 },
  SUBLABEL: { prefix: "MEAWSLB", padding: 4 },
  ARTIST: { prefix: "MEAWART", padding: 5 },
  PAYOUT: { prefix: "MEAWPOT", padding: 5 },
  WAREHOUSE: { prefix: "MEAWWRH", padding: 4 },
  SUPPLIER: { prefix: "MEAWSUP", padding: 4 },
  TICKET: { prefix: "MEAWTKT", padding: 5 },
  REVIEW: { prefix: "MEAWREV", padding: 6 },
  SUBSCRIPTION: { prefix: "MEAWSBN", padding: 5 },
} as const;

type CounterKey = keyof typeof CONFIG;

export async function generateId(
  key: CounterKey,
  tx?: Prisma.TransactionClient,
): Promise<string> {
  const db = tx ?? prisma;
  const { prefix, padding } = CONFIG[key];

  const counter = await db.counter.upsert({
    where: { id: key },
    create: { id: key, value: 1 },
    update: { value: { increment: 1 } },
  });

  return `${prefix}${String(counter.value).padStart(padding, "0")}`;
}
