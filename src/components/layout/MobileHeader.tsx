"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  // Don't show header on login or home page if needed
  if (pathname === "/" || pathname === "/login") return null;

  let title = "";
  let showBack = false;

  if (pathname === "/discover") title = t("nav.discover") || "Découvrir";
  else if (pathname === "/recipes") title = t("nav.my_recipes") || "Mes Recettes";
  else if (pathname === "/import") title = t("common.import") || "Importer";
  else if (pathname === "/pantry") title = "Shopping";
  else if (pathname === "/planner") title = t("nav.planner") || "Planificateur";
  else if (pathname.startsWith("/recipes/")) {
    title = "Recette";
    showBack = true;
  }
  else if (pathname.startsWith("/collections/")) {
    title = "Collection";
    showBack = true;
  }

  // Fallback
  if (!title) return null;

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-stone-light/30 pt-safe select-none">
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="w-10 flex items-center justify-start">
          {showBack && (
            <button 
              onClick={() => {
                if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
                router.back();
              }}
              className="p-2 -ml-2 active:opacity-50 transition-opacity"
            >
              <ChevronLeft className="w-7 h-7 text-terracotta" strokeWidth={2.5} />
            </button>
          )}
        </div>
        
        <h1 className="text-lg font-bold text-charcoal flex-1 text-center truncate px-2 font-heading tracking-wide">
          {title}
        </h1>
        
        <div className="w-10 flex items-center justify-end">
          {/* Optional right action icon */}
        </div>
      </div>
    </header>
  );
}
