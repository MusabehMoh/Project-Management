import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";

import "@/styles/globals.css";
import { I18nProvider } from "@react-aria/i18n";
ReactDOM.createRoot(document.getElementById("root")!).render(
  //<React.StrictMode>
  <BrowserRouter
    basename={(window as any).PMA_CONFIG?.basename || import.meta.env.BASE_URL}
  >
    <Provider>
      <I18nProvider locale="en-GB">
        <App />
      </I18nProvider>
    </Provider>
  </BrowserRouter>,
  //</React.StrictMode>
);
