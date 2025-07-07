import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div className="flex flex-col h-full p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Add New Provider</h1>
      </div>

      <div className="flex-1">
        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                Base URL
              </label>
              <input
                type="url"
                id="base_url"
                name="base_url"
                value={formData.base_url}
                onChange={handleInputChange}
                placeholder="https://api.github.com"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                For GitHub Enterprise: https://your-domain.com/api/v3<br/>
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

            <div className="flex justify-between pt-4 border-t border-gray-200">
              <button 
                type="button" 
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                onClick={() => navigate("/providers")}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !formData.name || !formData.base_url}
              >
                {loading ? "Creating..." : "Create Provider"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProvider;