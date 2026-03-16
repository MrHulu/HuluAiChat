import { DocsLayout } from "@/components/docs-layout";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "RAG Knowledge Base - HuluChat Docs",
  description: "Upload documents and chat with your knowledge. Learn how to use RAG (Retrieval-Augmented Generation) in HuluChat.",
};

const supportedFormats = [
  { format: "PDF", icon: "📄", description: "PDF documents" },
  { format: "TXT", icon: "📝", description: "Plain text files" },
  { format: "MD", icon: "📋", description: "Markdown files" },
  { format: "DOCX", icon: "📘", description: "Microsoft Word documents" },
  { format: "CSV", icon: "📊", description: "Comma-separated values" },
  { format: "JSON", icon: "🔧", description: "JSON data files" },
];

export default function RAGPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">RAG Knowledge Base</h1>
        <p className="text-xl text-zinc-400">
          Upload documents and have AI-powered conversations with your own knowledge.
          HuluChat uses RAG (Retrieval-Augmented Generation) to provide accurate,
          context-aware responses.
        </p>
      </div>

      {/* What is RAG */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">What is RAG?</h2>
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-zinc-300 mb-4">
            RAG (Retrieval-Augmented Generation) allows AI to answer questions based on
            your own documents. Instead of relying solely on the AI&apos;s training data,
            it searches through your uploaded files to find relevant information.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-zinc-800/50 text-center">
              <span className="text-3xl mb-2 block">📤</span>
              <h4 className="font-medium">Upload</h4>
              <p className="text-sm text-zinc-400">Add your documents</p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-800/50 text-center">
              <span className="text-3xl mb-2 block">🔍</span>
              <h4 className="font-medium">Search</h4>
              <p className="text-sm text-zinc-400">AI finds relevant info</p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-800/50 text-center">
              <span className="text-3xl mb-2 block">💬</span>
              <h4 className="font-medium">Chat</h4>
              <p className="text-sm text-zinc-400">Get accurate answers</p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">How to Use</h2>
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <ol className="space-y-6">
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold">
                1
              </span>
              <div>
                <h4 className="font-semibold text-lg">Open the RAG Panel</h4>
                <p className="text-zinc-400">
                  Click the knowledge base icon (📚) in the sidebar or use the keyboard
                  shortcut <kbd className="px-2 py-1 rounded bg-zinc-800 text-xs">Ctrl</kbd> + <kbd className="px-2 py-1 rounded bg-zinc-800 text-xs">K</kbd>
                </p>
              </div>
            </li>

            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold">
                2
              </span>
              <div>
                <h4 className="font-semibold text-lg">Upload Documents</h4>
                <p className="text-zinc-400">
                  Drag and drop files or click to browse. Supported formats include
                  PDF, TXT, MD, DOCX, and more.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold">
                3
              </span>
              <div>
                <h4 className="font-semibold text-lg">Wait for Processing</h4>
                <p className="text-zinc-400">
                  Documents are processed locally on your device. This may take a few
                  seconds depending on file size.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold">
                4
              </span>
              <div>
                <h4 className="font-semibold text-lg">Start Chatting</h4>
                <p className="text-zinc-400">
                  Ask questions about your documents. AI will search through your
                  knowledge base and provide relevant answers.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Supported Formats */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Supported File Formats</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {supportedFormats.map((format) => (
            <div
              key={format.format}
              className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50"
            >
              <span className="text-2xl mb-2 block">{format.icon}</span>
              <h4 className="font-semibold">{format.format}</h4>
              <p className="text-sm text-zinc-400">{format.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy Note */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">🔒 Privacy First</h2>
        <div className="p-6 rounded-xl border border-zinc-800 bg-green-900/20 border-green-800/50">
          <p className="text-zinc-300">
            Your documents are processed <strong>entirely on your device</strong>.
            No data is uploaded to any server. The knowledge base uses local vector
            storage (ChromaDB) for fast, private semantic search.
          </p>
        </div>
      </section>

      {/* Tips */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Tips for Best Results</h2>
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
            <h4 className="font-medium mb-2">📝 Use clear, well-formatted documents</h4>
            <p className="text-sm text-zinc-400">
              Documents with clear headings and structure are easier for AI to search.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
            <h4 className="font-medium mb-2">🎯 Be specific in your questions</h4>
            <p className="text-sm text-zinc-400">
              Instead of &quot;What&apos;s in the document?&quot;, ask &quot;What are the key features mentioned in section 3?&quot;
            </p>
          </div>

          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
            <h4 className="font-medium mb-2">📚 Organize by topic</h4>
            <p className="text-sm text-zinc-400">
              Create different chat sessions for different topics to keep your knowledge organized.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between">
        <Link
          href="/docs/features/multi-model"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          ← Multi-Model Support
        </Link>
        <Link
          href="/docs/features/quick-panel"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          QuickPanel →
        </Link>
      </div>
    </DocsLayout>
  );
}
