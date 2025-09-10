import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { useLanguage } from "@/contexts/LanguageContext";
import { Progress } from "@heroui/progress";

// Mock data for requirements overview - replace with real data in production
const mockRequirementsData = {
  newRequirements: {
    count: 12,
    total: 20, // For percentage calculation
    increasedBy: 4, // Compared to previous period
  },
  ongoingRequirements: {
    count: 18,
    total: 30, // For percentage calculation
    increasedBy: -2, // Negative means decreased
  },
  activeRequirements: 32,
  pendingApprovals: 7
};

interface RequirementOverviewProps {
  useMockData?: boolean;
}

export const RequirementOverview: React.FC<RequirementOverviewProps> = ({
  useMockData = true // Set to true for development, should be false in production
}) => {
  const { t, language } = useLanguage();
  
  // In a real implementation, fetch data from your API
  // For now, we'll use mock data
  const data = useMockData ? mockRequirementsData : {
    newRequirements: { count: 0, total: 0, increasedBy: 0 },
    ongoingRequirements: { count: 0, total: 0, increasedBy: 0 },
    activeRequirements: 0,
    pendingApprovals: 0
  };
  
  // Calculate percentages
  const newRequirementsPercentage = data.newRequirements.total > 0 
    ? Math.round((data.newRequirements.count / data.newRequirements.total) * 100) 
    : 0;
    
  const ongoingRequirementsPercentage = data.ongoingRequirements.total > 0 
    ? Math.round((data.ongoingRequirements.count / data.ongoingRequirements.total) * 100) 
    : 0;
  
  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Card className="w-full shadow-md border border-default-200">
        <CardHeader className="pb-0">
          <h3 className="text-lg font-medium text-foreground">{t("dashboard.requirementOverview")}</h3>
        </CardHeader>
        
        <CardBody className="px-4 py-3">
          <div className="grid grid-cols-2 gap-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Left column - vertical graphs */}
            <div className="space-y-4">
              {/* New Requirements */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{t("requirements.new")}</span>
                  <span className="text-sm text-default-600">
                    {data.newRequirements.count}/{data.newRequirements.total}
                  </span>
                </div>
                <div className="flex items-center" style={{flexDirection: language === 'ar' ? 'row-reverse' : 'row'}}>
                  <Progress
                    aria-label="New Requirements"
                    size="sm"
                    value={newRequirementsPercentage}
                    color="success"
                    className="flex-1"
                    showValueLabel={false}
                  />
                  <div className="mx-2 text-xs whitespace-nowrap">
                    <span className={`font-medium ${data.newRequirements.increasedBy >= 0 ? 'text-success' : 'text-danger'}`}>
                      {data.newRequirements.increasedBy >= 0 ? '+' : ''}
                      {data.newRequirements.increasedBy}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Ongoing Requirements */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{t("requirements.ongoing")}</span>
                  <span className="text-sm text-default-600">
                    {data.ongoingRequirements.count}/{data.ongoingRequirements.total}
                  </span>
                </div>
                <div className="flex items-center" style={{flexDirection: language === 'ar' ? 'row-reverse' : 'row'}}>
                  <Progress
                    aria-label="Ongoing Requirements"
                    size="sm"
                    value={ongoingRequirementsPercentage}
                    color="warning"
                    className="flex-1"
                    showValueLabel={false}
                  />
                  <div className="mx-2 text-xs whitespace-nowrap">
                    <span className={`font-medium ${data.ongoingRequirements.increasedBy >= 0 ? 'text-success' : 'text-danger'}`}>
                      {data.ongoingRequirements.increasedBy >= 0 ? '+' : ''}
                      {data.ongoingRequirements.increasedBy}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column - count stats */}
            <div className={`${language === 'ar' ? 'border-r pe-4' : 'border-l ps-4'} border-default-200 flex flex-col justify-center`}>
              {/* Active Requirements */}
              <div className="text-center mb-3">
                <p className="text-sm font-medium">{t("requirements.active")}</p>
                <p className="text-2xl font-bold text-primary">{data.activeRequirements}</p>
              </div>
              
              <Divider />
              
              {/* Pending Approvals */}
              <div className="text-center mt-3">
                <p className="text-sm font-medium">{t("requirements.pendingApprovals")}</p>
                <p className="text-2xl font-bold text-warning">{data.pendingApprovals}</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default RequirementOverview;
