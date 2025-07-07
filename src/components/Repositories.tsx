import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBackend } from "../backends/BackendProvider";
import { Repository, GitProvider } from "../types/AppBackend";

const Repositories = () => {
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading repositories...</div>
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
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => navigate('/repositories/new')}
          >
            <span className="mr-2">➕</span> Add Repository
          </button>
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
                {filteredRepositories.length}
              </span>
            </div>
            <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">Active</span>
              <span className="px-2 py-1 bg-green-500 text-white font-semibold">
                {filteredRepositories.filter(r => !r.is_archived).length}
              </span>
            </div>
            <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium">Private</span>
              <span className="px-2 py-1 bg-purple-500 text-white font-semibold">
                {filteredRepositories.filter(r => r.is_private).length}
              </span>
            </div>
          </div>
        </div>
        
        {/* Filter Dropdown */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <select 
                value={selectedProvider} 
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Languages</option>
                {getLanguages().map(language => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Repository List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white border-t border-b border-gray-300">
          {filteredRepositories.map((repo, index) => (
            <div 
              key={repo.id} 
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                index !== filteredRepositories.length - 1 ? 'border-b border-gray-300' : ''
              } ${repo.is_archived ? 'opacity-60' : ''}`}
              onClick={() => window.open(repo.web_url, '_blank')} 
              role="button" 
              tabIndex={0}
            >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getProviderIcon(repo.provider_type)}</span>
                <span className="text-sm text-gray-600">{repo.provider_name}</span>
              </div>
              <div className="relative">
                <button 
                  className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMenu(repo.id);
                  }}
                >
                  ⋮
                </button>
                {openMenuId === repo.id && (
                  <div className="absolute right-0 mt-1 w-24 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <button 
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 focus:outline-none"
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

            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <a 
                  href={repo.web_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm cursor-pointer hover:underline" 
                  onClick={(e) => e.stopPropagation()}
                >
                  {repo.full_name}
                </a>
              </div>
              <div className="flex flex-wrap gap-1">
                {repo.is_private && (
                  <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                    Private
                  </span>
                )}
                {repo.is_fork && (
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                    Fork
                  </span>
                )}
                {repo.is_archived && (
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                    Archived
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span>🐛</span>
                  <span>{repo.issues_count}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>🔀</span>
                  <span>{repo.forks_count}</span>
                </span>
                {repo.language && (
                  <span 
                    className="inline-block px-2 py-1 rounded-full text-white text-xs font-medium"
                    style={{ backgroundColor: getLanguageColor(repo.language) }}
                  >
                    {repo.language}
                  </span>
                )}
              </div>
              <span>{formatDate(repo.updated_at)}</span>
            </div>
          </div>
          ))}
        </div>
        
        {filteredRepositories.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No repositories found</h3>
            <p className="text-gray-600">Try adjusting your filters or sync repositories from your providers.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Repositories;