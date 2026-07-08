import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { AppDataProvider } from "@/context/AppDataContext";
import ScrollReloadGuard from "@/components/ScrollReloadGuard";
import LateGuard from "@/components/LateGuard";
import GlobalAlert from "@/components/GlobalAlert";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FaceAttend",
  description: "Employee Attendance System for Creativemu",
  other: {
    google: "notranslate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      translate="no"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} notranslate h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="notranslate min-h-full flex flex-col"
      >
        <AppDataProvider>
          <ScrollReloadGuard />
          <LateGuard />
          <GlobalAlert />
          {children}
        </AppDataProvider>
      </body>
    </html>
  );
}
