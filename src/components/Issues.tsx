import { useState, useEffect } from "react";
import { useBackend } from "../backends/BackendProvider";
import { Issue } from "../types/AppBackend";
import "./Issues.css";

const Issues = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issueFilter, setIssueFilter] = useState<"all" | "assigned">("all");
  const [showFilters, setShowFilters] = useState(false);
  
  const currentUser = "john-doe"; // Mock current user
  const backend = useBackend();

  useEffect(() => {
    const loadIssues = async () => {
      try {
        setLoading(true);
        setError(null);
        const allIssues = await backend.getAllIssues();
        setIssues(allIssues);
      } catch (err) {
        setError("Failed to load issues");
        console.error("Error loading issues:", err);
      } finally {
        setLoading(false);
      }
    };

    loadIssues();
  }, [backend]);

  const filteredIssues = issues.filter(issue => 
    issueFilter === "all" || issue.assignee === currentUser
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getStateIcon = (state: string) => {
    switch (state) {
      case "open": return "🟢";
      case "closed": return "🔴";
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
    return <div className="issues-loading">Loading issues...</div>;
  }

  if (error) {
    return <div className="issues-error">Error: {error}</div>;
  }

  return (
    <div className="issues-page">
      <div className="issues-header">
        <div className="filter-row">
          <button 
            className="filter-toggle-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            🔍 Filter
          </button>
          <div className="issues-stats">
            <span className="stat-item">
              <strong>{issues.filter(i => i.state === "open").length}</strong> open
            </span>
            <span className="stat-item">
              <strong>{issues.filter(i => i.state === "closed").length}</strong> closed
            </span>
            <span className="stat-item">
              <strong>{issues.filter(i => i.assignee === currentUser).length}</strong> assigned to me
            </span>
          </div>
        </div>
        {showFilters && (
          <div className="filter-dropdown">
            <select 
              value={issueFilter} 
              onChange={(e) => setIssueFilter(e.target.value as "all" | "assigned")}
              className="filter-select"
            >
              <option value="all">All Issues</option>
              <option value="assigned">Assigned to Me</option>
            </select>
          </div>
        )}
      </div>

      <div className="issues-list">
        {filteredIssues.map((issue) => (
          <div key={issue.id} className="issue-card" onClick={() => window.open(issue.url, '_blank')} role="button" tabIndex={0}>
            <div className="issue-header">
              <div className="issue-title">
                <span className="state-icon">{getStateIcon(issue.state)}</span>
                <a href={issue.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  {issue.title}
                </a>
              </div>
              <span className="issue-number">#{issue.number}</span>
            </div>
            <div className="issue-details">
              <span className="repository">{issue.provider} / {issue.repository}</span>
              <span className="author">by {issue.author}</span>
              {issue.assignee && <span className="assignee">→ {issue.assignee}</span>}
            </div>
            <div className="issue-footer">
              <div className="labels">
                {issue.labels.map(label => (
                  <span key={label} className="label">{label}</span>
                ))}
              </div>
              <span className="timestamp">{formatDate(issue.created_at)}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredIssues.length === 0 && (
        <div className="empty-state">
          <h3>No issues found</h3>
          <p>Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
};

export default Issues;