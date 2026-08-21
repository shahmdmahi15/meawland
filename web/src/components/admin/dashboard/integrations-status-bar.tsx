"use client";

import React from "react";
import {
  DashboardIntegrationsStatus,
  DashboardSystemHealth,
} from "@/actions/admin/dashboard/types";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  MessageSquare,
  Mail,
  CreditCard,
  Activity,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface IntegrationsStatusBarProps {
  integrations: DashboardIntegrationsStatus;
  system: DashboardSystemHealth;
}

export function IntegrationsStatusBar({
  integrations,
  system,
}: IntegrationsStatusBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {/* 1. Steadfast Courier Balance */}
      <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:border-[#56C8D8] transition-all flex flex-col justify-between space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-orange-50 text-orange-600">
              <Truck className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-gray-800">
              Steadfast Courier
            </span>
          </div>
          <Badge
            variant="outline"
            className="text-[9px] font-bold text-orange-600 bg-orange-50/70 border-orange-200"
          >
            {integrations.steadfast.inTransitConsignments} In Transit
          </Badge>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-base font-black text-gray-900">
              ৳{integrations.steadfast.currentBalance.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 block">
              Available Balance
            </span>
          </div>
          <Link
            href="/admin/management/orders/all-orders"
            className="text-[10px] font-bold text-[#0097a7] hover:underline flex items-center gap-0.5"
          >
            <span>Orders</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>
      </div>

      {/* 2. BulkSMSBD Balance */}
      <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:border-[#56C8D8] transition-all flex flex-col justify-between space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-gray-800">SMS Gateway</span>
          </div>
          <Badge
            variant="outline"
            className="text-[9px] font-bold text-blue-600 bg-blue-50/70 border-blue-200"
          >
            {integrations.bulkSms.totalSent} Sent
          </Badge>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-base font-black text-gray-900">
              ৳{integrations.bulkSms.remainingBalance.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 block">SMS Credits</span>
          </div>
          <Link
            href="/admin/support-marketing/marketing/sms"
            className="text-[10px] font-bold text-[#0097a7] hover:underline flex items-center gap-0.5"
          >
            <span>Hub</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>
      </div>

      {/* 3. AWS SES Email & Newsletter */}
      <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:border-[#56C8D8] transition-all flex flex-col justify-between space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#EDF5FA] text-[#0097a7]">
              <Mail className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-gray-800">
              Email &amp; SES
            </span>
          </div>
          <Badge
            variant="outline"
            className="text-[9px] font-bold text-emerald-600 bg-emerald-50/70 border-emerald-200"
          >
            {integrations.emailSes.deliverySuccessRatePct}% Sent
          </Badge>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-base font-black text-gray-900">
              {integrations.emailSes.totalSubscribers.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 block">Subscribers</span>
          </div>
          <Link
            href="/admin/support-marketing/marketing/email"
            className="text-[10px] font-bold text-[#0097a7] hover:underline flex items-center gap-0.5"
          >
            <span>Hub</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>
      </div>

      {/* 4. bKash Gateway */}
      <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:border-[#56C8D8] transition-all flex flex-col justify-between space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-pink-50 text-[#e2136e]">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-gray-800">
              bKash Online
            </span>
          </div>
          <Badge
            variant="outline"
            className="text-[9px] font-bold text-pink-700 bg-pink-50/70 border-pink-200"
          >
            {integrations.bkash.totalOnlineTransactions} Paid
          </Badge>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-base font-black text-gray-900">
              ৳{integrations.bkash.totalOnlineCollected.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 block">Collected</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
            <CheckCircle2 className="w-3 h-3" /> Live
          </span>
        </div>
      </div>

      {/* 5. PostgreSQL Database Ping */}
      <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:border-[#56C8D8] transition-all flex flex-col justify-between space-y-2 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-gray-800">
              Database Ping
            </span>
          </div>
          <Badge
            variant="outline"
            className={`text-[9px] font-bold ${
              system.dbStatus === "healthy"
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : "text-rose-700 bg-rose-50 border-rose-200"
            }`}
          >
            {system.dbStatus}
          </Badge>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-base font-black text-gray-900">
              {system.dbLatencyMs} ms
            </span>
            <span className="text-[10px] text-gray-500 block">
              Query Response
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            {system.serverUptimeFormatted} up
          </span>
        </div>
      </div>
    </div>
  );
}
