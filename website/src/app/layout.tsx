import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "HuluChat - AI Chat Desktop Application",
  description: "A modern AI chat desktop application with multi-model support, folder organization, and beautiful UI. Powered by Tauri + React + FastAPI.",
  keywords: ["AI chat", "desktop app", "ChatGPT", "Claude", "GPT-4", "Tauri"],
  authors: [{ name: "HuluChat Team" }],
  openGraph: {
    title: "HuluChat - AI Chat Desktop Application",
    description: "A modern AI chat desktop application with multi-model support",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
