import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { UmamiScript } from "@/components/analytics/umami-script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gym Buddy",
  description: "Mood-based workout ideas from a friendly gym buddy.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <UmamiScript />
      </body>
    </html>
  );
}
