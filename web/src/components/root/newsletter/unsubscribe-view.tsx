"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { unsubscribeNewsletterAction } from "@/actions/root/newsletter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

interface UnsubscribeViewProps {
  initialEmail?: string;
}

export function UnsubscribeView({ initialEmail = "" }: UnsubscribeViewProps) {
  const [email, setEmail] = useState(initialEmail);
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleUnsubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    startTransition(async () => {
      const res = await unsubscribeNewsletterAction(email);
      if (res.success) {
        setIsUnsubscribed(true);
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6 text-center">
      {/* Header Icon */}
      <div className="mx-auto w-14 h-14 rounded-2xl bg-[#EDF5FA] border border-[#D4EEFC] flex items-center justify-center text-[#56C8D8]">
        {isUnsubscribed ? (
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        ) : (
          <Mail className="w-7 h-7" />
        )}
      </div>

      <div className="space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          {isUnsubscribed ? "You're Unsubscribed" : "Newsletter Preferences"}
        </h1>
        <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
          {isUnsubscribed
            ? "We're sorry to see you go! You will no longer receive weekly VIP discounts and grooming tips from Meawland."
            : "Enter your email address to unsubscribe from Meawland marketing announcements."}
        </p>
      </div>

      {isUnsubscribed ? (
        <div className="space-y-4 pt-2">
          <Link href="/" className="block">
            <Button className="w-full h-11 rounded-2xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs gap-2 shadow-xs cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Storefront</span>
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleUnsubscribe} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              Email Address
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@example.com"
              required
              className="h-11 rounded-2xl bg-gray-50/80 border-gray-200 text-xs"
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-11 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-2 shadow-xs cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            <span>Unsubscribe from Newsletter</span>
          </Button>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-gray-500 hover:text-gray-900 font-semibold inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
