import { useState, useEffect, useRef, useCallback } from "react";
import { useBackend } from "../backends/BackendProvider";
import { PullRequest, PullRequestFilters, PaginationParams } from "../types/AppBackend";
import { getRelativeTime } from "../utils/timeHelper";

const PullRequests = () => {
  const [allPullRequests, setAllPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prFilter, setPrFilter] = useState<"open" | "all" | "assigned">("open");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [repositoryFilter, setRepositoryFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  
  const backend = useBackend();

  const buildFilters = useCallback((): PullRequestFilters => {
    const filters: PullRequestFilters = {};
    
    if (prFilter === "open") {
      filters.state = "open";
    } else if (prFilter === "assigned") {
      filters.assigned = "me";
    }
    
    if (providerFilter !== "all") {
      filters.provider = providerFilter;
    }
    
    if (repositoryFilter !== "all") {
      filters.repository = repositoryFilter;
    }
    
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    
    return filters;
  }, [prFilter, providerFilter, repositoryFilter, searchQuery]);

  const loadPullRequests = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const filters = buildFilters();
      const pagination: PaginationParams = { page, per_page: 20 };
      
      const response = await backend.getPullRequests(filters, pagination);
      
      if (append && page > 1) {
        setAllPullRequests(prev => [...prev, ...response.data]);
      } else {
        setAllPullRequests(response.data);
      }
      
      setTotalCount(response.pagination.total);
      setHasMore(page < response.pagination.total_pages);
      
    } catch (err) {
      setError("Failed to load pull requests");
      console.error("Error loading pull requests:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [backend, buildFilters]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadPullRequests(nextPage, true);
    }
  }, [currentPage, hasMore, loadingMore, loadPullRequests]);

  useEffect(() => {
    setCurrentPage(1);
    loadPullRequests(1, false);
  }, [loadPullRequests]);

  // IntersectionObserver setup function
  const setupIntersectionObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (loadMoreRef.current && hasMore) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMore();
          }
        },
        { threshold: 0.1 }
      );
      
      observerRef.current.observe(loadMoreRef.current);
    }
  }, [hasMore, loadMore]);

  // Setup observer when hasMore or loadMore changes
  useEffect(() => {
    setupIntersectionObserver();
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [setupIntersectionObserver]);

  // Setup observer again after DOM updates
  useEffect(() => {
    if (hasMore && allPullRequests.length > 0) {
      const timeoutId = setTimeout(() => {
        setupIntersectionObserver();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [hasMore, allPullRequests.length, setupIntersectionObserver]);

  const handleFilterChange = (type: 'pr' | 'provider' | 'repository', value: string) => {
    if (type === 'pr') {
      setPrFilter(value as "open" | "all" | "assigned");
    } else if (type === 'provider') {
      setProviderFilter(value);
    } else if (type === 'repository') {
      setRepositoryFilter(value);
    }
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Get unique providers and repositories from loaded data
  const providers = [...new Set(allPullRequests.map(pr => pr.provider))].sort();
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
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
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
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">Total</span>
              <span className="px-2 py-1 bg-blue-500 text-white font-semibold">
                {totalCount}
              </span>
            </div>
            <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">Loaded</span>
              <span className="px-2 py-1 bg-green-500 text-white font-semibold">
                {allPullRequests.length}
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
                onChange={(e) => handleFilterChange('pr', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="open">Open PRs</option>
                <option value="all">All PRs</option>
                <option value="assigned">Assigned to Me</option>
              </select>
              <select 
                value={providerFilter} 
                onChange={(e) => handleFilterChange('provider', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Providers</option>
                {providers.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
              <select 
                value={repositoryFilter} 
                onChange={(e) => handleFilterChange('repository', e.target.value)}
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
          {allPullRequests.map((pr, index) => (
            <div 
              key={pr.id} 
              className={`p-2 hover:bg-gray-50 transition-colors cursor-pointer ${
                index !== allPullRequests.length - 1 ? 'border-b border-gray-300' : ''
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
                  {pr.draft && <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">Draft</span>}
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
          
          {/* Infinite scroll trigger */}
          {hasMore && (
            <div 
              ref={(element) => {
                loadMoreRef.current = element;
                if (element) {
                  setTimeout(() => setupIntersectionObserver(), 0);
                }
              }}
              className="p-4 text-center text-gray-500"
            >
              {loadingMore ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  <span>Loading more pull requests...</span>
                </div>
              ) : (
                <span>Scroll to load more</span>
              )}
            </div>
          )}
          
          {!hasMore && allPullRequests.length > 0 && (
            <div className="p-4 text-center text-gray-500">
              <span>All pull requests loaded ({allPullRequests.length} of {totalCount})</span>
            </div>
          )}
        </div>

        {allPullRequests.length === 0 && !loading && (
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