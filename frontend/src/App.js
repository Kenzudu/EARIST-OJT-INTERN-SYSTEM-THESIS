// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Loader from "./pages/Loader";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import AdminSidebar from "./pages/AdminSidebar";
import CoordinatorSidebar from "./pages/CoordinatorSidebar";
import SupervisorSidebar from "./pages/SupervisorSidebar";
import StudentSidebar from "./pages/StudentSidebar";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import StudentNotifications from "./pages/StudentNotifications";
import StudentApplications from "./pages/StudentApplications";
import StudentInternships from "./pages/StudentInternships";
import StudentApply from "./pages/StudentApply";
import StudentSupport from "./pages/StudentSupport";
import AdminCompanies from "./pages/AdminCompanies";
import AdminInternships from "./pages/AdminInternships";
import AdminNotices from "./pages/AdminNotices";
import AdminApplications from "./pages/AdminApplications";
import AdminDocuments from "./pages/AdminDocuments";
import AdminSettings from "./pages/AdminSettings";
import AdminUsers from "./pages/AdminUsers";
import AdminDatabase from "./pages/AdminDatabase";
import AdminAnalytics from "./pages/AdminAnalytics";
import StudentSettings from "./pages/StudentSettings";
import RecommendationsPage from "./pages/RecommendationsPage";
import AdminDashboard from "./pages/AdminDashboard";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import CoordinatorDocuments from "./pages/CoordinatorDocuments";
import CoordinatorStudents from "./pages/CoordinatorStudents";
import CoordinatorRequirements from "./pages/CoordinatorRequirements";
import CoordinatorCompanies from "./pages/CoordinatorCompanies";
import CoordinatorApplications from "./pages/CoordinatorApplications";
import CoordinatorReports from "./pages/CoordinatorReports";
import CoordinatorMonitoring from "./pages/CoordinatorMonitoring";
import CoordinatorSettings from "./pages/CoordinatorSettings";
import CoordinatorProfile from "./pages/CoordinatorProfile";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import SupervisorInternships from "./pages/SupervisorInternships";
import SupervisorInterns from "./pages/SupervisorInterns";
import SupervisorProfile from "./pages/SupervisorProfile";
import SupervisorTasks from "./pages/SupervisorTasks";
import SupervisorJournals from "./pages/SupervisorJournals";
import SupervisorAttendance from "./pages/SupervisorAttendance";
import SupervisorEvaluations from "./pages/SupervisorEvaluations";
import SupervisorProgress from "./pages/SupervisorProgress";
import SupervisorReports from "./pages/SupervisorReports";
import SupervisorMessages from "./pages/SupervisorMessages";
import SupervisorNotifications from "./pages/SupervisorNotifications";
import AdminMessages from "./pages/AdminMessages";
import AdminNotifications from "./pages/AdminNotifications";
import CoordinatorMessages from "./pages/CoordinatorMessages";
import CoordinatorNotifications from "./pages/CoordinatorNotifications";
import SupervisorPlaceholder from "./pages/SupervisorPlaceholder";
import StudentJournal from "./pages/StudentJournal";
import StudentPreTraining from "./pages/StudentPreTraining";
import StudentProgress from "./pages/StudentProgress";
import StudentReports from "./pages/StudentReports";
import StudentTasks from "./pages/StudentTasks";
import StudentMessages from "./pages/StudentMessages";
import StudentAttendance from "./pages/StudentAttendance";
import StudentFeedback from "./pages/StudentFeedback";
import StudentDocumentTemplates from "./pages/StudentDocumentTemplates";
import AdminTwoFactorSetupPage from "./pages/AdminTwoFactorSetupPage";
import TwoFactorSetupPage from "./pages/TwoFactorSetupPage";
import PublicStudentProfile from "./pages/PublicStudentProfile";
import PublicEvaluationForm from "./pages/PublicEvaluationForm";
import "./App.css";

import SessionTimeout from "./components/SessionTimeout";
import useNotificationPolling from "./hooks/useNotificationPolling";

