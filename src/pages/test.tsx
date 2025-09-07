// import { useEffect, useState } from "react";
// import { Card, CardHeader, CardBody } from "@heroui/card";
// import { Button } from "@heroui/button";
// import { Chip } from "@heroui/chip";
// import { Divider } from "@heroui/divider";
// import { useDisclosure } from "@heroui/modal";
// import { Search, Database, Users, FolderOpen, Calendar } from "lucide-react";

// import { GlobalSearchModal } from "@/components/GlobalSearchModal";
// import { AccessTestControls } from "@/components/AccessTestControls";
// import { GlobalSearchService } from "@/services/globalSearchService";
// import { useLanguage } from "@/contexts/LanguageContext";
// import { useProjects } from "@/hooks/useProjects";
// import { useUsers } from "@/hooks/useUsers";
// import { useTimelines } from "@/hooks/useTimelines";

// export default function TestPage() {
//   const { t } = useLanguage();
//   const { isOpen, onOpen, onOpenChange } = useDisclosure();

//   // Load data through hooks
//   const { projects, loading: projectsLoading } = useProjects();
//   const { users, loading: usersLoading } = useUsers();
//   const { timelines, loading: timelinesLoading } = useTimelines();

//   const [searchStats, setSearchStats] = useState({
//     projects: 0,
//     users: 0,
//     timelines: 0,
//     totalSearchableItems: 0,
//   });

//   const [debugResults, setDebugResults] = useState<any[]>([]);
//   const [debugLoading, setDebugLoading] = useState(false);

//   // Initialize search service and calculate stats
//   useEffect(() => {
//     if (projects.length > 0 || users.length > 0 || timelines.length > 0) {
//       console.log("🔍 Test Page - Data available:", {
//         projects: projects.length,
//         users: users.length,
//         timelines: timelines.length,
//       });

//       // Initialize the search service
//       GlobalSearchService.initialize({
//         projects,
//         users,
//         timelines,
//       });

//       // Expose debug function to window for browser console testing
//       (window as any).searchDebug = GlobalSearchService.debug;
//       (window as any).testSearch = async (query: string) => {
//         const results = await GlobalSearchService.search({ query, limit: 20 });

//         console.log(`🔍 Console test results for "${query}":`, results);

//         return results;
//       };

//       console.log(
//         "🔍 Debug functions exposed to window: searchDebug() and testSearch(query)",
//       );

//       // Test a simple search
//       setTimeout(async () => {
//         try {
//           console.log('🔍 Testing search for "sarah"...');
//           const testResults = await GlobalSearchService.search({
//             query: "sarah",
//             limit: 10,
//           });

//           console.log("🔍 Test search results:", testResults);
//         } catch (error) {
//           console.error("🔍 Test search error:", error);
//         }
//       }, 1000);

//       // Calculate total searchable items
//       let totalItems = projects.length + users.length + timelines.length;

//       // Add sprints, tasks, and subtasks from timelines
//       timelines.forEach((timeline) => {
//         totalItems += timeline.sprints?.length || 0;
//         timeline.sprints?.forEach((sprint) => {
//           sprint.requirements?.forEach((requirement) => {
//             totalItems += requirement.tasks?.length || 0;
//             requirement.tasks?.forEach((task) => {
//               totalItems += task.subtasks?.length || 0;
//             });
//           });
//         });
//       });

//       setSearchStats({
//         projects: projects.length,
//         users: users.length,
//         timelines: timelines.length,
//         totalSearchableItems: totalItems,
//       });
//     }
//   }, [projects, users, timelines]);

//   const testSearchQueries = [
//     "Sarah",
//     "Portal",
//     "IT",
//     "Engineering",
//     "Sprint",
//     "Task",
//     "احمد", // Arabic name
//     "Captain",
//     "Timeline",
//   ];

//   // Manual test function
//   const testSearch = async (query: string) => {
//     setDebugLoading(true);
//     setDebugResults([]);

//     try {
//       console.log(`🔍 Manual test search for: "${query}"`);
//       const results = await GlobalSearchService.search({
//         query,
//         limit: 20,
//       });

//       console.log("🔍 Manual test results:", results);
//       setDebugResults(results || []);
//     } catch (error) {
//       console.error("🔍 Manual test error:", error);
//       setDebugResults([]);
//     } finally {
//       setDebugLoading(false);
//     }
//   };

//   const isLoading = projectsLoading || usersLoading || timelinesLoading;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <div className="flex items-center justify-center gap-3 mb-4">
//             <Search className="h-8 w-8 text-primary" />
//             <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//               Search Functionality Test
//             </h1>
//           </div>
//           <p className="text-lg text-default-600 max-w-2xl mx-auto">
//             Test the global search functionality with mock data. Search across
//             projects, users, timelines, sprints, tasks, and subtasks.
//           </p>
//         </div>

