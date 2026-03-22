interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  busy = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  const confirmColors = tone === "danger"
    ? { background: "#dc2626", border: "#dc2626", color: "#fff" }
    : { background: "#2563eb", border: "#2563eb", color: "#fff" };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem"
      }}
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        style={{
          width: "100%",
          maxWidth: "28rem",
          background: "#fff",
          borderRadius: "1rem",
          border: "1px solid #e5e7eb",
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.2)",
          padding: "1rem"
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="confirm-dialog-title" style={{ margin: 0, color: "#0f172a" }}>{title}</h3>
        <p style={{ margin: "0.55rem 0 0", color: "#475569", lineHeight: 1.55 }}>{body}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.55rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            style={{
              padding: "0.58rem 0.95rem",
              borderRadius: "0.7rem",
              border: "1px solid #cbd5e1",
              background: "#fff",
              color: "#334155"
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            style={{
              padding: "0.58rem 0.95rem",
              borderRadius: "0.7rem",
              border: `1px solid ${confirmColors.border}`,
              background: confirmColors.background,
              color: confirmColors.color,
              fontWeight: 700
            }}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
