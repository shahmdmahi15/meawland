"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  Plus,
  MessageSquare,
  Mail,
  Package,
  Truck,
} from "lucide-react";

export function QuickActionsToolbar() {
  const actions = [
    {
      label: "Create POS Order",
      href: "/admin/management/orders/new-order",
      icon: ShoppingBag,
      color: "bg-[#0097a7] hover:bg-[#00838f] text-white",
    },
    {
      label: "Add New Product",
      href: "/admin/management/inventory/new-product",
      icon: Plus,
      color: "bg-white hover:bg-gray-50 text-gray-800 border-gray-200",
    },
    {
      label: "Broadcast SMS",
      href: "/admin/support-marketing/marketing/sms",
      icon: MessageSquare,
      color: "bg-white hover:bg-gray-50 text-gray-800 border-gray-200",
    },
    {
      label: "Email Campaign Hub",
      href: "/admin/support-marketing/marketing/email",
      icon: Mail,
      color: "bg-white hover:bg-gray-50 text-gray-800 border-gray-200",
    },
    {
      label: "Modify Stock",
      href: "/admin/management/inventory/modify-stock",
      icon: Package,
      color: "bg-white hover:bg-gray-50 text-gray-800 border-gray-200",
    },
    {
      label: "Steadfast Courier",
      href: "/admin/management/orders/all-orders",
      icon: Truck,
      color: "bg-white hover:bg-gray-50 text-gray-800 border-gray-200",
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <Link key={act.label} href={act.href}>
            <Button
              size="sm"
              className={`h-9 text-xs font-bold gap-1.5 rounded-2xl shadow-2xs cursor-pointer whitespace-nowrap border ${act.color}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{act.label}</span>
            </Button>
          </Link>
        );
      })}
    </div>
  );
}