//         {/* Access Test Controls */}
//         <div className="mb-8">
//           <AccessTestControls />
//         </div>

//         {/* Search Stats */}
//         <Card className="mb-8 shadow-lg border-l-4 border-l-primary">
//           <CardHeader>
//             <div className="flex items-center gap-2">
//               <Database className="h-5 w-5 text-primary" />
//               <h2 className="text-xl font-semibold">Mock Data Statistics</h2>
//             </div>
//           </CardHeader>
//           <CardBody>
//             {isLoading ? (
//               <div className="flex items-center justify-center py-8">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
//                 <span className="ml-3 text-default-600">
//                   Loading mock data...
//                 </span>
//               </div>
//             ) : (
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//                 <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
//                   <FolderOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
//                   <div className="text-2xl font-bold text-blue-600">
//                     {searchStats.projects}
//                   </div>
//                   <div className="text-sm text-blue-600">Projects</div>
//                 </div>

//                 <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
//                   <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
//                   <div className="text-2xl font-bold text-green-600">
//                     {searchStats.users}
//                   </div>
//                   <div className="text-sm text-green-600">Users</div>
//                 </div>

//                 <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
//                   <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
//                   <div className="text-2xl font-bold text-purple-600">
//                     {searchStats.timelines}
//                   </div>
//                   <div className="text-sm text-purple-600">Timelines</div>
//                 </div>

//                 <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
//                   <Search className="h-8 w-8 text-orange-600 mx-auto mb-2" />
//                   <div className="text-2xl font-bold text-orange-600">
//                     {searchStats.totalSearchableItems}
//                   </div>
//                   <div className="text-sm text-orange-600">
//                     Total Searchable
//                   </div>
//                 </div>
//               </div>
//             )}
//           </CardBody>
//         </Card>

//         {/* Search Test */}
//         <Card className="mb-8 shadow-lg">
//           <CardHeader>
//             <h2 className="text-xl font-semibold">Search Test</h2>
//           </CardHeader>
//           <CardBody className="space-y-4">
//             <div className="flex items-center justify-center">
//               <Button
//                 className="font-medium px-8 py-6 text-lg"
//                 color="primary"
//                 size="lg"
//                 startContent={<Search />}
//                 onPress={onOpen}
//               >
//                 Open Global Search Modal
//               </Button>
//             </div>

//             <div className="text-center text-small text-default-500">
//               Or press{" "}
//               <Chip size="sm" variant="bordered">
//                 Ctrl + K
//               </Chip>{" "}
//               anywhere in the application
//             </div>

//             <Divider className="my-6" />

//             <div>
//               <h3 className="text-lg font-medium mb-4">
//                 Try These Search Queries:
//               </h3>
//               <div className="flex flex-wrap gap-2">
//                 {testSearchQueries.map((query) => (
//                   <Chip
//                     key={query}
//                     className="cursor-pointer hover:bg-primary/10 transition-colors"
//                     variant="bordered"
//                     onClick={() => testSearch(query)}
//                   >
//                     "{query}"
//                   </Chip>
//                 ))}
//               </div>
//             </div>

//             {/* Debug Results Section */}
//             {debugLoading && (
//               <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
//                 <div className="flex items-center gap-2">
//                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
//                   <span className="text-sm text-blue-600">
//                     Testing search...
//                   </span>
//                 </div>
//               </div>
//             )}

//             {debugResults.length > 0 && (
//               <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
//                 <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
//                   Debug Results ({debugResults.length} found):
//                 </h4>
//                 <div className="space-y-2 max-h-40 overflow-y-auto">
//                   {debugResults.map((result, index) => (
//                     <div
//                       key={index}
//                       className="text-xs p-2 bg-white dark:bg-gray-800 rounded border"
//                     >
//                       <div className="font-medium">{result.title}</div>
//                       <div className="text-gray-600 dark:text-gray-400">
//                         Type: {result.type}
//                       </div>
//                       {result.subtitle && (
//                         <div className="text-gray-500">{result.subtitle}</div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {debugResults.length === 0 && !debugLoading && (
//               <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
//                 <div className="text-sm text-yellow-800 dark:text-yellow-200">
//                   Click on a search query above to test the search functionality
//                   directly.
//                 </div>
//               </div>
//             )}
//           </CardBody>
//         </Card>

