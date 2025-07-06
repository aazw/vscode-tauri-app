import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddProvider.css";

interface GitProvider {
  id: string;
  name: string;
  provider_type: string;
  base_url: string;
  token: string | null;
  created_at: string;
  updated_at: string;
}

const AddProvider = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    provider_type: "github",
    base_url: "",
    token: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock API call
    setTimeout(() => {
      const newProvider: GitProvider = {
        id: `${formData.provider_type}-${Date.now()}`,
        name: formData.name,
        provider_type: formData.provider_type,
        base_url: formData.base_url,
        token: formData.token || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("Created new provider:", newProvider);
      setLoading(false);
      navigate("/providers");
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-populate base URL based on provider type
    if (name === "provider_type") {
      const baseUrls: { [key: string]: string } = {
        github: "https://api.github.com",
        gitlab: "https://gitlab.com/api/v4",
      };
      setFormData(prev => ({
        ...prev,
        base_url: baseUrls[value] || ""
      }));
    }
  };

  const getProviderIcon = (type: string) => {
    return type === "github" ? "🐙" : "🦊";
  };

  return (
    <div className="add-provider-page">
      <div className="add-provider-header">
        <button 
          className="back-button"
          onClick={() => navigate("/providers")}
        >
          ← Back to Providers
        </button>
        <h1>Add New Provider</h1>
      </div>

      <div className="add-provider-form-container">
        <form onSubmit={handleSubmit} className="add-provider-form">
          <div className="form-group">
            <label htmlFor="provider_type">Provider Type</label>
            <select
              id="provider_type"
              name="provider_type"
              value={formData.provider_type}
              onChange={handleInputChange}
              className="form-input"
              required
            >
              <option value="github">🐙 GitHub</option>
              <option value="gitlab">🦊 GitLab</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="name">Display Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., GitHub Enterprise, GitLab Self-hosted"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="base_url">Base URL</label>
            <input
              type="url"
              id="base_url"
              name="base_url"
              value={formData.base_url}
              onChange={handleInputChange}
              placeholder="https://api.github.com"
              className="form-input"
              required
            />
            <small className="form-help">
              For GitHub Enterprise: https://your-domain.com/api/v3<br/>
              For GitLab self-hosted: https://your-domain.com/api/v4
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="token">Access Token (Optional)</label>
            <input
              type="password"
              id="token"
              name="token"
              value={formData.token}
              onChange={handleInputChange}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or glpat_xxxxxxxxxxxxxxxx"
              className="form-input"
            />
            <small className="form-help">
              You can add this later. Required for private repositories and higher API limits.
            </small>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => navigate("/providers")}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading || !formData.name || !formData.base_url}
            >
              {loading ? "Creating..." : "Create Provider"}
            </button>
          </div>
        </form>

        <div className="provider-preview">
          <h3>Preview</h3>
          <div className="preview-card">
            <div className="preview-header">
              <span className="preview-icon">{getProviderIcon(formData.provider_type)}</span>
              <span className="preview-name">{formData.name || "New Provider"}</span>
            </div>
            <div className="preview-details">
              <div className="preview-detail">
                <strong>Type:</strong> {formData.provider_type}
              </div>
              <div className="preview-detail">
                <strong>URL:</strong> {formData.base_url || "Not set"}
              </div>
              <div className="preview-detail">
                <strong>Token:</strong> {formData.token ? "Set" : "Not set"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProvider;