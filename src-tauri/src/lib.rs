mod database;

use database::{Database, GitProvider, Repository};
use tauri::{State, Manager};
use uuid::Uuid;
use chrono::Utc;

type DatabaseState = std::sync::Arc<std::sync::Mutex<Database>>;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn add_git_provider(
    db: State<'_, DatabaseState>,
    name: String,
    provider_type: String,
    base_url: String,
    token: Option<String>,
) -> Result<String, String> {
    let provider = GitProvider {
        id: Uuid::new_v4().to_string(),
        name,
        provider_type,
        base_url,
        token,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    let mut db = db.lock().unwrap();
    db.add_provider(&provider).map_err(|e| e.to_string())?;
    Ok(provider.id)
}

#[tauri::command]
async fn get_git_providers(db: State<'_, DatabaseState>) -> Result<Vec<GitProvider>, String> {
    let db = db.lock().unwrap();
    db.get_providers().map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_repository(
    db: State<'_, DatabaseState>,
    provider_id: String,
    name: String,
    full_name: String,
    clone_url: String,
    description: Option<String>,
    is_private: bool,
) -> Result<String, String> {
    let repo = Repository {
        id: Uuid::new_v4().to_string(),
        provider_id,
        name,
        full_name,
        clone_url,
        description,
        is_private,
        last_activity: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    let mut db = db.lock().unwrap();
    db.add_repository(&repo).map_err(|e| e.to_string())?;
    Ok(repo.id)
}

#[tauri::command]
async fn get_repositories_by_provider(
    db: State<'_, DatabaseState>,
    provider_id: String,
) -> Result<Vec<Repository>, String> {
    let db = db.lock().unwrap();
    db.get_repositories_by_provider(&provider_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_provider_token(
    db: State<'_, DatabaseState>,
    provider_id: String,
    token: Option<String>,
) -> Result<(), String> {
    let mut db = db.lock().unwrap();
    db.update_provider_token(&provider_id, token).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_provider(
    db: State<'_, DatabaseState>,
    provider_id: String,
) -> Result<(), String> {
    let mut db = db.lock().unwrap();
    db.delete_provider(&provider_id).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Get the app data directory for storing the database
            let app_data_dir = app.path().app_data_dir().unwrap_or_else(|_| {
                let mut path = std::env::current_dir().unwrap_or_default();
                path.push(".git_portal");
                path
            });
            
            // Create the directory if it doesn't exist
            std::fs::create_dir_all(&app_data_dir).map_err(|e| {
                eprintln!("Failed to create app data directory: {}", e);
                e
            })?;
            
            let mut db_path = app_data_dir;
            db_path.push("git_portal.json");
            
            println!("Database path: {:?}", db_path);
            
            let database = Database::new(&db_path).map_err(|e| {
                eprintln!("Failed to initialize database: {}", e);
                e
            })?;
            
            app.manage(std::sync::Arc::new(std::sync::Mutex::new(database)));
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            add_git_provider,
            get_git_providers,
            add_repository,
            get_repositories_by_provider,
            update_provider_token,
            delete_provider
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
