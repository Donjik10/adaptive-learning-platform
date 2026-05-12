import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "components/Layout";
import Dashboard from "pages/Dashboard";
import ReviewPage from "pages/ReviewPage";

const App: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/review/:topicId" element={<ReviewPage />} />
      </Routes>
    </Layout>
  );
};

export default App;
