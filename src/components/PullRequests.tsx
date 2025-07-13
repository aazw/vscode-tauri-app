import { useState, useEffect } from "react";
import { useBackend } from "../backends/BackendProvider";
import { PullRequest } from "../types/AppBackend";
import { getRelativeTime } from "../utils/timeHelper";

const PullRequests = () => {
  const [allPullRequests, setAllPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prFilter, setPrFilter] = useState<"open" | "all" | "assigned">("open");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [repositoryFilter, setRepositoryFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  
  const backend = useBackend();

  useEffect(() => {
    const loadPullRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await backend.getPullRequests();
        setAllPullRequests(response.data);
      } catch (err) {
        setError("Failed to load pull requests");
        console.error("Error loading pull requests:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPullRequests();
  }, [backend]);

  const filteredPullRequests = allPullRequests.filter(pr => {
    // Status filter
    if (prFilter === "open" && pr.state !== "open") return false;
    if (prFilter === "assigned" && !pr.assigned_to_me) return false;
    
    // Provider filter
    if (providerFilter !== "all" && pr.provider !== providerFilter) return false;
    
    // Repository filter
    if (repositoryFilter !== "all" && pr.repository !== repositoryFilter) return false;
    
    return true;
  }).sort((a, b) => new Date(b.api_created_at || 0).getTime() - new Date(a.api_created_at || 0).getTime());

  // Get unique providers
  const providers = [...new Set(allPullRequests.map(pr => pr.provider))].sort();
  
  // Get unique repositories
  const repositories = [...new Set(allPullRequests.map(pr => pr.repository))].sort();

  const getStateIcon = (state: string) => {
    switch (state) {
      case "open": return "🟢";
      case "merged": return "🟣";
      case "closed": return "🔴";
      default: return "❓";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading pull requests...</div>
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
            placeholder="Search pull requests..."
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
                {allPullRequests.filter(pr => pr.state === "open").length}
              </span>
            </div>
            <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">Merged</span>
              <span className="px-2 py-1 bg-purple-500 text-white font-semibold">
                {allPullRequests.filter(pr => pr.state === "merged").length}
              </span>
            </div>
            <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">Closed</span>
              <span className="px-2 py-1 bg-red-500 text-white font-semibold">
                {allPullRequests.filter(pr => pr.state === "closed").length}
              </span>
            </div>
          </div>
        </div>
        
        {/* Filter Dropdown */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <select 
                value={prFilter} 
                onChange={(e) => setPrFilter(e.target.value as "open" | "all" | "assigned")}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="open">Open PRs</option>
                <option value="all">All PRs</option>
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
              <select 
                value={repositoryFilter} 
                onChange={(e) => setRepositoryFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Repositories</option>
                {repositories.map(repository => (
                  <option key={repository} value={repository}>{repository}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Pull Request List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
        <div className="bg-white border-t border-b border-gray-300">
          {filteredPullRequests.map((pr, index) => (
            <div 
              key={pr.id} 
              className={`p-2 hover:bg-gray-50 transition-colors cursor-pointer ${
                index !== filteredPullRequests.length - 1 ? 'border-b border-gray-300' : ''
              }`}
              onClick={() => backend.openExternalUrl(pr.url)} 
              role="button" 
              tabIndex={0}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm">{getStateIcon(pr.state)}</span>
                  <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      backend.openExternalUrl(pr.url);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm leading-tight cursor-pointer hover:underline truncate"
                  >
                    {pr.title}
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-mono ml-2">#{pr.number}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-medium truncate">{pr.provider} / {pr.repository}</span>
                  <span className="shrink-0">by {pr.author}</span>
                  {pr.assigned_to_me && <span className="shrink-0">→ Assigned</span>}
                </div>
                <span className="text-xs text-gray-500 shrink-0">{getRelativeTime(pr.api_created_at || '')}</span>
              </div>
            </div>
          ))}
        </div>

        {filteredPullRequests.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pull requests found</h3>
            <p className="text-gray-600">No pull requests available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PullRequests;