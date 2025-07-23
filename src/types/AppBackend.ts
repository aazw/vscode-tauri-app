export interface GitProvider {
  id: number;
  name: string;
  provider_type: string;
  base_url: string;
  api_base_url: string;
  token: string | null;
  token_valid: boolean;
  is_initialized: boolean;
  created_at: string;
  updated_at: string;
}

export interface Repository {
  id: number;
  api_id: string;
  name: string;
  full_name: string;
  web_url: string;
  api_base_url: string;
  description: string | null;
  provider_id: number;
  provider_name: string;
  provider_type: string;
  is_private: boolean;
  language: string | null;
  last_activity: string | null;
  api_created_at: string | null;
  api_updated_at: string | null;
  
  // Resource-specific sync timestamps (only updated on success)
  last_issues_sync_success: string | null;
  last_pull_requests_sync_success: string | null;
  last_workflows_sync_success: string | null;
  
  // Resource-specific sync status (success/failure only, no in_progress)
  last_issues_sync_status: 'success' | 'failure' | null;
  last_pull_requests_sync_status: 'success' | 'failure' | null;
  last_workflows_sync_status: 'success' | 'failure' | null;
  
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: number;
  api_id: string;
  repository_id: number;
  number: number;
  title: string;
  repository: string;
  provider: string;
  assigned_to_me: boolean;
  author: string;
  state: 'open' | 'closed';
  labels: string[];
  url: string;
  closed_at: string | null;
  api_created_at: string | null;
  api_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PullRequest {
  id: number;
  api_id: string;
  repository_id: number;
  number: number;
  title: string;
  repository: string;
  provider: string;
  assigned_to_me: boolean;
  author: string;
  state: 'open' | 'closed' | 'merged';
  draft: boolean;
  url: string;
  merged_at: string | null;
  closed_at: string | null;
  api_created_at: string | null;
  api_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRun {
  id: number;
  api_id: string;
  repository_id: number;
  name: string;
  repository: string;
  provider: string;
  status: 'queued' | 'in_progress' | 'completed' | 'cancelled' | 'requested' | 'waiting';
  conclusion: string | null;
  url: string;
  api_created_at: string | null;
  api_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueStats {
  total: number;
  open: number;
  closed: number;
  assigned: number;
}

export interface PullRequestStats {
  total: number;
  open: number;
  merged: number;
  closed: number;
  assigned: number;
}

export interface WorkflowStats {
  total: number;
  success: number;
  failure: number;
  in_progress: number;
  cancelled: number;
}

export interface PaginationParams {
  page: number;
  per_page: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface IssueFilters {
  state?: 'open' | 'closed' | 'all';
  assigned?: 'me' | 'any';
  provider?: string;
  repository?: string;
  search?: string;
}

export interface PullRequestFilters {
  state?: 'open' | 'closed' | 'merged' | 'all';
  assigned?: 'me' | 'any';
  provider?: string;
  repository?: string;
  search?: string;
}

export interface WorkflowFilters {
  status?: 'success' | 'failure' | 'in_progress' | 'cancelled' | 'all';
  provider?: string;
  repository?: string;
  search?: string;
}

export interface CreateProviderRequest {
  name: string;
  provider_type: string;
  base_url: string;
  api_base_url: string;
  token: string | null;
}

export interface CreateRepositoryRequest {
  provider_id: number;
  web_url: string;
  api_base_url: string;
}

export interface SyncSettings {
  sync_interval_minutes: number;
  auto_sync_enabled: boolean;
}

export interface SyncHistory {
  id: number;
  sync_type: string; // 'provider', 'all_providers', 'repository'
  target_id: number | null;
  target_name: string;
  status: string; // 'started', 'completed', 'failed'
  error_message: string | null;
  items_synced: number;
  repositories_synced: number;
  errors_count: number;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface AppBackend {
  // Provider operations
  getProviders(): Promise<GitProvider[]>;
  getProvider(providerId: number): Promise<GitProvider>;
  addProvider(provider: CreateProviderRequest): Promise<number>;
  updateProviderToken(providerId: number, token: string | null): Promise<void>;
  validateProviderToken(providerId: number): Promise<boolean>;
  deleteProvider(providerId: number): Promise<void>;

  // Repository operations
  getRepositories(providerId?: number): Promise<Repository[]>;
  getRepository(repositoryId: number): Promise<Repository>;
  addRepository(repository: CreateRepositoryRequest): Promise<number>;
  deleteRepository(repositoryId: number): Promise<void>;

  // Issue operations
  getIssues(filters?: IssueFilters, pagination?: PaginationParams): Promise<PaginatedResponse<Issue>>;
  getIssue(issueId: number): Promise<Issue>;
  getIssueStats(filters?: IssueFilters): Promise<IssueStats>;

  // Pull Request operations
  getPullRequests(filters?: PullRequestFilters, pagination?: PaginationParams): Promise<PaginatedResponse<PullRequest>>;
  getPullRequest(prId: number): Promise<PullRequest>;
  getPullRequestStats(filters?: PullRequestFilters): Promise<PullRequestStats>;

  // Workflow operations
  getWorkflows(filters?: WorkflowFilters, pagination?: PaginationParams): Promise<PaginatedResponse<WorkflowRun>>;
  getWorkflow(workflowId: number): Promise<WorkflowRun>;
  getWorkflowStats(filters?: WorkflowFilters): Promise<WorkflowStats>;

  // Sync operations
  syncProvider(providerId: number): Promise<void>;
  syncAllProviders(): Promise<void>;
  syncRepository(repositoryId: number): Promise<void>;
  isSyncInProgress(): Promise<boolean>;
  getSyncStatus(): Promise<boolean>;
  resetSyncLock(): Promise<void>;
  
  // Settings operations
  getSyncSettings(): Promise<SyncSettings>;
  updateSyncSettings(settings: SyncSettings): Promise<void>;
  
  // History operations
  getSyncHistory(limit?: number): Promise<SyncHistory[]>;
  
  // External operations
  openExternalUrl(url: string): Promise<void>;
}