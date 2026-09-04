"use client"

import React, { useEffect, useState } from "react"
import { Download, Bell, BellRing, X, Smartphone, Check } from "lucide-react"

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("Service Worker registration failed:", err);
        });
    }

    // 2. Check Notification Permission
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }

    // 3. Capture PWA Install Prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Don't show if dismissed in this session
      const dismissed = sessionStorage.getItem("pwa_prompt_dismissed");
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
  };

  const handleEnableNotification = async () => {
    if (!("Notification" in window)) {
      alert("Browser Anda tidak mendukung Web Push Notifications.");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === "granted") {
        new Notification("Audira-YT Studio", {
          body: "🎉 Notifikasi Web Realtime berhasil diaktifkan! Anda akan menerima update live view surge dan klaim hak cipta.",
          icon: "/favicon.ico"
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!showPrompt && notificationPermission === "granted") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full px-2 pointer-events-auto transition-all animate-in slide-in-from-bottom-5">
      <div className="bg-yellow-300 border-3 border-black p-4 shadow-[6px_6px_0_0_#000] flex flex-col gap-2.5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="bg-black text-yellow-300 p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Smartphone className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-black text-xs uppercase text-black">AUDIRA-YT APP & NOTIFIKASI</h4>
              <p className="text-[10px] font-bold text-gray-800">
                {showPrompt
                  ? "Pasang aplikasi di Desktop/HP untuk akses lebih cepat dan stabil."
                  : "Aktifkan notifikasi untuk peringatan klaim hak cipta & lonjakan viewer."}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-black hover:text-red-600 font-mono font-black text-xs p-1"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {showPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-black hover:bg-zinc-800 text-yellow-300 font-black py-2 px-3 text-[10px] uppercase border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> INSTALL APLIKASI
            </button>
          )}

          {notificationPermission !== "granted" && (
            <button
              onClick={handleEnableNotification}
              className="flex-1 bg-white hover:bg-yellow-100 text-black font-black py-2 px-3 text-[10px] uppercase border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center gap-1.5"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-600" /> AKTIFKAN NOTIF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
