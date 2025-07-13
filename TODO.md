# Git Portal - Backend Implementation TODO

このファイルは、AppBackendインターフェースに基づいて実装すべきバックエンド機能の詳細タスク一覧です。

## 🔴 高優先度（MVP必須）

### Core Backend Types & Interfaces
- [x] **AppBackend型定義** - GitProvider, Repository, Issue, PullRequest, WorkflowRun interfaces

### Provider Management
- [ ] **Provider CRUD API** - getProviders, getProvider, addProvider, updateProviderToken, deleteProvider
- [ ] **Provider Validation** - Token validation, URL connection tests, provider type validation  
- [ ] **GitHub API Integration** - REST API client for providers, repositories, issues, PRs, workflows

### Repository Management  
- [ ] **Repository CRUD API** - getRepositories, getRepository, addRepository, deleteRepository
- [ ] **Repository URL Parsing** - GitHub/GitLab URL validation and metadata extraction

### Sync Operations
- [ ] **Sync Operations** - syncProvider, syncAllProviders, syncRepository implementations

### Database & Infrastructure
- [ ] **Database Schema** - Tables for providers, repositories, issues, pull_requests, workflow_runs
- [ ] **Dashboard Statistics** - Aggregate stats for issues, PRs, workflows across all repositories

## 🟡 中優先度（早期実装）

### Data APIs
- [ ] **Issue API** - getIssues, getIssue, getIssueStats with filtering and pagination
- [ ] **Pull Request API** - getPullRequests, getPullRequest, getPullRequestStats with filtering and pagination  
- [ ] **Workflow API** - getWorkflows, getWorkflow, getWorkflowStats with filtering and pagination

### System Features
- [ ] **Pagination System** - PaginationParams and PaginatedResponse implementation
- [ ] **Filter System** - IssueFilters, PullRequestFilters, WorkflowFilters implementation
- [ ] **Error Handling** - API error responses, network failures, validation errors
- [ ] **Rate Limiting** - GitHub/GitLab API rate limit management and retry logic
- [ ] **GitLab API Integration** - REST API client for providers, repositories, issues, PRs, workflows

## 🟢 低優先度（将来的実装）

### Advanced Features  
- [ ] **Search Functionality** - Text search across issues, PRs, repositories with filters

---

## 🏠 Dashboard（ダッシュボード）

### 統計情報取得
- [ ] **getDashboardStats()** - ダッシュボード統計情報の取得
  - Issues: total, open, closed, assigned
  - Pull Requests: total, open, merged, closed, assigned  
  - Workflows: total, success, failure, in_progress, cancelled
- [ ] **リアルタイム更新** - 30秒間隔での自動更新機能

## ⚙️ Providers（プロバイダー管理）

### プロバイダー基本操作
- [ ] **getProviders()** - プロバイダー一覧取得
- [ ] **getProvider(providerId)** - 単一プロバイダー取得
- [ ] **addProvider()** - 新規プロバイダー追加
- [ ] **updateProviderToken()** - トークン更新
- [ ] **deleteProvider()** - プロバイダー削除（github-com, gitlab-com除く）

### プロバイダー拡張機能
- [ ] **プロバイダー検索** - 名前、URL、タイプでの検索
- [ ] **トークン検証** - APIアクセス可能性の確認
- [ ] **URL接続テスト** - ベースURLへの接続確認
- [ ] **最終同期状態管理** - 同期成功/失敗の記録
- [ ] **同期履歴** - 同期実行日時の管理

## 📂 Repositories（リポジトリ管理）

### リポジトリ基本操作
- [ ] **getRepositories(providerId?)** - 全リポジトリ取得（providerId指定時はプロバイダー別）
- [ ] **getRepository(repositoryId)** - 単一リポジトリ取得
- [ ] **addRepository()** - リポジトリ手動追加
- [ ] **deleteRepository()** - リポジトリ削除

### リポジトリ拡張機能
- [ ] **リポジトリ検索** - 名前、説明、言語での検索
- [ ] **プロバイダーフィルタリング** - プロバイダー別絞り込み
- [ ] **リポジトリ同期** - プロバイダーからの自動取得
- [ ] **リポジトリ情報更新** - stars, forks, issues数の更新
- [ ] **アクティビティ追跡** - 最終活動日時の更新

### URL解析機能
- [ ] **リポジトリURL検証** - GitHub/GitLab URL形式チェック
- [ ] **メタデータ抽出** - URL からリポジトリ名、オーナー抽出
- [ ] **URL変換** - HTTPS ↔ SSH URL変換

## 🐛 Issues（課題管理）

### Issue基本操作
- [ ] **getIssues(repositoryId?)** - 全Issue取得（repositoryId指定時はリポジトリ別）
- [ ] **getIssue(issueId)** - 単一Issue取得
- [ ] **createIssue()** - Issue作成（ローカル）
- [ ] **updateIssue()** - Issue更新

### Issue拡張機能
- [ ] **Issue検索** - タイトル、本文での検索
- [ ] **状態フィルタリング** - open/closed/assigned絞り込み
- [ ] **プロバイダーフィルタリング** - プロバイダー別絞り込み
- [ ] **Issue同期** - プロバイダーからの自動取得
- [ ] **ラベル管理** - Issue ラベルの取得・管理
- [ ] **担当者管理** - アサイン情報の管理

