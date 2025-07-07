import { useState, useEffect } from "react";

const Settings = () => {
  const [syncInterval, setSyncInterval] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedInterval = localStorage.getItem('syncInterval');
    if (savedInterval) {
      setSyncInterval(parseInt(savedInterval));
    }
  }, []);

  const handleSave = () => {
    setLoading(true);
    localStorage.setItem('syncInterval', syncInterval.toString());
    
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= 60) {
      setSyncInterval(value);
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your application preferences</p>
      </div>

      {/* Settings Content */}
      <div className="flex-1">
        <div className="bg-white border-t border-b border-gray-300 max-w-2xl">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Synchronization</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="sync-interval" className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Interval (minutes)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="sync-interval"
                    type="number"
                    min="1"
                    max="60"
                    value={syncInterval}
                    onChange={handleIntervalChange}
                    className="block w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-sm text-gray-500">min</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  How often to sync data from your Git providers
                </p>
              </div>
            </div>
            
            <div className="flex justify-between pt-6 border-t border-gray-300 mt-6">
              <div></div>
              <button 
                onClick={handleSave}
                disabled={loading}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  saved 
                    ? 'bg-green-600 text-white' 
                    : loading 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
              >
                {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;