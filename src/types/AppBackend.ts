export interface GitProvider {
  id: string;
  name: string;
  provider_type: string;
  base_url: string;
  token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Repository {
  id: string;
  provider_id: string;
  name: string;
  full_name: string;
  clone_url: string;
  ssh_url: string;
  web_url: string;
  description: string | null;
  provider_name: string;
  provider_type: string;
  is_private: boolean;
  is_fork: boolean;
  is_archived: boolean;
  default_branch: string;
  language: string | null;
  stars_count: number;
  forks_count: number;
  issues_count: number;
  last_activity: string | null;
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: string;
  repository_id: string;
  number: number;
  title: string;
  body: string | null;
  repository: string;
  provider: string;
  assignee: string | null;
  author: string;
  state: 'open' | 'closed';
  labels: string[];
  url: string;
  created_at: string;
  updated_at: string;
}

export interface PullRequest {
  id: string;
  repository_id: string;
  number: number;
  title: string;
  body: string | null;
  repository: string;
  provider: string;
  assignee: string | null;
  author: string;
  state: 'open' | 'closed' | 'merged';
  draft: boolean;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRun {
  id: string;
  repository_id: string;
  name: string;
  repository: string;
  provider: string;
  status: 'success' | 'failure' | 'in_progress' | 'cancelled';
  conclusion: string | null;
  branch: string;
  commit_sha: string;
  commit_message: string;
  author: string;
  url: string;
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
  token: string | null;
}

export interface CreateRepositoryRequest {
  provider_id: string;
  repository_url: string;
}

export interface AppBackend {
  // Provider operations
  getProviders(): Promise<GitProvider[]>;
  getProvider(providerId: string): Promise<GitProvider>;
  addProvider(provider: CreateProviderRequest): Promise<string>;
  updateProviderToken(providerId: string, token: string | null): Promise<void>;
  deleteProvider(providerId: string): Promise<void>;

  // Repository operations
  getRepositories(providerId?: string): Promise<Repository[]>;
  getRepository(repositoryId: string): Promise<Repository>;
  addRepository(repository: CreateRepositoryRequest): Promise<string>;
  deleteRepository(repositoryId: string): Promise<void>;

  // Issue operations
  getIssues(filters?: IssueFilters, pagination?: PaginationParams): Promise<PaginatedResponse<Issue>>;
  getIssue(issueId: string): Promise<Issue>;
  getIssueStats(filters?: IssueFilters): Promise<IssueStats>;

  // Pull Request operations
  getPullRequests(filters?: PullRequestFilters, pagination?: PaginationParams): Promise<PaginatedResponse<PullRequest>>;
  getPullRequest(prId: string): Promise<PullRequest>;
  getPullRequestStats(filters?: PullRequestFilters): Promise<PullRequestStats>;

  // Workflow operations
  getWorkflows(filters?: WorkflowFilters, pagination?: PaginationParams): Promise<PaginatedResponse<WorkflowRun>>;
  getWorkflow(workflowId: string): Promise<WorkflowRun>;
  getWorkflowStats(filters?: WorkflowFilters): Promise<WorkflowStats>;

  // Sync operations
  syncProvider(providerId: string): Promise<void>;
  syncAllProviders(): Promise<void>;
  syncRepository(repositoryId: string): Promise<void>;
}