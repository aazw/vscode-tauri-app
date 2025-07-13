-- Git Portal Database Schema

-- Lookup Tables (Enum Tables)
CREATE TABLE provider_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE sync_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE issue_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE pr_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE workflow_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE workflow_conclusions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT
);

-- Initial data for lookup tables (with explicit IDs for idempotency)
INSERT INTO provider_types (id, code, name, description) VALUES
    (1, 'github', 'GitHub', 'GitHub provider'),
    (2, 'gitlab', 'GitLab', 'GitLab provider'),
    (3, 'bitbucket', 'Bitbucket', 'Bitbucket provider');

INSERT INTO sync_statuses (id, code, name, description) VALUES
    (1, 'success', 'Success', 'Sync completed successfully'),
    (2, 'failure', 'Failure', 'Sync failed'),
    (3, 'in_progress', 'In Progress', 'Sync is currently running');

INSERT INTO issue_states (id, code, name, description) VALUES
    (1, 'open', 'Open', 'Issue is open'),
    (2, 'closed', 'Closed', 'Issue is closed');

INSERT INTO pr_states (id, code, name, description) VALUES
    (1, 'open', 'Open', 'Pull request is open'),
    (2, 'closed', 'Closed', 'Pull request is closed'),
    (3, 'merged', 'Merged', 'Pull request is merged');

INSERT INTO workflow_statuses (id, code, name, description) VALUES
    (1, 'success', 'Success', 'Workflow completed successfully'),
    (2, 'failure', 'Failure', 'Workflow failed'),
    (3, 'in_progress', 'In Progress', 'Workflow is running'),
    (4, 'cancelled', 'Cancelled', 'Workflow was cancelled');

INSERT INTO workflow_conclusions (id, code, name, description) VALUES
    (1, 'success', 'Success', 'All jobs completed successfully'),
    (2, 'failure', 'Failure', 'One or more jobs failed'),
    (3, 'cancelled', 'Cancelled', 'Workflow was cancelled'),
    (4, 'skipped', 'Skipped', 'Workflow was skipped'),
    (5, 'timed_out', 'Timed Out', 'Workflow exceeded time limit'),
    (6, 'action_required', 'Action Required', 'Manual action is required'),
    (7, 'neutral', 'Neutral', 'Neutral result');

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
    
    -- Resource-specific sync timestamps
    last_issues_sync TIMESTAMP,
    last_pull_requests_sync TIMESTAMP,
    last_workflows_sync TIMESTAMP,
    
    -- Resource-specific sync status
    last_issues_sync_status_id INTEGER,
    last_pull_requests_sync_status_id INTEGER,
    last_workflows_sync_status_id INTEGER,

    FOREIGN KEY (provider_type_id) REFERENCES provider_types(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (last_issues_sync_status_id) REFERENCES sync_statuses(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (last_pull_requests_sync_status_id) REFERENCES sync_statuses(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (last_workflows_sync_status_id) REFERENCES sync_statuses(id) ON DELETE SET NULL ON UPDATE CASCADE
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

    FOREIGN KEY (provider_id) REFERENCES git_providers(id) ON DELETE CASCADE ON UPDATE CASCADE,
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

-- インデックス作成
CREATE INDEX idx_repositories_provider_id ON repositories(provider_id);
CREATE INDEX idx_git_providers_provider_type_id ON git_providers(provider_type_id);
CREATE INDEX idx_git_providers_last_sync_status_id ON git_providers(last_sync_status_id);
CREATE INDEX idx_issues_state_id ON issues(state_id);
CREATE INDEX idx_issues_repository_id ON issues(repository_id);
CREATE INDEX idx_pull_requests_state_id ON pull_requests(state_id);
CREATE INDEX idx_pull_requests_repository_id ON pull_requests(repository_id);
CREATE INDEX idx_workflow_runs_status_id ON workflow_runs(status_id);
CREATE INDEX idx_workflow_runs_conclusion_id ON workflow_runs(conclusion_id);
CREATE INDEX idx_workflow_runs_repository_id ON workflow_runs(repository_id);

-- 複合インデックス
CREATE INDEX idx_issues_repo_state ON issues(repository_id, state_id);
CREATE INDEX idx_pr_repo_state ON pull_requests(repository_id, state_id);
CREATE INDEX idx_issues_assigned_to_me ON issues(assigned_to_me) WHERE assigned_to_me = TRUE;
CREATE INDEX idx_pr_assigned_to_me ON pull_requests(assigned_to_me) WHERE assigned_to_me = TRUE;