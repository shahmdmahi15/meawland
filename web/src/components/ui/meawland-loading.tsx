"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface MeawlandLoadingProps {
  text?: string;
  subtext?: string;
  variant?: "fullscreen" | "page" | "card" | "admin";
  className?: string;
}

export function MeawlandLoading({
  text = "Loading pawsome treats...",
  subtext = "Fetching the freshest pet nutrition, grooming & accessories",
  variant = "page",
  className,
}: MeawlandLoadingProps) {
  if (variant === "fullscreen") {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md p-4",
          className,
        )}
      >
        <LoadingCard text={text} subtext={subtext} isAdmin={false} />
      </div>
    );
  }

  if (variant === "admin") {
    return (
      <div
        className={cn(
          "min-h-[60vh] flex flex-col items-center justify-center p-6",
          className,
        )}
      >
        <LoadingCard
          text={text || "Loading Admin Portal..."}
          subtext={subtext || "Preparing analytics, inventory & order logs"}
          isAdmin={true}
        />
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "p-8 rounded-3xl bg-[#F0F8FF]/50 border border-[#D4EEFC] flex flex-col items-center justify-center text-center",
          className,
        )}
      >
        <LoadingCard text={text} subtext={subtext} isCompact />
      </div>
    );
  }

  // Default "page" variant
  return (
    <div
      className={cn(
        "min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-white",
        className,
      )}
    >
      <LoadingCard text={text} subtext={subtext} isAdmin={false} />
    </div>
  );
}

function LoadingCard({
  text,
  subtext,
  isAdmin = false,
  isCompact = false,
}: {
  text: string;
  subtext?: string;
  isAdmin?: boolean;
  isCompact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center select-none",
        isCompact ? "max-w-xs space-y-2" : "max-w-sm sm:max-w-md space-y-4",
      )}
    >
      {/* Animated Meawland Loading Cat GIF Frame */}
      <div
        className={cn(
          "relative rounded-3xl flex items-center justify-center overflow-hidden border shadow-sm transition-all",
          isAdmin
            ? "bg-slate-50 border-slate-200"
            : "bg-gradient-to-b from-[#F0F8FF] to-white border-[#D4EEFC] shadow-[#56C8D8]/10",
          isCompact ? "w-24 h-24 p-2" : "w-36 h-36 sm:w-44 sm:h-44 p-3",
        )}
      >
        {/* Subtle Ambient Glow */}
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-xl opacity-30 pointer-events-none",
            isAdmin ? "bg-slate-400" : "bg-[#56C8D8]",
          )}
        />

        <div className="relative w-full h-full">
          <Image
            src="/loading.gif"
            alt="Meawland Loading Animation"
            fill
            sizes="180px"
            className="object-contain"
            priority
            unoptimized
          />
        </div>
      </div>

      {/* Text & Chewy Branding */}
      <div className="space-y-1">
        <h3
          className={cn(
            "font-black text-gray-900 tracking-tight",
            isAdmin
              ? "text-base sm:text-lg"
              : "text-lg sm:text-2xl text-[#56C8D8] font-[family-name:var(--font-chewy)] tracking-wide",
          )}
          style={
            !isAdmin ? { fontFamily: "var(--font-chewy), cursive" } : undefined
          }
        >
          {text}
        </h3>
        {subtext && (
          <p className="text-xs text-gray-500 font-medium max-w-xs mx-auto leading-relaxed">
            {subtext}
          </p>
        )}
      </div>

      {/* Animated Loading Dots */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        <span className="w-2 h-2 rounded-full bg-[#56C8D8] animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-[#56C8D8] animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-[#56C8D8] animate-bounce" />
      </div>
    </div>
  );
}
