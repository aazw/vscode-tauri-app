// Simple test to verify database functionality works
#[cfg(test)]
mod tests {
    use crate::database::Database;
    use tempfile::tempdir;
    use std::fs;

    #[test]
    fn test_database_initialization() {
        // Create a temporary directory for testing
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test_db.sqlite3");
        
        // Test database creation
        let db = Database::new(&db_path);
        assert!(db.is_ok(), "Database creation should succeed");
        
        // Test that the database file was created
        assert!(db_path.exists(), "Database file should exist");
        
        // Test basic provider operations
        let mut db = db.unwrap();
        let providers = db.get_providers();
        assert!(providers.is_ok(), "Should be able to get providers");
        
        // Should have seed data
        let providers = providers.unwrap();
        assert!(!providers.is_empty(), "Should have seed providers");
        
        println!("✅ Database test passed with {} providers", providers.len());
    }

    #[test]
    fn test_database_with_existing_file() {
        // Create a temporary directory for testing
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("existing_db.sqlite3");
        
        // Create database first time
        let db1 = Database::new(&db_path).unwrap();
        drop(db1);
        
        // Create database second time (should not fail)
        let db2 = Database::new(&db_path);
        assert!(db2.is_ok(), "Database creation should succeed with existing file");
        
        let mut db2 = db2.unwrap();
        let providers = db2.get_providers().unwrap();
        assert!(!providers.is_empty(), "Should still have providers");
        
        println!("✅ Existing database test passed");
    }
}