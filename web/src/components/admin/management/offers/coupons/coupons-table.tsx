"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CouponRow,
  CouponFormData,
} from "@/actions/admin/management/offers/coupons";
import { DiscountType } from "@/generated/prisma/enums";
import { formatDate, cn } from "@/lib/utils";
import { CouponPreviewModal } from "./coupon-preview-modal";
import { EditCouponModal } from "./edit-coupon-modal";
import { DeleteCouponButton } from "./delete-coupon-button";
import { toast } from "sonner";
import {
  Search,
  Copy,
  Check,
  Eye,
  Pencil,
  Ticket,
  Percent,
  DollarSign,
  Truck,
  Calendar,
  Filter,
  X,
  Package,
  Boxes,
  Users,
  Tag,
  FolderTree,
  Award,
} from "lucide-react";

interface CouponsTableProps {
  coupons: CouponRow[];
  formData: CouponFormData;
  onRefresh?: () => void;
}

export function CouponsTable({
  coupons,
  formData,
  onRefresh,
}: CouponsTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal states
  const [previewCoupon, setPreviewCoupon] = useState<CouponRow | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied "${code}" to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchCode = c.couponCode.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }

      // Type filter
      if (typeFilter !== "ALL" && c.discountType !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "ALL" && c.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [coupons, search, typeFilter, statusFilter]);

  const renderDiscountBadge = (c: CouponRow) => {
    switch (c.discountType) {
      case DiscountType.PERCENTAGE:
        return (
          <Badge
            variant="outline"
            className="gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-semibold"
          >
            <Percent className="h-3 w-3" />
            {c.discount}% OFF
          </Badge>
        );
      case DiscountType.FIXED:
        return (
          <Badge
            variant="outline"
            className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-semibold"
          >
            <DollarSign className="h-3 w-3" />৳{c.discount} OFF
          </Badge>
        );
      case DiscountType.FREE_DELIVERY:
        return (
          <Badge
            variant="outline"
            className="gap-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 font-semibold"
          >
            <Truck className="h-3 w-3" />
            Free Delivery
          </Badge>
        );
      default:
        return <Badge variant="secondary">Special</Badge>;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-[11px] px-2 py-0.5">
            Active
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge
            variant="destructive"
            className="font-medium text-[11px] px-2 py-0.5"
          >
            Expired
          </Badge>
        );
      case "EXHAUSTED":
        return (
          <Badge
            variant="secondary"
            className="font-medium text-[11px] px-2 py-0.5 text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-200 dark:border-amber-800"
          >
            Exhausted
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Table Toolbar / Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/80 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by coupon code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8.5 pl-8 text-xs bg-background"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Discount Type Filter */}
          <Select
            value={typeFilter}
            onValueChange={(val) => setTypeFilter(val ?? "ALL")}
          >
            <SelectTrigger className="h-8.5 text-xs w-[140px] bg-background">
              <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Discount Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value={DiscountType.PERCENTAGE}>
                Percentage
              </SelectItem>
              <SelectItem value={DiscountType.FIXED}>Fixed Amount</SelectItem>
              <SelectItem value={DiscountType.FREE_DELIVERY}>
                Free Delivery
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val ?? "ALL")}
          >
            <SelectTrigger className="h-8.5 text-xs w-[130px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="EXHAUSTED">Exhausted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[200px] text-xs font-semibold">
                Coupon &amp; Code
              </TableHead>
              <TableHead className="text-xs font-semibold">Discount</TableHead>
              <TableHead className="text-xs font-semibold">Scope</TableHead>
              <TableHead className="text-xs font-semibold">
                Redemptions
              </TableHead>
              <TableHead className="text-xs font-semibold">
                Expiry Date
              </TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-right text-xs font-semibold w-[110px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCoupons.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-xs text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Ticket className="h-6 w-6 text-muted-foreground/50" />
                    <p className="font-medium">No coupons found</p>
                    <p className="text-[11px]">
                      {search || typeFilter !== "ALL" || statusFilter !== "ALL"
                        ? "Try resetting your search or filter options."
                        : "Click 'Create Coupon' to configure your first promotional voucher."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCoupons.map((coupon) => {
                const percentUsed =
                  coupon.maxRedemptions && coupon.maxRedemptions > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (coupon.currentRedemptions / coupon.maxRedemptions) *
                            100,
                        ),
                      )
                    : null;

                return (
                  <TableRow
                    key={coupon.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Coupon Name & Code */}
                    <TableCell className="py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-foreground truncate max-w-[180px]">
                          {coupon.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs font-bold bg-muted px-1.5 py-0.5 rounded border border-border/70 text-foreground tracking-wider select-all">
                            {coupon.couponCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyCode(coupon.couponCode)}
                            className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === coupon.couponCode ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </TableCell>

                    {/* Discount Value */}
                    <TableCell className="py-3">
                      {renderDiscountBadge(coupon)}
                    </TableCell>

                    {/* Scope / Eligibility */}
                    <TableCell className="py-3">
                      <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3 w-3 text-blue-500/80 shrink-0" />
                          <span className="truncate">
                            {coupon.forAllUsers
                              ? "All Users"
                              : `${coupon.userCount} User(s)`}
                          </span>
                        </div>
                        {(!coupon.forAllCategories ||
                          coupon.categoryCount > 0) && (
                          <div className="flex items-center gap-1.5">
                            <Tag className="h-3 w-3 text-teal-500/80 shrink-0" />
                            <span className="truncate">
                              {coupon.forAllCategories
                                ? "All Categories"
                                : `${coupon.categoryCount} Cat(s)`}
                            </span>
                          </div>
                        )}
                        {(!coupon.forAllSubCategories ||
                          coupon.subCategoryCount > 0) && (
                          <div className="flex items-center gap-1.5">
                            <FolderTree className="h-3 w-3 text-indigo-500/80 shrink-0" />
                            <span className="truncate">
                              {coupon.forAllSubCategories
                                ? "All Subcategories"
                                : `${coupon.subCategoryCount} Subcat(s)`}
                            </span>
                          </div>
                        )}
                        {(!coupon.forAllBrands || coupon.brandCount > 0) && (
                          <div className="flex items-center gap-1.5">
                            <Award className="h-3 w-3 text-pink-500/80 shrink-0" />
                            <span className="truncate">
                              {coupon.forAllBrands
                                ? "All Brands"
                                : `${coupon.brandCount} Brand(s)`}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3 w-3 text-purple-500/80 shrink-0" />
                          <span className="truncate">
                            {coupon.forAllProducts
                              ? "All Products"
                              : coupon.productCount + coupon.variantCount > 0
                                ? `${coupon.productCount + coupon.variantCount} Product(s)`
                                : "No Products"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Boxes className="h-3 w-3 text-amber-500/80 shrink-0" />
                          <span className="truncate">
                            {coupon.forAllCombos
                              ? "All Combos"
                              : coupon.comboCount > 0
                                ? `${coupon.comboCount} Combo(s)`
                                : "No Combos"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Redemptions Progress */}
                    <TableCell className="py-3">
                      <div className="flex flex-col gap-1 w-28">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-foreground">
                            {coupon.currentRedemptions}
                          </span>
                          <span className="text-muted-foreground">
                            / {coupon.maxRedemptions ?? "∞"}
                          </span>
                        </div>
                        {percentUsed !== null && (
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                percentUsed >= 100
                                  ? "bg-amber-500"
                                  : "bg-primary",
                              )}
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Expiry Date */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatDate(coupon.expiresAt)}</span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3">
                      {renderStatusBadge(coupon.status)}
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setPreviewCoupon(coupon);
                            setPreviewOpen(true);
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingCoupon(coupon);
                            setEditOpen(true);
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit Coupon"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <DeleteCouponButton
                          couponId={coupon.id}
                          couponCode={coupon.couponCode}
                          onDeleted={onRefresh}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Preview Modal */}
      <CouponPreviewModal
        coupon={previewCoupon}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      {/* Edit Modal */}
      <EditCouponModal
        coupon={editingCoupon}
        formData={formData}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={onRefresh}
      />
    </div>
  );
}
