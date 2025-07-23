import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBackend } from "../backends/BackendProvider";

const AddProvider = () => {
  const navigate = useNavigate();
  const backend = useBackend();
  const [formData, setFormData] = useState({
    name: "",
    provider_type: "github",
    base_url: "",
    api_base_url: "",
    token: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!formData.api_base_url.trim()) {
      setError("API Base URL is required");
      setLoading(false);
      return;
    }

    try {
      // Check if this is a standard provider (github.com/gitlab.com) or self-hosted
      const isStandardProvider = 
        (formData.provider_type === "github" && formData.base_url === "https://api.github.com") ||
        (formData.provider_type === "gitlab" && formData.base_url === "https://gitlab.com/api/v4");

      const providerId = await backend.addProvider({
        name: formData.name,
        provider_type: formData.provider_type,
        base_url: formData.base_url,
        api_base_url: formData.api_base_url,
        token: formData.token || null,
      });

      console.log(isStandardProvider ? "Updated/created standard provider with ID:" : "Created new self-hosted provider with ID:", providerId);
      navigate("/providers");
    } catch (err) {
      console.error("Failed to create/update provider:", err);
      setError(err instanceof Error ? err.message : "Failed to create/update provider");
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

    // Auto-populate base URL and api_base_url based on provider type
    if (name === "provider_type") {
      const baseUrls: { [key: string]: string } = {
        github: "https://github.com",
        gitlab: "https://gitlab.com",
      };
      const apiBaseUrls: { [key: string]: string } = {
        github: "https://api.github.com",
        gitlab: "https://gitlab.com/api/v4",
      };
      setFormData(prev => ({
        ...prev,
        base_url: baseUrls[value] || "",
        api_base_url: apiBaseUrls[value] || ""
      }));
    }
  };


  return (
    <div className="flex flex-col h-full p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Add New Provider</h1>
            <p className="text-gray-600 mt-1">Add a new Git provider to your dashboard</p>
          </div>
          <div className="flex gap-3">
            <button 
              type="button" 
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onClick={() => navigate("/providers")}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              form="add-provider-form"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !formData.name || !formData.base_url || !formData.api_base_url}
            >
              {loading ? "Processing..." : "Add Provider"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm max-w-2xl m-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white border-t border-b border-gray-300 m-6">
          <form id="add-provider-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label htmlFor="provider_type" className="block text-sm font-medium text-gray-700 mb-2">
                Provider Type
              </label>
              <select
                id="provider_type"
                name="provider_type"
                value={formData.provider_type}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="github">🐙 GitHub</option>
                <option value="gitlab">🦊 GitLab</option>
              </select>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., GitHub Enterprise, GitLab Self-hosted"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="base_url" className="block text-sm font-medium text-gray-700 mb-2">
                Base URL (Web Access)
              </label>
              <input
                type="url"
                id="base_url"
                name="base_url"
                value={formData.base_url}
                onChange={handleInputChange}
                placeholder="https://github.com"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                For GitHub Enterprise: https://your-domain.com<br/>
                For GitLab self-hosted: https://your-domain.com
              </p>
            </div>

            <div>
              <label htmlFor="api_base_url" className="block text-sm font-medium text-gray-700 mb-2">
                API Base URL
              </label>
              <input
                type="url"
                id="api_base_url"
                name="api_base_url"
                value={formData.api_base_url}
                onChange={handleInputChange}
                placeholder="https://api.github.com"
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-2 text-xs text-gray-500">
                For GitHub: https://api.github.com<br/>
                For GitHub Enterprise: https://your-domain.com/api/v3<br/>
                For GitLab: https://gitlab.com/api/v4<br/>
                For GitLab self-hosted: https://your-domain.com/api/v4
              </p>
            </div>

            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                Access Token (Optional)
              </label>
              <input
                type="password"
                id="token"
                name="token"
                value={formData.token}
                onChange={handleInputChange}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or glpat_xxxxxxxxxxxxxxxx"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-2 text-xs text-gray-500">
                You can add this later. Required for private repositories and higher API limits.
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProvider;