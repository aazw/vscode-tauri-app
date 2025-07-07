import { useState, useEffect } from "react";
import { useBackend } from "../backends/BackendProvider";
import { Issue } from "../types/AppBackend";

const Issues = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issueFilter, setIssueFilter] = useState<"open" | "all" | "assigned">("open");
  const [providerFilter, setProviderFilter] = useState<string>("all");
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

  const filteredIssues = issues.filter(issue => {
    // Status filter
    if (issueFilter === "open" && issue.state !== "open") return false;
    if (issueFilter === "assigned" && issue.assignee !== currentUser) return false;
    
    // Provider filter
    if (providerFilter !== "all" && issue.provider !== providerFilter) return false;
    
    return true;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Get unique providers
  const providers = [...new Set(issues.map(issue => issue.provider))].sort();

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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading issues...</div>
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
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex-shrink-0 bg-white mb-4 m-6">
        {/* Search Row */}
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            placeholder="Search issues..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Filter and Badges Row */}
        <div className="flex items-center justify-between gap-3">
          <button 
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="mr-2">{showFilters ? '🔼' : '🔽'}</span> Filter
          </button>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">Open</span>
              <span className="px-2 py-1 bg-green-500 text-white font-semibold">
                {issues.filter(i => i.state === "open").length}
              </span>
            </div>
            <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">Closed</span>
              <span className="px-2 py-1 bg-red-500 text-white font-semibold">
                {issues.filter(i => i.state === "closed").length}
              </span>
            </div>
            <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">Assigned</span>
              <span className="px-2 py-1 bg-blue-500 text-white font-semibold">
                {issues.filter(i => i.assignee === currentUser).length}
              </span>
            </div>
          </div>
        </div>
        
        {/* Filter Dropdown */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select 
                value={issueFilter} 
                onChange={(e) => setIssueFilter(e.target.value as "open" | "all" | "assigned")}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="open">Open Issues</option>
                <option value="all">All Issues</option>
                <option value="assigned">Assigned to Me</option>
              </select>
              <select 
                value={providerFilter} 
                onChange={(e) => setProviderFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Providers</option>
                {providers.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Issue List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white border-t border-b border-gray-300">
          {filteredIssues.map((issue, index) => (
            <div 
              key={issue.id} 
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                index !== filteredIssues.length - 1 ? 'border-b border-gray-300' : ''
              }`}
              onClick={() => window.open(issue.url, '_blank')} 
              role="button" 
              tabIndex={0}
            >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-lg">{getStateIcon(issue.state)}</span>
                <div className="flex-1">
                  <a 
                    href={issue.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm leading-tight cursor-pointer hover:underline"
                  >
                    {issue.title}
                  </a>
                </div>
              </div>
              <span className="text-sm text-gray-500 font-mono">#{issue.number}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mb-3">
              <span className="font-medium">{issue.provider} / {issue.repository}</span>
              <span>by {issue.author}</span>
              {issue.assignee && <span>→ {issue.assignee}</span>}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {issue.labels.map(label => (
                  <span 
                    key={label} 
                    className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-500">{formatDate(issue.created_at)}</span>
            </div>
          </div>
          ))}
        </div>
        
        {filteredIssues.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
            <p className="text-gray-600">Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Issues;