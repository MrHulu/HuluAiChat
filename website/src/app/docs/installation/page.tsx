import { DocsLayout } from "@/components/docs-layout";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Installation - HuluChat Docs",
  description: "Download and install HuluChat on Windows, macOS, or Linux. Step-by-step installation guide.",
};

const platforms = [
  {
    name: "Windows",
    icon: "🪟",
    downloadUrl: "https://github.com/MrHulu/HuluAiChat/releases/latest",
    file: "HuluChat_X.X.X_x64_en-US.msi",
    steps: [
      "Download the .msi installer from GitHub Releases",
      "Double-click the downloaded file",
      "Follow the installation wizard",
      "Launch HuluChat from the Start Menu",
    ],
  },
  {
    name: "macOS (Intel)",
    icon: "🍎",
    downloadUrl: "https://github.com/MrHulu/HuluAiChat/releases/latest",
    file: "HuluChat_X.X.X_x64.dmg",
    steps: [
      "Download the .dmg file for Intel Macs",
      "Open the downloaded .dmg file",
      "Drag HuluChat to the Applications folder",
      "Launch HuluChat from Applications",
    ],
  },
  {
    name: "macOS (Apple Silicon)",
    icon: "🍎",
    downloadUrl: "https://github.com/MrHulu/HuluAiChat/releases/latest",
    file: "HuluChat_X.X.X_aarch64.dmg",
    steps: [
      "Download the .dmg file for Apple Silicon (M1/M2/M3)",
      "Open the downloaded .dmg file",
      "Drag HuluChat to the Applications folder",
      "Launch HuluChat from Applications",
    ],
  },
  {
    name: "Linux",
    icon: "🐧",
    downloadUrl: "https://github.com/MrHulu/HuluAiChat/releases/latest",
    file: "HuluChat_X.X.X_amd64.AppImage",
    steps: [
      "Download the .AppImage file",
      "Make it executable: chmod +x HuluChat_*.AppImage",
      "Run the AppImage: ./HuluChat_*.AppImage",
      "Optional: Move to /opt or create a desktop entry",
    ],
  },
];

export default function InstallationPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Installation</h1>
        <p className="text-xl text-zinc-400">
          Install HuluChat on your platform. Choose your operating system below for detailed instructions.
        </p>
      </div>

      {/* Download Button */}
      <div className="mb-12 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 text-center">
        <h2 className="text-2xl font-bold mb-4">Download Latest Version</h2>
        <p className="text-zinc-400 mb-6">
          Get the latest release from GitHub. Available for all platforms.
        </p>
        <Link
          href="https://github.com/MrHulu/HuluAiChat/releases/latest"
          target="_blank"
          className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-medium text-lg hover:bg-zinc-200 transition-colors"
        >
          <span>⬇️</span>
          Download from GitHub
        </Link>
      </div>

      {/* Platform-specific Instructions */}
      <div className="space-y-8">
        {platforms.map((platform) => (
          <div
            key={platform.name}
            className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{platform.icon}</span>
              <h2 className="text-2xl font-bold">{platform.name}</h2>
            </div>

            <div className="mb-4">
              <code className="px-3 py-1 rounded bg-zinc-800 text-sm text-zinc-300">
                {platform.file}
              </code>
            </div>

            <ol className="space-y-3">
              {platform.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-sm flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-zinc-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      {/* First-time Setup */}
      <div className="mt-12 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
        <h2 className="text-2xl font-bold mb-4">First-time Setup</h2>
        <p className="text-zinc-400 mb-4">
          After installing HuluChat, you&apos;ll need to configure your AI provider:
        </p>
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-sm flex items-center justify-center">
              1
            </span>
            <span className="text-zinc-300">
              Open Settings (gear icon in the sidebar)
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-sm flex items-center justify-center">
              2
            </span>
            <span className="text-zinc-300">
              Enter your API Key (OpenAI, DeepSeek, or other compatible provider)
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-sm flex items-center justify-center">
              3
            </span>
            <span className="text-zinc-300">
              Select your preferred model and start chatting!
            </span>
          </li>
        </ol>
      </div>

      {/* Next Steps */}
      <div className="mt-12 flex items-center justify-between">
        <Link
          href="/docs"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          ← Back to Docs
        </Link>
        <Link
          href="/docs/quick-start"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          Quick Start Guide →
        </Link>
      </div>
    </DocsLayout>
  );
}
