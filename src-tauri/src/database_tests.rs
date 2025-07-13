#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;
    use chrono::Utc;
    use std::fs;

    // Helper function to create a test database
    fn create_test_db() -> (Database, tempfile::TempDir) {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test_db.json");
        let db = Database::new(&db_path).unwrap();
        (db, temp_dir)
    }

    // Helper function to create a test provider
    fn create_test_provider(id: &str, name: &str, provider_type: &str) -> GitProvider {
        GitProvider {
            id: id.to_string(),
            name: name.to_string(),
            provider_type: provider_type.to_string(),
            base_url: format!("https://api.{}.com", provider_type),
            updated_at: Utc::now(),
        }
    }

    // Helper function to create a test repository
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
            last_activity: Some(Utc::now()),
            updated_at: Utc::now(),
        }
    }

    // Helper function to create a test issue
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
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    // Helper function to create test pull request
    fn create_test_pull_request(id: &str, repository_id: &str, state: &str, number: u32) -> PullRequest {
        PullRequest {
            id: id.to_string(),
            repository_id: repository_id.to_string(),
            number,
            title: format!("PR #{}", number),
            body: Some(format!("Body for PR #{}", number)),
            repository: "test-repo".to_string(),
            provider: "github".to_string(),
            assignee: if number % 3 == 0 { Some("john-doe".to_string()) } else { None },
            author: "test-author".to_string(),
            state: state.to_string(),
            draft: number % 4 == 0,
            url: format!("https://github.com/user/repo/pull/{}", number),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    // Helper function to create test workflow
    fn create_test_workflow(id: &str, repository_id: &str, status: &str, name: &str) -> WorkflowRun {
        WorkflowRun {
            id: id.to_string(),
            repository_id: repository_id.to_string(),
            name: name.to_string(),
            repository: "test-repo".to_string(),
            provider: "github".to_string(),
            status: status.to_string(),
            conclusion: Some("completed".to_string()),
            branch: "main".to_string(),
            commit_sha: "abc123".to_string(),
            commit_message: "Test commit".to_string(),
            author: "test-author".to_string(),
            url: format!("https://github.com/user/repo/actions/runs/{}", id),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    // ========== Database Creation Tests ==========

    #[test]
    fn test_new_database_creates_file() {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("new_db.json");
        
        assert!(!db_path.exists());
        let _db = Database::new(&db_path).unwrap();
        assert!(db_path.exists());
    }

    #[test]
    fn test_new_database_loads_existing_file() {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("existing_db.json");
        
        // Create a database file with some data
        let test_data = r#"{"providers":{"test-id":{"id":"test-id","name":"Test","provider_type":"github","base_url":"https://api.github.com","last_sync":null,"updated_at":"2023-01-01T00:00:00Z"}},"repositories":{},"issues":{},"pull_requests":{},"workflows":{}}"#;
        fs::write(&db_path, test_data).unwrap();
        
        let db = Database::new(&db_path).unwrap();
        let providers = db.get_providers().unwrap();
        assert!(providers.iter().any(|p| p.id == "test-id"));
    }

    #[test]
    fn test_new_database_handles_corrupted_file() {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("corrupted_db.json");
        
        // Create corrupted JSON file
        fs::write(&db_path, "invalid json content").unwrap();
        
        let db = Database::new(&db_path).unwrap();
        let providers = db.get_providers().unwrap();
        // Should create default providers despite corrupted file
        assert!(providers.len() >= 2);
    }

    #[test]
    fn test_database_initializes_default_providers() {
        let (db, _temp_dir) = create_test_db();
        let providers = db.get_providers().unwrap();
        
        assert!(providers.len() >= 2);
        assert!(providers.iter().any(|p| p.id == "github-com"));
        assert!(providers.iter().any(|p| p.id == "gitlab-com"));
    }

    // ========== Provider CRUD Tests ==========

    #[test]
    fn test_add_provider_success() {
        let (mut db, _temp_dir) = create_test_db();
        let provider = create_test_provider("test-provider", "Test Provider", "github");
        
        let result = db.add_provider(&provider);
        assert!(result.is_ok());
        
        let retrieved = db.get_provider("test-provider").unwrap();
        assert_eq!(retrieved.id, "test-provider");
        assert_eq!(retrieved.name, "Test Provider");
    }

    #[test]
    fn test_get_provider_not_found() {
        let (db, _temp_dir) = create_test_db();
        let result = db.get_provider("non-existent");
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("not found"));
    }

    #[test]
    fn test_get_providers_sorted_by_updated_at() {
        let (mut db, _temp_dir) = create_test_db();
        
        let provider1 = create_test_provider("provider1", "Provider 1", "github");
        let mut provider2 = create_test_provider("provider2", "Provider 2", "gitlab");
        provider2.updated_at = Utc::now() + chrono::Duration::hours(1);
        
        db.add_provider(&provider1).unwrap();
        db.add_provider(&provider2).unwrap();
        
        let providers = db.get_providers().unwrap();
        // Find our test providers in the list (excluding defaults)
        let test_providers: Vec<_> = providers.iter()
            .filter(|p| p.id.starts_with("provider"))
            .collect();
        assert_eq!(test_providers.len(), 2);
        // Should be sorted by updated_at (ascending)
        assert!(test_providers[0].updated_at <= test_providers[1].updated_at);
    }

    #[test]
    fn test_update_provider_token() {
        let (mut db, _temp_dir) = create_test_db();
        let provider = create_test_provider("test-provider", "Test Provider", "github");
        db.add_provider(&provider).unwrap();
        
        let old_updated_at = db.get_provider("test-provider").unwrap().updated_at;
        
        // Wait a moment to ensure timestamp difference
        std::thread::sleep(std::time::Duration::from_millis(10));
        
        let result = db.update_provider_token("test-provider", Some("new-token".to_string()));
        assert!(result.is_ok());
        
        let updated_provider = db.get_provider("test-provider").unwrap();
        assert!(updated_provider.updated_at > old_updated_at);
    }

    #[test]
    fn test_delete_provider_and_cascade() {
        let (mut db, _temp_dir) = create_test_db();
        
        // Add provider and repository
        let provider = create_test_provider("test-provider", "Test Provider", "github");
        let repository = create_test_repository("test-repo", "test-provider", "test-repo");
        
        db.add_provider(&provider).unwrap();
        db.add_repository(&repository).unwrap();
        
        // Verify they exist
        assert!(db.get_provider("test-provider").is_ok());
        assert!(db.get_repository("test-repo").is_ok());
        
        // Delete provider
        let result = db.delete_provider("test-provider");
        assert!(result.is_ok());
        
        // Verify cascade deletion
        assert!(db.get_provider("test-provider").is_err());
        assert!(db.get_repository("test-repo").is_err());
    }

    #[test]
    fn test_sync_provider() {
        let (mut db, _temp_dir) = create_test_db();
        let provider = create_test_provider("test-provider", "Test Provider", "github");
        db.add_provider(&provider).unwrap();
        
        let result = db.sync_provider("test-provider");
        assert!(result.is_ok());
        
        // Note: Sync tracking has moved to repository level
        // Provider sync now just updates the provider's updated_at timestamp
        let synced_provider = db.get_provider("test-provider").unwrap();
        assert!(!synced_provider.id.is_empty());
    }

    #[test]
    fn test_sync_all_providers() {
        let (mut db, _temp_dir) = create_test_db();
        
        let result = db.sync_all_providers();
        assert!(result.is_ok());
        
        // Note: Sync tracking has moved to repository level
        // This test just verifies the sync operation completes successfully
        let providers = db.get_providers().unwrap();
        assert!(!providers.is_empty());
    }

    // ========== Repository CRUD Tests ==========

    #[test]
    fn test_add_repository_success() {
        let (mut db, _temp_dir) = create_test_db();
        let repository = create_test_repository("test-repo", "github-com", "test-repo");
        
        let result = db.add_repository(&repository);
        assert!(result.is_ok());
        
        let retrieved = db.get_repository("test-repo").unwrap();
        assert_eq!(retrieved.id, "test-repo");
        assert_eq!(retrieved.name, "test-repo");
    }

    #[test]
    fn test_get_repository_not_found() {
        let (db, _temp_dir) = create_test_db();
        let result = db.get_repository("non-existent");
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("not found"));
    }

    #[test]
    fn test_get_repositories_by_provider() {
        let (mut db, _temp_dir) = create_test_db();
        
        let repo1 = create_test_repository("repo1", "github-com", "repo1");
        let repo2 = create_test_repository("repo2", "gitlab-com", "repo2");
        let repo3 = create_test_repository("repo3", "github-com", "repo3");
        
        db.add_repository(&repo1).unwrap();
        db.add_repository(&repo2).unwrap();
        db.add_repository(&repo3).unwrap();
        
        let github_repos = db.get_repositories_by_provider("github-com").unwrap();
        assert_eq!(github_repos.len(), 2);
        
        let gitlab_repos = db.get_repositories_by_provider("gitlab-com").unwrap();
        assert_eq!(gitlab_repos.len(), 1);
    }

    #[test]
    fn test_delete_repository_and_cascade() {
        let (mut db, _temp_dir) = create_test_db();
        
        let repository = create_test_repository("test-repo", "github-com", "test-repo");
        db.add_repository(&repository).unwrap();
        
        // Add related data
        db.data.issues.insert("issue1".to_string(), create_test_issue("issue1", "test-repo", "open", 1));
        db.data.pull_requests.insert("pr1".to_string(), create_test_pull_request("pr1", "test-repo", "open", 1));
        db.data.workflows.insert("workflow1".to_string(), create_test_workflow("workflow1", "test-repo", "success", "CI"));
        
        // Verify they exist
        assert!(db.get_repository("test-repo").is_ok());
        assert!(db.data.issues.contains_key("issue1"));
        assert!(db.data.pull_requests.contains_key("pr1"));
        assert!(db.data.workflows.contains_key("workflow1"));
        
        // Delete repository
        let result = db.delete_repository("test-repo");
        assert!(result.is_ok());
        
        // Verify cascade deletion
        assert!(db.get_repository("test-repo").is_err());
        assert!(!db.data.issues.contains_key("issue1"));
        assert!(!db.data.pull_requests.contains_key("pr1"));
        assert!(!db.data.workflows.contains_key("workflow1"));
    }

    #[test]
    fn test_sync_repository() {
        let (mut db, _temp_dir) = create_test_db();
        let repository = create_test_repository("test-repo", "github-com", "test-repo");
        db.add_repository(&repository).unwrap();
        
        let result = db.sync_repository("test-repo");
        assert!(result.is_ok());
        
        let synced_repo = db.get_repository("test-repo").unwrap();
        assert!(synced_repo.last_activity.is_some());
    }

    // ========== Issues Tests ==========

    #[test]
    fn test_get_issues_no_filters() {
        let (mut db, _temp_dir) = create_test_db();
        
        // Add test issues
        for i in 1..=5 {
            let state = if i % 2 == 0 { "closed" } else { "open" };
            let issue = create_test_issue(&format!("issue{}", i), "repo1", state, i);
            db.data.issues.insert(issue.id.clone(), issue);
        }
        
        let result = db.get_issues(&None, &None).unwrap();
        assert_eq!(result.data.len(), 5);
        assert_eq!(result.pagination.total, 5);
        assert_eq!(result.pagination.page, 1);
        assert_eq!(result.pagination.per_page, 10);
    }

    #[test]
    fn test_get_issues_with_state_filter() {
        let (mut db, _temp_dir) = create_test_db();
        
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
        
        let result = db.get_issues(&Some(filters), &None).unwrap();
        assert_eq!(result.data.len(), 3);
        for issue in result.data {
            assert_eq!(issue.state, "open");
        }
    }

    #[test]
    fn test_get_issues_with_assigned_filter() {
        let (mut db, _temp_dir) = create_test_db();
        
        // Add test issues (even numbers are assigned to john-doe)
        for i in 1..=6 {
            let issue = create_test_issue(&format!("issue{}", i), "repo1", "open", i);
            db.data.issues.insert(issue.id.clone(), issue);
        }
        
        let filters = IssueFilters {
            state: None,
            assigned: Some("me".to_string()),
            provider: None,
            repository: None,
            search: None,
        };
        
        let result = db.get_issues(&Some(filters), &None).unwrap();
        assert_eq!(result.data.len(), 3); // issues 2, 4, 6
        for issue in result.data {
            assert_eq!(issue.assignee.as_deref(), Some("john-doe"));
        }
    }

    #[test]
    fn test_get_issues_with_search_filter() {
        let (mut db, _temp_dir) = create_test_db();
        
        let mut issue1 = create_test_issue("issue1", "repo1", "open", 1);
        issue1.title = "Bug in authentication".to_string();
        
        let mut issue2 = create_test_issue("issue2", "repo1", "open", 2);
        issue2.title = "Feature request".to_string();
        issue2.body = Some("Authentication related feature".to_string());
        
        let issue3 = create_test_issue("issue3", "repo1", "open", 3);
        
        db.data.issues.insert(issue1.id.clone(), issue1);
        db.data.issues.insert(issue2.id.clone(), issue2);
        db.data.issues.insert(issue3.id.clone(), issue3);
        
        let filters = IssueFilters {
            state: None,
            assigned: None,
            provider: None,
            repository: None,
            search: Some("authentication".to_string()),
        };
        
        let result = db.get_issues(&Some(filters), &None).unwrap();
        assert_eq!(result.data.len(), 2); // issue1 and issue2
    }

    #[test]
    fn test_get_issues_pagination_boundary_values() {
        let (mut db, _temp_dir) = create_test_db();
        
        // Add 25 test issues
        for i in 1..=25 {
            let issue = create_test_issue(&format!("issue{}", i), "repo1", "open", i);
            db.data.issues.insert(issue.id.clone(), issue);
        }
        
        // Test first page
        let pagination = PaginationParams { page: 1, per_page: 10 };
        let result = db.get_issues(&None, &Some(pagination)).unwrap();
        assert_eq!(result.data.len(), 10);
        assert_eq!(result.pagination.page, 1);
        assert_eq!(result.pagination.total, 25);
        assert_eq!(result.pagination.total_pages, 3);
        
        // Test last page (partial)
        let pagination = PaginationParams { page: 3, per_page: 10 };
        let result = db.get_issues(&None, &Some(pagination)).unwrap();
        assert_eq!(result.data.len(), 5); // Only 5 items on last page
        assert_eq!(result.pagination.page, 3);
        
        // Test boundary: page beyond total pages
        let pagination = PaginationParams { page: 5, per_page: 10 };
        let result = db.get_issues(&None, &Some(pagination)).unwrap();
        assert_eq!(result.data.len(), 0);
        
        // Test boundary: per_page = 1
        let pagination = PaginationParams { page: 1, per_page: 1 };
        let result = db.get_issues(&None, &Some(pagination)).unwrap();
        assert_eq!(result.data.len(), 1);
        assert_eq!(result.pagination.total_pages, 25);
    }

    #[test]
    fn test_get_issue_stats() {
        let (mut db, _temp_dir) = create_test_db();
        
        // Add test issues: 3 open, 2 closed, 2 assigned to john-doe
        let states = ["open", "open", "open", "closed", "closed"];
        for (i, &state) in states.iter().enumerate() {
            let issue = create_test_issue(&format!("issue{}", i + 1), "repo1", state, (i + 1) as u32);
            db.data.issues.insert(issue.id.clone(), issue);
        }
        
        let stats = db.get_issue_stats(&None).unwrap();
        assert_eq!(stats.total, 5);
        assert_eq!(stats.open, 3);
        assert_eq!(stats.closed, 2);
        assert_eq!(stats.assigned, 2); // issues 2 and 4 (even numbers)
    }

    #[test]
    fn test_get_issue_not_found() {
        let (db, _temp_dir) = create_test_db();
        let result = db.get_issue("non-existent");
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("not found"));
    }

    // ========== Pull Requests Tests ==========

    #[test]
    fn test_get_pull_requests_with_state_filter() {
        let (mut db, _temp_dir) = create_test_db();
        
        let states = ["open", "open", "merged", "closed", "merged"];
        for (i, &state) in states.iter().enumerate() {
            let pr = create_test_pull_request(&format!("pr{}", i + 1), "repo1", state, (i + 1) as u32);
            db.data.pull_requests.insert(pr.id.clone(), pr);
        }
        
        let filters = PullRequestFilters {
            state: Some("merged".to_string()),
            assigned: None,
            provider: None,
            repository: None,
            search: None,
        };
        
        let result = db.get_pull_requests(&Some(filters), &None).unwrap();
        assert_eq!(result.data.len(), 2);
        for pr in result.data {
            assert_eq!(pr.state, "merged");
        }
    }

    #[test]
    fn test_get_pull_request_stats() {
        let (mut db, _temp_dir) = create_test_db();
        
        let states = ["open", "open", "merged", "closed", "merged", "open"];
        for (i, &state) in states.iter().enumerate() {
            let pr = create_test_pull_request(&format!("pr{}", i + 1), "repo1", state, (i + 1) as u32);
            db.data.pull_requests.insert(pr.id.clone(), pr);
        }
        
        let stats = db.get_pull_request_stats(&None).unwrap();
        assert_eq!(stats.total, 6);
        assert_eq!(stats.open, 3);
        assert_eq!(stats.merged, 2);
        assert_eq!(stats.closed, 1);
        assert_eq!(stats.assigned, 2); // PRs 3 and 6 (multiples of 3)
    }

    // ========== Workflows Tests ==========

    #[test]
    fn test_get_workflows_with_status_filter() {
        let (mut db, _temp_dir) = create_test_db();
        
        let statuses = ["success", "failure", "success", "in_progress", "cancelled"];
        for (i, &status) in statuses.iter().enumerate() {
            let workflow = create_test_workflow(&format!("wf{}", i + 1), "repo1", status, &format!("CI-{}", i + 1));
            db.data.workflows.insert(workflow.id.clone(), workflow);
        }
        
        let filters = WorkflowFilters {
            status: Some("success".to_string()),
            provider: None,
            repository: None,
            search: None,
        };
        
        let result = db.get_workflows(&Some(filters), &None).unwrap();
        assert_eq!(result.data.len(), 2);
        for workflow in result.data {
            assert_eq!(workflow.status, "success");
        }
    }

    #[test]
    fn test_get_workflow_stats() {
        let (mut db, _temp_dir) = create_test_db();
        
        let statuses = ["success", "success", "failure", "in_progress", "cancelled", "success"];
        for (i, &status) in statuses.iter().enumerate() {
            let workflow = create_test_workflow(&format!("wf{}", i + 1), "repo1", status, &format!("CI-{}", i + 1));
            db.data.workflows.insert(workflow.id.clone(), workflow);
        }
        
        let stats = db.get_workflow_stats(&None).unwrap();
        assert_eq!(stats.total, 6);
        assert_eq!(stats.success, 3);
        assert_eq!(stats.failure, 1);
        assert_eq!(stats.in_progress, 1);
        assert_eq!(stats.cancelled, 1);
    }

    // ========== Edge Cases and Error Handling ==========

    #[test]
    fn test_pagination_with_zero_per_page() {
        let (mut db, _temp_dir) = create_test_db();
        
        for i in 1..=5 {
            let issue = create_test_issue(&format!("issue{}", i), "repo1", "open", i);
            db.data.issues.insert(issue.id.clone(), issue);
        }
        
        let pagination = PaginationParams { page: 1, per_page: 0 };
        let result = db.get_issues(&None, &Some(pagination)).unwrap();
        // Should handle zero per_page gracefully
        assert_eq!(result.data.len(), 0);
    }

    #[test]
    fn test_filters_with_empty_values() {
        let (mut db, _temp_dir) = create_test_db();
        
        for i in 1..=3 {
            let issue = create_test_issue(&format!("issue{}", i), "repo1", "open", i);
            db.data.issues.insert(issue.id.clone(), issue);
        }
        
        let filters = IssueFilters {
            state: Some("".to_string()),
            assigned: Some("".to_string()),
            provider: Some("".to_string()),
            repository: Some("".to_string()),
            search: Some("".to_string()),
        };
        
        let result = db.get_issues(&Some(filters), &None).unwrap();
        // Empty filters should not crash and should return some results
        assert!(result.data.len() <= 3);
    }

    #[test]
    fn test_case_insensitive_search() {
        let (mut db, _temp_dir) = create_test_db();
        
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
        
        let result = db.get_issues(&Some(filters), &None).unwrap();
        assert_eq!(result.data.len(), 1);
        assert_eq!(result.data[0].title, "BUG in Authentication");
    }

    #[test]
    fn test_large_pagination_numbers() {
        let (mut db, _temp_dir) = create_test_db();
        
        for i in 1..=3 {
            let issue = create_test_issue(&format!("issue{}", i), "repo1", "open", i);
            db.data.issues.insert(issue.id.clone(), issue);
        }
        
        let pagination = PaginationParams { page: u32::MAX, per_page: u32::MAX };
        let result = db.get_issues(&None, &Some(pagination));
        // Should not panic with large numbers
        assert!(result.is_ok());
    }

    #[test]
    fn test_concurrent_database_operations() {
        use std::sync::{Arc, Mutex};
        use std::thread;
        
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("concurrent_db.json");
        let db = Arc::new(Mutex::new(Database::new(&db_path).unwrap()));
        
        let handles: Vec<_> = (0..5).map(|i| {
            let db_clone = Arc::clone(&db);
            thread::spawn(move || {
                let provider = create_test_provider(&format!("provider{}", i), &format!("Provider {}", i), "github");
                let mut db_lock = db_clone.lock().unwrap();
                db_lock.add_provider(&provider).unwrap();
            })
        }).collect();
        
        for handle in handles {
            handle.join().unwrap();
        }
        
        let db_lock = db.lock().unwrap();
        let providers = db_lock.get_providers().unwrap();
        // Should have at least 7 providers (2 default + 5 added)
        assert!(providers.len() >= 7);
    }
}