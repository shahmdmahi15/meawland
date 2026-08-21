"use client";

import React, { useState, useTransition } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SmsCampaignStatus, SmsCampaignType } from "@/generated/prisma/enums";
import type { AdminSmsCampaignSummary } from "@/actions/admin/support-marketing/marketing/sms/types";
import { deleteSmsCampaignAction } from "@/actions/admin/support-marketing/marketing/sms/campaigns";
import { toast } from "sonner";
import {
  Megaphone,
  Search,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Loader2,
  Calendar,
} from "lucide-react";

interface SmsCampaignsTableProps {
  initialCampaigns: AdminSmsCampaignSummary[];
}

const STATUS_CONFIG: Record<
  SmsCampaignStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  [SmsCampaignStatus.DRAFT]: {
    label: "Draft",
    color: "bg-gray-100 text-gray-700 border-gray-300",
    icon: Clock,
  },
  [SmsCampaignStatus.SCHEDULED]: {
    label: "Scheduled",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Calendar,
  },
  [SmsCampaignStatus.PROCESSING]: {
    label: "Broadcasting...",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Loader2,
  },
  [SmsCampaignStatus.COMPLETED]: {
    label: "Completed",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  [SmsCampaignStatus.FAILED]: {
    label: "Failed",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    icon: AlertCircle,
  },
  [SmsCampaignStatus.CANCELLED]: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-500 border-gray-200",
    icon: AlertCircle,
  },
};

export function SmsCampaignsTable({
  initialCampaigns,
}: SmsCampaignsTableProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedCampaign, setSelectedCampaign] =
    useState<AdminSmsCampaignSummary | null>(null);
  const [isDeleting, startTransition] = useTransition();

  const filteredCampaigns = campaigns.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) || c.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDelete = (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    startTransition(async () => {
      const res = await deleteSmsCampaignAction(campaignId);
      if (res.success) {
        toast.success("Campaign deleted.");
        setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
        if (selectedCampaign?.id === campaignId) setSelectedCampaign(null);
      } else {
        toast.error(res.message || "Failed to delete campaign.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-36 bg-white">
              <SelectValue>
                {statusFilter === "ALL"
                  ? "All Statuses"
                  : STATUS_CONFIG[statusFilter as SmsCampaignStatus]?.label ||
                    statusFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="z-50 bg-white">
              <SelectItem value="ALL" className="text-xs">
                All Statuses
              </SelectItem>
              {Object.values(SmsCampaignStatus).map((st) => (
                <SelectItem key={st} value={st} className="text-xs">
                  {STATUS_CONFIG[st]?.label || st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-gray-50/70">
            <TableRow>
              <TableHead className="font-bold text-xs">Campaign</TableHead>
              <TableHead className="font-bold text-xs">
                Target Segment
              </TableHead>
              <TableHead className="text-center font-bold text-xs">
                Recipients
              </TableHead>
              <TableHead className="text-center font-bold text-xs">
                Status
              </TableHead>
              <TableHead className="text-right font-bold text-xs">
                Est. Cost
              </TableHead>
              <TableHead className="text-center font-bold text-xs">
                Created
              </TableHead>
              <TableHead className="text-right font-bold text-xs pr-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-44 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Megaphone className="h-8 w-8 text-muted-foreground/40" />
                    <p className="font-bold text-sm text-gray-900">
                      No SMS Campaigns Found
                    </p>
                    <p className="text-xs text-gray-500">
                      Create your first marketing broadcast to engage pet owners
                      across Bangladesh.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCampaigns.map((c) => {
                const statusMeta = STATUS_CONFIG[c.status];
                const StatusIcon = statusMeta?.icon || Clock;

                return (
                  <TableRow key={c.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs text-gray-900 line-clamp-1">
                          {c.title}
                        </span>
                        <p className="font-mono text-[11px] text-gray-500 line-clamp-1 max-w-xs">
                          {c.message}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-bold"
                      >
                        {c.targetSegment?.replace(/_/g, " ") || "All Customers"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="text-xs font-bold text-gray-900">
                        {c.totalRecipients.toLocaleString()}
                      </div>
                      {c.sentCount > 0 && (
                        <div className="text-[10px] text-emerald-600 font-medium">
                          {c.sentCount} sent
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-bold gap-1 ${statusMeta?.color}`}
                      >
                        <StatusIcon
                          className={`w-3 h-3 ${
                            c.status === SmsCampaignStatus.PROCESSING
                              ? "animate-spin"
                              : ""
                          }`}
                        />
                        <span>{statusMeta?.label || c.status}</span>
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right font-bold text-xs text-gray-900">
                      {c.estimatedCost ? `৳${c.estimatedCost}` : "—"}
                    </TableCell>

                    <TableCell className="text-center text-xs text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>

                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setSelectedCampaign(c)}
                          className="h-7 w-7 text-gray-600 hover:text-primary cursor-pointer"
                          title="View Campaign Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={isDeleting}
                          onClick={() => handleDelete(c.id)}
                          className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <Dialog
          open={!!selectedCampaign}
          onOpenChange={(open) => !open && setSelectedCampaign(null)}
        >
          <DialogContent className="sm:max-w-[750px] w-[min(96vw,750px)] max-w-full max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-4">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#EDF5FA] text-[#0097a7] shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-gray-900">
                    Campaign Details &amp; Performance
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">
                    {selectedCampaign.title}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {selectedCampaign.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Target Segment:</span>
                  <strong className="text-gray-900">
                    {selectedCampaign.targetSegment}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Recipients:</span>
                  <strong className="text-gray-900">
                    {selectedCampaign.totalRecipients.toLocaleString()}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Successful Dispatches:</span>
                  <strong className="text-emerald-600">
                    {selectedCampaign.sentCount.toLocaleString()}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Failed Dispatches:</span>
                  <strong className="text-rose-600">
                    {selectedCampaign.failedCount.toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-900 text-white space-y-1">
                <span className="text-gray-400 text-[10px] font-bold block">
                  Broadcast Message Body:
                </span>
                <p className="font-mono text-xs whitespace-pre-wrap text-emerald-300">
                  {selectedCampaign.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setSelectedCampaign(null)}
                className="h-8 text-xs font-bold"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
