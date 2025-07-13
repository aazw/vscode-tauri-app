-- Git Portal Database Schema - Initial Lookup Tables

-- Lookup Tables (Enum Tables)
CREATE TABLE provider_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE sync_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE issue_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE pr_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE workflow_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE workflow_conclusions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT
);

-- Initial data for lookup tables (with explicit IDs for idempotency)
INSERT INTO provider_types (id, code, name, description) VALUES
    (1, 'github', 'GitHub', 'GitHub provider'),
    (2, 'gitlab', 'GitLab', 'GitLab provider'),
    (3, 'bitbucket', 'Bitbucket', 'Bitbucket provider');

INSERT INTO sync_statuses (id, code, name, description) VALUES
    (1, 'success', 'Success', 'Sync completed successfully'),
    (2, 'failure', 'Failure', 'Sync failed'),
    (3, 'in_progress', 'In Progress', 'Sync is currently running');

INSERT INTO issue_states (id, code, name, description) VALUES
    (1, 'open', 'Open', 'Issue is open'),
    (2, 'closed', 'Closed', 'Issue is closed');

INSERT INTO pr_states (id, code, name, description) VALUES
    (1, 'open', 'Open', 'Pull request is open'),
    (2, 'closed', 'Closed', 'Pull request is closed'),
    (3, 'merged', 'Merged', 'Pull request is merged');

INSERT INTO workflow_statuses (id, code, name, description) VALUES
    (1, 'queued', 'Queued', 'Workflow is queued to run'),
    (2, 'in_progress', 'In Progress', 'Workflow is running'),
    (3, 'completed', 'Completed', 'Workflow has completed'),
    (4, 'cancelled', 'Cancelled', 'Workflow was cancelled'),
    (5, 'requested', 'Requested', 'Workflow run has been requested'),
    (6, 'waiting', 'Waiting', 'Workflow is waiting for approval');

INSERT INTO workflow_conclusions (id, code, name, description) VALUES
    (1, 'success', 'Success', 'All jobs completed successfully'),
    (2, 'failure', 'Failure', 'One or more jobs failed'),
    (3, 'cancelled', 'Cancelled', 'Workflow was cancelled'),
    (4, 'skipped', 'Skipped', 'Workflow was skipped'),
    (5, 'timed_out', 'Timed Out', 'Workflow exceeded time limit'),
    (6, 'action_required', 'Action Required', 'Manual action is required'),
    (7, 'neutral', 'Neutral', 'Neutral result');