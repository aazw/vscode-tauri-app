# データベーススキーマドキュメント

このドキュメントは、Git Portal アプリケーションのデータベーススキーマと、各テーブルとカラムが GitHub および GitLab API レスポンスにどのようにマッピングされるかを説明します。

## 概要

データベースは、データの整合性と保守性を向上させるために、lookup テーブル（enum パターン）を使用した正規化された設計を採用しています。すべてのテーブルには、監査目的で `created_at` と `updated_at` タイムスタンプが含まれています。

## テーブル構造

### Lookup テーブル

#### provider_types
サポートされている Git プロバイダーの種類を保存します。

| カラム | 型 | 説明 |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 一意な識別子 |
| code | TEXT NOT NULL UNIQUE | プロバイダーコード ('github', 'gitlab', 'bitbucket') |
| name | TEXT NOT NULL | 表示名 |
| description | TEXT | プロバイダーの説明 |

#### sync_statuses
同期ステータスの値を保存します。

| カラム | 型 | 説明 |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 一意な識別子 |
| code | TEXT NOT NULL UNIQUE | ステータスコード ('success', 'failure', 'in_progress') |
| name | TEXT NOT NULL | 表示名 |
| description | TEXT | ステータスの説明 |

#### issue_states
イシューの状態の値を保存します。

| カラム | 型 | 説明 |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 一意な識別子 |
| code | TEXT NOT NULL UNIQUE | 状態コード ('open', 'closed') |
| name | TEXT NOT NULL | 表示名 |
| description | TEXT | 状態の説明 |

#### pr_states
プルリクエストの状態の値を保存します。

| カラム | 型 | 説明 |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 一意な識別子 |
| code | TEXT NOT NULL UNIQUE | 状態コード ('open', 'closed', 'merged') |
| name | TEXT NOT NULL | 表示名 |
| description | TEXT | 状態の説明 |

#### workflow_statuses
ワークフローの実行ステータスの値を保存します。

| カラム | 型 | 説明 |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 一意な識別子 |
| code | TEXT NOT NULL UNIQUE | ステータスコード ('success', 'failure', 'in_progress', 'cancelled') |
| name | TEXT NOT NULL | 表示名 |
| description | TEXT | ステータスの説明 |

#### workflow_conclusions
ワークフローの結論の値を保存します。

| カラム | 型 | 説明 |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 一意な識別子 |
| code | TEXT NOT NULL UNIQUE | 結論コード ('success', 'failure', 'cancelled', 'skipped', 'timed_out', 'action_required', 'neutral') |
| name | TEXT NOT NULL | 表示名 |
| description | TEXT | 結論の説明 |

## メインテーブル

### git_providers
Git プロバイダー設定（GitHub、GitLab など）を保存します。

| カラム | 型 | 説明 | GitHub API | GitLab API |
|--------|------|-------------|------------|------------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 一意なプロバイダー識別子 | - | - |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | レコード作成タイムスタンプ(管理用カラム) | - | - |
| updated_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | レコード更新タイムスタンプ(管理用カラム) | - | - |
| name | TEXT NOT NULL | ユーザー定義プロバイダー名 | - | - |
| provider_type_id | INTEGER NOT NULL | プロバイダータイプ（provider_types への外部キー） | - | - |
| base_url | TEXT NOT NULL | API ベース URL | https://api.github.com | https://gitlab.com/api/v4 |
| token | TEXT | API 認証トークン | - | - |
| token_valid | BOOLEAN DEFAULT FALSE | トークンの有効性ステータス | - | - |
| last_sync | TIMESTAMP | 最終同期タイムスタンプ | - | - |
| last_sync_status_id | INTEGER | 最終同期ステータス（sync_statuses への外部キー） | - | - |

### repositories
リポジトリ情報を保存します。

| カラム | 型 | 説明 | GitHub API | GitLab API |
|--------|------|-------------|------------|------------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 一意なリポジトリ識別子 | - | - |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | レコード作成タイムスタンプ(管理用カラム) | - | - |
| updated_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | レコード更新タイムスタンプ(管理用カラム) | - | - |
| provider_id | INTEGER NOT NULL | プロバイダー参照（git_providers への外部キー） | - | - |
| api_id | TEXT NOT NULL | API での ID | `id` | `id` |
| api_created_at | TIMESTAMP | API での作成日時 | `created_at` | `created_at` |
| api_updated_at | TIMESTAMP | API での更新日時 | `updated_at` | `updated_at` |
| name | TEXT NOT NULL | リポジトリ名 | `name` | `name` |
| full_name | TEXT NOT NULL | オーナー付きのフルリポジトリ名 | `full_name` | `name_with_namespace` |
| description | TEXT | リポジトリの説明 | `description` | `description` |
| web_url | TEXT NOT NULL | リポジトリ Web URL | `html_url` | `web_url` |
| is_private | BOOLEAN NOT NULL DEFAULT FALSE | プライベートリポジトリフラグ | `private` | `visibility` != 'public' |
| language | TEXT | 主要プログラミング言語 | `language` | - |
| last_activity | TIMESTAMP | 最終アクティビティタイムスタンプ | `pushed_at` | `last_activity_at` |

