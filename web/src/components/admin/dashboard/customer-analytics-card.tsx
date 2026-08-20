"use client";

import React from "react";
import { DashboardCustomerMetrics } from "@/actions/admin/dashboard/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Repeat,
  Sparkles,
  LifeBuoy,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

interface CustomerAnalyticsCardProps {
  customers: DashboardCustomerMetrics;
}

export function CustomerAnalyticsCard({
  customers,
}: CustomerAnalyticsCardProps) {
  return (
    <Card className="rounded-3xl border-gray-200 bg-white p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#56C8D8]" />
            <span>Customer Growth &amp; Engagement</span>
          </h2>
          <p className="text-xs text-gray-500">
            {customers.totalCustomers.toLocaleString()} registered customer accounts
          </p>
        </div>

        <Link
          href="/admin/support-marketing/support/customers"
          className="text-xs font-bold text-[#0097a7] hover:underline flex items-center gap-1"
        >
          <span>Customers</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-3">
        {/* Repeat Buyers */}
        <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-1">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-[11px] font-bold uppercase">Repeat Buyers</span>
            <Repeat className="w-3.5 h-3.5" />
          </div>
          <p className="text-xl font-black text-purple-900">
            {customers.repeatBuyers.toLocaleString()}
          </p>
          <span className="text-[10px] text-purple-700 font-bold block">
            {customers.repeatRatePct}% customer retention
          </span>
        </div>

        {/* New Buyers This Month */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold uppercase">New Pet Parents</span>
            <UserPlus className="w-3.5 h-3.5" />
          </div>
          <p className="text-xl font-black text-emerald-900">
            +{customers.newCustomersThisMonth.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-700 font-bold block">
            Joined this month
          </span>
        </div>

        {/* Newsletter Club */}
        <div className="p-3.5 rounded-2xl bg-[#EDF5FA] border border-[#D4EEFC] space-y-1">
          <div className="flex items-center justify-between text-[#0097a7]">
            <span className="text-[11px] font-bold uppercase">Newsletter Reach</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <p className="text-xl font-black text-gray-900">
            {customers.newsletterSubscribers.toLocaleString()}
          </p>
          <span className="text-[10px] text-[#0097a7] font-bold block">
            Active opt-ins
          </span>
        </div>

        {/* Support Inquiries */}
        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-bold uppercase">Open Tickets</span>
            <LifeBuoy className="w-3.5 h-3.5" />
          </div>
          <p className="text-xl font-black text-amber-900">
            {customers.openSupportTickets}
          </p>
          <span className="text-[10px] text-amber-700 font-bold block">
            {customers.resolvedSupportTickets} resolved
          </span>
        </div>
      </div>
    </Card>
  );
}
