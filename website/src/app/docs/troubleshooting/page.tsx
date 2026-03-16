import { DocsLayout } from "@/components/docs-layout";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Troubleshooting - HuluChat Docs",
  description: "Common issues and how to fix them. Troubleshooting guide for HuluChat.",
};

const issues = [
  {
    title: "Backend won't start",
    symptoms: [
      "App shows 'Backend disconnected' error",
      "Sidecar process not starting",
      "API calls fail with connection refused",
    ],
    solutions: [
      {
        title: "Check if sidecar is running",
        steps: [
          "Open Task Manager (Ctrl+Shift+Esc)",
          "Look for 'HuluChat Backend' or 'python' process",
          "If not running, manually start it backend",
        ],
      },
      {
        title: "Restart the application",
        steps: [
          "Close HuluChat completely",
          "Reopen HuluChat",
          "The backend should auto-start",
        ],
      },
      {
        title: "Check antivirus/firewall",
        steps: [
          "Some antivirus software blocks the sidecar",
          "Add an exception for HuluChat in your antivirus",
          "Allow the app through firewall",
        ],
      },
    ],
  },
  {
    title: "API Key not working",
    symptoms: [
      "Error: 'Invalid API key'",
      "Error: 'Authentication failed'",
      "AI responds with error message",
    ],
    solutions: [
      {
        title: "Verify API key format",
        steps: [
          "Make sure the API key is correct (no extra spaces)",
          "Check if the key starts with 'sk-' for OpenAI",
          "Some providers use different prefixes",
        ],
      },
      {
        title: "Check Base URL",
        steps: [
          "Verify the Base URL is correct for your provider",
          "OpenAI: https://api.openai.com/v1",
          "DeepSeek: https://api.deepseek.com",
          "Ollama: http://localhost:11434/v1",
        ],
      },
      {
        title: "Test API key",
        steps: [
          "Go to Settings",
          "Click 'Test Connection' button",
          "A successful test confirms your key works",
        ],
      },
    ],
  },
  {
    title: "Slow performance",
    symptoms: [
      "App feels sluggish",
      "Long loading times",
      "High memory usage",
    ],
    solutions: [
      {
        title: "Clear old sessions",
        steps: [
          "Delete unused sessions from sidebar",
          "Use folders to organize",
          "Large session counts slow down the app",
        ],
      },
      {
        title: "Check system resources",
        steps: [
          "Close other heavy applications",
          "Restart the app if memory is low",
          "Consider upgrading RAM",
        ],
      },
    ],
  },
  {
    title: "RAG not working",
    symptoms: [
      "Documents not loading",
      "Search returns no results",
      "Error messages about embeddings",
    ],
    solutions: [
      {
        title: "Check document format",
        steps: [
          "Ensure document is in supported format (PDF, TXT, MD)",
          "Very large PDFs may take longer to process",
          "Try splitting large documents",
        ],
      },
      {
        title: "Restart after adding documents",
        steps: [
          "Remove and re-add documents",
          "Wait for processing to complete",
          "Check the console for errors",
        ],
      },
    ],
  },
];

export default function TroubleshootingPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Troubleshooting</h1>
        <p className="text-xl text-zinc-400">
          Common issues and how to fix them. Can&apos;t find your answer?{" "}
          <Link
            href="https://github.com/MrHulu/HuluAiChat/issues"
            target="_blank"
            className="text-blue-400 hover:underline"
          >
            Open an issue on GitHub
          </Link>
        </p>
      </div>

      {/* Issues */}
      <div className="space-y-8">
        {issues.map((issue, index) => (
          <div
            key={index}
            className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
              <span className="text-red-400">⚠️</span>
              {issue.title}
            </h2>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-zinc-400 mb-2">Symptoms:</h4>
              <ul className="space-y-1">
                {issue.symptoms.map((symptom, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                    <span className="text-yellow-400">•</span>
                    {symptom}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              {issue.solutions.map((solution, sIndex) => (
                <div
                  key={sIndex}
                  className="p-4 rounded-lg bg-zinc-800/50"
                >
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    {solution.title}
                  </h4>
                  <ol className="space-y-1">
                    {solution.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                        <span className="text-zinc-500">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Still having issues? */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
        <h2 className="text-xl font-semibold mb-4">Still Having Issues?</h2>
        <p className="text-zinc-300 mb-4">
          If you above solutions don&apos;t resolve your problem, here are additional steps:
        </p>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-zinc-800/50">
            <h4 className="font-medium mb-2">📋 Check Logs</h4>
            <p className="text-sm text-zinc-400">
              Open Developer Tools (F12) and check the Console tab for error messages.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-zinc-800/50">
            <h4 className="font-medium mb-2">🔄 Reinstall</h4>
            <p className="text-sm text-zinc-400">
              Download the latest version from GitHub. A clean reinstall often fixes issues.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-zinc-800/50">
            <h4 className="font-medium mb-2">💬 Get Help</h4>
            <p className="text-sm text-zinc-400">
              <Link
                href="https://github.com/MrHulu/HuluAiChat/issues"
                target="_blank"
                className="text-blue-400 hover:underline"
              >
                Create an issue on GitHub
              </Link>{" "}
              with details about your setup and the problem.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between">
        <Link
          href="/docs/faq"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          ← FAQ
        </Link>
        <Link
          href="/docs"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          Back to Docs →
        </Link>
      </div>
    </DocsLayout>
  );
}
