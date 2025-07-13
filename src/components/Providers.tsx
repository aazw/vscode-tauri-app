import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBackend } from "../backends/BackendProvider";
import { GitProvider } from "../types/AppBackend";
// import { getRelativeTime } from "../utils/timeHelper"; // No longer needed for provider-level sync

const Providers = () => {
  const navigate = useNavigate();
  const backend = useBackend();
  const [providers, setProviders] = useState<GitProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<{ [key: number]: string }>({});
  const [editingProvider, setEditingProvider] = useState<GitProvider | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [tokenStatuses, setTokenStatuses] = useState<{ [key: number]: 'valid' | 'invalid' | 'checking' }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [syncingProviders, setSyncingProviders] = useState<Set<number>>(new Set());

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
      setTokenError({});
      
      const providerList = await backend.getProviders();
      setProviders(providerList);
      
      // Use actual token_valid values from providers
      const statuses: { [key: number]: 'valid' | 'invalid' | 'checking' } = {};
      providerList.forEach(provider => {
        if (provider.token) {
          statuses[provider.id] = provider.token_valid ? 'valid' : 'invalid';
        } else {
          statuses[provider.id] = 'invalid'; // No token means invalid
        }
      });
      setTokenStatuses(statuses);
    } catch (err) {
      console.error('Failed to load providers:', err);
      
      let errorMessage = 'Failed to load providers';
      if (err instanceof Error) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection.';
        } else if (err.message.includes('unauthorized') || err.message.includes('401')) {
          errorMessage = 'Authentication error: Please check your credentials and try again.';
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

  const toggleMenu = (providerId: number) => {
    setOpenMenuId(openMenuId === providerId ? null : providerId);
  };



  const getUrlAccessStatus = (provider: GitProvider) => {
    // Mock URL access check based on token status
    const status = tokenStatuses[provider.id];
    if (status === 'valid') return { icon: "✅", color: "text-green-600", title: "URL accessible" };
    if (status === 'invalid') return { icon: "❌", color: "text-red-600", title: "URL access failed" };
    if (status === 'checking') return { icon: "🔄", color: "text-yellow-600", title: "Checking access..." };
    return { icon: "❓", color: "text-gray-400", title: "Access not tested" };
  };

  const handleUpdateToken = async (providerId: number, token: string) => {
    try {
      // Clear any previous errors for this provider
      setTokenError(prev => ({ ...prev, [providerId]: '' }));
      setError(null);
      
      console.log(`🔧 Updating token for provider: ${providerId}, token length: ${token?.length || 0}`);
      console.log(`🔧 Backend type: ${backend.constructor.name}`);
      
      // Validate token format before sending to backend
      if (!token || token.trim().length === 0) {
        setTokenError(prev => ({ ...prev, [providerId]: 'Token cannot be empty' }));
        return;
      }
      
      if (token.length < 10) {
        setTokenError(prev => ({ ...prev, [providerId]: 'Token appears to be too short. Please check your token format.' }));
        return;
      }
      
      await backend.updateProviderToken(providerId, token || null);
      console.log(`✅ Token updated successfully for provider: ${providerId}`);
      
      // Update local state
      setProviders(providers.map(provider => 
        provider.id === providerId 
          ? { ...provider, updated_at: new Date().toISOString() }
          : provider
      ));
      
      // Validate token with backend
      setTokenStatuses({ ...tokenStatuses, [providerId]: 'checking' });
      try {
        const isValid = await backend.validateProviderToken(providerId);
        setTokenStatuses(prev => ({ ...prev, [providerId]: isValid ? 'valid' : 'invalid' }));
        
        if (!isValid) {
          setTokenError(prev => ({ ...prev, [providerId]: 'Token validation failed. Please check if the token is valid and has the required permissions.' }));
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        setTokenStatuses(prev => ({ ...prev, [providerId]: 'invalid' }));
        
        let errorMessage = 'Token validation failed';
        if (error instanceof Error) {
          if (error.message.includes('unauthorized') || error.message.includes('401')) {
            errorMessage = 'Invalid token: The token is not valid or has expired. Please generate a new token.';
          } else if (error.message.includes('forbidden') || error.message.includes('403')) {
            errorMessage = 'Access denied: The token does not have the required permissions. Please check your token scopes.';
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Network error: Unable to validate token. Please check your internet connection.';
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timeout: Token validation took too long. Please try again.';
          } else {
            errorMessage = `Validation error: ${error.message}`;
          }
        }
        
        setTokenError(prev => ({ ...prev, [providerId]: errorMessage }));
      }
      
      setEditingProvider(null);
    } catch (error) {
      console.error('Failed to update provider token:', error);
      
      let errorMessage = 'Failed to update provider token';
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error: Unable to update token. Please check your internet connection.';
        } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
          errorMessage = 'Authentication error: Unable to update token. Please check your authentication.';
        } else if (error.message.includes('server') || error.message.includes('500')) {
          errorMessage = 'Server error: Unable to update token due to server issues. Please try again later.';
        } else {
          errorMessage = `Update error: ${error.message}`;
        }
      }
      
      setTokenError(prev => ({ ...prev, [providerId]: errorMessage }));
    }
  };

  const handleDeleteProvider = async (providerId: number) => {
    if (window.confirm("Are you sure you want to delete this provider?")) {
      try {
        setError(null);
        
        await backend.deleteProvider(providerId);
        setProviders(providers.filter(provider => provider.id !== providerId));
        
        // Clear any token errors for this provider
        setTokenError(prev => {
          const newErrors = { ...prev };
          delete newErrors[providerId];
          return newErrors;
        });
        
        // Clear token status for this provider
        setTokenStatuses(prev => {
          const newStatuses = { ...prev };
          delete newStatuses[providerId];
          return newStatuses;
        });
      } catch (error) {
        console.error('Failed to delete provider:', error);
        
        let errorMessage = 'Failed to delete provider';
        if (error instanceof Error) {
          if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Network error: Unable to delete provider. Please check your internet connection.';
          } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
            errorMessage = 'Authentication error: Unable to delete provider. Please check your authentication.';
          } else if (error.message.includes('forbidden') || error.message.includes('403')) {
            errorMessage = 'Access denied: You do not have permission to delete this provider.';
          } else if (error.message.includes('not found') || error.message.includes('404')) {
            errorMessage = 'Provider not found: The provider may have already been deleted.';
          } else if (error.message.includes('server') || error.message.includes('500')) {
            errorMessage = 'Server error: Unable to delete provider due to server issues. Please try again later.';
          } else {
            errorMessage = `Delete error: ${error.message}`;
          }
        }
        
        setError(errorMessage);
      }
    }
  };

  const handleSyncProvider = async (providerId: number) => {
    try {
      setSyncingProviders(prev => new Set(prev).add(providerId));
      setError(null);
      
      console.log(`🔄 Starting sync for provider: ${providerId}`);
      await backend.syncProvider(providerId);
      console.log(`✅ Sync completed for provider: ${providerId}`);
      
      // Refresh providers after sync
      await loadProviders();
    } catch (error) {
      console.error('Failed to sync provider:', error);
      
      let errorMessage = 'Failed to sync provider';
      if (error instanceof Error) {
        if (error.message.includes('Sync already in progress')) {
          errorMessage = 'Sync is already in progress. Please wait for it to complete.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error: Unable to sync provider. Please check your internet connection.';
        } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
          errorMessage = 'Authentication error: Unable to sync provider. Please check your token.';
        } else if (error.message.includes('forbidden') || error.message.includes('403')) {
          errorMessage = 'Access denied: Your token may not have the required permissions.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Rate limit exceeded: Please wait before syncing again.';
        } else {
          errorMessage = `Sync error: ${error.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setSyncingProviders(prev => {
        const newSet = new Set(prev);
        newSet.delete(providerId);
        return newSet;
      });
    }
  };

  const getProviderIcon = (type: string) => {
    return type === "github" ? "🐙" : "🦊";
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
              loadProviders();
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
            placeholder="Search providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
              {providers.filter(provider => 
                provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                provider.provider_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                provider.base_url.toLowerCase().includes(searchTerm.toLowerCase())
              ).length}
            </span>
          </div>
        </div>
      </div>

      {/* Provider List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white border-t border-b border-gray-300">
          {providers.filter(provider => 
            provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            provider.provider_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            provider.base_url.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((provider, index) => (
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
                        handleSyncProvider(provider.id);
                        setOpenMenuId(null);
                      }}
                      disabled={syncingProviders.has(provider.id) || tokenStatuses[provider.id] !== 'valid'}
                      className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 focus:outline-none disabled:text-gray-400 disabled:hover:bg-gray-50"
                    >
                      {syncingProviders.has(provider.id) ? '🔄 Syncing...' : '🔄 Sync Now'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingProvider(provider);
                        setOpenMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 focus:outline-none"
                    >
                      Edit Token
                    </button>
                    {![1, 2].includes(provider.id) && (
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
            </div>

            {editingProvider?.id === provider.id && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                {tokenError[provider.id] && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                      <span className="text-red-600 text-sm mr-2">⚠️</span>
                      <span className="text-red-700 text-sm">{tokenError[provider.id]}</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Enter new token"
                    className={`flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                      tokenError[provider.id] 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleUpdateToken(provider.id, e.currentTarget.value);
                      }
                    }}
                    onFocus={() => {
                      // Clear error when user starts typing
                      setTokenError(prev => ({ ...prev, [provider.id]: '' }));
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
                    onClick={() => {
                      setEditingProvider(null);
                      setTokenError(prev => ({ ...prev, [provider.id]: '' }));
                    }}
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
        
        {providers.filter(provider => 
          provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          provider.provider_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          provider.base_url.toLowerCase().includes(searchTerm.toLowerCase())
        ).length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No providers match your search' : 'No providers found'}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms.' : 'Add a Git provider to get started.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Providers;