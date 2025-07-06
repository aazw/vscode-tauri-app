import { 
  AppBackend, 
  GitProvider, 
  Repository, 
  Issue, 
  PullRequest,
  WorkflowRun,
  DashboardStats 
} from '../types/AppBackend';

export class MockBackend implements AppBackend {
  private providers: GitProvider[] = [];
  private repositories: Repository[] = [];
  private issues: Issue[] = [];
  private pullRequests: PullRequest[] = [];
  private workflows: WorkflowRun[] = [];

  constructor() {
    this.initializeWithMockData();
  }

  private initializeWithMockData() {
    const now = new Date().toISOString();
    
    // Initialize with default providers
    this.providers = [
      {
        id: "github-com",
        name: "GitHub.com",
        provider_type: "github",
        base_url: "https://api.github.com",
        token: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: "gitlab-com",
        name: "GitLab.com",
        provider_type: "gitlab",
        base_url: "https://gitlab.com/api/v4",
        token: "glpat_xxxxxxxxxxxxxxxx",
        created_at: now,
        updated_at: now,
      },
      {
        id: "github-enterprise",
        name: "GitHub Enterprise",
        provider_type: "github",
        base_url: "https://github.mycompany.com/api/v3",
        token: "ghp_xxxxxxxxxxxxxxxxxxxx",
        created_at: now,
        updated_at: now,
      }
    ];

    // Mock repositories
    this.repositories = [
      {
        id: "repo-1",
        provider_id: "github-com",
        name: "frontend-app",
        full_name: "company/frontend-app",
        clone_url: "https://github.com/company/frontend-app.git",
        ssh_url: "git@github.com:company/frontend-app.git",
        web_url: "https://github.com/company/frontend-app",
        description: "Main frontend application built with React and TypeScript",
        provider_name: "GitHub.com",
        provider_type: "github",
        is_private: true,
        is_fork: false,
        is_archived: false,
        default_branch: "main",
        language: "TypeScript",
        stars_count: 45,
        forks_count: 12,
        issues_count: 8,
        last_activity: "2024-01-15T15:30:00Z",
        created_at: "2023-06-15T10:00:00Z",
        updated_at: "2024-01-15T15:30:00Z",
      },
      {
        id: "repo-2",
        provider_id: "github-enterprise",
        name: "backend-api",
        full_name: "company/backend-api",
        clone_url: "https://github.enterprise.com/company/backend-api.git",
        ssh_url: "git@github.enterprise.com:company/backend-api.git",
        web_url: "https://github.enterprise.com/company/backend-api",
        description: "RESTful API server built with Node.js and Express",
        provider_name: "GitHub Enterprise",
        provider_type: "github",
        is_private: true,
        is_fork: false,
        is_archived: false,
        default_branch: "main",
        language: "JavaScript",
        stars_count: 23,
        forks_count: 7,
        issues_count: 15,
        last_activity: "2024-01-15T14:20:00Z",
        created_at: "2023-05-20T14:30:00Z",
        updated_at: "2024-01-15T14:20:00Z",
      },
      {
        id: "repo-3",
        provider_id: "gitlab-com",
        name: "design-system",
        full_name: "company/design-system",
        clone_url: "https://gitlab.com/company/design-system.git",
        ssh_url: "git@gitlab.com:company/design-system.git",
        web_url: "https://gitlab.com/company/design-system",
        description: "Shared component library and design tokens",
        provider_name: "GitLab.com",
        provider_type: "gitlab",
        is_private: false,
        is_fork: false,
        is_archived: false,
        default_branch: "main",
        language: "Vue",
        stars_count: 67,
        forks_count: 18,
        issues_count: 3,
        last_activity: "2024-01-15T13:45:00Z",
        created_at: "2023-04-10T09:15:00Z",
        updated_at: "2024-01-15T13:45:00Z",
      },
      {
        id: "repo-4",
        provider_id: "github-com",
        name: "mobile-app",
        full_name: "company/mobile-app",
        clone_url: "https://github.com/company/mobile-app.git",
        ssh_url: "git@github.com:company/mobile-app.git",
        web_url: "https://github.com/company/mobile-app",
        description: "React Native mobile application",
        provider_name: "GitHub.com",
        provider_type: "github",
        is_private: true,
        is_fork: false,
        is_archived: false,
        default_branch: "develop",
        language: "TypeScript",
        stars_count: 31,
        forks_count: 9,
        issues_count: 12,
        last_activity: "2024-01-14T16:10:00Z",
        created_at: "2023-08-05T11:20:00Z",
        updated_at: "2024-01-14T16:10:00Z",
      }
    ];

    // Mock issues
    this.issues = [
      {
        id: "issue-1",
        repository_id: "repo-1",
        number: 123,
        title: "Fix authentication bug in login form",
        body: "Users cannot log in with their GitHub credentials",
        repository: "frontend-app",
        provider: "GitHub.com",
        assignee: "john-doe",
        author: "jane-smith",
        state: "open",
        labels: ["bug", "high-priority"],
        url: "https://github.com/company/frontend-app/issues/123",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T14:20:00Z",
      },
      {
        id: "issue-2",
        repository_id: "repo-3",
        number: 45,
        title: "Add dark mode support",
        body: "Please add dark mode support to the design system",
        repository: "design-system",
        provider: "GitLab.com",
        assignee: null,
        author: "bob-wilson",
        state: "open",
        labels: ["enhancement", "ui"],
        url: "https://gitlab.com/company/design-system/-/issues/45",
        created_at: "2024-01-14T16:45:00Z",
        updated_at: "2024-01-14T16:45:00Z",
      },
      {
        id: "issue-3",
        repository_id: "repo-2",
        number: 87,
        title: "Update dependencies to latest versions",
        body: "Security updates needed for dependencies",
        repository: "backend-api",
        provider: "GitHub Enterprise",
        assignee: "john-doe",
        author: "alice-brown",
        state: "open",
        labels: ["maintenance"],
        url: "https://github.enterprise.com/company/backend-api/issues/87",
        created_at: "2024-01-13T09:15:00Z",
        updated_at: "2024-01-14T11:30:00Z",
      },
      {
        id: "issue-4",
        repository_id: "repo-2",
        number: 91,
        title: "Improve error handling in API",
        body: "Better error handling and logging needed",
        repository: "backend-api",
        provider: "GitHub Enterprise",
        assignee: null,
        author: "john-doe",
        state: "closed",
        labels: ["bug", "api"],
        url: "https://github.enterprise.com/company/backend-api/issues/91",
        created_at: "2024-01-12T08:00:00Z",
        updated_at: "2024-01-13T16:30:00Z",
      }
    ];

    // Mock pull requests
    this.pullRequests = [
      {
        id: "pr-1",
        repository_id: "repo-1",
        number: 56,
        title: "Implement user profile page",
        body: "This PR adds a new user profile page with settings",
        repository: "frontend-app",
        provider: "GitHub.com",
        assignee: "john-doe",
        author: "jane-smith",
        state: "open",
        draft: false,
        url: "https://github.com/company/frontend-app/pull/56",
        created_at: "2024-01-15T08:20:00Z",
        updated_at: "2024-01-15T12:10:00Z",
      },
      {
        id: "pr-2",
        repository_id: "repo-2",
        number: 78,
        title: "Add API rate limiting",
        body: "Implements rate limiting middleware for API endpoints",
        repository: "backend-api",
        provider: "GitHub Enterprise",
        assignee: null,
        author: "bob-wilson",
        state: "open",
        draft: true,
        url: "https://github.enterprise.com/company/backend-api/pull/78",
        created_at: "2024-01-14T14:30:00Z",
        updated_at: "2024-01-15T09:45:00Z",
      },
      {
        id: "pr-3",
        repository_id: "repo-3",
        number: 34,
        title: "Fix responsive layout issues",
        body: "Fixes responsive layout issues in mobile views",
        repository: "design-system",
        provider: "GitLab.com",
        assignee: "john-doe",
        author: "alice-brown",
        state: "merged",
        draft: false,
        url: "https://gitlab.com/company/design-system/-/merge_requests/34",
        created_at: "2024-01-12T11:00:00Z",
        updated_at: "2024-01-13T15:20:00Z",
      },
      {
        id: "pr-4",
        repository_id: "repo-1",
        number: 89,
        title: "Update documentation",
        body: "Updates API documentation with new endpoints",
        repository: "frontend-app",
        provider: "GitHub.com",
        assignee: null,
        author: "john-doe",
        state: "closed",
        draft: false,
        url: "https://github.com/company/frontend-app/pull/89",
        created_at: "2024-01-11T09:30:00Z",
        updated_at: "2024-01-12T14:45:00Z",
      }
    ];

    // Mock workflows
    this.workflows = [
      {
        id: "workflow-1",
        repository_id: "repo-1",
        name: "CI/CD Pipeline",
        repository: "frontend-app",
        provider: "GitHub.com",
        status: "success",
        conclusion: "success",
        branch: "main",
        commit_sha: "abc123ef",
        commit_message: "Fix: resolve authentication bug",
        author: "jane-smith",
        url: "https://github.com/company/frontend-app/actions/runs/123456",
        created_at: "2024-01-15T15:30:00Z",
        updated_at: "2024-01-15T15:45:00Z",
      },
      {
        id: "workflow-2",
        repository_id: "repo-2",
        name: "Test Suite",
        repository: "backend-api",
        provider: "GitHub Enterprise",
        status: "failure",
        conclusion: "failure",
        branch: "feature/rate-limiting",
        commit_sha: "def456gh",
        commit_message: "WIP: Add rate limiting middleware",
        author: "bob-wilson",
        url: "https://github.enterprise.com/company/backend-api/actions/runs/789012",
        created_at: "2024-01-15T14:20:00Z",
        updated_at: "2024-01-15T14:35:00Z",
      },
      {
        id: "workflow-3",
        repository_id: "repo-3",
        name: "Deploy to Staging",
        repository: "design-system",
        provider: "GitLab.com",
        status: "in_progress",
        conclusion: null,
        branch: "main",
        commit_sha: "ghi789jk",
        commit_message: "Update component library",
        author: "alice-brown",
        url: "https://gitlab.com/company/design-system/-/pipelines/345678",
        created_at: "2024-01-15T13:45:00Z",
        updated_at: "2024-01-15T13:45:00Z",
      },
      {
        id: "workflow-4",
        repository_id: "repo-2",
        name: "Security Scan",
        repository: "backend-api",
        provider: "GitHub Enterprise",
        status: "cancelled",
        conclusion: "cancelled",
        branch: "feature/security-updates",
        commit_sha: "jkl012mn",
        commit_message: "Update security dependencies",
        author: "john-doe",
        url: "https://github.enterprise.com/company/backend-api/actions/runs/456789",
        created_at: "2024-01-15T12:00:00Z",
        updated_at: "2024-01-15T12:30:00Z",
      },
      {
        id: "workflow-5",
        repository_id: "repo-4",
        name: "Build and Test",
        repository: "mobile-app",
        provider: "GitHub.com",
        status: "success",
        conclusion: "success",
        branch: "develop",
        commit_sha: "opq345rs",
        commit_message: "Add new feature for user profiles",
        author: "jane-smith",
        url: "https://github.com/company/mobile-app/actions/runs/567890",
        created_at: "2024-01-15T11:15:00Z",
        updated_at: "2024-01-15T11:45:00Z",
      }
    ];
  }

