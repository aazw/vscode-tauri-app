import { 
  AppBackend, 
  GitProvider, 
  Repository, 
  Issue, 
  PullRequest,
  WorkflowRun,
  IssueStats,
  PullRequestStats,
  WorkflowStats,
  SyncSettings,
  SyncHistory,
  PaginationParams,
  PaginatedResponse,
  IssueFilters,
  PullRequestFilters,
  WorkflowFilters,
  CreateProviderRequest,
  CreateRepositoryRequest
} from '../types/AppBackend';

export class MockBackend implements AppBackend {
  private providers: GitProvider[] = [];
  private repositories: Repository[] = [];
  private issues: Issue[] = [];
  private pullRequests: PullRequest[] = [];
  private workflows: WorkflowRun[] = [];
  private syncHistory: SyncHistory[] = [];

  constructor() {
    this.initializeWithMockData();
  }

  private initializeWithMockData() {
    const now = new Date().toISOString();
    
    // Initialize with default providers
    this.providers = [
      {
        id: 1,
        name: "GitHub.com",
        provider_type: "github",
        base_url: "https://api.github.com",
        token: null,
        token_valid: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        name: "GitLab.com",
        provider_type: "gitlab",
        base_url: "https://gitlab.com/api/v4",
        token: null,
        token_valid: false,
        created_at: now,
        updated_at: now,
      }
    ];

    // Mock repositories
    this.repositories = [
      {
        id: 1,
        api_id: "repo-123",
        name: "frontend-app",
        full_name: "company/frontend-app",
        web_url: "https://github.com/company/frontend-app",
        description: "Main frontend application built with React and TypeScript",
        provider_id: 1,
        provider_name: "GitHub.com",
        provider_type: "github",
        is_private: true,
        language: "TypeScript",
        last_activity: "2024-01-15T15:30:00Z",
        api_created_at: "2024-01-10T10:00:00Z",
        api_updated_at: "2024-01-15T15:30:00Z",
        
        // Resource-specific sync timestamps
        last_issues_sync: "2024-01-15T15:30:00Z",
        last_pull_requests_sync: "2024-01-15T15:30:00Z",
        last_workflows_sync: "2024-01-15T15:30:00Z",
        
        // Resource-specific sync status
        last_issues_sync_status: 'success',
        last_pull_requests_sync_status: 'success',
        last_workflows_sync_status: 'success',
        
        created_at: now,
        updated_at: "2024-01-15T15:30:00Z",
      },
      {
        id: 2,
        api_id: "repo-456",
        name: "backend-api",
        full_name: "company/backend-api",
        web_url: "https://github.com/company/backend-api",
        description: "RESTful API server built with Node.js and Express",
        provider_id: 1,
        provider_name: "GitHub.com",
        provider_type: "github",
        is_private: true,
        language: "JavaScript",
        last_activity: "2024-01-15T14:20:00Z",
        api_created_at: "2024-01-08T12:00:00Z",
        api_updated_at: "2024-01-15T14:20:00Z",
        
        // Resource-specific sync timestamps
        last_issues_sync: "2024-01-15T14:20:00Z",
        last_pull_requests_sync: "2024-01-15T14:20:00Z",
        last_workflows_sync: "2024-01-15T14:20:00Z",
        
        // Resource-specific sync status
        last_issues_sync_status: 'success',
        last_pull_requests_sync_status: 'success',
        last_workflows_sync_status: 'success',
        
        created_at: now,
        updated_at: "2024-01-15T14:20:00Z",
      },
      {
        id: 3,
        api_id: "repo-789",
        name: "design-system",
        full_name: "company/design-system",
        web_url: "https://gitlab.com/company/design-system",
        description: "Shared component library and design tokens",
        provider_id: 2,
        provider_name: "GitLab.com",
        provider_type: "gitlab",
        is_private: false,
        language: "Vue",
        last_activity: "2024-01-15T13:45:00Z",
        api_created_at: "2024-01-05T09:00:00Z",
        api_updated_at: "2024-01-15T13:45:00Z",
        
        // Resource-specific sync timestamps
        last_issues_sync: "2024-01-15T13:45:00Z",
        last_pull_requests_sync: "2024-01-15T13:45:00Z",
        last_workflows_sync: "2024-01-15T13:45:00Z",
        
        // Resource-specific sync status
        last_issues_sync_status: 'success',
        last_pull_requests_sync_status: 'success',
        last_workflows_sync_status: 'success',
        
        created_at: now,
        updated_at: "2024-01-15T13:45:00Z",
      },
      {
        id: 4,
        api_id: "repo-101",
        name: "mobile-app",
        full_name: "company/mobile-app",
        web_url: "https://github.com/company/mobile-app",
        description: "React Native mobile application",
        provider_id: 1,
        provider_name: "GitHub.com",
        provider_type: "github",
        is_private: true,
        language: "TypeScript",
        last_activity: "2024-01-14T16:10:00Z",
        api_created_at: "2024-01-03T14:00:00Z",
        api_updated_at: "2024-01-14T16:10:00Z",
        
        // Resource-specific sync timestamps
        last_issues_sync: "2024-01-14T16:10:00Z",
        last_pull_requests_sync: "2024-01-14T16:10:00Z",
        last_workflows_sync: "2024-01-14T16:10:00Z",
        
        // Resource-specific sync status
        last_issues_sync_status: 'success',
        last_pull_requests_sync_status: 'success',
        last_workflows_sync_status: 'success',
        
        created_at: now,
        updated_at: "2024-01-14T16:10:00Z",
      }
    ];

    // Mock issues
    this.issues = [
      {
        id: 1,
        api_id: "issue-123",
        repository_id: 1,
        number: 123,
        title: "Fix authentication bug in login form",
        repository: "frontend-app",
        provider: "GitHub.com",
        assigned_to_me: true,
        author: "jane-smith",
        state: "open",
        labels: ["bug", "high-priority"],
        url: "https://github.com/company/frontend-app/issues/123",
        closed_at: null,
        api_created_at: "2024-01-15T10:30:00Z",
        api_updated_at: "2024-01-15T14:20:00Z",
        created_at: now,
        updated_at: "2024-01-15T14:20:00Z",
      },
      {
        id: 2,
        api_id: "issue-456",
        repository_id: 3,
        number: 45,
        title: "Add dark mode support",
        repository: "design-system",
        provider: "GitLab.com",
        assigned_to_me: false,
        author: "bob-wilson",
        state: "open",
        labels: ["enhancement", "ui"],
        url: "https://gitlab.com/company/design-system/-/issues/45",
        closed_at: null,
        api_created_at: "2024-01-14T16:45:00Z",
        api_updated_at: "2024-01-14T16:45:00Z",
        created_at: now,
        updated_at: "2024-01-14T16:45:00Z",
      },
      {
        id: 3,
        api_id: "issue-789",
        repository_id: 2,
        number: 87,
        title: "Update dependencies to latest versions",
        repository: "backend-api",
        provider: "GitHub Enterprise",
        assigned_to_me: true,
        author: "alice-brown",
        state: "open",
        labels: ["maintenance"],
        url: "https://github.enterprise.com/company/backend-api/issues/87",
        closed_at: null,
        api_created_at: "2024-01-13T09:15:00Z",
        api_updated_at: "2024-01-14T11:30:00Z",
        created_at: now,
        updated_at: "2024-01-14T11:30:00Z",
      },
      {
        id: 4,
        api_id: "issue-101",
        repository_id: 2,
        number: 91,
        title: "Improve error handling in API",
        repository: "backend-api",
        provider: "GitHub Enterprise",
        assigned_to_me: false,
        author: "john-doe",
        state: "closed",
        labels: ["bug", "api"],
        url: "https://github.enterprise.com/company/backend-api/issues/91",
        closed_at: "2024-01-13T16:30:00Z",
        api_created_at: "2024-01-12T08:00:00Z",
        api_updated_at: "2024-01-13T16:30:00Z",
        created_at: now,
        updated_at: "2024-01-13T16:30:00Z",
      }
    ];

    // Mock pull requests
    this.pullRequests = [
      {
        id: 1,
        api_id: "pr-123",
        repository_id: 1,
        number: 56,
        title: "Implement user profile page",
        repository: "frontend-app",
        provider: "GitHub.com",
        assigned_to_me: true,
        author: "jane-smith",
        state: "open",
        draft: false,
        url: "https://github.com/company/frontend-app/pull/56",
        merged_at: null,
        closed_at: null,
        api_created_at: "2024-01-15T08:20:00Z",
        api_updated_at: "2024-01-15T12:10:00Z",
        created_at: now,
        updated_at: "2024-01-15T12:10:00Z",
      },
      {
        id: 2,
        api_id: "pr-456",
        repository_id: 2,
        number: 78,
        title: "Add API rate limiting",
        repository: "backend-api",
        provider: "GitHub Enterprise",
        assigned_to_me: false,
        author: "bob-wilson",
        state: "open",
        draft: true,
        url: "https://github.enterprise.com/company/backend-api/pull/78",
        merged_at: null,
        closed_at: null,
        api_created_at: "2024-01-14T14:30:00Z",
        api_updated_at: "2024-01-15T09:45:00Z",
        created_at: now,
        updated_at: "2024-01-15T09:45:00Z",
      },
      {
        id: 3,
        api_id: "pr-789",
        repository_id: 3,
        number: 34,
        title: "Fix responsive layout issues",
        repository: "design-system",
        provider: "GitLab.com",
        assigned_to_me: true,
        author: "alice-brown",
        state: "merged",
        draft: false,
        url: "https://gitlab.com/company/design-system/-/merge_requests/34",
        merged_at: "2024-01-13T15:20:00Z",
        closed_at: null,
        api_created_at: "2024-01-12T11:00:00Z",
        api_updated_at: "2024-01-13T15:20:00Z",
        created_at: now,
        updated_at: "2024-01-13T15:20:00Z",
      },
      {
        id: 4,
        api_id: "pr-101",
        repository_id: 1,
        number: 89,
        title: "Update documentation",
        repository: "frontend-app",
        provider: "GitHub.com",
        assigned_to_me: false,
        author: "john-doe",
        state: "closed",
        draft: false,
        url: "https://github.com/company/frontend-app/pull/89",
        merged_at: null,
        closed_at: "2024-01-12T14:45:00Z",
        api_created_at: "2024-01-11T09:30:00Z",
        api_updated_at: "2024-01-12T14:45:00Z",
        created_at: now,
        updated_at: "2024-01-12T14:45:00Z",
      }
    ];

    // Mock workflows
    this.workflows = [
      {
        id: 1,
        api_id: "workflow-123",
        repository_id: 1,
        name: "CI/CD Pipeline",
        repository: "frontend-app",
        provider: "GitHub.com",
        status: "completed",
        conclusion: "success",
        url: "https://github.com/company/frontend-app/actions/runs/123456",
        api_created_at: "2024-01-15T15:30:00Z",
        api_updated_at: "2024-01-15T15:45:00Z",
        created_at: now,
        updated_at: "2024-01-15T15:45:00Z",
      },
      {
        id: 2,
        api_id: "workflow-456",
        repository_id: 2,
        name: "Test Suite",
        repository: "backend-api",
        provider: "GitHub Enterprise",
        status: "completed",
        conclusion: "failure",
        url: "https://github.enterprise.com/company/backend-api/actions/runs/789012",
        api_created_at: "2024-01-15T14:20:00Z",
        api_updated_at: "2024-01-15T14:35:00Z",
        created_at: now,
        updated_at: "2024-01-15T14:35:00Z",
      },
      {
        id: 3,
        api_id: "workflow-789",
        repository_id: 3,
        name: "Deploy to Staging",
        repository: "design-system",
        provider: "GitLab.com",
        status: "in_progress",
        conclusion: null,
        url: "https://gitlab.com/company/design-system/-/pipelines/345678",
        api_created_at: "2024-01-15T13:45:00Z",
        api_updated_at: "2024-01-15T13:45:00Z",
        created_at: now,
        updated_at: "2024-01-15T13:45:00Z",
      },
      {
        id: 4,
        api_id: "workflow-101",
        repository_id: 2,
        name: "Security Scan",
        repository: "backend-api",
        provider: "GitHub Enterprise",
        status: "cancelled",
        conclusion: "cancelled",
        url: "https://github.enterprise.com/company/backend-api/actions/runs/456789",
        api_created_at: "2024-01-15T12:00:00Z",
        api_updated_at: "2024-01-15T12:30:00Z",
        created_at: now,
        updated_at: "2024-01-15T12:30:00Z",
      },
      {
        id: 5,
        api_id: "workflow-102",
        repository_id: 4,
        name: "Build and Test",
        repository: "mobile-app",
        provider: "GitHub.com",
        status: "completed",
        conclusion: "success",
        url: "https://github.com/company/mobile-app/actions/runs/567890",
        api_created_at: "2024-01-15T11:15:00Z",
        api_updated_at: "2024-01-15T11:45:00Z",
        created_at: now,
        updated_at: "2024-01-15T11:45:00Z",
      }
    ];
  }

