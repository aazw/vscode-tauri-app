import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import GitProviderManager from "./components/GitProviderManager";
import AddProvider from "./components/AddProvider";
import AddRepository from "./components/AddRepository";
import Dashboard from "./components/Dashboard";
import RepositoryManager from "./components/RepositoryManager";
import Issues from "./components/Issues";
import PullRequests from "./components/PullRequests";
import Workflows from "./components/Workflows";
import { BackendProvider } from "./backends/BackendProvider";
import "./App.css";

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getCurrentView = () => {
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
    setSyncing(true);
    // Mock API call delay
    setTimeout(() => {
      setSyncing(false);
      console.log("Synced all data");
    }, 2000);
  };

  return (
    <main className="container">
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-header-left">
          <button 
            className="hamburger-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger-line ${sidebarOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${sidebarOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${sidebarOpen ? 'open' : ''}`}></span>
          </button>
          <div className="mobile-title">
            <span className="app-name">Git Portal</span>
            <span className="page-title">
              {currentView === "dashboard" && (
                <><span className="page-icon">📊</span> Dashboard</>
              )}
              {currentView === "repositories" && (
                <><span className="page-icon">📂</span> Repositories</>
              )}
              {currentView === "providers" && (
                <><span className="page-icon">⚙️</span> Providers</>
              )}
              {currentView === "issues" && (
                <><span className="page-icon">🐛</span> Issues</>
              )}
              {currentView === "pull_requests" && (
                <><span className="page-icon">🔀</span> Pull Requests</>
              )}
              {currentView === "workflows" && (
                <><span className="page-icon">⚡</span> Workflows</>
              )}
            </span>
          </div>
        </div>
        <button 
          className={`sync-button-mobile ${syncing ? 'syncing' : ''}`}
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? '🔄' : '🔄'}
        </button>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
      
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>Git Portal</h1>
          <div className="current-page">
            {currentView === "dashboard" && (
              <><span className="page-icon">📊</span> Dashboard</>
            )}
            {currentView === "repositories" && (
              <><span className="page-icon">📂</span> Repositories</>
            )}
            {currentView === "providers" && (
              <><span className="page-icon">⚙️</span> Providers</>
            )}
            {currentView === "issues" && (
              <><span className="page-icon">🐛</span> Issues</>
            )}
            {currentView === "pull_requests" && (
              <><span className="page-icon">🔀</span> Pull Requests</>
            )}
            {currentView === "workflows" && (
              <><span className="page-icon">⚡</span> Workflows</>
            )}
          </div>
        </div>
        <nav className="nav-menu">
          <button
            className={currentView === "dashboard" ? "active" : ""}
            onClick={() => handleMenuClick("dashboard")}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </button>
          <button
            className={currentView === "issues" ? "active" : ""}
            onClick={() => handleMenuClick("issues")}
          >
            <span className="nav-icon">🐛</span>
            Issues
          </button>
          <button
            className={currentView === "pull_requests" ? "active" : ""}
            onClick={() => handleMenuClick("pull_requests")}
          >
            <span className="nav-icon">🔀</span>
            Pull Requests
          </button>
          <button
            className={currentView === "workflows" ? "active" : ""}
            onClick={() => handleMenuClick("workflows")}
          >
            <span className="nav-icon">⚡</span>
            Workflows
          </button>
          <button
            className={currentView === "repositories" ? "active" : ""}
            onClick={() => handleMenuClick("repositories")}
          >
            <span className="nav-icon">📂</span>
            Repositories
          </button>
          <button
            className={currentView === "providers" ? "active" : ""}
            onClick={() => handleMenuClick("providers")}
          >
            <span className="nav-icon">⚙️</span>
            Providers
          </button>
        </nav>
      </aside>

      <div className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/pull_requests" element={<PullRequests />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/repositories" element={<RepositoryManager />} />
          <Route path="/repositories/new" element={<AddRepository />} />
          <Route path="/providers" element={<GitProviderManager />} />
          <Route path="/providers/new" element={<AddProvider />} />
        </Routes>
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
