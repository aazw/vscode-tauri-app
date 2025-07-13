import { useState, useEffect } from "react";
import { useBackend } from "../backends/BackendProvider";
import { WorkflowRun } from "../types/AppBackend";
import { getRelativeTime } from "../utils/timeHelper";

const Workflows = () => {
  const [allWorkflows, setAllWorkflows] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [repositoryFilter, setRepositoryFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  
  const backend = useBackend();

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await backend.getWorkflows();
        setAllWorkflows(response.data);
      } catch (err) {
        setError("Failed to load workflows");
        console.error("Error loading workflows:", err);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflows();
  }, [backend]);

  const filteredWorkflows = allWorkflows.filter(workflow => {
    // Status filter
    if (statusFilter !== "all" && workflow.conclusion !== statusFilter) return false;
    
    // Provider filter
    if (providerFilter !== "all" && workflow.provider !== providerFilter) return false;
    
    // Repository filter
    if (repositoryFilter !== "all" && workflow.repository !== repositoryFilter) return false;
    
    return true;
  }).sort((a, b) => new Date(b.api_created_at || 0).getTime() - new Date(a.api_created_at || 0).getTime());

  // Get unique providers
  const providers = [...new Set(allWorkflows.map(workflow => workflow.provider))].sort();
  
  // Get unique repositories
  const repositories = [...new Set(allWorkflows.map(workflow => workflow.repository))].sort();

  const getStatusIcon = (status: string, conclusion: string) => {
    if (status === "in_progress") return "🟡";
    switch (conclusion) {
      case "success": return "✅";
      case "failure": return "❌";
      case "cancelled": return "⭕";
      default: return "❓";
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
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">Success</span>
              <span className="px-2 py-1 bg-green-500 text-white font-semibold">
                {allWorkflows.filter(w => w.conclusion === "success").length}
              </span>
            </div>
            <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">Failure</span>
              <span className="px-2 py-1 bg-red-500 text-white font-semibold">
                {allWorkflows.filter(w => w.conclusion === "failure").length}
              </span>
            </div>
            <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">In Progress</span>
              <span className="px-2 py-1 bg-yellow-500 text-white font-semibold">
                {allWorkflows.filter(w => w.status === "in_progress").length}
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
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="cancelled">Cancelled</option>
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

      {/* Workflow List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
        <div className="bg-white border-t border-b border-gray-300">
          {filteredWorkflows.map((workflow, index) => (
            <div 
              key={workflow.id} 
              className={`p-2 hover:bg-gray-50 transition-colors cursor-pointer ${
                index !== filteredWorkflows.length - 1 ? 'border-b border-gray-300' : ''
              }`}
              onClick={() => backend.openExternalUrl(workflow.url)} 
              role="button" 
              tabIndex={0}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm">{getStatusIcon(workflow.status, workflow.conclusion || '')}</span>
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
                <span className="text-xs text-gray-500 font-mono ml-2">#{workflow.id}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-medium truncate">{workflow.provider} / {workflow.repository}</span>
                  <span className="shrink-0">{workflow.status}</span>
                </div>
                <span className="text-xs text-gray-500 shrink-0">{getRelativeTime(workflow.api_created_at || '')}</span>
              </div>
            </div>
          ))}
        </div>

        {filteredWorkflows.length === 0 && (
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