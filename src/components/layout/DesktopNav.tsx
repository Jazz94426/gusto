"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Avatar } from "@/components/ui";

export function DesktopNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const [showInstallModal, setShowInstallModal] = useState(false);

  const navItems = [
    { href: "/discover", match: "/discover", label: t("nav.discover"), icon: CompassIcon },
    { href: user ? "/recipes" : "/login", match: "/recipes", label: t("nav.my_recipes"), icon: BookIcon },
    { href: user ? "/collections" : "/login", match: "/collections", label: t("nav.collections"), icon: FolderIcon },
    { href: user ? "/pantry" : "/login", match: "/pantry", label: "Shopping", icon: ShoppingIcon },
    { href: user ? "/planner" : "/login", match: "/planner", label: t("nav.planner"), icon: CalendarIcon },
  ];

  return (
    <header className="hidden lg:flex print:hidden fixed top-6 left-0 right-0 z-50 justify-center pointer-events-none">
      <div className="flex items-center gap-6 h-14 px-3 bg-neutral-800 rounded-2xl shadow-2xl shadow-charcoal/20 pointer-events-auto w-max border border-white/10">
        {/* Logo */}
        <Link href="/" className="flex items-center px-6 py-2">
          <span className="font-heading text-xl tracking-wide text-white">
            Gusto
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navItems.map((item, index) => {
            const isActive = pathname.startsWith(item.match) && item.match !== "/";
            return (
              <Link
                key={`desktop-nav-${index}`}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white/70 hover:text-white transition-colors"
            aria-label={t("nav.toggle_language")}
          >
            <GlobeIcon className="w-4 h-4" />
            <span className="uppercase">{language}</span>
          </button>

          {/* Install App button */}
          <button
            onClick={() => setShowInstallModal(true)}
            className="flex items-center justify-center w-8 h-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Install iOS App"
          >
            <SmartphoneIcon className="w-4 h-4" />
          </button>

          {/* Import button */}
          <Link
            href="/import"
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#1B2D26] rounded-full text-sm font-semibold hover:bg-cream-dark transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Import
          </Link>

          {/* Profile / Login */}
          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-2">
                <Avatar
                  src={user.photoURL || undefined}
                  initials={(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                  size="sm"
                />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-elevated border border-stone-light/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-2">
                <div className="px-3 py-2 border-b border-stone-light/30 mb-1">
                  <p className="text-sm font-medium text-charcoal truncate">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-stone truncate">{user.email}</p>
                </div>
                <Link
                  href="/recipes/drafts"
                  className="block px-3 py-2 text-sm text-brown hover:bg-cream-dark rounded-lg transition-colors"
                >
                  {t("nav.drafts")}
                </Link>
                <button
                  onClick={signOut}
                  className="w-full text-left px-3 py-2 text-sm text-error hover:bg-error-light/30 rounded-lg transition-colors"
                >
                  {t("auth.sign_out")}
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-neutral-800 bg-white rounded-xl hover:bg-cream-dark transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-charcoal/40 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative animate-scale-in border border-stone-light/20">
            <button 
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-stone-light/20 text-stone hover:bg-stone-light/50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex justify-center mb-6 mt-2">
              <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                <span className="text-white font-heading text-3xl tracking-wider">G</span>
              </div>
            </div>
            <h3 className="text-xl font-heading text-neutral-800 text-center mb-2">Install Gusto</h3>
            <p className="text-sm text-stone text-center mb-6">Add Gusto to your iPhone home screen for a full app experience.</p>
            
            <div className="bg-cream rounded-2xl p-5 space-y-6 shadow-inner border border-stone-light/10">
              
              {/* Step 1 Graphic */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-neutral-800 text-white flex items-center justify-center font-bold text-xs">1</div>
                  <p className="text-sm font-semibold text-neutral-800">Tap the Share button</p>
                </div>
                <div className="bg-white rounded-xl border border-stone-light/20 p-2 shadow-sm flex items-center justify-center">
                  <div className="flex items-center justify-between w-full max-w-[200px] text-stone-light py-1 px-1">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                     <div className="relative">
                       <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                       <div className="absolute -inset-2 bg-blue-500/10 rounded-lg animate-pulse"></div>
                     </div>
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292" /></svg>
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /></svg>
                  </div>
                </div>
              </div>

              {/* Step 2 Graphic */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-neutral-800 text-white flex items-center justify-center font-bold text-xs">2</div>
                  <p className="text-sm font-semibold text-neutral-800">Select Add to Home Screen</p>
                </div>
                <div className="bg-white rounded-xl border border-stone-light/20 overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3 bg-white">
                    <span className="text-sm font-medium text-gray-800">Add to Home Screen</span>
                    <svg className="w-5 h-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect width="18" height="18" x="3" y="3" rx="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8" /></svg>
                  </div>
                </div>
              </div>

            </div>
            <div className="mt-6 flex justify-center">
               <button onClick={() => setShowInstallModal(false)} className="px-6 py-2.5 bg-neutral-800 text-white rounded-full font-semibold hover:bg-neutral-700 transition-colors w-full">Got it!</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ——— Inline SVG Icons ———

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    </svg>
  );
}

function ShoppingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.733-3.559" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function SmartphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01" />
    </svg>
  );
}
