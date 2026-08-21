import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ShoppingCart,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Truck,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  Package,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getOrderDetailsAdminAction } from "@/actions/admin/management/orders/get-order-details";
import { OrderInvoiceModal } from "@/components/admin/management/orders/order-invoice-modal";
import { OrderDetailModal } from "@/components/admin/management/orders/order-detail-modal";
import { CourierStickerModal } from "@/components/admin/management/orders/stickers/courier-sticker-modal";
import { DeleteOrderButton } from "@/components/admin/management/orders/delete-order-button";
import { OrderFraudRiskBadge } from "@/components/admin/fraud-checker/order-fraud-risk-badge";
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface OrderPageProps {
  params: Promise<{ code: string }>;
}

export default async function AdminOrderDetailPage({ params }: OrderPageProps) {
  const { code } = await params;
  const res = await getOrderDetailsAdminAction(code);

  if (!res.success || !res.order) {
    notFound();
  }

  const order = res.order;
  const totalPrice = parseFloat(order.totalPrice) || 0;
  const totalCost = parseFloat(order.totalCost) || 0;
  const discountCost = parseFloat(order.discountCost) || 0;
  const finalCost = parseFloat(order.finalCost) || 0;
  const deliveryFee = Math.max(0, finalCost - (totalPrice - discountCost));
  const estimatedProfit = Math.max(0, finalCost - totalCost);
  const profitMarginPct =
    finalCost > 0 ? Math.round((estimatedProfit / finalCost) * 100) : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/management/orders/all-orders"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon-sm" }),
            )}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                Order #{order.code}
              </h1>
              <Badge
                variant={order.type === OrderType.WEB ? "outline" : "secondary"}
                className="text-[10px] font-bold uppercase"
              >
                {order.type}
              </Badge>
              <Badge
                className={cn(
                  "text-[10px] font-bold uppercase",
                  order.paymentStatus === PaymentStatus.PAID
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
                )}
              >
                {order.paymentStatus}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {order.shipment?.consignmentId && (
            <CourierStickerModal
              orders={[order]}
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs border-[#0f766e]/30 text-[#0f766e] hover:bg-[#0f766e]/10"
                >
                  <Truck className="w-3.5 h-3.5 text-[#0f766e]" />
                  <span>Courier Sticker</span>
                </Button>
              }
            />
          )}
          <OrderDetailModal
            order={order}
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                Manage Order
              </Button>
            }
          />
          <OrderInvoiceModal
            order={order}
            trigger={
              <Button size="sm" variant="default" className="gap-1.5 text-xs">
                Print Invoice
              </Button>
            }
          />
          <DeleteOrderButton orderId={order.id} orderCode={order.code} />
        </div>
      </div>

      {/* Grid: Details & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Items and Delivery */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Card */}
          <Card className="shadow-xs border-border">
            <CardHeader className="p-4 sm:p-5 border-b bg-muted/20 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-bold">
                  Ordered Items ({order.items.length})
                </CardTitle>
              </div>
              <span className="text-xs text-muted-foreground">
                Total Quantity: <strong>{order.totalQuantity} units</strong>
              </span>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative h-12 w-12 rounded-lg bg-muted/30 overflow-hidden shrink-0 border border-border/50">
                        <Image
                          src={item.image || "/fallback-product.png"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-foreground truncate">
                          {item.name}
                        </h4>
                        {item.sku && (
                          <p className="text-[11px] text-muted-foreground">
                            SKU: {item.sku}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          ৳{parseFloat(item.unitPrice).toLocaleString()} ×{" "}
                          {item.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-foreground">
                        ৳{parseFloat(item.finalCost).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Owner Cost: ৳
                        {parseFloat(item.totalCost).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer & Shipping Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="shadow-xs border-border">
              <CardHeader className="p-4 border-b bg-muted/20">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Customer Info
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-1.5 text-xs">
                <p className="font-semibold text-sm text-foreground">
                  {order.name}
                </p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>{order.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>{order.phone}</span>
                </div>
                {order.userCode && (
                  <Badge variant="outline" className="text-[10px] mt-1">
                    Customer Code: {order.userCode}
                  </Badge>
                )}

                <div className="pt-2">
                  <OrderFraudRiskBadge
                    phone={order.phone}
                    customerName={order.name}
                    orderCode={order.code}
                    parcelId={
                      order.shipment?.consignmentId
                        ? String(order.shipment.consignmentId)
                        : order.code
                    }
                    variant="card"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-border">
              <CardHeader className="p-4 border-b bg-muted/20">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Shipping &amp; Delivery
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-1.5 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                  <span>
                    {order.address}, <strong>{order.district}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground pt-1">
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Payment:{" "}
                    <strong>
                      {order.paymentMethod === PaymentMethod.COD
                        ? "Cash on Delivery"
                        : "bKash Online Payment"}
                    </strong>{" "}
                    ({order.paymentStatus})
                  </span>
                </div>
                {order.paymentMethod === PaymentMethod.BKASH &&
                  order.payment && (
                    <div className="mt-2 p-2.5 rounded-lg bg-[#fdf2f8] border border-[#fbcfe8] space-y-1 text-[11px] text-[#9d174d]">
                      {order.payment.trxID && (
                        <p>
                          TrxID:{" "}
                          <strong className="font-mono">
                            {order.payment.trxID}
                          </strong>
                        </p>
                      )}
                      {order.payment.customerMsisdn && (
                        <p className="text-gray-700">
                          bKash Account: {order.payment.customerMsisdn}
                        </p>
                      )}
                      {order.payment.paymentExecuteTime && (
                        <p className="text-gray-500">
                          Paid At: {order.payment.paymentExecuteTime}
                        </p>
                      )}
                      {order.payment.refundTrxId && (
                        <p className="text-purple-700 font-bold">
                          Refunded: ৳{order.payment.refundAmount} (TrxID:{" "}
                          {order.payment.refundTrxId})
                        </p>
                      )}
                    </div>
                  )}
                {order.shipment?.consignmentId && (
                  <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1 text-[11px] text-emerald-900">
                    <p className="font-bold flex items-center gap-1 text-emerald-800">
                      <Truck className="w-3.5 h-3.5" /> Steadfast Consignment #
                      {order.shipment.consignmentId}
                    </p>
                    {order.shipment.trackingCode && (
                      <p>
                        Tracking Code:{" "}
                        <strong className="font-mono">
                          {order.shipment.trackingCode}
                        </strong>
                      </p>
                    )}
                    <p>
                      Status:{" "}
                      <strong className="uppercase">
                        {order.shipment.rawStatus || order.shipment.status}
                      </strong>
                    </p>
                    <p>
                      COD Amount: <strong>৳{order.shipment.codAmount}</strong>
                    </p>
                  </div>
                )}
                {order.note && (
                  <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded mt-2">
                    <strong>Note:</strong> {order.note}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right 1 Column: Financial Math */}
        <div className="space-y-6">
          {/* Bill Summary */}
          <Card className="shadow-xs border-border bg-card">
            <CardHeader className="p-4 sm:p-5 border-b bg-muted/20">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-bold">
                  Order Financial Breakdown
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items Subtotal:</span>
                <span className="font-semibold text-foreground">
                  ৳{totalPrice.toLocaleString()}
                </span>
              </div>

              {discountCost > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discounts Applied:</span>
                  <span>-৳{discountCost.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Charge:</span>
                <span className="font-semibold text-foreground">
                  {deliveryFee === 0
                    ? "FREE"
                    : `৳${deliveryFee.toLocaleString()}`}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between items-center text-sm font-bold pt-1">
                <span className="text-foreground">Grand Total:</span>
                <span className="text-primary text-lg">
                  ৳{finalCost.toLocaleString()}
                </span>
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/30 p-3 mt-4 space-y-1 text-[11px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Owner Procurement Cost:</span>
                  <span>৳{totalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-border/40">
                  <span>Estimated Net Profit:</span>
                  <span>
                    ৳{estimatedProfit.toLocaleString()} ({profitMarginPct}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
