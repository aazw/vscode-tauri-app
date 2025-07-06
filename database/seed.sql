-- Git Portal Database Seed Data

-- プロバイダーデータ
INSERT INTO git_providers (id, name, provider_type, base_url, token, created_at, updated_at) VALUES
('github-com', 'GitHub.com', 'github', 'https://api.github.com', NULL, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
('gitlab-com', 'GitLab.com', 'gitlab', 'https://gitlab.com/api/v4', 'glpat_xxxxxxxxxxxxxxxx', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
('github-enterprise', 'GitHub Enterprise', 'github', 'https://github.mycompany.com/api/v3', 'ghp_xxxxxxxxxxxxxxxxxxxx', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z');

-- リポジトリデータ
INSERT INTO repositories (id, name, full_name, description, provider_id, provider_name, provider_type, clone_url, ssh_url, web_url, is_private, is_fork, is_archived, default_branch, language, stars_count, forks_count, issues_count, last_activity, created_at, updated_at) VALUES
('repo-1', 'frontend-app', 'company/frontend-app', 'Main frontend application', 'github-com', 'GitHub.com', 'github', 'https://github.com/company/frontend-app.git', 'git@github.com:company/frontend-app.git', 'https://github.com/company/frontend-app', 0, 0, 0, 'main', 'TypeScript', 125, 23, 8, '2024-01-15T16:30:00Z', '2023-06-15T10:00:00Z', '2024-01-15T16:30:00Z'),
('repo-2', 'backend-api', 'company/backend-api', 'REST API backend service', 'github-com', 'GitHub.com', 'github', 'https://github.com/company/backend-api.git', 'git@github.com:company/backend-api.git', 'https://github.com/company/backend-api', 1, 0, 0, 'main', 'Python', 87, 12, 3, '2024-01-15T14:20:00Z', '2023-08-20T14:30:00Z', '2024-01-15T14:20:00Z'),
('repo-3', 'design-system', 'company/design-system', 'Shared design system and components', 'gitlab-com', 'GitLab.com', 'gitlab', 'https://gitlab.com/company/design-system.git', 'git@gitlab.com:company/design-system.git', 'https://gitlab.com/company/design-system', 0, 0, 0, 'main', 'CSS', 45, 8, 2, '2024-01-14T09:45:00Z', '2023-09-10T11:20:00Z', '2024-01-14T09:45:00Z'),
('repo-4', 'mobile-app', 'company/mobile-app', 'Mobile application for iOS and Android', 'github-enterprise', 'GitHub Enterprise', 'github', 'https://github.mycompany.com/company/mobile-app.git', 'git@github.mycompany.com:company/mobile-app.git', 'https://github.mycompany.com/company/mobile-app', 1, 0, 0, 'develop', 'Swift', 67, 15, 12, '2024-01-15T11:15:00Z', '2023-07-05T16:45:00Z', '2024-01-15T11:15:00Z'),
('repo-5', 'legacy-system', 'company/legacy-system', 'Legacy system (archived)', 'github-com', 'GitHub.com', 'github', 'https://github.com/company/legacy-system.git', 'git@github.com:company/legacy-system.git', 'https://github.com/company/legacy-system', 1, 0, 1, 'master', 'Java', 12, 3, 0, '2023-12-01T10:00:00Z', '2022-03-15T08:30:00Z', '2023-12-01T10:00:00Z');

-- イシューデータ
INSERT INTO issues (id, title, number, repository, provider, assignee, author, state, labels, created_at, updated_at, url) VALUES
('issue-1', 'Fix authentication bug in login form', 123, 'frontend-app', 'GitHub.com', 'john-doe', 'jane-smith', 'open', '["bug", "high-priority"]', '2024-01-15T10:30:00Z', '2024-01-15T14:20:00Z', 'https://github.com/company/frontend-app/issues/123'),
('issue-2', 'Add dark mode support to the application', 124, 'frontend-app', 'GitHub.com', NULL, 'bob-wilson', 'open', '["enhancement", "ui"]', '2024-01-14T16:45:00Z', '2024-01-14T16:45:00Z', 'https://github.com/company/frontend-app/issues/124'),
('issue-3', 'API endpoint returns 500 error for large datasets', 67, 'backend-api', 'GitHub.com', 'john-doe', 'alice-brown', 'open', '["bug", "performance"]', '2024-01-13T09:20:00Z', '2024-01-15T08:30:00Z', 'https://github.com/company/backend-api/issues/67'),
('issue-4', 'Update color palette in design tokens', 45, 'design-system', 'GitLab.com', NULL, 'jane-smith', 'closed', '["design", "low-priority"]', '2024-01-10T14:15:00Z', '2024-01-12T11:30:00Z', 'https://gitlab.com/company/design-system/-/issues/45');

-- プルリクエストデータ
INSERT INTO pull_requests (id, title, number, repository, provider, assignee, author, state, draft, created_at, updated_at, url) VALUES
('pr-1', 'Implement user profile page', 56, 'frontend-app', 'GitHub.com', 'john-doe', 'jane-smith', 'open', 0, '2024-01-15T08:20:00Z', '2024-01-15T12:10:00Z', 'https://github.com/company/frontend-app/pull/56'),
('pr-2', 'Add input validation for user registration', 57, 'frontend-app', 'GitHub.com', NULL, 'bob-wilson', 'open', 1, '2024-01-14T18:30:00Z', '2024-01-14T18:30:00Z', 'https://github.com/company/frontend-app/pull/57'),
('pr-3', 'Optimize database queries for better performance', 34, 'backend-api', 'GitHub.com', 'john-doe', 'alice-brown', 'merged', 0, '2024-01-12T11:45:00Z', '2024-01-13T14:20:00Z', 'https://github.com/company/backend-api/pull/34'),
('pr-4', 'Update button component styles', 23, 'design-system', 'GitLab.com', NULL, 'jane-smith', 'closed', 0, '2024-01-11T15:10:00Z', '2024-01-12T09:25:00Z', 'https://gitlab.com/company/design-system/-/merge_requests/23');

-- ワークフローデータ
INSERT INTO workflow_runs (id, name, repository, provider, status, conclusion, branch, commit_sha, commit_message, author, created_at, updated_at, url) VALUES
('workflow-1', 'CI/CD Pipeline', 'frontend-app', 'GitHub.com', 'success', 'success', 'main', 'abc123ef', 'Fix: resolve authentication bug', 'jane-smith', '2024-01-15T15:30:00Z', '2024-01-15T15:45:00Z', 'https://github.com/company/frontend-app/actions/runs/123456'),
('workflow-2', 'Build and Test', 'backend-api', 'GitHub.com', 'failure', 'failure', 'feature/optimization', 'def456gh', 'Feat: add new API endpoint', 'alice-brown', '2024-01-15T14:10:00Z', '2024-01-15T14:25:00Z', 'https://github.com/company/backend-api/actions/runs/123457'),
('workflow-3', 'Deploy to Staging', 'frontend-app', 'GitHub.com', 'in_progress', NULL, 'develop', 'ghi789jk', 'Update: improve user interface', 'bob-wilson', '2024-01-15T16:00:00Z', '2024-01-15T16:00:00Z', 'https://github.com/company/frontend-app/actions/runs/123458'),
('workflow-4', 'Lint and Format', 'design-system', 'GitLab.com', 'success', 'success', 'main', 'jkl012mn', 'Style: update color variables', 'jane-smith', '2024-01-14T10:20:00Z', '2024-01-14T10:35:00Z', 'https://gitlab.com/company/design-system/-/pipelines/789123'),
('workflow-5', 'Security Scan', 'mobile-app', 'GitHub Enterprise', 'cancelled', 'cancelled', 'develop', 'mno345pq', 'Fix: address security vulnerabilities', 'john-doe', '2024-01-15T09:15:00Z', '2024-01-15T09:20:00Z', 'https://github.mycompany.com/company/mobile-app/actions/runs/456789');