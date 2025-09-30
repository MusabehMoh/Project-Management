/**
 * LoadingLogo - A reusable theme-aware loading component
 * 
 * Features:
 * - Automatically switches between light/dark logo versions
 * - Multiple size options (sm, md, lg, xl)
 * - Smooth breathing, floating, and glowing animations
 * - Optional loading text
 * - Fully customizable with className prop
 * 
 * Usage:
 * <LoadingLogo /> // Default large size
 * <LoadingLogo size="sm" showText text="Please wait..." />
 * <LoadingLogo size="xl" className="my-4" />
 */

import React, { useState, useEffect } from "react";
import { useTheme } from "@heroui/use-theme";

// Import logo versions
import logoImageLight from "@/assets/ChatGPT Image Aug 13, 2025, 11_15_09 AM.png";
import logoImageDark from "@/assets/whitemodlogo.png";

interface LoadingLogoProps {
  /** Size of the logo - determines width and height */
  size?: "sm" | "md" | "lg" | "xl";
  /** Whether to show loading text below the logo */
  showText?: boolean;
  /** Custom text to display (default: "Loading...") */
  text?: string;
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

export const LoadingLogo: React.FC<LoadingLogoProps> = ({
  size = "lg",
  showText = false,
  text = "Loading...",
  className = "",
}) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>("light");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const updateTheme = () => {
      const htmlElement = document.documentElement;
      const isDark =
        htmlElement.classList.contains("dark") ||
        htmlElement.getAttribute("data-theme") === "dark" ||
        theme === "dark";

      setCurrentTheme(isDark ? "dark" : "light");
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, [theme, mounted]);

  if (!mounted) {
    return (
      <div
        className={`${sizeClasses[size]} bg-default-200 animate-pulse rounded-lg ${className}`}
      />
    );
  }

  const logoSrc = currentTheme === "dark" ? logoImageDark : logoImageLight;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative">
        {/* Main logo with loading effects */}
        <img
          alt="Loading..."
          className={`
            ${sizeClasses[size]}
            object-contain
            transition-all
            duration-1000
            filter
          `}
          src={logoSrc}
          style={{
            animation: "logoBreath 2s ease-in-out infinite, logoFloat 4s ease-in-out infinite",
            filter: "brightness(1) drop-shadow(0 2px 8px rgba(0,0,0,0.1))",
          }}
        />

        {/* Pulsing glow effect */}
        <div
          className={`
            absolute inset-0
            ${sizeClasses[size]}
            rounded-full
            bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20
            blur-sm
          `}
          style={{
            animation: "pulseGlow 2s ease-in-out infinite alternate",
          }}
        />
      </div>

      {showText && (
        <p className="text-sm text-default-500 animate-pulse">{text}</p>
      )}

      {/* Global styles for animations */}
      <style>
        {`
          @keyframes logoBreath {
            0%, 100% {
              transform: scale(1);
              opacity: 0.95;
            }
            50% {
              transform: scale(1.03);
              opacity: 1;
            }
          }

          @keyframes logoFloat {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-2px);
            }
          }

          @keyframes pulseGlow {
            0% {
              opacity: 0.3;
              transform: scale(0.95);
            }
            100% {
              opacity: 0.6;
              transform: scale(1.05);
            }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingLogo;