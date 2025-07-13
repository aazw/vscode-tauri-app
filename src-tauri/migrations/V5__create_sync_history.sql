-- Sync History table for tracking sync execution history

CREATE TABLE sync_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Sync details
    sync_type TEXT NOT NULL, -- 'provider', 'all_providers', 'repository'
    target_id INTEGER, -- provider_id or repository_id (null for all_providers)
    target_name TEXT NOT NULL, -- provider name, repository name, or 'All Providers'
    
    -- Sync status
    status TEXT NOT NULL, -- 'started', 'completed', 'failed'
    error_message TEXT,
    
    -- Sync metrics
    items_synced INTEGER DEFAULT 0,
    repositories_synced INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_seconds INTEGER -- calculated duration
);

-- Create indexes for sync history
CREATE INDEX idx_sync_history_status ON sync_history(status);
CREATE INDEX idx_sync_history_sync_type ON sync_history(sync_type);
CREATE INDEX idx_sync_history_started_at ON sync_history(started_at);
CREATE INDEX idx_sync_history_target_id ON sync_history(target_id);