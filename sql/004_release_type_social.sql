-- ============================================================
-- Project Tracker - Add release date + tracker, product type, social media
-- Run against: dbs15601515
--
-- Adds:
--   1. Projects.releaseDate          — planned/actual release date
--   2. ReleaseDateHistory            — log of every release-date change
--   3. Details.productType           — 'Online Sequence' | 'Online Puzzle'
--   4. Details.socialMedia           — boolean flag (beside blog/email/etc.)
-- ============================================================

-- ── 1. Release date on the project itself ────────────────────────────────────
ALTER TABLE Projects ADD COLUMN releaseDate DATE NULL AFTER status;

-- ── 2. History of release-date changes ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ReleaseDateHistory (
    historyID  INT AUTO_INCREMENT PRIMARY KEY,
    projectID  INT       NOT NULL,
    oldDate    DATE      NULL,
    newDate    DATE      NULL,
    changedAt  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projectID) REFERENCES Projects(projectID)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 3. Online Sequence vs Online Puzzle (stored with project details) ────────
ALTER TABLE Details ADD COLUMN productType VARCHAR(20) NOT NULL DEFAULT 'Online Sequence';

-- ── 4. Social Media flag (sits beside pinterest/expansion/blog/email) ────────
ALTER TABLE Details ADD COLUMN socialMedia TINYINT(1) NOT NULL DEFAULT 0;
