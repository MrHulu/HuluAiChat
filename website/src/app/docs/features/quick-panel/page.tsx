import { DocsLayout } from "@/components/docs-layout";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "QuickPanel - HuluChat Docs",
  description: "Use QuickPanel for instant AI access from anywhere. Global shortcut to chat without switching windows.",
};

export default function QuickPanelPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">QuickPanel</h1>
        <p className="text-xl text-zinc-400">
          Instant AI access from anywhere. Press a global shortcut to open QuickPanel
          and chat without leaving your current application.
        </p>
      </div>

      {/* What is QuickPanel */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">What is QuickPanel?</h2>
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-zinc-300 mb-4">
            QuickPanel is a floating window that lets you quickly interact with AI
            without switching to the main HuluChat window. It&apos;s perfect for:
          </p>

          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span className="text-zinc-300">Quick questions while coding</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span className="text-zinc-300">Looking up information without context switching</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span className="text-zinc-300">Drafting emails or messages with AI assistance</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span className="text-zinc-300">Quick translations or explanations</span>
            </li>
          </ul>
        </div>
      </section>

      {/* How to Use */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">How to Use</h2>
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50 mb-6">
            <kbd className="px-4 py-2 rounded bg-zinc-700 text-lg font-mono">
              Ctrl + Shift + Space
            </kbd>
            <span className="text-zinc-400">Press anywhere to open QuickPanel</span>
          </div>

          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                1
              </span>
              <div>
                <h4 className="font-medium">Press the global shortcut</h4>
                <p className="text-sm text-zinc-400">
                  <kbd className="px-2 py-1 rounded bg-zinc-800 text-xs">Ctrl</kbd> + <kbd className="px-2 py-1 rounded bg-zinc-800 text-xs">Shift</kbd> + <kbd className="px-2 py-1 rounded bg-zinc-800 text-xs">Space</kbd> on Windows/Linux
                  <br />
                  <kbd className="px-2 py-1 rounded bg-zinc-800 text-xs">Cmd</kbd> + <kbd className="px-2 py-1 rounded bg-zinc-800 text-xs">Shift</kbd> + <kbd className="px-2 py-1 rounded bg-zinc-800 text-xs">Space</kbd> on macOS
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                2
              </span>
              <div>
                <h4 className="font-medium">Type your question</h4>
                <p className="text-sm text-zinc-400">
                  The QuickPanel appears as a floating window. Type your prompt and press Enter.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                3
              </span>
              <div>
                <h4 className="font-medium">Get instant answers</h4>
                <p className="text-sm text-zinc-400">
                  AI responds in the panel. You can continue the conversation or close when done.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                4
              </span>
              <div>
                <h4 className="font-medium">Press Escape to close</h4>
                <p className="text-sm text-zinc-400">
                  The conversation is saved and can be continued later.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Features</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
            <h4 className="font-medium mb-2">🌐 Always on Top</h4>
            <p className="text-sm text-zinc-400">
              QuickPanel floats above all windows, always accessible.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
            <h4 className="font-medium mb-2">📋 Clipboard History</h4>
            <p className="text-sm text-zinc-400">
              Access recent clipboard items for quick pasting.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
            <h4 className="font-medium mb-2">📜 Session History</h4>
            <p className="text-sm text-zinc-400">
              Continue previous QuickPanel conversations.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
            <h4 className="font-medium mb-2">⚡ Fast Response</h4>
            <p className="text-sm text-zinc-400">
              Optimized for quick interactions with minimal UI.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between">
        <Link
          href="/docs/features/rag"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          ← RAG Knowledge Base
        </Link>
        <Link
          href="/docs/features/sessions"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          Session Management →
        </Link>
      </div>
    </DocsLayout>
  );
}
