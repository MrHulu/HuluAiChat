import { DocsLayout } from "@/components/docs-layout";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Multi-Model Support - HuluChat Docs",
  description: "Switch between GPT-4, Claude, DeepSeek, and local models. Learn how to configure and use multiple AI providers.",
};

const supportedProviders = [
  {
    name: "OpenAI",
    icon: "🤖",
    models: ["GPT-4o", "GPT-4o-mini", "GPT-4 Turbo", "GPT-3.5 Turbo"],
    baseUrl: "https://api.openai.com/v1",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  {
    name: "DeepSeek",
    icon: "🧠",
    models: ["DeepSeek V3", "DeepSeek Coder"],
    baseUrl: "https://api.deepseek.com",
    keyUrl: "https://platform.deepseek.com/",
  },
  {
    name: "Anthropic",
    icon: "🎭",
    models: ["Claude 3.5 Sonnet", "Claude 3 Opus", "Claude 3 Haiku"],
    baseUrl: "https://api.anthropic.com",
    keyUrl: "https://console.anthropic.com/",
  },
  {
    name: "Ollama (Local)",
    icon: "🏠",
    models: ["Llama 3", "Mistral", "Phi-3", "CodeLlama", "...and more"],
    baseUrl: "http://localhost:11434/v1",
    keyUrl: "https://ollama.com/library",
  },
  {
    name: "智谱 AI (GLM)",
    icon: "🌟",
    models: ["GLM-4", "GLM-5", "GLM-3 Turbo"],
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    keyUrl: "https://open.bigmodel.cn/",
  },
];

export default function MultiModelPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Multi-Model Support</h1>
        <p className="text-xl text-zinc-400">
          Switch between different AI models instantly. Use GPT-4 for complex tasks,
          DeepSeek for coding, or local models for privacy.
        </p>
      </div>

      {/* Switching Models */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Switching Models</h2>
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-zinc-300 mb-4">
            You can switch models at any time during a conversation:
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                1
              </span>
              <div>
                <h4 className="font-medium">Click the model selector</h4>
                <p className="text-sm text-zinc-400">
                  Located at the top of the chat view, next to the session title
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                2
              </span>
              <div>
                <h4 className="font-medium">Choose your model</h4>
                <p className="text-sm text-zinc-400">
                  Select from all available models. Each model shows its provider.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                3
              </span>
              <div>
                <h4 className="font-medium">Continue chatting</h4>
                <p className="text-sm text-zinc-400">
                  New messages will use the selected model. Previous messages remain unchanged.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Model Regeneration */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Regenerate with Different Model</h2>
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-zinc-300 mb-4">
            Compare responses from different models for the same prompt:
          </p>

          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-sm flex items-center justify-center">
                1
              </span>
              <span className="text-zinc-300">
                Hover over any AI response
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-sm flex items-center justify-center">
                2
              </span>
              <span className="text-zinc-300">
                Click the regenerate icon (🔄)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-sm flex items-center justify-center">
                3
              </span>
              <span className="text-zinc-300">
                Select a different model to regenerate the response
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-sm flex items-center justify-center">
                4
              </span>
              <span className="text-zinc-300">
                Use the model badge to switch between different responses
              </span>
            </li>
          </ol>

          <div className="mt-4 p-4 rounded-lg bg-zinc-800/50">
            <p className="text-sm text-zinc-400">
              💡 <strong>Tip:</strong> This is great for comparing model capabilities,
              checking for hallucinations, or getting a second opinion.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Providers */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Supported Providers</h2>
        <div className="space-y-4">
          {supportedProviders.map((provider) => (
            <div
              key={provider.name}
              className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{provider.icon}</span>
                <h3 className="text-xl font-semibold">{provider.name}</h3>
              </div>

              <div className="mb-3">
                <p className="text-sm text-zinc-500 mb-1">Available Models:</p>
                <div className="flex flex-wrap gap-2">
                  {provider.models.map((model) => (
                    <span
                      key={model}
                      className="px-2 py-1 rounded bg-zinc-800 text-xs text-zinc-300"
                    >
                      {model}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span className="text-zinc-500">
                  Base URL: <code className="text-zinc-400">{provider.baseUrl}</code>
                </span>
                <Link
                  href={provider.keyUrl}
                  target="_blank"
                  className="text-blue-400 hover:underline"
                >
                  Get API Key →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Custom Providers */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Custom Providers</h2>
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-zinc-300 mb-4">
            HuluChat supports any OpenAI-compatible API. To add a custom provider:
          </p>

          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-sm flex items-center justify-center">
                1
              </span>
              <span className="text-zinc-300">Open Settings and scroll to API Configuration</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-sm flex items-center justify-center">
                2
              </span>
              <span className="text-zinc-300">Enter your custom Base URL</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-sm flex items-center justify-center">
                3
              </span>
              <span className="text-zinc-300">Enter your API Key</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-sm flex items-center justify-center">
                4
              </span>
              <span className="text-zinc-300">Click Save - HuluChat will auto-detect available models</span>
            </li>
          </ol>
        </div>
      </section>

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between">
        <Link
          href="/docs/quick-start"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          ← Quick Start
        </Link>
        <Link
          href="/docs/features/rag"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          RAG Knowledge Base →
        </Link>
      </div>
    </DocsLayout>
  );
}
