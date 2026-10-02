import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NetworkStatus } from "@/components/states/NetworkStatus";
import { SiteJsonLd } from "@/components/SiteJsonLd";
import { HideOnAdmin } from "@/components/SiteChrome";
import { getStaffUser } from "@/lib/auth";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { RouteProgress } from "@/components/motion/RouteProgress";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { WhatsAppGroups } from "@/components/WhatsAppGroups";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { LiveChat } from "@/components/LiveChat";
import { BrandProvider } from "@/components/BrandProvider";
import { getBrandLogo } from "@/lib/brand";
import { gaMeasurementId } from "@/lib/analytics";
import { SITE_NAME, siteMetadata } from "@/lib/seo";
import { requestSiteUrl } from "@/lib/site-url";
import { getSetting, getSettings } from "@/lib/settings";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });

/** Root metadata defaults come from Admin → Site → SEO (`seo` settings); brand name from the business profile. */
export async function generateMetadata(): Promise<Metadata> {
  const { seo, business } = await getSettings();
  return siteMetadata(seo, business.name || SITE_NAME, await requestSiteUrl());
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf8f1",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [announcement, business, seo, staffViewer] = await Promise.all([getSetting("announcement"), getSetting("business"), getSetting("seo"), getStaffUser()]);
  const whatsapp = (business.whatsapp || process.env.STORE_WHATSAPP || "").replace(/\D/g, "");
  const isStaffViewer = !!staffViewer;
  // Staff browsing the shop would skew the numbers, so they are never tracked.
  const gaId = isStaffViewer ? null : gaMeasurementId(seo.gaMeasurementId);
  const brand = await getBrandLogo();
  const chatKey = isStaffViewer ? "" : (business.smartsuppKey || process.env.NEXT_PUBLIC_SMARTSUPP_KEY || "").trim();
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body className="min-h-screen bg-paper">
        {gaId && <GoogleAnalytics id={gaId} />}
        <BrandProvider brand={brand}>
        <RouteProgress />
        <MotionProvider>
          <HideOnAdmin active={isStaffViewer}>
            <WhatsAppGroups />
            {announcement.enabled && <AnnouncementBar settings={announcement} />}
            <Header />
          </HideOnAdmin>
          <main className="min-w-0">{children}</main>
          <HideOnAdmin active={isStaffViewer}>
            <Footer />
          </HideOnAdmin>
        </MotionProvider>
        <WhatsAppButton number={whatsapp} businessName={business.name || SITE_NAME} />
        <NetworkStatus />
        </BrandProvider>
        {chatKey && <LiveChat chatKey={chatKey} />}
        <SiteJsonLd />
      </body>
    </html>
  );
}
