"use client";

import React from "react";
import Image from "next/image";
import { Download, X, Sparkles } from "lucide-react";
import { usePWA } from "@/components/providers/pwa-provider";
import { Button } from "@/components/ui/button";

export function PWAInstallPrompt() {
  const { showPrompt, isInstalled, installApp, dismissPrompt } = usePWA();

  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100%-2rem)] sm:w-96 bg-white/95 backdrop-blur-xl border border-[#D4EEFC] rounded-3xl p-4 sm:p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="flex items-start justify-between gap-3">
        {/* App Logo */}
        <div className="relative w-12 h-12 rounded-2xl bg-[#F0F8FF] border border-[#D4EEFC] flex items-center justify-center shrink-0 p-1 overflow-hidden shadow-xs">
          <Image
            src="/logo.png"
            alt="Meawland App"
            width={44}
            height={44}
            className="object-contain"
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-black text-gray-900">
              Install Meawland App
            </span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase border border-emerald-200">
              <Sparkles className="w-2.5 h-2.5" />
              1-Tap
            </span>
          </div>
          <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
            Get faster checkout, instant tracking, and offline pet care
            essentials.
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={dismissPrompt}
          className="text-gray-400 hover:text-gray-700 p-1 rounded-full cursor-pointer transition-colors"
          aria-label="Dismiss app prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="mt-3.5 flex items-center gap-2">
        <Button
          type="button"
          onClick={installApp}
          className="flex-1 h-9 rounded-2xl bg-[#56C8D8] hover:bg-[#38bdf8] text-white text-xs font-bold shadow-md gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Install App
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={dismissPrompt}
          className="h-9 px-3 rounded-2xl text-xs font-bold text-gray-500 hover:text-gray-800"
        >
          Not Now
        </Button>
      </div>
    </div>
  );
}
