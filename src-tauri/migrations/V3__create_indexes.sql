-- Git Portal Database Schema - Indexes

-- インデックス作成
CREATE INDEX idx_repositories_provider_id ON repositories(provider_id);
CREATE INDEX idx_git_providers_provider_type_id ON git_providers(provider_type_id);
CREATE INDEX idx_repositories_last_issues_sync_status_id ON repositories(last_issues_sync_status_id);
CREATE INDEX idx_repositories_last_pull_requests_sync_status_id ON repositories(last_pull_requests_sync_status_id);
CREATE INDEX idx_repositories_last_workflows_sync_status_id ON repositories(last_workflows_sync_status_id);
CREATE INDEX idx_issues_state_id ON issues(state_id);
CREATE INDEX idx_issues_repository_id ON issues(repository_id);
CREATE INDEX idx_pull_requests_state_id ON pull_requests(state_id);
CREATE INDEX idx_pull_requests_repository_id ON pull_requests(repository_id);
CREATE INDEX idx_workflow_runs_status_id ON workflow_runs(status_id);
CREATE INDEX idx_workflow_runs_conclusion_id ON workflow_runs(conclusion_id);
CREATE INDEX idx_workflow_runs_repository_id ON workflow_runs(repository_id);
CREATE INDEX idx_sync_history_status ON sync_history(status);
CREATE INDEX idx_sync_history_sync_type ON sync_history(sync_type);
CREATE INDEX idx_sync_history_started_at ON sync_history(started_at);
CREATE INDEX idx_sync_history_target_id ON sync_history(target_id);

-- 複合インデックス
CREATE INDEX idx_issues_repo_state ON issues(repository_id, state_id);
CREATE INDEX idx_pr_repo_state ON pull_requests(repository_id, state_id);
CREATE INDEX idx_issues_assigned_to_me ON issues(assigned_to_me) WHERE assigned_to_me = TRUE;
CREATE INDEX idx_pr_assigned_to_me ON pull_requests(assigned_to_me) WHERE assigned_to_me = TRUE;

-- よく使用されるフィルター組み合わせ用の複合インデックス (SQLite対応)
CREATE INDEX idx_issues_state_repo ON issues(state_id, repository_id, assigned_to_me);
CREATE INDEX idx_issues_assigned_state ON issues(assigned_to_me, state_id) WHERE assigned_to_me = TRUE;
CREATE INDEX idx_issues_author_state ON issues(author, state_id);
CREATE INDEX idx_issues_search_title ON issues(title);
CREATE INDEX idx_issues_search_author ON issues(author);

-- Pull Requests用の同様のインデックス  
CREATE INDEX idx_pr_state_repo ON pull_requests(state_id, repository_id, assigned_to_me);
CREATE INDEX idx_pr_assigned_state ON pull_requests(assigned_to_me, state_id) WHERE assigned_to_me = TRUE;
CREATE INDEX idx_pr_author_state ON pull_requests(author, state_id);
CREATE INDEX idx_pr_search_title ON pull_requests(title);
CREATE INDEX idx_pr_search_author ON pull_requests(author);
CREATE INDEX idx_pr_draft ON pull_requests(draft, state_id);

-- Workflows用のインデックス
CREATE INDEX idx_workflows_status_repo ON workflow_runs(status_id, repository_id);
CREATE INDEX idx_workflows_conclusion_repo ON workflow_runs(conclusion_id, repository_id) WHERE conclusion_id IS NOT NULL;
CREATE INDEX idx_workflows_search_name ON workflow_runs(name);
