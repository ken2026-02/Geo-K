import { useRoutes } from "react-router-dom";

import { appRoutes } from "./routes/appRoutes";

export function App() {
  return useRoutes(appRoutes);
}
