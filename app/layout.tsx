/** Root layout: fonts, global styles, and auth/decision providers for every page. */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Instrument_Serif } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { DecisionProvider } from "@/components/decisions/DecisionProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

/** Browser tab title and description for the whole app. */
export const metadata: Metadata = {
  title: "ICReady AI",
  description: "Investment diligence copilot for pipeline to IC readiness",
};

/** Wraps every page with fonts, auth state, and IC decision state. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased font-sans`}
      >
        <AuthProvider>
          <DecisionProvider>{children}</DecisionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
