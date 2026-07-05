-- ============================================================
-- Project Tracker - Add To-Do tracking tables
-- Run against: dbs15601515
--
-- Adds:
--   1. Todos        — template definitions (shared across all projects)
--   2. ProjectTodos — per-project completion state
-- ============================================================

-- ── 1. To-do template definitions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Todos (
    todoID    INT AUTO_INCREMENT PRIMARY KEY,
    todoText  VARCHAR(250) NOT NULL,
    sortOrder INT          NOT NULL DEFAULT 0,
    createdAt DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 2. Per-project to-do completion state ────────────────────────────────────
CREATE TABLE IF NOT EXISTS ProjectTodos (
    projectID INT        NOT NULL,
    todoID    INT        NOT NULL,
    completed TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (projectID, todoID),
    FOREIGN KEY (projectID) REFERENCES Projects(projectID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (todoID) REFERENCES Todos(todoID)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
