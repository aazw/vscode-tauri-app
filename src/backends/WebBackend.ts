import initSqlJs, { Database } from 'sql.js';
import { 
  AppBackend, 
  GitProvider, 
  Repository, 
  Issue, 
  PullRequest,
  WorkflowRun,
  DashboardStats 
} from '../types/AppBackend';

export class WebBackend implements AppBackend {
  private db: Database | null = null;
  private initialized = false;

  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      const SQL = await initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`
      });

      // Load the SQLite database file
      const response = await fetch('/db.sqlite3');
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        this.db = new SQL.Database(new Uint8Array(buffer));
      } else {
        // Create empty database if file doesn't exist
        this.db = new SQL.Database();
        await this.createTablesAndSeedData();
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize WebBackend database:', error);
      throw error;
    }
  }

  private async createTablesAndSeedData() {
    if (!this.db) return;

    // Create tables
    const schemaResponse = await fetch('/database/schema.sql');
    const schemaSQL = await schemaResponse.text();
    this.db.exec(schemaSQL);

    // Insert seed data
    const seedResponse = await fetch('/database/seed.sql');
    const seedSQL = await seedResponse.text();
    this.db.exec(seedSQL);
  }

  private async ensureInitialized() {
    while (!this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
  }

  private generateId(): string {
    return `web-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Provider operations
  async getProviders(): Promise<GitProvider[]> {
    await this.ensureInitialized();
    
    const stmt = this.db!.prepare('SELECT * FROM git_providers ORDER BY created_at');
    const providers: GitProvider[] = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      providers.push({
        id: row.id as string,
        name: row.name as string,
        provider_type: row.provider_type as string,
        base_url: row.base_url as string,
        token: row.token as string | null,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
      });
    }
    
