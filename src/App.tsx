import { useState, useEffect } from "react";
import { DockNavigation } from "./components/DockNavigation";
import { Header } from "./components/Header";
import { TodayPage } from "./pages/TodayPage";
import { UpcomingPage } from "./pages/UpcomingPage";
import { ResultsPage } from "./pages/ResultsPage";
import { AdminPage } from "./pages/AdminPage";
import { LoginPage } from "./pages/LoginPage";
import { AllTournamentsPage } from "./pages/AllTournamentsPage";
import { UnmarkedTournamentsPage } from "./pages/UnmarkedTournamentsPage";
import { AuditLogPage } from "./pages/AuditLogPage";
import { useAuth } from "./lib/auth-context";

function App() {
  const [currentPath, setCurrentPath] = useState("/");
  const { user, loading } = useAuth();

  useEffect(() => {
    const checkPath = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      window.scrollTo(0, 0);
    };

    checkPath();
    window.addEventListener("popstate", checkPath);
    return () => window.removeEventListener("popstate", checkPath);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPath]);

  const handleNavigate = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  const renderPage = () => {
    if (currentPath === "/admin" || currentPath === "/admin/all-tournaments" || currentPath === "/admin/unmarked" || currentPath === "/admin/audit-log") {
      if (loading) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        );
      }

      if (!user) {
        return <LoginPage onSuccess={() => setCurrentPath("/admin")} />;
      }

      if (currentPath === "/admin/all-tournaments") {
        return <AllTournamentsPage />;
      }

      if (currentPath === "/admin/unmarked") {
        return <UnmarkedTournamentsPage />;
      }

      if (currentPath === "/admin/audit-log") {
        return <AuditLogPage />;
      }

      return <AdminPage />;
    }

    switch (currentPath) {
      case "/upcoming":
        return <UpcomingPage />;
      case "/results":
        return <ResultsPage />;
      default:
        return <TodayPage />;
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950">
      <Header />

      <div className="relative z-10">
        {renderPage()}
      </div>

      {(currentPath !== "/admin" && currentPath !== "/admin/all-tournaments" && currentPath !== "/admin/unmarked" && currentPath !== "/admin/audit-log") || user ? (
        <DockNavigation
          currentPath={currentPath}
          onNavigate={handleNavigate}
          showAdmin={!!user}
        />
      ) : null}
    </div>
  );
}

export default App;
