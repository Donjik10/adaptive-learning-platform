import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const allLinks = [
    { path: "/", label: "Dashboard", icon: "📚", roles: ["student", "teacher", "admin"] },
    { path: "/student-dashboard", label: "My Assignments", icon: "📝", roles: ["student"] },
    { path: "/teacher", label: "Submissions", icon: "📋", roles: ["teacher", "admin"] },
    { path: "/teacher/rules", label: "AI Rules", icon: "🧑‍🏫", roles: ["teacher", "admin"] },
    { path: "/tutor", label: "AI Tutor", icon: "💬", roles: ["student", "teacher", "admin"] },
  ];

  const navLinks = allLinks.filter((l) => user && l.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link to="/" className="text-lg font-bold text-indigo-600">
              Adaptiv
            </Link>
            <nav className="flex gap-1 items-center">
              {navLinks.map((link) => {
                const active = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
                      ${active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
              {user && (
                <div className="flex items-center gap-3 ml-4 border-l pl-4">
                  <span className="text-xs text-gray-600">
                    {user.name} ({user.role})
                  </span>
                  <button
                    onClick={logout}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Logout
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
