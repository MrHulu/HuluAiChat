import { DocsLayout } from "@/components/docs-layout";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quick Start - HuluChat Docs",
  description: "Get started with HuluChat in minutes. Configure your AI provider and start your first conversation.",
};

const keyboardShortcuts = [
  { keys: ["Ctrl", "N"], description: "New chat" },
  { keys: ["Ctrl", "Shift", "Space"], description: "Open QuickPanel" },
  { keys: ["Ctrl", "F"], description: "Search messages" },
  { keys: ["Ctrl", ","], description: "Open settings" },
  { keys: ["Ctrl", "Shift", "?"], description: "Show keyboard shortcuts" },
  { keys: ["Ctrl", "E"], description: "Export current chat" },
];

export default function QuickStartPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Quick Start</h1>
        <p className="text-xl text-zinc-400">
          Get started with your first AI conversation in minutes.
        </p>
      </div>

      {/* Step 1: Configure API */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">1. Configure Your AI Provider</h2>
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-zinc-300 mb-4">
            HuluChat supports multiple AI providers. Choose one to get started:
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-zinc-800/50">
              <h3 className="font-semibold mb-2">🤖 OpenAI</h3>
              <p className="text-sm text-zinc-400 mb-2">
                Get your API key from{" "}
                <Link
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  className="text-blue-400 hover:underline"
                >
                  platform.openai.com
                </Link>
              </p>
              <code className="text-xs text-zinc-500">Base URL: https://api.openai.com/v1</code>
            </div>

            <div className="p-4 rounded-lg bg-zinc-800/50">
              <h3 className="font-semibold mb-2">🧠 DeepSeek</h3>
              <p className="text-sm text-zinc-400 mb-2">
                Get your API key from{" "}
                <Link
                  href="https://platform.deepseek.com/"
                  target="_blank"
                  className="text-blue-400 hover:underline"
                >
                  platform.deepseek.com
                </Link>
              </p>
              <code className="text-xs text-zinc-500">Base URL: https://api.deepseek.com</code>
            </div>

            <div className="p-4 rounded-lg bg-zinc-800/50">
              <h3 className="font-semibold mb-2">🏠 Local Models (Ollama)</h3>
              <p className="text-sm text-zinc-400 mb-2">
                Run models locally with{" "}
                <Link
                  href="https://ollama.com/"
                  target="_blank"
                  className="text-blue-400 hover:underline"
                >
                  Ollama
                </Link>
              </p>
              <code className="text-xs text-zinc-500">Base URL: http://localhost:11434/v1</code>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg border border-zinc-700 bg-zinc-800/30">
            <h4 className="font-medium mb-2">Configuration Steps:</h4>
            <ol className="space-y-2 text-sm text-zinc-400">
              <li>1. Click the ⚙️ Settings icon in the sidebar</li>
              <li>2. Enter your API Key</li>
              <li>3. (Optional) Change Base URL if using a custom provider</li>
              <li>4. Click Save</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Step 2: Start Chatting */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">2. Start Your First Chat</h2>
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-zinc-300 mb-4">
            Click the &quot;+&quot; button in the sidebar or press{" "}
            <kbd className="px-2 py-1 rounded bg-zinc-800 text-xs">Ctrl</kbd>+<kbd className="px-2 py-1 rounded bg-zinc-800 text-xs">N</kbd> to create a new chat.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">💬</span>
              <div>
                <h4 className="font-medium">Type your message</h4>
                <p className="text-sm text-zinc-400">
                  Enter your question or prompt in the input box at the bottom
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xl">⚡</span>
              <div>
                <h4 className="font-medium">Get instant responses</h4>
                <p className="text-sm text-zinc-400">
                  AI responds with streaming text for a real-time experience
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xl">🔄</span>
              <div>
                <h4 className="font-medium">Switch models anytime</h4>
                <p className="text-sm text-zinc-400">
                  Use the model selector to switch between different AI models
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 3: Organize */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">3. Organize Your Chats</h2>
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-zinc-300 mb-4">
            Keep your conversations organized with folders and tags:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-zinc-800/50">
              <h4 className="font-medium mb-2">📁 Folders</h4>
              <p className="text-sm text-zinc-400">
                Create folders to group related conversations together. Right-click
                in the sidebar to create a new folder.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-800/50">
              <h4 className="font-medium mb-2">🏷️ Tags</h4>
              <p className="text-sm text-zinc-400">
                Add tags to sessions for easy filtering. Use the tag button in the
                chat header to manage tags.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-800/50">
              <h4 className="font-medium mb-2">🔖 Bookmarks</h4>
              <p className="text-sm text-zinc-400">
                Bookmark important messages for quick access later. Click the
                bookmark icon on any message.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-800/50">
              <h4 className="font-medium mb-2">🔍 Search</h4>
              <p className="text-sm text-zinc-400">
                Search across all your conversations. Press{" "}
                <kbd className="px-2 py-1 rounded bg-zinc-800 text-xs">Ctrl</kbd>+<kbd className="px-2 py-1 rounded bg-zinc-800 text-xs">F</kbd> to search.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Keyboard Shortcuts</h2>
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-2 text-zinc-400 font-medium">Shortcut</th>
                <th className="text-left py-2 text-zinc-400 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {keyboardShortcuts.map((shortcut) => (
                <tr key={shortcut.description} className="border-b border-zinc-800/50">
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, index) => (
                        <span key={index}>
                          <kbd className="px-2 py-1 rounded bg-zinc-800 text-xs">
                            {key}
                          </kbd>
                          {index < shortcut.keys.length - 1 && (
                            <span className="text-zinc-600 mx-1">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 text-zinc-300">{shortcut.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Next Steps */}
      <div className="mt-12 flex items-center justify-between">
        <Link
          href="/docs/installation"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          ← Installation
        </Link>
        <Link
          href="/docs/features/multi-model"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          Multi-Model Support →
        </Link>
      </div>
    </DocsLayout>
  );
}
