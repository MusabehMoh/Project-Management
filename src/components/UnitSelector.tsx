import type { Unit } from "@/types/unit";

import React, { useState } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
} from "@heroui/react";

import { UnitTreeView } from "./UnitTreeView";

import { ChevronRightIcon, ChevronLeftIcon } from "@/components/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUnitPath } from "@/hooks/useUnits";

interface UnitSelectorProps {
  /** Selected unit */
  selectedUnit?: Unit;
  /** Callback when unit is selected */
  onUnitSelect?: (unit: Unit | undefined) => void;
  /** Label for the selector */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the selector is required */
  isRequired?: boolean;
  /** Whether the selector is disabled */
  isDisabled?: boolean;
  /** Whether the selector is in an invalid state */
  isInvalid?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Custom CSS class */
  className?: string;
  /** Allow clearing selection */
  allowClear?: boolean;
}

export const UnitSelector: React.FC<UnitSelectorProps> = ({
  selectedUnit,
  onUnitSelect,
  label,
  placeholder,
  isRequired = false,
  isDisabled = false,
  isInvalid = false,
  errorMessage,
  className = "",
  allowClear = true,
}) => {
  const { t, language } = useLanguage();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [tempSelectedUnit, setTempSelectedUnit] = useState<Unit | undefined>(
    selectedUnit,
  );

  // Sync tempSelectedUnit when selectedUnit changes (including when cleared)
  React.useEffect(() => {
    setTempSelectedUnit(selectedUnit);
  }, [selectedUnit]);

  const { path } = useUnitPath(selectedUnit?.id);

  const handleSelectUnit = (unit: Unit) => {
    setTempSelectedUnit(unit);
  };

  const handleConfirm = () => {
    if (onUnitSelect) {
      onUnitSelect(tempSelectedUnit);
    }
    onOpenChange();
  };

  const handleCancel = () => {
    setTempSelectedUnit(selectedUnit);
    onOpenChange();
  };

  const handleClear = () => {
    setTempSelectedUnit(undefined);
    if (onUnitSelect) {
      onUnitSelect(undefined);
    }
  };

  const displayValue = selectedUnit
    ? language === "ar"
      ? selectedUnit.name
      : selectedUnit.name
    : "";

  return (
    <div className={className}>
      {/* Input Display */}
      <Input
        readOnly
        className="cursor-pointer"
        endContent={
          <div className="flex items-center gap-1">
            {selectedUnit && allowClear && (
              <Button
                isIconOnly
                className="min-w-unit-6 w-6 h-6"
                size="sm"
                variant="light"
                onClick={handleClear}
              >
                ×
              </Button>
            )}
            <Button
              isIconOnly
              className="min-w-unit-6 w-6 h-6"
              isDisabled={isDisabled}
              size="sm"
              variant="light"
              onClick={onOpen}
            >
              {language === "ar" ? (
                <ChevronLeftIcon size={14} />
              ) : (
                <ChevronRightIcon size={14} />
              )}
            </Button>
          </div>
        }
        errorMessage={errorMessage}
        isDisabled={isDisabled}
        isInvalid={isInvalid}
        isRequired={isRequired}
        label={label}
        placeholder={placeholder || t("units.selectUnit")}
        style={{ direction: language === "ar" ? "rtl" : "ltr" }}
        value={displayValue}
        onClick={!isDisabled ? onOpen : undefined}
      />

      {/* Breadcrumb Path */}
      {selectedUnit && path && path.length > 0 && (
        <div className="mt-2" dir={language === "ar" ? "rtl" : "ltr"}>
          <div className="flex items-center gap-1 flex-wrap">
            {path.map((unit, index, array) => {
              // Get level-based color matching UnitTreeView
              const getLevelColorValue = (level: number) => {
                const colorMap: Record<number, string> = {
                  0: "#71717A", // default/grey - Root (L0)
                  1: "#006FEE", // primary - Ministry
                  2: "#9353D3", // secondary - Commands
                  3: "#17C964", // success - Regional
                  4: "#F5A524", // warning - Brigades
                  5: "#F31260", // danger - Battalions
                };
                return colorMap[level] || "#71717A";
              };

              return (
                <React.Fragment key={unit.id}>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: getLevelColorValue(unit.level),
                      }}
                    />
                    <span className="text-sm text-default-700 font-medium">
                      {unit.name}
                    </span>
                  </div>
                  {index < array.length - 1 && (
                    language === "ar" ? (
                      <ChevronLeftIcon className="text-default-400" size={14} />
                    ) : (
                      <ChevronRightIcon className="text-default-400" size={14} />
                    )
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Selection Modal */}
      <Modal
        isOpen={isOpen}
        scrollBehavior="inside"
        size="2xl"
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t("units.selectUnit")}
                {tempSelectedUnit && (
                  <div className="text-sm font-normal text-default-500">
                    {t("units.selected")}:{" "}
                    {language === "ar"
                      ? tempSelectedUnit.name
                      : tempSelectedUnit.name}
                  </div>
                )}
              </ModalHeader>

              <ModalBody className="p-0">
                <UnitTreeView
                  maxHeight="500px"
                  selectedUnitId={tempSelectedUnit?.id}
                  selectionMode={true}
                  showExpandControls={true}
                  showSearch={true}
                  onUnitSelect={handleSelectUnit}
                />
              </ModalBody>

              <ModalFooter>
                <Button color="danger" variant="flat" onPress={handleCancel}>
                  {t("common.cancel")}
                </Button>
                <Button
                  color="primary"
                  isDisabled={!tempSelectedUnit}
                  onPress={handleConfirm}
                >
                  {t("common.select")}
                </Button>
                {allowClear && selectedUnit && (
                  <Button
                    color="warning"
                    variant="flat"
                    onPress={() => {
                      handleClear();
                      onClose();
                    }}
                  >
                    {t("common.clear")}
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default UnitSelector;
