import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBackend } from "../backends/BackendProvider";
import { Repository, GitProvider } from "../types/AppBackend";
import "./RepositoryManager.css";

const RepositoryManager = () => {
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [providers, setProviders] = useState<GitProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [, setSyncing] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const backend = useBackend();
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [sortBy] = useState<string>("updated");

  useEffect(() => {
    loadData();
  }, [backend]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element)?.closest('.repo-menu')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [providersData, repositoriesData] = await Promise.all([
        backend.getProviders(),
        backend.getAllRepositories()
      ]);
      
      setProviders(providersData);
      setRepositories(repositoriesData);
    } catch (err) {
      setError("Failed to load repositories and providers");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };


  const toggleMenu = (repoId: string) => {
    setOpenMenuId(openMenuId === repoId ? null : repoId);
  };

  const handleDeleteRepo = (repoId: string) => {
    if (window.confirm("Are you sure you want to delete this repository?")) {
      setRepositories(repositories.filter(repo => repo.id !== repoId));
      setOpenMenuId(null);
    }
  };

  const getLanguages = (): string[] => {
    const languages = [...new Set(repositories.map(repo => repo.language).filter(Boolean))] as string[];
    return languages.sort();
  };

  const filteredRepositories = repositories
    .filter(repo => {
      // Search filter
      if (searchQuery && !repo.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !repo.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Provider filter
      if (selectedProvider !== "all" && repo.provider_id !== selectedProvider) {
        return false;
      }
      
      // Visibility filter
      if (visibilityFilter === "public" && repo.is_private) return false;
      if (visibilityFilter === "private" && !repo.is_private) return false;
      if (visibilityFilter === "archived" && !repo.is_archived) return false;
      if (visibilityFilter === "active" && repo.is_archived) return false;
      
      // Language filter
      if (languageFilter !== "all" && repo.language !== languageFilter) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "updated":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case "created":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "stars":
          return b.stars_count - a.stars_count;
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return "Today";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  const getProviderIcon = (type: string) => {
    return type === "github" ? "🐙" : "🦊";
  };

  const getLanguageColor = (language: string | null) => {
    const colors: { [key: string]: string } = {
      "JavaScript": "#f1e05a",
      "TypeScript": "#2b7489",
      "Python": "#3572A5",
      "Java": "#b07219",
      "PHP": "#4F5D95",
      "Vue": "#2c3e50",
      "React": "#61dafb",
      "Go": "#00ADD8",
      "Rust": "#dea584",
      "C++": "#f34b7d"
    };
    return colors[language || ""] || "#6c757d";
  };

  if (loading) {
    return <div className="repository-loading">Loading repositories...</div>;
  }

  if (error) {
    return <div className="repository-error">Error: {error}</div>;
  }

  return (
    <div className="repository-manager">
      <div className="repository-header">
        <button 
          className="filter-toggle-button"
          onClick={() => setShowFilters(!showFilters)}
        >
          🔍 Filter
        </button>
        <button 
          className="add-repo-button"
          onClick={() => navigate('/repositories/new')}
        >
          ➕ Add Repository
        </button>
      </div>

      {showFilters && (
        <div className="repository-filters">
        <div className="filter-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="filter-selects">
          <select 
            value={selectedProvider} 
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Providers</option>
            {providers.map(provider => (
              <option key={provider.id} value={provider.id}>
                {getProviderIcon(provider.provider_type)} {provider.name}
              </option>
            ))}
          </select>

          <select 
            value={visibilityFilter} 
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Repos</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>

          <select 
            value={languageFilter} 
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Languages</option>
            {getLanguages().map(language => (
              <option key={language} value={language}>{language}</option>
            ))}
          </select>
        </div>
      </div>
      )}

      <div className="repository-stats">
        <span className="stats-item">
          <strong>{filteredRepositories.length}</strong> repositories
        </span>
        <span className="stats-item">
          <strong>{filteredRepositories.filter(r => !r.is_archived).length}</strong> active
        </span>
        <span className="stats-item">
          <strong>{filteredRepositories.filter(r => r.is_private).length}</strong> private
        </span>
      </div>

      <div className="repository-grid">
        {filteredRepositories.map((repo) => (
          <div key={repo.id} className={`repository-card ${repo.is_archived ? 'archived' : ''}`} onClick={() => window.open(repo.web_url, '_blank')} role="button" tabIndex={0}>
            <div className="repo-provider-row">
              <div className="repo-provider">
                <span className="provider-icon">{getProviderIcon(repo.provider_type)}</span>
                <span className="provider-name">{repo.provider_name}</span>
              </div>
              <div className="repo-menu">
                <button 
                  className="menu-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMenu(repo.id);
                  }}
                >
                  ⋮
                </button>
                {openMenuId === repo.id && (
                  <div className="menu-dropdown">
                    <button 
                      className="menu-item delete-repo"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRepo(repo.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="repo-header">
              <div className="repo-title">
                <a href={repo.web_url} target="_blank" rel="noopener noreferrer" className="repo-name" onClick={(e) => e.stopPropagation()}>
                  {repo.full_name}
                </a>
                <div className="repo-badges">
                  {repo.is_private && <span className="badge private">Private</span>}
                  {repo.is_fork && <span className="badge fork">Fork</span>}
                  {repo.is_archived && <span className="badge archived">Archived</span>}
                </div>
              </div>
            </div>

            <div className="repo-stats-row">
              <div className="repo-stats">
                <span className="stat-item">🐛{repo.issues_count}</span>
                <span className="stat-item">🔀{repo.forks_count}</span>
                {repo.language && (
                  <span 
                    className="language-tag"
                    style={{ backgroundColor: getLanguageColor(repo.language) }}
                  >
                    {repo.language}
                  </span>
                )}
              </div>
              <div className="last-activity">
                {formatDate(repo.updated_at)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRepositories.length === 0 && (
        <div className="empty-state">
          <h3>No repositories found</h3>
          <p>Try adjusting your filters or sync repositories from your providers.</p>
        </div>
      )}
    </div>
  );
};

export default RepositoryManager;