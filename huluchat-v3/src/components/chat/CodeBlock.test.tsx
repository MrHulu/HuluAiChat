/**
 * CodeBlock Component Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CodeBlock } from "./CodeBlock";

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};

Object.assign(navigator, {
  clipboard: mockClipboard,
});

// Mock useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "chat.copyCode": "Copy code",
        "chat.codeCopied": "Code copied!",
      };
      return translations[key] || key;
    },
  }),
}));

describe("CodeBlock", () => {
  beforeEach(() => {
    mockClipboard.writeText.mockClear();
  });

  it("renders code content", () => {
    render(
      <CodeBlock>
        <code>{"const x = 1;"}</code>
      </CodeBlock>
    );

    expect(screen.getByText("const x = 1;")).toBeInTheDocument();
  });

  it("shows language badge when provided", () => {
    render(
      <CodeBlock language="typescript">
        <code>{"const x: number = 1;"}</code>
      </CodeBlock>
    );

    // Language badge should be visible on hover (but exists in DOM)
    const badge = screen.getByText("typescript");
    expect(badge).toBeInTheDocument();
  });

  it("shows copy button on hover", () => {
    render(
      <CodeBlock>
        <code>{"console.log('hello');"}</code>
      </CodeBlock>
    );

    const copyButton = screen.getByTitle("Copy code");
    expect(copyButton).toBeInTheDocument();
  });

  it("copies code to clipboard when button is clicked", async () => {
    render(
      <CodeBlock>
        <code>{"test code"}</code>
      </CodeBlock>
    );

    const copyButton = screen.getByTitle("Copy code");
    fireEvent.click(copyButton);

    expect(mockClipboard.writeText).toHaveBeenCalledWith("test code");
  });

  it("shows copied state after copying", async () => {
    render(
      <CodeBlock>
        <code>{"copied code"}</code>
      </CodeBlock>
    );

    const copyButton = screen.getByTitle("Copy code");
    fireEvent.click(copyButton);

    // After click, should show "Code copied!" title (async update)
    await waitFor(() => {
      expect(screen.getByTitle("Code copied!")).toBeInTheDocument();
    });
  });

  it("extracts language from className", () => {
    render(
      <CodeBlock className="hljs language-python">
        <code className="hljs language-python">{"print('hello')"}</code>
      </CodeBlock>
    );

    // Language should be extracted from className
    expect(screen.getByText("python")).toBeInTheDocument();
  });

  it("handles plain text children", () => {
    render(<CodeBlock>{"plain text code"}</CodeBlock>);

    expect(screen.getByText("plain text code")).toBeInTheDocument();
  });
});
