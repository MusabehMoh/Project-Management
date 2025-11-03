import type { DepartmentMember } from "@/types/department";

import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Skeleton } from "@heroui/skeleton";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

import { useLanguage } from "@/contexts/LanguageContext";
import { SearchIcon } from "@/components/icons";
import { GlobalPagination } from "@/components/GlobalPagination";
import { useDepartmentMembers } from "@/hooks/useDepartments";
import { useCurrentUser, usePageTitle } from "@/hooks";

export default function MyTeamPage() {
  const { t, language } = useLanguage();
  const { user } = useCurrentUser();

  // Set page title
  usePageTitle("myTeam.title");

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Map current role to department ID
  // Development Manager (4) → Development Dept (2)
  // Analyst Manager (2) → Analyst Dept (1)
  // Designer Manager (8) → Design Dept (3)
  // QC Manager (6) → QC Dept (4)
  const getDepartmentIdFromRole = (): number | null => {
    if (!user?.roles || user.roles.length === 0) return null;
    
    const roleId = user.roles[0].id; // Use first role's ID
    const roleToDepMap: Record<number, number> = {
      2: 1,  // Analyst Manager → Analyst Department
      4: 2,  // Development Manager → Development Department
      6: 4,  // QC Manager → QC Department
      8: 3,  // Designer Manager → Design Department
    };
    
    return roleToDepMap[roleId] || null;
  };

  const departmentId = getDepartmentIdFromRole();

  // Fetch department members - EXACT SAME AS DEPARTMENTS PAGE
  const {
    members,
    loading: membersLoading,
    totalPages,
  } = useDepartmentMembers(
    departmentId || 0,
    currentPage,
    10,
    searchTerm,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("myTeam.title")}</h1>
          <p className="text-default-500">{t("myTeam.description")}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between mb-4">
        <Input
          className="sm:max-w-xs"
          placeholder={t("myTeam.searchPlaceholder")}
          startContent={<SearchIcon size={18} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardBody>

          {/* Members Table - EXACT SAME AS DEPARTMENTS PAGE */}
          {membersLoading ? (
            <Table aria-label="Loading team members table">
              <TableHeader>
                <TableColumn>{t("myTeam.fullName")}</TableColumn>
                <TableColumn>{t("myTeam.militaryNumber")}</TableColumn>
                <TableColumn>{t("myTeam.gradeName")}</TableColumn>
                <TableColumn>{t("myTeam.joinDate")}</TableColumn>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={`member-skeleton-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24 rounded" />
                          <Skeleton className="h-3 w-16 rounded" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20 rounded" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : members.length === 0 ? (
            <div className="text-center p-8 text-default-500">
              {t("myTeam.noMembersFound")}
            </div>
          ) : (
            <Table aria-label="Department members table">
              <TableHeader>
                <TableColumn>{t("myTeam.fullName")}</TableColumn>
                <TableColumn>{t("myTeam.militaryNumber")}</TableColumn>
                <TableColumn>{t("myTeam.gradeName")}</TableColumn>
                <TableColumn>{t("myTeam.joinDate")}</TableColumn>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div
                        className={`flex items-center gap-2 ${language === "ar" ? "text-right" : ""}`}
                        dir={language === "ar" ? "rtl" : "ltr"}
                      >
                        <Avatar
                          showFallback
                          name={member.user.fullName}
                          size="sm"
                        />
                        <div>
                          <div className="font-medium">
                            {member.user.fullName}
                          </div>
                          <div className="text-sm text-default-500">
                            @{member.user.userName}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          language === "ar" ? "text-right block" : ""
                        }
                        dir={language === "ar" ? "rtl" : "ltr"}
                      >
                        {member.user.militaryNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          language === "ar" ? "text-right block" : ""
                        }
                        dir={language === "ar" ? "rtl" : "ltr"}
                      >
                        {member.user.gradeName}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(member.joinDate).toLocaleDateString("en-US")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Members Pagination - EXACT SAME AS DEPARTMENTS PAGE */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <GlobalPagination
                currentPage={currentPage}
                pageSize={10}
                totalItems={0}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
