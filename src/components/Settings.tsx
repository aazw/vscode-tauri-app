import { useState, useEffect } from "react";
import { useBackend } from "../backends/BackendProvider";
import { SyncSettings } from "../types/AppBackend";

const Settings = () => {
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    sync_interval_minutes: 30,
    auto_sync_enabled: true
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const backend = useBackend();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await backend.getSyncSettings();
        setSyncSettings(settings);
      } catch (error) {
        console.error("Failed to load sync settings:", error);
      }
    };
    loadSettings();
  }, [backend]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await backend.updateSyncSettings(syncSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save sync settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= 1440) { // Max 24 hours
      setSyncSettings(prev => ({ ...prev, sync_interval_minutes: value }));
    }
  };

  const handleAutoSyncToggle = () => {
    setSyncSettings(prev => ({ ...prev, auto_sync_enabled: !prev.auto_sync_enabled }));
  };

  return (
    <div className="flex flex-col h-full p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure your application preferences</p>
        </div>
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

      {/* Settings Content */}
      <div className="flex-1">
        <div className="bg-white border-t border-b border-gray-300 w-full">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Synchronization</h3>
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={syncSettings.auto_sync_enabled}
                    onChange={handleAutoSyncToggle}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable automatic synchronization
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Automatically sync data from your Git providers at regular intervals
                </p>
              </div>
              
              {syncSettings.auto_sync_enabled && (
                <div>
                  <label htmlFor="sync-interval" className="block text-sm font-medium text-gray-700 mb-2">
                    Sync Interval (minutes)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="sync-interval"
                      type="number"
                      min="1"
                      max="1440"
                      value={syncSettings.sync_interval_minutes}
                      onChange={handleIntervalChange}
                      className="block w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-500">minutes</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    How often to sync data from your Git providers (1-1440 minutes)
                  </p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;