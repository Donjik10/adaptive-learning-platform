import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const allLinks = [
    { path: "/", label: t("nav.dashboard"), icon: "📚", roles: ["student", "teacher", "admin"] },
    { path: "/student-dashboard", label: t("nav.myAssignments"), icon: "📝", roles: ["student"] },
    { path: "/teacher", label: t("nav.submissions"), icon: "📋", roles: ["teacher", "admin"] },
    { path: "/teacher/rules", label: t("nav.aiRules"), icon: "🧑‍🏫", roles: ["teacher", "admin"] },
    { path: "/tutor", label: t("nav.aiTutor"), icon: "💬", roles: ["student", "teacher", "admin"] },
    { path: "/videos", label: t("nav.videos"), icon: "🎬", roles: ["student", "teacher", "admin"] },
  ];

  const navLinks = allLinks.filter((l) => user && l.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link to="/" className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {t("app.name")}
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
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
              <div className="flex items-center gap-2 ml-4 border-l border-gray-200 dark:border-gray-600 pl-4">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={theme === "light" ? t("settings.dark") : t("settings.light")}
                >
                  {theme === "light" ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </button>

                {/* Language Toggle */}
                <button
                  onClick={() => setLanguage(language === "ru" ? "en" : "ru")}
                  className="px-2 py-1 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {language === "ru" ? "EN" : "RU"}
                </button>

                {user && (
                  <>
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {user.name}
                    </span>
                    <button
                      onClick={logout}
                      className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                    >
                      {t("logout")}
                    </button>
                  </>
                )}
              </div>
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
