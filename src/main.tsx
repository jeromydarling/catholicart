import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import { StoreProvider } from "./lib/store";
import "./index.css";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter basename={basename}>
        <StoreProvider>
          <App />
        </StoreProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
);