### issues
イシュー情報を保存します。

| カラム | 型 | 説明 | GitHub API | GitLab API |
|--------|------|-------------|------------|------------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 一意なイシュー識別子 | - | - |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | レコード作成タイムスタンプ(管理用カラム) | - | - |
| updated_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | レコード更新タイムスタンプ(管理用カラム) | - | - |
| repository_id | INTEGER NOT NULL | リポジトリ参照（repositories への外部キー） | - (repositories.id で解決) | - (repositories.id で解決) |
| state_id | INTEGER NOT NULL | イシューの状態（issue_states への外部キー） | `state` | `state` |
| api_id | TEXT NOT NULL | API での ID | `id` | `id` |
| api_created_at | TIMESTAMP | API での作成日時 | `created_at` | `created_at` |
| api_updated_at | TIMESTAMP | API での更新日時 | `updated_at` | `updated_at` |
| title | TEXT NOT NULL | イシューのタイトル | `title` | `title` |
| number | INTEGER NOT NULL | イシュー番号 | `number` | `iid` |
| author | TEXT NOT NULL | イシュー作成者 | `user.login` | `author.username` |
| assigned_to_me | BOOLEAN NOT NULL DEFAULT FALSE | 自分にアサインされているか | `assignee.login == current_user` | `assignees[].username includes current_user` |
| labels | TEXT NOT NULL | JSON 配列としてのラベル | `labels[].name` | `labels[]` |
| closed_at | TIMESTAMP | クローズ日時 | `closed_at` | `closed_at` |
| url | TEXT NOT NULL | イシュー Web URL | `html_url` | `web_url` |

### pull_requests
プルリクエスト情報を保存します。

| カラム | 型 | 説明 | GitHub API | GitLab API |
|--------|------|-------------|------------|------------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 一意なプルリクエスト識別子 | - | - |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | レコード作成タイムスタンプ(管理用カラム) | - | - |
| updated_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | レコード更新タイムスタンプ(管理用カラム) | - | - |
| repository_id | INTEGER NOT NULL | リポジトリ参照（repositories への外部キー） | - (repositories.id で解決) | - (repositories.id で解決) |
| state_id | INTEGER NOT NULL | プルリクエストの状態（pr_states への外部キー） | `state` + `merged` | `state` |
| api_id | TEXT NOT NULL | API での ID | `id` | `id` |
| api_created_at | TIMESTAMP | API での作成日時 | `created_at` | `created_at` |
| api_updated_at | TIMESTAMP | API での更新日時 | `updated_at` | `updated_at` |
| title | TEXT NOT NULL | プルリクエストのタイトル | `title` | `title` |
| number | INTEGER NOT NULL | プルリクエスト番号 | `number` | `iid` |
| author | TEXT NOT NULL | プルリクエスト作成者 | `user.login` | `author.username` |
| assigned_to_me | BOOLEAN NOT NULL DEFAULT FALSE | 自分にアサインされているか | `assignee.login == current_user` | `assignees[].username includes current_user` |
| draft | BOOLEAN NOT NULL DEFAULT FALSE | ドラフト状態 | `draft` | `draft` |
| merged_at | TIMESTAMP | マージ日時 | `merged_at` | `merged_at` |
| closed_at | TIMESTAMP | クローズ日時 | `closed_at` | `closed_at` |
| url | TEXT NOT NULL | プルリクエスト Web URL | `html_url` | `web_url` |

### workflow_runs
ワークフロー/パイプラインの実行情報を保存します。

| カラム | 型 | 説明 | GitHub API | GitLab API |
|--------|------|-------------|------------|------------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 一意なワークフロー実行識別子 | - | - |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | レコード作成タイムスタンプ(管理用カラム) | - | - |
| updated_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | レコード更新タイムスタンプ(管理用カラム) | - | - |
| repository_id | INTEGER NOT NULL | リポジトリ参照（repositories への外部キー） | - (repositories.id で解決) | - (repositories.id で解決) |
| status_id | INTEGER NOT NULL | ワークフローステータス（workflow_statuses への外部キー） | `status` | `status` |
| conclusion_id | INTEGER | ワークフロー結論（workflow_conclusions への外部キー） | `conclusion` | - |
| api_id | TEXT NOT NULL | API での ID | `id` | `id` |
| api_created_at | TIMESTAMP | API での作成日時 | `created_at` | `created_at` |
| api_updated_at | TIMESTAMP | API での更新日時 | `updated_at` | `updated_at` |
| name | TEXT NOT NULL | ワークフロー名 | `name` | `name` |
| url | TEXT NOT NULL | ワークフロー Web URL | `html_url` | `web_url` |

## API エンドポイントリファレンス

