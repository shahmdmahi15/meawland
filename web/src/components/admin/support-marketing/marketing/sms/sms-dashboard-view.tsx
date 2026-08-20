"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  type AdminSmsCampaignSummary,
  type AdminSmsTemplateSummary,
  type AdminSmsLogSummary,
} from "@/actions/admin/support-marketing/marketing/sms/types";
import type { SmsAutomationSettingsSummary } from "@/actions/admin/support-marketing/marketing/sms/automations";
import { getSmsBalanceAction } from "@/actions/sms/get-balance";
import { CreateCampaignModal } from "./create-campaign-modal";
import { QuickBroadcastModal } from "./quick-broadcast-modal";
import { SmsCampaignsTable } from "./sms-campaigns-table";
import { SmsTemplatesManager } from "./sms-templates-manager";
import { SmsLogsTable } from "./sms-logs-table";
import { SmsAutomationsCard } from "./sms-automations-card";
import { AudienceSegmentBuilder } from "./audience-segment-builder";
import { toast } from "sonner";
import {
  MessageSquare,
  Wallet,
  Megaphone,
  Layers,
  FileText,
  Clock,
  Zap,
  RefreshCw,
  Send,
  Users,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

interface SmsDashboardViewProps {
  initialBalance: number;
  campaigns: AdminSmsCampaignSummary[];
  templates: AdminSmsTemplateSummary[];
  logs: AdminSmsLogSummary[];
  totalLogs: number;
  automationSettings: SmsAutomationSettingsSummary;
  categories?: { label: string; value: string }[];
  brands?: { id: string; name: string }[];
  products?: { id: string; name: string }[];
  districts?: string[];
}

export function SmsDashboardView({
  initialBalance,
  campaigns,
  templates,
  logs,
  totalLogs,
  automationSettings,
  categories,
  brands,
  products,
  districts,
}: SmsDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<
    "campaigns" | "segments" | "templates" | "logs" | "automations"
  >("campaigns");
  const [balance, setBalance] = useState<number>(initialBalance);
  const [isRefreshingBalance, startBalanceTransition] = useTransition();

  const [explorerAudience, setExplorerAudience] = useState({
    targetType: "ALL_CUSTOMERS" as const,
  });

  const handleRefreshBalance = () => {
    startBalanceTransition(async () => {
      const res = await getSmsBalanceAction();
      if (res.success && res.balance !== undefined) {
        setBalance(res.balance);
        toast.success(`Live SMS Balance: ৳${res.balance.toFixed(2)}`);
      } else {
        toast.error(res.message || "Failed to fetch balance.");
      }
    });
  };

  const totalSent = logs.filter((l) => l.status === "SUBMITTED" || l.status === "DELIVERED").length;
  const successfulCount = logs.filter((l) => l.status === "DELIVERED" || l.status === "SUBMITTED").length;
  const deliveryRate = logs.length > 0 ? Math.round((successfulCount / logs.length) * 100) : 100;
  const approxRemainingSms = Math.floor(balance / 0.35);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-[#EDF5FA] text-[#0097a7]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                SMS Marketing &amp; Automation Hub
              </h1>
              <p className="text-xs text-gray-500">
                Enterprise SMS gateway, dynamic customer segmentation, and automated order notifications.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <QuickBroadcastModal />
          <CreateCampaignModal
            templates={templates}
            categories={categories}
            brands={brands}
            districts={districts}
          />
        </div>
      </div>

      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Live BulkSMSBD Balance */}
        <div className="p-5 rounded-2xl border border-gray-200/80 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#0097a7]" /> SMS Credit Balance
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={isRefreshingBalance}
              onClick={handleRefreshBalance}
              className="h-6 w-6 text-gray-400 hover:text-primary cursor-pointer"
              title="Refresh Balance from Gateway"
            >
              <RefreshCw
                className={`w-3 h-3 ${
                  isRefreshingBalance ? "animate-spin text-primary" : ""
                }`}
              />
            </Button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900 font-mono">
              ৳{balance.toFixed(2)}
            </span>
            <span className="text-[11px] text-emerald-600 font-bold">BDT</span>
          </div>
          <p className="text-[11px] text-gray-500">
            ≈ <strong>{approxRemainingSms.toLocaleString()}</strong> SMS parts available
          </p>
        </div>

        {/* 2. Total Dispatched */}
        <div className="p-5 rounded-2xl border border-gray-200/80 bg-white shadow-xs space-y-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-blue-600" /> Total Dispatched
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900 font-mono">
              {totalLogs.toLocaleString()}
            </span>
            <span className="text-[11px] text-gray-500">messages</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {totalSent} successfully delivered
          </p>
        </div>

        {/* 3. Marketing Campaigns */}
        <div className="p-5 rounded-2xl border border-gray-200/80 bg-white shadow-xs space-y-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5 text-purple-600" /> Campaigns
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900 font-mono">
              {campaigns.length}
            </span>
            <span className="text-[11px] text-gray-500">created</span>
          </div>
          <p className="text-[11px] text-gray-500">
            {campaigns.filter((c) => c.status === "COMPLETED").length} completed
          </p>
        </div>

        {/* 4. Delivery Success Rate */}
        <div className="p-5 rounded-2xl border border-gray-200/80 bg-white shadow-xs space-y-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Gateway Success
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900 font-mono">
              {deliveryRate}%
            </span>
            <span className="text-[11px] text-emerald-600 font-bold">Reliability</span>
          </div>
          <p className="text-[11px] text-gray-500">
            BulkSMSBD Official Masking Gateway
          </p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto pb-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("campaigns")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all cursor-pointer ${
            activeTab === "campaigns"
              ? "bg-white border-t-2 border-t-[#0097a7] border-x border-gray-200 text-gray-900 shadow-2xs"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 text-[#0097a7]" />
          <span>Campaigns &amp; Broadcasts</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {campaigns.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("segments")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all cursor-pointer ${
            activeTab === "segments"
              ? "bg-white border-t-2 border-t-[#0097a7] border-x border-gray-200 text-gray-900 shadow-2xs"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Users className="w-3.5 h-3.5 text-blue-600" />
          <span>Audience Explorer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("templates")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all cursor-pointer ${
            activeTab === "templates"
              ? "bg-white border-t-2 border-t-[#0097a7] border-x border-gray-200 text-gray-900 shadow-2xs"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          <span>Message Templates</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {templates.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all cursor-pointer ${
            activeTab === "logs"
              ? "bg-white border-t-2 border-t-[#0097a7] border-x border-gray-200 text-gray-900 shadow-2xs"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-purple-600" />
          <span>Delivery Audit Logs</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {totalLogs}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("automations")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all cursor-pointer ${
            activeTab === "automations"
              ? "bg-white border-t-2 border-t-[#0097a7] border-x border-gray-200 text-gray-900 shadow-2xs"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Ecommerce Triggers</span>
        </button>
      </div>

      {/* Active Tab Contents */}
      {activeTab === "campaigns" && (
        <SmsCampaignsTable initialCampaigns={campaigns} />
      )}

      {activeTab === "segments" && (
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-black text-base text-gray-900">
              Interactive Audience Segmentation &amp; Query Tool
            </h3>
            <p className="text-xs text-gray-500">
              Test customer filters and inspect matching recipients across your database in real-time.
            </p>
          </div>
          <AudienceSegmentBuilder
            value={explorerAudience}
            onChange={setExplorerAudience}
            categories={categories}
            brands={brands}
            districts={districts}
          />
        </div>
      )}

      {activeTab === "templates" && (
        <SmsTemplatesManager initialTemplates={templates} />
      )}

      {activeTab === "logs" && (
        <SmsLogsTable initialLogs={logs} totalLogs={totalLogs} />
      )}

      {activeTab === "automations" && (
        <SmsAutomationsCard initialSettings={automationSettings} />
      )}
    </div>
  );
}
