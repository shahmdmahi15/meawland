"use client";

import React, { useState } from "react";
import {
  AdminEmailCampaignSummary,
  AdminEmailTemplateSummary,
  AdminEmailLogSummary,
  EmailAudienceFilter,
} from "@/actions/admin/support-marketing/marketing/email/types";
import { EmailAutomationSettingsSummary } from "@/actions/admin/support-marketing/marketing/email/automations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Send,
  Users,
  CheckCircle2,
  FileText,
  Settings2,
  Zap,
  TrendingUp,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { EmailCampaignsTable } from "./email-campaigns-table";
import { EmailTemplatesManager } from "./email-templates-manager";
import { EmailLogsTable } from "./email-logs-table";
import { EmailAutomationsCard } from "./email-automations-card";
import { AudienceSegmentBuilder } from "./audience-segment-builder";
import { CreateEmailCampaignModal } from "./create-email-campaign-modal";
import { QuickEmailModal } from "./quick-email-modal";

interface EmailDashboardViewProps {
  campaigns: AdminEmailCampaignSummary[];
  templates: AdminEmailTemplateSummary[];
  logs: AdminEmailLogSummary[];
  totalLogs: number;
  totalSubscribers: number;
  totalDelivered: number;
  deliveryRatePct: number;
  automationSettings: EmailAutomationSettingsSummary;
  categories: Array<{ label: string; value: string }>;
  brands: Array<{ id: string; name: string }>;
  districts: string[];
}

export function EmailDashboardView({
  campaigns,
  templates,
  logs,
  totalLogs,
  totalSubscribers,
  totalDelivered,
  deliveryRatePct,
  automationSettings,
  categories,
  brands,
  districts,
}: EmailDashboardViewProps) {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [segmentFilter, setSegmentFilter] = useState<EmailAudienceFilter>({
    targetType: "ALL_CUSTOMERS",
  });

  const activeAutomationsCount = [
    automationSettings.orderPlacedEmail,
    automationSettings.orderDispatchedEmail,
    automationSettings.orderDeliveredEmail,
    automationSettings.bkashPaymentPaidEmail,
    automationSettings.welcomeNewUserEmail,
    automationSettings.abandonedCartEmail,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EDF5FA] text-[#0097a7] border border-[#D4EEFC]">
            <Mail className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                Email Marketing &amp; Automation Hub
              </h1>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold"
              >
                AWS SES v2
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Design high-converting pet campaigns, segment VIP buyers, and automate transactional order lifecycle emails.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CreateEmailCampaignModal
            templates={templates}
            categories={categories}
            brands={brands}
            districts={districts}
          />
          <QuickEmailModal />
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Newsletter Reach */}
        <Card className="rounded-3xl border-gray-200 bg-white shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500">
                Newsletter Reach
              </span>
              <div className="p-1.5 rounded-xl bg-purple-50 text-purple-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl font-black text-gray-900">
                {totalSubscribers.toLocaleString()}
              </p>
              <Link
                href="/admin/support-marketing/marketing/newsletter"
                className="text-[10px] text-purple-600 font-bold hover:underline flex items-center gap-1 mt-0.5"
              >
                <span>View Newsletter</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 2. Total Emails Delivered */}
        <Card className="rounded-3xl border-gray-200 bg-white shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500">
                Total Delivered
              </span>
              <div className="p-1.5 rounded-xl bg-[#EDF5FA] text-[#0097a7]">
                <Send className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl font-black text-gray-900">
                {totalDelivered.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 font-semibold">
                Across all campaigns &amp; orders
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Delivery Success Rate */}
        <Card className="rounded-3xl border-gray-200 bg-white shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500">
                Delivery Success
              </span>
              <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl font-black text-emerald-600">
                {deliveryRatePct}%
              </p>
              <p className="text-[10px] text-emerald-700 font-bold">
                SPF / DKIM / DMARC Verified
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 4. Active Automations */}
        <Card className="rounded-3xl border-gray-200 bg-white shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500">
                Active Triggers
              </span>
              <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
                <Settings2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl font-black text-gray-900">
                {activeAutomationsCount} / 6
              </p>
              <p className="text-[10px] text-amber-700 font-bold">
                Automated lifecycle events
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 5. Ready Templates */}
        <Card className="rounded-3xl border-gray-200 bg-white shadow-xs col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500">
                Email Templates
              </span>
              <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl font-black text-gray-900">
                {templates.length}
              </p>
              <p className="text-[10px] text-gray-400 font-semibold">
                Ready-to-use branded designs
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-4"
      >
        <TabsList className="bg-gray-100 p-1 rounded-2xl h-auto flex flex-wrap gap-1">
          <TabsTrigger
            value="campaigns"
            className="rounded-xl text-xs font-bold py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:shadow-xs cursor-pointer gap-1.5"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Campaigns ({campaigns.length})</span>
          </TabsTrigger>

          <TabsTrigger
            value="segments"
            className="rounded-xl text-xs font-bold py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:shadow-xs cursor-pointer gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Audience Segments</span>
          </TabsTrigger>

          <TabsTrigger
            value="templates"
            className="rounded-xl text-xs font-bold py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:shadow-xs cursor-pointer gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Email Templates ({templates.length})</span>
          </TabsTrigger>

          <TabsTrigger
            value="logs"
            className="rounded-xl text-xs font-bold py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:shadow-xs cursor-pointer gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Delivery Logs ({totalLogs})</span>
          </TabsTrigger>

          <TabsTrigger
            value="automations"
            className="rounded-xl text-xs font-bold py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:shadow-xs cursor-pointer gap-1.5"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Automations &amp; Triggers</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Campaigns Table */}
        <TabsContent value="campaigns" className="space-y-4 outline-none">
          <EmailCampaignsTable
            initialCampaigns={campaigns}
            templates={templates}
            categories={categories}
            brands={brands}
            districts={districts}
          />
        </TabsContent>

        {/* Tab 2: Audience Segment Playground */}
        <TabsContent value="segments" className="space-y-4 outline-none">
          <Card className="rounded-3xl border-gray-200 bg-white p-6 shadow-xs">
            <div className="mb-4">
              <h2 className="text-base font-black text-gray-900">
                Audience Segmentation Studio
              </h2>
              <p className="text-xs text-gray-500">
                Test and preview real-time customer reach criteria across registered users, past buyers, cart abandoners, and newsletter subscribers.
              </p>
            </div>

            <AudienceSegmentBuilder
              value={segmentFilter}
              onChange={setSegmentFilter}
              categories={categories}
              brands={brands}
              districts={districts}
            />
          </Card>
        </TabsContent>

        {/* Tab 3: Email Templates */}
        <TabsContent value="templates" className="space-y-4 outline-none">
          <EmailTemplatesManager templates={templates} />
        </TabsContent>

        {/* Tab 4: Delivery Logs */}
        <TabsContent value="logs" className="space-y-4 outline-none">
          <EmailLogsTable initialLogs={logs} totalLogs={totalLogs} />
        </TabsContent>

        {/* Tab 5: Automations & Triggers */}
        <TabsContent value="automations" className="space-y-4 outline-none">
          <EmailAutomationsCard initialSettings={automationSettings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
