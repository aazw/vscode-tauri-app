use tauri_app_lib::database::*;
use tempfile::tempdir;
use chrono::Utc;

// Helper function to create a test database
fn create_test_db() -> (Database, tempfile::TempDir) {
    let temp_dir = tempdir().unwrap();
    let db_path = temp_dir.path().join("test_db.sqlite3");
    let db = Database::new(&db_path).unwrap();
    (db, temp_dir)
}

// Helper function to create a test provider
fn create_test_provider(name: &str, provider_type: &str) -> GitProvider {
    GitProvider {
        id: 0, // Will be set by database
        name: name.to_string(),
        provider_type: provider_type.to_string(),
        base_url: format!("https://api.{}.com", provider_type),
        token: None,
        token_valid: false,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    }
}

// Helper function to create a test repository
fn create_test_repository(provider_id: i64, name: &str) -> Repository {
    Repository {
        id: 0, // Will be set by database
        api_id: format!("api-{}", name),
        name: name.to_string(),
        full_name: format!("user/{}", name),
        web_url: format!("https://github.com/user/{}", name),
        description: Some(format!("Description for {}", name)),
        provider_id,
        provider_name: "Test Provider".to_string(),
        provider_type: "github".to_string(),
        is_private: false,
        language: Some("Rust".to_string()),
        last_activity: Some(Utc::now()),
        api_created_at: Some(Utc::now()),
        api_updated_at: Some(Utc::now()),
        last_issues_sync: None,
        last_pull_requests_sync: None,
        last_workflows_sync: None,
        last_issues_sync_status: None,
        last_pull_requests_sync_status: None,
        last_workflows_sync_status: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    }
}

// ========== Database Creation Tests ==========

#[test]
fn test_new_database_creates_file() {
    let temp_dir = tempdir().unwrap();
    let db_path = temp_dir.path().join("new_db.sqlite3");
    
    assert!(!db_path.exists());
    let _db = Database::new(&db_path).unwrap();
    assert!(db_path.exists());
}

#[test]
fn test_database_initializes_default_providers() {
    let (db, _temp_dir) = create_test_db();
    let providers = db.get_providers().unwrap();
    
    assert!(providers.len() >= 2);
    // Check that default providers exist (we can't rely on specific IDs)
    assert!(providers.iter().any(|p| p.name.contains("GitHub")));
    assert!(providers.iter().any(|p| p.name.contains("GitLab")));
}

// ========== Provider CRUD Tests ==========

#[test]
fn test_add_provider_success() {
    let (mut db, _temp_dir) = create_test_db();
    let provider = create_test_provider("Test Provider", "github");
    
    let result = db.add_provider(&provider);
    assert!(result.is_ok());
    
    // Get the provider by its ID after creation (providers are auto-incremented)
    let providers = db.get_providers().unwrap();
    let added_provider = providers.iter().find(|p| p.name == "Test Provider").unwrap();
    assert_eq!(added_provider.name, "Test Provider");
}

#[test]
fn test_get_provider_not_found() {
    let (db, _temp_dir) = create_test_db();
    let result = db.get_provider(99999); // Non-existent ID
    assert!(result.is_err());
}

#[test]
fn test_get_providers_returns_list() {
    let (mut db, _temp_dir) = create_test_db();
    
    let provider1 = create_test_provider("Provider 1", "github");
    let provider2 = create_test_provider("Provider 2", "gitlab");
    
    db.add_provider(&provider1).unwrap();
    db.add_provider(&provider2).unwrap();
    
    let providers = db.get_providers().unwrap();
    // Should have at least 4 providers (2 default + 2 added)
    assert!(providers.len() >= 4);
    
    // Check our added providers exist
    assert!(providers.iter().any(|p| p.name == "Provider 1"));
    assert!(providers.iter().any(|p| p.name == "Provider 2"));
}

