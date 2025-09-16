import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { ToastProvider } from "@heroui/toast";
import { useHref, useNavigate } from "react-router-dom";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { SearchProvider } from "@/contexts/SearchContext";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <LanguageProvider>
      <HeroUIProvider navigate={navigate} useHref={useHref}>
        <ToastProvider
          maxVisibleToasts={5}
          placement="bottom-right"
          toastOffset={20}
        />
        <SearchProvider>{children}</SearchProvider>
      </HeroUIProvider>
    </LanguageProvider>
  );
}
