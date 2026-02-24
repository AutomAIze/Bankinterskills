import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { appTitle } from "./config/brand";
import { applyBrandTheme } from "./config/applyBrandTheme";

applyBrandTheme();
document.title = appTitle;

createRoot(document.getElementById("root")!).render(<App />);
