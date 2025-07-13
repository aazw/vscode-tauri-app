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

-- 複合インデックス
CREATE INDEX idx_issues_repo_state ON issues(repository_id, state_id);
CREATE INDEX idx_pr_repo_state ON pull_requests(repository_id, state_id);
CREATE INDEX idx_issues_assigned_to_me ON issues(assigned_to_me) WHERE assigned_to_me = TRUE;
CREATE INDEX idx_pr_assigned_to_me ON pull_requests(assigned_to_me) WHERE assigned_to_me = TRUE;