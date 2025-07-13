use std::path::PathBuf;

// Simple test to check database initialization
fn main() {
    env_logger::init();
    
    let test_db_path = PathBuf::from("test_migration.db");
    
    // Remove test database if it exists
    if test_db_path.exists() {
        std::fs::remove_file(&test_db_path).expect("Failed to remove test database");
    }
    
    println!("Testing database initialization with new schema...");
    
    // Test database initialization
    match tauri_app::database::Database::new(&test_db_path) {
        Ok(db) => {
            println!("✅ Database initialized successfully");
            
            // Test getting providers (should return empty list initially)
            match db.get_providers() {
                Ok(providers) => {
                    println!("✅ Get providers successful: {} providers found", providers.len());
                    
                    // Print any default providers
                    for provider in providers {
                        println!("  - {}: {} ({})", provider.id, provider.name, provider.provider_type);
                    }
                }
                Err(e) => {
                    println!("❌ Failed to get providers: {}", e);
                    std::process::exit(1);
                }
            }
        }
        Err(e) => {
            println!("❌ Failed to initialize database: {}", e);
            std::process::exit(1);
        }
    }
    
    // Clean up
    if test_db_path.exists() {
        std::fs::remove_file(&test_db_path).expect("Failed to clean up test database");
    }
    
    println!("✅ Migration test completed successfully");
}