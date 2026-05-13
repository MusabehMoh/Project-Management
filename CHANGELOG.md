# سجل التحديثات — Project Management System

## الإصدار 2.0.0 — تبسيط النظام لـ Admin + Project Manager

**تاريخ الإصدار:** 2026-05-13  
**فرع التطوير:** `feature/simplified-pm-system`  
**المساهم:** Saeed Al-Shebli — saeedalshebli1994@gmail.com

---

## نظرة عامة

إعادة هيكلة شاملة للنظام بهدف تبسيطه وتركيزه على دورين رئيسيين فقط:
**Admin** و **Project Manager**، مع تحويل الموظفين إلى قائمة بيانات (Lookup) لأغراض إسناد المهام والتقييم.

---

## التغييرات في الـ Backend

### 1. تبسيط الأدوار (Roles)

**قبل:**
```
Administrator (1)
AnalystManager (2)
DevelopmentManager (4)
QCManager (6)
DesignerManager (8)
```

**بعد:**
```
Administrator (1)
ProjectManager (2)
```

**الملف:** `pma-api-server/src/PMA.Core/Enums/RoleCodes.cs`

---

### 2. تبسيط حالات المهام (TaskStatus)

**قبل:** ToDo / InProgress / InReview / Rework / Completed / Blocked

**بعد:** ToDo / InProgress / InReview / Completed

**الملف:** `pma-api-server/src/PMA.Core/Enums/TaskStatus.cs`

---

### 3. إضافة حقل IsClassified للمشاريع

- مشاريع `Classified = true` مرئية للـ Admin فقط، أو للـ PM المُعيَّن عليها
- مشاريع `Classified = false` مرئية للجميع (عرض فقط للـ PM غير المُعيَّن)

**الملف:** `pma-api-server/src/PMA.Core/Entities/Project.cs`

---

### 4. إضافة جدول ProjectManagerAssignment

ربط الـ Project Manager بالمشاريع المُعيَّن عليها:

```
ProjectManagerAssignment {
  Id
  ProjectId    → Project
  UserId       → User (PM)
  AssignedBy   → User (Admin)
  AssignedAt
}
```

**الملف:** `pma-api-server/src/PMA.Core/Entities/ProjectManagerAssignment.cs`

---

### 5. تحديث Authorization Attributes

أُضيفت صلاحيتان جديدتان:

| Attribute | الوصف |
|-----------|-------|
| `RequireAdminOrPM` | يسمح للـ Admin أو ProjectManager فقط |
| `RequireProjectManageAccess` | يسمح للـ Admin أو PM المُعيَّن على المشروع |

**الملف:** `pma-api-server/src/PMA.Api/Attributes/AuthorizationAttributes.cs`

---

### 6. حذف 17 Controller غير ضرورية

| Controller المحذوف | السبب |
|--------------------|-------|
| `ProjectRequirementsController` | حُذف نظام المتطلبات بالكامل |
| `RequirementsController` | حُذف نظام المتطلبات بالكامل |
| `RequirementCompletionController` | حُذف نظام المتطلبات بالكامل |
| `RequirementOverviewController` | حُذف نظام المتطلبات بالكامل |
| `DeveloperQuickActionsController` | خاص بالمطورين (دور ملغى) |
| `DeveloperTeamController` | خاص بالمطورين (دور ملغى) |
| `DeveloperWorkloadController` | خاص بالمطورين (دور ملغى) |
| `QcController` | خاص بفريق QC (دور ملغى) |
| `QCQuickActionsController` | خاص بفريق QC (دور ملغى) |
| `DesignersController` | خاص بالمصممين (دور ملغى) |
| `DesignRequestsController` | خاص بالمصممين (دور ملغى) |
| `PipelineController` | معقد وغير ضروري للنظام المبسط |
| `QuickActionsController` | مدمج مع أدوار ملغاة |
| `SubtasksController` | تبسيط هيكل المهام |
| `AIController` | غير ضروري في النطاق الحالي |
| `TeamWorkloadController` | استُبدل بـ WorkloadController الجديد |
| `MembersTasksController` | استُبدل بمنطق مبسط |

**Controllers المتبقية (10 فقط):**
ProjectsController, TasksController, UsersController, RolesController,
DepartmentsController, EmployeesController, WorkloadController,
ProjectManagerAssignmentsController, NotificationsController,
DashboardStatsController, CalendarController, SprintsController,
LookupsController, TimelineController, AuditLogsController

---

### 7. إضافة WorkloadController (جديد)

Endpoints جديدة لتقييم الموظفين ومتابعة حجم العملهم:

| Endpoint | الوصف |
|----------|-------|
| `GET /api/workload` | حجم عمل جميع الموظفين |
| `GET /api/workload/employee/{id}` | ملف أداء موظف محدد |
| `GET /api/workload/overdue` | المهام المتأخرة عبر الفريق |
| `GET /api/workload/dashboard` | إحصائيات Dashboard الرئيسية |

**مستويات حجم العمل:**
- `Free` — لا مهام نشطة
- `Light` — 1-2 مهمة
- `Moderate` — 3-4 مهام
- `Heavy` — 5-6 مهام
- `Overloaded` — أكثر من 6 مهام

**الملف:** `pma-api-server/src/PMA.Api/Controllers/WorkloadController.cs`

---

### 8. إضافة ProjectManagerAssignmentsController (جديد)

إدارة تعيين الـ PM على المشاريع (للـ Admin فقط):

