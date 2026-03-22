import { Suspense } from "react";
import { useRoutes } from "react-router-dom";

import { appRoutes } from "./routes/appRoutes";

export function App() {
  const content = useRoutes(appRoutes);

  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f5f5f4",
            color: "#4b5563",
            fontFamily: "system-ui, sans-serif"
          }}
        >
          Loading page...
        </div>
      }
    >
      {content}
    </Suspense>
  );
}
