import { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Providers from "./components/Providers";
import AddProvider from "./components/AddProvider";
import AddRepository from "./components/AddRepository";
import Dashboard from "./components/Dashboard";
import Repositories from "./components/Repositories";
import Issues from "./components/Issues";
import PullRequests from "./components/PullRequests";
import Workflows from "./components/Workflows";
import History from "./components/History";
import Settings from "./components/Settings";
import { BackendProvider, useBackend } from "./backends/BackendProvider";
import { IssueStats, PullRequestStats, WorkflowStats } from "./types/AppBackend";

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<{
    issues: IssueStats;
    pullRequests: PullRequestStats;
    workflows: WorkflowStats;
  }>({
    issues: { total: 0, open: 0, closed: 0, assigned: 0 },
    pullRequests: { total: 0, open: 0, merged: 0, closed: 0, assigned: 0 },
    workflows: { total: 0, success: 0, failure: 0, in_progress: 0, cancelled: 0 }
  });
  const location = useLocation();
  const navigate = useNavigate();
  const backend = useBackend();

  const loadStats = useCallback(async () => {
    try {
      const [issueStats, prStats, workflowStats] = await Promise.all([
        backend.getIssueStats(),
        backend.getPullRequestStats(),
        backend.getWorkflowStats()
      ]);
      setStats({
        issues: issueStats,
        pullRequests: prStats,
        workflows: workflowStats
      });
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
    }
  }, [backend]);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [backend, loadStats]);

  const getCurrentView = (): "dashboard" | "repositories" | "providers" | "issues" | "pull_requests" | "workflows" | "history" | "settings" => {
    const path = location.pathname;
    
    if (path.startsWith("/repositories")) {
      return "repositories";
    }
    if (path.startsWith("/providers")) {
      return "providers";
    }
    
    switch (path) {
      case "/dashboard":
        return "dashboard";
      case "/issues":
        return "issues";
      case "/pull_requests":
        return "pull_requests";
      case "/workflows":
        return "workflows";
      case "/history":
        return "history";
      case "/settings":
        return "settings";
      default:
        return "dashboard";
    }
  };

  const currentView = getCurrentView();

  const handleMenuClick = (view: string) => {
    navigate(`/${view}`);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleSync = async () => {
    if (syncing) return;
    
    setSyncing(true);
    try {
      // Check if sync is already in progress
      const isSyncInProgress = await backend.isSyncInProgress();
      if (isSyncInProgress) {
        console.log("Sync already in progress");
        return;
      }
      
      // Start sync
      await backend.syncAllProviders();
      console.log("✅ Sync completed successfully");
      
      // Reload stats to update sidebar badges
      await loadStats();
    } catch (error) {
      console.error("❌ Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="flex h-screen bg-gray-50">
      {/* Header - visible on all screen sizes */}
      <header className="fixed top-0 left-0 right-0 bg-slate-800 border-b border-slate-700 z-50" style={{height: '50px'}}>
        <div className="flex items-center justify-between h-full px-4 md:ml-64">
          <div className="flex items-center gap-3">
            <button 
              className="flex flex-col justify-center w-6 h-6 space-y-1 md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              <span className="block w-full h-0.5 bg-white transition-all"></span>
              <span className="block w-full h-0.5 bg-white transition-all"></span>
              <span className="block w-full h-0.5 bg-white transition-all"></span>
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {currentView === "dashboard" && "📊"}
                {currentView === "repositories" && "📂"}
                {currentView === "providers" && "⚙️"}
                {currentView === "issues" && "🐛"}
                {currentView === "pull_requests" && "🔀"}
                {currentView === "workflows" && "⚡"}
                {currentView === "history" && "📊"}
                {currentView === "settings" && "⚙️"}
              </span>
              <span className="text-xl font-bold text-white">
                {currentView === "dashboard" && "Dashboard"}
                {currentView === "repositories" && "Repositories"}
                {currentView === "providers" && "Providers"}
                {currentView === "issues" && "Issues"}
                {currentView === "pull_requests" && "Pull Requests"}
                {currentView === "workflows" && "Workflows"}
                {currentView === "history" && "History"}
                {currentView === "settings" && "Settings"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium border ${
                syncing 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500'
              }`}
              onClick={handleSync}
              disabled={syncing}
            >
              <span className={syncing ? 'animate-spin' : ''}>🔄</span>
              <span>Sync</span>
            </button>
            <div className="relative">
              <button className="px-2 py-2 rounded-lg flex items-center justify-center border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-colors">
                <span>🔔</span>
              </button>
              {(stats.issues.open > 0 || stats.pullRequests.open > 0 || stats.workflows.in_progress > 0) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 md:hidden" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      
      <aside className={`
        fixed md:static top-0 left-0 h-full w-64 bg-slate-800 text-white z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
         md:pt-0 border-r border-slate-700
        `} >
        <div className="px-4 border-b border-slate-700 flex items-center justify-between" style={{height: '50px'}}>
          <h1 className="text-lg font-bold text-white">Git Portal</h1>
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1 text-slate-300 hover:text-white focus:outline-none"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          <button
            className={`flex items-center gap-3 w-full px-4 py-3 text-left rounded-lg transition-colors relative ${
              currentView === "dashboard" 
                ? "bg-blue-600 text-white" 
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
            onClick={() => handleMenuClick("dashboard")}
          >
            <span className="text-base">📊</span>
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <button
            className={`flex items-center gap-3 w-full px-4 py-3 text-left rounded-lg transition-colors relative ${
              currentView === "issues" 
                ? "bg-blue-600 text-white" 
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
            onClick={() => handleMenuClick("issues")}
          >
            <span className="text-base">🐛</span>
            <span className="text-sm font-medium">Issues</span>
            {stats.issues.open > 0 && (
              <span className="absolute top-1/2 right-3 transform -translate-y-1/2 flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full">
                {stats.issues.open}
              </span>
            )}
          </button>
          <button
            className={`flex items-center gap-3 w-full px-4 py-3 text-left rounded-lg transition-colors relative ${
              currentView === "pull_requests" 
                ? "bg-blue-600 text-white" 
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
            onClick={() => handleMenuClick("pull_requests")}
          >
            <span className="text-base">🔀</span>
            <span className="text-sm font-medium">Pull Requests</span>
            {stats.pullRequests.open > 0 && (
              <span className="absolute top-1/2 right-3 transform -translate-y-1/2 flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full">
                {stats.pullRequests.open}
              </span>
            )}
          </button>
          <button
            className={`flex items-center gap-3 w-full px-4 py-3 text-left rounded-lg transition-colors relative ${
              currentView === "workflows" 
                ? "bg-blue-600 text-white" 
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
            onClick={() => handleMenuClick("workflows")}
          >
            <span className="text-base">⚡</span>
            <span className="text-sm font-medium">Workflows</span>
            {stats.workflows.in_progress > 0 && (
              <span className="absolute top-1/2 right-3 transform -translate-y-1/2 flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full">
                {stats.workflows.in_progress}
              </span>
            )}
          </button>
          <button
            className={`flex items-center gap-3 w-full px-4 py-3 text-left rounded-lg transition-colors ${
              currentView === "repositories" 
                ? "bg-blue-600 text-white" 
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
            onClick={() => handleMenuClick("repositories")}
          >
            <span className="text-base">📂</span>
            <span className="text-sm font-medium">Repositories</span>
          </button>
          <button
            className={`flex items-center gap-3 w-full px-4 py-3 text-left rounded-lg transition-colors ${
              currentView === "providers" 
                ? "bg-blue-600 text-white" 
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
            onClick={() => handleMenuClick("providers")}
          >
            <span className="text-base">🔗</span>
            <span className="text-sm font-medium">Providers</span>
          </button>
          <button
            className={`flex items-center gap-3 w-full px-4 py-3 text-left rounded-lg transition-colors ${
              currentView === "history" 
                ? "bg-blue-600 text-white" 
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
            onClick={() => handleMenuClick("history")}
          >
            <span className="text-base">📊</span>
            <span className="text-sm font-medium">History</span>
          </button>
          <button
            className={`flex items-center gap-3 w-full px-4 py-3 text-left rounded-lg transition-colors ${
              currentView === "settings" 
                ? "bg-blue-600 text-white" 
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
            onClick={() => handleMenuClick("settings")}
          >
            <span className="text-base">⚙️</span>
            <span className="text-sm font-medium">Settings</span>
          </button>
        </nav>
      </aside>

      <div className="flex-1 md:ml-0 bg-gray-50 flex flex-col" style={{paddingTop: '50px'}}>
        <div className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/pull_requests" element={<PullRequests />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/repositories" element={<Repositories />} />
            <Route path="/repositories/new" element={<AddRepository />} />
            <Route path="/providers" element={<Providers />} />
            <Route path="/providers/new" element={<AddProvider />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </main>
  );
}

function App() {
  return (
    <BackendProvider>
      <Router>
        <AppContent />
      </Router>
    </BackendProvider>
  );
}

export default App;