### Issue統計
- [ ] **状態別カウント** - Open/Closed数の集計
- [ ] **担当Issue数** - 現在ユーザーの担当Issue数

## 🔀 Pull Requests（プルリクエスト管理）

### PR基本操作
- [ ] **getPullRequests(repositoryId?)** - 全PR取得（repositoryId指定時はリポジトリ別）
- [ ] **getPullRequest(prId)** - 単一PR取得
- [ ] **createPullRequest()** - PR作成（ローカル）
- [ ] **updatePullRequest()** - PR更新

### PR拡張機能
- [ ] **PR検索** - タイトル、本文での検索
- [ ] **状態フィルタリング** - open/closed/merged絞り込み
- [ ] **プロバイダーフィルタリング** - プロバイダー別絞り込み
- [ ] **PR同期** - プロバイダーからの自動取得
- [ ] **ドラフト状態管理** - ドラフトPRの識別
- [ ] **担当者管理** - アサイン情報の管理

### PR統計
- [ ] **状態別カウント** - Open/Merged/Closed数の集計
- [ ] **担当PR数** - 現在ユーザーの担当PR数

## ⚡ Workflows（ワークフロー管理）

### Workflow基本操作
- [ ] **getWorkflows(repositoryId?)** - 全ワークフロー取得（repositoryId指定時はリポジトリ別）
- [ ] **getWorkflow(workflowId)** - 単一ワークフロー取得

### Workflow拡張機能
- [ ] **ワークフロー検索** - 名前、ブランチでの検索
- [ ] **状態フィルタリング** - success/failure/in_progress/cancelled絞り込み
- [ ] **プロバイダーフィルタリング** - プロバイダー別絞り込み
- [ ] **ワークフロー同期** - プロバイダーからの自動取得
- [ ] **実行詳細管理** - コミット情報、実行者の記録

### Workflow統計
- [ ] **状態別カウント** - Success/Failure/In Progress/Cancelled数の集計
- [ ] **実行履歴管理** - 実行日時、継続時間の記録

## 🔄 Sync & Integration（同期・連携機能）

### 同期機能
- [ ] **手動同期** - 全データの手動同期
- [ ] **自動同期** - 定期的な自動同期
- [ ] **差分同期** - 変更分のみの効率的な同期
- [ ] **同期状態管理** - 同期進行状況の表示

### API連携
- [ ] **GitHub API連携** - GitHub REST API/GraphQL利用
- [ ] **GitLab API連携** - GitLab REST API利用
- [ ] **レート制限管理** - API呼び出し制限の管理
- [ ] **認証トークン管理** - セキュアなトークン保存

## 🔍 Search & Filter（検索・フィルタリング）

### 全画面共通検索
- [ ] **リアルタイム検索** - 入力中の即座な検索結果表示
- [ ] **複合検索** - 複数条件での絞り込み
- [ ] **検索履歴** - 過去の検索条件の保存

### フィルタリング
- [ ] **動的フィルタ** - 選択可能な値の動的生成
- [ ] **フィルタ状態保存** - ページ間でのフィルタ状態維持
- [ ] **カスタムフィルタ** - ユーザー定義フィルタの保存

## 📱 UI/UX支援機能

### 通知機能
- [ ] **リアルタイム通知** - 新しいIssue/PR/Workflowの通知
- [ ] **バッジ表示** - 未読件数の表示
- [ ] **通知設定** - 通知種別の個別設定

### ユーザー設定
- [ ] **表示設定** - リスト表示項目のカスタマイズ
- [ ] **ソート設定** - デフォルトソート順の設定
- [ ] **テーマ設定** - ダーク/ライトモード（将来的）

## 🔐 Security & Validation（セキュリティ・検証）

### データ検証
- [ ] **入力値検証** - URL、トークン形式の検証
- [ ] **権限チェック** - API アクセス権限の確認
- [ ] **データ整合性** - 関連データの整合性チェック

### セキュリティ
- [ ] **トークン暗号化** - 保存時のトークン暗号化
- [ ] **セッション管理** - セキュアなセッション管理
- [ ] **エラーハンドリング** - セキュアなエラー情報の表示

## 🚀 Performance & Optimization（パフォーマンス最適化）

### データベース最適化
- [ ] **インデックス設計** - 検索・フィルタ用インデックス
- [ ] **クエリ最適化** - 効率的なデータ取得
- [ ] **キャッシング** - 頻繁にアクセスするデータのキャッシュ

### API最適化
- [ ] **バッチ処理** - 複数データの一括処理
- [ ] **ページネーション** - 大量データの分割取得
- [ ] **並列処理** - 複数API呼び出しの並列実行

---

## 実装優先度

### 🔴 高優先度（MVP必須）
1. Provider管理（CRUD）
2. Repository管理（CRUD）
3. 基本的な同期機能
4. Dashboard統計表示

### 🟡 中優先度（早期実装）
1. Issue/PR/Workflow表示
2. 検索・フィルタリング
3. プロバイダー別データ取得

### 🟢 低優先度（将来的実装）
1. リアルタイム通知
2. 高度な同期オプション
3. カスタマイズ機能