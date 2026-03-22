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
      className="ekv-tab-nav mb-3"
    >
      {learningNavItems.map((item) => {
        const active = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={`${item.to}${location.search}`}
            className={`ekv-tab-link ${active ? "ekv-tab-link-active" : "ekv-tab-link-idle"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
