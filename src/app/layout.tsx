import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { QueryProvider } from "@/components/query-provider";
import { TelegramProvider } from "@/components/telegram/telegram-provider";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap"
});

export const metadata: Metadata = {
  title: "هم مسیر",
  description: "یک مسیر، هزار تجربه",
  icons: {
    icon: "/brand/ham-masir-icon.png",
    apple: "/brand/ham-masir-icon.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1E3A8A"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body>
        <QueryProvider>
          <TelegramProvider>{children}</TelegramProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
