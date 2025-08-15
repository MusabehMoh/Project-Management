import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { User as UserComponent } from "@heroui/user";
import { Badge } from "@heroui/badge";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@heroui/modal";
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
import { link as linkStyles } from "@heroui/theme";
import clsx from "clsx";
import {
  Bell,
  User,
  Settings,
  Users,
  CreditCard,
  LogOut,
} from "lucide-react";

import { ThemeSwitch } from "@/components/theme-switch";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SearchIcon } from "@/components/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTheme } from "@heroui/use-theme";

// Import both logo versions
import logoImageLight from "@/assets/ChatGPT Image Aug 13, 2025, 11_15_09 AM.png";
import logoImageDark from "@/assets/whitemodlogo.png";

// Theme-aware logo component
const ThemeLogo = ({ className }: { className?: string }) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>('light');

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
      const isDark = htmlElement.classList.contains('dark') || 
                    htmlElement.getAttribute('data-theme') === 'dark' ||
                    theme === 'dark';
      
      setCurrentTheme(isDark ? 'dark' : 'light');
    };

    // Initial update
    updateTheme();

    // Listen for theme changes via mutation observer
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });

    return () => observer.disconnect();
  }, [theme, mounted]);

  // Don't render until mounted to prevent theme flash
  if (!mounted) {
    return (
      <div className={clsx(className, "bg-default-200 animate-pulse rounded")} />
    );
  }
  
  // Use the current theme state
  const logoSrc = currentTheme === 'dark' ? logoImageDark : logoImageLight;
  
  return (
    <img 
      src={logoSrc} 
      alt="Company Logo" 
      className={clsx(className, "transition-all duration-300 ease-in-out")}
    />
  );
};

// Animated Navigation Item Component
const AnimatedNavItem = ({ item, isActive = false }: { item: { label: string; href: string }, isActive?: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <NavbarItem key={item.href}>
      <Link
        className={clsx(
          "relative group transition-all duration-300 ease-in-out transform",
          "hover:scale-105 hover:-translate-y-0.5",
          "text-foreground font-medium",
          isActive ? "text-primary" : "hover:text-primary"
        )}
        color="foreground"
        href={item.href}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="relative z-10">
          {item.label}
        </span>
        
        {/* Hover background glow */}
        <span 
          className={clsx(
            "absolute inset-0 -z-10 rounded-lg",
            "bg-primary/10",
            "transition-all duration-300 ease-out",
            "transform -inset-2",
            isHovered ? "opacity-100 scale-110" : "opacity-0 scale-95"
          )}
        />
      </Link>
    </NavbarItem>
  );
};

// Project management specific nav items
const getProjectNavItems = (t: (key: string) => string) => [
  { label: t("nav.dashboard"), href: "/" },
  { label: t("nav.projects"), href: "/projects" },
  { label: t("nav.users"), href: "/users" },
  { label: "Timeline", href: "/timeline" },
  { label: t("nav.tasks"), href: "/tasks" },
  { label: t("nav.team"), href: "/team" },
  { label: t("nav.reports"), href: "/reports" },
];

