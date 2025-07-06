import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBackend } from "../backends/BackendProvider";
import { GitProvider } from "../types/AppBackend";
import "./GitProviderManager.css";

const GitProviderManager = () => {
  const navigate = useNavigate();
  const backend = useBackend();
  const [providers, setProviders] = useState<GitProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<GitProvider | null>(null);
  const [tokenStatuses, setTokenStatuses] = useState<{ [key: string]: 'valid' | 'invalid' | 'checking' }>({});

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
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
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
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
    return <div className="loading">Loading providers...</div>;
  }

  return (
    <div className="provider-manager">
      <div className="header">
        <button 
          className="add-button"
          onClick={() => navigate('/providers/new')}
        >
          Add Provider
        </button>
      </div>

      <div className="provider-list">
        {providers.map((provider) => (
          <div key={provider.id} className="provider-card">
            <div className="provider-header">
              <div className="provider-info">
                <span className="provider-icon">{getProviderIcon(provider.provider_type)}</span>
                <h3>{provider.name}</h3>
                <span className="provider-type">{provider.provider_type}</span>
              </div>
            </div>
            
            <div className="provider-details">
              <p><strong>URL:</strong> {provider.base_url}</p>
              <p>
                <strong>Token:</strong> {provider.token ? "••••••••" : "Not set"}
                {provider.token && tokenStatuses[provider.id] && (
                  <span className={`token-status ${tokenStatuses[provider.id]}`}>
                    {getTokenStatusIcon(tokenStatuses[provider.id])} {tokenStatuses[provider.id]}
                  </span>
                )}
              </p>
              <p><strong>Created:</strong> {new Date(provider.created_at).toLocaleDateString()}</p>
            </div>

            {editingProvider?.id === provider.id && (
              <div className="token-edit-form">
                <input
                  type="password"
                  placeholder="Enter new token"
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
                >
                  Update
                </button>
                <button onClick={() => setEditingProvider(null)}>Cancel</button>
              </div>
            )}

            <div className="provider-actions-bottom">
              <button
                onClick={() => setEditingProvider(provider)}
                className="edit-button"
              >
                Edit Token
              </button>
              {!["github-com", "gitlab-com"].includes(provider.id) && (
                <button
                  onClick={() => handleDeleteProvider(provider.id)}
                  className="delete-button"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GitProviderManager;