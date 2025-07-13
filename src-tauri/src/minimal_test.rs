// Minimal test to verify database functionality works
use crate::database::Database;

pub fn test_database_minimal() {
    println!("🧪 Testing database functionality...");
    
    // Test with a temporary database file
    let temp_db_path = "/tmp/test_minimal_db.sqlite3";
    
    // Remove existing file if it exists
    if std::path::Path::new(temp_db_path).exists() {
        std::fs::remove_file(temp_db_path).ok();
    }
    
    // Test database creation
    match Database::new(temp_db_path) {
        Ok(mut db) => {
            println!("✅ Database created successfully");
            
            // Test basic operations
            match db.get_providers() {
                Ok(providers) => {
                    println!("✅ Got {} providers", providers.len());
                    for provider in providers.iter().take(3) {
                        println!("  - {}: {}", provider.name, provider.provider_type);
                    }
                }
                Err(e) => {
                    println!("❌ Failed to get providers: {}", e);
                }
            }
            
            // Test repositories
            match db.get_repositories() {
                Ok(repos) => {
                    println!("✅ Got {} repositories", repos.len());
                    for repo in repos.iter().take(3) {
                        println!("  - {}: {}", repo.name, repo.provider_name);
                    }
                }
                Err(e) => {
                    println!("❌ Failed to get repositories: {}", e);
                }
            }
            
            println!("🎉 Database test completed successfully");
        }
        Err(e) => {
            println!("❌ Database creation failed: {}", e);
        }
    }
    
    // Clean up
    if std::path::Path::new(temp_db_path).exists() {
        std::fs::remove_file(temp_db_path).ok();
    }
}