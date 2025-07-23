import { invoke } from '@tauri-apps/api/core';
import { 
  AppBackend, 
  GitProvider, 
  Repository, 
  Issue, 
  PullRequest,
  WorkflowRun,
  IssueStats,
  PullRequestStats,
  SyncSettings,
  SyncHistory,
  WorkflowStats,
  PaginationParams,
  PaginatedResponse,
  IssueFilters,
  PullRequestFilters,
  WorkflowFilters,
  CreateProviderRequest,
  CreateRepositoryRequest
} from '../types/AppBackend';

export class NativeBackend implements AppBackend {
  // Provider operations
  async getProviders(): Promise<GitProvider[]> {
    return await invoke('get_git_providers');
  }

  async getProvider(providerId: number): Promise<GitProvider> {
    return await invoke('get_git_provider', { providerId: providerId });
  }

  async addProvider(provider: CreateProviderRequest): Promise<number> {
    return await invoke('add_git_provider', {
      name: provider.name,
      provider_type: provider.provider_type,
      base_url: provider.base_url,
      api_base_url: provider.api_base_url,
      token: provider.token
    });
  }

  async updateProviderToken(providerId: number, token: string | null): Promise<void> {
    console.log(`🔧 NativeBackend.updateProviderToken called with: providerId=${providerId}, hasToken=${!!token}`);
    console.log(`🔧 invoke function available:`, typeof invoke);
    console.log(`🔧 Calling invoke with params:`, { providerId: providerId, token });
    
    try {
      const result = await invoke('update_provider_token', {
        providerId: providerId,
        token
      });
      console.log(`✅ NativeBackend.updateProviderToken successful for: ${providerId}`, result);
    } catch (error) {
      console.error(`❌ NativeBackend.updateProviderToken failed for ${providerId}:`, error);
      console.error(`❌ Error details:`, {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async validateProviderToken(providerId: number): Promise<boolean> {
    return await invoke('validate_provider_token', {
      providerId: providerId
    });
  }

  async deleteProvider(providerId: number): Promise<void> {
    await invoke('delete_provider', {
      providerId: providerId
    });
  }

  // Repository operations
  async getRepositories(providerId?: number): Promise<Repository[]> {
    if (providerId) {
      return await invoke('get_repositories_by_provider', { providerId: providerId });
    }
    return await invoke('get_all_repositories');
  }

  async getRepository(repositoryId: number): Promise<Repository> {
    return await invoke('get_repository', { repository_id: repositoryId });
  }

  async addRepository(repository: CreateRepositoryRequest): Promise<number> {
    console.log('🔧 NativeBackend.addRepository called with:', repository);
    try {
      const result = await invoke('add_repository', {
        providerId: repository.provider_id,
        webUrl: repository.web_url,
        apiUrl: repository.api_base_url
      });
      console.log('✅ NativeBackend.addRepository successful:', result);
      return result as number;
    } catch (error) {
      console.error('❌ NativeBackend.addRepository failed:', error);
      throw error;
    }
  }

  async deleteRepository(repositoryId: number): Promise<void> {
    await invoke('delete_repository', { repository_id: repositoryId });
  }

  // Issue operations
  async getIssues(filters?: IssueFilters, pagination?: PaginationParams): Promise<PaginatedResponse<Issue>> {
    return await invoke('get_issues', { filters, pagination });
  }

  async getIssue(issueId: number): Promise<Issue> {
    return await invoke('get_issue', { issue_id: issueId });
  }

  async getIssueStats(filters?: IssueFilters): Promise<IssueStats> {
    return await invoke('get_issue_stats', { filters });
  }

  // Pull Request operations
  async getPullRequests(filters?: PullRequestFilters, pagination?: PaginationParams): Promise<PaginatedResponse<PullRequest>> {
    return await invoke('get_pull_requests', { filters, pagination });
  }

  async getPullRequest(prId: number): Promise<PullRequest> {
    return await invoke('get_pull_request', { pr_id: prId });
  }

  async getPullRequestStats(filters?: PullRequestFilters): Promise<PullRequestStats> {
    return await invoke('get_pull_request_stats', { filters });
  }

  // Workflow operations
  async getWorkflows(filters?: WorkflowFilters, pagination?: PaginationParams): Promise<PaginatedResponse<WorkflowRun>> {
    return await invoke('get_workflows', { filters, pagination });
  }

  async getWorkflow(workflowId: number): Promise<WorkflowRun> {
    return await invoke('get_workflow', { workflow_id: workflowId });
  }

  async getWorkflowStats(filters?: WorkflowFilters): Promise<WorkflowStats> {
    return await invoke('get_workflow_stats', { filters });
  }

  // Sync operations
  async syncProvider(providerId: number): Promise<void> {
    console.log(`📡 NativeBackend.syncProvider called with provider ID: ${providerId}`);
    try {
      await invoke('sync_provider', { providerId: providerId });
      console.log(`✅ NativeBackend.syncProvider completed for provider: ${providerId}`);
    } catch (error) {
      console.error(`❌ NativeBackend.syncProvider failed for provider ${providerId}:`, error);
      throw error;
    }
  }

  async syncAllProviders(): Promise<void> {
    await invoke('sync_all_providers');
  }

  async syncRepository(repositoryId: number): Promise<void> {
    await invoke('sync_repository', { repository_id: repositoryId });
  }

  async isSyncInProgress(): Promise<boolean> {
    return await invoke('is_sync_in_progress');
  }

  async getSyncStatus(): Promise<boolean> {
    return await invoke('get_sync_status');
  }

  async resetSyncLock(): Promise<void> {
    await invoke('reset_sync_lock');
  }

  async getSyncSettings(): Promise<SyncSettings> {
    return await invoke('get_sync_settings');
  }

  async updateSyncSettings(settings: SyncSettings): Promise<void> {
    await invoke('update_sync_settings', { new_settings: settings });
  }

  async getSyncHistory(limit?: number): Promise<SyncHistory[]> {
    return await invoke('get_sync_history', { limit });
  }

  async openExternalUrl(url: string): Promise<void> {
    await invoke('open_external_url', { url });
  }
}