function Layout({ children }) {
  const location = useLocation();
  const hideAllSidebarsRoutes = ["/", "/login", "/register", "/verify-email", "/admin/2fa-setup", "/2fa-setup", "/public"];

  const isStudentRoute = location.pathname.startsWith("/student");
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isCoordinatorRoute = location.pathname.startsWith("/coordinator");
  const isSupervisorRoute = location.pathname.startsWith("/supervisor");
  const isPublicRoute = location.pathname.startsWith("/public");

  const hideAllSidebars = hideAllSidebarsRoutes.some((route) => {
    if (route === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(route);
  });

  // Determine which sidebar to show
  let sidebarComponent = null;
  let hasSidebar = false;

  if (!hideAllSidebars) {
    if (isStudentRoute) {
      sidebarComponent = <StudentSidebar />;
      hasSidebar = true;
    } else if (isAdminRoute) {
      sidebarComponent = <AdminSidebar />;
      hasSidebar = true;
    } else if (isCoordinatorRoute) {
      sidebarComponent = <CoordinatorSidebar />;
      hasSidebar = true;
    } else if (isSupervisorRoute) {
      sidebarComponent = <SupervisorSidebar />;
      hasSidebar = true;
    }
  }

  return (
    <div className="app-layout">
      {sidebarComponent}
      <div className={hasSidebar ? "with-sidebar" : "no-sidebar"}>
        {children}
      </div>
    </div>
  );
}

// Loader wrapper for Router
function AppWrapper() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  // Show loader on initial load
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Show loader on route change
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [location]);

  // Enable global notification polling
  useNotificationPolling();

  return (
    <>
      <SessionTimeout />
      {loading && <Loader />}
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/2fa-setup" element={<TwoFactorSetupPage />} />
          <Route path="/public/student/:token" element={<PublicStudentProfile />} />
          <Route path="/public/evaluate/:token" element={<PublicEvaluationForm />} />

          {/* Coordinator Routes */}
          <Route path="/coordinator/dashboard" element={<CoordinatorDashboard />} />
          <Route path="/coordinator/students" element={<CoordinatorStudents />} />
          <Route path="/coordinator/requirements" element={<CoordinatorRequirements />} />
          <Route path="/coordinator/companies" element={<CoordinatorCompanies />} />
          <Route path="/coordinator/applications" element={<CoordinatorApplications />} />
          <Route path="/coordinator/monitoring" element={<CoordinatorMonitoring />} />
          <Route path="/coordinator/documents" element={<CoordinatorDocuments />} />
          <Route path="/coordinator/reports" element={<CoordinatorReports />} />
          <Route path="/coordinator/messages" element={<CoordinatorMessages />} />
          <Route path="/coordinator/notifications" element={<CoordinatorNotifications />} />
          <Route path="/coordinator/profile" element={<CoordinatorProfile />} />
          <Route path="/coordinator/settings" element={<CoordinatorSettings />} />

          {/* Admin Routes */}
          <Route path="/admin/2fa-setup" element={<AdminTwoFactorSetupPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/companies" element={<AdminCompanies />} />
          <Route path="/admin/internships" element={<AdminInternships />} />
          <Route path="/admin/applications" element={<AdminApplications />} />
          <Route path="/admin/notices" element={<AdminNotices />} />
          <Route path="/admin/documents" element={<AdminDocuments />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/database" element={<AdminDatabase />} />
          <Route path="/admin/settings" element={<AdminSettings />} />

          {/* Supervisor Routes */}
          <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
          <Route path="/supervisor/internships" element={<SupervisorInternships />} />
          <Route path="/supervisor/profile" element={<SupervisorProfile />} />
          <Route path="/supervisor/interns" element={<SupervisorInterns />} />
          <Route path="/supervisor/tasks" element={<SupervisorTasks />} />
          <Route path="/supervisor/attendance" element={<SupervisorAttendance />} />
          <Route path="/supervisor/evaluations" element={<SupervisorEvaluations />} />
          <Route path="/supervisor/progress" element={<SupervisorProgress />} />
          <Route path="/supervisor/journals" element={<SupervisorJournals />} />
          <Route path="/supervisor/messages" element={<SupervisorMessages />} />
          <Route path="/supervisor/notifications" element={<SupervisorNotifications />} />
          <Route path="/supervisor/reports" element={<SupervisorReports />} />

          {/* Student Routes */}
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/notifications" element={<StudentNotifications />} />
          <Route path="/student/applications" element={<StudentApplications />} />
          <Route path="/student/internships" element={<StudentInternships />} />
          <Route path="/student/apply" element={<StudentApply />} />
          <Route path="/student/journal" element={<StudentJournal />} />
          <Route path="/student/attendance" element={<StudentAttendance />} />
          <Route path="/student/pre-training" element={<StudentPreTraining />} />
          <Route path="/student/progress" element={<StudentProgress />} />
          <Route path="/student/reports" element={<StudentReports />} />
          <Route path="/student/tasks" element={<StudentTasks />} />
          <Route path="/student/support" element={<StudentSupport />} />
          <Route path="/student/settings" element={<StudentSettings />} />
          <Route path="/student/messages" element={<StudentMessages />} />
          <Route path="/student/recommendations" element={<RecommendationsPage />} />
          <Route path="/student/feedback" element={<StudentFeedback />} />
          <Route path="/student/document-templates" element={<StudentDocumentTemplates />} />
        </Routes>
      </Layout>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
