use tauri_app_lib::database::Database;
use tempfile::tempdir;

#[test]
fn test_database_basic_functionality() {
    let temp_dir = tempdir().unwrap();
    let db_path = temp_dir.path().join("test_minimal_db.sqlite3");
    
    // Test database creation
    let db = Database::new(&db_path).unwrap();
    
    // Test basic operations
    let providers = db.get_providers().unwrap();
    assert!(providers.len() >= 2, "Should have at least 2 default providers");
    
    // Verify default providers exist
    assert!(providers.iter().any(|p| p.name.contains("GitHub")));
    assert!(providers.iter().any(|p| p.name.contains("GitLab")));
    
    // Test repositories (should be empty initially)
    let repos = db.get_repositories().unwrap();
    assert_eq!(repos.len(), 0, "Should start with no repositories");
}

#[test]
fn test_database_initialization_multiple_times() {
    let temp_dir = tempdir().unwrap();
    let db_path = temp_dir.path().join("test_multi_init.sqlite3");
    
    // Create database first time
    let db1 = Database::new(&db_path).unwrap();
    let providers1 = db1.get_providers().unwrap();
    let initial_count = providers1.len();
    
    // Create database second time (should load existing)
    let db2 = Database::new(&db_path).unwrap();
    let providers2 = db2.get_providers().unwrap();
    
    // Should have same number of providers
    assert_eq!(providers2.len(), initial_count);
}

#[test]
fn test_database_file_permissions() {
    let temp_dir = tempdir().unwrap();
    let db_path = temp_dir.path().join("test_permissions.sqlite3");
    
    // Create database
    let _db = Database::new(&db_path).unwrap();
    
    // Verify file exists and is readable
    assert!(db_path.exists());
    assert!(db_path.is_file());
    
    // Should be able to read the file
    let metadata = std::fs::metadata(&db_path).unwrap();
    assert!(metadata.len() > 0);
}

#[test]
fn test_concurrent_database_access() {
    use std::sync::Arc;
    use std::thread;
    
    let temp_dir = tempdir().unwrap();
    let db_path = temp_dir.path().join("test_concurrent.sqlite3");
    
    // Create initial database
    let _db = Database::new(&db_path).unwrap();
    
    let db_path = Arc::new(db_path);
    
    // Spawn multiple threads to access database
    let handles: Vec<_> = (0..3).map(|i| {
        let db_path_clone = Arc::clone(&db_path);
        thread::spawn(move || {
            let db = Database::new(&*db_path_clone).unwrap();
            let providers = db.get_providers().unwrap();
            println!("Thread {}: Found {} providers", i, providers.len());
            assert!(providers.len() >= 2);
        })
    }).collect();
    
    // Wait for all threads to complete
    for handle in handles {
        handle.join().unwrap();
    }
}

#[test]
fn test_database_error_handling() {
    // Test with invalid path (should handle gracefully)
    let result = Database::new("/invalid/path/to/database.sqlite3");
    
    // Should return an error, not panic
    match result {
        Ok(_) => panic!("Expected error for invalid path"),
        Err(e) => {
            // Error should contain meaningful message
            let error_msg = e.to_string();
            assert!(!error_msg.is_empty());
        }
    }
}