import { Link, useLocation } from "react-router-dom";

const learningNavItems = [
  { to: "/learning/import", label: "Import" },
  { to: "/learning/manage", label: "Manage" },
  { to: "/learning/study", label: "Study" }
] as const;

export function LearningSubnav() {
  const location = useLocation();

  return (
    <nav
      aria-label="Learning navigation"
      style={{
        display: "flex",
        gap: "0.4rem",
        flexWrap: "wrap",
        marginBottom: "0.75rem",
        padding: "0.25rem",
        border: "1px solid #e5e7eb",
        borderRadius: "0.75rem",
        background: "#fff"
      }}
    >
      {learningNavItems.map((item) => {
        const active = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            style={{
              padding: "0.42rem 0.72rem",
              borderRadius: "0.6rem",
              border: active ? "1px solid #2563eb" : "1px solid transparent",
              background: active ? "#dbeafe" : "transparent",
              color: active ? "#1d4ed8" : "#374151",
              textDecoration: "none",
              fontWeight: active ? 700 : 600
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