| Endpoint | الوصف |
|----------|-------|
| `GET /api/projects/{id}/managers` | قائمة الـ PM المُعيَّنين |
| `POST /api/projects/{id}/managers` | تعيين PM جديد |
| `DELETE /api/projects/{id}/managers/{userId}` | إلغاء تعيين PM |

**الملف:** `pma-api-server/src/PMA.Api/Controllers/ProjectManagerAssignmentsController.cs`

---

### 9. تحديث ApplicationDbContext

- ✅ إضافة `DbSet<ProjectManagerAssignment>`
- ❌ حذف `DbSet<ProjectRequirement>`
- ❌ حذف `DbSet<ProjectRequirementAttachment>`
- ❌ حذف `DbSet<RequirementTask>`
- ❌ حذف `DbSet<ProjectRequirementStatusHistory>`

---

## التغييرات في الـ Frontend

### 1. تبسيط ملف الأدوار

**الملف:** `src/constants/roles.ts`

```typescript
// قبل: 9 أدوار
// بعد: دورين فقط
export enum RoleIds {
  ADMINISTRATOR = 1,
  PROJECT_MANAGER = 2,
}
```

دوال مساعدة جديدة:
- `isAdmin(roleIds)` — التحقق من صلاحية Admin
- `isProjectManager(roleIds)` — التحقق من صلاحية PM
- `isAdminOrPM(roleIds)` — التحقق من أي من الدورين

---

### 2. تحديث مسارات التطبيق (App.tsx)

**المسارات المحذوفة:**
- `/requirements` — صفحة المتطلبات
- `/requirements/:projectId` — متطلبات المشروع
- `/development-requirements` — متطلبات التطوير
- `/approval-requests` — طلبات الموافقة
- `/company-employees` — موظفو الشركة (القديم)
- `/departments` — الأقسام
- `/department-members` — أعضاء القسم
- `/design-requests` — طلبات التصميم
- `/tasks` (القديم)

**المسارات الجديدة:**
- `/projects/:projectId/tasks` — مهام المشروع (Kanban)
- `/employees` — قائمة الموظفين (Lookup)
- `/workload` — صفحة حجم العمل
- `/employees/:employeeId` — ملف أداء الموظف

---

### 3. تبسيط شريط التنقل (Navbar)

**تابات Admin:**
- Dashboard
- المشاريع
- حجم العمل
- الموظفون
- Timeline
- إدارة المستخدمين (Dropdown)

**تابات Project Manager:**
- Dashboard
- المشاريع
- حجم العمل
- الموظفون
- Timeline

**محذوف من الـ Navbar:**
- المتطلبات
- طلبات الموافقة
- متطلبات التطوير
- طلبات التصميم
- أعضاء القسم
- موظفو الشركة
- الأقسام

---

### 4. مكون Kanban Board الجديد

**الملف:** `src/components/ProjectKanban.tsx`

**الميزات:**
- **Drag & Drop:** سحب المهام بين الأعمدة لتغيير حالتها
- **Quick Task Creation:** إضافة مهمة بضغط Enter في سطر واحد
- **فورم مبسط:** 4 حقول أساسية فقط (العنوان، الموظف، الأولوية، الموعد)
- **مؤشر حجم العمل:** يظهر عند اختيار الموظف (عدد مهامه النشطة ومستوى التحميل)

**الأعمدة:**
```
لم تبدأ → جارية → مراجعة → منجزة
```

---

### 5. صفحة حجم العمل الجديدة

**الملف:** `src/pages/workload.tsx`

**الميزات:**
- بطاقة لكل موظف تعرض: النشطة / المنجزة / المتأخرة / معدل الإنجاز
- مؤشر مرئي لمستوى التحميل (Free → Overloaded)
- فلاتر سريعة: الكل / مثقل / متأخر / متاح
- بحث بالاسم
- الضغط على بطاقة الموظف ينقل لملف أدائه

---

### 6. صفحة ملف أداء الموظف الجديدة

**الملف:** `src/pages/employee-profile.tsx`

**يعرض:**
- إجمالي المهام المنجزة / الجارية / المتأخرة
- معدل الإنجاز الإجمالي (%)
- معدل الإنجاز في الوقت المحدد (%)
- قائمة المهام مع فلاتر (الكل / جارية / لم تبدأ / مراجعة / منجزة / متأخرة)

---

## ملخص الأرقام

| المعيار | قبل | بعد |
|---------|-----|-----|
| عدد الأدوار | 9 | 2 |
| عدد الـ Controllers | 37 | 20 |
| حالات المهمة | 6 | 4 |
| مسارات الـ Frontend | 18 | 10 |
| أسطر الكود المحذوفة | — | 8,705 |
| أسطر الكود المضافة | — | 1,167 |

---

## منطق الوصول للمشاريع

```
مشروع عادي (IsClassified = false)
├── Admin          → عرض + إدارة كاملة
├── PM مُعيَّن     → عرض + إدارة
└── PM غير مُعيَّن → عرض فقط (بدون تعديل)

مشروع مصنف (IsClassified = true)
├── Admin          → عرض + إدارة كاملة
├── PM مُعيَّن     → عرض + إدارة
└── PM غير مُعيَّن → لا يظهر في القائمة
```

---

## المساهمون

| الاسم | البريد الإلكتروني | الدور |
|-------|-----------------|-------|
| Saeed Al-Shebli | saeedalshebli1994@gmail.com | مدير المشروع / صاحب القرار |
| Claude Sonnet 4.6 | noreply@anthropic.com | تطوير وتنفيذ التغييرات |

---

*آخر تحديث: 2026-05-13*
