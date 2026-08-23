"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  installApp: () => Promise<void>;
  dismissPrompt: () => void;
  showPrompt: boolean;
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  isInstalled: false,
  installApp: async () => {},
  dismissPrompt: () => {},
  showPrompt: false,
});

export const usePWA = () => useContext(PWAContext);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Service Worker Registration
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    // 2. Check if already running in standalone mode (installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    if (isStandalone) {
      queueMicrotask(() => setIsInstalled(true));
    }

    // 3. Listen to beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);

      // Check if user previously dismissed in last 3 days
      const lastDismissed = localStorage.getItem("meawland_pwa_dismissed");
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      if (!lastDismissed || parseInt(lastDismissed, 10) < threeDaysAgo) {
        // Show after 3 seconds on page
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }
    };

    // 4. Online/Offline Network Status
    const handleOnline = () => {
      toast.success("Back Online! 🐾", {
        description: "Your network connection has been restored.",
      });
    };

    const handleOffline = () => {
      toast.warning("You are Offline 🐾", {
        description: "Viewing cached content. Some features may be limited.",
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      toast.info("Installation unavailable or already installed.");
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        toast.success("Thank you for installing Meawland! 🐾");
        setIsInstalled(true);
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (err) {
      console.error("[PWA Install Error]:", err);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem("meawland_pwa_dismissed", Date.now().toString());
  };

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        installApp,
        dismissPrompt,
        showPrompt,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}
