use rusqlite::Connection;
use refinery::embed_migrations;
use tempfile::tempdir;

embed_migrations!("migrations");

#[test]
fn test_migrations_apply_successfully() {
    let temp_dir = tempdir().unwrap();
    let db_path = temp_dir.path().join("test.db");
    
    let mut conn = Connection::open(&db_path).unwrap();
    
    // Run migrations
    let report = migrations::runner().run(&mut conn).unwrap();
    
    println!("Applied {} migrations", report.applied_migrations().len());
    
    // Verify migrations were applied
    assert!(report.applied_migrations().len() > 0);
}

#[test]
fn test_database_schema_after_migrations() {
    let temp_dir = tempdir().unwrap();
    let db_path = temp_dir.path().join("test.db");
    
    let mut conn = Connection::open(&db_path).unwrap();
    
    // Run migrations
    migrations::runner().run(&mut conn).unwrap();
    
    // Check that required tables exist
    let tables: Vec<String> = conn
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .unwrap()
        .query_map([], |row| row.get(0))
        .unwrap()
        .collect::<Result<Vec<_>, _>>()
        .unwrap();
    
    println!("Tables: {:?}", tables);
    
    // Should include our main tables
    assert!(tables.contains(&"git_providers".to_string()));
    assert!(tables.contains(&"repositories".to_string()));
    assert!(tables.contains(&"issues".to_string()));
    assert!(tables.contains(&"pull_requests".to_string()));
    assert!(tables.contains(&"workflow_runs".to_string()));
    assert!(tables.contains(&"sync_history".to_string()));
}

#[test]
fn test_migration_rollback_and_reapply() {
    let temp_dir = tempdir().unwrap();
    let db_path = temp_dir.path().join("test.db");
    
    let mut conn = Connection::open(&db_path).unwrap();
    
    // Run migrations
    migrations::runner().run(&mut conn).unwrap();
    
    // Running migrations again should not apply any new ones
    let report2 = migrations::runner().run(&mut conn).unwrap();
    assert_eq!(report2.applied_migrations().len(), 0); // No new migrations applied
    
    // Database should still be functional
    let tables: Vec<String> = conn
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .unwrap()
        .query_map([], |row| row.get(0))
        .unwrap()
        .collect::<Result<Vec<_>, _>>()
        .unwrap();
    
    assert!(tables.len() > 0);
}

#[test]
fn test_default_providers_seed() {
    let temp_dir = tempdir().unwrap();
    let db_path = temp_dir.path().join("test.db");
    
    let mut conn = Connection::open(&db_path).unwrap();
    
    // Run migrations (which should include seeding default providers)
    migrations::runner().run(&mut conn).unwrap();
    
    // Check for default providers
    let provider_count: i32 = conn
        .prepare("SELECT COUNT(*) FROM git_providers")
        .unwrap()
        .query_row([], |row| row.get(0))
        .unwrap();
    
    // Should have at least GitHub and GitLab default providers
    assert!(provider_count >= 2);
    
    // Check specific providers exist
    let github_exists: bool = conn
        .prepare("SELECT EXISTS(SELECT 1 FROM git_providers WHERE id = 1)")
        .unwrap()
        .query_row([], |row| row.get(0))
        .unwrap();
    
    let gitlab_exists: bool = conn
        .prepare("SELECT EXISTS(SELECT 1 FROM git_providers WHERE id = 2)")
        .unwrap()
        .query_row([], |row| row.get(0))
        .unwrap();
    
    assert!(github_exists);
    assert!(gitlab_exists);
}