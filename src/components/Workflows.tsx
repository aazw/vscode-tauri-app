import { useState, useEffect } from "react";
import { useBackend } from "../backends/BackendProvider";
import { WorkflowRun } from "../types/AppBackend";

const Workflows = () => {
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
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

  const filteredWorkflows = workflowRuns.filter(workflow => {
    // Status filter
    if (statusFilter !== "all" && workflow.status !== statusFilter) return false;
    
    // Provider filter
    if (providerFilter !== "all" && workflow.provider !== providerFilter) return false;
    
    return true;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Get unique providers
  const providers = [...new Set(workflowRuns.map(workflow => workflow.provider))].sort();

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
                {workflowRuns.filter(w => w.status === "success").length}
              </span>
            </div>
            <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">Failure</span>
              <span className="px-2 py-1 bg-red-500 text-white font-semibold">
                {workflowRuns.filter(w => w.status === "failure").length}
              </span>
            </div>
            <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">In Progress</span>
              <span className="px-2 py-1 bg-yellow-500 text-white font-semibold">
                {workflowRuns.filter(w => w.status === "in_progress").length}
              </span>
            </div>
            <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">Cancelled</span>
              <span className="px-2 py-1 bg-gray-500 text-white font-semibold">
                {workflowRuns.filter(w => w.status === "cancelled").length}
              </span>
            </div>
          </div>
        </div>
        
        {/* Filter Dropdown */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Workflows</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="in_progress">In Progress</option>
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
            </div>
          </div>
        )}
      </div>

      {/* Workflow List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white border-t border-b border-gray-300">
          {filteredWorkflows.map((workflow, index) => (
            <div 
              key={workflow.id} 
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                index !== filteredWorkflows.length - 1 ? 'border-b border-gray-300' : ''
              }`}
              onClick={() => window.open(workflow.url, '_blank')} 
              role="button" 
              tabIndex={0}
            >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-lg">{getStatusIcon(workflow.status)}</span>
                <div className="flex-1">
                  <a 
                    href={workflow.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm leading-tight cursor-pointer hover:underline"
                  >
                    {workflow.name}
                  </a>
                </div>
              </div>
              <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                workflow.status === 'success' ? 'bg-green-100 text-green-800' :
                workflow.status === 'failure' ? 'bg-red-100 text-red-800' :
                workflow.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {workflow.status}
              </span>
            </div>
            <div className="space-y-2 text-xs text-gray-600 mb-3">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-medium">{workflow.provider} / {workflow.repository}</span>
                <span>on {workflow.branch}</span>
              </div>
              <div className="font-mono text-xs">
                {workflow.commit_sha.substring(0, 7)} - {workflow.commit_message}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>by {workflow.author}</span>
              <span>{formatDate(workflow.created_at)}</span>
            </div>
          </div>
          ))}
        </div>
        
        {filteredWorkflows.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
            <p className="text-gray-600">Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workflows;