### GitHub API
- **リポジトリ**: `GET /repos/{owner}/{repo}` - [ドキュメント](https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#get-a-repository)
- **イシュー**: `GET /repos/{owner}/{repo}/issues/{issue_number}` - [ドキュメント](https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#get-an-issue)
- **プルリクエスト**: `GET /repos/{owner}/{repo}/pulls/{pull_number}` - [ドキュメント](https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#get-a-pull-request)
- **ワークフロー実行**: `GET /repos/{owner}/{repo}/actions/runs/{run_id}` - [ドキュメント](https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28#get-a-workflow-run)

### GitLab API
- **プロジェクト**: `GET /projects/{id}` - [ドキュメント](https://docs.gitlab.com/ee/api/projects.html#get-single-project)
- **イシュー**: `GET /projects/{id}/issues/{issue_iid}` - [ドキュメント](https://docs.gitlab.com/ee/api/issues.html#single-issue)
- **マージリクエスト**: `GET /projects/{id}/merge_requests/{merge_request_iid}` - [ドキュメント](https://docs.gitlab.com/ee/api/merge_requests.html#get-single-mr)
- **パイプライン**: `GET /projects/{id}/pipelines/{pipeline_id}` - [ドキュメント](https://docs.gitlab.com/ee/api/pipelines.html#get-a-single-pipeline)

## 外部キー制約

すべての外部キー関係には、データの整合性のための CASCADE ルールが含まれています：

- **ON DELETE CASCADE**: 親レコードが削除されると、すべての子レコードが自動的に削除されます
- **ON DELETE RESTRICT**: 依存する子レコードがある親レコードの削除を防ぎます
- **ON DELETE SET NULL**: 親レコードが削除されると、外部キーを NULL に設定します
- **ON UPDATE CASCADE**: 親レコードの主キーが更新されると、すべての参照が自動的に更新されます

## ユニーク制約

データの整合性を保つため、以下のユニーク制約が設定されています：

### repositories テーブル
- `UNIQUE(provider_id, api_id)` - 同一プロバイダー内でのリポジトリの一意性

### issues テーブル
- `UNIQUE(repository_id, number)` - 同一リポジトリ内でのイシュー番号の一意性

### pull_requests テーブル
- `UNIQUE(repository_id, number)` - 同一リポジトリ内でのプルリクエスト番号の一意性

### workflow_runs テーブル
- `UNIQUE(repository_id, api_id)` - 同一リポジトリ内でのワークフロー実行の一意性

## インデックス戦略

以下にインデックスが作成されています：
- 結合パフォーマンス向上のためのすべての外部キーカラム
- 頻繁にクエリされるカラム（state_id、status_id など）
- リポジトリ固有のクエリ（issues、pull_requests、workflow_runs の repository_id）
- 複合インデックス（ユニーク制約と重複するものは除く）：
  - `idx_issues_repo_state` ON issues(repository_id, state_id)
  - `idx_pr_repo_state` ON pull_requests(repository_id, state_id)
  - `idx_issues_assigned_to_me` ON issues(assigned_to_me) WHERE assigned_to_me = TRUE
  - `idx_pr_assigned_to_me` ON pull_requests(assigned_to_me) WHERE assigned_to_me = TRUE

## 注意事項

1. **ラベル**: 
   - **SQLite**: `labels TEXT` として JSON 配列で保存
   - **PostgreSQL**: `labels TEXT[]` として配列型で保存が推奨
   - より高度なクエリが必要な場合は、別テーブルに正規化も可能

2. **タイムスタンプ**: 
   - `created_at`/`updated_at`: アプリでのレコード管理用（自動設定）
   - `api_created_at`/`api_updated_at`: API から取得した元の日時
   - `last_activity`: リポジトリの最終アクティビティ日時

3. **ID**: 
   - すべてのテーブルの主キー `id` は auto-increment な INTEGER
   - API から取得した ID は `api_id` として TEXT で保存（GitHub/GitLab の ID 形式に対応）
   - Lookup テーブルは `code` カラムで実際の値を管理

4. **Lookup テーブル設計**:
   - 主キーは INTEGER PRIMARY KEY AUTOINCREMENT
   - 実際の値は `code` カラム（UNIQUE制約）で管理
   - 外部キー参照は主キーの INTEGER を使用
   - パフォーマンスと標準化のため

5. **状態マッピング**: 
   - GitHub プルリクエストは `state` と `merged` フィールドの組み合わせを使用
   - GitLab マージリクエストは `state` フィールドを直接使用
   - ワークフロー結論は GitHub 固有。GitLab パイプラインはステータスのみ

6. **プロバイダー固有フィールド**: `language` のような一部のフィールドは GitHub では利用可能ですが GitLab では利用できません（その逆も同様）。

7. **workflow_runs の注意**: GitLab パイプラインには `conclusion` フィールドが存在しないため、`conclusion_id` は NULL になります。これは設計上の想定内です。