//         {/* Sample Data Preview */}
//         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {/* Projects Sample */}
//           <Card className="shadow-lg">
//             <CardHeader>
//               <div className="flex items-center gap-2">
//                 <FolderOpen className="h-5 w-5 text-blue-600" />
//                 <h3 className="font-semibold">Sample Projects</h3>
//               </div>
//             </CardHeader>
//             <CardBody>
//               {projects.slice(0, 3).map((project) => (
//                 <div
//                   key={project.id}
//                   className="mb-3 p-3 bg-default-50 rounded-lg"
//                 >
//                   <div className="font-medium text-sm">
//                     {project.applicationName}
//                   </div>
//                   <div className="text-xs text-default-600">
//                     {project.projectOwner}
//                   </div>
//                   <div className="text-xs text-default-500">
//                     {project.owningUnit}
//                   </div>
//                 </div>
//               ))}
//               {projects.length > 3 && (
//                 <div className="text-xs text-default-400 text-center">
//                   +{projects.length - 3} more projects...
//                 </div>
//               )}
//             </CardBody>
//           </Card>

//           {/* Users Sample */}
//           <Card className="shadow-lg">
//             <CardHeader>
//               <div className="flex items-center gap-2">
//                 <Users className="h-5 w-5 text-green-600" />
//                 <h3 className="font-semibold">Sample Users</h3>
//               </div>
//             </CardHeader>
//             <CardBody>
//               {users.slice(0, 3).map((user) => (
//                 <div
//                   key={user.id}
//                   className="mb-3 p-3 bg-default-50 rounded-lg"
//                 >
//                   <div className="font-medium text-sm">{user.fullName}</div>
//                   <div className="text-xs text-default-600">
//                     {user.gradeName} • {user.militaryNumber}
//                   </div>
//                   <div className="text-xs text-default-500">
//                     {user.department}
//                   </div>
//                 </div>
//               ))}
//               {users.length > 3 && (
//                 <div className="text-xs text-default-400 text-center">
//                   +{users.length - 3} more users...
//                 </div>
//               )}
//             </CardBody>
//           </Card>

//           {/* Timelines Sample */}
//           <Card className="shadow-lg">
//             <CardHeader>
//               <div className="flex items-center gap-2">
//                 <Calendar className="h-5 w-5 text-purple-600" />
//                 <h3 className="font-semibold">Sample Timelines</h3>
//               </div>
//             </CardHeader>
//             <CardBody>
//               {timelines.slice(0, 3).map((timeline) => (
//                 <div
//                   key={timeline.id}
//                   className="mb-3 p-3 bg-default-50 rounded-lg"
//                 >
//                   <div className="font-medium text-sm">{timeline.name}</div>
//                   <div className="text-xs text-default-600">
//                     {timeline.sprints?.length || 0} sprints
//                   </div>
//                   <div className="text-xs text-default-500">
//                     {timeline.startDate} - {timeline.endDate}
//                   </div>
//                 </div>
//               ))}
//               {timelines.length > 3 && (
//                 <div className="text-xs text-default-400 text-center">
//                   +{timelines.length - 3} more timelines...
//                 </div>
//               )}
//             </CardBody>
//           </Card>
//         </div>

//         {/* Instructions */}
//         <Card className="mt-8 shadow-lg border-l-4 border-l-success">
//           <CardHeader>
//             <h3 className="text-lg font-semibold text-success">How to Test</h3>
//           </CardHeader>
//           <CardBody className="space-y-3">
//             <div className="flex items-start gap-3">
//               <div className="bg-success/10 text-success rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
//                 1
//               </div>
//               <div className="text-sm">
//                 Click "Open Global Search Modal" or press{" "}
//                 <strong>Ctrl + K</strong>
//               </div>
//             </div>

//             <div className="flex items-start gap-3">
//               <div className="bg-success/10 text-success rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
//                 2
//               </div>
//               <div className="text-sm">
//                 Type any search query (minimum 2 characters)
//               </div>
//             </div>

//             <div className="flex items-start gap-3">
//               <div className="bg-success/10 text-success rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
//                 3
//               </div>
//               <div className="text-sm">
//                 Use filters to narrow results by type, status, or department
//               </div>
//             </div>

//             <div className="flex items-start gap-3">
//               <div className="bg-success/10 text-success rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
//                 4
//               </div>
//               <div className="text-sm">
//                 Click any result to see navigation (will show URL in console)
//               </div>
//             </div>
//           </CardBody>
//         </Card>
//       </div>

//       {/* Global Search Modal */}
//       <GlobalSearchModal isOpen={isOpen} onOpenChange={onOpenChange} />
//     </div>
//   );
// }
