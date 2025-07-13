use std::path::Path;

// Include the database module directly
mod database {
    use serde::{Deserialize, Serialize};
    use std::path::Path;
    use chrono::{DateTime, Utc};
    use std::collections::HashMap;

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct GitProvider {
        pub id: String,
        pub name: String,
        pub provider_type: String,
        pub base_url: String,
        pub updated_at: DateTime<Utc>,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct Repository {
        pub id: String,
        pub name: String,
        pub full_name: String,
        pub web_url: String,
        pub description: Option<String>,
        pub provider_id: String,
        pub provider_name: String,
        pub provider_type: String,
        pub is_private: bool,
        pub default_branch: String,
        pub language: Option<String>,
        pub last_activity: Option<DateTime<Utc>>,
        pub updated_at: DateTime<Utc>,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct Issue {
        pub id: String,
        pub repository_id: String,
        pub number: u32,
        pub title: String,
        pub body: Option<String>,
        pub repository: String,
        pub provider: String,
        pub assignee: Option<String>,
        pub author: String,
        pub state: String, // "open" | "closed"
        pub labels: Vec<String>,
        pub url: String,
        pub created_at: DateTime<Utc>,
        pub updated_at: DateTime<Utc>,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct PullRequest {
        pub id: String,
        pub repository_id: String,
        pub number: u32,
        pub title: String,
        pub body: Option<String>,
        pub repository: String,
        pub provider: String,
        pub assignee: Option<String>,
        pub author: String,
        pub state: String, // "open" | "closed" | "merged"
        pub draft: bool,
        pub url: String,
        pub created_at: DateTime<Utc>,
        pub updated_at: DateTime<Utc>,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct WorkflowRun {
        pub id: String,
        pub repository_id: String,
        pub name: String,
        pub repository: String,
        pub provider: String,
        pub status: String, // "success" | "failure" | "in_progress" | "cancelled"
        pub conclusion: Option<String>,
        pub branch: String,
        pub commit_sha: String,
        pub commit_message: String,
        pub author: String,
        pub url: String,
        pub created_at: DateTime<Utc>,
        pub updated_at: DateTime<Utc>,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct IssueFilters {
        pub state: Option<String>,
        pub assigned: Option<String>,
        pub provider: Option<String>,
        pub repository: Option<String>,
        pub search: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct PullRequestFilters {
        pub state: Option<String>,
        pub assigned: Option<String>,
        pub provider: Option<String>,
        pub repository: Option<String>,
        pub search: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct WorkflowFilters {
        pub status: Option<String>,
        pub provider: Option<String>,
        pub repository: Option<String>,
        pub search: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct PaginationParams {
        pub page: u32,
        pub per_page: u32,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct PaginatedResponse<T> {
        pub data: Vec<T>,
        pub pagination: PaginationInfo,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct PaginationInfo {
        pub page: u32,
        pub per_page: u32,
        pub total: u32,
        pub total_pages: u32,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct IssueStats {
        pub total: u32,
        pub open: u32,
        pub closed: u32,
        pub assigned: u32,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct PullRequestStats {
        pub total: u32,
        pub open: u32,
        pub merged: u32,
        pub closed: u32,
        pub assigned: u32,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct WorkflowStats {
        pub total: u32,
        pub success: u32,
        pub failure: u32,
        pub in_progress: u32,
        pub cancelled: u32,
    }

    #[derive(Debug, Serialize, Deserialize, Default)]
    pub struct DatabaseData {
        pub providers: HashMap<String, GitProvider>,
        pub repositories: HashMap<String, Repository>,
        pub issues: HashMap<String, Issue>,
        pub pull_requests: HashMap<String, PullRequest>,
        pub workflows: HashMap<String, WorkflowRun>,
    }

    pub struct Database {
        pub data: DatabaseData,
        file_path: std::path::PathBuf,
    }

    impl Database {
        pub fn new(db_path: &Path) -> Result<Self, Box<dyn std::error::Error>> {
            let file_path = db_path.to_path_buf();
            let data = if file_path.exists() {
                let content = std::fs::read_to_string(&file_path)?;
                serde_json::from_str(&content).unwrap_or_default()
            } else {
                DatabaseData::default()
            };

            let mut db = Database { data, file_path };
            db.init_default_providers()?;
            Ok(db)
        }

        fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
            let content = serde_json::to_string_pretty(&self.data)?;
            std::fs::write(&self.file_path, content)?;
            Ok(())
        }

        fn init_default_providers(&mut self) -> Result<(), Box<dyn std::error::Error>> {
            let now = Utc::now();
            
            if self.data.providers.is_empty() {
                // Add GitHub.com
                let github_provider = GitProvider {
                    id: "github-com".to_string(),
                    name: "GitHub.com".to_string(),
                    provider_type: "github".to_string(),
                    base_url: "https://api.github.com".to_string(),
                    updated_at: now,
                };
                self.data.providers.insert(github_provider.id.clone(), github_provider);

                // Add GitLab.com
                let gitlab_provider = GitProvider {
                    id: "gitlab-com".to_string(),
                    name: "GitLab.com".to_string(),
                    provider_type: "gitlab".to_string(),
                    base_url: "https://gitlab.com/api/v4".to_string(),
                    updated_at: now,
                };
                self.data.providers.insert(gitlab_provider.id.clone(), gitlab_provider);

                self.save()?;
            }

            Ok(())
        }

        pub fn add_provider(&mut self, provider: &GitProvider) -> Result<(), Box<dyn std::error::Error>> {
            self.data.providers.insert(provider.id.clone(), provider.clone());
            self.save()?;
            Ok(())
        }

        pub fn get_providers(&self) -> Result<Vec<GitProvider>, Box<dyn std::error::Error>> {
            let mut providers: Vec<GitProvider> = self.data.providers.values().cloned().collect();
            providers.sort_by(|a, b| a.updated_at.cmp(&b.updated_at));
            Ok(providers)
        }

        pub fn get_provider(&self, provider_id: &str) -> Result<GitProvider, Box<dyn std::error::Error>> {
            self.data.providers.get(provider_id)
                .cloned()
                .ok_or_else(|| format!("Provider with ID {} not found", provider_id).into())
        }

        pub fn add_repository(&mut self, repo: &Repository) -> Result<(), Box<dyn std::error::Error>> {
            self.data.repositories.insert(repo.id.clone(), repo.clone());
            self.save()?;
            Ok(())
        }

        pub fn get_repository(&self, repository_id: &str) -> Result<Repository, Box<dyn std::error::Error>> {
            self.data.repositories.get(repository_id)
                .cloned()
                .ok_or_else(|| format!("Repository with ID {} not found", repository_id).into())
        }

        pub fn delete_repository(&mut self, repository_id: &str) -> Result<(), Box<dyn std::error::Error>> {
            self.data.repositories.remove(repository_id);
            // Also remove related issues, PRs, and workflows
            self.data.issues.retain(|_, issue| issue.repository_id != repository_id);
            self.data.pull_requests.retain(|_, pr| pr.repository_id != repository_id);
            self.data.workflows.retain(|_, workflow| workflow.repository_id != repository_id);
            self.save()?;
            Ok(())
        }

        pub fn update_provider_token(&mut self, provider_id: &str, _token: Option<String>) -> Result<(), Box<dyn std::error::Error>> {
            if let Some(provider) = self.data.providers.get_mut(provider_id) {
                provider.updated_at = Utc::now();
                self.save()?;
            }
            Ok(())
        }

        pub fn sync_provider(&mut self, provider_id: &str) -> Result<(), Box<dyn std::error::Error>> {
            if let Some(provider) = self.data.providers.get_mut(provider_id) {
                provider.updated_at = Utc::now();
                self.save()?;
            }
            Ok(())
        }

        pub fn delete_provider(&mut self, provider_id: &str) -> Result<(), Box<dyn std::error::Error>> {
            // Remove all repositories for this provider
            self.data.repositories.retain(|_, repo| repo.provider_id != provider_id);
            
            // Remove the provider
            self.data.providers.remove(provider_id);
            
            self.save()?;
            Ok(())
        }

        pub fn get_issues(&self, filters: &Option<IssueFilters>, pagination: &Option<PaginationParams>) -> Result<PaginatedResponse<Issue>, Box<dyn std::error::Error>> {
            let mut issues: Vec<Issue> = self.data.issues.values().cloned().collect();
            
            // Apply filters
            if let Some(f) = filters {
                if let Some(state) = &f.state {
                    if state != "all" {
                        issues.retain(|issue| issue.state == *state);
                    }
                }
                if let Some(assigned) = &f.assigned {
                    if assigned == "me" {
                        issues.retain(|issue| issue.assignee.as_deref() == Some("john-doe"));
                    }
                }
                if let Some(provider) = &f.provider {
                    issues.retain(|issue| issue.provider == *provider);
                }
                if let Some(repository) = &f.repository {
                    issues.retain(|issue| issue.repository == *repository);
                }
                if let Some(search) = &f.search {
                    let search_lower = search.to_lowercase();
                    issues.retain(|issue| {
                        issue.title.to_lowercase().contains(&search_lower) ||
                        issue.body.as_ref().map_or(false, |body| body.to_lowercase().contains(&search_lower))
                    });
                }
            }
            
            issues.sort_by(|a, b| b.created_at.cmp(&a.created_at));
            
            // Apply pagination
            let page = pagination.as_ref().map(|p| p.page).unwrap_or(1);
            let per_page = pagination.as_ref().map(|p| p.per_page).unwrap_or(10);
            let total = issues.len() as u32;
            let total_pages = (total + per_page - 1) / per_page;
            
            let start = ((page - 1) * per_page) as usize;
            let end = (start + per_page as usize).min(issues.len());
            let paginated_issues = issues[start..end].to_vec();
            
            Ok(PaginatedResponse {
                data: paginated_issues,
                pagination: PaginationInfo {
                    page,
                    per_page,
                    total,
                    total_pages,
                }
            })
        }

        pub fn get_issue_stats(&self, filters: &Option<IssueFilters>) -> Result<IssueStats, Box<dyn std::error::Error>> {
            let mut issues: Vec<&Issue> = self.data.issues.values().collect();
            
            // Apply filters
            if let Some(f) = filters {
                if let Some(provider) = &f.provider {
                    issues.retain(|issue| issue.provider == *provider);
                }
                if let Some(repository) = &f.repository {
                    issues.retain(|issue| issue.repository == *repository);
                }
            }
            
            let total = issues.len() as u32;
            let open = issues.iter().filter(|i| i.state == "open").count() as u32;
            let closed = issues.iter().filter(|i| i.state == "closed").count() as u32;
            let assigned = issues.iter().filter(|i| i.assignee.as_deref() == Some("john-doe")).count() as u32;
            
            Ok(IssueStats { total, open, closed, assigned })
        }
    }
}

use database::*;

fn main() {
    println!("Running Database Tests...\n");
    
    let mut passed = 0;
    let mut total = 0;

    // Test 1: Database Creation
    total += 1;
    match test_new_database_creates_file() {
        Ok(_) => {
            println!("✅ test_new_database_creates_file PASSED");
            passed += 1;
        }
        Err(e) => println!("❌ test_new_database_creates_file FAILED: {}", e),
    }

    // Test 2: Load existing file
    total += 1;
    match test_new_database_loads_existing_file() {
        Ok(_) => {
            println!("✅ test_new_database_loads_existing_file PASSED");
            passed += 1;
        }
        Err(e) => println!("❌ test_new_database_loads_existing_file FAILED: {}", e),
    }

    // Test 3: Provider CRUD
    total += 1;
    match test_add_provider_success() {
        Ok(_) => {
            println!("✅ test_add_provider_success PASSED");
            passed += 1;
        }
        Err(e) => println!("❌ test_add_provider_success FAILED: {}", e),
    }

    // Test 4: Provider not found
    total += 1;
    match test_get_provider_not_found() {
        Ok(_) => {
            println!("✅ test_get_provider_not_found PASSED");
            passed += 1;
        }
        Err(e) => println!("❌ test_get_provider_not_found FAILED: {}", e),
    }

    // Test 5: Repository CRUD
    total += 1;
    match test_add_repository_success() {
        Ok(_) => {
            println!("✅ test_add_repository_success PASSED");
            passed += 1;
        }
        Err(e) => println!("❌ test_add_repository_success FAILED: {}", e),
    }

    // Test 6: Issues filtering
    total += 1;
    match test_get_issues_with_state_filter() {
        Ok(_) => {
            println!("✅ test_get_issues_with_state_filter PASSED");
            passed += 1;
        }
        Err(e) => println!("❌ test_get_issues_with_state_filter FAILED: {}", e),
    }

    // Test 7: Pagination boundary
    total += 1;
    match test_pagination_boundary_values() {
        Ok(_) => {
            println!("✅ test_pagination_boundary_values PASSED");
            passed += 1;
        }
        Err(e) => println!("❌ test_pagination_boundary_values FAILED: {}", e),
    }

    // Test 8: Search functionality
    total += 1;
    match test_case_insensitive_search() {
        Ok(_) => {
            println!("✅ test_case_insensitive_search PASSED");
            passed += 1;
        }
        Err(e) => println!("❌ test_case_insensitive_search FAILED: {}", e),
    }

    // Test 9: Cascade deletion
    total += 1;
    match test_delete_repository_and_cascade() {
        Ok(_) => {
            println!("✅ test_delete_repository_and_cascade PASSED");
            passed += 1;
        }
        Err(e) => println!("❌ test_delete_repository_and_cascade FAILED: {}", e),
    }

    // Test 10: Issue stats
    total += 1;
    match test_get_issue_stats() {
        Ok(_) => {
            println!("✅ test_get_issue_stats PASSED");
            passed += 1;
        }
        Err(e) => println!("❌ test_get_issue_stats FAILED: {}", e),
    }

    println!("\n📊 Test Results: {}/{} tests passed", passed, total);
    if passed == total {
        println!("🎉 All tests passed!");
    } else {
        println!("⚠️  Some tests failed. Check implementation.");
    }
}

// Test implementations
fn create_test_db() -> Result<(Database, tempfile::TempDir), Box<dyn std::error::Error>> {
    let temp_dir = tempfile::tempdir()?;
    let db_path = temp_dir.path().join("test_db.json");
    let db = Database::new(&db_path)?;
    Ok((db, temp_dir))
}

fn create_test_provider(id: &str, name: &str, provider_type: &str) -> GitProvider {
    GitProvider {
        id: id.to_string(),
        name: name.to_string(),
        provider_type: provider_type.to_string(),
        base_url: format!("https://api.{}.com", provider_type),
        updated_at: chrono::Utc::now(),
    }
}

fn create_test_repository(id: &str, provider_id: &str, name: &str) -> Repository {
    Repository {
        id: id.to_string(),
        name: name.to_string(),
        full_name: format!("user/{}", name),
        web_url: format!("https://github.com/user/{}", name),
        description: Some(format!("Description for {}", name)),
        provider_id: provider_id.to_string(),
        provider_name: "Test Provider".to_string(),
        provider_type: "github".to_string(),
        is_private: false,
        default_branch: "main".to_string(),
        language: Some("Rust".to_string()),
        last_activity: Some(chrono::Utc::now()),
        updated_at: chrono::Utc::now(),
    }
}

fn create_test_issue(id: &str, repository_id: &str, state: &str, number: u32) -> Issue {
    Issue {
        id: id.to_string(),
        repository_id: repository_id.to_string(),
        number,
        title: format!("Issue #{}", number),
        body: Some(format!("Body for issue #{}", number)),
        repository: "test-repo".to_string(),
        provider: "github".to_string(),
        assignee: if number % 2 == 0 { Some("john-doe".to_string()) } else { None },
        author: "test-author".to_string(),
        state: state.to_string(),
        labels: vec!["bug".to_string(), "high-priority".to_string()],
        url: format!("https://github.com/user/repo/issues/{}", number),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    }
}

fn test_new_database_creates_file() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = tempfile::tempdir()?;
    let db_path = temp_dir.path().join("new_db.json");
    
    assert!(!db_path.exists());
    let _db = Database::new(&db_path)?;
    assert!(db_path.exists());
    Ok(())
}

fn test_new_database_loads_existing_file() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = tempfile::tempdir()?;
    let db_path = temp_dir.path().join("existing_db.json");
    
    // Create a database file with some data
    let test_data = r#"{"providers":{"test-id":{"id":"test-id","name":"Test","provider_type":"github","base_url":"https://api.github.com","last_sync":null,"updated_at":"2023-01-01T00:00:00Z"}},"repositories":{},"issues":{},"pull_requests":{},"workflows":{}}"#;
    std::fs::write(&db_path, test_data)?;
    
    let db = Database::new(&db_path)?;
    let providers = db.get_providers()?;
    assert!(providers.iter().any(|p| p.id == "test-id"));
    Ok(())
}

fn test_add_provider_success() -> Result<(), Box<dyn std::error::Error>> {
    let (mut db, _temp_dir) = create_test_db()?;
    let provider = create_test_provider("test-provider", "Test Provider", "github");
    
    db.add_provider(&provider)?;
    
    let retrieved = db.get_provider("test-provider")?;
    assert_eq!(retrieved.id, "test-provider");
    assert_eq!(retrieved.name, "Test Provider");
    Ok(())
}

fn test_get_provider_not_found() -> Result<(), Box<dyn std::error::Error>> {
    let (db, _temp_dir) = create_test_db()?;
    let result = db.get_provider("non-existent");
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("not found"));
    Ok(())
}

fn test_add_repository_success() -> Result<(), Box<dyn std::error::Error>> {
    let (mut db, _temp_dir) = create_test_db()?;
    let repository = create_test_repository("test-repo", "github-com", "test-repo");
    
    db.add_repository(&repository)?;
    
    let retrieved = db.get_repository("test-repo")?;
    assert_eq!(retrieved.id, "test-repo");
    assert_eq!(retrieved.name, "test-repo");
    Ok(())
}

fn test_get_issues_with_state_filter() -> Result<(), Box<dyn std::error::Error>> {
    let (mut db, _temp_dir) = create_test_db()?;
    
    // Add test issues
    for i in 1..=6 {
        let state = if i <= 3 { "open" } else { "closed" };
        let issue = create_test_issue(&format!("issue{}", i), "repo1", state, i);
        db.data.issues.insert(issue.id.clone(), issue);
    }
    
    let filters = IssueFilters {
        state: Some("open".to_string()),
        assigned: None,
        provider: None,
        repository: None,
        search: None,
    };
    
    let result = db.get_issues(&Some(filters), &None)?;
    assert_eq!(result.data.len(), 3);
    for issue in result.data {
        assert_eq!(issue.state, "open");
    }
    Ok(())
}

fn test_pagination_boundary_values() -> Result<(), Box<dyn std::error::Error>> {
    let (mut db, _temp_dir) = create_test_db()?;
    
    // Add 25 test issues
    for i in 1..=25 {
        let issue = create_test_issue(&format!("issue{}", i), "repo1", "open", i);
        db.data.issues.insert(issue.id.clone(), issue);
    }
    
    // Test first page
    let pagination = PaginationParams { page: 1, per_page: 10 };
    let result = db.get_issues(&None, &Some(pagination))?;
    assert_eq!(result.data.len(), 10);
    assert_eq!(result.pagination.page, 1);
    assert_eq!(result.pagination.total, 25);
    assert_eq!(result.pagination.total_pages, 3);
    
    // Test last page (partial)
    let pagination = PaginationParams { page: 3, per_page: 10 };
    let result = db.get_issues(&None, &Some(pagination))?;
    assert_eq!(result.data.len(), 5); // Only 5 items on last page
    assert_eq!(result.pagination.page, 3);
    
    // Test boundary: page beyond total pages
    let pagination = PaginationParams { page: 5, per_page: 10 };
    let result = db.get_issues(&None, &Some(pagination))?;
    assert_eq!(result.data.len(), 0);
    
    Ok(())
}

fn test_case_insensitive_search() -> Result<(), Box<dyn std::error::Error>> {
    let (mut db, _temp_dir) = create_test_db()?;
    
    let mut issue = create_test_issue("issue1", "repo1", "open", 1);
    issue.title = "BUG in Authentication".to_string();
    db.data.issues.insert(issue.id.clone(), issue);
    
    let filters = IssueFilters {
        state: None,
        assigned: None,
        provider: None,
        repository: None,
        search: Some("bug".to_string()),
    };
    
    let result = db.get_issues(&Some(filters), &None)?;
    assert_eq!(result.data.len(), 1);
    assert_eq!(result.data[0].title, "BUG in Authentication");
    Ok(())
}

fn test_delete_repository_and_cascade() -> Result<(), Box<dyn std::error::Error>> {
    let (mut db, _temp_dir) = create_test_db()?;
    
    let repository = create_test_repository("test-repo", "github-com", "test-repo");
    db.add_repository(&repository)?;
    
    // Add related data
    db.data.issues.insert("issue1".to_string(), create_test_issue("issue1", "test-repo", "open", 1));
    
    // Verify they exist
    assert!(db.get_repository("test-repo").is_ok());
    assert!(db.data.issues.contains_key("issue1"));
    
    // Delete repository
    db.delete_repository("test-repo")?;
    
    // Verify cascade deletion
    assert!(db.get_repository("test-repo").is_err());
    assert!(!db.data.issues.contains_key("issue1"));
    Ok(())
}

fn test_get_issue_stats() -> Result<(), Box<dyn std::error::Error>> {
    let (mut db, _temp_dir) = create_test_db()?;
    
    // Add test issues: 3 open, 2 closed, 2 assigned to john-doe
    let states = ["open", "open", "open", "closed", "closed"];
    for (i, &state) in states.iter().enumerate() {
        let issue = create_test_issue(&format!("issue{}", i + 1), "repo1", state, (i + 1) as u32);
        db.data.issues.insert(issue.id.clone(), issue);
    }
    
    let stats = db.get_issue_stats(&None)?;
    assert_eq!(stats.total, 5);
    assert_eq!(stats.open, 3);
    assert_eq!(stats.closed, 2);
    assert_eq!(stats.assigned, 2); // issues 2 and 4 (even numbers)
    Ok(())
}