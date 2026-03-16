/**
 * MessageStatusIndicator Component Tests
 * TASK-349: 消息状态指示器测试
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageStatusIndicator, MessageStatusGroup, getMessageStatus } from "./MessageStatusIndicator";

describe("MessageStatusIndicator", () => {
  it("renders sending status with animation", () => {
    render(<MessageStatusIndicator status="sending" showLabel />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    // i18n translates to "Sending..."
    expect(screen.getByText(/Sending/i)).toBeInTheDocument();
  });

  it("renders saved status with check icon", () => {
    render(<MessageStatusIndicator status="saved" showLabel />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    // i18n translates to "Saved"
    expect(screen.getByText(/Saved/i)).toBeInTheDocument();
  });

  it("renders queued status with clock icon", () => {
    render(<MessageStatusIndicator status="queued" showLabel />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    // i18n translates to "Waiting to send" or similar
    expect(screen.getByRole("status")).toHaveTextContent(/wait|queue/i);
  });

  it("renders error status with wifi-off icon", () => {
    render(<MessageStatusIndicator status="error" showLabel />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    // i18n translates to "Failed to send" or similar
    expect(screen.getByRole("status")).toHaveTextContent(/fail|error/i);
  });

  it("hides label when showLabel is false", () => {
    render(<MessageStatusIndicator status="saved" showLabel={false} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    // Label should not be visible
    expect(screen.queryByText(/Saved/)).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<MessageStatusIndicator status="saved" className="custom-class" />);

    expect(screen.getByRole("status")).toHaveClass("custom-class");
  });
});

describe("MessageStatusGroup", () => {
  it("renders when queueSize > 0 and not connected", () => {
    render(<MessageStatusGroup queueSize={5} isConnected={false} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    // Shows queued message count
    expect(screen.getByRole("status")).toHaveTextContent(/5.*queued/i);
  });

  it("does not render when queueSize is 0", () => {
    render(<MessageStatusGroup queueSize={0} isConnected={false} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not render when connected", () => {
    render(<MessageStatusGroup queueSize={5} isConnected />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<MessageStatusGroup queueSize={5} isConnected={false} className="custom-class" />);

    expect(screen.getByRole("status")).toHaveClass("custom-class");
  });
});

describe("getMessageStatus", () => {
  it("returns 'sending' for temp message ID when connected", () => {
    expect(getMessageStatus("temp-123", true, false)).toBe("sending");
  });

  it("returns 'queued' for temp message ID when disconnected", () => {
    expect(getMessageStatus("temp-123", false, false)).toBe("queued");
  });

  it("returns 'queued' for local message when disconnected", () => {
    expect(getMessageStatus("real-id", false, true)).toBe("queued");
  });

  it("returns 'saved' for real message ID when connected", () => {
    expect(getMessageStatus("real-id-123", true, false)).toBe("saved");
  });

  it("returns 'saved' for real message ID when disconnected but not local", () => {
    expect(getMessageStatus("real-id-123", false, false)).toBe("saved");
  });
});