  private generateId(): number {
    return Math.floor(Math.random() * 1000000) + Date.now() % 1000000;
  }

  private delay(ms: number = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Provider operations
  async getProviders(): Promise<GitProvider[]> {
    await this.delay();
    return [...this.providers];
  }

  async getProvider(providerId: number): Promise<GitProvider> {
    await this.delay();
    const provider = this.providers.find(p => p.id === providerId);
    if (!provider) {
      throw new Error(`Provider with ID ${providerId} not found`);
    }
    return { ...provider };
  }

  async addProvider(provider: CreateProviderRequest): Promise<number> {
    await this.delay();
    const now = new Date().toISOString();
    const newProvider: GitProvider = {
      id: this.generateId(),
      name: provider.name,
      provider_type: provider.provider_type,
      base_url: provider.base_url,
      token: provider.token,
      token_valid: false,
      created_at: now,
      updated_at: now,
    };
    this.providers.push(newProvider);
    return newProvider.id;
  }

  async updateProviderToken(providerId: number, token: string | null): Promise<void> {
    await this.delay();
    const provider = this.providers.find(p => p.id === providerId);
    if (provider) {
      provider.token = token;
      provider.token_valid = false;
      provider.updated_at = new Date().toISOString();
    }
  }

  async validateProviderToken(providerId: number): Promise<boolean> {
    await this.delay(1000); // Simulate API call
    const provider = this.providers.find(p => p.id === providerId);
    if (provider && provider.token && provider.token.length > 0) {
      // Mock validation - always return true for non-empty tokens
      provider.token_valid = true;
      // Provider validation successful - sync status managed per repository
      provider.updated_at = new Date().toISOString();
      return true;
    }
    if (provider) {
      // Provider-level sync status no longer maintained
      provider.updated_at = new Date().toISOString();
    }
    return false;
  }

  async deleteProvider(providerId: number): Promise<void> {
    await this.delay();
    this.providers = this.providers.filter(p => p.id !== providerId);
    // Also remove related repositories
    this.repositories = this.repositories.filter(r => r.provider_id !== providerId);
  }

  // Repository operations
  async getRepositories(providerId?: number): Promise<Repository[]> {
    await this.delay();
    if (providerId) {
      return this.repositories.filter(r => r.provider_id === providerId);
    }
    return [...this.repositories];
  }

  async getRepository(repositoryId: number): Promise<Repository> {
    await this.delay();
    const repository = this.repositories.find(r => r.id === repositoryId);
    if (!repository) {
      throw new Error(`Repository with ID ${repositoryId} not found`);
    }
    return { ...repository };
  }

  async addRepository(repository: CreateRepositoryRequest): Promise<number> {
    await this.delay();
    const provider = this.providers.find(p => p.id === repository.provider_id);
    if (!provider) {
      throw new Error(`Provider with ID ${repository.provider_id} not found`);
    }

    const now = new Date().toISOString();
    const newRepository: Repository = {
      id: this.generateId(),
      api_id: `api-${this.generateId()}`,
      name: repository.web_url.split('/').pop() || 'unknown',
      full_name: repository.web_url.split('/').slice(-2).join('/') || 'unknown/unknown',
      web_url: repository.web_url,
      description: null,
      provider_id: repository.provider_id,
      provider_name: provider.name,
      provider_type: provider.provider_type,
      is_private: false,
      language: null,
      last_activity: now,
      api_created_at: now,
      api_updated_at: now,
      
      // Resource-specific sync timestamps
      last_issues_sync: null,
      last_pull_requests_sync: null,
      last_workflows_sync: null,
      
      // Resource-specific sync status
      last_issues_sync_status: null,
      last_pull_requests_sync_status: null,
      last_workflows_sync_status: null,
      
      created_at: now,
      updated_at: now,
    };
    this.repositories.push(newRepository);
    return newRepository.id;
  }

  async deleteRepository(repositoryId: number): Promise<void> {
    await this.delay();
    this.repositories = this.repositories.filter(r => r.id !== repositoryId);
    // Also remove related issues and PRs
    this.issues = this.issues.filter(i => i.repository_id !== repositoryId);
    this.pullRequests = this.pullRequests.filter(pr => pr.repository_id !== repositoryId);
  }

  // Issue operations
  async getIssues(filters?: IssueFilters, pagination?: PaginationParams): Promise<PaginatedResponse<Issue>> {
    await this.delay();
    let filteredIssues = [...this.issues];

    if (filters) {
      if (filters.state && filters.state !== 'all') {
        filteredIssues = filteredIssues.filter(issue => issue.state === filters.state);
      }
      if (filters.assigned === 'me') {
        filteredIssues = filteredIssues.filter(issue => issue.assigned_to_me);
      }
      if (filters.provider) {
        filteredIssues = filteredIssues.filter(issue => issue.provider === filters.provider);
      }
      if (filters.repository) {
        filteredIssues = filteredIssues.filter(issue => issue.repository === filters.repository);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredIssues = filteredIssues.filter(issue => 
          issue.title.toLowerCase().includes(searchLower) ||
          issue.author.toLowerCase().includes(searchLower)
        );
      }
    }

    const page = pagination?.page || 1;
    const perPage = pagination?.per_page || 10;
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedData = filteredIssues.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        page,
        per_page: perPage,
        total: filteredIssues.length,
        total_pages: Math.ceil(filteredIssues.length / perPage)
      }
    };
  }

  async getIssue(issueId: number): Promise<Issue> {
    await this.delay();
    const issue = this.issues.find(i => i.id === issueId);
    if (!issue) {
      throw new Error(`Issue with ID ${issueId} not found`);
    }
    return { ...issue };
  }

  async getIssueStats(filters?: IssueFilters): Promise<IssueStats> {
    await this.delay();
    let filteredIssues = [...this.issues];

    if (filters) {
      if (filters.provider) {
        filteredIssues = filteredIssues.filter(issue => issue.provider === filters.provider);
      }
      if (filters.repository) {
        filteredIssues = filteredIssues.filter(issue => issue.repository === filters.repository);
      }
    }

    return {
      total: filteredIssues.length,
      open: filteredIssues.filter(i => i.state === 'open').length,
      closed: filteredIssues.filter(i => i.state === 'closed').length,
      assigned: filteredIssues.filter(i => i.assigned_to_me).length
    };
  }

  // Pull Request operations
  async getPullRequests(filters?: PullRequestFilters, pagination?: PaginationParams): Promise<PaginatedResponse<PullRequest>> {
    await this.delay();
    let filteredPRs = [...this.pullRequests];

    if (filters) {
      if (filters.state && filters.state !== 'all') {
        filteredPRs = filteredPRs.filter(pr => pr.state === filters.state);
      }
      if (filters.assigned === 'me') {
        filteredPRs = filteredPRs.filter(pr => pr.assigned_to_me);
      }
      if (filters.provider) {
        filteredPRs = filteredPRs.filter(pr => pr.provider === filters.provider);
      }
      if (filters.repository) {
        filteredPRs = filteredPRs.filter(pr => pr.repository === filters.repository);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredPRs = filteredPRs.filter(pr => 
          pr.title.toLowerCase().includes(searchLower) ||
          pr.author.toLowerCase().includes(searchLower)
        );
      }
    }

    const page = pagination?.page || 1;
    const perPage = pagination?.per_page || 10;
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedData = filteredPRs.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        page,
        per_page: perPage,
        total: filteredPRs.length,
        total_pages: Math.ceil(filteredPRs.length / perPage)
      }
    };
  }

  async getPullRequest(prId: number): Promise<PullRequest> {
    await this.delay();
    const pr = this.pullRequests.find(p => p.id === prId);
    if (!pr) {
      throw new Error(`Pull Request with ID ${prId} not found`);
    }
    return { ...pr };
  }

  async getPullRequestStats(filters?: PullRequestFilters): Promise<PullRequestStats> {
    await this.delay();
    let filteredPRs = [...this.pullRequests];

    if (filters) {
      if (filters.provider) {
        filteredPRs = filteredPRs.filter(pr => pr.provider === filters.provider);
      }
      if (filters.repository) {
        filteredPRs = filteredPRs.filter(pr => pr.repository === filters.repository);
      }
    }

    return {
      total: filteredPRs.length,
      open: filteredPRs.filter(pr => pr.state === 'open').length,
      merged: filteredPRs.filter(pr => pr.state === 'merged').length,
      closed: filteredPRs.filter(pr => pr.state === 'closed').length,
      assigned: filteredPRs.filter(pr => pr.assigned_to_me).length
    };
  }

  // Workflow operations
  async getWorkflows(filters?: WorkflowFilters, pagination?: PaginationParams): Promise<PaginatedResponse<WorkflowRun>> {
    await this.delay();
    let filteredWorkflows = [...this.workflows];

    if (filters) {
      if (filters.status && filters.status !== 'all') {
        filteredWorkflows = filteredWorkflows.filter(w => w.status === filters.status);
      }
      if (filters.provider) {
        filteredWorkflows = filteredWorkflows.filter(w => w.provider === filters.provider);
      }
      if (filters.repository) {
        filteredWorkflows = filteredWorkflows.filter(w => w.repository === filters.repository);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredWorkflows = filteredWorkflows.filter(w => 
          w.name.toLowerCase().includes(searchLower)
        );
      }
    }

    const page = pagination?.page || 1;
    const perPage = pagination?.per_page || 10;
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedData = filteredWorkflows.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        page,
        per_page: perPage,
        total: filteredWorkflows.length,
        total_pages: Math.ceil(filteredWorkflows.length / perPage)
      }
    };
  }

  async getWorkflow(workflowId: number): Promise<WorkflowRun> {
    await this.delay();
    const workflow = this.workflows.find(w => w.id === workflowId);
    if (!workflow) {
      throw new Error(`Workflow with ID ${workflowId} not found`);
    }
    return { ...workflow };
  }

  async getWorkflowStats(filters?: WorkflowFilters): Promise<WorkflowStats> {
    await this.delay();
    let filteredWorkflows = [...this.workflows];

    if (filters) {
      if (filters.provider) {
        filteredWorkflows = filteredWorkflows.filter(w => w.provider === filters.provider);
      }
      if (filters.repository) {
        filteredWorkflows = filteredWorkflows.filter(w => w.repository === filters.repository);
      }
    }

    // Helper function to determine effective status (similar to frontend logic)
    const getEffectiveStatus = (workflow: WorkflowRun): 'success' | 'failure' | 'in_progress' | 'cancelled' => {
      if (workflow.status === 'in_progress' || workflow.status === 'queued' || workflow.status === 'requested' || workflow.status === 'waiting') {
        return 'in_progress';
      }
      if (workflow.status === 'cancelled') {
        return 'cancelled';
      }
      if (workflow.status === 'completed') {
        if (workflow.conclusion === 'success') {
          return 'success';
        } else if (workflow.conclusion === 'failure' || workflow.conclusion === 'timed_out') {
          return 'failure';
        } else if (workflow.conclusion === 'cancelled') {
          return 'cancelled';
        } else {
          return 'failure';
        }
      }
      return 'in_progress';
    };

    return {
      total: filteredWorkflows.length,
      success: filteredWorkflows.filter(w => getEffectiveStatus(w) === 'success').length,
      failure: filteredWorkflows.filter(w => getEffectiveStatus(w) === 'failure').length,
      in_progress: filteredWorkflows.filter(w => getEffectiveStatus(w) === 'in_progress').length,
      cancelled: filteredWorkflows.filter(w => getEffectiveStatus(w) === 'cancelled').length
    };
  }

  // Sync operations
  async syncProvider(providerId: number): Promise<void> {
    await this.delay(1000); // Simulate longer sync operation
    const provider = this.providers.find(p => p.id === providerId);
    if (provider) {
      // Provider validation successful - sync status managed per repository
      provider.updated_at = new Date().toISOString();
    }
  }

  async syncAllProviders(): Promise<void> {
    await this.delay(2000); // Simulate longer sync operation
    const now = new Date().toISOString();
    // Update repository sync status instead of provider sync status
    this.repositories.forEach(repo => {
      repo.last_issues_sync = now;
      repo.last_pull_requests_sync = now;
      repo.last_workflows_sync = now;
      repo.last_issues_sync_status = 'success';
      repo.last_pull_requests_sync_status = 'success';
      repo.last_workflows_sync_status = 'success';
      repo.updated_at = now;
    });
  }

  async syncRepository(repositoryId: number): Promise<void> {
    await this.delay(800); // Simulate sync operation
    const repository = this.repositories.find(r => r.id === repositoryId);
    if (repository) {
      repository.last_activity = new Date().toISOString();
      repository.updated_at = new Date().toISOString();
    }
  }

  async isSyncInProgress(): Promise<boolean> {
    return false; // Always false for mock
  }

  async getSyncStatus(): Promise<boolean> {
    return false; // Always false for mock
  }

  async resetSyncLock(): Promise<void> {
    await this.delay(100);
    // Mock implementation - no actual lock to reset
    console.log('Mock: Sync lock reset');
  }

  async getSyncSettings(): Promise<SyncSettings> {
    return {
      sync_interval_minutes: 30,
      auto_sync_enabled: true
    };
  }

  async updateSyncSettings(settings: SyncSettings): Promise<void> {
    await this.delay(200);
    // Mock implementation - just log the settings
    console.log('Mock: Updated sync settings:', settings);
  }

  async getSyncHistory(limit?: number): Promise<SyncHistory[]> {
    await this.delay(300);
    
    // Generate some mock sync history if empty
    if (this.syncHistory.length === 0) {
      const now = new Date();
      const histories: SyncHistory[] = [
        {
          id: 1,
          sync_type: 'all_providers',
          target_id: null,
          target_name: 'All Providers',
          status: 'completed',
          error_message: null,
          items_synced: 47,
          repositories_synced: 3,
          errors_count: 0,
          started_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
          completed_at: new Date(now.getTime() - 3 * 60 * 1000).toISOString(),
          duration_seconds: 120,
          created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 3 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          sync_type: 'provider',
          target_id: 1,
          target_name: 'GitHub.com',
          status: 'completed',
          error_message: null,
          items_synced: 23,
          repositories_synced: 2,
          errors_count: 1,
          started_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
          completed_at: new Date(now.getTime() - 28 * 60 * 1000).toISOString(),
          duration_seconds: 87,
          created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 28 * 60 * 1000).toISOString(),
        },
        {
          id: 3,
          sync_type: 'repository',
          target_id: 1,
          target_name: 'example/repo',
          status: 'failed',
          error_message: 'Authentication failed: Invalid token',
          items_synced: 0,
          repositories_synced: 0,
          errors_count: 1,
          started_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
          completed_at: new Date(now.getTime() - 58 * 60 * 1000).toISOString(),
          duration_seconds: 15,
          created_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 58 * 60 * 1000).toISOString(),
        }
      ];
      this.syncHistory = histories;
    }
    
    // Apply limit if specified
    const result = limit ? this.syncHistory.slice(0, limit) : this.syncHistory;
    return result;
  }

  async openExternalUrl(url: string): Promise<void> {
    await this.delay(100);
    console.log('Mock: Opening external URL:', url);
    // In a real browser environment, this would open the URL
    if (typeof window !== 'undefined' && window.open) {
      window.open(url, '_blank');
    }
  }
}