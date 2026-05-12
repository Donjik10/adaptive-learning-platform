import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "components/Layout";
import Dashboard from "pages/Dashboard";
import ReviewPage from "pages/ReviewPage";
import TeacherDashboard from "pages/TeacherDashboard";
import StudentTutorChat from "pages/StudentTutorChat";

const App: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/review/:topicId" element={<ReviewPage />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/tutor" element={<StudentTutorChat />} />
      </Routes>
    </Layout>
  );
};

export default App;
