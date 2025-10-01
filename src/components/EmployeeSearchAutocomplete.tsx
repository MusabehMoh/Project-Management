// import type { EmployeeSearchResult } from "@/types/user";

// import { useCallback } from "react";
// import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
// import { Avatar } from "@heroui/avatar";

// import { useLanguage } from "@/contexts/LanguageContext";
// import { useEmployeeSearch } from "@/hooks/useEmployeeSearch";

// interface EmployeeSearchAutocompleteProps {
//   onEmployeeSelect: (employee: EmployeeSearchResult) => void;
//   selectedEmployee?: EmployeeSearchResult | null;
//   label?: string;
//   placeholder?: string;
//   isRequired?: boolean;
//   isDisabled?: boolean;
//   className?: string;
//   variant?: "flat" | "bordered" | "faded" | "underlined";
//   /** Minimum characters before triggering search */
//   minLength?: number;
//   /** Maximum number of results to show */
//   maxResults?: number;
//   /** Load initial results when component mounts */
//   loadInitialResults?: boolean;
// }

// export const EmployeeSearchAutocomplete = ({
//   onEmployeeSelect,
//   selectedEmployee,
//   label,
//   placeholder,
//   isRequired = false,
//   isDisabled = false,
//   className = "",
//   variant = "bordered",
//   minLength = 1,
//   maxResults = 20,
//   loadInitialResults = false,
// }: EmployeeSearchAutocompleteProps) => {
//   const { t } = useLanguage();

//   // Use the optimized employee search hook
//   const { employees, loading, searchEmployees, clearResults } =
//     useEmployeeSearch({
//       minLength,
//       maxResults,
//       loadInitialResults,
//     });

//   const handleSelection = useCallback(
//     (key: string | null) => {
//       if (key) {
//         const employee = employees.find((e) => e.id.toString() === key);

//         if (employee) {
//           onEmployeeSelect(employee);
//         }
//       }
//     },
//     [employees, onEmployeeSelect],
//   );

//   const handleClear = useCallback(() => {
//     clearResults();
//   }, [clearResults]);

//   return (
//     <Autocomplete
//       className={className}
//       isClearable={true}
//       isDisabled={isDisabled}
//       isLoading={loading}
//       isRequired={isRequired}
//       items={employees}
//       label={label || t("users.selectEmployee")}
//       menuTrigger="input"
//       placeholder={placeholder || t("users.searchEmployees")}
//       selectedKey={selectedEmployee?.id.toString()}
//       variant={variant}
//       onClear={handleClear}
//       onInputChange={searchEmployees}
//       onSelectionChange={handleSelection}
//     >
//       {employees.map((employee) => (
//         <AutocompleteItem
//           key={employee.id.toString()}
//           textValue={`${employee.fullName} (${employee.militaryNumber})`}
//         >
//           <div className="flex items-center gap-2">
//             <Avatar showFallback name={employee.fullName} size="sm" />
//             <div className="flex flex-col">
//               <span className="font-medium">{employee.fullName}</span>
//               <span className="text-small text-default-500">
//                 {employee.militaryNumber} • {employee.gradeName}
//               </span>
//             </div>
//           </div>
//         </AutocompleteItem>
//       ))}
//     </Autocomplete>
//   );
// };
