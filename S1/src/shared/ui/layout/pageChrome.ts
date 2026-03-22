import type { CSSProperties } from "react";

export const pageSectionStyle: CSSProperties = {
  marginBottom: "1rem",
  padding: "1rem",
  border: "1px solid #e2e8f0",
  borderRadius: "1rem",
  background: "#ffffff",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)"
};

export const mutedSectionStyle: CSSProperties = {
  ...pageSectionStyle,
  background: "#f8fafc"
};

export const heroSectionStyle: CSSProperties = {
  ...pageSectionStyle,
  background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)",
  border: "1px solid #dbeafe"
};

export const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  flexWrap: "wrap",
  alignItems: "center"
};

export const primaryButtonStyle: CSSProperties = {
  padding: "0.72rem 1rem",
  borderRadius: "0.8rem",
  border: "1px solid #2563eb",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 700,
  textDecoration: "none"
};

export const secondaryButtonStyle: CSSProperties = {
  padding: "0.72rem 1rem",
  borderRadius: "0.8rem",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  fontWeight: 600,
  textDecoration: "none"
};

export const subtleButtonStyle: CSSProperties = {
  padding: "0.55rem 0.8rem",
  borderRadius: "0.75rem",
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#334155",
  fontWeight: 600,
  textDecoration: "none"
};

export const statGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "0.75rem"
};

export const statCardStyle: CSSProperties = {
  padding: "0.75rem",
  borderRadius: "0.8rem",
  background: "#f8fafc",
  border: "1px solid #e2e8f0"
};
