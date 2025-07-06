import { useState, useEffect } from "react";
import { useBackend } from "../backends/BackendProvider";
import { PullRequest } from "../types/AppBackend";
import "./PullRequests.css";

const PullRequests = () => {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prFilter, setPrFilter] = useState<"all" | "assigned">("all");
  const [showFilters, setShowFilters] = useState(false);
  
  const currentUser = "john-doe"; // Mock current user
  const backend = useBackend();

  useEffect(() => {
    const loadPullRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const allPRs = await backend.getAllPullRequests();
        setPullRequests(allPRs);
      } catch (err) {
        setError("Failed to load pull requests");
        console.error("Error loading pull requests:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPullRequests();
  }, [backend]);

  const filteredPRs = pullRequests.filter(pr => 
    prFilter === "all" || pr.assignee === currentUser
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getStateIcon = (state: string) => {
    switch (state) {
      case "open": return "🟢";
      case "closed": return "🔴";
      case "merged": return "🟣";
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
    return <div className="prs-loading">Loading pull requests...</div>;
  }

  if (error) {
    return <div className="prs-error">Error: {error}</div>;
  }

  return (
    <div className="prs-page">
      <div className="prs-header">
        <div className="filter-row">
          <button 
            className="filter-toggle-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            🔍 Filter
          </button>
          <div className="prs-stats">
            <span className="stat-item">
              <strong>{pullRequests.filter(pr => pr.state === "open").length}</strong> open
            </span>
            <span className="stat-item">
              <strong>{pullRequests.filter(pr => pr.state === "merged").length}</strong> merged
            </span>
            <span className="stat-item">
              <strong>{pullRequests.filter(pr => pr.state === "closed").length}</strong> closed
            </span>
            <span className="stat-item">
              <strong>{pullRequests.filter(pr => pr.assignee === currentUser).length}</strong> assigned to me
            </span>
          </div>
        </div>
        {showFilters && (
          <div className="filter-dropdown">
            <select 
              value={prFilter} 
              onChange={(e) => setPrFilter(e.target.value as "all" | "assigned")}
              className="filter-select"
            >
              <option value="all">All PRs</option>
              <option value="assigned">Assigned to Me</option>
            </select>
          </div>
        )}
      </div>

      <div className="prs-list">
        {filteredPRs.map((pr) => (
          <div key={pr.id} className={`pr-card ${pr.state}`} onClick={() => window.open(pr.url, '_blank')} role="button" tabIndex={0}>
            <div className="pr-header">
              <div className="pr-title">
                <span className="state-icon">{getStateIcon(pr.state)}</span>
                <a href={pr.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  {pr.title}
                </a>
                {pr.draft && <span className="draft-badge">DRAFT</span>}
              </div>
              <span className="pr-number">#{pr.number}</span>
            </div>
            <div className="pr-details">
              <span className="repository">{pr.provider} / {pr.repository}</span>
              <span className="author">by {pr.author}</span>
              {pr.assignee && <span className="assignee">→ {pr.assignee}</span>}
            </div>
            <div className="pr-footer">
              <span className="state-badge">{pr.state}</span>
              <span className="timestamp">{formatDate(pr.created_at)}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredPRs.length === 0 && (
        <div className="empty-state">
          <h3>No pull requests found</h3>
          <p>Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
};

export default PullRequests;