#[test]
fn test_update_provider_token() {
    let (mut db, _temp_dir) = create_test_db();
    let provider = create_test_provider("Test Provider", "github");
    db.add_provider(&provider).unwrap();
    
    // Find the created provider
    let providers = db.get_providers().unwrap();
    let created_provider = providers.iter().find(|p| p.name == "Test Provider").unwrap();
    let provider_id = created_provider.id;
    
    let old_updated_at = created_provider.updated_at;
    
    // Wait a moment to ensure timestamp difference
    std::thread::sleep(std::time::Duration::from_millis(10));
    
    let result = db.update_provider_token(provider_id, Some("new-token"));
    assert!(result.is_ok());
    
    let updated_provider = db.get_provider(provider_id).unwrap();
    assert!(updated_provider.updated_at > old_updated_at);
}

#[test]
fn test_delete_provider_and_cascade() {
    let (mut db, _temp_dir) = create_test_db();
    
    // Add provider and repository
    let provider = create_test_provider("Test Provider", "github");
    db.add_provider(&provider).unwrap();
    
    // Find the created provider
    let providers = db.get_providers().unwrap();
    let created_provider = providers.iter().find(|p| p.name == "Test Provider").unwrap();
    let provider_id = created_provider.id;
    
    let repository = create_test_repository(provider_id, "test-repo");
    db.add_repository(&repository).unwrap();
    
    // Find the created repository
    let repositories = db.get_repositories().unwrap();
    let created_repository = repositories.iter().find(|r| r.name == "test-repo").unwrap();
    let repository_id = created_repository.id;
    
    // Verify they exist
    assert!(db.get_provider(provider_id).is_ok());
    assert!(db.get_repository(repository_id).is_ok());
    
    // Delete provider
    let result = db.delete_provider(provider_id);
    assert!(result.is_ok());
    
    // Verify cascade deletion
    assert!(db.get_provider(provider_id).is_err());
    assert!(db.get_repository(repository_id).is_err());
}

// ========== Repository CRUD Tests ==========

#[test]
fn test_add_repository_success() {
    let (mut db, _temp_dir) = create_test_db();
    
    // Get a default provider
    let providers = db.get_providers().unwrap();
    let default_provider = &providers[0];
    
    let repository = create_test_repository(default_provider.id, "test-repo");
    
    let result = db.add_repository(&repository);
    assert!(result.is_ok());
    
    // Find the created repository
    let repositories = db.get_repositories().unwrap();
    let created_repository = repositories.iter().find(|r| r.name == "test-repo").unwrap();
    assert_eq!(created_repository.name, "test-repo");
}

#[test]
fn test_get_repository_not_found() {
    let (db, _temp_dir) = create_test_db();
    let result = db.get_repository(99999); // Non-existent ID
    assert!(result.is_err());
}

#[test]
fn test_get_repositories_by_provider() {
    let (mut db, _temp_dir) = create_test_db();
    
    // Get default providers
    let providers = db.get_providers().unwrap();
    let provider1_id = providers[0].id;
    let provider2_id = providers[1].id;
    
    let repo1 = create_test_repository(provider1_id, "repo1");
    let repo2 = create_test_repository(provider2_id, "repo2");
    let repo3 = create_test_repository(provider1_id, "repo3");
    
    db.add_repository(&repo1).unwrap();
    db.add_repository(&repo2).unwrap();
    db.add_repository(&repo3).unwrap();
    
    let provider1_repos = db.get_repositories_by_provider(provider1_id).unwrap();
    assert_eq!(provider1_repos.len(), 2);
    
    let provider2_repos = db.get_repositories_by_provider(provider2_id).unwrap();
    assert_eq!(provider2_repos.len(), 1);
}

// ========== Basic Database Operations ==========

#[test]
fn test_get_issues_empty() {
    let (db, _temp_dir) = create_test_db();
    
    let result = db.get_issues(&None, &None).unwrap();
    assert_eq!(result.data.len(), 0);
    assert_eq!(result.pagination.total, 0);
    assert_eq!(result.pagination.page, 1);
    assert_eq!(result.pagination.per_page, 20);
}

#[test]
fn test_get_issue_stats_empty() {
    let (db, _temp_dir) = create_test_db();
    
    let stats = db.get_issue_stats(&None).unwrap();
    assert_eq!(stats.total, 0);
    assert_eq!(stats.open, 0);
    assert_eq!(stats.closed, 0);
}

#[test]
fn test_get_pull_requests_empty() {
    let (db, _temp_dir) = create_test_db();
    
    let result = db.get_pull_requests(&None, &None).unwrap();
    assert_eq!(result.data.len(), 0);
    assert_eq!(result.pagination.total, 0);
}

