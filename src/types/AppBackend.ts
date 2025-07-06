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

export interface DashboardStats {
  issues: {
    total: number;
    open: number;
    closed: number;
    assigned: number;
  };
  pullRequests: {
    total: number;
    open: number;
    merged: number;
    closed: number;
    assigned: number;
  };
  workflows: {
    total: number;
    success: number;
    failure: number;
    in_progress: number;
    cancelled: number;
  };
}

export interface AppBackend {
  // Provider operations
  getProviders(): Promise<GitProvider[]>;
  addProvider(provider: Omit<GitProvider, 'id' | 'created_at' | 'updated_at'>): Promise<string>;
  updateProviderToken(providerId: string, token: string | null): Promise<void>;
  deleteProvider(providerId: string): Promise<void>;

  // Repository operations
  getRepositories(providerId?: string): Promise<Repository[]>;
  getAllRepositories(): Promise<Repository[]>;
  addRepository(repository: Omit<Repository, 'id' | 'created_at' | 'updated_at'>): Promise<string>;
  deleteRepository(repositoryId: string): Promise<void>;

  // Issue operations
  getIssues(repositoryId?: string): Promise<Issue[]>;
  getAllIssues(): Promise<Issue[]>;
  createIssue(issue: Omit<Issue, 'id' | 'created_at' | 'updated_at'>): Promise<string>;
  updateIssue(issueId: string, updates: Partial<Pick<Issue, 'title' | 'body' | 'state'>>): Promise<void>;

  // Pull Request operations
  getPullRequests(repositoryId?: string): Promise<PullRequest[]>;
  getAllPullRequests(): Promise<PullRequest[]>;
  createPullRequest(pr: Omit<PullRequest, 'id' | 'created_at' | 'updated_at'>): Promise<string>;
  updatePullRequest(prId: string, updates: Partial<Pick<PullRequest, 'title' | 'body' | 'state'>>): Promise<void>;

  // Workflow operations
  getWorkflows(repositoryId?: string): Promise<WorkflowRun[]>;
  getAllWorkflows(): Promise<WorkflowRun[]>;

  // Dashboard stats
  getDashboardStats(): Promise<DashboardStats>;
}