import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import { I18nProvider } from "@/components/I18nProvider";
import { getCurrentUser } from "@/lib/auth";
import type { Lang } from "@/lib/i18n";
import "./globals.css";

// Atkinson Hyperlegible: designed for legibility, distinguishes 0/O and 1/l/I,
// which matters for SKUs and prices read on a small screen.
const font = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Triye",
  description: "Mete pwodwi ou yon sèl fwa. Pibliye l kote kliyan ou ye.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A4654",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let lang: Lang = "ht";
  try {
    const user = await getCurrentUser();
    if (user) lang = user.preferences.language;
  } catch {
    // DB not reachable: keep the default language; pages show their own errors.
  }
  return (
    <html lang={lang} className={font.variable}>
      <body className="bg-paper font-sans text-ink antialiased">
        <I18nProvider lang={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
