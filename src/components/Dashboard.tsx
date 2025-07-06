import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBackend } from "../backends/BackendProvider";
import { DashboardStats } from "../types/AppBackend";
import "./Dashboard.css";

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    issues: { total: 0, open: 0, closed: 0, assigned: 0 },
    pullRequests: { total: 0, open: 0, merged: 0, closed: 0, assigned: 0 },
    workflows: { total: 0, success: 0, failure: 0, in_progress: 0, cancelled: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const backend = useBackend();

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const dashboardStats = await backend.getDashboardStats();
        setStats(dashboardStats);
      } catch (err) {
        setError("Failed to load dashboard statistics");
        console.error("Error loading dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [backend]);


  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-error">Error: {error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-overview">
        <div className="stats-grid">
          {/* Issues Overview */}
          <div className="stat-card issues" onClick={() => navigate('/issues')}>
            <div className="stat-header">
              <h3>🐛 Issues</h3>
              <span className="total-count">{stats.issues.total}</span>
            </div>
            <div className="stat-details">
              <div className="stat-item">
                <span className="stat-label">Open</span>
                <span className="stat-value open">{stats.issues.open}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Closed</span>
                <span className="stat-value closed">{stats.issues.closed}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Assigned to me</span>
                <span className="stat-value assigned">{stats.issues.assigned}</span>
              </div>
            </div>
          </div>

          {/* Pull Requests Overview */}
          <div className="stat-card prs" onClick={() => navigate('/pull-requests')}>
            <div className="stat-header">
              <h3>🔀 Pull Requests</h3>
              <span className="total-count">{stats.pullRequests.total}</span>
            </div>
            <div className="stat-details">
              <div className="stat-item">
                <span className="stat-label">Open</span>
                <span className="stat-value open">{stats.pullRequests.open}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Merged</span>
                <span className="stat-value merged">{stats.pullRequests.merged}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Assigned to me</span>
                <span className="stat-value assigned">{stats.pullRequests.assigned}</span>
              </div>
            </div>
          </div>

          {/* Workflows Overview */}
          <div className="stat-card workflows" onClick={() => navigate('/workflows')}>
            <div className="stat-header">
              <h3>⚡ Workflows</h3>
              <span className="total-count">{stats.workflows.total}</span>
            </div>
            <div className="stat-details">
              <div className="stat-item">
                <span className="stat-label">Success</span>
                <span className="stat-value success">{stats.workflows.success}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Failure</span>
                <span className="stat-value failure">{stats.workflows.failure}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">In Progress</span>
                <span className="stat-value in-progress">{stats.workflows.in_progress}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;