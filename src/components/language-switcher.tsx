import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { useLanguage } from "@/contexts/LanguageContext";

export const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    {
      key: "en",
      label: "English",
      flag: "🇺🇸",
    },
    {
      key: "ar",
      label: "العربية",
      flag: "🇦🇪",
    },
  ];

  const currentLanguage = languages.find((lang) => lang.key === language);

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="light"
          size="sm"
          startContent={currentLanguage?.flag}
          className="min-w-unit-16"
        >
          {currentLanguage?.label}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Language selection"
        selectedKeys={[language]}
        onAction={(key) => setLanguage(key as "en" | "ar")}
      >
        {languages.map((lang) => (
          <DropdownItem key={lang.key} startContent={lang.flag}>
            {lang.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};
