import { useState, useEffect } from "react";
import { useBackend } from "../backends/BackendProvider";
import { WorkflowRun } from "../types/AppBackend";
import "./Workflows.css";

const Workflows = () => {
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const backend = useBackend();

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setLoading(true);
        setError(null);
        const allWorkflows = await backend.getAllWorkflows();
        setWorkflowRuns(allWorkflows);
      } catch (err) {
        setError("Failed to load workflows");
        console.error("Error loading workflows:", err);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflows();
  }, [backend]);

  const filteredWorkflows = workflowRuns.filter(workflow => 
    statusFilter === "all" || workflow.status === statusFilter
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return "✅";
      case "failure": return "❌";
      case "in_progress": return "🔄";
      case "cancelled": return "⚪";
      default: return "❓";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="workflows-loading">Loading workflows...</div>;
  }

  if (error) {
    return <div className="workflows-error">Error: {error}</div>;
  }

  return (
    <div className="workflows-page">
      <div className="workflows-header">
        <div className="filter-row">
          <button 
            className="filter-toggle-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            🔍 Filter
          </button>
          <div className="workflows-stats">
            <span className="stat-item">
              <strong>{workflowRuns.filter(w => w.status === "success").length}</strong> success
            </span>
            <span className="stat-item">
              <strong>{workflowRuns.filter(w => w.status === "failure").length}</strong> failure
            </span>
            <span className="stat-item">
              <strong>{workflowRuns.filter(w => w.status === "in_progress").length}</strong> in progress
            </span>
            <span className="stat-item">
              <strong>{workflowRuns.filter(w => w.status === "cancelled").length}</strong> cancelled
            </span>
          </div>
        </div>
        {showFilters && (
          <div className="filter-dropdown">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Workflows</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="in_progress">In Progress</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      <div className="workflows-list">
        {filteredWorkflows.map((workflow) => (
          <div key={workflow.id} className={`workflow-card ${workflow.status}`} onClick={() => window.open(workflow.url, '_blank')} role="button" tabIndex={0}>
            <div className="workflow-header">
              <div className="workflow-title">
                <span className="status-icon">{getStatusIcon(workflow.status)}</span>
                <a href={workflow.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  {workflow.name}
                </a>
              </div>
              <span className={`status-badge ${workflow.status}`}>{workflow.status}</span>
            </div>
            <div className="workflow-details">
              <span className="repository">{workflow.provider} / {workflow.repository}</span>
              <span className="branch">on {workflow.branch}</span>
              <span className="commit">
                {workflow.commit_sha.substring(0, 7)} - {workflow.commit_message}
              </span>
            </div>
            <div className="workflow-footer">
              <span className="author">by {workflow.author}</span>
              <span className="timestamp">{formatDate(workflow.created_at)}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredWorkflows.length === 0 && (
        <div className="empty-state">
          <h3>No workflows found</h3>
          <p>Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
};

export default Workflows;