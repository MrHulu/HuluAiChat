import { DocsLayout } from "@/components/docs-layout";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation - HuluChat",
  description: "Learn how to install, configure, and use HuluChat - a privacy-first AI chat desktop application.",
};

const quickLinks = [
  {
    title: "Installation",
    description: "Download and install HuluChat on Windows, macOS, or Linux",
    icon: "⬇️",
    href: "/docs/installation",
  },
  {
    title: "Quick Start",
    description: "Get started with your first AI conversation in minutes",
    icon: "🚀",
    href: "/docs/quick-start",
  },
  {
    title: "Multi-Model Support",
    description: "Switch between GPT-4, Claude, DeepSeek, and local models",
    icon: "🤖",
    href: "/docs/features/multi-model",
  },
  {
    title: "RAG Knowledge Base",
    description: "Upload documents and chat with your knowledge",
    icon: "📚",
    href: "/docs/features/rag",
  },
  {
    title: "FAQ",
    description: "Frequently asked questions and answers",
    icon: "❓",
    href: "/docs/faq",
  },
  {
    title: "Troubleshooting",
    description: "Common issues and how to fix them",
    icon: "🔧",
    href: "/docs/troubleshooting",
  },
];

export default function DocsPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Documentation</h1>
        <p className="text-xl text-zinc-400">
          Welcome to HuluChat documentation. Learn how to install, configure, and use all the features.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-4 mb-12">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{link.icon}</span>
              <div>
                <h3 className="font-semibold text-lg group-hover:text-white transition-colors">
                  {link.title}
                </h3>
                <p className="text-zinc-400 text-sm mt-1">{link.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Getting Help */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
        <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="https://github.com/MrHulu/HuluAiChat/issues"
            target="_blank"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            🐛 Report a Bug
          </Link>
          <Link
            href="https://github.com/MrHulu/HuluAiChat/discussions"
            target="_blank"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            💬 Ask a Question
          </Link>
          <Link
            href="https://github.com/MrHulu/HuluAiChat"
            target="_blank"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ⭐ Star on GitHub
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
