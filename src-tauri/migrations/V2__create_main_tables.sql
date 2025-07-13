-- Git Portal Database Schema - Main Tables

-- プロバイダーテーブル
CREATE TABLE git_providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    name TEXT NOT NULL,
    provider_type_id INTEGER NOT NULL,
    base_url TEXT NOT NULL,
    token TEXT,
    token_valid BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (provider_type_id) REFERENCES provider_types(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- リポジトリテーブル
CREATE TABLE repositories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    provider_id INTEGER NOT NULL,

    api_id TEXT NOT NULL,
    api_created_at TIMESTAMP,
    api_updated_at TIMESTAMP,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    description TEXT,
    web_url TEXT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    language TEXT,
    last_activity TIMESTAMP,
    
    -- Resource-specific sync timestamps
    last_issues_sync TIMESTAMP,
    last_pull_requests_sync TIMESTAMP,
    last_workflows_sync TIMESTAMP,
    
    -- Resource-specific sync status
    last_issues_sync_status_id INTEGER,
    last_pull_requests_sync_status_id INTEGER,
    last_workflows_sync_status_id INTEGER,

    FOREIGN KEY (provider_id) REFERENCES git_providers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (last_issues_sync_status_id) REFERENCES sync_statuses(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (last_pull_requests_sync_status_id) REFERENCES sync_statuses(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (last_workflows_sync_status_id) REFERENCES sync_statuses(id) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE(provider_id, api_id)
);

-- イシューテーブル
CREATE TABLE issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    repository_id INTEGER NOT NULL,
    state_id INTEGER NOT NULL,

    api_id TEXT NOT NULL,
    api_created_at TIMESTAMP,
    api_updated_at TIMESTAMP,
    
    title TEXT NOT NULL,
    number INTEGER NOT NULL,
    author TEXT NOT NULL,
    assigned_to_me BOOLEAN NOT NULL DEFAULT FALSE,
    labels TEXT NOT NULL, -- JSON配列として保存
    closed_at TIMESTAMP,
    url TEXT NOT NULL,
    
    FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (state_id) REFERENCES issue_states(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE(repository_id, number)
);

-- プルリクエストテーブル
CREATE TABLE pull_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    repository_id INTEGER NOT NULL,
    state_id INTEGER NOT NULL,

    api_id TEXT NOT NULL,
    api_created_at TIMESTAMP,
    api_updated_at TIMESTAMP,
    title TEXT NOT NULL,
    number INTEGER NOT NULL,
    author TEXT NOT NULL,
    assigned_to_me BOOLEAN NOT NULL DEFAULT FALSE,
    draft BOOLEAN NOT NULL DEFAULT FALSE,
    merged_at TIMESTAMP,
    closed_at TIMESTAMP,
    url TEXT NOT NULL,
    
    FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (state_id) REFERENCES pr_states(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE(repository_id, number)
);

-- ワークフローテーブル
CREATE TABLE workflow_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    repository_id INTEGER NOT NULL,
    status_id INTEGER NOT NULL,
    conclusion_id INTEGER,
    
    api_id TEXT NOT NULL,
    api_created_at TIMESTAMP,
    api_updated_at TIMESTAMP,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    
    FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (status_id) REFERENCES workflow_statuses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (conclusion_id) REFERENCES workflow_conclusions(id) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE(repository_id, api_id)
);