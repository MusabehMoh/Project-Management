import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/table";
import { Progress } from "@heroui/progress";
import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";

import { useLanguage } from "@/contexts/LanguageContext";
import { teamWorkloadService, type TeamMemberMetrics } from "@/services/api/teamWorkloadService";

// Get performance color based on score
const getPerformanceColor = (score: number) => {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "danger";
};

// Format busy until date for tooltip
const formatBusyUntil = (busyUntil: string | undefined, t: (key: string) => string) => {
  if (!busyUntil) return "";
  
  const busyDate = new Date(busyUntil);
  const now = new Date();
  const diffTime = busyDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return t("team.busyUntilToday");
  if (diffDays === 1) return t("team.busyUntilTomorrow");
  if (diffDays <= 7) return t("team.busyUntilDays").replace("{days}", diffDays.toString());
  
  return t("team.busyUntilDate").replace("{date}", busyDate.toLocaleDateString());
};

const TeamWorkloadPerformance: React.FC = () => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [teamData, setTeamData] = useState<TeamMemberMetrics[]>([]);
  
  useEffect(() => {
    const fetchTeamWorkloadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await teamWorkloadService.getTeamWorkloadPerformance();
        
        if (response.success) {
          setTeamData(response.data);
        } else {
          throw new Error('Failed to fetch team workload data');
        }
      } catch (err) {
        console.error('Error loading team workload data:', err);
        setError('An error occurred while loading team workload data');
        setTeamData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamWorkloadData();
  }, []);
  
  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}>
      <Card className="w-full shadow-md border border-default-200">
        <CardHeader className="pb-0">
          <h3 className="text-lg font-medium">{t("dashboard.teamWorkload")}</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" color="primary" />
            </div>
          ) : error ? (
            <div className="text-center text-danger py-4">{error}</div>
          ) : teamData.length === 0 ? (
            <div className="text-center text-default-500 py-4">
              {t("table.noData")}
            </div>
          ) : (
            <Table aria-label="Team workload and performance table" removeWrapper>
              <TableHeader>
                <TableColumn>{t("team.member")}</TableColumn>
                <TableColumn>{t("team.department")}</TableColumn>
                <TableColumn className="text-center">{t("team.total")}</TableColumn>
                <TableColumn className="text-center">{t("team.inProgress")}</TableColumn>
                <TableColumn className="text-center">{t("team.completed")}</TableColumn>
                <TableColumn>{t("team.performance")}</TableColumn>
                <TableColumn>{t("team.busy")}</TableColumn>
              </TableHeader>
              <TableBody>
                {teamData.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{member.fullName}</div>
                        <div className="text-xs text-default-500">{member.gradeName}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{member.department}</TableCell>
                    <TableCell className="text-center font-medium">
                      {member.metrics.totalRequirements}
                    </TableCell>
                    <TableCell className="text-center">
                      {member.metrics.inProgress}
                    </TableCell>
                    <TableCell className="text-center">
                      {member.metrics.completed}
                    </TableCell>
                    <TableCell>
                      <Tooltip content={`${t("team.performance")}: ${member.metrics.performance}%`} showArrow>
                        <Progress
                          size="sm"
                          value={member.metrics.performance}
                          color={getPerformanceColor(member.metrics.performance)}
                          className="w-full cursor-help"
                          showValueLabel={false}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {member.busyStatus === "busy" ? (
                        <Tooltip content={formatBusyUntil(member.busyUntil, t)} showArrow>
                          <span className="text-danger font-semibold cursor-help">{t("team.busy")}</span>
                        </Tooltip>
                      ) : (
                        <span className="text-success font-semibold">{t("team.available")}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default TeamWorkloadPerformance;
