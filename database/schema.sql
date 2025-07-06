-- Git Portal Database Schema

-- プロバイダーテーブル
CREATE TABLE git_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL,
    base_url TEXT NOT NULL,
    token TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- リポジトリテーブル
CREATE TABLE repositories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    description TEXT,
    provider_id TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    provider_type TEXT NOT NULL,
    clone_url TEXT NOT NULL,
    ssh_url TEXT NOT NULL,
    web_url TEXT NOT NULL,
    is_private BOOLEAN NOT NULL,
    is_fork BOOLEAN NOT NULL,
    is_archived BOOLEAN NOT NULL,
    default_branch TEXT NOT NULL,
    language TEXT,
    stars_count INTEGER NOT NULL,
    forks_count INTEGER NOT NULL,
    issues_count INTEGER NOT NULL,
    last_activity TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (provider_id) REFERENCES git_providers(id)
);

-- イシューテーブル
CREATE TABLE issues (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    number INTEGER NOT NULL,
    repository TEXT NOT NULL,
    provider TEXT NOT NULL,
    assignee TEXT,
    author TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('open', 'closed')),
    labels TEXT NOT NULL, -- JSON配列として保存
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    url TEXT NOT NULL
);

-- プルリクエストテーブル
CREATE TABLE pull_requests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    number INTEGER NOT NULL,
    repository TEXT NOT NULL,
    provider TEXT NOT NULL,
    assignee TEXT,
    author TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('open', 'closed', 'merged')),
    draft BOOLEAN NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    url TEXT NOT NULL
);

-- ワークフローテーブル
CREATE TABLE workflow_runs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    repository TEXT NOT NULL,
    provider TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'in_progress', 'cancelled')),
    conclusion TEXT,
    branch TEXT NOT NULL,
    commit_sha TEXT NOT NULL,
    commit_message TEXT NOT NULL,
    author TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    url TEXT NOT NULL
);

-- インデックス作成
CREATE INDEX idx_repositories_provider_id ON repositories(provider_id);
CREATE INDEX idx_issues_state ON issues(state);
CREATE INDEX idx_issues_repository ON issues(repository);
CREATE INDEX idx_pull_requests_state ON pull_requests(state);
CREATE INDEX idx_pull_requests_repository ON pull_requests(repository);
CREATE INDEX idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX idx_workflow_runs_repository ON workflow_runs(repository);