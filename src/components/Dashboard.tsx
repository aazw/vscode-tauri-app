import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBackend } from "../backends/BackendProvider";
import { DashboardStats } from "../types/AppBackend";

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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Issues Overview */}
        <div 
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow cursor-pointer hover:border-blue-300"
          onClick={() => navigate('/issues')}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span>🐛</span> Issues
            </h3>
            <span className="text-xl font-bold text-gray-700">{stats.issues.total}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Open</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                {stats.issues.open}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Closed</span>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                {stats.issues.closed}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Assigned to me</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {stats.issues.assigned}
              </span>
            </div>
          </div>
        </div>

        {/* Pull Requests Overview */}
        <div 
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow cursor-pointer hover:border-blue-300"
          onClick={() => navigate('/pull_requests')}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span>🔀</span> Pull Requests
            </h3>
            <span className="text-xl font-bold text-gray-700">{stats.pullRequests.total}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Open</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                {stats.pullRequests.open}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Merged</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                {stats.pullRequests.merged}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Assigned to me</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {stats.pullRequests.assigned}
              </span>
            </div>
          </div>
        </div>

        {/* Workflows Overview */}
        <div 
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow cursor-pointer hover:border-blue-300"
          onClick={() => navigate('/workflows')}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span>⚡</span> Workflows
            </h3>
            <span className="text-xl font-bold text-gray-700">{stats.workflows.total}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Success</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                {stats.workflows.success}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Failure</span>
              <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                {stats.workflows.failure}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">In Progress</span>
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                {stats.workflows.in_progress}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;