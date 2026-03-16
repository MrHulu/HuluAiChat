import { DocsLayout } from "@/components/docs-layout";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - HuluChat Docs",
  description: "Frequently asked questions about HuluChat. Find answers to common questions about installation, features, and troubleshooting.",
};

const faqs = [
  {
    question: "Is HuluChat free?",
    answer:
      "Yes! HuluChat is completely free and open source. You can download it from GitHub and use it without any cost. You only need to provide your own API keys for the AI providers you want to use.",
  },
  {
    question: "Does HuluChat collect my data?",
    answer:
      "No. HuluChat is privacy-first. We don't collect any telemetry, analytics, or usage data. All your conversations are stored locally on your device. Your data never leaves your computer unless you explicitly share it.",
  },
  {
    question: "Which AI models are supported?",
    answer:
      "HuluChat supports OpenAI (GPT-4, GPT-3.5), Anthropic (Claude), DeepSeek,智谱 AI (GLM), and any OpenAI-compatible API including local models through Ollama. You can also add custom providers.",
  },
  {
    question: "How do I get an API key?",
    answer:
      "You can get API keys from each provider's website: OpenAI (platform.openai.com), Anthropic (console.anthropic.com), DeepSeek (platform.deepseek.com), and others. After getting your key, add it in HuluChat Settings.",
  },
  {
    question: "Can I use HuluChat offline?",
    answer:
      "For cloud AI providers (OpenAI, Claude, etc.), you need an internet connection. However, you can use local models through Ollama for completely offline operation. HuluChat itself works offline - only AI requests need connectivity.",
  },
  {
    question: "Where is my data stored?",
    answer:
      "All data is stored locally on your device. Chat history, settings, and knowledge base files are saved in your application data directory. You can export your data at any time.",
  },
  {
    question: "Can I sync my chats across devices?",
    answer:
      "Currently, HuluChat doesn't have built-in cloud sync. Your data stays on your device. You can export and import sessions manually if needed. Cloud sync may be added in a future version.",
  },
  {
    question: "What platforms are supported?",
    answer:
      "HuluChat runs on Windows (64-bit), macOS (Intel and Apple Silicon), and Linux (x64). We provide installers for all platforms on our GitHub Releases page.",
  },
  {
    question: "How do I update HuluChat?",
    answer:
      "HuluChat checks for updates automatically. When a new version is available, you'll see a notification. You can also manually download the latest version from GitHub Releases.",
  },
  {
    question: "Can I contribute to HuluChat?",
    answer:
      "Yes! HuluChat is open source on GitHub. You can report bugs, suggest features, submit pull requests, or help with documentation. We welcome all contributions!",
  },
  {
    question: "How does RAG (knowledge base) work?",
    answer:
      "Upload documents to your knowledge base, and HuluChat will search through them when you ask questions. The AI uses relevant sections from your documents to provide accurate, contextual answers. All processing happens locally.",
  },
  {
    question: "What file formats are supported for RAG?",
    answer:
      "HuluChat supports PDF, TXT, Markdown (.md), DOCX, CSV, and JSON files for the knowledge base. More formats may be added in future updates.",
  },
];

export default function FAQPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-xl text-zinc-400">
          Find answers to common questions about HuluChat.
        </p>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="group p-6 rounded-xl border border-zinc-800 bg-zinc-900/50"
          >
            <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-lg">
              {faq.question}
              <span className="text-zinc-400 group-open:rotate-45 transition-transform">
                +
              </span>
            </summary>
            <p className="mt-4 text-zinc-400 leading-relaxed">{faq.answer}</p>
          </details>
        ))}
      </div>

      {/* Still have questions */}
      <div className="mt-12 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 text-center">
        <h3 className="text-xl font-bold mb-4">Still have questions?</h3>
        <p className="text-zinc-400 mb-6">
          Can&apos;t find what you&apos;re looking for? We&apos;re here to help.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="https://github.com/MrHulu/HuluAiChat/issues"
            target="_blank"
            className="px-6 py-3 rounded-full border border-zinc-700 hover:bg-zinc-800 transition-colors"
          >
            🐛 Report an Issue
          </Link>
          <Link
            href="https://github.com/MrHulu/HuluAiChat/discussions"
            target="_blank"
            className="px-6 py-3 rounded-full border border-zinc-700 hover:bg-zinc-800 transition-colors"
          >
            💬 Ask a Question
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between">
        <Link
          href="/docs/features/sessions"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          ← Session Management
        </Link>
        <Link
          href="/docs/troubleshooting"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          Troubleshooting →
        </Link>
      </div>
    </DocsLayout>
  );
}
