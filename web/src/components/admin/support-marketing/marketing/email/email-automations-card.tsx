"use client";

import React, { useState, useTransition } from "react";
import { EmailAutomationSettingsSummary } from "@/actions/admin/support-marketing/marketing/email/automations";
import { updateEmailAutomationSettingsAction } from "@/actions/admin/support-marketing/marketing/email/automations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  CreditCard,
  UserPlus,
  ShoppingCart,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";

interface EmailAutomationsCardProps {
  initialSettings: EmailAutomationSettingsSummary;
}

export function EmailAutomationsCard({
  initialSettings,
}: EmailAutomationsCardProps) {
  const [settings, setSettings] =
    useState<EmailAutomationSettingsSummary>(initialSettings);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateEmailAutomationSettingsAction({
        orderPlacedEmail: settings.orderPlacedEmail,
        orderDispatchedEmail: settings.orderDispatchedEmail,
        orderDeliveredEmail: settings.orderDeliveredEmail,
        bkashPaymentPaidEmail: settings.bkashPaymentPaidEmail,
        welcomeNewUserEmail: settings.welcomeNewUserEmail,
        abandonedCartEmail: settings.abandonedCartEmail,
        orderPlacedSubject: settings.orderPlacedSubject,
        orderDispatchedSubject: settings.orderDispatchedSubject,
        orderDeliveredSubject: settings.orderDeliveredSubject,
        bkashPaidSubject: settings.bkashPaidSubject,
        welcomeUserSubject: settings.welcomeUserSubject,
      });

      if (res.success) {
        toast.success(res.message || "Email automation settings saved!");
      } else {
        toast.error(res.message || "Failed to update settings.");
      }
    });
  };

  const automationsList = [
    {
      id: "orderPlacedEmail",
      subjectKey: "orderPlacedSubject",
      title: "Order Placed & Invoice Receipt",
      description:
        "Dispatched immediately when a customer completes checkout or an admin creates a POS order. Includes order summary, item breakdown, and live tracking button.",
      icon: ShoppingBag,
      defaultSubject: "Order Confirmed #{orderCode} | Meawland 🐾",
      enabled: settings.orderPlacedEmail,
      subject: settings.orderPlacedSubject || "Order Confirmed #{orderCode} | Meawland 🐾",
    },
    {
      id: "orderDispatchedEmail",
      subjectKey: "orderDispatchedSubject",
      title: "Order Dispatched (Steadfast Courier)",
      description:
        "Dispatched when package is handed over to Steadfast Courier. Includes carrier name, consignment tracking code, and live tracking button.",
      icon: Truck,
      defaultSubject: "Your Order #{orderCode} is on the way! 🚚 | Meawland",
      enabled: settings.orderDispatchedEmail,
      subject: settings.orderDispatchedSubject || "Your Order #{orderCode} is on the way! 🚚 | Meawland",
    },
    {
      id: "orderDeliveredEmail",
      subjectKey: "orderDeliveredSubject",
      title: "Order Delivered Confirmation",
      description:
        "Dispatched automatically when Steadfast webhook delivers the package. Includes celebration banner and feedback request.",
      icon: CheckCircle2,
      defaultSubject: "Delivered! Order #{orderCode} | Meawland 🐾",
      enabled: settings.orderDeliveredEmail,
      subject: settings.orderDeliveredSubject || "Delivered! Order #{orderCode} | Meawland 🐾",
    },
    {
      id: "bkashPaymentPaidEmail",
      subjectKey: "bkashPaidSubject",
      title: "bKash Payment Verified",
      description:
        "Dispatched when bKash payment gateway executes successfully. Includes TrxID, amount paid, and invoice confirmation.",
      icon: CreditCard,
      defaultSubject: "bKash Payment Verified for Order #{orderCode} 💳 | Meawland",
      enabled: settings.bkashPaymentPaidEmail,
      subject: settings.bkashPaidSubject || "bKash Payment Verified for Order #{orderCode} 💳 | Meawland",
    },
    {
      id: "welcomeNewUserEmail",
      subjectKey: "welcomeUserSubject",
      title: "Welcome VIP Pet Parent",
      description:
        "Dispatched when a new customer registers an account on Meawland. Includes a 10% welcome coupon gift.",
      icon: UserPlus,
      defaultSubject: "Welcome to Meawland! 🐾 Enjoy 10% OFF Your First Pet Order",
      enabled: settings.welcomeNewUserEmail,
      subject: settings.welcomeUserSubject || "Welcome to Meawland! 🐾 Enjoy 10% OFF Your First Pet Order",
    },
    {
      id: "abandonedCartEmail",
      subjectKey: "abandonedCartSubject",
      title: "Abandoned Cart Recovery Reminder",
      description:
        "Automated nudge sent to users who left pet items in their cart without completing checkout.",
      icon: ShoppingCart,
      defaultSubject: "🐾 Your pet's favorite items are waiting in your cart!",
      enabled: settings.abandonedCartEmail,
      subject: "🐾 Your pet's favorite items are waiting in your cart!",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-[#EDF5FA] border border-[#D4EEFC]">
        <div>
          <h2 className="text-base font-black text-gray-900">
            Store Lifecycle Email Automations
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Configure automated transactional triggers that fire on store events.
          </p>
        </div>

        <Button
          size="sm"
          disabled={isPending}
          onClick={handleSave}
          className="h-9 text-xs font-bold gap-1.5 bg-[#0097a7] hover:bg-[#00838f] text-white rounded-xl shadow-xs cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Automation Settings</span>
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {automationsList.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.id}
              className={`rounded-3xl border transition-all ${
                item.enabled
                  ? "border-[#56C8D8] bg-white shadow-xs"
                  : "border-gray-200 bg-gray-50/50 opacity-80"
              }`}
            >
              <CardContent className="p-5 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-2xl ${
                        item.enabled
                          ? "bg-[#EDF5FA] text-[#0097a7]"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-gray-900">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          [item.id]: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0097a7]" />
                  </label>
                </div>

                {item.enabled && item.subjectKey && (
                  <div className="space-y-1 pt-2 border-t border-gray-100">
                    <Label className="text-[11px] font-bold text-gray-700 block">
                      Custom Email Subject Line
                    </Label>
                    <Input
                      value={item.subject}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          [item.subjectKey]: e.target.value,
                        })
                      }
                      className="h-8 text-xs bg-gray-50"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
