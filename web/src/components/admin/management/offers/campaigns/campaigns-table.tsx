"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
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
  CampaignRow,
  CampaignFormData,
} from "@/actions/admin/management/offers/campaigns";
import { DiscountType } from "@/generated/prisma/enums";
import { formatDate } from "@/lib/utils";
import { CampaignPreviewModal } from "./campaign-preview-modal";
import { EditCampaignModal } from "./edit-campaign-modal";
import { DeleteCampaignButton } from "./delete-campaign-button";
import {
  Search,
  Eye,
  Pencil,
  Flame,
  Percent,
  DollarSign,
  Truck,
  Calendar,
  Filter,
  X,
  ImageIcon,
  Package,
  Boxes,
  Tag,
  FolderTree,
  Award,
} from "lucide-react";

interface CampaignsTableProps {
  campaigns: CampaignRow[];
  formData: CampaignFormData;
  onRefresh?: () => void;
}

export function CampaignsTable({
  campaigns,
  formData,
  onRefresh,
}: CampaignsTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal states
  const [previewCampaign, setPreviewCampaign] = useState<CampaignRow | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignRow | null>(
    null,
  );
  const [editOpen, setEditOpen] = useState(false);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchDesc = c.description.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
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
  }, [campaigns, search, typeFilter, statusFilter]);

  const renderDiscountBadge = (c: CampaignRow) => {
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
            Ended
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
            placeholder="Search by campaign name or description..."
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
              <SelectItem value="EXPIRED">Ended</SelectItem>
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
              <TableHead className="w-[260px] text-xs font-semibold">
                Campaign &amp; Banner
              </TableHead>
              <TableHead className="text-xs font-semibold">Discount</TableHead>
              <TableHead className="text-xs font-semibold">Targets</TableHead>
              <TableHead className="text-xs font-semibold">Usage</TableHead>
              <TableHead className="text-xs font-semibold">End Date</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-right text-xs font-semibold w-[110px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-xs text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Flame className="h-6 w-6 text-muted-foreground/50" />
                    <p className="font-medium">
                      No promotional campaigns found
                    </p>
                    <p className="text-[11px]">
                      {search || typeFilter !== "ALL" || statusFilter !== "ALL"
                        ? "Try resetting your search or filter criteria."
                        : "Click 'Create Campaign' to launch your first seasonal promotion."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCampaigns.map((campaign) => (
                <TableRow
                  key={campaign.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {/* Campaign & Banner */}
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-20 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/60">
                        {campaign.bannerBase64 ? (
                          <Image
                            src={campaign.bannerBase64}
                            alt={campaign.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-foreground line-clamp-1">
                          {campaign.name}
                        </span>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {campaign.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Discount */}
                  <TableCell className="py-3">
                    {renderDiscountBadge(campaign)}
                  </TableCell>

                  {/* Targets */}
                  <TableCell className="py-3">
                    <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                      {(!campaign.forAllCategories ||
                        campaign.categoryCount > 0) && (
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-3 w-3 text-teal-500/80 shrink-0" />
                          <span className="truncate">
                            {campaign.forAllCategories
                              ? "All Categories"
                              : `${campaign.categoryCount} Cat(s)`}
                          </span>
                        </div>
                      )}
                      {(!campaign.forAllSubCategories ||
                        campaign.subCategoryCount > 0) && (
                        <div className="flex items-center gap-1.5">
                          <FolderTree className="h-3 w-3 text-indigo-500/80 shrink-0" />
                          <span className="truncate">
                            {campaign.forAllSubCategories
                              ? "All Subcategories"
                              : `${campaign.subCategoryCount} Subcat(s)`}
                          </span>
                        </div>
                      )}
                      {(!campaign.forAllBrands || campaign.brandCount > 0) && (
                        <div className="flex items-center gap-1.5">
                          <Award className="h-3 w-3 text-pink-500/80 shrink-0" />
                          <span className="truncate">
                            {campaign.forAllBrands
                              ? "All Brands"
                              : `${campaign.brandCount} Brand(s)`}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Package className="h-3 w-3 text-purple-500/80 shrink-0" />
                        <span className="truncate">
                          {campaign.forAllProducts
                            ? "All Products"
                            : campaign.productCount + campaign.variantCount > 0
                              ? `${campaign.productCount + campaign.variantCount} Product(s)`
                              : "No Products"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Boxes className="h-3 w-3 text-amber-500/80 shrink-0" />
                        <span className="truncate">
                          {campaign.forAllCombos
                            ? "All Combos"
                            : campaign.comboCount > 0
                              ? `${campaign.comboCount} Combo(s)`
                              : "No Combos"}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Usage */}
                  <TableCell className="py-3">
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span className="font-semibold text-foreground">
                        {campaign.currentRedemptions}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {campaign.maxRedemptions
                          ? `Limit: ${campaign.maxRedemptions}`
                          : "No Limit"}
                      </span>
                    </div>
                  </TableCell>

                  {/* End Date */}
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatDate(campaign.endsAt)}</span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3">
                    {renderStatusBadge(campaign.status)}
                  </TableCell>

                  {/* Actions Menu */}
                  <TableCell className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setPreviewCampaign(campaign);
                          setPreviewOpen(true);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="View Showcase"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingCampaign(campaign);
                          setEditOpen(true);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Edit Campaign"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <DeleteCampaignButton
                        campaignId={campaign.id}
                        campaignName={campaign.name}
                        onDeleted={onRefresh}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Preview Modal */}
      <CampaignPreviewModal
        campaign={previewCampaign}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      {/* Edit Modal */}
      <EditCampaignModal
        campaign={editingCampaign}
        formData={formData}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={onRefresh}
      />
    </div>
  );
}
