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
    pub token: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Repository {
    pub id: String,
    pub provider_id: String,
    pub name: String,
    pub full_name: String,
    pub clone_url: String,
    pub description: Option<String>,
    pub is_private: bool,
    pub last_activity: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DatabaseData {
    pub providers: HashMap<String, GitProvider>,
    pub repositories: HashMap<String, Repository>,
}

pub struct Database {
    data: DatabaseData,
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
                token: None,
                created_at: now,
                updated_at: now,
            };
            self.data.providers.insert(github_provider.id.clone(), github_provider);

            // Add GitLab.com
            let gitlab_provider = GitProvider {
                id: "gitlab-com".to_string(),
                name: "GitLab.com".to_string(),
                provider_type: "gitlab".to_string(),
                base_url: "https://gitlab.com/api/v4".to_string(),
                token: None,
                created_at: now,
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
        providers.sort_by(|a, b| a.created_at.cmp(&b.created_at));
        Ok(providers)
    }

    pub fn add_repository(&mut self, repo: &Repository) -> Result<(), Box<dyn std::error::Error>> {
        self.data.repositories.insert(repo.id.clone(), repo.clone());
        self.save()?;
        Ok(())
    }

    pub fn get_repositories_by_provider(&self, provider_id: &str) -> Result<Vec<Repository>, Box<dyn std::error::Error>> {
        let repositories: Vec<Repository> = self.data.repositories
            .values()
            .filter(|repo| repo.provider_id == provider_id)
            .cloned()
            .collect();
        Ok(repositories)
    }

    pub fn update_provider_token(&mut self, provider_id: &str, token: Option<String>) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(provider) = self.data.providers.get_mut(provider_id) {
            provider.token = token;
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
}