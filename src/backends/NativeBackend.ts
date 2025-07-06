import { invoke } from '@tauri-apps/api/core';
import { 
  AppBackend, 
  GitProvider, 
  Repository, 
  Issue, 
  PullRequest,
  WorkflowRun,
  DashboardStats 
} from '../types/AppBackend';

export class NativeBackend implements AppBackend {
  // Provider operations
  async getProviders(): Promise<GitProvider[]> {
    return await invoke('get_git_providers');
  }

  async addProvider(provider: Omit<GitProvider, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    return await invoke('add_git_provider', {
      name: provider.name,
      providerType: provider.provider_type,
      baseUrl: provider.base_url,
      token: provider.token
    });
  }

  async updateProviderToken(providerId: string, token: string | null): Promise<void> {
    await invoke('update_provider_token', {
      providerId,
      token
    });
  }

  async deleteProvider(providerId: string): Promise<void> {
    await invoke('delete_provider', {
      providerId
    });
  }

  // Repository operations
  async getRepositories(providerId?: string): Promise<Repository[]> {
    if (providerId) {
      return await invoke('get_repositories_by_provider', {
        providerId
      });
    }
    return await invoke('get_all_repositories');
  }

  async getAllRepositories(): Promise<Repository[]> {
    return await invoke('get_all_repositories');
  }

  async addRepository(repository: Omit<Repository, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    return await invoke('add_repository', {
      providerId: repository.provider_id,
      name: repository.name,
      fullName: repository.full_name,
      cloneUrl: repository.clone_url,
      description: repository.description,
      isPrivate: repository.is_private
    });
  }

  async deleteRepository(_repositoryId: string): Promise<void> {
    // TODO: Implement in Tauri backend
    throw new Error('deleteRepository not implemented in Tauri backend yet');
  }

  // Issue operations
  async getIssues(_repositoryId?: string): Promise<Issue[]> {
    // TODO: Implement in Tauri backend
    throw new Error('getIssues not implemented in Tauri backend yet');
  }

  async getAllIssues(): Promise<Issue[]> {
    // TODO: Implement in Tauri backend
    throw new Error('getAllIssues not implemented in Tauri backend yet');
  }

  async createIssue(_issue: Omit<Issue, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    // TODO: Implement in Tauri backend
    throw new Error('createIssue not implemented in Tauri backend yet');
  }

  async updateIssue(_issueId: string, _updates: Partial<Pick<Issue, 'title' | 'body' | 'state'>>): Promise<void> {
    // TODO: Implement in Tauri backend
    throw new Error('updateIssue not implemented in Tauri backend yet');
  }

  // Pull Request operations
  async getPullRequests(_repositoryId?: string): Promise<PullRequest[]> {
    // TODO: Implement in Tauri backend
    throw new Error('getPullRequests not implemented in Tauri backend yet');
  }

  async getAllPullRequests(): Promise<PullRequest[]> {
    // TODO: Implement in Tauri backend
    throw new Error('getAllPullRequests not implemented in Tauri backend yet');
  }

  async createPullRequest(_pr: Omit<PullRequest, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    // TODO: Implement in Tauri backend
    throw new Error('createPullRequest not implemented in Tauri backend yet');
  }

  async updatePullRequest(_prId: string, _updates: Partial<Pick<PullRequest, 'title' | 'body' | 'state'>>): Promise<void> {
    // TODO: Implement in Tauri backend
    throw new Error('updatePullRequest not implemented in Tauri backend yet');
  }

  // Workflow operations
  async getWorkflows(_repositoryId?: string): Promise<WorkflowRun[]> {
    // TODO: Implement in Tauri backend
    throw new Error('getWorkflows not implemented in Tauri backend yet');
  }

  async getAllWorkflows(): Promise<WorkflowRun[]> {
    // TODO: Implement in Tauri backend
    throw new Error('getAllWorkflows not implemented in Tauri backend yet');
  }

  // Dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    // TODO: Implement in Tauri backend
    throw new Error('getDashboardStats not implemented in Tauri backend yet');
  }
}