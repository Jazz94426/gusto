"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function PWAInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // default true to avoid flash
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if already installed
    const isStand = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone === true;
    setIsStandalone(isStand);

    // If on iOS and not installed, and user hasn't dismissed it
    if (isIosDevice && !isStand) {
      const hasDismissed = localStorage.getItem("pwa-prompt-dismissed");
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[60] bg-white rounded-2xl shadow-elevated border border-stone-light/30 p-4 animate-slide-up lg:hidden">
      <button onClick={handleDismiss} className="absolute top-3 right-3 text-stone hover:text-charcoal transition-colors">
        <X size={18} />
      </button>
      
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-terracotta rounded-xl flex items-center justify-center shrink-0 shadow-sm">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-charcoal text-sm">Installer Gusto</h3>
          <p className="text-xs text-stone-dark mt-1 leading-snug">
            Pour une meilleure expérience, appuyez sur <span className="font-bold text-charcoal">Partager</span> puis <span className="font-bold text-charcoal">Sur l'écran d'accueil</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