#[test]
fn test_get_pull_request_stats_empty() {
    let (db, _temp_dir) = create_test_db();
    
    let stats = db.get_pull_request_stats(&None).unwrap();
    assert_eq!(stats.total, 0);
    assert_eq!(stats.open, 0);
    assert_eq!(stats.merged, 0);
    assert_eq!(stats.closed, 0);
}

#[test]
fn test_get_workflows_empty() {
    let (db, _temp_dir) = create_test_db();
    
    let result = db.get_workflows(&None, &None).unwrap();
    assert_eq!(result.data.len(), 0);
    assert_eq!(result.pagination.total, 0);
}

#[test]
fn test_get_workflow_stats_empty() {
    let (db, _temp_dir) = create_test_db();
    
    let stats = db.get_workflow_stats(&None).unwrap();
    assert_eq!(stats.total, 0);
    assert_eq!(stats.success, 0);
    assert_eq!(stats.failure, 0);
    assert_eq!(stats.in_progress, 0);
    assert_eq!(stats.cancelled, 0);
}

// ========== Pagination Tests ==========

#[test]
fn test_pagination_with_zero_per_page() {
    let (db, _temp_dir) = create_test_db();
    
    let pagination = PaginationParams { page: 1, per_page: 0 };
    let result = db.get_issues(&None, &Some(pagination)).unwrap();
    // Should handle zero per_page gracefully
    assert_eq!(result.data.len(), 0);
}

#[test]
fn test_large_pagination_numbers() {
    let (db, _temp_dir) = create_test_db();
    
    let pagination = PaginationParams { page: u32::MAX, per_page: u32::MAX };
    let result = db.get_issues(&None, &Some(pagination));
    // Should not panic with large numbers
    assert!(result.is_ok());
}

// ========== Filter Tests ==========

#[test]
fn test_filters_with_empty_values() {
    let (db, _temp_dir) = create_test_db();
    
    let filters = IssueFilters {
        state: Some("".to_string()),
        assigned: Some("".to_string()),
        provider: Some("".to_string()),
        repository: Some("".to_string()),
        search: Some("".to_string()),
    };
    
    let result = db.get_issues(&Some(filters), &None).unwrap();
    // Empty filters should not crash
    assert_eq!(result.data.len(), 0);
}

// ========== Sync Tests ==========

#[test]
fn test_sync_repository() {
    let (mut db, _temp_dir) = create_test_db();
    
    // Get a default provider
    let providers = db.get_providers().unwrap();
    let default_provider = &providers[0];
    
    let repository = create_test_repository(default_provider.id, "test-repo");
    db.add_repository(&repository).unwrap();
    
    // Find the created repository
    let repositories = db.get_repositories().unwrap();
    let created_repository = repositories.iter().find(|r| r.name == "test-repo").unwrap();
    let repository_id = created_repository.id;
    
    let result = db.sync_repository(repository_id);
    assert!(result.is_ok());
}

// ========== Sync History Tests ==========

#[test]
fn test_get_sync_history() {
    let (db, _temp_dir) = create_test_db();
    
    let history = db.get_sync_history(Some(10)).unwrap();
    // Should return empty list initially
    assert_eq!(history.len(), 0);
}

// ========== Concurrent Access Tests ==========

#[test]
fn test_concurrent_database_operations() {
    use std::sync::{Arc, Mutex};
    use std::thread;
    
    let temp_dir = tempdir().unwrap();
    let db_path = temp_dir.path().join("concurrent_db.sqlite3");
    let db = Arc::new(Mutex::new(Database::new(&db_path).unwrap()));
    
    let handles: Vec<_> = (0..3).map(|i| {
        let db_clone = Arc::clone(&db);
        thread::spawn(move || {
            let provider = create_test_provider(&format!("Provider {}", i), "github");
            let mut db_lock = db_clone.lock().unwrap();
            db_lock.add_provider(&provider).unwrap();
        })
    }).collect();
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    let db_lock = db.lock().unwrap();
    let providers = db_lock.get_providers().unwrap();
    // Should have at least 5 providers (2 default + 3 added)
    assert!(providers.len() >= 5);
}