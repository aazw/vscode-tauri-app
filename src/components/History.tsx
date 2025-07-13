import { useState, useEffect } from "react";
import { useBackend } from "../backends/BackendProvider";
import { SyncHistory } from "../types/AppBackend";

const History = () => {
  const [history, setHistory] = useState<SyncHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const backend = useBackend();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const syncHistory = await backend.getSyncHistory();
      setHistory(syncHistory);
    } catch (err) {
      console.error('Failed to load sync history:', err);
      
      let errorMessage = 'Failed to load sync history';
      if (err instanceof Error) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timeout: The server took too long to respond. Please try again.';
        } else if (err.message.includes('server') || err.message.includes('500')) {
          errorMessage = 'Server error: The server encountered an internal error. Please try again later.';
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.target_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sync_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.sync_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'started': return '🔄';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'started': return 'text-yellow-600';
      default: return 'text-gray-500';
    }
  };

  const getSyncTypeIcon = (type: string) => {
    switch (type) {
      case 'provider': return '🐙';
      case 'all_providers': return '🔄';
      case 'repository': return '📁';
      default: return '📊';
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading sync history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md w-full">
          <div className="flex items-center mb-2">
            <span className="text-red-600 text-lg mr-2">⚠️</span>
            <h3 className="text-red-800 font-semibold">Error</h3>
          </div>
          <p className="text-red-700 text-sm mb-3">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadHistory();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
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
            placeholder="Search sync history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={loadHistory}
          >
            <span className="mr-2">🔄</span> Refresh
          </button>
        </div>
        
        {/* Filter and Badges Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="started">In Progress</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="provider">Provider</option>
              <option value="all_providers">All Providers</option>
              <option value="repository">Repository</option>
            </select>
          </div>
          <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">Total</span>
            <span className="px-2 py-1 bg-blue-500 text-white font-semibold">
              {filteredHistory.length}
            </span>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white border-t border-b border-gray-300">
          {filteredHistory.map((item, index) => (
            <div 
              key={item.id} 
              className={`p-4 hover:bg-gray-50 transition-colors ${
                index !== filteredHistory.length - 1 ? 'border-b border-gray-300' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getSyncTypeIcon(item.sync_type)}</span>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{item.target_name}</h3>
                    <span className="text-xs text-gray-500 capitalize">{item.sync_type.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)} {item.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getRelativeTime(item.started_at)}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-gray-600 mb-3">
                <div>
                  <span className="font-medium">Started:</span>
                  <br />
                  <span>{formatDateTime(item.started_at)}</span>
                </div>
                {item.completed_at && (
                  <div>
                    <span className="font-medium">Completed:</span>
                    <br />
                    <span>{formatDateTime(item.completed_at)}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">Duration:</span>
                  <br />
                  <span>{formatDuration(item.duration_seconds)}</span>
                </div>
                <div>
                  <span className="font-medium">Items Synced:</span>
                  <br />
                  <span>{item.items_synced}</span>
                </div>
              </div>

              {item.status === 'completed' && (
                <div className="flex gap-4 text-xs text-gray-600">
                  <span>
                    <span className="font-medium">Repositories:</span> {item.repositories_synced}
                  </span>
                  {item.errors_count > 0 && (
                    <span className="text-yellow-600">
                      <span className="font-medium">Errors:</span> {item.errors_count}
                    </span>
                  )}
                </div>
              )}

              {item.error_message && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center">
                    <span className="text-red-600 text-sm mr-2">⚠️</span>
                    <span className="text-red-700 text-sm">{item.error_message}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {filteredHistory.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'No sync history matches your filters' 
                : 'No sync history found'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search terms or filters.'
                : 'Sync history will appear here once you start synchronizing data.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;