import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: string[];
  section?: string;
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const allLinks: NavItem[] = [
    // Student section
    { path: "/student-dashboard", label: t("nav.myAssignments"), icon: "📝", roles: ["student"], section: "student" },
    { path: "/tutor", label: t("nav.aiTutor"), icon: "💬", roles: ["student"], section: "student" },
    { path: "/videos", label: t("nav.videos"), icon: "🎬", roles: ["student"], section: "student" },
    
    // Teacher section
    { path: "/teacher", label: t("nav.submissions"), icon: "📋", roles: ["teacher", "admin"], section: "teacher" },
    { path: "/teacher/assignments/new", label: t("nav.createAssignment") || "+ Assignment", icon: "➕", roles: ["teacher", "admin"], section: "teacher" },
    { path: "/teacher/videos", label: t("nav.teacherVideos"), icon: "🎥", roles: ["teacher", "admin"], section: "teacher" },
    { path: "/teacher/rules", label: t("nav.aiRules"), icon: "🧑‍🏫", roles: ["teacher", "admin"], section: "teacher" },
    
    // Common section (Dashboard for all)
    { path: "/", label: t("nav.dashboard"), icon: "📚", roles: ["student", "teacher", "admin"], section: "common" },
  ];

  const filteredLinks = allLinks.filter((l) => user && l.roles.includes(user.role));
  
  // Group by section
  const studentLinks = filteredLinks.filter((l) => l.section === "student");
  const teacherLinks = filteredLinks.filter((l) => l.section === "teacher");
  const commonLinks = filteredLinks.filter((l) => l.section === "common");

  const getRoleBadge = () => {
    if (!user) return null;
    const roleColors: Record<string, string> = {
      student: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      teacher: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${roleColors[user.role] || roleColors.student}`}>
        {t(user.role)}
      </span>
    );
  };

  const renderNavLink = (link: NavItem) => {
    const active = location.pathname === link.path;
    const isTeacherItem = link.section === "teacher";
    const isStudentItem = link.section === "student";
    
    let activeClass = "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300";
    if (isTeacherItem) {
      activeClass = "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
    } else if (isStudentItem) {
      activeClass = "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
    }

    return (
      <Link
        key={link.path}
        to={link.path}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
          ${active
            ? activeClass
            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
      >
        <span>{link.icon}</span>
        {link.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link to="/" className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {t("app.name")}
            </Link>
            <nav className="flex gap-1 items-center">
              {/* Common links */}
              {commonLinks.map(renderNavLink)}
              
              {/* Student section */}
              {studentLinks.length > 0 && (
                <>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
                  <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider px-1">
                    {t("student")}
                  </span>
                  {studentLinks.map(renderNavLink)}
                </>
              )}
              
              {/* Teacher section */}
              {teacherLinks.length > 0 && (
                <>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
                  <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider px-1">
                    {t("teacher")}
                  </span>
                  {teacherLinks.map(renderNavLink)}
                </>
              )}
              
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
                    {getRoleBadge()}
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