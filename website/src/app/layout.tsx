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
  metadataBase: new URL("https://huluchat-website.pages.dev"),
  title: "HuluChat - Privacy-First AI Chat Desktop App",
  description: "A beautiful, fast, and private AI chat desktop application. Support for GPT-4, Claude, DeepSeek, local models, and RAG. Cross-platform (Windows, macOS, Linux). Free & Open Source.",
  keywords: ["AI chat", "desktop app", "ChatGPT", "Claude", "DeepSeek", "GPT-4", "Tauri", "LLM", "AI assistant", "open source", "RAG", "privacy", "offline AI"],
  authors: [{ name: "HuluChat Team" }],
  alternates: {
    canonical: "https://huluchat-website.pages.dev",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
  openGraph: {
    title: "HuluChat - Privacy-First AI Chat Desktop App",
    description: "A beautiful, fast, and private AI chat desktop application with RAG support. Cross-platform. Free & Open Source.",
    type: "website",
    url: "https://huluchat-website.pages.dev",
    images: ["/icon.png"],
    siteName: "HuluChat",
  },
  twitter: {
    card: "summary_large_image",
    title: "HuluChat - Privacy-First AI Chat Desktop App",
    description: "A beautiful, fast, and private AI chat desktop application with RAG support.",
    images: ["/icon.png"],
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
