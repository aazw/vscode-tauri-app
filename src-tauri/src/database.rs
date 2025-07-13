use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;
use chrono::{DateTime, Utc};
use log::{info, debug, error, warn};
use refinery::embed_migrations;
use reqwest::Client;
use std::sync::atomic::{AtomicBool, Ordering};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GitProvider {
    pub id: i64,
    pub name: String,
    pub provider_type: String,
    pub base_url: String,
    pub token: Option<String>,
    pub token_valid: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Repository {
    pub id: i64,
    pub api_id: String,
    pub name: String,
    pub full_name: String,
    pub web_url: String,
    pub description: Option<String>,
    pub provider_id: i64,
    pub provider_name: String,
    pub provider_type: String,
    pub is_private: bool,
    pub language: Option<String>,
    pub last_activity: Option<DateTime<Utc>>,
    pub api_created_at: Option<DateTime<Utc>>,
    pub api_updated_at: Option<DateTime<Utc>>,
    
    // Resource-specific sync timestamps
    pub last_issues_sync: Option<DateTime<Utc>>,
    pub last_pull_requests_sync: Option<DateTime<Utc>>,
    pub last_workflows_sync: Option<DateTime<Utc>>,
    
    // Resource-specific sync status
    pub last_issues_sync_status: Option<String>,
    pub last_pull_requests_sync_status: Option<String>,
    pub last_workflows_sync_status: Option<String>,
    
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Issue {
    pub id: i64,
    pub api_id: String,
    pub repository_id: i64,
    pub number: u32,
    pub title: String,
    pub repository: String,
    pub provider: String,
    pub assigned_to_me: bool,
    pub author: String,
    pub state: String,
    pub labels: Vec<String>,
    pub url: String,
    pub closed_at: Option<DateTime<Utc>>,
    pub api_created_at: Option<DateTime<Utc>>,
    pub api_updated_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PullRequest {
    pub id: i64,
    pub api_id: String,
    pub repository_id: i64,
    pub number: u32,
    pub title: String,
    pub repository: String,
    pub provider: String,
    pub assigned_to_me: bool,
    pub author: String,
    pub state: String,
    pub draft: bool,
    pub url: String,
    pub merged_at: Option<DateTime<Utc>>,
    pub closed_at: Option<DateTime<Utc>>,
    pub api_created_at: Option<DateTime<Utc>>,
    pub api_updated_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WorkflowRun {
    pub id: i64,
    pub api_id: String,
    pub repository_id: i64,
    pub name: String,
    pub repository: String,
    pub provider: String,
    pub status: String,
    pub conclusion: Option<String>,
    pub url: String,
    pub api_created_at: Option<DateTime<Utc>>,
    pub api_updated_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncHistory {
    pub id: i64,
    pub sync_type: String, // 'provider', 'all_providers', 'repository'
    pub target_id: Option<i64>,
    pub target_name: String,
    pub status: String, // 'started', 'completed', 'failed'
    pub error_message: Option<String>,
    pub items_synced: i32,
    pub repositories_synced: i32,
    pub errors_count: i32,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub duration_seconds: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// フィルターとページネーション用の構造体
#[derive(Debug, Serialize, Deserialize)]
pub struct IssueFilters {
    pub state: Option<String>,
    pub assigned: Option<String>,
    pub provider: Option<String>,
    pub repository: Option<String>,
    pub search: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PullRequestFilters {
    pub state: Option<String>,
    pub assigned: Option<String>,
    pub provider: Option<String>,
    pub repository: Option<String>,
    pub search: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowFilters {
    pub status: Option<String>,
    pub provider: Option<String>,
    pub repository: Option<String>,
    pub search: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginationParams {
    pub page: u32,
    pub per_page: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginationInfo {
    pub page: u32,
    pub per_page: u32,
    pub total: u32,
    pub total_pages: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub pagination: PaginationInfo,
}

// 統計情報用の構造体
#[derive(Debug, Serialize, Deserialize)]
pub struct IssueStats {
    pub total: u32,
    pub open: u32,
    pub closed: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PullRequestStats {
    pub total: u32,
    pub open: u32,
    pub closed: u32,
    pub merged: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowStats {
    pub total: u32,
    pub success: u32,
    pub failure: u32,
    pub in_progress: u32,
    pub cancelled: u32,
}

// API response structures for sync
#[derive(Debug, Deserialize)]
struct GitHubIssue {
    pub id: u64,
    pub number: u32,
    pub title: String,
    pub user: GitHubUser,
    pub state: String,
    pub labels: Vec<GitHubLabel>,
    pub html_url: String,
    pub closed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub assignees: Vec<GitHubUser>,
    pub pull_request: Option<serde_json::Value>, // Present only for pull requests
}

#[derive(Debug, Deserialize)]
struct GitHubPullRequest {
    pub id: u64,
    pub number: u32,
    pub title: String,
    pub user: GitHubUser,
    pub state: String,
    pub draft: bool,
    pub html_url: String,
    pub merged_at: Option<String>,
    pub closed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub assignees: Vec<GitHubUser>,
}

#[derive(Debug, Deserialize)]
struct GitHubWorkflowRun {
    pub id: u64,
    pub name: String,
    pub status: String,
    pub conclusion: Option<String>,
    pub html_url: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
struct GitHubUser {
    pub login: String,
}

#[derive(Debug, Deserialize)]
struct GitHubLabel {
    pub name: String,
}

#[derive(Debug, Deserialize)]
struct GitHubWorkflowRunsResponse {
    pub workflow_runs: Vec<GitHubWorkflowRun>,
}

// GitLab structures (similar pattern)
#[derive(Debug, Deserialize)]
struct GitLabIssue {
    pub id: u64,
    pub iid: u32,
    pub title: String,
    pub author: GitLabUser,
    pub state: String,
    pub labels: Vec<String>,
    pub web_url: String,
    pub closed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub assignees: Vec<GitLabUser>,
}

#[derive(Debug, Deserialize)]
struct GitLabMergeRequest {
    pub id: u64,
    pub iid: u32,
    pub title: String,
    pub author: GitLabUser,
    pub state: String,
    pub draft: bool,
    pub web_url: String,
    pub merged_at: Option<String>,
    pub closed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub assignees: Vec<GitLabUser>,
}

#[derive(Debug, Deserialize)]
struct GitLabPipeline {
    pub id: u64,
    pub status: String,
    pub web_url: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
struct GitLabUser {
    pub username: String,
}

embed_migrations!("migrations");

// Helper function to mask sensitive query parameters
fn mask_sensitive_url(url: &str) -> String {
    if url.contains("token=") || url.contains("access_token=") || url.contains("key=") {
        let mut masked_url = url.to_string();
        // Replace token values with masked version
        for pattern in &["token=", "access_token=", "key="] {
            if let Some(start) = masked_url.find(pattern) {
                let after_pattern = start + pattern.len();
                if let Some(end) = masked_url[after_pattern..].find('&') {
                    let end_pos = after_pattern + end;
                    masked_url.replace_range(after_pattern..end_pos, "***MASKED***");
                } else {
                    // Token is at the end of URL
                    masked_url = masked_url[..after_pattern].to_string() + "***MASKED***";
                }
            }
        }
        masked_url
    } else {
        url.to_string()
    }
}

pub struct Database {
    conn: Connection,
    sync_in_progress: AtomicBool,
}

impl Database {
    pub fn new<P: AsRef<Path>>(path: P) -> Result<Self, Box<dyn std::error::Error>> {
        info!("🗄️ Initializing SQLite database at: {:?}", path.as_ref());
        
        let mut conn = Connection::open(path.as_ref())?;
        debug!("✅ Database connection established");
        
        // Refineryを使用してマイグレーションを実行
        info!("🚀 Running database migrations");
        match migrations::runner().run(&mut conn) {
            Ok(report) => {
                info!("✅ Migrations completed successfully");
                info!("📊 Migration report: {} migrations applied", report.applied_migrations().len());
                for migration in report.applied_migrations() {
                    debug!("Applied migration: {}", migration.name());
                }
            }
            Err(e) => {
                error!("❌ Migration failed: {}", e);
                return Err(format!("Database migration failed: {}", e).into());
            }
        }
        
        let db = Database { 
            conn,
            sync_in_progress: AtomicBool::new(false),
        };
        
        // 起動時にsync_in_progressを確実にfalseにリセット
        db.sync_in_progress.store(false, Ordering::Release);
        info!("🔓 Sync lock reset on startup");
        
        info!("🎉 Database initialized successfully");
        Ok(db)
    }
    
    // デバッグ用: sync状態を確認・リセット
    pub fn get_sync_status(&self) -> bool {
        self.sync_in_progress.load(Ordering::Acquire)
    }
    
    pub fn reset_sync_lock(&self) {
        self.sync_in_progress.store(false, Ordering::Release);
        warn!("🔓 Sync lock manually reset");
    }

    // Provider operations
    pub fn get_providers(&self) -> Result<Vec<GitProvider>, Box<dyn std::error::Error>> {
        debug!("📋 Fetching all providers");
        
        let mut stmt = self.conn.prepare(
            "SELECT gp.id, gp.name, pt.code, gp.base_url, gp.token, gp.token_valid,
                    gp.created_at, gp.updated_at
             FROM git_providers gp
             JOIN provider_types pt ON gp.provider_type_id = pt.id
             ORDER BY gp.name"
        )?;

        let provider_iter = stmt.query_map([], |row| {
            Ok(GitProvider {
                id: row.get(0)?,
                name: row.get(1)?,
                provider_type: row.get(2)?,
                base_url: row.get(3)?,
                token: row.get(4)?,
                token_valid: row.get::<_, bool>(5).unwrap_or(false),
                created_at: row.get::<_, String>(6)?.parse().unwrap_or_else(|_| Utc::now()),
                updated_at: row.get::<_, String>(7)?.parse().unwrap_or_else(|_| Utc::now()),
            })
        })?;

        let mut providers = Vec::new();
        for provider in provider_iter {
            providers.push(provider?);
        }

        info!("📊 Found {} providers", providers.len());
        if !providers.is_empty() {
            debug!("Provider names: {:?}", providers.iter().map(|p| &p.name).collect::<Vec<_>>());
        }
        Ok(providers)
    }

    pub fn get_provider(&self, provider_id: i64) -> Result<GitProvider, Box<dyn std::error::Error + Send + Sync>> {
        debug!("🔍 Fetching provider: {}", provider_id);
        
        let provider = self.conn.query_row(
            "SELECT gp.id, gp.name, pt.code, gp.base_url, gp.token, gp.token_valid,
                    gp.created_at, gp.updated_at
             FROM git_providers gp
             JOIN provider_types pt ON gp.provider_type_id = pt.id
             WHERE gp.id = ?",
            [provider_id],
            |row| {
                Ok(GitProvider {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    provider_type: row.get(2)?,
                    base_url: row.get(3)?,
                    token: row.get(4)?,
                    token_valid: row.get::<_, bool>(5).unwrap_or(false),
                    created_at: row.get::<_, String>(6)?.parse().unwrap_or_else(|_| Utc::now()),
                    updated_at: row.get::<_, String>(7)?.parse().unwrap_or_else(|_| Utc::now()),
                })
            }
        )?;
        
        debug!("✅ Found provider: {} ({})", provider.name, provider.provider_type);
        Ok(provider)
    }

    pub fn add_provider(&mut self, provider: &GitProvider) -> Result<(), Box<dyn std::error::Error>> {
        info!("➕ Adding provider: {} ({})", provider.name, provider.provider_type);
        debug!("Provider details: url={}", provider.base_url);
        
        // Get provider_type_id from provider_types table
        let provider_type_id: i64 = self.conn.query_row(
            "SELECT id FROM provider_types WHERE code = ?",
            [&provider.provider_type],
            |row| row.get(0)
        )?;
        
        let result = self.conn.execute(
            "INSERT INTO git_providers (name, provider_type_id, base_url, token, token_valid, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params![
                &provider.name,
                provider_type_id,
                &provider.base_url,
                &provider.token,
                &provider.token_valid,
                &provider.created_at.to_rfc3339(),
                &provider.updated_at.to_rfc3339(),
            ],
        )?;
        
        debug!("Database insert affected {} rows", result);
        info!("✅ Provider added successfully: {}", provider.name);
        Ok(())
    }

    pub fn delete_provider(&mut self, provider_id: i64) -> Result<(), Box<dyn std::error::Error>> {
        info!("Deleting provider: {}", provider_id);
        
        // Delete provider (cascade will handle related repositories)
        self.conn.execute("DELETE FROM git_providers WHERE id = ?", [provider_id])?;
        
        info!("Provider deleted successfully");
        Ok(())
    }

    // Repository operations
    pub fn get_repositories(&self) -> Result<Vec<Repository>, Box<dyn std::error::Error>> {
        debug!("📋 Fetching all repositories");
        
        let mut stmt = self.conn.prepare(
            "SELECT r.id, r.api_id, r.name, r.full_name, r.description, r.provider_id,
                    r.web_url, r.is_private, r.language, r.last_activity, 
                    r.api_created_at, r.api_updated_at,
                    r.last_issues_sync, r.last_pull_requests_sync, r.last_workflows_sync,
                    ss_issues.code, ss_prs.code, ss_workflows.code,
                    r.created_at, r.updated_at,
                    p.name as provider_name, pt.code as provider_type
             FROM repositories r
             LEFT JOIN git_providers p ON r.provider_id = p.id
             LEFT JOIN provider_types pt ON p.provider_type_id = pt.id
             LEFT JOIN sync_statuses ss_issues ON r.last_issues_sync_status_id = ss_issues.id
             LEFT JOIN sync_statuses ss_prs ON r.last_pull_requests_sync_status_id = ss_prs.id
             LEFT JOIN sync_statuses ss_workflows ON r.last_workflows_sync_status_id = ss_workflows.id
             ORDER BY r.name"
        )?;

        let repo_iter = stmt.query_map([], |row| {
            Ok(Repository {
                id: row.get(0)?,
                api_id: row.get(1)?,
                name: row.get(2)?,
                full_name: row.get(3)?,
                description: row.get(4)?,
                provider_id: row.get(5)?,
                web_url: row.get(6)?,
                is_private: row.get(7)?,
                language: row.get(8)?,
                last_activity: match row.get::<_, Option<String>>(9)? {
                    Some(s) => s.parse().ok(),
                    None => None,
                },
                api_created_at: match row.get::<_, Option<String>>(10)? {
                    Some(s) => s.parse().ok(),
                    None => None,
                },
                api_updated_at: match row.get::<_, Option<String>>(11)? {
                    Some(s) => s.parse().ok(),
                    None => None,
                },
                
                // Resource-specific sync timestamps
                last_issues_sync: match row.get::<_, Option<String>>(12)? {
                    Some(s) => s.parse().ok(),
                    None => None,
                },
                last_pull_requests_sync: match row.get::<_, Option<String>>(13)? {
                    Some(s) => s.parse().ok(),
                    None => None,
                },
                last_workflows_sync: match row.get::<_, Option<String>>(14)? {
                    Some(s) => s.parse().ok(),
                    None => None,
                },
                
                // Resource-specific sync status
                last_issues_sync_status: row.get(15)?,
                last_pull_requests_sync_status: row.get(16)?,
                last_workflows_sync_status: row.get(17)?,
                
                created_at: row.get::<_, String>(18)?.parse().unwrap_or_else(|_| Utc::now()),
                updated_at: row.get::<_, String>(19)?.parse().unwrap_or_else(|_| Utc::now()),
                provider_name: row.get::<_, Option<String>>(20)?.unwrap_or_else(|| "Unknown".to_string()),
                provider_type: row.get::<_, Option<String>>(21)?.unwrap_or_else(|| "unknown".to_string()),
            })
        })?;

        let mut repositories = Vec::new();
        for repo in repo_iter {
            repositories.push(repo?);
        }

        info!("📊 Found {} repositories", repositories.len());
        if !repositories.is_empty() {
            debug!("Repository names: {:?}", repositories.iter().map(|r| &r.name).collect::<Vec<_>>());
        }
        Ok(repositories)
    }

    pub fn get_repositories_by_provider(&self, provider_id: i64) -> Result<Vec<Repository>, Box<dyn std::error::Error + Send + Sync>> {
        info!("Fetching repositories for provider: {}", provider_id);
        
        let mut stmt = self.conn.prepare(
            "SELECT r.id, r.api_id, r.name, r.full_name, r.description, r.provider_id,
                    r.web_url, r.is_private, r.language, r.last_activity, 
                    r.api_created_at, r.api_updated_at,
                    r.last_issues_sync, r.last_pull_requests_sync, r.last_workflows_sync,
                    ss_issues.code, ss_prs.code, ss_workflows.code,
                    r.created_at, r.updated_at,
                    p.name as provider_name, pt.code as provider_type
             FROM repositories r
             LEFT JOIN git_providers p ON r.provider_id = p.id
             LEFT JOIN provider_types pt ON p.provider_type_id = pt.id
             LEFT JOIN sync_statuses ss_issues ON r.last_issues_sync_status_id = ss_issues.id
             LEFT JOIN sync_statuses ss_prs ON r.last_pull_requests_sync_status_id = ss_prs.id
             LEFT JOIN sync_statuses ss_workflows ON r.last_workflows_sync_status_id = ss_workflows.id
             WHERE r.provider_id = ?
             ORDER BY r.name"
        )?;

        let repo_iter = stmt.query_map([provider_id], |row| {
            Ok(Repository {
                id: row.get(0)?,
                api_id: row.get(1)?,
                name: row.get(2)?,
                full_name: row.get(3)?,
                description: row.get(4)?,
                provider_id: row.get(5)?,
                web_url: row.get(6)?,
                is_private: row.get(7)?,
                language: row.get(8)?,
                last_activity: match row.get::<_, Option<String>>(9)? {
                    Some(s) => s.parse().ok(),
                    None => None,
                },
                api_created_at: match row.get::<_, Option<String>>(10)? {
                    Some(s) => s.parse().ok(),
                    None => None,
                },
                api_updated_at: match row.get::<_, Option<String>>(11)? {
                    Some(s) => s.parse().ok(),
                    None => None,
                },
                
                // Resource-specific sync timestamps
                last_issues_sync: match row.get::<_, Option<String>>(12)? {
                    Some(s) => s.parse().ok(),
                    None => None,
                },
                last_pull_requests_sync: match row.get::<_, Option<String>>(13)? {
                    Some(s) => s.parse().ok(),
                    None => None,
                },
                last_workflows_sync: match row.get::<_, Option<String>>(14)? {
                    Some(s) => s.parse().ok(),
                    None => None,
                },
                
                // Resource-specific sync status
                last_issues_sync_status: row.get(15)?,
                last_pull_requests_sync_status: row.get(16)?,
                last_workflows_sync_status: row.get(17)?,
                
                created_at: row.get::<_, String>(18)?.parse().unwrap_or_else(|_| Utc::now()),
                updated_at: row.get::<_, String>(19)?.parse().unwrap_or_else(|_| Utc::now()),
                provider_name: row.get::<_, Option<String>>(20)?.unwrap_or_else(|| "Unknown".to_string()),
                provider_type: row.get::<_, Option<String>>(21)?.unwrap_or_else(|| "unknown".to_string()),
            })
        })?;

        let mut repositories = Vec::new();
        for repo in repo_iter {
            repositories.push(repo?);
        }

        info!("Found {} repositories for provider {}", repositories.len(), provider_id);
        Ok(repositories)
    }

    pub fn get_repository(&self, repository_id: i64) -> Result<Repository, Box<dyn std::error::Error>> {
        info!("Fetching repository: {}", repository_id);
        
        let repository = self.conn.query_row(
            "SELECT r.id, r.api_id, r.name, r.full_name, r.description, r.provider_id,
                    r.web_url, r.is_private, r.language, r.last_activity, 
                    r.api_created_at, r.api_updated_at, r.created_at, r.updated_at,
                    p.name as provider_name, pt.code as provider_type,
                    r.last_issues_sync, r.last_pull_requests_sync, r.last_workflows_sync,
                    iss.code as last_issues_sync_status, prs.code as last_pull_requests_sync_status, wfs.code as last_workflows_sync_status
             FROM repositories r
             LEFT JOIN git_providers p ON r.provider_id = p.id
             LEFT JOIN provider_types pt ON p.provider_type_id = pt.id
             LEFT JOIN sync_statuses iss ON r.last_issues_sync_status_id = iss.id
             LEFT JOIN sync_statuses prs ON r.last_pull_requests_sync_status_id = prs.id
             LEFT JOIN sync_statuses wfs ON r.last_workflows_sync_status_id = wfs.id
             WHERE r.id = ?",
            [repository_id],
            |row| {
                Ok(Repository {
                    id: row.get(0)?,
                    api_id: row.get(1)?,
                    name: row.get(2)?,
                    full_name: row.get(3)?,
                    description: row.get(4)?,
                    provider_id: row.get(5)?,
                    web_url: row.get(6)?,
                    is_private: row.get(7)?,
                    language: row.get(8)?,
                    last_activity: match row.get::<_, Option<String>>(9)? {
                        Some(s) => s.parse().ok(),
                        None => None,
                    },
                    api_created_at: match row.get::<_, Option<String>>(10)? {
                        Some(s) => s.parse().ok(),
                        None => None,
                    },
                    api_updated_at: match row.get::<_, Option<String>>(11)? {
                        Some(s) => s.parse().ok(),
                        None => None,
                    },
                    created_at: row.get::<_, String>(12)?.parse().unwrap_or_else(|_| Utc::now()),
                    updated_at: row.get::<_, String>(13)?.parse().unwrap_or_else(|_| Utc::now()),
                    provider_name: row.get::<_, Option<String>>(14)?.unwrap_or_else(|| "Unknown".to_string()),
                    provider_type: row.get::<_, Option<String>>(15)?.unwrap_or_else(|| "unknown".to_string()),
                    
                    // Resource-specific sync timestamps
                    last_issues_sync: match row.get::<_, Option<String>>(16)? {
                        Some(s) => s.parse().ok(),
                        None => None,
                    },
                    last_pull_requests_sync: match row.get::<_, Option<String>>(17)? {
                        Some(s) => s.parse().ok(),
                        None => None,
                    },
                    last_workflows_sync: match row.get::<_, Option<String>>(18)? {
                        Some(s) => s.parse().ok(),
                        None => None,
                    },
                    
                    // Resource-specific sync status
                    last_issues_sync_status: row.get::<_, Option<String>>(19)?,
                    last_pull_requests_sync_status: row.get::<_, Option<String>>(20)?,
                    last_workflows_sync_status: row.get::<_, Option<String>>(21)?,
                })
            }
        )?;

        Ok(repository)
    }

    pub fn add_repository(&mut self, repository: &Repository) -> Result<(), Box<dyn std::error::Error>> {
        info!("➕ Adding repository: {} ({})", repository.name, repository.provider_name);
        debug!("Repository details: api_id={}, url={}, private={}", 
            repository.api_id, repository.web_url, repository.is_private);
        
        let result = self.conn.execute(
            "INSERT INTO repositories 
             (provider_id, api_id, name, full_name, description, web_url, is_private, 
              language, last_activity, api_created_at, api_updated_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params![
                &repository.provider_id,
                &repository.api_id,
                &repository.name,
                &repository.full_name,
                &repository.description,
                &repository.web_url,
                &repository.is_private,
                &repository.language,
                repository.last_activity.as_ref().map(|dt| dt.to_rfc3339()),
                repository.api_created_at.as_ref().map(|dt| dt.to_rfc3339()),
                repository.api_updated_at.as_ref().map(|dt| dt.to_rfc3339()),
                &repository.created_at.to_rfc3339(),
                &repository.updated_at.to_rfc3339(),
            ],
        )?;
        
        debug!("Database insert affected {} rows", result);
        info!("✅ Repository added successfully: {}", repository.name);
        Ok(())
    }

    pub fn delete_repository(&mut self, repository_id: i64) -> Result<(), Box<dyn std::error::Error>> {
        info!("Deleting repository: {}", repository_id);
        
        self.conn.execute("DELETE FROM repositories WHERE id = ?", [repository_id])?;
        
        info!("Repository deleted successfully");
        Ok(())
    }

    // Issue operations with pagination
    pub fn get_issues(&self, filters: &Option<IssueFilters>, pagination: &Option<PaginationParams>) -> Result<PaginatedResponse<Issue>, Box<dyn std::error::Error>> {
        debug!("📋 Fetching issues with filters and pagination");
        if let Some(f) = filters {
            debug!("Filters applied: state={:?}, assigned={:?}, provider={:?}", 
                f.state, f.assigned, f.provider);
        }
        if let Some(p) = pagination {
            debug!("Pagination: page={}, per_page={}", p.page, p.per_page);
        }
        
        let mut query = "SELECT i.id, i.api_id, i.title, i.number, r.name as repository, pt.code as provider, i.assigned_to_me, i.author, ist.code as state, i.labels, i.api_created_at, i.api_updated_at, i.created_at, i.updated_at, i.url, i.closed_at, i.repository_id FROM issues i JOIN repositories r ON i.repository_id = r.id JOIN git_providers gp ON r.provider_id = gp.id JOIN provider_types pt ON gp.provider_type_id = pt.id JOIN issue_states ist ON i.state_id = ist.id".to_string();
        let mut conditions = Vec::new();
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(f) = filters {
            if let Some(state) = &f.state {
                if !state.is_empty() {
                    conditions.push("ist.code = ?");
                    params.push(Box::new(state.clone()));
                }
            }
            if let Some(assigned) = &f.assigned {
                if !assigned.is_empty() {
                    if assigned == "me" {
                        conditions.push("i.assigned_to_me = true");
                    } else {
                        conditions.push("i.author = ?");
                        params.push(Box::new(assigned.clone()));
                    }
                }
            }
            if let Some(provider) = &f.provider {
                if !provider.is_empty() {
                    conditions.push("pt.code = ?");
                    params.push(Box::new(provider.clone()));
                }
            }
            if let Some(repository) = &f.repository {
                if !repository.is_empty() {
                    conditions.push("r.name = ?");
                    params.push(Box::new(repository.clone()));
                }
            }
            if let Some(search) = &f.search {
                if !search.is_empty() {
                    conditions.push("(i.title LIKE ? OR i.author LIKE ?)");
                    let search_term = format!("%{}%", search);
                    params.push(Box::new(search_term.clone()));
                    params.push(Box::new(search_term));
                }
            }
        }

        if !conditions.is_empty() {
            query.push_str(" WHERE ");
            query.push_str(&conditions.join(" AND "));
        }

        // Count total for pagination
        let count_query = format!("SELECT COUNT(*) FROM ({}) AS counted", query);
        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        let total: u32 = self.conn.query_row(&count_query, param_refs.as_slice(), |row| row.get::<_, i64>(0))? as u32;

        // Apply pagination
        let page = pagination.as_ref().map(|p| p.page).unwrap_or(1);
        let per_page = pagination.as_ref().map(|p| p.per_page).unwrap_or(10);
        
        // Handle edge cases for per_page
        if per_page == 0 {
            return Ok(PaginatedResponse {
                data: Vec::new(),
                pagination: PaginationInfo {
                    page,
                    per_page,
                    total,
                    total_pages: 0,
                }
            });
        }

        let total_pages = total.checked_add(per_page).and_then(|t| t.checked_sub(1))
            .map(|t| t / per_page)
            .unwrap_or(1);

        // Handle overflow in pagination calculation
        let offset = match page.checked_sub(1).and_then(|p| p.checked_mul(per_page)) {
            Some(offset) => offset,
            None => {
                return Ok(PaginatedResponse {
                    data: Vec::new(),
                    pagination: PaginationInfo { page, per_page, total, total_pages }
                });
            }
        };

        query.push_str(" ORDER BY i.created_at DESC LIMIT ? OFFSET ?");
        params.push(Box::new(per_page));
        params.push(Box::new(offset));

        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        let mut stmt = self.conn.prepare(&query)?;
        
        let issue_iter = stmt.query_map(param_refs.as_slice(), |row| {
            let labels_str: String = row.get(9)?;
            let labels: Vec<String> = serde_json::from_str(&labels_str).unwrap_or_else(|_| Vec::new());
            
            Ok(Issue {
                id: row.get(0)?,
                api_id: row.get(1)?,
                title: row.get(2)?,
                number: row.get::<_, i64>(3)? as u32,
                repository: row.get(4)?,
                provider: row.get(5)?,
                assigned_to_me: row.get(6)?,
                author: row.get(7)?,
                state: row.get(8)?,
                labels,
                url: row.get(14)?,
                closed_at: match row.get::<_, Option<String>>(15)? {
                    Some(s) => s.parse().ok(),
                    None => None,
                },
                api_created_at: match row.get::<_, Option<String>>(10)? {
                    Some(s) => s.parse().ok(),
                    None => None,
                },
                api_updated_at: match row.get::<_, Option<String>>(11)? {
                    Some(s) => s.parse().ok(),
                    None => None,
                },
                created_at: row.get::<_, String>(12)?.parse().unwrap_or_else(|_| Utc::now()),
                updated_at: row.get::<_, String>(13)?.parse().unwrap_or_else(|_| Utc::now()),
                repository_id: row.get(16)?,
            })
        })?;

        let mut issues = Vec::new();
        for issue in issue_iter {
            issues.push(issue?);
        }

        info!("📊 Found {} issues (page {} of {}, total: {})", issues.len(), page, total_pages, total);
        if !issues.is_empty() {
            debug!("Issue titles: {:?}", issues.iter().take(3).map(|i| &i.title).collect::<Vec<_>>());
        }
        
        Ok(PaginatedResponse {
            data: issues,
            pagination: PaginationInfo {
                page,
                per_page,
                total,
                total_pages,
            }
        })
    }

    // Stub implementations for other methods to maintain compatibility
    pub fn get_issue(&self, issue_id: i64) -> Result<Issue, Box<dyn std::error::Error>> {
        let query = "SELECT i.id, i.api_id, i.repository_id, i.number, i.title, 
                            r.name as repository, p.name as provider, i.assigned_to_me, i.author, 
                            ist.code as state, i.labels, i.url, i.closed_at, 
                            i.api_created_at, i.api_updated_at, i.created_at, i.updated_at
                     FROM issues i
                     JOIN repositories r ON i.repository_id = r.id
                     JOIN git_providers p ON r.provider_id = p.id
                     JOIN issue_states ist ON i.state_id = ist.id
                     WHERE i.id = ?";
        
        self.conn.query_row(query, [issue_id], |row| {
            let labels_str: String = row.get("labels").unwrap_or_default();
            let labels: Vec<String> = if labels_str.is_empty() {
                Vec::new()
            } else {
                serde_json::from_str(&labels_str).unwrap_or_default()
            };
            
            Ok(Issue {
                id: row.get("id")?,
                api_id: row.get("api_id")?,
                repository_id: row.get("repository_id")?,
                number: row.get("number")?,
                title: row.get("title")?,
                repository: row.get("repository")?,
                provider: row.get("provider")?,
                assigned_to_me: row.get("assigned_to_me")?,
                author: row.get("author")?,
                state: row.get("state")?,
                labels,
                url: row.get("url")?,
                closed_at: row.get("closed_at")?,
                api_created_at: row.get("api_created_at")?,
                api_updated_at: row.get("api_updated_at")?,
                created_at: row.get("created_at")?,
                updated_at: row.get("updated_at")?,
            })
        }).map_err(|e| e.into())
    }

    pub fn get_issue_stats(&self, _filters: &Option<IssueFilters>) -> Result<IssueStats, Box<dyn std::error::Error>> {
        let total: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM issues", 
            [], 
            |row| row.get(0)
        )?;
        
        let open: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM issues i JOIN issue_states ist ON i.state_id = ist.id WHERE ist.code = 'open'", 
            [], 
            |row| row.get(0)
        )?;
        
        let closed: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM issues i JOIN issue_states ist ON i.state_id = ist.id WHERE ist.code = 'closed'", 
            [], 
            |row| row.get(0)
        )?;

        Ok(IssueStats {
            total: total as u32,
            open: open as u32,
            closed: closed as u32,
        })
    }

    pub fn get_pull_requests(&self, filters: &Option<PullRequestFilters>, pagination: &Option<PaginationParams>) -> Result<PaginatedResponse<PullRequest>, Box<dyn std::error::Error>> {
        let mut query = String::from(
            "SELECT pr.id, pr.api_id, pr.repository_id, pr.number, pr.title, 
                    r.name as repository, p.name as provider, pr.assigned_to_me, pr.author, 
                    ps.code as state, pr.draft, pr.url, pr.merged_at, pr.closed_at, 
                    pr.api_created_at, pr.api_updated_at, pr.created_at, pr.updated_at
             FROM pull_requests pr
             JOIN repositories r ON pr.repository_id = r.id
             JOIN git_providers p ON r.provider_id = p.id
             JOIN pr_states ps ON pr.state_id = ps.id"
        );
        
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        let mut where_clauses = Vec::new();
        
        if let Some(f) = filters {
            if let Some(state) = &f.state {
                if state != "all" {
                    where_clauses.push("ps.code = ?");
                    params.push(Box::new(state.clone()));
                }
            }
            if let Some(assigned) = &f.assigned {
                if assigned == "me" {
                    where_clauses.push("pr.assigned_to_me = 1");
                }
            }
            if let Some(provider) = &f.provider {
                where_clauses.push("p.name = ?");
                params.push(Box::new(provider.clone()));
            }
            if let Some(repository) = &f.repository {
                where_clauses.push("r.name = ?");
                params.push(Box::new(repository.clone()));
            }
            if let Some(search) = &f.search {
                where_clauses.push("(pr.title LIKE ? OR pr.author LIKE ?)");
                let search_pattern = format!("%{}%", search);
                params.push(Box::new(search_pattern.clone()));
                params.push(Box::new(search_pattern));
            }
        }
        
        if !where_clauses.is_empty() {
            query.push_str(" WHERE ");
            query.push_str(&where_clauses.join(" AND "));
        }
        
        let count_query = format!("SELECT COUNT(*) FROM ({}) AS count_subquery", query);
        
        let total: i64 = {
            let mut stmt = self.conn.prepare(&count_query)?;
            let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
            stmt.query_row(&param_refs[..], |row| row.get(0))?
        };
        
        query.push_str(" ORDER BY pr.api_created_at DESC");
        
        let (page, per_page) = if let Some(p) = pagination {
            (p.page, p.per_page)
        } else {
            (1, 10)
        };
        
        let offset = (page - 1) * per_page;
        query.push_str(&format!(" LIMIT {} OFFSET {}", per_page, offset));
        
        let mut stmt = self.conn.prepare(&query)?;
        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        let rows = stmt.query_map(&param_refs[..], |row| {
            Ok(PullRequest {
                id: row.get("id")?,
                api_id: row.get("api_id")?,
                repository_id: row.get("repository_id")?,
                number: row.get("number")?,
                title: row.get("title")?,
                repository: row.get("repository")?,
                provider: row.get("provider")?,
                assigned_to_me: row.get("assigned_to_me")?,
                author: row.get("author")?,
                state: row.get("state")?,
                draft: row.get("draft")?,
                url: row.get("url")?,
                merged_at: row.get("merged_at")?,
                closed_at: row.get("closed_at")?,
                api_created_at: row.get("api_created_at")?,
                api_updated_at: row.get("api_updated_at")?,
                created_at: row.get("created_at")?,
                updated_at: row.get("updated_at")?,
            })
        })?;
        
        let mut pull_requests = Vec::new();
        for row in rows {
            pull_requests.push(row?);
        }
        
        Ok(PaginatedResponse {
            data: pull_requests,
            pagination: PaginationInfo {
                page,
                per_page,
                total: total as u32,
                total_pages: ((total as f64) / (per_page as f64)).ceil() as u32,
            },
        })
    }

    pub fn get_pull_request(&self, pr_id: i64) -> Result<PullRequest, Box<dyn std::error::Error>> {
        let query = "SELECT pr.id, pr.api_id, pr.repository_id, pr.number, pr.title, 
                            r.name as repository, p.name as provider, pr.assigned_to_me, pr.author, 
                            ps.code as state, pr.draft, pr.url, pr.merged_at, pr.closed_at, 
                            pr.api_created_at, pr.api_updated_at, pr.created_at, pr.updated_at
                     FROM pull_requests pr
                     JOIN repositories r ON pr.repository_id = r.id
                     JOIN git_providers p ON r.provider_id = p.id
                     JOIN pr_states ps ON pr.state_id = ps.id
                     WHERE pr.id = ?";
        
        self.conn.query_row(query, [pr_id], |row| {
            Ok(PullRequest {
                id: row.get("id")?,
                api_id: row.get("api_id")?,
                repository_id: row.get("repository_id")?,
                number: row.get("number")?,
                title: row.get("title")?,
                repository: row.get("repository")?,
                provider: row.get("provider")?,
                assigned_to_me: row.get("assigned_to_me")?,
                author: row.get("author")?,
                state: row.get("state")?,
                draft: row.get("draft")?,
                url: row.get("url")?,
                merged_at: row.get("merged_at")?,
                closed_at: row.get("closed_at")?,
                api_created_at: row.get("api_created_at")?,
                api_updated_at: row.get("api_updated_at")?,
                created_at: row.get("created_at")?,
                updated_at: row.get("updated_at")?,
            })
        }).map_err(|e| e.into())
    }

    pub fn get_pull_request_stats(&self, filters: &Option<PullRequestFilters>) -> Result<PullRequestStats, Box<dyn std::error::Error>> {
        let mut base_query = String::from(
            "FROM pull_requests pr
             JOIN repositories r ON pr.repository_id = r.id
             JOIN git_providers p ON r.provider_id = p.id
             JOIN pr_states ps ON pr.state_id = ps.id"
        );
        
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        let mut where_clauses = Vec::new();
        
        if let Some(f) = filters {
            if let Some(provider) = &f.provider {
                where_clauses.push("p.name = ?");
                params.push(Box::new(provider.clone()));
            }
            if let Some(repository) = &f.repository {
                where_clauses.push("r.name = ?");
                params.push(Box::new(repository.clone()));
            }
        }
        
        if !where_clauses.is_empty() {
            base_query.push_str(" WHERE ");
            base_query.push_str(&where_clauses.join(" AND "));
        }
        
        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        
        let total: i64 = {
            let query = format!("SELECT COUNT(*) {}", base_query);
            let mut stmt = self.conn.prepare(&query)?;
            stmt.query_row(&param_refs[..], |row| row.get(0))?
        };
        
        let open: i64 = {
            let query = format!("SELECT COUNT(*) {} AND ps.code = 'open'", base_query);
            let mut stmt = self.conn.prepare(&query)?;
            stmt.query_row(&param_refs[..], |row| row.get(0))?
        };
        
        let closed: i64 = {
            let query = format!("SELECT COUNT(*) {} AND ps.code = 'closed'", base_query);
            let mut stmt = self.conn.prepare(&query)?;
            stmt.query_row(&param_refs[..], |row| row.get(0))?
        };
        
        let merged: i64 = {
            let query = format!("SELECT COUNT(*) {} AND ps.code = 'merged'", base_query);
            let mut stmt = self.conn.prepare(&query)?;
            stmt.query_row(&param_refs[..], |row| row.get(0))?
        };
        
        Ok(PullRequestStats {
            total: total as u32,
            open: open as u32,
            closed: closed as u32,
            merged: merged as u32,
        })
    }

    pub fn get_workflows(&self, filters: &Option<WorkflowFilters>, pagination: &Option<PaginationParams>) -> Result<PaginatedResponse<WorkflowRun>, Box<dyn std::error::Error>> {
        let mut query = String::from(
            "SELECT w.id, w.api_id, w.repository_id, w.name, 
                    r.name as repository, p.name as provider, ws.code as status, 
                    wc.code as conclusion, w.url, w.api_created_at, w.api_updated_at, 
                    w.created_at, w.updated_at
             FROM workflow_runs w
             JOIN repositories r ON w.repository_id = r.id
             JOIN git_providers p ON r.provider_id = p.id
             JOIN workflow_statuses ws ON w.status_id = ws.id
             LEFT JOIN workflow_conclusions wc ON w.conclusion_id = wc.id"
        );
        
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        let mut where_clauses = Vec::new();
        
        if let Some(f) = filters {
            if let Some(status) = &f.status {
                if status != "all" {
                    where_clauses.push("ws.code = ?");
                    params.push(Box::new(status.clone()));
                }
            }
            if let Some(provider) = &f.provider {
                where_clauses.push("p.name = ?");
                params.push(Box::new(provider.clone()));
            }
            if let Some(repository) = &f.repository {
                where_clauses.push("r.name = ?");
                params.push(Box::new(repository.clone()));
            }
            if let Some(search) = &f.search {
                where_clauses.push("w.name LIKE ?");
                let search_pattern = format!("%{}%", search);
                params.push(Box::new(search_pattern));
            }
        }
        
        if !where_clauses.is_empty() {
            query.push_str(" WHERE ");
            query.push_str(&where_clauses.join(" AND "));
        }
        
        let count_query = format!("SELECT COUNT(*) FROM ({}) AS count_subquery", query);
        
        let total: i64 = {
            let mut stmt = self.conn.prepare(&count_query)?;
            let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
            stmt.query_row(&param_refs[..], |row| row.get(0))?
        };
        
        query.push_str(" ORDER BY w.api_created_at DESC");
        
        let (page, per_page) = if let Some(p) = pagination {
            (p.page, p.per_page)
        } else {
            (1, 10)
        };
        
        let offset = (page - 1) * per_page;
        query.push_str(&format!(" LIMIT {} OFFSET {}", per_page, offset));
        
        let mut stmt = self.conn.prepare(&query)?;
        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        let rows = stmt.query_map(&param_refs[..], |row| {
            Ok(WorkflowRun {
                id: row.get("id")?,
                api_id: row.get("api_id")?,
                repository_id: row.get("repository_id")?,
                name: row.get("name")?,
                repository: row.get("repository")?,
                provider: row.get("provider")?,
                status: row.get("status")?,
                conclusion: row.get("conclusion")?,
                url: row.get("url")?,
                api_created_at: row.get("api_created_at")?,
                api_updated_at: row.get("api_updated_at")?,
                created_at: row.get("created_at")?,
                updated_at: row.get("updated_at")?,
            })
        })?;
        
        let mut workflows = Vec::new();
        for row in rows {
            workflows.push(row?);
        }
        
        Ok(PaginatedResponse {
            data: workflows,
            pagination: PaginationInfo {
                page,
                per_page,
                total: total as u32,
                total_pages: ((total as f64) / (per_page as f64)).ceil() as u32,
            },
        })
    }

    pub fn get_workflow(&self, workflow_id: i64) -> Result<WorkflowRun, Box<dyn std::error::Error>> {
        let query = "SELECT w.id, w.api_id, w.repository_id, w.name, 
                            r.name as repository, p.name as provider, ws.code as status, 
                            wc.code as conclusion, w.url, w.api_created_at, w.api_updated_at, 
                            w.created_at, w.updated_at
                     FROM workflow_runs w
                     JOIN repositories r ON w.repository_id = r.id
                     JOIN git_providers p ON r.provider_id = p.id
                     JOIN workflow_statuses ws ON w.status_id = ws.id
                     LEFT JOIN workflow_conclusions wc ON w.conclusion_id = wc.id
                     WHERE w.id = ?";
        
        self.conn.query_row(query, [workflow_id], |row| {
            Ok(WorkflowRun {
                id: row.get("id")?,
                api_id: row.get("api_id")?,
                repository_id: row.get("repository_id")?,
                name: row.get("name")?,
                repository: row.get("repository")?,
                provider: row.get("provider")?,
                status: row.get("status")?,
                conclusion: row.get("conclusion")?,
                url: row.get("url")?,
                api_created_at: row.get("api_created_at")?,
                api_updated_at: row.get("api_updated_at")?,
                created_at: row.get("created_at")?,
                updated_at: row.get("updated_at")?,
            })
        }).map_err(|e| e.into())
    }

    pub fn get_workflow_stats(&self, filters: &Option<WorkflowFilters>) -> Result<WorkflowStats, Box<dyn std::error::Error>> {
        let mut base_query = String::from(
            "FROM workflow_runs w
             JOIN repositories r ON w.repository_id = r.id
             JOIN git_providers p ON r.provider_id = p.id
             JOIN workflow_statuses ws ON w.status_id = ws.id"
        );
        
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        let mut where_clauses = Vec::new();
        
        if let Some(f) = filters {
            if let Some(provider) = &f.provider {
                where_clauses.push("p.name = ?");
                params.push(Box::new(provider.clone()));
            }
            if let Some(repository) = &f.repository {
                where_clauses.push("r.name = ?");
                params.push(Box::new(repository.clone()));
            }
        }
        
        if !where_clauses.is_empty() {
            base_query.push_str(" WHERE ");
            base_query.push_str(&where_clauses.join(" AND "));
        }
        
        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        
        let total: i64 = {
            let query = format!("SELECT COUNT(*) {}", base_query);
            let mut stmt = self.conn.prepare(&query)?;
            stmt.query_row(&param_refs[..], |row| row.get(0))?
        };
        
        let success: i64 = {
            let query = format!("SELECT COUNT(*) {} AND ws.code = 'success'", base_query);
            let mut stmt = self.conn.prepare(&query)?;
            stmt.query_row(&param_refs[..], |row| row.get(0))?
        };
        
        let failure: i64 = {
            let query = format!("SELECT COUNT(*) {} AND ws.code = 'failure'", base_query);
            let mut stmt = self.conn.prepare(&query)?;
            stmt.query_row(&param_refs[..], |row| row.get(0))?
        };
        
        let in_progress: i64 = {
            let query = format!("SELECT COUNT(*) {} AND ws.code = 'in_progress'", base_query);
            let mut stmt = self.conn.prepare(&query)?;
            stmt.query_row(&param_refs[..], |row| row.get(0))?
        };
        
        let cancelled: i64 = {
            let query = format!("SELECT COUNT(*) {} AND ws.code = 'cancelled'", base_query);
            let mut stmt = self.conn.prepare(&query)?;
            stmt.query_row(&param_refs[..], |row| row.get(0))?
        };
        
        Ok(WorkflowStats {
            total: total as u32,
            success: success as u32,
            failure: failure as u32,
            in_progress: in_progress as u32,
            cancelled: cancelled as u32,
        })
    }

    // Internal sync provider logic without sync_in_progress check
    async fn sync_provider_internal(&mut self, provider_id: i64) -> Result<(), String> {
        info!("🔄 Starting internal sync for provider: {}", provider_id);
        
        // Step 1: Get provider information
        let provider = self.get_provider(provider_id).map_err(|e| {
            format!("Failed to get provider: {}", e)
        })?;
        info!("📋 Provider info: {} ({})", provider.name, provider.provider_type);
        
        // Step 2: Validate token
        if !provider.token_valid || provider.token.is_none() {
            warn!("❌ Provider {} has invalid or missing token", provider_id);
            return Err("Provider token is invalid or missing".to_string());
        }
        
        // Step 3: Get repositories for this provider first to check sync times
        let repositories = self.get_repositories_by_provider(provider_id).map_err(|e| {
            format!("Failed to get repositories: {}", e)
        })?;
        
        // Use the earliest sync time across all repositories and resource types
        let last_sync_time = repositories.iter()
            .flat_map(|repo| [repo.last_issues_sync, repo.last_pull_requests_sync, repo.last_workflows_sync])
            .filter_map(|dt| dt)
            .min();
        
        let since = last_sync_time.map(|dt| dt.to_rfc3339());
        info!("📅 Last sync time (earliest across {} repositories): {:?}", repositories.len(), since);
        info!("📁 Found {} repositories to sync", repositories.len());
        
        let mut total_synced = 0;
        let mut errors = Vec::new();
        
        // Step 4: Sync each repository
        for repo in &repositories {
            info!("🔄 Syncing repository: {} ({})", repo.name, repo.id);
            
            match self.sync_repository_data(&provider, repo, since.as_deref()).await {
                Ok(synced_count) => {
                    total_synced += synced_count;
                    info!("✅ Synced {} items from {}", synced_count, repo.name);
                }
                Err(e) => {
                    error!("❌ Failed to sync repository {}: {}", repo.name, e);
                    errors.push(format!("{}: {}", repo.name, e));
                }
            }
        }
        
        if errors.is_empty() {
            info!("✅ Provider sync completed successfully: {} ({} items synced from {} repositories)", 
                  provider_id, total_synced, repositories.len());
            Ok(())
        } else {
            warn!("⚠️ Provider sync completed with errors: {} errors from {} repositories", 
                  errors.len(), repositories.len());
            error!("❌ Sync errors: {}", errors.join("; "));
            Err(format!("Sync completed with errors: {}", errors.join(", ")))
        }
    }

    pub async fn sync_provider(&mut self, provider_id: i64) -> Result<(), String> {
        // Check if sync is already in progress
        let current_state = self.sync_in_progress.load(Ordering::Acquire);
        info!("🔍 Sync status check - Current state: {}, Provider: {}", current_state, provider_id);
        
        if self.sync_in_progress.compare_exchange(false, true, Ordering::Acquire, Ordering::Relaxed).is_err() {
            warn!("🚫 Sync already in progress, skipping provider: {}", provider_id);
            return Err("Sync already in progress".to_string());
        }

        // Get provider name for history
        let provider_name = match self.conn.query_row("SELECT name FROM git_providers WHERE id = ?", [provider_id], |row| {
            Ok(row.get::<_, String>(0)?)
        }) {
            Ok(name) => name,
            Err(_) => format!("Provider {}", provider_id)
        };

        // Create sync history record
        let history_id = match self.create_sync_history("provider", Some(provider_id), &provider_name) {
            Ok(id) => {
                info!("📝 Created sync history record: {}", id);
                Some(id)
            }
            Err(e) => {
                error!("Failed to create sync history: {}", e);
                None
            }
        };

        // Use the internal sync logic
        let result = self.sync_provider_internal(provider_id).await;
        
        // Update sync history record
        if let Some(history_id) = history_id {
            match &result {
                Ok(()) => {
                    if let Err(e) = self.update_sync_history_completed(history_id, 10, 1, 0) {
                        error!("Failed to update sync history (completed): {}", e);
                    }
                }
                Err(error_message) => {
                    if let Err(e) = self.update_sync_history_failed(history_id, error_message) {
                        error!("Failed to update sync history (failed): {}", e);
                    }
                }
            }
        }
        
        // Always release the sync lock
        self.sync_in_progress.store(false, Ordering::Release);
        
        result
    }

    async fn sync_repository_data(&mut self, provider: &GitProvider, repo: &Repository, since: Option<&str>) -> Result<u32, Box<dyn std::error::Error + Send + Sync>> {
        let mut synced_count = 0u32;
        
        match provider.provider_type.as_str() {
            "github" => {
                // Sync GitHub issues
                let issues = self.fetch_github_issues(provider, repo, since).await?;
                for issue in &issues {
                    self.upsert_issue_from_github(issue, repo, provider)?;
                    synced_count += 1;
                }
                info!("📝 Synced {} GitHub issues", issues.len());
                
                // Sync GitHub pull requests
                let prs = self.fetch_github_pull_requests(provider, repo, since).await?;
                for pr in &prs {
                    self.upsert_pr_from_github(pr, repo, provider)?;
                    synced_count += 1;
                }
                info!("🔀 Synced {} GitHub pull requests", prs.len());
                
                // Sync GitHub workflows
                let workflows = self.fetch_github_workflows(provider, repo, since).await?;
                for workflow in &workflows {
                    self.upsert_workflow_from_github(workflow, repo, provider)?;
                    synced_count += 1;
                }
                info!("⚙️ Synced {} GitHub workflows", workflows.len());
            }
            "gitlab" => {
                // Sync GitLab issues
                let issues = self.fetch_gitlab_issues(provider, repo, since).await?;
                for issue in &issues {
                    self.upsert_issue_from_gitlab(issue, repo, provider)?;
                    synced_count += 1;
                }
                info!("📝 Synced {} GitLab issues", issues.len());
                
                // Sync GitLab merge requests
                let mrs = self.fetch_gitlab_merge_requests(provider, repo, since).await?;
                for mr in &mrs {
                    self.upsert_mr_from_gitlab(mr, repo, provider)?;
                    synced_count += 1;
                }
                info!("🔀 Synced {} GitLab merge requests", mrs.len());
                
                // Sync GitLab pipelines
                let pipelines = self.fetch_gitlab_pipelines(provider, repo, since).await?;
                for pipeline in &pipelines {
                    self.upsert_pipeline_from_gitlab(pipeline, repo, provider)?;
                    synced_count += 1;
                }
                info!("⚙️ Synced {} GitLab pipelines", pipelines.len());
            }
            _ => {
                return Err(format!("Unsupported provider type: {}", provider.provider_type).into());
            }
        }
        
        // Update repository sync status
        let now = Utc::now().to_rfc3339();
        let success_status_id = self.get_sync_status_id("success")?;
        
        self.conn.execute(
            "UPDATE repositories SET 
                last_issues_sync = ?, last_issues_sync_status_id = ?,
                last_pull_requests_sync = ?, last_pull_requests_sync_status_id = ?,
                last_workflows_sync = ?, last_workflows_sync_status_id = ?,
                updated_at = ? 
             WHERE id = ?",
            rusqlite::params![
                &now, success_status_id,  // issues
                &now, success_status_id,  // pull requests
                &now, success_status_id,  // workflows
                &now,                     // updated_at
                repo.id
            ],
        )?;
        
        info!("📊 Updated sync status for repository: {} ({})", repo.name, repo.id);
        
        Ok(synced_count)
    }

    pub async fn sync_all_providers(&mut self) -> Result<(), String> {
        // Check if sync is already in progress
        if self.sync_in_progress.compare_exchange(false, true, Ordering::Acquire, Ordering::Relaxed).is_err() {
            warn!("🚫 Sync already in progress, skipping all providers sync");
            return Err("Sync already in progress".to_string());
        }

        // Create sync history record
        let history_id = match self.create_sync_history("all_providers", None, "All Providers") {
            Ok(id) => {
                info!("📝 Created sync history record: {}", id);
                Some(id)
            }
            Err(e) => {
                error!("Failed to create sync history: {}", e);
                None
            }
        };

        info!("Syncing all providers");
        
        // Get all provider IDs
        let provider_ids: Vec<i64> = {
            let mut stmt = self.conn.prepare("SELECT id FROM git_providers").map_err(|e| {
                self.sync_in_progress.store(false, Ordering::Release);
                format!("Database error: {}", e)
            })?;
            let rows = stmt.query_map([], |row| {
                Ok(row.get::<_, i64>("id")?)
            }).map_err(|e| {
                self.sync_in_progress.store(false, Ordering::Release);
                format!("Database error: {}", e)
            })?;
            
            let mut ids = Vec::new();
            for row in rows {
                ids.push(row.map_err(|e| {
                    self.sync_in_progress.store(false, Ordering::Release);
                    format!("Database error: {}", e)
                })?);
            }
            ids
        };
        
        // Keep the sync lock and sync each provider directly without recursion
        let mut total_errors = 0;
        let mut all_errors = Vec::new();
        let mut total_items_synced = 0;
        let repositories_synced = provider_ids.len() as i32;
        
        for provider_id in provider_ids {
            // Use a custom sync logic that doesn't check sync_in_progress again
            match self.sync_provider_internal(provider_id).await {
                Ok(()) => {
                    info!("✅ Successfully synced provider {}", provider_id);
                    // Count items synced for this provider (approximate)
                    total_items_synced += 10; // Placeholder - could be improved to count actual items
                }
                Err(e) => {
                    error!("❌ Failed to sync provider {}: {}", provider_id, e);
                    total_errors += 1;
                    all_errors.push(format!("Provider {}: {}", provider_id, e));
                }
            }
        }
        
        // Update sync history record
        if let Some(history_id) = history_id {
            if total_errors == 0 {
                if let Err(e) = self.update_sync_history_completed(history_id, total_items_synced, repositories_synced, 0) {
                    error!("Failed to update sync history (completed): {}", e);
                }
            } else {
                let error_message = format!("Sync completed with {} errors: {}", total_errors, all_errors.join("; "));
                if let Err(e) = self.update_sync_history_failed(history_id, &error_message) {
                    error!("Failed to update sync history (failed): {}", e);
                }
            }
        }
        
        // Release the sync lock
        self.sync_in_progress.store(false, Ordering::Release);
        
        if total_errors == 0 {
            info!("✅ All providers sync completed successfully");
            Ok(())
        } else {
            warn!("⚠️ All providers sync completed with {} errors", total_errors);
            Err(format!("Sync completed with {} errors: {}", total_errors, all_errors.join("; ")))
        }
    }

    pub fn is_sync_in_progress(&self) -> bool {
        self.sync_in_progress.load(Ordering::Acquire)
    }

    // Helper functions for lookup tables
    pub fn get_provider_type_id(&self, code: &str) -> Result<i64, Box<dyn std::error::Error + Send + Sync>> {
        let id: i64 = self.conn.query_row(
            "SELECT id FROM provider_types WHERE code = ?",
            [code],
            |row| row.get(0)
        )?;
        Ok(id)
    }

    pub fn get_issue_state_id(&self, code: &str) -> Result<i64, Box<dyn std::error::Error + Send + Sync>> {
        let id: i64 = self.conn.query_row(
            "SELECT id FROM issue_states WHERE code = ?",
            [code],
            |row| row.get(0)
        )?;
        Ok(id)
    }

    pub fn get_pr_state_id(&self, code: &str) -> Result<i64, Box<dyn std::error::Error + Send + Sync>> {
        let id: i64 = self.conn.query_row(
            "SELECT id FROM pr_states WHERE code = ?",
            [code],
            |row| row.get(0)
        )?;
        Ok(id)
    }

    pub fn get_workflow_status_id(&self, code: &str) -> Result<i64, Box<dyn std::error::Error + Send + Sync>> {
        let result = self.conn.query_row(
            "SELECT id FROM workflow_statuses WHERE code = ?",
            [code],
            |row| row.get(0)
        );
        
        match result {
            Ok(id) => Ok(id),
            Err(rusqlite::Error::QueryReturnedNoRows) => {
                warn!("Unknown workflow status '{}', using default 'in_progress'", code);
                // Fallback to in_progress status
                let id: i64 = self.conn.query_row(
                    "SELECT id FROM workflow_statuses WHERE code = 'in_progress'",
                    [],
                    |row| row.get(0)
                )?;
                Ok(id)
            }
            Err(e) => Err(e.into())
        }
    }

    pub fn get_workflow_conclusion_id(&self, code: &str) -> Result<Option<i64>, Box<dyn std::error::Error + Send + Sync>> {
        let id: Option<i64> = self.conn.query_row(
            "SELECT id FROM workflow_conclusions WHERE code = ?",
            [code],
            |row| row.get(0)
        ).ok();
        Ok(id)
    }

    pub fn get_sync_status_id(&self, code: &str) -> Result<i64, Box<dyn std::error::Error + Send + Sync>> {
        let id: i64 = self.conn.query_row(
            "SELECT id FROM sync_statuses WHERE code = ?",
            [code],
            |row| row.get(0)
        )?;
        Ok(id)
    }

    pub fn sync_repository(&mut self, repository_id: i64) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("Syncing repository: {}", repository_id);
        
        // Update the repository's last_activity and updated_at timestamp
        self.conn.execute(
            "UPDATE repositories SET last_activity = ?, updated_at = ? WHERE id = ?",
            rusqlite::params![
                Utc::now().to_rfc3339(),
                Utc::now().to_rfc3339(),
                repository_id
            ],
        )?;
        
        info!("Repository sync completed successfully: {}", repository_id);
        Ok(())
    }

    pub fn update_provider_token(&mut self, provider_id: i64, token: Option<&str>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("Updating provider token: {}", provider_id);
        
        // When updating token, also update token_valid status
        // Note: We no longer update sync fields here - they are resource-specific and updated during sync
        let token_valid = match token {
            Some(t) if !t.is_empty() => true,
            _ => false
        };
        
        self.conn.execute(
            "UPDATE git_providers SET token = ?, token_valid = ?, updated_at = ? WHERE id = ?",
            rusqlite::params![
                token,
                token_valid,
                Utc::now().to_rfc3339(),
                provider_id
            ],
        )?;

        info!("Provider token updated successfully (token_valid: {})", token_valid);
        Ok(())
    }

    pub fn update_provider_token_validation(&mut self, provider_id: i64, is_valid: bool) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("Updating provider token validation: {} -> {}", provider_id, is_valid);
        
        // Note: We no longer update sync timestamps during token validation
        // Sync timestamps are now resource-specific and updated during actual sync operations
        
        // Update token validation status but don't update sync timestamps
        self.conn.execute(
            "UPDATE git_providers SET token_valid = ?, updated_at = ? WHERE id = ?",
            rusqlite::params![
                is_valid,
                Utc::now().to_rfc3339(),
                provider_id
            ],
        )?;

        info!("Provider token validation updated successfully");
        Ok(())
    }

    // API client methods
    async fn fetch_github_issues(&self, provider: &GitProvider, repo: &Repository, since: Option<&str>) -> Result<Vec<GitHubIssue>, Box<dyn std::error::Error + Send + Sync>> {
        let client = Client::new();
        // Note: GitHub's /issues endpoint returns both issues and pull requests
        // We filter out PRs after receiving the response
        let mut params = vec![("state", "all"), ("per_page", "100")];
        if let Some(since_time) = since {
            params.push(("since", since_time));
        }
        
        let token = provider.token.as_ref().ok_or("No token available")?;
        
        let url = format!("{}/repos/{}/issues", provider.base_url, repo.full_name);
        let request = client
            .get(&url)
            .header("Authorization", format!("token {}", token))
            .header("User-Agent", "GitPortal-App")
            .query(&params);

        let response = request.send().await?;
        
        // Simple access log: Method URL Status [Count]
        let query_string = if params.is_empty() { 
            String::new() 
        } else { 
            format!("?{}", params.iter().map(|(k, v)| format!("{}={}", k, v)).collect::<Vec<_>>().join("&")) 
        };
        let full_url = format!("{}{}", mask_sensitive_url(&url), query_string);
            
        let status_code = response.status().as_u16();
        
        if !response.status().is_success() {
            info!("GET {} {}", full_url, status_code);
            return Err(format!("GitHub API error: {}", response.status()).into());
        }
        
        let all_items: Vec<GitHubIssue> = response.json().await?;
        
        // Filter out pull requests (GitHub's /issues endpoint returns both issues and PRs)
        let mut issues: Vec<GitHubIssue> = all_items.into_iter()
            .filter(|item| item.pull_request.is_none())
            .collect();
            
        // Client-side filtering by updated_at (since GitHub API only supports created_at filtering)
        if let Some(since_time) = since {
            if let Ok(since_dt) = chrono::DateTime::parse_from_rfc3339(since_time) {
                issues.retain(|issue| {
                    if let Ok(updated_at) = chrono::DateTime::parse_from_rfc3339(&issue.updated_at) {
                        updated_at > since_dt
                    } else {
                        true // Keep items with invalid dates
                    }
                });
            }
        }
            
        // Simple access log: Method URL Status Count
        info!("GET {} {} [{}]", full_url, status_code, issues.len());
        Ok(issues)
    }
    
    async fn fetch_github_pull_requests(&self, provider: &GitProvider, repo: &Repository, since: Option<&str>) -> Result<Vec<GitHubPullRequest>, Box<dyn std::error::Error + Send + Sync>> {
        let client = Client::new();
        let mut params = vec![("state", "all"), ("per_page", "100")];
        if let Some(since_time) = since {
            params.push(("since", since_time));
        }
        
        let token = provider.token.as_ref().ok_or("No token available")?;
        
        let url = format!("{}/repos/{}/pulls", provider.base_url, repo.full_name);
        let request = client
            .get(&url)
            .header("Authorization", format!("token {}", token))
            .header("User-Agent", "GitPortal-App")
            .query(&params);

        let response = request.send().await?;
        
        // Simple access log: Method URL Status [Count]
        let query_string = if params.is_empty() { 
            String::new() 
        } else { 
            format!("?{}", params.iter().map(|(k, v)| format!("{}={}", k, v)).collect::<Vec<_>>().join("&")) 
        };
        let full_url = format!("{}{}", mask_sensitive_url(&url), query_string);
        let status_code = response.status().as_u16();
            
        if !response.status().is_success() {
            info!("GET {} {}", full_url, status_code);
            return Err(format!("GitHub API error: {}", response.status()).into());
        }
        
        let mut prs: Vec<GitHubPullRequest> = response.json().await?;
        
        // Client-side filtering by updated_at (since GitHub API only supports created_at filtering)
        if let Some(since_time) = since {
            if let Ok(since_dt) = chrono::DateTime::parse_from_rfc3339(since_time) {
                prs.retain(|pr| {
                    if let Ok(updated_at) = chrono::DateTime::parse_from_rfc3339(&pr.updated_at) {
                        updated_at > since_dt
                    } else {
                        true // Keep items with invalid dates
                    }
                });
            }
        }
        
        // Simple access log: Method URL Status Count
        info!("GET {} {} [{}]", full_url, status_code, prs.len());
        Ok(prs)
    }
    
    async fn fetch_github_workflows(&self, provider: &GitProvider, repo: &Repository, since: Option<&str>) -> Result<Vec<GitHubWorkflowRun>, Box<dyn std::error::Error + Send + Sync>> {
        let client = Client::new();
        let mut params: Vec<(&str, &str)> = vec![("per_page", "100")];
        let created_filter;
        if let Some(since_time) = since {
            created_filter = format!(">={}", since_time);
            params.push(("created", &created_filter));
        }
        
        let token = provider.token.as_ref().ok_or("No token available")?;
        
        let url = format!("{}/repos/{}/actions/runs", provider.base_url, repo.full_name);
        let request = client
            .get(&url)
            .header("Authorization", format!("token {}", token))
            .header("User-Agent", "GitPortal-App")
            .query(&params);

        let response = request.send().await?;
        
        // Simple access log: Method URL Status [Count]
        let query_string = if params.is_empty() { 
            String::new() 
        } else { 
            format!("?{}", params.iter().map(|(k, v)| format!("{}={}", k, v)).collect::<Vec<_>>().join("&")) 
        };
        let full_url = format!("{}{}", mask_sensitive_url(&url), query_string);
        let status_code = response.status().as_u16();
            
        if !response.status().is_success() {
            info!("GET {} {}", full_url, status_code);
            return Err(format!("GitHub API error: {}", response.status()).into());
        }
        
        let response_data: GitHubWorkflowRunsResponse = response.json().await?;
        let mut workflows = response_data.workflow_runs;
        
        // Client-side filtering by updated_at (since GitHub API only supports created filtering)
        if let Some(since_time) = since {
            if let Ok(since_dt) = chrono::DateTime::parse_from_rfc3339(since_time) {
                workflows.retain(|workflow| {
                    if let Ok(updated_at) = chrono::DateTime::parse_from_rfc3339(&workflow.updated_at) {
                        updated_at > since_dt
                    } else {
                        true // Keep items with invalid dates
                    }
                });
            }
        }
        
        // Simple access log: Method URL Status Count
        info!("GET {} {} [{}]", full_url, status_code, workflows.len());
        Ok(workflows)
    }
    
    async fn fetch_gitlab_issues(&self, provider: &GitProvider, repo: &Repository, since: Option<&str>) -> Result<Vec<GitLabIssue>, Box<dyn std::error::Error + Send + Sync>> {
        let client = Client::new();
        let project_id = &repo.api_id;
        let mut params = vec![("state", "all"), ("per_page", "100")];
        if let Some(since_time) = since {
            params.push(("updated_after", since_time));
        }
        
        let token = provider.token.as_ref().ok_or("No token available")?;
        
        let url = format!("{}/projects/{}/issues", provider.base_url, project_id);
        let request = client
            .get(&url)
            .header("PRIVATE-TOKEN", token)
            .header("User-Agent", "GitPortal-App")
            .query(&params);

        let response = request.send().await?;
        
        // Simple access log: Method URL Status [Count]
        let query_string = if params.is_empty() { 
            String::new() 
        } else { 
            format!("?{}", params.iter().map(|(k, v)| format!("{}={}", k, v)).collect::<Vec<_>>().join("&")) 
        };
        let full_url = format!("{}{}", mask_sensitive_url(&url), query_string);
        let status_code = response.status().as_u16();
            
        if !response.status().is_success() {
            info!("GET {} {}", full_url, status_code);
            return Err(format!("GitLab API error: {}", response.status()).into());
        }
        
        let issues: Vec<GitLabIssue> = response.json().await?;
        
        // Simple access log: Method URL Status Count
        info!("GET {} {} [{}]", full_url, status_code, issues.len());
        Ok(issues)
    }
    
    async fn fetch_gitlab_merge_requests(&self, provider: &GitProvider, repo: &Repository, since: Option<&str>) -> Result<Vec<GitLabMergeRequest>, Box<dyn std::error::Error + Send + Sync>> {
        let client = Client::new();
        let project_id = &repo.api_id;
        let mut params = vec![("state", "all"), ("per_page", "100")];
        if let Some(since_time) = since {
            params.push(("updated_after", since_time));
        }
        
        let token = provider.token.as_ref().ok_or("No token available")?;
        
        let url = format!("{}/projects/{}/merge_requests", provider.base_url, project_id);
        let request = client
            .get(&url)
            .header("PRIVATE-TOKEN", token)
            .header("User-Agent", "GitPortal-App")
            .query(&params);

        let response = request.send().await?;
        
        // Simple access log: Method URL Status [Count]
        let query_string = if params.is_empty() { 
            String::new() 
        } else { 
            format!("?{}", params.iter().map(|(k, v)| format!("{}={}", k, v)).collect::<Vec<_>>().join("&")) 
        };
        let full_url = format!("{}{}", mask_sensitive_url(&url), query_string);
        let status_code = response.status().as_u16();
            
        if !response.status().is_success() {
            info!("GET {} {}", full_url, status_code);
            return Err(format!("GitLab API error: {}", response.status()).into());
        }
        
        let mrs: Vec<GitLabMergeRequest> = response.json().await?;
        
        // Simple access log: Method URL Status Count
        info!("GET {} {} [{}]", full_url, status_code, mrs.len());
        Ok(mrs)
    }
    
    async fn fetch_gitlab_pipelines(&self, provider: &GitProvider, repo: &Repository, since: Option<&str>) -> Result<Vec<GitLabPipeline>, Box<dyn std::error::Error + Send + Sync>> {
        let client = Client::new();
        let project_id = &repo.api_id;
        let mut params = vec![("per_page", "100")];
        if let Some(since_time) = since {
            params.push(("updated_after", since_time));
        }
        
        let token = provider.token.as_ref().ok_or("No token available")?;
        
        let url = format!("{}/projects/{}/pipelines", provider.base_url, project_id);
        let request = client
            .get(&url)
            .header("PRIVATE-TOKEN", token)
            .header("User-Agent", "GitPortal-App")
            .query(&params);

        let response = request.send().await?;
        
        // Simple access log: Method URL Status [Count]
        let query_string = if params.is_empty() { 
            String::new() 
        } else { 
            format!("?{}", params.iter().map(|(k, v)| format!("{}={}", k, v)).collect::<Vec<_>>().join("&")) 
        };
        let full_url = format!("{}{}", mask_sensitive_url(&url), query_string);
        let status_code = response.status().as_u16();
            
        if !response.status().is_success() {
            info!("GET {} {}", full_url, status_code);
            return Err(format!("GitLab API error: {}", response.status()).into());
        }
        
        let pipelines: Vec<GitLabPipeline> = response.json().await?;
        
        // Simple access log: Method URL Status Count
        info!("GET {} {} [{}]", full_url, status_code, pipelines.len());
        Ok(pipelines)
    }

    // Data insertion/update methods
    fn upsert_issue_from_github(&mut self, github_issue: &GitHubIssue, repo: &Repository, _provider: &GitProvider) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let state_id = self.get_issue_state_id(&github_issue.state)?;
        let labels_json = serde_json::to_string(&github_issue.labels.iter().map(|l| &l.name).collect::<Vec<_>>())?;
        let assignees_me = github_issue.assignees.iter().any(|a| a.login == "me"); // TODO: Replace with actual user check
        
        self.conn.execute(
            "INSERT OR REPLACE INTO issues (
                repository_id, state_id, api_id, api_created_at, api_updated_at,
                title, number, author, assigned_to_me, labels, closed_at, url,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM issues WHERE repository_id = ? AND number = ?), ?), ?)",
            rusqlite::params![
                repo.id,
                state_id,
                github_issue.id.to_string(),
                github_issue.created_at,
                github_issue.updated_at,
                github_issue.title,
                github_issue.number,
                github_issue.user.login,
                assignees_me,
                labels_json,
                github_issue.closed_at,
                github_issue.html_url,
                repo.id,
                github_issue.number,
                Utc::now().to_rfc3339(),
                Utc::now().to_rfc3339()
            ],
        )?;
        Ok(())
    }

    fn upsert_pr_from_github(&mut self, github_pr: &GitHubPullRequest, repo: &Repository, _provider: &GitProvider) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let state_id = self.get_pr_state_id(&github_pr.state)?;
        let assignees_me = github_pr.assignees.iter().any(|a| a.login == "me"); // TODO: Replace with actual user check
        
        self.conn.execute(
            "INSERT OR REPLACE INTO pull_requests (
                repository_id, state_id, api_id, api_created_at, api_updated_at,
                title, number, author, assigned_to_me, draft, merged_at, closed_at, url,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM pull_requests WHERE repository_id = ? AND number = ?), ?), ?)",
            rusqlite::params![
                repo.id,
                state_id,
                github_pr.id.to_string(),
                github_pr.created_at,
                github_pr.updated_at,
                github_pr.title,
                github_pr.number,
                github_pr.user.login,
                assignees_me,
                github_pr.draft,
                github_pr.merged_at,
                github_pr.closed_at,
                github_pr.html_url,
                repo.id,
                github_pr.number,
                Utc::now().to_rfc3339(),
                Utc::now().to_rfc3339()
            ],
        )?;
        Ok(())
    }

    fn upsert_workflow_from_github(&mut self, github_workflow: &GitHubWorkflowRun, repo: &Repository, _provider: &GitProvider) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let status_id = self.get_workflow_status_id(&github_workflow.status)?;
        let conclusion_id = if let Some(ref conclusion) = github_workflow.conclusion {
            self.get_workflow_conclusion_id(conclusion)?
        } else {
            None
        };
        
        self.conn.execute(
            "INSERT OR REPLACE INTO workflow_runs (
                repository_id, status_id, conclusion_id, api_id, api_created_at, api_updated_at,
                name, url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM workflow_runs WHERE repository_id = ? AND api_id = ?), ?), ?)",
            rusqlite::params![
                repo.id,
                status_id,
                conclusion_id,
                github_workflow.id.to_string(),
                github_workflow.created_at,
                github_workflow.updated_at,
                github_workflow.name,
                github_workflow.html_url,
                repo.id,
                github_workflow.id.to_string(),
                Utc::now().to_rfc3339(),
                Utc::now().to_rfc3339()
            ],
        )?;
        Ok(())
    }

    fn upsert_issue_from_gitlab(&mut self, gitlab_issue: &GitLabIssue, repo: &Repository, _provider: &GitProvider) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let state_id = self.get_issue_state_id(&gitlab_issue.state)?;
        let labels_json = serde_json::to_string(&gitlab_issue.labels)?;
        let assignees_me = gitlab_issue.assignees.iter().any(|a| a.username == "me"); // TODO: Replace with actual user check
        
        self.conn.execute(
            "INSERT OR REPLACE INTO issues (
                repository_id, state_id, api_id, api_created_at, api_updated_at,
                title, number, author, assigned_to_me, labels, closed_at, url,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM issues WHERE repository_id = ? AND number = ?), ?), ?)",
            rusqlite::params![
                repo.id,
                state_id,
                gitlab_issue.id.to_string(),
                gitlab_issue.created_at,
                gitlab_issue.updated_at,
                gitlab_issue.title,
                gitlab_issue.iid,
                gitlab_issue.author.username,
                assignees_me,
                labels_json,
                gitlab_issue.closed_at,
                gitlab_issue.web_url,
                repo.id,
                gitlab_issue.iid,
                Utc::now().to_rfc3339(),
                Utc::now().to_rfc3339()
            ],
        )?;
        Ok(())
    }

    fn upsert_mr_from_gitlab(&mut self, gitlab_mr: &GitLabMergeRequest, repo: &Repository, _provider: &GitProvider) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let state_id = self.get_pr_state_id(&gitlab_mr.state)?;
        let assignees_me = gitlab_mr.assignees.iter().any(|a| a.username == "me"); // TODO: Replace with actual user check
        
        self.conn.execute(
            "INSERT OR REPLACE INTO pull_requests (
                repository_id, state_id, api_id, api_created_at, api_updated_at,
                title, number, author, assigned_to_me, draft, merged_at, closed_at, url,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM pull_requests WHERE repository_id = ? AND number = ?), ?), ?)",
            rusqlite::params![
                repo.id,
                state_id,
                gitlab_mr.id.to_string(),
                gitlab_mr.created_at,
                gitlab_mr.updated_at,
                gitlab_mr.title,
                gitlab_mr.iid,
                gitlab_mr.author.username,
                assignees_me,
                gitlab_mr.draft,
                gitlab_mr.merged_at,
                gitlab_mr.closed_at,
                gitlab_mr.web_url,
                repo.id,
                gitlab_mr.iid,
                Utc::now().to_rfc3339(),
                Utc::now().to_rfc3339()
            ],
        )?;
        Ok(())
    }

    fn upsert_pipeline_from_gitlab(&mut self, gitlab_pipeline: &GitLabPipeline, repo: &Repository, _provider: &GitProvider) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let status_id = self.get_workflow_status_id(&gitlab_pipeline.status)?;
        
        self.conn.execute(
            "INSERT OR REPLACE INTO workflow_runs (
                repository_id, status_id, conclusion_id, api_id, api_created_at, api_updated_at,
                name, url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM workflow_runs WHERE repository_id = ? AND api_id = ?), ?), ?)",
            rusqlite::params![
                repo.id,
                status_id,
                None::<i64>, // GitLab pipelines don't have separate conclusion
                gitlab_pipeline.id.to_string(),
                gitlab_pipeline.created_at,
                gitlab_pipeline.updated_at,
                format!("Pipeline #{}", gitlab_pipeline.id), // Generate a name
                gitlab_pipeline.web_url,
                repo.id,
                gitlab_pipeline.id.to_string(),
                Utc::now().to_rfc3339(),
                Utc::now().to_rfc3339()
            ],
        )?;
        Ok(())
    }

    // Sync History methods
    pub fn create_sync_history(&mut self, sync_type: &str, target_id: Option<i64>, target_name: &str) -> Result<i64, Box<dyn std::error::Error + Send + Sync>> {
        let now = Utc::now();
        let mut stmt = self.conn.prepare(
            "INSERT INTO sync_history (
                sync_type, target_id, target_name, status, started_at, created_at, updated_at
            ) VALUES (?, ?, ?, 'started', ?, ?, ?)"
        )?;
        
        stmt.execute(rusqlite::params![
            sync_type,
            target_id,
            target_name,
            now.to_rfc3339(),
            now.to_rfc3339(),
            now.to_rfc3339()
        ])?;
        
        Ok(self.conn.last_insert_rowid())
    }

    pub fn update_sync_history_completed(&mut self, history_id: i64, items_synced: i32, repositories_synced: i32, errors_count: i32) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let completed_at = Utc::now();
        
        // Get the started_at time to calculate duration
        let mut stmt = self.conn.prepare("SELECT started_at FROM sync_history WHERE id = ?")?;
        let started_at_str: String = stmt.query_row(rusqlite::params![history_id], |row| {
            Ok(row.get(0)?)
        })?;
        
        let started_at = DateTime::parse_from_rfc3339(&started_at_str)?.with_timezone(&Utc);
        let duration_seconds = (completed_at - started_at).num_seconds() as i32;
        
        self.conn.execute(
            "UPDATE sync_history SET 
                status = 'completed', 
                items_synced = ?, 
                repositories_synced = ?, 
                errors_count = ?, 
                completed_at = ?, 
                duration_seconds = ?,
                updated_at = ?
            WHERE id = ?",
            rusqlite::params![
                items_synced,
                repositories_synced,
                errors_count,
                completed_at.to_rfc3339(),
                duration_seconds,
                completed_at.to_rfc3339(),
                history_id
            ]
        )?;
        
        Ok(())
    }

    pub fn update_sync_history_failed(&mut self, history_id: i64, error_message: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let completed_at = Utc::now();
        
        // Get the started_at time to calculate duration
        let mut stmt = self.conn.prepare("SELECT started_at FROM sync_history WHERE id = ?")?;
        let started_at_str: String = stmt.query_row(rusqlite::params![history_id], |row| {
            Ok(row.get(0)?)
        })?;
        
        let started_at = DateTime::parse_from_rfc3339(&started_at_str)?.with_timezone(&Utc);
        let duration_seconds = (completed_at - started_at).num_seconds() as i32;
        
        self.conn.execute(
            "UPDATE sync_history SET 
                status = 'failed', 
                error_message = ?, 
                completed_at = ?, 
                duration_seconds = ?,
                updated_at = ?
            WHERE id = ?",
            rusqlite::params![
                error_message,
                completed_at.to_rfc3339(),
                duration_seconds,
                completed_at.to_rfc3339(),
                history_id
            ]
        )?;
        
        Ok(())
    }

    pub fn get_sync_history(&self, limit: Option<u32>) -> Result<Vec<SyncHistory>, Box<dyn std::error::Error + Send + Sync>> {
        let limit_clause = match limit {
            Some(l) => format!("LIMIT {}", l),
            None => "".to_string(),
        };
        
        let query = format!(
            "SELECT id, sync_type, target_id, target_name, status, error_message, 
                    items_synced, repositories_synced, errors_count, 
                    started_at, completed_at, duration_seconds, created_at, updated_at
             FROM sync_history 
             ORDER BY started_at DESC {}",
            limit_clause
        );
        
        let mut stmt = self.conn.prepare(&query)?;
        let rows = stmt.query_map([], |row| {
            let started_at_str: String = row.get(9)?;
            let completed_at_str: Option<String> = row.get(10)?;
            let created_at_str: String = row.get(12)?;
            let updated_at_str: String = row.get(13)?;
            
            Ok(SyncHistory {
                id: row.get(0)?,
                sync_type: row.get(1)?,
                target_id: row.get(2)?,
                target_name: row.get(3)?,
                status: row.get(4)?,
                error_message: row.get(5)?,
                items_synced: row.get(6)?,
                repositories_synced: row.get(7)?,
                errors_count: row.get(8)?,
                started_at: DateTime::parse_from_rfc3339(&started_at_str).map_err(|_e| rusqlite::Error::InvalidColumnType(9, "started_at".to_string(), rusqlite::types::Type::Text))?.with_timezone(&Utc),
                completed_at: completed_at_str.map(|s| DateTime::parse_from_rfc3339(&s).unwrap().with_timezone(&Utc)),
                duration_seconds: row.get(11)?,
                created_at: DateTime::parse_from_rfc3339(&created_at_str).map_err(|_e| rusqlite::Error::InvalidColumnType(12, "created_at".to_string(), rusqlite::types::Type::Text))?.with_timezone(&Utc),
                updated_at: DateTime::parse_from_rfc3339(&updated_at_str).map_err(|_e| rusqlite::Error::InvalidColumnType(13, "updated_at".to_string(), rusqlite::types::Type::Text))?.with_timezone(&Utc),
            })
        })?;
        
        let mut history_list = Vec::new();
        for row_result in rows {
            history_list.push(row_result?);
        }
        
        Ok(history_list)
    }
}
