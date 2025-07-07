import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBackend } from "../backends/BackendProvider";
import { GitProvider } from "../types/AppBackend";

const Providers = () => {
  const navigate = useNavigate();
  const backend = useBackend();
  const [providers, setProviders] = useState<GitProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<GitProvider | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [tokenStatuses, setTokenStatuses] = useState<{ [key: string]: 'valid' | 'invalid' | 'checking' }>({});

  useEffect(() => {
    loadProviders();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element)?.closest('.provider-menu')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const providerList = await backend.getProviders();
      setProviders(providerList);
      
      // Mock token validation for providers with tokens
      const statuses: { [key: string]: 'valid' | 'invalid' | 'checking' } = {};
      providerList.forEach(provider => {
        if (provider.token) {
          statuses[provider.id] = Math.random() > 0.3 ? 'valid' : 'invalid';
        }
      });
      setTokenStatuses(statuses);
    } catch (err) {
      setError('Failed to load providers');
      console.error('Failed to load providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMenu = (providerId: string) => {
    setOpenMenuId(openMenuId === providerId ? null : providerId);
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

  const getLastSyncStatus = (provider: GitProvider) => {
    const status = tokenStatuses[provider.id];
    if (!provider.token) return { text: "No token configured", color: "text-gray-500" };
    if (status === 'valid') return { text: "Last sync successful", color: "text-green-600" };
    if (status === 'invalid') return { text: "Last sync failed", color: "text-red-600" };
    if (status === 'checking') return { text: "Syncing...", color: "text-yellow-600" };
    return { text: "Not synced yet", color: "text-gray-500" };
  };

  const getUrlAccessStatus = (provider: GitProvider) => {
    // Mock URL access check based on token status
    if (!provider.token) return { icon: "❓", color: "text-gray-400", title: "No token to test access" };
    const status = tokenStatuses[provider.id];
    if (status === 'valid') return { icon: "✅", color: "text-green-600", title: "URL accessible" };
    if (status === 'invalid') return { icon: "❌", color: "text-red-600", title: "URL access failed" };
    if (status === 'checking') return { icon: "🔄", color: "text-yellow-600", title: "Checking access..." };
    return { icon: "❓", color: "text-gray-400", title: "Access not tested" };
  };

  const handleUpdateToken = async (providerId: string, token: string) => {
    try {
      await backend.updateProviderToken(providerId, token || null);
      
      // Update local state
      setProviders(providers.map(provider => 
        provider.id === providerId 
          ? { ...provider, token: token || null, updated_at: new Date().toISOString() }
          : provider
      ));
      
      // Mock token validation
      if (token) {
        setTokenStatuses({ ...tokenStatuses, [providerId]: 'checking' });
        setTimeout(() => {
          setTokenStatuses({ ...tokenStatuses, [providerId]: Math.random() > 0.3 ? 'valid' : 'invalid' });
        }, 1000);
      } else {
        const newStatuses = { ...tokenStatuses };
        delete newStatuses[providerId];
        setTokenStatuses(newStatuses);
      }
      
      setEditingProvider(null);
    } catch (error) {
      console.error('Failed to update provider token:', error);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (window.confirm("Are you sure you want to delete this provider?")) {
      try {
        await backend.deleteProvider(providerId);
        setProviders(providers.filter(provider => provider.id !== providerId));
      } catch (error) {
        console.error('Failed to delete provider:', error);
      }
    }
  };

  const getProviderIcon = (type: string) => {
    return type === "github" ? "🐙" : "🦊";
  };

  const getTokenStatusIcon = (status: 'valid' | 'invalid' | 'checking') => {
    switch (status) {
      case 'valid': return '✅';
      case 'invalid': return '❌';
      case 'checking': return '🔄';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading providers...</div>
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
            placeholder="Search providers..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => navigate('/providers/new')}
          >
            <span className="mr-2">➕</span> Add Provider
          </button>
        </div>
        
        {/* Badges Row */}
        <div className="flex justify-end">
          <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">Total</span>
            <span className="px-2 py-1 bg-blue-500 text-white font-semibold">
              {providers.length}
            </span>
          </div>
        </div>
      </div>

      {/* Provider List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white border-t border-b border-gray-300">
          {providers.map((provider, index) => (
            <div 
              key={provider.id} 
              className={`p-4 hover:bg-gray-50 transition-colors ${
                index !== providers.length - 1 ? 'border-b border-gray-300' : ''
              }`}
            >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">{getProviderIcon(provider.provider_type)}</span>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{provider.name}</h3>
                  <span className="text-xs text-gray-500 capitalize">{provider.provider_type}</span>
                </div>
              </div>
              <div className="relative provider-menu">
                <button
                  onClick={() => toggleMenu(provider.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <span className="text-lg">⋮</span>
                </button>
                {openMenuId === provider.id && (
                  <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <button
                      onClick={() => {
                        setEditingProvider(provider);
                        setOpenMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 focus:outline-none"
                    >
                      Edit Token
                    </button>
                    {!["github-com", "gitlab-com"].includes(provider.id) && (
                      <button
                        onClick={() => {
                          handleDeleteProvider(provider.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 focus:outline-none"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2 text-xs text-gray-600 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">URL:</span>
                <span>{provider.base_url}</span>
                <span 
                  className={getUrlAccessStatus(provider).color}
                  title={getUrlAccessStatus(provider).title}
                >
                  {getUrlAccessStatus(provider).icon}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Last Sync:</span>
                <span className={getLastSyncStatus(provider).color}>
                  {getLastSyncStatus(provider).text}
                </span>
                {provider.token && tokenStatuses[provider.id] && (
                  <span>{getTokenStatusIcon(tokenStatuses[provider.id])}</span>
                )}
              </div>
            </div>

            {editingProvider?.id === provider.id && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Enter new token"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleUpdateToken(provider.id, e.currentTarget.value);
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      handleUpdateToken(provider.id, input.value);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Update
                  </button>
                  <button 
                    onClick={() => setEditingProvider(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          ))}
        </div>
        
        {providers.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
            <p className="text-gray-600">Add a Git provider to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Providers;