    stmt.free();
    return providers;
  }

  async addProvider(provider: Omit<GitProvider, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await this.ensureInitialized();
    
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const stmt = this.db!.prepare(`
      INSERT INTO git_providers (id, name, provider_type, base_url, token, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([id, provider.name, provider.provider_type, provider.base_url, provider.token, now, now]);
    stmt.free();
    
    return id;
  }

  async updateProviderToken(providerId: string, token: string | null): Promise<void> {
    await this.ensureInitialized();
    
    const now = new Date().toISOString();
    const stmt = this.db!.prepare(`
      UPDATE git_providers 
      SET token = ?, updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run([token, now, providerId]);
    stmt.free();
  }

  async deleteProvider(providerId: string): Promise<void> {
    await this.ensureInitialized();
    
    // Delete repositories first (cascade)
    const deleteReposStmt = this.db!.prepare('DELETE FROM repositories WHERE provider_id = ?');
    deleteReposStmt.run([providerId]);
    deleteReposStmt.free();
    
    // Delete provider
    const deleteProviderStmt = this.db!.prepare('DELETE FROM git_providers WHERE id = ?');
    deleteProviderStmt.run([providerId]);
    deleteProviderStmt.free();
  }

  // Repository operations
  async getRepositories(providerId?: string): Promise<Repository[]> {
    await this.ensureInitialized();
    
    let query = 'SELECT * FROM repositories';
    let params: any[] = [];
    
    if (providerId) {
      query += ' WHERE provider_id = ?';
      params = [providerId];
    }
    
    query += ' ORDER BY created_at';
    
    const stmt = this.db!.prepare(query);
    const repositories: Repository[] = [];
    
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      repositories.push({
        id: row.id as string,
        provider_id: row.provider_id as string,
        name: row.name as string,
        full_name: row.full_name as string,
        clone_url: row.clone_url as string,
        ssh_url: row.ssh_url as string,
        web_url: row.web_url as string,
        description: row.description as string | null,
        provider_name: row.provider_name as string,
        provider_type: row.provider_type as string,
        is_private: Boolean(row.is_private),
        is_fork: Boolean(row.is_fork),
        is_archived: Boolean(row.is_archived),
        default_branch: row.default_branch as string,
        language: row.language as string | null,
        stars_count: row.stars_count as number,
        forks_count: row.forks_count as number,
        issues_count: row.issues_count as number,
        last_activity: row.last_activity as string | null,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
      });
    }
    
    stmt.free();
    return repositories;
  }

  async getAllRepositories(): Promise<Repository[]> {
    return this.getRepositories();
  }

  async addRepository(repository: Omit<Repository, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await this.ensureInitialized();
    
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const stmt = this.db!.prepare(`
      INSERT INTO repositories (
        id, name, full_name, description, provider_id, provider_name, provider_type,
        clone_url, ssh_url, web_url, is_private, is_fork, is_archived, default_branch,
        language, stars_count, forks_count, issues_count, last_activity, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      id,
      repository.name,
      repository.full_name,
      repository.description,
      repository.provider_id,
      repository.provider_name,
      repository.provider_type,
      repository.clone_url,
      repository.ssh_url,
      repository.web_url,
      repository.is_private ? 1 : 0,
      repository.is_fork ? 1 : 0,
      repository.is_archived ? 1 : 0,
      repository.default_branch,
      repository.language,
      repository.stars_count,
      repository.forks_count,
      repository.issues_count,
      repository.last_activity,
      now,
      now
    ]);
    stmt.free();
    
    return id;
  }

  async deleteRepository(repositoryId: string): Promise<void> {
    await this.ensureInitialized();
    
    const stmt = this.db!.prepare('DELETE FROM repositories WHERE id = ?');
    stmt.run([repositoryId]);
    stmt.free();
  }

  // Issue operations
  async getIssues(repositoryId?: string): Promise<Issue[]> {
    await this.ensureInitialized();
    
    let query = 'SELECT * FROM issues';
    let params: any[] = [];
    
    if (repositoryId) {
      query += ' WHERE repository = ?';
      params = [repositoryId];
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = this.db!.prepare(query);
    const issues: Issue[] = [];
    
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      issues.push({
        id: row.id as string,
        repository_id: row.repository as string,
        number: row.number as number,
        title: row.title as string,
        body: null,
        repository: row.repository as string,
        provider: row.provider as string,
        assignee: row.assignee as string | null,
        author: row.author as string,
        state: row.state as 'open' | 'closed',
        labels: JSON.parse(row.labels as string),
        url: row.url as string,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
      });
    }
    
    stmt.free();
    return issues;
  }

  async getAllIssues(): Promise<Issue[]> {
    return this.getIssues();
  }

  async createIssue(issue: Omit<Issue, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await this.ensureInitialized();
    
    const id = this.generateId();
    const now = new Date().toISOString();
    
    // Get next issue number for the repository
    const countStmt = this.db!.prepare('SELECT MAX(number) as max_number FROM issues WHERE repository = ?');
    countStmt.bind([issue.repository]);
    countStmt.step();
    const maxNumber = (countStmt.getAsObject().max_number as number) || 0;
    countStmt.free();
    
    const stmt = this.db!.prepare(`
      INSERT INTO issues (id, title, number, repository, provider, assignee, author, state, labels, created_at, updated_at, url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      id,
      issue.title,
      maxNumber + 1,
      issue.repository,
      issue.provider,
      issue.assignee,
      issue.author,
      issue.state,
      JSON.stringify(issue.labels),
      now,
      now,
      issue.url
    ]);
    stmt.free();
    
    return id;
  }

  async updateIssue(issueId: string, updates: Partial<Pick<Issue, 'title' | 'body' | 'state'>>): Promise<void> {
    await this.ensureInitialized();
    
    const now = new Date().toISOString();
    const setParts: string[] = [];
    const values: any[] = [];
    
    if (updates.title !== undefined) {
      setParts.push('title = ?');
      values.push(updates.title);
    }
    if (updates.state !== undefined) {
      setParts.push('state = ?');
      values.push(updates.state);
    }
    
    if (setParts.length === 0) return;
    
    setParts.push('updated_at = ?');
    values.push(now);
    values.push(issueId);
    
    const stmt = this.db!.prepare(`
      UPDATE issues 
      SET ${setParts.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(values);
    stmt.free();
  }

  // Pull Request operations
  async getPullRequests(repositoryId?: string): Promise<PullRequest[]> {
    await this.ensureInitialized();
    
    let query = 'SELECT * FROM pull_requests';
    let params: any[] = [];
    
    if (repositoryId) {
      query += ' WHERE repository = ?';
      params = [repositoryId];
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = this.db!.prepare(query);
    const pullRequests: PullRequest[] = [];
    
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      pullRequests.push({
        id: row.id as string,
        repository_id: row.repository as string,
        number: row.number as number,
        title: row.title as string,
        body: null,
        repository: row.repository as string,
        provider: row.provider as string,
        assignee: row.assignee as string | null,
        author: row.author as string,
        state: row.state as 'open' | 'closed' | 'merged',
        draft: Boolean(row.draft),
        url: row.url as string,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
      });
    }
    
    stmt.free();
    return pullRequests;
  }

  async getAllPullRequests(): Promise<PullRequest[]> {
    return this.getPullRequests();
  }

  async createPullRequest(pr: Omit<PullRequest, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await this.ensureInitialized();
    
    const id = this.generateId();
    const now = new Date().toISOString();
    
    // Get next PR number for the repository
    const countStmt = this.db!.prepare('SELECT MAX(number) as max_number FROM pull_requests WHERE repository = ?');
    countStmt.bind([pr.repository]);
    countStmt.step();
    const maxNumber = (countStmt.getAsObject().max_number as number) || 0;
    countStmt.free();
    
    const stmt = this.db!.prepare(`
      INSERT INTO pull_requests (id, title, number, repository, provider, assignee, author, state, draft, created_at, updated_at, url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      id,
      pr.title,
      maxNumber + 1,
      pr.repository,
      pr.provider,
      pr.assignee,
      pr.author,
      pr.state,
      pr.draft ? 1 : 0,
      now,
      now,
      pr.url
    ]);
    stmt.free();
    
    return id;
  }

  async updatePullRequest(prId: string, updates: Partial<Pick<PullRequest, 'title' | 'body' | 'state'>>): Promise<void> {
    await this.ensureInitialized();
    
    const now = new Date().toISOString();
    const setParts: string[] = [];
    const values: any[] = [];
    
    if (updates.title !== undefined) {
      setParts.push('title = ?');
      values.push(updates.title);
    }
    if (updates.state !== undefined) {
      setParts.push('state = ?');
      values.push(updates.state);
    }
    
    if (setParts.length === 0) return;
    
    setParts.push('updated_at = ?');
    values.push(now);
    values.push(prId);
    
    const stmt = this.db!.prepare(`
      UPDATE pull_requests 
      SET ${setParts.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(values);
    stmt.free();
  }

  // Workflow operations
  async getWorkflows(repositoryId?: string): Promise<WorkflowRun[]> {
    await this.ensureInitialized();
    
    let query = 'SELECT * FROM workflow_runs';
    let params: any[] = [];
    
    if (repositoryId) {
      query += ' WHERE repository = ?';
      params = [repositoryId];
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = this.db!.prepare(query);
    const workflows: WorkflowRun[] = [];
    
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      workflows.push({
        id: row.id as string,
        repository_id: row.repository as string,
        name: row.name as string,
        repository: row.repository as string,
        provider: row.provider as string,
        status: row.status as 'success' | 'failure' | 'in_progress' | 'cancelled',
        conclusion: row.conclusion as string | null,
        branch: row.branch as string,
        commit_sha: row.commit_sha as string,
        commit_message: row.commit_message as string,
        author: row.author as string,
        url: row.url as string,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
      });
    }
    
    stmt.free();
    return workflows;
  }

  async getAllWorkflows(): Promise<WorkflowRun[]> {
    return this.getWorkflows();
  }

  // Dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    await this.ensureInitialized();
    
    const currentUser = "john-doe";
    
    // Get issues stats
    const issuesStmt = this.db!.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN state = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN state = 'closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN assignee = ? THEN 1 ELSE 0 END) as assigned
      FROM issues
    `);
    issuesStmt.bind([currentUser]);
    issuesStmt.step();
    const issuesData = issuesStmt.getAsObject();
    issuesStmt.free();

    // Get pull requests stats
    const prsStmt = this.db!.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN state = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN state = 'merged' THEN 1 ELSE 0 END) as merged,
        SUM(CASE WHEN state = 'closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN assignee = ? THEN 1 ELSE 0 END) as assigned
      FROM pull_requests
    `);
    prsStmt.bind([currentUser]);
    prsStmt.step();
    const prsData = prsStmt.getAsObject();
    prsStmt.free();

    // Get workflows stats
    const workflowsStmt = this.db!.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) as failure,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM workflow_runs
    `);
    workflowsStmt.step();
    const workflowsData = workflowsStmt.getAsObject();
    workflowsStmt.free();
    
    return {
      issues: {
        total: issuesData.total as number,
        open: issuesData.open as number,
        closed: issuesData.closed as number,
        assigned: issuesData.assigned as number
      },
      pullRequests: {
        total: prsData.total as number,
        open: prsData.open as number,
        merged: prsData.merged as number,
        closed: prsData.closed as number,
        assigned: prsData.assigned as number
      },
      workflows: {
        total: workflowsData.total as number,
        success: workflowsData.success as number,
        failure: workflowsData.failure as number,
        in_progress: workflowsData.in_progress as number,
        cancelled: workflowsData.cancelled as number
      }
    };
  }
}