export const Navbar = () => {
  const { t, language } = useLanguage();
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const projectNavItems = getProjectNavItems(t);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentPath, setCurrentPath] = useState("");

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track current path for active state
  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

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
        maxWidth="xl" 
        position="sticky"
        className={clsx(
          "transition-all duration-500 ease-in-out",
          "animate-pulse backdrop-blur-md bg-background/70"
        )}
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
        <NavbarContent justify="end">
          <NavbarItem>
            <div className="flex items-center gap-2">
              <span className="text-small text-default-500">{t("user.loading")}</span>
              <div className="animate-spin bg-primary rounded-full w-8 h-8 opacity-70"></div>
            </div>
          </NavbarItem>
        </NavbarContent>
      </HeroUINavbar>
    );
  }
  
  const searchInput = (
    <Input
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
      readOnly
    />
  );

  return (
    <HeroUINavbar 
      maxWidth="xl" 
      position="sticky"
      className={clsx(
        "transition-all duration-500 ease-in-out transform",
        isScrolled 
          ? "backdrop-blur-md bg-background/80 border-b border-divider shadow-lg scale-[0.98]" 
          : "backdrop-blur-sm bg-background/60 scale-100",
        "animate-in slide-in-from-top-full duration-700"
      )}
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <Link
            className={clsx(
              "flex justify-start items-center gap-1",
              "transition-all duration-500 ease-out transform",
              "hover:scale-105 active:scale-95",
              isScrolled ? "scale-90" : "scale-100"
            )}
            color="foreground"
            href="/"
          >
            <ThemeLogo className={clsx(
              "w-auto object-contain transition-all duration-500 ease-out",
              isScrolled 
                ? "h-6 sm:h-8 max-w-[100px] sm:max-w-[130px]" 
                : "h-8 sm:h-10 max-w-[120px] sm:max-w-[150px]"
            )} />
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
                item={item} 
                isActive={currentPath === item.href}
              />
            </div>
          ))}
        </div>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden lg:flex animate-in slide-in-from-right duration-500" style={{ animationDelay: '200ms' }}>
          {searchInput}
        </NavbarItem>

        {/* Notifications */}
        <NavbarItem className="animate-in slide-in-from-right duration-500" style={{ animationDelay: '300ms' }}>
          <Badge content="3" color="danger" size="sm">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              aria-label={t("nav.notifications")}
              className="transition-all duration-300 hover:scale-110 hover:bg-danger/10 hover:text-danger active:scale-95"
            >
              <Bell size={16} className="transition-transform duration-300 hover:animate-pulse" />
            </Button>
          </Badge>
        </NavbarItem>

        {/* Language Switcher */}
        <NavbarItem className="animate-in slide-in-from-right duration-500" style={{ animationDelay: '400ms' }}>
          <div className="transition-all duration-300 hover:scale-110 active:scale-95">
            <LanguageSwitcher />
          </div>
        </NavbarItem>

        {/* Theme Switch */}
        <NavbarItem className="animate-in slide-in-from-right duration-500" style={{ animationDelay: '500ms' }}>
          <div className="transition-all duration-300 hover:scale-110 active:scale-95">
            <ThemeSwitch />
          </div>
        </NavbarItem>

        {/* User Profile Dropdown */}
        <NavbarItem className="animate-in slide-in-from-right duration-500" style={{ animationDelay: '600ms' }}>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <div className="transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer">
                <UserComponent
                  as="button"
                  className="transition-all duration-300"
                  name={currentUser.fullName}
                  description={userRole ? `${currentUser.gradeName} • ${userRole}` : currentUser.gradeName}
                  avatarProps={{
                    size: "sm",
                    name: currentUser.fullName,
                    className: "transition-all duration-300 hover:ring-2 hover:ring-primary/50",
                  }}
                />
              </div>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="Profile Actions" 
              variant="flat"
              className="animate-in slide-in-from-top-2 duration-300"
            >
              <DropdownSection title={`${currentUser.gradeName} ${currentUser.fullName}`} showDivider>
                <DropdownItem
                  key="profile"
                  description={`${currentUser.militaryNumber} | ${currentUser.department}${userRole ? ` | ${userRole}` : ''}`}
                  startContent={<User size={16} className="transition-colors duration-200" />}
                  textValue="Profile"
                  className="transition-all duration-200 hover:bg-primary/10"
                >
                  {t("user.profile")}
                </DropdownItem>
                <DropdownItem
                  key="settings"
                  description={t("user.settingsDesc")}
                  startContent={<Settings size={16} className="transition-colors duration-200" />}
                  className="transition-all duration-200 hover:bg-primary/10"
                >
                  {t("user.settings")}
                </DropdownItem>
              </DropdownSection>
              <DropdownSection title={t("user.workspace")}>
                <DropdownItem
                  key="team"
                  description={t("user.teamDesc")}
                  startContent={<Users size={16} className="transition-colors duration-200" />}
                  className="transition-all duration-200 hover:bg-primary/10"
                >
                  {t("user.teamManagement")}
                </DropdownItem>
                <DropdownItem
                  key="billing"
                  description={t("user.billingDesc")}
                  startContent={<CreditCard size={16} className="transition-colors duration-200" />}
                  className="transition-all duration-200 hover:bg-primary/10"
                >
                  {t("user.billing")}
                </DropdownItem>
              </DropdownSection>
              <DropdownItem
                key="logout"
                className="text-danger transition-all duration-200 hover:bg-danger/10"
                color="danger"
                description={t("user.logoutDesc")}
                startContent={<LogOut size={16} className="transition-colors duration-200" />}
              >
                {t("user.logout")}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <Badge content="3" color="danger" size="sm">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            aria-label={t("nav.notifications")}
            className="transition-all duration-300 hover:scale-110 hover:bg-danger/10 hover:text-danger active:scale-95"
          >
            <Bell size={16} className="transition-transform duration-300 hover:animate-pulse" />
          </Button>
        </Badge>
        <div className="transition-all duration-300 hover:scale-110 active:scale-95">
          <ThemeSwitch />
        </div>
        <NavbarMenuToggle className="transition-all duration-300 hover:scale-110 active:scale-95" />
      </NavbarContent>

      <NavbarMenu className="animate-in slide-in-from-top duration-500 backdrop-blur-md bg-background/90">
        <div className="animate-in slide-in-from-left duration-300" style={{ animationDelay: '100ms' }}>
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
                color={currentPath === item.href ? "primary" : "foreground"}
                href={item.href}
                size="lg"
                className={clsx(
                  "transition-all duration-300 hover:scale-105 active:scale-95",
                  "hover:text-primary font-medium",
                  currentPath === item.href && "border-l-2 border-primary pl-2"
                )}
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
          <NavbarMenuItem 
            className="flex flex-row gap-2 items-center animate-in slide-in-from-left duration-500"
            style={{ animationDelay: `${(projectNavItems.length + 1) * 100}ms` }}
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

      {/* Search Modal */}
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        size="2xl"
        placement="top"
        backdrop="blur"
        className="animate-in slide-in-from-top-4 duration-500"
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: {
                duration: 0.3,
                ease: "easeOut",
              },
            },
            exit: {
              y: -20,
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: "easeIn",
              },
            },
          }
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3 animate-in slide-in-from-left duration-300">
                  <SearchIcon className="text-default-400 transition-colors duration-300" size={20} />
                  <span>{t("nav.searchModal")}</span>
                  <Kbd keys={["ctrl"]} className="transition-all duration-300 hover:scale-105">K</Kbd>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="animate-in slide-in-from-bottom duration-300" style={{ animationDelay: '100ms' }}>
                  <Input
                    autoFocus
                    placeholder={t("nav.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    startContent={<SearchIcon className="text-default-400" size={18} />}
                    classNames={{
                      input: "text-sm transition-all duration-300",
                      inputWrapper: "bg-default-100 border-none transition-all duration-300 hover:bg-default-200 focus-within:bg-default-50",
                    }}
                  />
                </div>
                
                {/* Search Results */}
                <div className="mt-4 space-y-2">
                  {searchQuery && (
                    <div className="text-small text-default-500 animate-in slide-in-from-left duration-300">
                      {t("nav.searchResults")} "{searchQuery}"
                    </div>
                  )}
                  
                  {/* Mock search results */}
                  {searchQuery && (
                    <div className="space-y-1">
                      <div className="p-2 rounded-lg hover:bg-default-100 cursor-pointer transition-all duration-200 hover:scale-[1.02] animate-in slide-in-from-left" style={{ animationDelay: '200ms', animationDuration: '300ms' }}>
                        <div className="font-medium">Customer Portal Redesign</div>
                        <div className="text-small text-default-500">Project • Active</div>
                      </div>
                      <div className="p-2 rounded-lg hover:bg-default-100 cursor-pointer transition-all duration-200 hover:scale-[1.02] animate-in slide-in-from-left" style={{ animationDelay: '300ms', animationDuration: '300ms' }}>
                        <div className="font-medium">Sarah Johnson</div>
                        <div className="text-small text-default-500">Team Member • Captain</div>
                      </div>
                    </div>
                  )}
                  
                  {!searchQuery && (
                    <div className="text-small text-default-500 text-center py-8 animate-in fade-in duration-500">
                      {t("nav.searchPrompt")}
                    </div>
                  )}
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </HeroUINavbar>
  );
};
