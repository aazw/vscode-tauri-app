# プロバイダー追加・更新フロー

このドキュメントでは、アプリケーションに新しいGitプロバイダーを追加する際の操作シーケンスについて説明します。

## パターン

開発時とリリース時でバックエンドの実体が異なる.

* フロントエンド開発時: `MockBackend.ts`で処理する
* リリース時 (`npm run tauri build`でビルド時): `NativeBackend`で処理する
    * こちらがNormative Flow

## プロバイダー追加シーケンス図（Normative Flow）

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant AddProvider as AddProvider<br/>コンポーネント
    participant Backend as バックエンド<br/>(NativeBackend)
    participant Tauri as Tauri<br/>ランタイム
    participant Database as データベース層
    participant SQLite as SQLiteデータベース
    participant Git as GitHub.com, GitLab.com<br/>またはセルフホスト版

    alt github.com または gitlab.com
        User->>AddProvider: アクセストークンを入力
    else セルフホスト版 github または gitlab
        User->>AddProvider: タイプ(github or gitlab)を入力
        User->>AddProvider: 表示名を入力
        User->>AddProvider: ベースURLを入力
        User->>AddProvider: アクセストークンを入力
    end

    User->>AddProvider: フォームを送信
    activate AddProvider
    
    AddProvider->>AddProvider: setLoading(true)
    AddProvider->>AddProvider: フォームデータを検証
    
    AddProvider->>Backend: backend.addProvider(formData)を呼び出し
    Backend->>Tauri: invoke('add_git_provider', params)

    Tauri->>Tauri: add_git_providerコマンド
    activate Tauri

    Tauri->>Git: トークンを使用してAPIリクエストでベースURLとアクセストークンを検証

    alt アクセストークンが無効
        Tauri-->>Backend: エラーを返す
        Backend-->>AddProvider: エラー
        AddProvider->>AddProvider: エラーメッセージを表示
    else アクセストークンが有効
        alt github.com または gitlab.com
            Tauri->>Database: データベース接続をロック
            Tauri->>Database: db.update_provider_token(provider_id, token)

            Database->>SQLite: UPDATE git_providers
            SQLite-->>Database: 成功/エラー
            Database-->>Tauri: 結果
        else セルフホスト版 github または gitlab
            Tauri->>Tauri: プロバイダー用のUUIDを生成
            Tauri->>Tauri: GitProvider構造体を作成
            Tauri->>Database: データベース接続をロック
            Tauri->>Database: db.add_provider(&provider)
        
            Database->>SQLite: INSERT INTO git_providers
            SQLite-->>Database: 成功/エラー
            Database-->>Tauri: 結果
        end
        
        alt 成功
            Tauri-->>Backend: プロバイダーIDを返す
            Backend-->>AddProvider: 成功
            AddProvider->>AddProvider: プロバイダーリストに移動
        else エラー
            Tauri-->>Backend: エラーを返す
            Backend-->>AddProvider: エラー
            AddProvider->>AddProvider: エラーメッセージを表示
        end
    end
    deactivate Tauri
    deactivate AddProvider
```

## 実装詳細

### フロントエンド（AddProviderコンポーネント）

- 場所: `src/components/AddProvider.tsx`
- フォームの検証とユーザー入力処理
- 実際のバックエンドとの統合を実装済み
- エラーハンドリングとユーザーフィードバック機能付き

### バックエンド統合

- 場所: `src/backends/NativeBackend.ts`
- `AppBackend`インターフェイスの`addProvider`メソッドを実装
- Tauriの`add_git_provider`コマンドを呼び出し

### Tauriコマンドハンドラー

- 場所: `src-tauri/src/lib.rs:82-158`
- 関数: `add_git_provider`
- 新しいプロバイダー用のUUIDを生成
- トークン検証機能を実装
- `GitProvider`構造体をメタデータ付きで作成
- mutexで保護されたデータベース接続を通じて操作を処理

### データベース層

- 場所: `src-tauri/src/database.rs:327-350`
- 関数: `add_provider`
- `git_providers`テーブルへのSQL INSERTを実行
- タイムスタンプとデータのシリアル化を処理

## プロバイダーデータ構造

```rust
pub struct GitProvider {
    pub id: String,           // Tauriが生成するUUID
    pub name: String,         // ユーザーが提供する表示名
    pub provider_type: String, // "github" または "gitlab"
    pub base_url: String,     // API ベースURL
    pub token: Option<String>, // アクセストークン（オプション）
    pub token_valid: bool,    // トークンの検証状態
    pub last_sync: Option<DateTime<Utc>>, // 最後の同期タイムスタンプ
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

- **トークン検証エラー**: "GitHub token validation failed: [詳細]"
- **無効なトークン**: "Invalid access token. Please check your token and try again."
- **データベースエラー**: "Database error: [詳細]"
- **不明なプロバイダー**: "Unknown provider type: [type]"

すべてのエラーはフロントエンドで赤いエラーボックスとして表示され、ユーザーに適切なフィードバックを提供します。
