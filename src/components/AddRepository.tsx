import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBackend } from "../backends/BackendProvider";
import { GitProvider, Repository } from "../types/AppBackend";
import "./AddRepository.css";


const AddRepository = () => {
  const navigate = useNavigate();
  const backend = useBackend();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<GitProvider[]>([]);
  const [formData, setFormData] = useState({
    provider_id: "",
    repository_url: "",
  });

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const providerList = await backend.getProviders();
        setProviders(providerList);
      } catch (error) {
        console.error('Failed to load providers:', error);
      }
    };
    
    loadProviders();
  }, [backend]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedProvider = providers.find(p => p.id === formData.provider_id);
      
      const newRepository: Omit<Repository, 'id' | 'created_at' | 'updated_at'> = {
        name: extractRepoName(formData.repository_url),
        full_name: extractFullName(formData.repository_url),
        description: "Newly added repository",
        provider_id: formData.provider_id,
        provider_name: selectedProvider?.name || "Unknown",
        provider_type: selectedProvider?.provider_type || "github",
        clone_url: formData.repository_url,
        ssh_url: convertToSshUrl(formData.repository_url),
        web_url: convertToWebUrl(formData.repository_url),
        is_private: false,
        is_fork: false,
        is_archived: false,
        default_branch: "main",
        language: null,
        stars_count: 0,
        forks_count: 0,
        issues_count: 0,
        last_activity: new Date().toISOString(),
      };

      const repositoryId = await backend.addRepository(newRepository);
      console.log("Created new repository with ID:", repositoryId);
      navigate("/repositories");
    } catch (error) {
      console.error('Failed to add repository:', error);
      alert('Failed to add repository. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const extractRepoName = (url: string): string => {
    const match = url.match(/\/([^\/]+)(?:\.git)?$/);
    return match ? match[1].replace('.git', '') : 'unknown-repo';
  };

  const extractFullName = (url: string): string => {
    const match = url.match(/\/([^\/]+\/[^\/]+)(?:\.git)?$/);
    return match ? match[1].replace('.git', '') : 'unknown/repo';
  };

  const convertToSshUrl = (url: string): string => {
    if (url.startsWith('git@')) return url;
    return url.replace(/https:\/\/([^\/]+)\//, 'git@$1:');
  };

  const convertToWebUrl = (url: string): string => {
    if (url.startsWith('http')) return url.replace('.git', '');
    return url.replace(/git@([^:]+):/, 'https://$1/').replace('.git', '');
  };

  const getProviderIcon = (type: string) => {
    return type === "github" ? "🐙" : "🦊";
  };

  const validateUrl = (url: string): boolean => {
    const patterns = [
      /^https:\/\/github\.com\/[^\/]+\/[^\/]+(?:\.git)?$/,
      /^git@github\.com:[^\/]+\/[^\/]+(?:\.git)?$/,
      /^https:\/\/gitlab\.com\/[^\/]+\/[^\/]+(?:\.git)?$/,
      /^git@gitlab\.com:[^\/]+\/[^\/]+(?:\.git)?$/,
      /^https:\/\/[^\/]+\/[^\/]+\/[^\/]+(?:\.git)?$/,
      /^git@[^:]+:[^\/]+\/[^\/]+(?:\.git)?$/,
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const isFormValid = formData.provider_id && formData.repository_url && validateUrl(formData.repository_url);

  return (
    <div className="add-repository-page">
      <div className="add-repository-header">
        <button 
          className="back-button"
          onClick={() => navigate("/repositories")}
        >
          ← Back to Repositories
        </button>
        <h1>Add New Repository</h1>
      </div>

      <div className="add-repository-form-container">
        <form onSubmit={handleSubmit} className="add-repository-form">
          <div className="form-group">
            <label htmlFor="provider_id">Git Provider</label>
            <select
              id="provider_id"
              name="provider_id"
              value={formData.provider_id}
              onChange={handleInputChange}
              className="form-input"
              required
            >
              <option value="">Select a provider</option>
              {providers.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {getProviderIcon(provider.provider_type)} {provider.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="repository_url">Repository URL</label>
            <input
              type="text"
              id="repository_url"
              name="repository_url"
              value={formData.repository_url}
              onChange={handleInputChange}
              placeholder="https://github.com/user/repo.git or git@github.com:user/repo.git"
              className="form-input"
              required
            />
            <small className="form-help">
              Enter the repository URL to track it in your dashboard. No cloning will be performed.
            </small>
            {formData.repository_url && !validateUrl(formData.repository_url) && (
              <small className="form-error">
                Please enter a valid Git repository URL
              </small>
            )}
          </div>


          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => navigate("/repositories")}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading || !isFormValid}
            >
              {loading ? "Adding..." : "Add Repository"}
            </button>
          </div>
        </form>

        <div className="repository-preview">
          <h3>Preview</h3>
          <div className="preview-card">
            {formData.repository_url ? (
              <>
                <div className="preview-header">
                  <span className="preview-icon">📂</span>
                  <span className="preview-name">{extractRepoName(formData.repository_url)}</span>
                </div>
                <div className="preview-details">
                  <div className="preview-detail">
                    <strong>Full Name:</strong> {extractFullName(formData.repository_url)}
                  </div>
                  <div className="preview-detail">
                    <strong>Provider:</strong> {providers.find(p => p.id === formData.provider_id)?.name || "Not selected"}
                  </div>
                  <div className="preview-detail">
                    <strong>Repository URL:</strong> {formData.repository_url}
                  </div>
                  <div className="preview-detail">
                    <strong>Web URL:</strong> {convertToWebUrl(formData.repository_url)}
                  </div>
                </div>
              </>
            ) : (
              <div className="preview-empty">
                <span className="preview-icon">📂</span>
                <span className="preview-text">Enter repository URL to see preview</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRepository;