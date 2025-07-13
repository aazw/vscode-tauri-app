#[allow(non_snake_case)]
pub mod database;


pub use database::{
    Database, GitProvider, Repository, Issue, PullRequest, WorkflowRun, SyncHistory,
    IssueFilters, PullRequestFilters, WorkflowFilters, PaginationParams,
    PaginatedResponse, IssueStats, PullRequestStats, WorkflowStats
};

#[cfg(feature = "tauri")]
use tauri::{State, Manager};
use uuid::Uuid;
use chrono::Utc;
use reqwest::Client;
use std::sync::Arc;
use tokio::time::{interval, Duration};
use log::{info, error};
use serde::{Serialize, Deserialize};

#[cfg(feature = "tauri")]
type DatabaseState = std::sync::Arc<std::sync::Mutex<Database>>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncSettings {
    pub sync_interval_minutes: u64,
    pub auto_sync_enabled: bool,
}

impl Default for SyncSettings {
    fn default() -> Self {
        Self {
            sync_interval_minutes: 30, // Default to 30 minutes
            auto_sync_enabled: true,
        }
    }
}

type SyncSettingsState = std::sync::Arc<std::sync::Mutex<SyncSettings>>;

// Token validation functions
async fn validate_github_token(base_url: &str, token: &str) -> Result<bool, Box<dyn std::error::Error + Send + Sync>> {
    let client = Client::new();
    let url = format!("{}/user", base_url);
    
    // Log token validation request (masking token)
    info!("🔐 Token Validation Request: GET {}", url);
    info!("🔑 Token: ***MASKED*** (GitHub)");
    
    let response = client
        .get(&url)
        .header("Authorization", format!("token {}", token))
        .header("User-Agent", "GitPortal-App")
        .send()
        .await?;
    
    let is_success = response.status().is_success();
    info!("📈 Token Validation Response: {} {} (valid: {})", 
          response.status().as_u16(), 
          response.status().canonical_reason().unwrap_or("Unknown"),
          is_success);
    
    Ok(is_success)
}

async fn validate_gitlab_token(base_url: &str, token: &str) -> Result<bool, Box<dyn std::error::Error + Send + Sync>> {
    let client = Client::new();
    let url = format!("{}/user", base_url);
    
    // Log token validation request (masking token)
    info!("🔐 Token Validation Request: GET {}", url);
    info!("🔑 Token: ***MASKED*** (GitLab)");
    
    let response = client
        .get(&url)
        .header("PRIVATE-TOKEN", token)
        .header("User-Agent", "GitPortal-App")
        .send()
        .await?;
    
    let is_success = response.status().is_success();
    info!("📈 Token Validation Response: {} {} (valid: {})", 
          response.status().as_u16(), 
          response.status().canonical_reason().unwrap_or("Unknown"),
          is_success);
    
    Ok(is_success)
}

#[cfg(feature = "tauri")]
#[tauri::command]
fn greet(name: &str) -> String {
    log::debug!("greet command called with name: {}", name);
    let response = format!("Hello, {}! You've been greeted from Rust!", name);
    log::debug!("greet response: {}", response);
    response
}

#[allow(non_snake_case)]
#[tauri::command]
async fn get_git_provider(
    db: State<'_, DatabaseState>,
    providerId: i64,
) -> Result<GitProvider, String> {
    log::info!("get_git_provider called: provider_id={}", providerId);
    let db = db.lock().unwrap();
    match db.get_provider(providerId) {
        Ok(provider) => {
            log::debug!("Found provider: {} ({})", provider.name, provider.provider_type);
            Ok(provider)
        }
        Err(e) => {
            log::warn!("Failed to get provider {}: {}", providerId, e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
async fn add_git_provider(
    db: State<'_, DatabaseState>,
    name: String,
    provider_type: String,
    base_url: String,
    token: Option<String>,
) -> Result<i64, String> {
    log::info!("add_git_provider called: name={}, type={}, url={}", name, provider_type, base_url);
    
    // Check if this is a standard provider (github.com/gitlab.com) or self-hosted
    let is_standard_provider = 
        (provider_type == "github" && base_url == "https://api.github.com") ||
        (provider_type == "gitlab" && base_url == "https://gitlab.com/api/v4");
    
    log::info!("Provider type: {} (standard: {})", provider_type, is_standard_provider);
    
    // Validate token if provided
    let mut token_valid = false;
    if let Some(ref token_str) = token {
        if !token_str.is_empty() {
            log::info!("Validating token for provider: {} ({})", name, provider_type);
            
            token_valid = match provider_type.as_str() {
                "github" => {
                    match validate_github_token(&base_url, token_str).await {
                        Ok(valid) => {
                            log::info!("GitHub token validation result: {}", valid);
                            valid
                        }
                        Err(e) => {
                            log::error!("GitHub token validation failed: {}", e);
                            return Err(format!("GitHub token validation failed: {}", e));
                        }
                    }
                }
                "gitlab" => {
                    match validate_gitlab_token(&base_url, token_str).await {
                        Ok(valid) => {
                            log::info!("GitLab token validation result: {}", valid);
                            valid
                        }
                        Err(e) => {
                            log::error!("GitLab token validation failed: {}", e);
                            return Err(format!("GitLab token validation failed: {}", e));
                        }
                    }
                }
                _ => {
                    log::warn!("Unknown provider type: {}", provider_type);
                    return Err(format!("Unknown provider type: {}", provider_type));
                }
            };
            
            if !token_valid {
                return Err("Invalid access token. Please check your token and try again.".to_string());
            }
        }
    }
    
    let mut db = db.lock().unwrap();
    
    if is_standard_provider {
        // For standard providers (github.com/gitlab.com), find existing provider and update token
        log::info!("Handling standard provider: searching for existing provider with base_url={}", base_url);
        
        // Find existing provider by base_url and provider_type
        let existing_providers = match db.get_providers() {
            Ok(providers) => providers,
            Err(e) => {
                log::error!("Failed to get providers: {}", e);
                return Err(format!("Database error: {}", e));
            }
        };
        
        let existing_provider = existing_providers.iter().find(|p| 
            p.base_url == base_url && p.provider_type == provider_type
        );
        
        if let Some(existing) = existing_provider {
            log::info!("Found existing standard provider: {} ({})", existing.name, existing.id);
            
            // Update the existing provider's token
            match db.update_provider_token(existing.id, token.as_deref()) {
                Ok(_) => {
                    log::info!("Successfully updated token for existing provider: {}", existing.id);
                    
                    // Update token validation status
                    if let Err(e) = db.update_provider_token_validation(existing.id, token_valid) {
                        log::error!("Failed to update token validation status: {}", e);
                    }
                    
                    Ok(existing.id)
                }
                Err(e) => {
                    log::error!("Failed to update token for existing provider {}: {}", existing.id, e);
                    Err(format!("Database error: {}", e))
                }
            }
        } else {
            log::info!("No existing standard provider found, creating new one");
            
            // Create new standard provider
            let provider = GitProvider {
                id: 0, // Will be set by database
                name: name.clone(),
                provider_type: provider_type.clone(),
                base_url: base_url.clone(),
                token: token,
                token_valid,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };
            
            match db.add_provider(&provider) {
                Ok(_) => {
                    log::info!("Successfully created new standard provider: {} ({})", name, provider.id);
                    Ok(provider.id)
                }
                Err(e) => {
                    log::error!("Failed to create new standard provider {}: {}", name, e);
                    Err(format!("Database error: {}", e))
                }
            }
        }
    } else {
        // For self-hosted providers, always create new provider
        log::info!("Handling self-hosted provider: creating new provider");
        
        let provider = GitProvider {
            id: 0, // Will be set by database
            name: name.clone(),
            provider_type: provider_type.clone(),
            base_url: base_url.clone(),
            token: token,
            token_valid,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        log::debug!("Generated provider ID: {}", provider.id);
        
        match db.add_provider(&provider) {
            Ok(_) => {
                log::info!("Successfully added self-hosted provider: {} ({})", name, provider.id);
                Ok(provider.id)
            }
            Err(e) => {
                log::error!("Failed to add self-hosted provider {}: {}", name, e);
                Err(format!("Database error: {}", e))
            }
        }
    }
}

#[tauri::command]
async fn get_git_providers(db: State<'_, DatabaseState>) -> Result<Vec<GitProvider>, String> {
    log::info!("get_git_providers called");
    let db = db.lock().unwrap();
    match db.get_providers() {
        Ok(providers) => {
            log::info!("Retrieved {} providers", providers.len());
            log::debug!("Providers: {:?}", providers.iter().map(|p| &p.name).collect::<Vec<_>>());
            Ok(providers)
        }
        Err(e) => {
            log::error!("Failed to get providers: {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
async fn get_all_repositories(db: State<'_, DatabaseState>) -> Result<Vec<Repository>, String> {
    log::info!("get_all_repositories called");
    let db = db.lock().unwrap();
    match db.get_repositories() {
        Ok(repos) => {
            log::info!("Retrieved {} repositories", repos.len());
            log::debug!("Repositories: {:?}", repos.iter().map(|r| &r.name).collect::<Vec<_>>());
            Ok(repos)
        }
        Err(e) => {
            log::error!("Failed to get repositories: {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
async fn get_repository(
    db: State<'_, DatabaseState>,
    repository_id: i64,
) -> Result<Repository, String> {
    log::info!("get_repository called: repository_id={}", repository_id);
    let db = db.lock().unwrap();
    match db.get_repository(repository_id) {
        Ok(repo) => {
            log::debug!("Found repository: {} ({})", repo.name, repo.provider_name);
            Ok(repo)
        }
        Err(e) => {
            log::warn!("Failed to get repository {}: {}", repository_id, e);
            Err(e.to_string())
        }
    }
}

#[allow(non_snake_case)]
#[tauri::command]
async fn add_repository(
    db: State<'_, DatabaseState>,
    providerId: i64,
    webUrl: String,
) -> Result<i64, String> {
    log::info!("add_repository called: provider_id={}, web_url={}", providerId, webUrl);
    
    let db_lock = db.lock().unwrap();
    let provider = db_lock.get_provider(providerId).map_err(|e| {
        log::error!("Failed to get provider {}: {}", providerId, e);
        e.to_string()
    })?;
    drop(db_lock);
    
    log::info!("Found provider: {}", provider.name);

    let name = webUrl.split('/').last().unwrap_or("unknown").to_string();
    let full_name = webUrl.split('/').skip(webUrl.split('/').count() - 2).take(2).collect::<Vec<_>>().join("/");
    
    log::info!("Parsed repository: name={}, full_name={}", name, full_name);

    let repo = Repository {
        id: 0, // Will be set by database
        api_id: format!("api-{}", Uuid::new_v4().to_string()),
        name,
        full_name,
        web_url: webUrl,
        description: None,
        provider_id: providerId,
        provider_name: provider.name.clone(),
        provider_type: provider.provider_type.clone(),
        is_private: false,
        language: None,
        last_activity: None,
        api_created_at: Some(Utc::now()),
        api_updated_at: Some(Utc::now()),
        
        // Resource-specific sync timestamps
        last_issues_sync: None,
        last_pull_requests_sync: None,
        last_workflows_sync: None,
        
        // Resource-specific sync status
        last_issues_sync_status: None,
        last_pull_requests_sync_status: None,
        last_workflows_sync_status: None,
        
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    let mut db = db.lock().unwrap();
    db.add_repository(&repo).map_err(|e| {
        log::error!("Failed to add repository to database: {}", e);
        e.to_string()
    })?;
    
    log::info!("Successfully added repository with ID: {}", repo.id);
    Ok(repo.id)
}

#[tauri::command]
async fn delete_repository(
    db: State<'_, DatabaseState>,
    repository_id: i64,
) -> Result<(), String> {
    log::info!("delete_repository called: repository_id={}", repository_id);
    let mut db = db.lock().unwrap();
    match db.delete_repository(repository_id) {
        Ok(_) => {
            log::info!("Successfully deleted repository: {}", repository_id);
            Ok(())
        }
        Err(e) => {
            log::error!("Failed to delete repository {}: {}", repository_id, e);
            Err(e.to_string())
        }
    }
}

#[allow(non_snake_case)]
#[tauri::command]
async fn get_repositories_by_provider(
    db: State<'_, DatabaseState>,
    providerId: i64,
) -> Result<Vec<Repository>, String> {
    log::info!("get_repositories_by_provider called: provider_id={}", providerId);
    let db = db.lock().unwrap();
    match db.get_repositories_by_provider(providerId) {
        Ok(repos) => {
            log::info!("Retrieved {} repositories for provider {}", repos.len(), providerId);
            log::debug!("Repositories: {:?}", repos.iter().map(|r| &r.name).collect::<Vec<_>>());
            Ok(repos)
        }
        Err(e) => {
            log::error!("Failed to get repositories for provider {}: {}", providerId, e);
            Err(e.to_string())
        }
    }
}

#[allow(non_snake_case)]
#[tauri::command]
async fn update_provider_token(
    db: State<'_, DatabaseState>,
    providerId: i64,
    token: Option<String>,
) -> Result<(), String> {
    log::info!("update_provider_token called: provider_id={}, has_token={}", providerId, token.is_some());
    let mut db = db.lock().unwrap();
    match db.update_provider_token(providerId, token.as_deref()) {
        Ok(_) => {
            log::info!("Successfully updated token for provider: {}", providerId);
            Ok(())
        }
        Err(e) => {
            log::error!("Failed to update token for provider {}: {}", providerId, e);
            Err(e.to_string())
        }
    }
}

#[allow(non_snake_case)]
#[tauri::command]
async fn delete_provider(
    db: State<'_, DatabaseState>,
    providerId: i64,
) -> Result<(), String> {
    log::info!("delete_provider called: provider_id={}", providerId);
    let mut db = db.lock().unwrap();
    match db.delete_provider(providerId) {
        Ok(_) => {
            log::info!("Successfully deleted provider: {}", providerId);
            Ok(())
        }
        Err(e) => {
            log::error!("Failed to delete provider {}: {}", providerId, e);
            Err(e.to_string())
        }
    }
}

#[allow(non_snake_case)]
#[tauri::command]
async fn get_sync_status(
    db: State<'_, DatabaseState>,
) -> Result<bool, String> {
    let db = db.lock().unwrap();
    Ok(db.get_sync_status())
}

#[allow(non_snake_case)]
#[tauri::command]
async fn reset_sync_lock(
    db: State<'_, DatabaseState>,
) -> Result<(), String> {
    let db = db.lock().unwrap();
    db.reset_sync_lock();
    Ok(())
}

// Issue commands
#[tauri::command]
async fn get_issues(
    db: State<'_, DatabaseState>,
    filters: Option<IssueFilters>,
    pagination: Option<PaginationParams>,
) -> Result<PaginatedResponse<Issue>, String> {
    log::info!("get_issues called with filters: {:?}, pagination: {:?}", filters, pagination);
    let db = db.lock().unwrap();
    match db.get_issues(&filters, &pagination) {
        Ok(response) => {
            log::info!("Retrieved {} issues (page {} of {})", 
                response.data.len(), 
                response.pagination.page, 
                response.pagination.total_pages
            );
            Ok(response)
        }
        Err(e) => {
            log::error!("Failed to get issues: {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
async fn get_issue(
    db: State<'_, DatabaseState>,
    issue_id: i64,
) -> Result<Issue, String> {
    log::info!("get_issue called: issue_id={}", issue_id);
    let db = db.lock().unwrap();
    match db.get_issue(issue_id) {
        Ok(issue) => {
            log::debug!("Found issue: {} ({})", issue.title, issue.state);
            Ok(issue)
        }
        Err(e) => {
            log::warn!("Failed to get issue {}: {}", issue_id, e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
async fn get_issue_stats(
    db: State<'_, DatabaseState>,
    filters: Option<IssueFilters>,
) -> Result<IssueStats, String> {
    log::info!("get_issue_stats called with filters: {:?}", filters);
    let db = db.lock().unwrap();
    match db.get_issue_stats(&filters) {
        Ok(stats) => {
            log::debug!("Issue stats: total={}, open={}, closed={}", stats.total, stats.open, stats.closed);
            Ok(stats)
        }
        Err(e) => {
            log::error!("Failed to get issue stats: {}", e);
            Err(e.to_string())
        }
    }
}

// Pull Request commands
#[tauri::command]
async fn get_pull_requests(
    db: State<'_, DatabaseState>,
    filters: Option<PullRequestFilters>,
    pagination: Option<PaginationParams>,
) -> Result<PaginatedResponse<PullRequest>, String> {
    let db = db.lock().unwrap();
    db.get_pull_requests(&filters, &pagination).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_pull_request(
    db: State<'_, DatabaseState>,
    pr_id: i64,
) -> Result<PullRequest, String> {
    let db = db.lock().unwrap();
    db.get_pull_request(pr_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_pull_request_stats(
    db: State<'_, DatabaseState>,
    filters: Option<PullRequestFilters>,
) -> Result<PullRequestStats, String> {
    let db = db.lock().unwrap();
    db.get_pull_request_stats(&filters).map_err(|e| e.to_string())
}

// Workflow commands
#[tauri::command]
async fn get_workflows(
    db: State<'_, DatabaseState>,
    filters: Option<WorkflowFilters>,
    pagination: Option<PaginationParams>,
) -> Result<PaginatedResponse<WorkflowRun>, String> {
    let db = db.lock().unwrap();
    db.get_workflows(&filters, &pagination).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_workflow(
    db: State<'_, DatabaseState>,
    workflow_id: i64,
) -> Result<WorkflowRun, String> {
    let db = db.lock().unwrap();
    db.get_workflow(workflow_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_workflow_stats(
    db: State<'_, DatabaseState>,
    filters: Option<WorkflowFilters>,
) -> Result<WorkflowStats, String> {
    let db = db.lock().unwrap();
    db.get_workflow_stats(&filters).map_err(|e| e.to_string())
}

// Sync commands
#[allow(non_snake_case)]
#[tauri::command]
async fn sync_provider(
    db: State<'_, DatabaseState>,
    providerId: i64,
) -> Result<(), String> {
    // Spawn a blocking task to handle the database operation
    let db = db.inner().clone();
    
    tokio::task::spawn_blocking(move || {
        let mut db_guard = db.lock().unwrap();
        tokio::runtime::Handle::current().block_on(async {
            db_guard.sync_provider(providerId).await
        })
    }).await
    .map_err(|e| format!("Task join error: {}", e))?
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn sync_all_providers(
    db: State<'_, DatabaseState>,
) -> Result<(), String> {
    let db = db.inner().clone();
    
    tokio::task::spawn_blocking(move || {
        let mut db_guard = db.lock().unwrap();
        tokio::runtime::Handle::current().block_on(async {
            db_guard.sync_all_providers().await
        })
    }).await
    .map_err(|e| format!("Task join error: {}", e))?
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn sync_repository(
    db: State<'_, DatabaseState>,
    repository_id: i64,
) -> Result<(), String> {
    let mut db = db.lock().unwrap();
    db.sync_repository(repository_id).map_err(|e| e.to_string())
}

#[allow(non_snake_case)]
#[tauri::command]
async fn validate_provider_token(
    db: State<'_, DatabaseState>,
    providerId: i64,
) -> Result<bool, String> {
    log::info!("validate_provider_token called: provider_id={}", providerId);
    
    let provider = {
        let db_lock = db.lock().unwrap();
        db_lock.get_provider(providerId).map_err(|e| {
            log::error!("Failed to get provider {}: {}", providerId, e);
            e.to_string()
        })?
    };
    
    // Check if token exists
    let token = match &provider.token {
        Some(t) if !t.is_empty() => t,
        _ => {
            log::warn!("No token found for provider: {}", providerId);
            return Ok(false);
        }
    };
    
    log::info!("Validating token for provider: {} ({})", provider.name, provider.provider_type);
    
    // Validate token based on provider type
    let is_valid = match provider.provider_type.as_str() {
        "github" => {
            match validate_github_token(&provider.base_url, token).await {
                Ok(valid) => valid,
                Err(e) => {
                    log::error!("GitHub token validation failed: {}", e);
                    false
                }
            }
        }
        "gitlab" => {
            match validate_gitlab_token(&provider.base_url, token).await {
                Ok(valid) => valid,
                Err(e) => {
                    log::error!("GitLab token validation failed: {}", e);
                    false
                }
            }
        }
        _ => {
            log::warn!("Unknown provider type: {}", provider.provider_type);
            false
        }
    };
    
    // Update the validation status in database
    {
        let mut db_lock = db.lock().unwrap();
        if let Err(e) = db_lock.update_provider_token_validation(providerId, is_valid) {
            log::error!("Failed to update token validation status: {}", e);
        }
    }
    
    log::info!("Token validation result for {}: {}", provider.name, is_valid);
    Ok(is_valid)
}

#[tauri::command]
async fn is_sync_in_progress(
    db: State<'_, DatabaseState>,
) -> Result<bool, String> {
    let db = db.lock().unwrap();
    Ok(db.is_sync_in_progress())
}

#[tauri::command]
async fn get_sync_settings(
    settings: State<'_, SyncSettingsState>,
) -> Result<SyncSettings, String> {
    let settings = settings.lock().unwrap();
    Ok(settings.clone())
}

#[tauri::command]
async fn update_sync_settings(
    settings: State<'_, SyncSettingsState>,
    new_settings: SyncSettings,
) -> Result<(), String> {
    let mut settings = settings.lock().unwrap();
    *settings = new_settings;
    info!("Sync settings updated: interval={}min, auto={}", settings.sync_interval_minutes, settings.auto_sync_enabled);
    Ok(())
}

#[tauri::command]
async fn get_sync_history(
    db: State<'_, DatabaseState>,
    limit: Option<u32>,
) -> Result<Vec<SyncHistory>, String> {
    log::info!("get_sync_history called with limit: {:?}", limit);
    let db = db.lock().unwrap();
    match db.get_sync_history(limit) {
        Ok(history) => {
            log::info!("Retrieved {} sync history entries", history.len());
            Ok(history)
        }
        Err(e) => {
            log::error!("Failed to get sync history: {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
async fn open_external_url(url: String) -> Result<(), String> {
    log::info!("Opening external URL: {}", url);
    
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(&["/c", "start", &url])
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }
    
    Ok(())
}

async fn start_sync_scheduler(
    db: Arc<std::sync::Mutex<Database>>,
    settings: Arc<std::sync::Mutex<SyncSettings>>,
) {
    let mut interval_timer = interval(Duration::from_secs(60)); // Check every minute
    let mut last_sync_interval = 0u64;
    
    loop {
        interval_timer.tick().await;
        
        let (sync_interval, auto_sync_enabled) = {
            let settings = settings.lock().unwrap();
            (settings.sync_interval_minutes, settings.auto_sync_enabled)
        };
        
        // If auto sync is disabled, continue waiting
        if !auto_sync_enabled {
            continue;
        }
        
        // If interval changed, restart the timer
        if last_sync_interval != sync_interval {
            last_sync_interval = sync_interval;
            interval_timer = interval(Duration::from_secs(sync_interval * 60));
            continue;
        }
        
        // Check if sync is already in progress
        let is_sync_in_progress = {
            let db_guard = db.lock().unwrap();
            db_guard.is_sync_in_progress()
        };
        
        if is_sync_in_progress {
            info!("⏳ Scheduled sync skipped - sync already in progress");
            continue;
        }
        
        // Perform scheduled sync (wait for completion)
        info!("⏰ Starting scheduled sync (interval: {}min)", sync_interval);
        
        let db_clone = db.clone();
        let sync_result = tokio::task::spawn_blocking(move || {
            let mut db_guard = db_clone.lock().unwrap();
            tokio::runtime::Handle::current().block_on(async {
                db_guard.sync_all_providers().await
            })
        }).await;
        
        match sync_result {
            Ok(Ok(())) => info!("✅ Scheduled sync completed successfully"),
            Ok(Err(e)) => error!("❌ Scheduled sync failed: {}", e),
            Err(e) => error!("❌ Scheduled sync task failed: {}", e),
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Set up panic hook to prevent "panic in a function that cannot unwind" errors
    std::panic::set_hook(Box::new(|panic_info| {
        log::error!("🚨 Application panic: {}", panic_info);
        if let Some(location) = panic_info.location() {
            log::error!("Panic location: {}:{}", location.file(), location.line());
        }
    }));
    
    env_logger::init();
    log::info!("🚀 Starting Tauri application");
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Wrap the entire setup in a catch_unwind to prevent panics from crashing the app
            let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                log::info!("⚙️ Setting up application");
            
            // デバッグビルドでのみDevToolsを開く（安全な遅延実行）
            #[cfg(debug_assertions)]
            {
                log::info!("🛠️ Scheduling DevTools opening (debug build)");
                if let Some(window) = app.get_webview_window("main") {
                    let window_clone = window.clone();
                    
                    // DevToolsを少し遅延して開く（macOSでのタイミング問題を回避）
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(1000));
                        window_clone.open_devtools();
                        log::info!("✅ DevTools opened successfully");
                    });
                } else {
                    log::warn!("Main window not found, skipping DevTools opening");
                }
            }
            // Get the custom database directory: ~/.tauriapp/
            let home_dir = std::env::var("HOME").or_else(|_| std::env::var("USERPROFILE")).unwrap_or_else(|_| {
                log::warn!("Could not determine home directory, using current directory");
                std::env::current_dir().unwrap_or_default().to_string_lossy().to_string()
            });
            
            let mut app_data_dir = std::path::PathBuf::from(home_dir);
            app_data_dir.push(".tauriapp");
            
            log::info!("📁 App data directory: {:?}", app_data_dir);
            
            // Create the directory if it doesn't exist
            std::fs::create_dir_all(&app_data_dir).map_err(|e| {
                log::error!("❌ Failed to create app data directory: {}", e);
                e
            })?;
            
            log::debug!("✅ App data directory created/verified");
            
            let mut db_path = app_data_dir.clone();
            db_path.push("db.sqlite3");
            
            log::info!("🗄️ Database path: {:?}", db_path);
            
            let database = match Database::new(&db_path) {
                Ok(db) => db,
                Err(e) => {
                    log::error!("❌ Critical Error: Failed to initialize database");
                    log::error!("❌ Error details: {}", e);
                    log::error!("❌ Database path: {:?}", db_path);
                    log::error!("❌ App data dir: {:?}", app_data_dir);
                    log::error!("❌ Current working directory: {:?}", std::env::current_dir().unwrap_or_default());
                    
                    // Check if database file exists and is readable
                    if db_path.exists() {
                        log::error!("❌ Database file exists but cannot be opened");
                        if let Ok(metadata) = std::fs::metadata(&db_path) {
                            log::error!("❌ Database file size: {} bytes", metadata.len());
                            log::error!("❌ Database file permissions: {:?}", metadata.permissions());
                        }
                    } else {
                        log::error!("❌ Database file does not exist");
                    }
                    
                    // Check directory permissions
                    if app_data_dir.exists() {
                        if let Ok(metadata) = std::fs::metadata(&app_data_dir) {
                            log::error!("❌ App data directory permissions: {:?}", metadata.permissions());
                        }
                    } else {
                        log::error!("❌ App data directory does not exist");
                    }
                    
                    log::error!("❌ Application cannot continue without a working database");
                    log::error!("❌ Please check file permissions and disk space");
                    
                    // Force application to exit with error code
                    std::process::exit(1);
                }
            };
            
            log::info!("✅ Database initialized successfully");
            let db_state = std::sync::Arc::new(std::sync::Mutex::new(database));
            app.manage(db_state.clone());
            
            // Initialize sync settings
            let sync_settings = std::sync::Arc::new(std::sync::Mutex::new(SyncSettings::default()));
            app.manage(sync_settings.clone());
            
            // Start sync scheduler in the background
            log::info!("🕐 Starting sync scheduler");
            let db_state_clone = db_state.clone();
            let sync_settings_clone = sync_settings.clone();
            std::thread::spawn(move || {
                let rt = tokio::runtime::Runtime::new().unwrap();
                rt.block_on(start_sync_scheduler(db_state_clone, sync_settings_clone));
            });
            
                log::info!("🎯 Application setup completed");
                
                Ok(())
            }));
            
            // Handle the result of catch_unwind
            match result {
                Ok(setup_result) => setup_result,
                Err(panic_payload) => {
                    log::error!("🚨 Setup function panicked, recovering...");
                    if let Some(s) = panic_payload.downcast_ref::<String>() {
                        log::error!("Panic message: {}", s);
                    } else if let Some(s) = panic_payload.downcast_ref::<&str>() {
                        log::error!("Panic message: {}", s);
                    }
                    
                    // Return an error to prevent the app from continuing in a broken state
                    Err("Application setup failed due to panic".into())
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            // Provider commands
            get_git_providers,
            get_git_provider,
            add_git_provider,
            update_provider_token,
            validate_provider_token,
            delete_provider,
            // Repository commands
            get_all_repositories,
            get_repositories_by_provider,
            get_repository,
            add_repository,
            delete_repository,
            // Issue commands
            get_issues,
            get_issue,
            get_issue_stats,
            // Pull Request commands
            get_pull_requests,
            get_pull_request,
            get_pull_request_stats,
            // Workflow commands
            get_workflows,
            get_workflow,
            get_workflow_stats,
            // Sync commands
            sync_provider,
            sync_all_providers,
            sync_repository,
            is_sync_in_progress,
            get_sync_status,
            reset_sync_lock,
            get_sync_settings,
            update_sync_settings,
            get_sync_history,
            open_external_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
