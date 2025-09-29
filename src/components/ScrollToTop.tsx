import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { ChevronUp } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();

  // Show button when page is scrolled up to given distance
  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Throttle scroll event for better performance
  const throttledToggleVisibility = () => {
    let ticking = false;

    const update = () => {
      toggleVisibility();
      ticking = false;
    };

    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  };

  // Set the scroll event listener
  useEffect(() => {
    window.addEventListener("scroll", throttledToggleVisibility);

    return () => {
      window.removeEventListener("scroll", throttledToggleVisibility);
    };
  }, []);

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {isVisible && (
        <Tooltip content={t("common.scrollToTop")} placement="left">
          <Button
            isIconOnly
            aria-label={t("common.scrollToTop")}
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 bg-background/80 backdrop-blur-sm border border-divider hover:bg-default-100 transition-all duration-300 hover:scale-105 shadow-sm"
            color="default"
            size="lg"
            variant="flat"
            onPress={scrollToTop}
          >
            <ChevronUp className="w-5 h-5 text-default-600" />
          </Button>
        </Tooltip>
      )}
    </>
  );
}
