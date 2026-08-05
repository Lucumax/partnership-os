import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://partnership-os-one.vercel.app"),
  title: "Partnership OS",
  description: "Defensible partnership decisions when the comparables are thin.",
  openGraph: {
    title: "Partnership OS",
    description: "Defensible partnership decisions when the comparables are thin.",
    siteName: "Partnership OS",
    type: "website",
    locale: "en_US",
    url: "https://partnership-os-one.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Partnership OS",
    description: "Defensible partnership decisions when the comparables are thin.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
