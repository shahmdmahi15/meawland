"use client";

import React, { useState, useTransition } from "react";
import {
  AdminEmailCampaignSummary,
  AdminEmailTemplateSummary,
} from "@/actions/admin/support-marketing/marketing/email/types";
import { EmailCampaignStatus } from "@/generated/prisma/enums";
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
import {
  Mail,
  Search,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getEmailCampaignsAction,
  deleteEmailCampaignAction,
} from "@/actions/admin/support-marketing/marketing/email/campaigns";
import { CreateEmailCampaignModal } from "./create-email-campaign-modal";
import { QuickEmailModal } from "./quick-email-modal";

interface EmailCampaignsTableProps {
  initialCampaigns: AdminEmailCampaignSummary[];
  templates: AdminEmailTemplateSummary[];
  categories?: Array<{ label: string; value: string }>;
  brands?: Array<{ id: string; name: string }>;
  districts?: string[];
}

const STATUS_CONFIG: Record<
  EmailCampaignStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  [EmailCampaignStatus.DRAFT]: {
    label: "Draft",
    variant: "outline",
    icon: Clock,
  },
  [EmailCampaignStatus.SCHEDULED]: {
    label: "Scheduled",
    variant: "secondary",
    icon: Clock,
  },
  [EmailCampaignStatus.SENDING]: {
    label: "Broadcasting...",
    variant: "default",
    icon: Send,
  },
  [EmailCampaignStatus.COMPLETED]: {
    label: "Completed",
    variant: "default",
    icon: CheckCircle2,
  },
  [EmailCampaignStatus.FAILED]: {
    label: "Failed",
    variant: "destructive",
    icon: AlertCircle,
  },
  [EmailCampaignStatus.CANCELLED]: {
    label: "Cancelled",
    variant: "outline",
    icon: XCircle,
  },
};

export function EmailCampaignsTable({
  initialCampaigns,
  templates,
  categories,
  brands,
  districts,
}: EmailCampaignsTableProps) {
  const [campaigns, setCampaigns] =
    useState<AdminEmailCampaignSummary[]>(initialCampaigns);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedCampaign, setSelectedCampaign] =
    useState<AdminEmailCampaignSummary | null>(null);

  const [isRefreshing, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleRefresh = (status = statusFilter, query = search) => {
    startTransition(async () => {
      const res = await getEmailCampaignsAction({
        page: 1,
        pageSize: 50,
        status: status !== "ALL" ? (status as EmailCampaignStatus) : undefined,
        search: query.trim() || undefined,
      });

      if (res.success && res.campaigns) {
        setCampaigns(res.campaigns);
      }
    });
  };

  const handleDelete = (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this email campaign?"))
      return;

    startDeleteTransition(async () => {
      const res = await deleteEmailCampaignAction(campaignId);
      if (res.success) {
        toast.success(res.message);
        setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
        if (selectedCampaign?.id === campaignId) {
          setSelectedCampaign(null);
        }
      } else {
        toast.error(res.message || "Failed to delete campaign.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CreateEmailCampaignModal
            templates={templates}
            categories={categories}
            brands={brands}
            districts={districts}
            onSuccess={() => handleRefresh()}
          />
          <QuickEmailModal onSuccess={() => handleRefresh()} />
        </div>

        <Button
          size="sm"
          variant="outline"
          disabled={isRefreshing}
          onClick={() => handleRefresh()}
          className="h-8 text-xs font-semibold gap-1.5 bg-white shadow-xs cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
          />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Filter and Search Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50/70 border border-gray-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="Search campaigns, subjects..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleRefresh(statusFilter, e.target.value);
            }}
            className="pl-8 h-8 text-xs bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onValueChange={(val) => val && setStatusFilter(val)}
          >
            <SelectTrigger className="h-8 text-xs w-36 bg-white">
              <SelectValue>
                {statusFilter === "ALL"
                  ? "All Statuses"
                  : STATUS_CONFIG[statusFilter as EmailCampaignStatus]?.label ||
                    statusFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="z-50 bg-white">
              <SelectItem value="ALL" className="text-xs">
                All Statuses
              </SelectItem>
              {Object.values(EmailCampaignStatus).map((st) => (
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
              <TableHead className="text-xs font-bold text-gray-700 pl-4">
                Campaign Title &amp; Subject
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Audience Segment
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Status
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-center">
                Sent / Reach
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-center">
                Delivery %
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Created
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right pr-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-40 text-center text-xs text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Mail className="w-8 h-8 text-gray-300" />
                    <p className="font-bold text-gray-700">
                      No email campaigns found
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Create your first email marketing broadcast above.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((c) => {
                const conf = STATUS_CONFIG[c.status] || STATUS_CONFIG.DRAFT;
                const StatusIcon = conf.icon;
                const deliveryRate =
                  c.totalRecipients > 0
                    ? Math.round((c.sentCount / c.totalRecipients) * 100)
                    : 0;

                return (
                  <TableRow
                    key={c.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <TableCell className="pl-4 py-3">
                      <div>
                        <p className="font-bold text-xs text-gray-900 leading-tight">
                          {c.title}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate max-w-xs mt-0.5">
                          {c.subject}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold bg-gray-50"
                      >
                        {c.targetSegment.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={conf.variant}
                        className="text-[10px] font-bold gap-1"
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{conf.label}</span>
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center font-bold text-xs">
                      <span className="text-emerald-600">{c.sentCount}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-gray-700">{c.totalRecipients}</span>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="font-bold text-xs text-gray-800">
                        {deliveryRate}%
                      </span>
                    </TableCell>

                    <TableCell className="text-xs text-gray-500">
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
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-gray-900">
                    Email Campaign Details &amp; Analytics
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">
                    {selectedCampaign.title}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {selectedCampaign.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subject:</span>
                  <strong className="text-gray-900">
                    {selectedCampaign.subject}
                  </strong>
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
                  <span className="text-gray-500">Delivered Emails:</span>
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
                <span className="text-[10px] uppercase font-bold text-gray-400">
                  Infrastructure
                </span>
                <p className="text-[11px] text-gray-300">
                  Broadcast delivered through <strong>AWS SES v2</strong> from{" "}
                  <code className="text-teal-400">no-reply@meawland.com</code>.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedCampaign(null)}
                className="text-xs cursor-pointer bg-white"
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
