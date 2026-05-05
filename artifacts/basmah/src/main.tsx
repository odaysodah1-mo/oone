import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";

/* Track one visit per browser session */
if (!sessionStorage.getItem("__visit_tracked")) {
  sessionStorage.setItem("__visit_tracked", "1");
  fetch("/api/track-visit", { method: "POST" }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
