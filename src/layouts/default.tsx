import { Outlet } from "react-router-dom";

import { Navbar } from "@/components/navbar";
import ScrollToTop from "@/components/ScrollToTop";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DefaultLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <div className="relative flex flex-col h-screen">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-6 flex-grow pt-16">
        {children ?? <Outlet />}
      </main>
      <footer className="w-full border-t border-default-200 dark:border-default-700 mt-8 py-4">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex justify-center">
            <div className="flex items-center gap-1 text-sm text-default-500">
              <span>
                © {currentYear} {t("common.projectManagement")}
              </span>
            </div>
          </div>
        </div>
      </footer>
      <ScrollToTop />
    </div>
  );
}
