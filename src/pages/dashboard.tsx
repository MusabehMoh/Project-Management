import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Progress } from "@heroui/progress";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import DefaultLayout from "@/layouts/default";

export default function DashboardPage() {
  const handleUnderReviewClick = () => {
    // Navigate to projects under review or show modal
    alert(
      "Showing 5 projects under review:\n\n1. Project Alpha - Marketing Campaign\n2. Project Beta - Website Redesign\n3. Project Gamma - Mobile App\n4. Project Delta - API Integration\n5. Project Echo - Database Migration",
    );
    // In real implementation, you would:
    // - Navigate to a filtered projects page
    // - Open a modal with project details
    // - Use router.push('/projects?status=under-review')
  };

  const requirementsData = [
    { name: "New Req", value: 125, color: "#3b82f6" },
    { name: "Change Req", value: 17, color: "#f59e0b" },
    { name: "Pending", value: 15, color: "#ef4444" },
  ];

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Top Section with Alerts and Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left Side - Urgent Attention / Notifications */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Urgent Attention / Notifications
              </h2>
              
              {/* Horizontal arrangement of notification cards */}
              <div className="space-y-3">
                {/* Card 1: Projects Under Review - Red Alert */}
                <Card className="bg-danger text-white shadow-medium overflow-hidden">
                  <CardBody className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-3">
                          <span className="text-lg">🚨</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-base flex items-center gap-2">
                            Projects Under Review
                            <span className="bg-white text-danger px-2 py-1 rounded text-xs font-semibold">
                              3
                            </span>
                          </div>
                          <div className="text-xs opacity-90 mt-1">
                            Required Four Personnel Attention
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-full w-12 h-12 flex-shrink-0 ml-3 flex items-center justify-center overflow-hidden">
                        <img
                          alt="Project Review"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;

                            const fallback = img.nextElementSibling as HTMLElement;
                            img.style.display = "none";
                            if (fallback) fallback.style.display = "flex";
                          }}
                          src="/assets/project-review.png"
                        />
                        <div className="hidden w-full h-full bg-gray-200 items-center justify-center text-gray-500 text-xs">
                          📋
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Card 2: Overdue Tasks - Orange Warning */}
                <Card className="bg-warning text-white shadow-medium overflow-hidden">
                  <CardBody className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-3">
                          <span className="text-lg">⚠️</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-base flex items-center gap-2">
                            Overdue Tasks
                            <span className="bg-white text-warning px-2 py-1 rounded text-xs font-semibold">
                              2
                            </span>
                          </div>
                          <div className="text-xs opacity-90 mt-1">
                            Check statuses under task management
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-full w-12 h-12 flex-shrink-0 ml-3 flex items-center justify-center overflow-hidden">
                        <img
                          alt="Overdue Tasks"
                          className="w-full h-full object-cover"
                          src="/assets/overdue-tasks.png"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;

                            const fallback = img.nextElementSibling as HTMLElement;
                            img.style.display = "none";
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                        <div className="hidden w-full h-full bg-gray-200 items-center justify-center text-gray-500 text-xs">
                          ⏰
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Card 3: New Change Requests - Blue Info */}
                <Card className="bg-primary text-white shadow-medium overflow-hidden">
                  <CardBody className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-3">
                          <span className="text-lg">ℹ️</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-base flex items-center gap-2">
                            Change Behind Schedule
                            <span className="bg-white text-primary px-2 py-1 rounded text-xs font-semibold">
                              7
                            </span>
                          </div>
                          <div className="text-xs opacity-90 mt-1">
                            Please timelines need Updated
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-full w-12 h-12 flex-shrink-0 ml-3 flex items-center justify-center overflow-hidden">
                        <img
                          alt="Change Request"
                          className="w-full h-full object-cover"
                          src="/assets/change-request.png"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;

                            const fallback = img.nextElementSibling as HTMLElement;

                            img.style.display = "none";
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                        <div className="hidden w-full h-full bg-gray-200 items-center justify-center text-gray-500 text-xs">
                          📝
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>

            {/* Right Side - My Project Pipeline */}
            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <h2 className="text-lg font-semibold text-gray-800 text-center w-full">
                  My Project Pipeline
                </h2>
              </CardHeader>
              <CardBody className="pt-2">
                {/* Pipeline Stats - Kanban Flow */}
                <div className="grid grid-cols-5 gap-2 mb-6 text-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700 mb-1">
                      2
                    </div>
                    <div className="text-xs text-gray-500">Draft</div>
                  </div>
                  <button
                    className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors border-0 bg-transparent"
                    type="button"
                    onClick={handleUnderReviewClick}
                  >
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      5
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      Under Review
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      📋 Click to view
                    </div>
                  </button>
                  <div className="bg-primary rounded-full px-3 py-2 text-white">
                    <div className="text-center">
                      <div className="text-xl font-bold">8</div>
                      <div className="text-xs">Analysis in Progress</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      3
                    </div>
                    <div className="text-xs text-gray-500">
                      Requirements Complete
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700 mb-1">
                      4
                    </div>
                    <div className="text-xs text-gray-500">Awaiting Dev</div>
                  </div>
                </div>

                {/* Flow Visual - Kanban-like Progress Bars */}
                <div className="space-y-2 mb-6">
                  {/* Draft to Under Review */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full w-1/5" />
                  </div>
                  {/* Under Review to Analysis */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full w-2/5" />
                  </div>
                  {/* Analysis in Progress - Current Focus */}
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="bg-primary h-4 rounded-full w-4/5 animate-pulse" />
                  </div>
                  {/* Requirements Complete */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full w-3/5" />
                  </div>
                  {/* Awaiting Dev */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-400 h-2 rounded-full w-2/5" />
                  </div>
                </div>

                {/* Key Insights */}
                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-4">
                  <div className="text-sm text-amber-800">
                    <strong>🚨 Bottleneck Alert:</strong> 8 projects in Analysis
                    phase - consider resource allocation
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-primary text-white" size="sm">
                    View All Projects
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Bottom Section with Team Workload and Requirements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Team Workload */}
            <Card className="shadow-medium">
              <CardHeader className="pb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Team Workload Workload & Performance
                </h2>
              </CardHeader>
              <CardBody>
                <Table removeWrapper aria-label="Team workload table">
                  <TableHeader>
                    <TableColumn>Team Name</TableColumn>
                    <TableColumn>Projects Assigned</TableColumn>
                    <TableColumn>Projects Unfinished</TableColumn>
                    <TableColumn>Pending</TableColumn>
                    <TableColumn>Status</TableColumn>
                  </TableHeader>
                  <TableBody>
                    <TableRow key="1">
                      <TableCell>Team Manager</TableCell>
                      <TableCell>
                        <Progress
                          className="w-full"
                          color="primary"
                          size="sm"
                          value={85}
                        />
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                    <TableRow key="2">
                      <TableCell>Dev Specialists & Business Leaders</TableCell>
                      <TableCell>
                        <Progress
                          className="w-full"
                          color="primary"
                          size="sm"
                          value={70}
                        />
                      </TableCell>
                      <TableCell>295</TableCell>
                      <TableCell>18</TableCell>
                      <TableCell>265</TableCell>
                    </TableRow>
                    <TableRow key="3">
                      <TableCell>
                        Amy Compliance Officer [New Recruit]
                      </TableCell>
                      <TableCell>230</TableCell>
                      <TableCell>18</TableCell>
                      <TableCell>300</TableCell>
                      <TableCell>15</TableCell>
                    </TableRow>
                    <TableRow key="4">
                      <TableCell>Amy Req Technical Tester</TableCell>
                      <TableCell>245</TableCell>
                      <TableCell>19</TableCell>
                      <TableCell>145</TableCell>
                      <TableCell>13</TableCell>
                    </TableRow>
                    <TableRow key="5">
                      <TableCell>Manager Avinash</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardBody>
            </Card>

            {/* Right Side - Requirements Overview */}
            <Card className="shadow-medium">
              <CardHeader className="pb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Requirements Overview
                </h2>
              </CardHeader>
              <CardBody>
                {/* Chart Section */}
                <div className="mb-6">
                  <ResponsiveContainer height={200} width="100%">
                    <BarChart data={requirementsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-6 mt-8">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">
                      Total Active Requirements
                    </div>
                    <div className="text-4xl font-bold text-gray-800 mt-2">
                      125
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">
                      Pending Approval
                    </div>
                    <div className="text-4xl font-bold text-gray-800 mt-2">
                      15
                    </div>
                  </div>
                </div>

                <Button className="mt-6 w-full" color="primary" size="sm">
                  View All Requirements Log
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
