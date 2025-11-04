import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { I18nProvider } from "@react-aria/i18n";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";

import { APP_CONFIG } from "@/config/environment";

import "@/styles/globals.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  //<React.StrictMode>
  <BrowserRouter basename={APP_CONFIG.basename}>
    <Provider>
      <I18nProvider locale="en-GB">
        <App />
      </I18nProvider>
    </Provider>
  </BrowserRouter>,
  //</React.StrictMode>
);
