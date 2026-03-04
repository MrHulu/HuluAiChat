import Link from "next/link";

const features = [
  {
    icon: "🤖",
    title: "Multi-Model Support",
    description: "Switch between GPT-4, Claude, and other AI models instantly. One app for all your AI needs.",
  },
  {
    icon: "📁",
    title: "Folder Organization",
    description: "Organize your conversations into folders. Keep your chats tidy and easy to find.",
  },
  {
    icon: "🌙",
    title: "Dark Mode",
    description: "Beautiful dark mode that's easy on the eyes. Perfect for late-night coding sessions.",
  },
  {
    icon: "⚡",
    title: "Lightning Fast",
    description: "Built with Tauri for native performance. Starts in milliseconds, not seconds.",
  },
  {
    icon: "📤",
    title: "Export Conversations",
    description: "Export your chats as Markdown, JSON, or plain text. Your data, your choice.",
  },
  {
    icon: "🔄",
    title: "Auto Update",
    description: "Always stay up to date with automatic updates. No manual downloads needed.",
  },
];

const platforms = [
  {
    name: "Windows",
    icon: "🪟",
    url: "https://github.com/MrHulu/HuluAiChat/releases/latest",
    available: true,
  },
  {
    name: "macOS",
    icon: "🍎",
    url: "https://github.com/MrHulu/HuluAiChat/releases/latest",
    available: true,
  },
  {
    name: "Linux",
    icon: "🐧",
    url: "https://github.com/MrHulu/HuluAiChat/releases/latest",
    available: true,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
      {/* Header */}
      <header className="fixed top-0 w-full border-b border-zinc-800 bg-black/50 backdrop-blur-xl z-50">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">💬</span>
            HuluChat
          </Link>
          <div className="flex items-center gap-6">
            <Link href="https://github.com/MrHulu/HuluAiChat" target="_blank" className="text-zinc-400 hover:text-white transition-colors">
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

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 rounded-full px-4 py-2 text-sm text-zinc-400 mb-8">
            <span className="text-green-400">●</span>
            v3.8.0 Released — Model Quick Switch
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Chat with AI,<br />Beautifully.
          </h1>

          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            A modern desktop application for AI conversations. Fast, private, and beautifully designed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="https://github.com/MrHulu/HuluAiChat/releases/latest"
              target="_blank"
              className="bg-white text-black px-8 py-4 rounded-full font-medium text-lg hover:bg-zinc-200 transition-colors flex items-center gap-2"
            >
              <span>⬇️</span>
              Download for Free
            </Link>
            <Link
              href="https://github.com/MrHulu/HuluAiChat"
              target="_blank"
              className="border border-zinc-700 px-8 py-4 rounded-full font-medium text-lg hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <span>⭐</span>
              Star on GitHub
            </Link>
          </div>

          {/* Platforms */}
          <div className="flex items-center justify-center gap-8 mt-12">
            {platforms.map((platform) => (
              <div key={platform.name} className="flex flex-col items-center gap-2 text-zinc-500">
                <span className="text-3xl">{platform.icon}</span>
                <span className="text-sm">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshot */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800/50 border-b border-zinc-700">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-4 text-sm text-zinc-500">HuluChat</span>
            </div>
            <div className="aspect-video bg-zinc-900 flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl mb-4 block">💬</span>
                <p className="text-zinc-500">Screenshot placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Everything You Need
          </h2>
          <p className="text-zinc-400 text-center mb-16 max-w-2xl mx-auto">
            Built with modern technology for the best experience
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors"
              >
                <span className="text-4xl mb-4 block">{feature.icon}</span>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">Built with Modern Tech</h2>
          <div className="flex flex-wrap items-center justify-center gap-8 text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span>Tauri 2.0</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚛️</span>
              <span>React 19</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐍</span>
              <span>FastAPI</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              <span>Tailwind CSS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📝</span>
              <span>TypeScript</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Chat?
          </h2>
          <p className="text-zinc-400 mb-8">
            Download HuluChat and start your AI conversations today.
          </p>
          <Link
            href="https://github.com/MrHulu/HuluAiChat/releases/latest"
            target="_blank"
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-medium text-lg hover:bg-zinc-200 transition-colors"
          >
            <span>⬇️</span>
            Download Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💬</span>
              <span className="font-bold">HuluChat</span>
            </div>
            <div className="flex items-center gap-6 text-zinc-500 text-sm">
              <Link href="https://github.com/MrHulu/HuluAiChat" target="_blank" className="hover:text-white transition-colors">
                GitHub
              </Link>
              <Link href="https://github.com/MrHulu/HuluAiChat/releases" target="_blank" className="hover:text-white transition-colors">
                Releases
              </Link>
              <Link href="https://github.com/MrHulu/HuluAiChat/issues" target="_blank" className="hover:text-white transition-colors">
                Support
              </Link>
            </div>
            <p className="text-zinc-600 text-sm">
              © 2024 HuluChat. Open Source.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
