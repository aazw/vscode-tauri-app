use rusqlite::Connection;
use refinery::embed_migrations;
use tempfile::tempdir;

embed_migrations!("migrations");

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_migrations() {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        
        let mut conn = Connection::open(&db_path).unwrap();
        
        // Run migrations
        let report = migrations::runner().run(&mut conn).unwrap();
        
        println!("Applied {} migrations", report.applied_migrations().len());
        
        // Check that tables exist
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
    }
}