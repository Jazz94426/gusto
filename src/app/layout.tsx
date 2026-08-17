import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { DesktopNav } from "@/components/layout/DesktopNav";
import { MobileNav } from "@/components/layout/MobileNav";
import { PageTransition } from "@/components/ui/PageTransition";

const dmSerif = DM_Serif_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gusto — Votre compagnon culinaire",
  description:
    "Gérez vos recettes, planifiez vos repas et organisez votre garde-manger intelligent avec Gusto.",
  keywords: ["recettes", "cuisine", "planificateur repas", "garde-manger", "courses"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gusto",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FDF6EE",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${dmSerif.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-cream text-charcoal font-body antialiased pt-safe">
        <Providers>
          {/* Desktop top navigation - hidden on mobile */}
          <DesktopNav />

          {/* Main content area */}
          <main className="flex-1 pb-20 lg:pb-0 lg:pt-[72px] flex flex-col">
            <PageTransition>{children}</PageTransition>
          </main>

          {/* Mobile bottom navigation - hidden on desktop */}
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