  private generateId(): string {
    return `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private delay(ms: number = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Provider operations
  async getProviders(): Promise<GitProvider[]> {
    await this.delay();
    return [...this.providers];
  }

  async addProvider(provider: Omit<GitProvider, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await this.delay();
    const now = new Date().toISOString();
    const newProvider: GitProvider = {
      ...provider,
      id: this.generateId(),
      created_at: now,
      updated_at: now,
    };
    this.providers.push(newProvider);
    return newProvider.id;
  }

  async updateProviderToken(providerId: string, token: string | null): Promise<void> {
    await this.delay();
    const provider = this.providers.find(p => p.id === providerId);
    if (provider) {
      provider.token = token;
      provider.updated_at = new Date().toISOString();
    }
  }

  async deleteProvider(providerId: string): Promise<void> {
    await this.delay();
    this.providers = this.providers.filter(p => p.id !== providerId);
    // Also remove related repositories
    this.repositories = this.repositories.filter(r => r.provider_id !== providerId);
  }

  // Repository operations
  async getRepositories(providerId?: string): Promise<Repository[]> {
    await this.delay();
    if (providerId) {
      return this.repositories.filter(r => r.provider_id === providerId);
    }
    return [...this.repositories];
  }

  async getAllRepositories(): Promise<Repository[]> {
    await this.delay();
    return [...this.repositories];
  }

  async addRepository(repository: Omit<Repository, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await this.delay();
    const now = new Date().toISOString();
    const newRepository: Repository = {
      ...repository,
      id: this.generateId(),
      created_at: now,
      updated_at: now,
    };
    this.repositories.push(newRepository);
    return newRepository.id;
  }

  async deleteRepository(repositoryId: string): Promise<void> {
    await this.delay();
    this.repositories = this.repositories.filter(r => r.id !== repositoryId);
    // Also remove related issues and PRs
    this.issues = this.issues.filter(i => i.repository_id !== repositoryId);
    this.pullRequests = this.pullRequests.filter(pr => pr.repository_id !== repositoryId);
  }

  // Issue operations
  async getIssues(repositoryId?: string): Promise<Issue[]> {
    await this.delay();
    if (repositoryId) {
      return this.issues.filter(i => i.repository_id === repositoryId);
    }
    return [...this.issues];
  }

  async getAllIssues(): Promise<Issue[]> {
    await this.delay();
    return [...this.issues];
  }

  async createIssue(issue: Omit<Issue, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await this.delay();
    const now = new Date().toISOString();
    const newIssue: Issue = {
      ...issue,
      id: this.generateId(),
      created_at: now,
      updated_at: now,
    };
    this.issues.push(newIssue);
    return newIssue.id;
  }

  async updateIssue(issueId: string, updates: Partial<Pick<Issue, 'title' | 'body' | 'state'>>): Promise<void> {
    await this.delay();
    const issue = this.issues.find(i => i.id === issueId);
    if (issue) {
      Object.assign(issue, updates);
      issue.updated_at = new Date().toISOString();
    }
  }

  // Pull Request operations
  async getPullRequests(repositoryId?: string): Promise<PullRequest[]> {
    await this.delay();
    if (repositoryId) {
      return this.pullRequests.filter(pr => pr.repository_id === repositoryId);
    }
    return [...this.pullRequests];
  }

  async getAllPullRequests(): Promise<PullRequest[]> {
    await this.delay();
    return [...this.pullRequests];
  }

  async createPullRequest(pr: Omit<PullRequest, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await this.delay();
    const now = new Date().toISOString();
    const newPR: PullRequest = {
      ...pr,
      id: this.generateId(),
      created_at: now,
      updated_at: now,
    };
    this.pullRequests.push(newPR);
    return newPR.id;
  }

  async updatePullRequest(prId: string, updates: Partial<Pick<PullRequest, 'title' | 'body' | 'state'>>): Promise<void> {
    await this.delay();
    const pr = this.pullRequests.find(p => p.id === prId);
    if (pr) {
      Object.assign(pr, updates);
      pr.updated_at = new Date().toISOString();
    }
  }

  // Workflow operations
  async getWorkflows(repositoryId?: string): Promise<WorkflowRun[]> {
    await this.delay();
    if (repositoryId) {
      return this.workflows.filter(w => w.repository_id === repositoryId);
    }
    return [...this.workflows];
  }

  async getAllWorkflows(): Promise<WorkflowRun[]> {
    await this.delay();
    return [...this.workflows];
  }

  // Dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    await this.delay();
    const currentUser = "john-doe";
    
    return {
      issues: {
        total: this.issues.length,
        open: this.issues.filter(i => i.state === "open").length,
        closed: this.issues.filter(i => i.state === "closed").length,
        assigned: this.issues.filter(i => i.assignee === currentUser).length
      },
      pullRequests: {
        total: this.pullRequests.length,
        open: this.pullRequests.filter(pr => pr.state === "open").length,
        merged: this.pullRequests.filter(pr => pr.state === "merged").length,
        closed: this.pullRequests.filter(pr => pr.state === "closed").length,
        assigned: this.pullRequests.filter(pr => pr.assignee === currentUser).length
      },
      workflows: {
        total: this.workflows.length,
        success: this.workflows.filter(w => w.status === "success").length,
        failure: this.workflows.filter(w => w.status === "failure").length,
        in_progress: this.workflows.filter(w => w.status === "in_progress").length,
        cancelled: this.workflows.filter(w => w.status === "cancelled").length
      }
    };
  }
}