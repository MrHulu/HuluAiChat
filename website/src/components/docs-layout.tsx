"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    title: "Getting Started",
    items: [
      { title: "Overview", href: "/docs" },
      { title: "Installation", href: "/docs/installation" },
      { title: "Quick Start", href: "/docs/quick-start" },
    ],
  },
  {
    title: "Features",
    items: [
      { title: "Multi-Model Support", href: "/docs/features/multi-model" },
      { title: "RAG Knowledge Base", href: "/docs/features/rag" },
      { title: "QuickPanel", href: "/docs/features/quick-panel" },
      { title: "Session Management", href: "/docs/features/sessions" },
    ],
  },
  {
    title: "Help",
    items: [
      { title: "FAQ", href: "/docs/faq" },
      { title: "Troubleshooting", href: "/docs/troubleshooting" },
    ],
  },
];

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="fixed top-0 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl z-50">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">💬</span>
            HuluChat
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/docs"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Docs
            </Link>
            <Link
              href="https://github.com/MrHulu/HuluAiChat"
              target="_blank"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              GitHub
            </Link>
            <Link
              href="https://github.com/MrHulu/HuluAiChat/releases/latest"
              target="_blank"
              className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Download
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] border-r border-zinc-800 overflow-y-auto hidden lg:block">
          <nav className="p-6 space-y-8">
            {navigation.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          pathname === item.href
                            ? "bg-zinc-800 text-white"
                            : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                        }`}
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 lg:ml-64">
          <div className="max-w-4xl mx-auto px-6 py-12 lg:py-20">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-xl z-50">
        <nav className="flex items-center justify-around py-3">
          <Link
            href="/docs"
            className={`flex flex-col items-center gap-1 ${
              pathname === "/docs" ? "text-white" : "text-zinc-400"
            }`}
          >
            <span>📚</span>
            <span className="text-xs">Docs</span>
          </Link>
          <Link
            href="/docs/installation"
            className={`flex flex-col items-center gap-1 ${
              pathname === "/docs/installation" ? "text-white" : "text-zinc-400"
            }`}
          >
            <span>⬇️</span>
            <span className="text-xs">Install</span>
          </Link>
          <Link
            href="https://github.com/MrHulu/HuluAiChat"
            target="_blank"
            className="flex flex-col items-center gap-1 text-zinc-400"
          >
            <span>🐙</span>
            <span className="text-xs">GitHub</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
