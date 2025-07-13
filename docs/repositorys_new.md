# リポジトリ追加・更新フロー

このドキュメントでは、アプリケーションに新しいリポジトリを追加する際の操作シーケンスについて説明します。

## パターン

開発時とリリース時でバックエンドの実体が異なる。

* フロントエンド開発時: `MockBackend.ts`で処理する
* リリース時 (`npm run tauri build`でビルド時): `NativeBackend`で処理する
    * こちらがNormative Flow

## リポジトリ追加シーケンス図（Normative Flow）

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant AddRepository as AddRepository<br/>コンポーネント
    participant Backend as バックエンド<br/>(NativeBackend)
    participant Tauri as Tauri<br/>ランタイム
    participant Database as データベース層
    participant SQLite as SQLiteデータベース
    participant Git as GitHub.com, GitLab.com<br/>またはセルフホスト版

    User->>AddRepository: プロバイダーを選択
    User->>AddRepository: リポジトリURL（WebURL）を入力

    User->>AddRepository: フォームを送信
    activate AddRepository
    
    AddRepository->>AddRepository: setLoading(true)
    AddRepository->>AddRepository: フォームデータを検証
    
    AddRepository->>Backend: backend.addRepository(formData)を呼び出し
    Backend->>Tauri: invoke('add_repository', params)

    Tauri->>Tauri: add_repositoryコマンド
    activate Tauri

    Tauri->>Database: データベース接続をロック
    Tauri->>Database: db.get_provider(provider_id)
    Database->>SQLite: SELECT FROM git_providers
    SQLite-->>Database: プロバイダー情報
    Database-->>Tauri: プロバイダー情報

    alt プロバイダーが見つからない
        Tauri-->>Backend: エラーを返す
        Backend-->>AddRepository: エラー
        AddRepository->>AddRepository: エラーメッセージを表示
    else プロバイダーが存在
        Tauri->>Tauri: WebURLを解析してname, full_nameを抽出
        
        Tauri->>Git: リポジトリ存在確認API呼び出し
        activate Git
        Git-->>Tauri: 存在確認結果
        deactivate Git
        
        alt リポジトリが存在しない
            Tauri-->>Backend: エラーを返す（リポジトリが見つかりません）
            Backend-->>AddRepository: エラー
            AddRepository->>AddRepository: エラーメッセージを表示
        else リポジトリが存在
            Tauri->>Tauri: リポジトリ用のUUIDを生成
            Tauri->>Tauri: Repository構造体を作成
            
            Tauri->>Database: db.add_repository(&repository)
            Database->>SQLite: INSERT INTO repositories
            SQLite-->>Database: 成功/エラー
            Database-->>Tauri: 結果
            
            alt 成功
                Tauri-->>Backend: リポジトリIDを返す
                Backend-->>AddRepository: 成功
                AddRepository->>AddRepository: setLoading(false)
                AddRepository->>AddRepository: リポジトリリストに移動
            else エラー
                Tauri-->>Backend: エラーを返す
                Backend-->>AddRepository: エラー
                AddRepository->>AddRepository: setLoading(false)
                AddRepository->>AddRepository: エラーメッセージを表示
            end
        end
    end
    deactivate Tauri
    deactivate AddRepository
```

## 実装詳細

### フロントエンド（AddRepositoryコンポーネント）

- 場所: `src/components/AddRepository.tsx`
- フォームの検証とユーザー入力処理
- プロバイダー選択機能
- 実際のバックエンドとの統合を実装済み
- エラーハンドリングとユーザーフィードバック機能付き

### バックエンド統合

- 場所: `src/backends/NativeBackend.ts`
- `AppBackend`インターフェイスの`addRepository`メソッドを実装
- Tauriの`add_repository`コマンドを呼び出し

### Tauriコマンドハンドラー

- 場所: `src-tauri/src/lib.rs:290-337`
- 関数: `add_repository`
- プロバイダー情報の取得と検証
- WebURLの解析（name, full_name抽出）
- 新しいリポジトリ用のUUIDを生成
- `Repository`構造体をメタデータ付きで作成
- mutexで保護されたデータベース接続を通じて操作を処理

### データベース層

- 場所: `src-tauri/src/database.rs:492-520`
- 関数: `add_repository`
- `repositories`テーブルへのSQL INSERTを実行
- タイムスタンプとデータのシリアル化を処理

## リポジトリデータ構造

```rust
pub struct Repository {
    pub id: String,           // Tauriが生成するUUID
    pub name: String,         // WebURLから抽出されたリポジトリ名
    pub full_name: String,    // owner/repository形式の完全名
    pub web_url: String,      // ユーザーが入力したWebURL
    pub description: Option<String>, // リポジトリの説明（初期値はNone）
    pub provider_id: String,  // 関連するプロバイダーのID
    pub provider_name: String, // プロバイダーの表示名
    pub provider_type: String, // "github" または "gitlab"
    pub is_private: bool,     // プライベートリポジトリかどうか（初期値はfalse）
    pub language: Option<String>, // 主要な言語（初期値はNone）
    pub last_activity: Option<DateTime<Utc>>, // 最後のアクティビティ（初期値はNone）
    pub updated_at: DateTime<Utc>, // レコード更新タイムスタンプ
}
```

## エラーハンドリング

このフローは複数のレベルでエラーハンドリングを実装しています：

1. フロントエンドのフォーム検証
2. バックエンドAPIのエラーハンドリング
3. Tauriコマンドのエラー伝播
4. データベース操作のエラーハンドリング

エラーはログに記録され、ユーザーインターフェイスに表示するために伝播されます。

## 実装されたエラーメッセージ

- **プロバイダー取得エラー**: "Failed to get provider [provider_id]: [詳細]"
- **データベースエラー**: "Database error: [詳細]"
- **WebURL解析エラー**: "Invalid repository URL format"
- **リポジトリ存在確認エラー**: "Repository not found or access denied"
- **リポジトリ追加エラー**: "Failed to add repository to database: [詳細]"

すべてのエラーはフロントエンドで赤いエラーボックスとして表示され、ユーザーに適切なフィードバックを提供します。
