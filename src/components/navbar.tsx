import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { User as UserComponent } from "@heroui/user";
import { Badge } from "@heroui/badge";
import { Skeleton } from "@heroui/skeleton";
import { useDisclosure } from "@heroui/modal";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@heroui/dropdown";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";
import clsx from "clsx";
import { Bell, User, ChevronDown, Building2 } from "lucide-react";
import { useTheme } from "@heroui/use-theme";
import { useLocation, useNavigate } from "react-router-dom";

import { ThemeSwitch } from "@/components/theme-switch";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SearchIcon } from "@/components/icons";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserContext } from "@/contexts/UserContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useNotifications } from "@/hooks/useNotifications";
// Import both logo versions
import logoImageLight from "@/assets/ChatGPT Image Aug 13, 2025, 11_15_09 AM.png";
import logoImageDark from "@/assets/whitemodlogo.png";
import { RoleIds } from "@/constants/roles";

// Theme-aware logo component
const ThemeLogo = ({ className }: { className?: string }) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>("light");

  // Ensure component is mounted before rendering to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update current theme when theme changes and also listen to DOM changes
  useEffect(() => {
    if (!mounted) return;

    const updateTheme = () => {
      // Check multiple sources for theme
      const htmlElement = document.documentElement;
      const isDark =
        htmlElement.classList.contains("dark") ||
        htmlElement.getAttribute("data-theme") === "dark" ||
        theme === "dark";

      setCurrentTheme(isDark ? "dark" : "light");
    };

    // Initial update
    updateTheme();

    // Listen for theme changes via mutation observer
    const observer = new MutationObserver(updateTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, [theme, mounted]);

  // Don't render until mounted to prevent theme flash
  if (!mounted) {
    return (
      <div
        className={clsx(className, "bg-default-200 animate-pulse rounded")}
      />
    );
  }

  // Use the current theme state
  const logoSrc = currentTheme === "dark" ? logoImageDark : logoImageLight;

  return (
    <img
      alt="Company Logo"
      className={clsx(className, "transition-all duration-300 ease-in-out")}
      src={logoSrc}
    />
  );
};

// Animated Navigation Item Component
const AnimatedNavItem = ({
  item,
  isActive = false,
  onNavigate,
}: {
  item: { label: string; href: string };
  isActive?: boolean;
  onNavigate: (e: React.MouseEvent, href: string) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <NavbarItem key={item.href}>
      <Link
        className={clsx(
          "relative group transition-all duration-300 ease-in-out transform",
          "hover:scale-105 hover:-translate-y-0.5",
          "text-foreground font-medium",
          isActive ? "text-primary" : "hover:text-primary",
        )}
        color="foreground"
        href={item.href}
        onClick={(e) => onNavigate(e, item.href)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="relative z-10">{item.label}</span>

        {/* Hover background glow */}
        <span
          className={clsx(
            "absolute inset-0 -z-10 rounded-lg",
            "bg-primary/10",
            "transition-all duration-300 ease-out",
            "transform -inset-2",
            isHovered ? "opacity-100 scale-110" : "opacity-0 scale-95",
          )}
        />
      </Link>
    </NavbarItem>
  );
};

// Management Dropdown Component
const ManagementDropdown = ({
  t,
  isAdmin,
  hasPermission,
  navigate,
  currentPath,
}: {
  t: (key: string) => string;
  isAdmin: () => boolean;
  hasPermission: (permissions: any) => boolean;
  navigate: (path: string) => void;
  currentPath: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Check if user has access to either users or departments
  const hasUsersAccess =
    isAdmin() || hasPermission({ actions: ["users.read"] });
  const hasDepartmentsAccess =
    isAdmin() ||
    hasPermission({
      actions: ["Department Management", "Manage Departments"],
    });

  // Don't render if user has no access to either
  if (!hasUsersAccess && !hasDepartmentsAccess) {
    return null;
  }

  const isActive = currentPath === "/users" || currentPath === "/departments";

  return (
    <Dropdown
      className="min-w-[200px]"
      isOpen={isOpen}
      placement="bottom-start"
      onOpenChange={setIsOpen}
    >
      <DropdownTrigger>
        <Button
          className={clsx(
            "relative group transition-all duration-300 ease-in-out transform",
            "hover:scale-105 hover:-translate-y-0.5",
            "text-foreground font-medium text-base bg-transparent p-0 h-auto min-w-0",
            isActive ? "text-primary" : "hover:text-primary",
          )}
          endContent={
            <ChevronDown
              className={clsx(
                "transition-transform duration-200 ml-1",
                isOpen ? "rotate-180" : "rotate-0",
              )}
              size={14}
            />
          }
          variant="light"
        >
          <span className="relative z-10">{t("nav.management")}</span>
          {/* Hover background glow */}
          <span
            className={clsx(
              "absolute inset-0 -z-10 rounded-lg",
              "bg-primary/10",
              "transition-all duration-300 ease-out",
              "transform -inset-2",
              isOpen ? "opacity-100 scale-110" : "opacity-0 scale-95",
            )}
          />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Management options"
        className="min-w-[200px]"
        variant="flat"
      >
        {hasUsersAccess && (
          <DropdownItem
            key="users"
            className={clsx(
              "transition-all duration-200",
              currentPath === "/users" && "bg-primary/10 text-primary",
            )}
            startContent={<User size={16} />}
            textValue="User Management"
            onPress={() => navigate("/users")}
          >
            {t("nav.userManagement")}
          </DropdownItem>
        )}
        {hasDepartmentsAccess && (
          <DropdownItem
            key="departments"
            className={clsx(
              "transition-all duration-200",
              currentPath === "/departments" && "bg-primary/10 text-primary",
            )}
            startContent={<Building2 size={16} />}
            textValue="Department Management"
            onPress={() => navigate("/departments")}
          >
            {t("nav.departmentManagement")}
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
};

// Project management specific nav items
const getProjectNavItems = (
  t: (key: string) => string,
  hasPermission: any,
  isAdmin: any,
  hasAnyRoleById: any,
) => {
  const baseItems = [{ label: t("nav.dashboard"), href: "/" }];

  const conditionalItems = [];

  // Add projects link if user has admin role or project read permission
  if (
    isAdmin() ||
    hasPermission({
      actions: ["projects.read"],
    })
  ) {
    conditionalItems.push({ label: t("nav.projects"), href: "/projects" });
  }

  const adminItems = [];

  // Development Manager specific items
  const developmentItems = [];

  if (hasAnyRoleById([RoleIds.DEVELOPMENT_MANAGER, RoleIds.ADMINISTRATOR])) {
    developmentItems.push({
      label: t("nav.developmentRequirements"),
      href: "/development-requirements",
    });
    // Add timeline for Development Managers
    developmentItems.push({ label: t("nav.timeline"), href: "/timeline" });
  }
  
  // Designer Manager specific items - Design Requests
  if (hasAnyRoleById([RoleIds.DESIGNER_MANAGER, RoleIds.ADMINISTRATOR])) {
    developmentItems.push({
      label: t("nav.designRequests"),
      href: "/design-requests",
    });
  }

  // Requirements specific items
  const requirementsItems = [];

  if (
    hasAnyRoleById([
      RoleIds.ADMINISTRATOR,
      RoleIds.ANALYST,
      RoleIds.ANALYST_DEPARTMENT_MANAGER,
    ])
  ) {
    requirementsItems.push({
      label: t("nav.requirements"),
      href: "/requirements",
    });
  }

  // Add approval requests for users who can approve requirements
  if (
    hasAnyRoleById([RoleIds.ADMINISTRATOR, RoleIds.ANALYST_DEPARTMENT_MANAGER])
  ) {
    requirementsItems.push({
      label: t("requirements.approvalRequests"),
      href: "/approval-requests",
    });
  }

  // Member tasks or Team Tasks for manager
  if (
    hasAnyRoleById([
      RoleIds.ANALYST_DEPARTMENT_MANAGER,
      RoleIds.DEVELOPMENT_MANAGER,
      RoleIds.QUALITY_CONTROL_MANAGER,
      RoleIds.DESIGNER_MANAGER,
      RoleIds.ADMINISTRATOR,
    ])
  ) {
    developmentItems.push({ label: t("nav.teamTasks"), href: "/tasks" });
  } else {
    developmentItems.push({ label: t("nav.tasks"), href: "/tasks" });
  }

  return [
    ...baseItems,
    ...conditionalItems,
    ...requirementsItems,
    ...developmentItems,
    ...adminItems,
  ];
};

export const Navbar = () => {
  const { t } = useLanguage();
  const {
    user: currentUser,
    loading: userLoading,
    hasPermission,
    isAdmin,
    hasAnyRoleById,
  } = usePermissions();
  const { setUser } = useUserContext();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isConnected } =
    useNotifications();
  const projectNavItems = getProjectNavItems(
    t,
    hasPermission,
    isAdmin,
    hasAnyRoleById,
  );
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;

      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track current path reactively (SPA navigation)
  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname]);

  // Central navigation handler to prevent full page reloads
  const handleNav = (e: React.MouseEvent, href: string) => {
    // Allow modifier clicks (open in new tab, etc.)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    if (href !== currentPath) {
      navigate(href);
    }
  };

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        onOpen();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);

  // Get user role name (first role if multiple)
  const userRole = currentUser?.roles?.[0]?.name || "";

  // Show loading state if user data is not ready
  if (userLoading || !currentUser) {
    return (
      <HeroUINavbar
        className={clsx(
          "transition-all duration-500 ease-in-out",
          "backdrop-blur-md bg-background/70",
        )}
        maxWidth="xl"
        position="sticky"
      >
        <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
          <NavbarBrand className="gap-3 max-w-fit">
            <Link
              className="flex justify-start items-center gap-1 transition-transform duration-300 hover:scale-105"
              color="foreground"
              href="/"
            >
              <ThemeLogo className="h-8 sm:h-10 w-auto object-contain max-w-[120px] sm:max-w-[150px] transition-all duration-300" />
            </Link>
          </NavbarBrand>
        </NavbarContent>

        {/* Desktop Navigation */}
        <NavbarContent className="hidden lg:flex gap-4" justify="center">
          <NavbarItem>
            <Skeleton className="h-8 w-20 rounded-lg" />
          </NavbarItem>
          <NavbarItem>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </NavbarItem>
          <NavbarItem>
            <Skeleton className="h-8 w-28 rounded-lg" />
          </NavbarItem>
        </NavbarContent>

        <NavbarContent justify="end">
          {/* Search skeleton */}
          <NavbarItem className="hidden lg:flex">
            <Skeleton className="h-10 w-64 rounded-lg" />
          </NavbarItem>

          {/* Notifications skeleton */}
          <NavbarItem>
            <Skeleton className="h-10 w-10 rounded-full" />
          </NavbarItem>

          {/* Language switcher skeleton */}
          <NavbarItem>
            <Skeleton className="h-8 w-8 rounded" />
          </NavbarItem>

          {/* Theme switch skeleton */}
          <NavbarItem>
            <Skeleton className="h-8 w-8 rounded" />
          </NavbarItem>

          {/* User profile skeleton */}
          <NavbarItem>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="hidden sm:flex flex-col gap-1">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
          </NavbarItem>
        </NavbarContent>
      </HeroUINavbar>
    );
  }

  const searchInput = (
    <Input
      readOnly
      aria-label={t("nav.search")}
      classNames={{
        inputWrapper: "bg-default-100",
        input: "text-sm",
      }}
      endContent={
        <Kbd
          className="hidden lg:inline-block cursor-pointer"
          keys={["ctrl"]}
          onClick={onOpen}
        >
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder={t("nav.search")}
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
      onClick={onOpen}
    />
  );

  return (
    <HeroUINavbar
      className={clsx(
        "transition-all duration-500 ease-in-out transform",
        isScrolled
          ? "backdrop-blur-md bg-background/80 border-b border-divider shadow-lg scale-[0.98]"
          : "backdrop-blur-sm bg-background/60 scale-100",
        "animate-in slide-in-from-top-full duration-700",
      )}
      maxWidth="xl"
      position="sticky"
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <Link
            className={clsx(
              "flex justify-start items-center gap-1",
              "transition-all duration-500 ease-out transform",
              "hover:scale-105 active:scale-95",
              isScrolled ? "scale-90" : "scale-100",
            )}
            color="foreground"
            href="/"
            onClick={(e) => handleNav(e, "/")}
          >
            <ThemeLogo
              className={clsx(
                "w-auto object-contain transition-all duration-500 ease-out",
                isScrolled
                  ? "h-6 sm:h-8 max-w-[100px] sm:max-w-[130px]"
                  : "h-8 sm:h-10 max-w-[120px] sm:max-w-[150px]",
              )}
            />
          </Link>
        </NavbarBrand>
        <div className="hidden lg:flex gap-6 justify-start ml-4">
          {projectNavItems.map((item, index) => (
            <div
              key={item.href}
              className="animate-in slide-in-from-left duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <AnimatedNavItem
                isActive={currentPath === item.href}
                item={item}
                onNavigate={handleNav}
              />
            </div>
          ))}
          <div
            className="animate-in slide-in-from-left duration-500"
            style={{ animationDelay: `${projectNavItems.length * 100}ms` }}
          >
            <ManagementDropdown
              currentPath={currentPath}
              hasPermission={hasPermission}
              isAdmin={isAdmin}
              navigate={navigate}
              t={t}
            />
          </div>
        </div>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem
          className="hidden lg:flex animate-in slide-in-from-right duration-500"
          style={{ animationDelay: "200ms" }}
        >
          {searchInput}
        </NavbarItem>

        {/* Notifications */}
        <NavbarItem
          className="animate-in slide-in-from-right duration-500"
          style={{ animationDelay: "300ms" }}
        >
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                isIconOnly
                aria-label={t("nav.notifications")}
                className={clsx(
                  "relative transition-all duration-300 hover:scale-110 active:scale-95",
                  unreadCount > 0
                    ? "hover:bg-danger/10 hover:text-danger"
                    : "hover:bg-default/10",
                  // Removed opacity-50 so icon isn't pale when offline; we already show a warning dot
                )}
                size="sm"
                variant="light"
              >
                <Badge
                  color={unreadCount > 0 ? "danger" : "default"}
                  content={unreadCount > 0 ? unreadCount : ""}
                  isInvisible={unreadCount === 0}
                  placement="top-right"
                  size="sm"
                >
                  <Bell
                    className={clsx(
                      "transition-transform duration-300",
                      unreadCount > 0 ? "animate-pulse" : "hover:animate-pulse",
                    )}
                    size={16}
                  />
                </Badge>
                {!isConnected && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-warning rounded-full animate-pulse" />
                )}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Notifications"
              className="w-80 max-h-96 overflow-y-auto"
              variant="flat"
            >
              <DropdownSection title={t("nav.notificationsTitle")}>
                {notifications.length === 0 ? (
                  <DropdownItem
                    key="no-notifications"
                    className="text-center py-4"
                    textValue="No notifications"
                  >
                    <div className="text-default-500">
                      {t("nav.noNotifications")}
                    </div>
                  </DropdownItem>
                ) : (
                  <>
                    {unreadCount > 0 && (
                      <DropdownItem
                        key="mark-all-read"
                        className="text-primary border-b border-divider mb-1"
                        textValue="Mark all as read"
                        onPress={markAllAsRead}
                      >
                        <div className="text-sm font-medium">
                          {t("nav.markAllRead")}
                        </div>
                      </DropdownItem>
                    )}
                    {notifications.slice(0, 10).map((notification) => (
                      <DropdownItem
                        key={notification.id}
                        className={clsx(
                          "py-3 px-2 cursor-pointer",
                          !notification.read &&
                            "bg-primary/5 border-l-2 border-primary",
                        )}
                        textValue={notification.message}
                        onPress={() => markAsRead(notification.id)}
                      >
                        <div className="flex flex-col gap-1">
                          <div
                            className={clsx(
                              "text-sm",
                              !notification.read
                                ? "font-semibold"
                                : "font-normal",
                            )}
                          >
                            {notification.message}
                          </div>
                          <div className="text-xs text-default-400">
                            {notification.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </DropdownItem>
                    ))}
                  </>
                )}
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>

        {/* Language Switcher */}
        <NavbarItem
          className="animate-in slide-in-from-right duration-500"
          style={{ animationDelay: "400ms" }}
        >
          <div className="transition-all duration-300 hover:scale-110 active:scale-95">
            <LanguageSwitcher />
          </div>
        </NavbarItem>

        {/* Theme Switch */}
        <NavbarItem
          className="animate-in slide-in-from-right duration-500"
          style={{ animationDelay: "500ms" }}
        >
          <div className="transition-all duration-300 hover:scale-110 active:scale-95">
            <ThemeSwitch />
          </div>
        </NavbarItem>

        {/* User Profile Dropdown */}
        <NavbarItem
          className="animate-in slide-in-from-right duration-500"
          style={{ animationDelay: "600ms" }}
        >
          <div
            aria-label={t("user.profile")}
            className="transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => {
              if (location.pathname !== "/profile") {
                navigate("/profile");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                e.preventDefault();
                if (location.pathname !== "/profile") {
                  navigate("/profile");
                }
              }
            }}
          >
            <UserComponent
              as="button"
              avatarProps={{
                size: "sm",
                name: currentUser.fullName,
                className:
                  "transition-all duration-300 hover:ring-2 hover:ring-primary/50",
              }}
              className="transition-all duration-300"
              description={
                userRole
                  ? `${currentUser.gradeName} • ${userRole}`
                  : currentUser.gradeName
              }
              name={currentUser.fullName}
            />
          </div>
        </NavbarItem>
        {/* <NavbarItem
          className="animate-in slide-in-from-right duration-500"
          style={{ animationDelay: "600ms" }}
        >
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <div className="transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer">
                <UserComponent
                  as="button"
                  avatarProps={{
                    size: "sm",
                    name: currentUser.fullName,
                    className:
                      "transition-all duration-300 hover:ring-2 hover:ring-primary/50",
                  }}
                  className="transition-all duration-300"
                  description={
                    userRole
                      ? `${currentUser.gradeName} • ${userRole}`
                      : currentUser.gradeName
                  }
                  name={currentUser.fullName}
                />
              </div>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Profile Actions"
              className="animate-in slide-in-from-top-2 duration-300"
              variant="flat"
            >
              <DropdownSection
                showDivider
                title={`${currentUser.gradeName} ${currentUser.fullName}`}
              >
                <DropdownItem
                  key="profile"
                  className="transition-all duration-200 hover:bg-primary/10"
                  description={`${currentUser.militaryNumber} | ${currentUser.department}${userRole ? ` | ${userRole}` : ""}`}
                  startContent={
                    <User
                      className="transition-colors duration-200"
                      size={16}
                    />
                  }
                  textValue="Profile"
                  onPress={() => navigate("/profile")}
                >
                  {t("user.profile")}
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  className="text-danger transition-all duration-200 hover:bg-danger/10"
                  color="danger"
                  description={t("user.logoutDesc")}
                  startContent={
                    <LogOut
                      className="transition-colors duration-200"
                      size={16}
                    />
                  }
                  onPress={async () => {
                    try {
                      // Get current app URL
                      const currentUrl = window.location.origin;

                      // Clear local storage first
                      localStorage.removeItem("authToken");
                      localStorage.removeItem("currentUser");
                      sessionStorage.removeItem("authToken");

                      // Clear user context
                      setUser(null);

                      // Open app in new window
                      const newWindow = window.open(currentUrl, "_blank");

                      if (newWindow) {
                        // Focus the new window
                        newWindow.focus();

                        // Show instructions for private browsing
                        const userAgent = navigator.userAgent.toLowerCase();
                        let shortcut = "Ctrl+Shift+N"; // Chrome default

                        if (userAgent.includes("firefox")) {
                          shortcut = "Ctrl+Shift+P";
                        } else if (
                          userAgent.includes("safari") &&
                          !userAgent.includes("chrome")
                        ) {
                          shortcut = "Cmd+Shift+N";
                        } else if (userAgent.includes("edge")) {
                          shortcut = "Ctrl+Shift+N";
                        }

                        // Optional: Show a toast or alert with instructions
                        setTimeout(() => {
                          if (
                            window.confirm(
                              `${t("user.privateWindowTip") || "Tip: For complete privacy, press"} ${shortcut} ${t("user.privateWindowTip2") || "to open in private/incognito mode."}\n\n${t("user.closeCurrentWindow") || "Would you like to close this window?"}`
                            )
                          ) {
                            window.close();
                          }
                        }, 1000);
                      } else {
                        // Fallback if popup was blocked
                        alert(
                          t("user.popupBlocked") ||
                            "Popup blocked. Please allow popups and try again, or manually open a private window."
                        );
                      }

                      // Navigate current window to login page as fallback
                      navigate("/");

                      // Optional: Call logout API endpoint
                      // await authService.logout();
                    } catch (error) {
                      console.error("Logout error:", error);
                      // Still navigate even if logout call fails
                      navigate("/");
                    }
                  }}
                >
                  {t("user.logout")}
                </DropdownItem>
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem> */}
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <Badge
          className={unreadCount === 0 ? "opacity-0" : ""}
          color={unreadCount > 0 ? "danger" : "default"}
          content={unreadCount > 0 ? unreadCount : ""}
          size="sm"
        >
          <Button
            isIconOnly
            aria-label={t("nav.notifications")}
            className={clsx(
              "transition-all duration-300 hover:scale-110 active:scale-95",
              unreadCount > 0
                ? "hover:bg-danger/10 hover:text-danger"
                : "hover:bg-default/10",
              !isConnected && "opacity-50",
            )}
            size="sm"
            variant="light"
          >
            <Bell
              className={clsx(
                "transition-transform duration-300",
                unreadCount > 0 ? "animate-pulse" : "hover:animate-pulse",
              )}
              size={16}
            />
          </Button>
        </Badge>
        <div className="transition-all duration-300 hover:scale-110 active:scale-95">
          <ThemeSwitch />
        </div>
        <NavbarMenuToggle className="transition-all duration-300 hover:scale-110 active:scale-95" />
      </NavbarContent>

      <NavbarMenu className="animate-in slide-in-from-top duration-500 backdrop-blur-md bg-background/90">
        <div
          className="animate-in slide-in-from-left duration-300"
          style={{ animationDelay: "100ms" }}
        >
          {searchInput}
        </div>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {projectNavItems.map((item, index) => (
            <NavbarMenuItem
              key={`${item.label}-${index}`}
              className="animate-in slide-in-from-left duration-500"
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              <Link
                className={clsx(
                  "transition-all duration-300 hover:scale-105 active:scale-95",
                  "hover:text-primary font-medium",
                  currentPath === item.href && "border-l-2 border-primary pl-2",
                )}
                color={currentPath === item.href ? "primary" : "foreground"}
                href={item.href}
                size="lg"
                onClick={(e) => handleNav(e, item.href)}
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}

          {/* Add Management Items for Mobile */}
          {(isAdmin() || hasPermission({ actions: ["users.read"] })) && (
            <NavbarMenuItem
              className="animate-in slide-in-from-left duration-500"
              style={{
                animationDelay: `${(projectNavItems.length + 1) * 100}ms`,
              }}
            >
              <Link
                className={clsx(
                  "transition-all duration-300 hover:scale-105 active:scale-95",
                  "hover:text-primary font-medium",
                  currentPath === "/users" && "border-l-2 border-primary pl-2",
                )}
                color={currentPath === "/users" ? "primary" : "foreground"}
                href="/users"
                size="lg"
                onClick={(e) => handleNav(e, "/users")}
              >
                <div className="flex items-center gap-2">
                  <User size={16} />
                  {t("nav.userManagement")}
                </div>
              </Link>
            </NavbarMenuItem>
          )}

          {(isAdmin() ||
            hasPermission({
              actions: ["Department Management", "Manage Departments"],
            })) && (
            <NavbarMenuItem
              className="animate-in slide-in-from-left duration-500"
              style={{
                animationDelay: `${(projectNavItems.length + 2) * 100}ms`,
              }}
            >
              <Link
                className={clsx(
                  "transition-all duration-300 hover:scale-105 active:scale-95",
                  "hover:text-primary font-medium",
                  currentPath === "/departments" &&
                    "border-l-2 border-primary pl-2",
                )}
                color={
                  currentPath === "/departments" ? "primary" : "foreground"
                }
                href="/departments"
                size="lg"
                onClick={(e) => handleNav(e, "/departments")}
              >
                <div className="flex items-center gap-2">
                  <Building2 size={16} />
                  {t("nav.departmentManagement")}
                </div>
              </Link>
            </NavbarMenuItem>
          )}

          <NavbarMenuItem
            className="flex flex-row gap-2 items-center animate-in slide-in-from-left duration-500"
            style={{
              animationDelay: `${(projectNavItems.length + 3) * 100}ms`,
            }}
          >
            <div className="transition-all duration-300 hover:scale-110 active:scale-95">
              <LanguageSwitcher />
            </div>
            <div className="transition-all duration-300 hover:scale-110 active:scale-95">
              <ThemeSwitch />
            </div>
          </NavbarMenuItem>
        </div>
      </NavbarMenu>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </HeroUINavbar>
  );
};
