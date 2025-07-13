-- Git Portal Database - Seed Default Providers

-- プロバイダーデータ (lookup table使用)
INSERT INTO git_providers (id, name, provider_type_id, base_url, token, token_valid, created_at, updated_at) VALUES
(1, 'GitHub.com', 1, 'https://api.github.com', NULL, FALSE, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
(2, 'GitLab.com', 2, 'https://gitlab.com/api/v4', NULL, FALSE, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z');