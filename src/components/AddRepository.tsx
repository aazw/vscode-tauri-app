import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBackend } from "../backends/BackendProvider";
import { GitProvider } from "../types/AppBackend";


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
    console.log('🚀 Add Repository button clicked');
    console.log('Form data:', formData);
    console.log('Is form valid:', isFormValid);
    
    setLoading(true);

    try {
      
      const newRepository = {
        provider_id: parseInt(formData.provider_id),
        web_url: convertToWebUrl(formData.repository_url),
      };
      
      console.log('📤 Sending repository data to backend:', newRepository);
      const repositoryId = await backend.addRepository(newRepository);
      console.log("✅ Created new repository with ID:", repositoryId);
      navigate("/repositories");
    } catch (error) {
      console.error('❌ Failed to add repository:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
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
    <div className="flex flex-col h-full p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Add New Repository</h1>
        <p className="text-gray-600 mt-1">Track a repository in your dashboard</p>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Form */}
        <div className="bg-white border-t border-b border-gray-300 max-w-2xl m-6">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label htmlFor="provider_id" className="block text-sm font-medium text-gray-700 mb-2">
                Git Provider
              </label>
              <select
                id="provider_id"
                name="provider_id"
                value={formData.provider_id}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            <div>
              <label htmlFor="repository_url" className="block text-sm font-medium text-gray-700 mb-2">
                Repository URL
              </label>
              <input
                type="text"
                id="repository_url"
                name="repository_url"
                value={formData.repository_url}
                onChange={handleInputChange}
                placeholder="https://github.com/user/repo.git or git@github.com:user/repo.git"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Enter the repository URL to track it in your dashboard. No cloning will be performed.
              </p>
              {formData.repository_url && !validateUrl(formData.repository_url) && (
                <p className="mt-2 text-xs text-red-600">
                  Please enter a valid Git repository URL
                </p>
              )}
            </div>

            {/* Preview Section */}
            {formData.repository_url && validateUrl(formData.repository_url) && (
              <div className="border-t border-gray-300 pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Preview</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg">📂</span>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{extractRepoName(formData.repository_url)}</h4>
                      <p className="text-xs text-gray-500">{extractFullName(formData.repository_url)}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div><span className="font-medium">Provider:</span> {providers.find(p => p.id.toString() === formData.provider_id)?.name || "Not selected"}</div>
                    <div><span className="font-medium">Repository URL:</span> {formData.repository_url}</div>
                    <div><span className="font-medium">Web URL:</span> {convertToWebUrl(formData.repository_url)}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6 border-t border-gray-300">
              <button 
                type="button" 
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                onClick={() => navigate("/repositories")}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !isFormValid}
              >
                {loading ? "Adding..." : "Add Repository"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddRepository;