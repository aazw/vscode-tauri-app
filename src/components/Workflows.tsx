import { useState, useEffect, useRef, useCallback } from "react";
import { useBackend } from "../backends/BackendProvider";
import { WorkflowRun, WorkflowFilters, PaginationParams, WorkflowStats } from "../types/AppBackend";
import { getRelativeTime } from "../utils/timeHelper";

const Workflows = () => {
  const [allWorkflows, setAllWorkflows] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [repositoryFilter, setRepositoryFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<WorkflowStats>({ total: 0, success: 0, failure: 0, in_progress: 0, cancelled: 0 });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  
  const backend = useBackend();

  const buildFilters = useCallback((): WorkflowFilters => {
    const filters: WorkflowFilters = {};
    
    if (statusFilter !== "all") {
      // Map UI filter to backend filter
      if (statusFilter === "success" || statusFilter === "failure" || statusFilter === "cancelled") {
        filters.status = statusFilter;
      } else if (statusFilter === "in_progress") {
        filters.status = "in_progress";
      }
    }
    
    if (providerFilter !== "all") {
      filters.provider = providerFilter;
    }
    
    if (repositoryFilter !== "all") {
      filters.repository = repositoryFilter;
    }
    
    if (debouncedSearchQuery.trim()) {
      filters.search = debouncedSearchQuery.trim();
    }
    
    return filters;
  }, [statusFilter, providerFilter, repositoryFilter, debouncedSearchQuery]);

  const loadWorkflows = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const filters = buildFilters();
      const pagination: PaginationParams = { page, per_page: 20 };
      
      const response = await backend.getWorkflows(filters, pagination);
      
      if (append && page > 1) {
        setAllWorkflows(prev => [...prev, ...response.data]);
      } else {
        setAllWorkflows(response.data);
        // Load stats only when loading first page or filters change
        const statsResponse = await backend.getWorkflowStats(filters);
        setStats(statsResponse);
      }
      
      setTotalCount(response.pagination.total);
      setHasMore(page < response.pagination.total_pages);
      
    } catch (err) {
      setError("Failed to load workflows");
      console.error("Error loading workflows:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [backend, buildFilters]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadWorkflows(nextPage, true);
    }
  }, [currentPage, hasMore, loadingMore, loadWorkflows]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
    loadWorkflows(1, false);
  }, [loadWorkflows]);

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
    if (hasMore && allWorkflows.length > 0) {
      // Use setTimeout to ensure DOM has been updated
      const timeoutId = setTimeout(() => {
        setupIntersectionObserver();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [hasMore, allWorkflows.length, setupIntersectionObserver]);

  const handleFilterChange = (type: 'status' | 'provider' | 'repository', value: string) => {
    if (type === 'status') {
      setStatusFilter(value);
    } else if (type === 'provider') {
      setProviderFilter(value);
    } else if (type === 'repository') {
      setRepositoryFilter(value);
    }
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Don't reset currentPage here - let debounced search handle it
  };

  // Get unique providers and repositories from loaded data
  const providers = [...new Set(allWorkflows.map(workflow => workflow.provider))].sort();
  const repositories = [...new Set(allWorkflows.map(workflow => workflow.repository))].sort();

  const getStatusLabel = (status: string, conclusion: string) => {
    if (status === "in_progress") {
      return { label: "In Progress", className: "bg-yellow-200 text-yellow-800" };
    }
    switch (conclusion) {
      case "success": return { label: "Success", className: "bg-green-200 text-green-800" };
      case "failure": return { label: "Failed", className: "bg-red-200 text-red-800" };
      case "cancelled": return { label: "Canceled", className: "bg-gray-200 text-gray-800" };
      default: return { label: "Unknown", className: "bg-gray-200 text-gray-800" };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading workflows...</div>
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
            placeholder="Search workflows..."
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
              <span className="px-2 py-1 bg-orange-500 text-white font-semibold">
                {allWorkflows.length}
              </span>
            </div>
            <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">Success</span>
              <span className="px-2 py-1 bg-green-500 text-white font-semibold">
                {stats.success}
              </span>
            </div>
            <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">Failed</span>
              <span className="px-2 py-1 bg-red-500 text-white font-semibold">
                {stats.failure}
              </span>
            </div>
            <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">Cancelled</span>
              <span className="px-2 py-1 bg-gray-500 text-white font-semibold">
                {stats.cancelled}
              </span>
            </div>
            <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">In Progress</span>
              <span className="px-2 py-1 bg-yellow-500 text-white font-semibold">
                {stats.in_progress}
              </span>
            </div>
          </div>
        </div>
        
        {/* Filter Dropdown */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <select 
                value={statusFilter} 
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="in_progress">In Progress</option>
                <option value="cancelled">Cancelled</option>
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

      {/* Workflow List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
        <div className="bg-white border-t border-b border-gray-300">
          {allWorkflows.map((workflow, index) => (
            <div 
              key={workflow.id} 
              className={`p-2 hover:bg-gray-50 transition-colors cursor-pointer ${
                index !== allWorkflows.length - 1 ? 'border-b border-gray-300' : ''
              }`}
              onClick={() => backend.openExternalUrl(workflow.url)} 
              role="button" 
              tabIndex={0}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      backend.openExternalUrl(workflow.url);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm leading-tight cursor-pointer hover:underline truncate"
                  >
                    {workflow.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${getStatusLabel(workflow.status, workflow.conclusion || '').className}`}>
                    {getStatusLabel(workflow.status, workflow.conclusion || '').label}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-1 text-xs text-gray-600">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium">{workflow.provider}</span>
                  <span className="font-medium truncate">{workflow.repository}</span>
                  <span className="text-gray-500 font-mono">#{workflow.api_id}</span>
                </div>
                <span className="text-xs text-gray-500 shrink-0">{getRelativeTime(workflow.api_created_at || '')}</span>
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
                  <span>Loading more workflows...</span>
                </div>
              ) : (
                <span>Scroll to load more</span>
              )}
            </div>
          )}
          
          {!hasMore && allWorkflows.length > 0 && (
            <div className="p-4 text-center text-gray-500">
              <span>All workflows loaded ({allWorkflows.length} of {totalCount})</span>
            </div>
          )}
        </div>

        {allWorkflows.length === 0 && !loading && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
            <p className="text-gray-600">No workflows available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workflows;