import { Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/pages/auth/Login';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPassword';
import { AuthLanding } from '@/pages/AuthLanding';
import { UnauthorizedPage } from '@/pages/Unauthorized';
import { SuperAdminDashboard } from '@/pages/super-admin/Dashboard';
import { SchoolsListPage } from '@/pages/super-admin/SchoolsList';
import { SchoolFormPage } from '@/pages/super-admin/SchoolForm';
import { SchoolDetailPage } from '@/pages/super-admin/SchoolDetail';
import { PlansListPage } from '@/pages/super-admin/PlansList';
import { PlanFormPage } from '@/pages/super-admin/PlanForm';
import { FeaturesListPage } from '@/pages/super-admin/FeaturesList';
import { SuperAdminTicketsPage } from '@/pages/super-admin/Tickets';
import { PlatformAnnouncementsPage } from '@/pages/super-admin/PlatformAnnouncements';
import { SuperAdminAccountPage } from '@/pages/super-admin/SuperAdminAccount';
import { MobileMoreSuperAdmin } from '@/components/mobile/MobileMoreSuperAdmin';
import { MobileNotifications } from '@/components/mobile/MobileNotifications';
import { SchoolAdminDashboard } from '@/pages/school/Dashboard';
import { SchoolSubscriptionPage } from '@/pages/school/Subscription';
import { StudentsListPage } from '@/pages/school/students/StudentsList';
import { StudentFormPage } from '@/pages/school/students/StudentForm';
import { StudentDetailPage } from '@/pages/school/students/StudentDetail';
import { TeachersListPage } from '@/pages/school/teachers/TeachersList';
import { TeacherFormPage } from '@/pages/school/teachers/TeacherForm';
import { ParentsListPage } from '@/pages/school/parents/ParentsList';
import { ParentFormPage } from '@/pages/school/parents/ParentForm';
import { StaffListPage } from '@/pages/school/staff/StaffList';
import { StaffFormPage } from '@/pages/school/staff/StaffForm';
import { MarkAttendancePage } from '@/pages/school/attendance/MarkAttendance';
import { PunchReportsPage } from '@/pages/school/attendance/PunchReports';
import { MobilePunch } from '@/components/mobile/MobilePunch';
import { SchoolSettingsPage } from '@/pages/school/settings/SchoolSettings';
import { AcademicsPage } from '@/pages/school/academics/Academics';
import { AssignmentsPage } from '@/pages/school/academics/Assignments';
import { TimetablePage } from '@/pages/school/academics/Timetable';
import { HomeworkPage } from '@/pages/school/homework/Homework';
import { AssignmentsWorkPage } from '@/pages/school/assignments/AssignmentsWork';
import { MaterialsPage } from '@/pages/school/materials/Materials';
import { ExamsPage } from '@/pages/school/exams/Exams';
import { MarksPage } from '@/pages/school/exams/Marks';
import { ReportCardPage } from '@/pages/school/exams/ReportCard';
import { ExamSeatingPage } from '@/pages/school/exams/ExamSeating';
import { FeesPage } from '@/pages/school/fees/Fees';
import { AccountsPage } from '@/pages/school/accounts/Accounts';
import { PayrollPage } from '@/pages/school/payroll/Payroll';
import { LibraryPage } from '@/pages/school/library/Library';
import { TransportPage } from '@/pages/school/transport/Transport';
import { InventoryPage } from '@/pages/school/inventory/Inventory';
import { AdmissionsPage } from '@/pages/school/admissions/Admissions';
import { CertificatesPage } from '@/pages/school/certificates/Certificates';
import { MessagingPage } from '@/pages/school/messaging/Messaging';
import { EventsPage } from '@/pages/school/events/Events';
import { PtmPage } from '@/pages/school/ptm/Ptm';
import { ReportsPage } from '@/pages/school/reports/Reports';
import { AuditLogPage } from '@/pages/school/audit/AuditLog';
import { TicketsPage } from '@/pages/school/tickets/Tickets';
import { GrievancesPage } from '@/pages/school/grievances/Grievances';
import { LeaveManagementPage } from '@/pages/school/leave/LeaveManagement';
import { MobileMoreSchool } from '@/components/mobile/MobileMoreSchool';
import { CircularsPage } from '@/pages/school/circulars/Circulars';
import { SurveysPage } from '@/pages/school/surveys/Surveys';
import { TeacherDashboard } from '@/pages/teacher/Dashboard';
import { ParentDashboard } from '@/pages/parent/Dashboard';
import { DriverDashboard } from '@/pages/driver/Dashboard';
import { StudentDashboard } from '@/pages/student/Dashboard';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { SchoolLayout } from '@/components/layout/SchoolLayout';
import { ROLES } from '@/types/roles';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route
        path="/super-admin"
        element={
          <ProtectedRoute>
            <RoleGuard allow={[ROLES.SUPER_ADMIN]}>
              <SuperAdminLayout />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<SuperAdminDashboard />} />
        <Route path="schools" element={<SchoolsListPage />} />
        <Route path="schools/new" element={<SchoolFormPage />} />
        <Route path="schools/:id" element={<SchoolDetailPage />} />
        <Route path="schools/:id/edit" element={<SchoolFormPage />} />
        <Route path="plans" element={<PlansListPage />} />
        <Route path="plans/new" element={<PlanFormPage />} />
        <Route path="plans/:id/edit" element={<PlanFormPage />} />
        <Route path="features" element={<FeaturesListPage />} />
        <Route path="tickets" element={<SuperAdminTicketsPage />} />
        <Route path="announcements" element={<PlatformAnnouncementsPage />} />
        <Route path="account" element={<SuperAdminAccountPage />} />
        <Route path="more" element={<MobileMoreSuperAdmin />} />
        <Route path="notifications" element={<MobileNotifications />} />
      </Route>

      <Route
        path="/school"
        element={
          <ProtectedRoute>
            <RoleGuard
              allow={[
                ROLES.SCHOOL_ADMIN,
                ROLES.TEACHER,
                ROLES.ACCOUNTANT,
                ROLES.LIBRARIAN,
                ROLES.RECEPTIONIST,
                ROLES.TRANSPORT_MANAGER,
                ROLES.HR_MANAGER,
              ]}
            >
              <SchoolLayout />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<SchoolAdminDashboard />} />
        <Route path="subscription" element={<SchoolSubscriptionPage />} />

        <Route path="students" element={<StudentsListPage />} />
        <Route path="students/new" element={<StudentFormPage />} />
        <Route path="students/:id" element={<StudentDetailPage />} />
        <Route path="students/:id/edit" element={<StudentFormPage />} />

        <Route path="teachers" element={<TeachersListPage />} />
        <Route path="teachers/new" element={<TeacherFormPage />} />
        <Route path="teachers/:id/edit" element={<TeacherFormPage />} />

        <Route path="parents" element={<ParentsListPage />} />
        <Route path="parents/new" element={<ParentFormPage />} />
        <Route path="parents/:id/edit" element={<ParentFormPage />} />

        <Route path="staff" element={<StaffListPage />} />
        <Route path="staff/new" element={<StaffFormPage />} />
        <Route path="staff/:id/edit" element={<StaffFormPage />} />

        <Route path="attendance" element={<MarkAttendancePage />} />
        <Route path="teacher-attendance" element={<PunchReportsPage />} />
        <Route path="punch" element={<MobilePunch />} />
        <Route path="settings" element={<SchoolSettingsPage />} />
        <Route path="academics" element={<AcademicsPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="timetable" element={<TimetablePage />} />
        <Route path="homework" element={<HomeworkPage />} />
        <Route path="assignments-work" element={<AssignmentsWorkPage />} />
        <Route path="materials" element={<MaterialsPage />} />
        <Route path="exams" element={<ExamsPage />} />
        <Route path="marks" element={<MarksPage />} />
        <Route path="report-cards" element={<ReportCardPage />} />
        <Route path="exam-seating" element={<ExamSeatingPage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="payroll" element={<PayrollPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="transport" element={<TransportPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="admissions" element={<AdmissionsPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="messaging" element={<MessagingPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="ptm" element={<PtmPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit-log" element={<AuditLogPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="grievances" element={<GrievancesPage />} />
        <Route path="leave" element={<LeaveManagementPage />} />
        <Route path="more" element={<MobileMoreSchool />} />
        <Route path="notifications" element={<MobileNotifications />} />
        <Route path="circulars" element={<CircularsPage />} />
        <Route path="surveys" element={<SurveysPage />} />
      </Route>

      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute>
            <RoleGuard allow={[ROLES.TEACHER]}>
              <TeacherDashboard />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/parent/dashboard"
        element={
          <ProtectedRoute>
            <RoleGuard allow={[ROLES.PARENT]}>
              <ParentDashboard />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/driver/dashboard"
        element={
          <ProtectedRoute>
            <RoleGuard allow={[ROLES.DRIVER]}>
              <DriverDashboard />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute>
            <RoleGuard allow={[ROLES.STUDENT]}>
              <StudentDashboard />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<AuthLanding />} />
      <Route path="*" element={<AuthLanding />} />
    </Routes>
  );
}
