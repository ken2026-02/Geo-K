import type { ReactNode } from "react";

export type FeedbackTone = "success" | "error" | "warning" | "info";

const toneStyles: Record<FeedbackTone, { border: string; background: string; color: string; title: string }> = {
  success: {
    border: "#bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
    title: "Success"
  },
  error: {
    border: "#fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    title: "Error"
  },
  warning: {
    border: "#fde68a",
    background: "#fffbeb",
    color: "#92400e",
    title: "Warning"
  },
  info: {
    border: "#bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
    title: "Info"
  }
};

interface FeedbackBannerProps {
  tone: FeedbackTone;
  message: ReactNode;
  title?: string;
}

export function FeedbackBanner({ tone, message, title }: FeedbackBannerProps) {
  const style = toneStyles[tone];

  return (
    <div
      style={{
        border: `1px solid ${style.border}`,
        borderRadius: "0.75rem",
        background: style.background,
        color: style.color,
        padding: "0.75rem 0.85rem"
      }}
    >
      <strong style={{ display: "block", marginBottom: "0.2rem" }}>{title ?? style.title}</strong>
      <div style={{ lineHeight: 1.5 }}>{message}</div>
    </div>
  );
}
