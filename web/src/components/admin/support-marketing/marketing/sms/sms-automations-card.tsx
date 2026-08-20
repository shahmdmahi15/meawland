"use client";

import React, { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SmsAutomationSettingsSummary } from "@/actions/admin/support-marketing/marketing/sms/automations";
import { updateSmsAutomationSettingsAction } from "@/actions/admin/support-marketing/marketing/sms/automations";
import { TestSmsModal } from "./test-sms-modal";
import { toast } from "sonner";
import {
  Zap,
  ShoppingBag,
  Truck,
  CheckCircle2,
  CreditCard,
  Save,
  Loader2,
} from "lucide-react";

interface SmsAutomationsCardProps {
  initialSettings: SmsAutomationSettingsSummary;
}

export function SmsAutomationsCard({
  initialSettings,
}: SmsAutomationsCardProps) {
  const [orderPlacedSms, setOrderPlacedSms] = useState(
    initialSettings.orderPlacedSms,
  );
  const [orderDispatchedSms, setOrderDispatchedSms] = useState(
    initialSettings.orderDispatchedSms,
  );
  const [orderDeliveredSms, setOrderDeliveredSms] = useState(
    initialSettings.orderDeliveredSms,
  );
  const [bkashPaymentPaidSms, setBkashPaymentPaidSms] = useState(
    initialSettings.bkashPaymentPaidSms,
  );

  const [orderPlacedTemplate, setOrderPlacedTemplate] = useState(
    initialSettings.orderPlacedTemplate ||
      "Dear {name}, your Meawland order #{orderCode} (BDT {amount}) is confirmed! We are preparing your pet essentials. Track live: {trackingUrl}",
  );
  const [orderDispatchedTemplate, setOrderDispatchedTemplate] = useState(
    initialSettings.orderDispatchedTemplate ||
      "Your Meawland order #{orderCode} is on the way via Steadfast Courier! Tracking: {trackingCode}. Track live: {trackingUrl}",
  );
  const [orderDeliveredTemplate, setOrderDeliveredTemplate] = useState(
    initialSettings.orderDeliveredTemplate ||
      "Dear {name}, your Meawland order #{orderCode} has been delivered! Thank you for choosing Meawland for your pet needs.",
  );
  const [bkashPaidTemplate, setBkashPaidTemplate] = useState(
    initialSettings.bkashPaidTemplate ||
      "bKash Payment Verified! 🐾 Order #{orderCode} of BDT {amount} (TrxID: {trxID}) has been received successfully. Thank you!",
  );

  const [isSaving, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateSmsAutomationSettingsAction({
        orderPlacedSms,
        orderDispatchedSms,
        orderDeliveredSms,
        bkashPaymentPaidSms,
        orderPlacedTemplate,
        orderDispatchedTemplate,
        orderDeliveredTemplate,
        bkashPaidTemplate,
      });

      if (res.success) {
        toast.success(res.message || "Automation settings updated!");
      } else {
        toast.error(res.message || "Failed to update settings.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Automated Ecommerce Lifecycle SMS Triggers</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Automatically notify customers via SMS on critical order lifecycle events.
          </p>
        </div>

        <Button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="h-8 text-xs font-bold gap-1.5 bg-[#0097a7] hover:bg-[#00838f] text-white shadow-xs cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Trigger Settings</span>
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Order Placed Trigger */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-gray-900">
                  1. Order Placed Confirmation
                </h4>
                <p className="text-[11px] text-gray-500">
                  Triggered when customer places a web or POS order.
                </p>
              </div>
            </div>
            <Switch
              checked={orderPlacedSms}
              onCheckedChange={setOrderPlacedSms}
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <Label className="text-[11px] font-bold text-gray-700">
                Notification Template
              </Label>
              <TestSmsModal messageContent={orderPlacedTemplate} />
            </div>
            <Textarea
              rows={3}
              disabled={!orderPlacedSms}
              value={orderPlacedTemplate}
              onChange={(e) => setOrderPlacedTemplate(e.target.value)}
              className="text-xs bg-gray-50/50 leading-relaxed font-sans"
            />
            <span className="text-[10px] text-gray-400">
              Tags: {"{name}"}, {"{orderCode}"}, {"{amount}"}, {"{trackingUrl}"}
            </span>
          </div>
        </div>

        {/* 2. Steadfast Dispatched Trigger */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-gray-900">
                  2. Steadfast Parcel Dispatched
                </h4>
                <p className="text-[11px] text-gray-500">
                  Triggered when order is sent to Steadfast Courier.
                </p>
              </div>
            </div>
            <Switch
              checked={orderDispatchedSms}
              onCheckedChange={setOrderDispatchedSms}
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <Label className="text-[11px] font-bold text-gray-700">
                Notification Template
              </Label>
              <TestSmsModal messageContent={orderDispatchedTemplate} />
            </div>
            <Textarea
              rows={3}
              disabled={!orderDispatchedSms}
              value={orderDispatchedTemplate}
              onChange={(e) => setOrderDispatchedTemplate(e.target.value)}
              className="text-xs bg-gray-50/50 leading-relaxed font-sans"
            />
            <span className="text-[10px] text-gray-400">
              Tags: {"{name}"}, {"{orderCode}"}, {"{trackingCode}"}, {"{trackingUrl}"}
            </span>
          </div>
        </div>

        {/* 3. Order Delivered Trigger */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-gray-900">
                  3. Order Delivered Celebration
                </h4>
                <p className="text-[11px] text-gray-500">
                  Triggered when parcel is delivered to customer.
                </p>
              </div>
            </div>
            <Switch
              checked={orderDeliveredSms}
              onCheckedChange={setOrderDeliveredSms}
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <Label className="text-[11px] font-bold text-gray-700">
                Notification Template
              </Label>
              <TestSmsModal messageContent={orderDeliveredTemplate} />
            </div>
            <Textarea
              rows={3}
              disabled={!orderDeliveredSms}
              value={orderDeliveredTemplate}
              onChange={(e) => setOrderDeliveredTemplate(e.target.value)}
              className="text-xs bg-gray-50/50 leading-relaxed font-sans"
            />
            <span className="text-[10px] text-gray-400">
              Tags: {"{name}"}, {"{orderCode}"}
            </span>
          </div>
        </div>

        {/* 4. bKash Payment Paid Trigger */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-pink-50 text-[#e2136e]">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-gray-900">
                  4. bKash Payment Verified
                </h4>
                <p className="text-[11px] text-gray-500">
                  Triggered when bKash online payment is confirmed.
                </p>
              </div>
            </div>
            <Switch
              checked={bkashPaymentPaidSms}
              onCheckedChange={setBkashPaymentPaidSms}
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <Label className="text-[11px] font-bold text-gray-700">
                Notification Template
              </Label>
              <TestSmsModal messageContent={bkashPaidTemplate} />
            </div>
            <Textarea
              rows={3}
              disabled={!bkashPaymentPaidSms}
              value={bkashPaidTemplate}
              onChange={(e) => setBkashPaidTemplate(e.target.value)}
              className="text-xs bg-gray-50/50 leading-relaxed font-sans"
            />
            <span className="text-[10px] text-gray-400">
              Tags: {"{name}"}, {"{orderCode}"}, {"{amount}"}, {"{trxID}"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
