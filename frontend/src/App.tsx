import React from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "components/Layout";
import Dashboard from "pages/Dashboard";
import ReviewPage from "pages/ReviewPage";
import TeacherDashboard from "pages/TeacherDashboard";
import TeacherSubmissions from "pages/TeacherSubmissions";
import StudentTutorChat from "pages/StudentTutorChat";
import LoginPage from "pages/LoginPage";
import StudentDashboard from "pages/StudentDashboard";
import HomeworkWorkspace from "pages/HomeworkWorkspace";
import NewSubmissionPage from "pages/NewSubmissionPage";

const RequireAuth: React.FC<{ children: React.ReactNode; role?: "student" | "teacher" | "admin" }> = ({
  children,
  role,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout>
              <Dashboard />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/student-dashboard"
        element={
          <RequireAuth role="student">
            <Layout>
              <StudentDashboard />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/review/:topicId"
        element={
          <RequireAuth>
            <Layout>
              <ReviewPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/teacher"
        element={
          <RequireAuth role="teacher">
            <Layout>
              <TeacherSubmissions />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/teacher/rules"
        element={
          <RequireAuth role="teacher">
            <Layout>
              <TeacherDashboard />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/tutor"
        element={
          <RequireAuth>
            <Layout>
              <StudentTutorChat />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/homework/:submissionId"
        element={
          <RequireAuth>
            <Layout>
              <HomeworkWorkspaceWrapper />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/homework/new/:assignmentId"
        element={
          <RequireAuth role="student">
            <Layout>
              <NewSubmissionPage />
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  );
};

const HomeworkWorkspaceWrapper: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  if (!submissionId) return <Navigate to="/" replace />;
  return <HomeworkWorkspace submissionId={submissionId} />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
