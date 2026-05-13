-- ============================================================
-- Project Tracker - One-time database fix
-- Run against: dbs15601515
--
-- Fixes:
--   1. Reassign projectID 0 → 1 in Projects and Details
--   2. Remove duplicate Details rows (keep one per projectID)
--   3. Set projectID as PRIMARY KEY on Details
--   4. Add FK Details.projectID → Projects.projectID
--   5. Reset Projects AUTO_INCREMENT to (max + 1)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. Reassign projectID 0 → 1 ──────────────────────────────────────────────
UPDATE Details  SET projectID = 1 WHERE projectID = 0;
UPDATE Projects SET projectID = 1 WHERE projectID = 0;

-- ── 2. Remove duplicate Details rows, keeping the last-inserted per project ──
--      Requires Details to have some column that distinguishes rows.
--      If your Details table has a surrogate 'id' column, use this block:
DELETE d1
FROM   Details d1
JOIN   Details d2 ON d1.projectID = d2.projectID AND d1.id < d2.id;

--      If there is NO surrogate 'id' column, comment out the block above
--      and uncomment these lines instead:
-- CREATE TEMPORARY TABLE _keep SELECT * FROM Details GROUP BY projectID;
-- DELETE FROM Details;
-- INSERT INTO Details SELECT * FROM _keep;
-- DROP TEMPORARY TABLE _keep;

-- ── 3. Fix Details primary key ───────────────────────────────────────────────
--      Drop the surrogate 'id' column if it exists
ALTER TABLE Details DROP PRIMARY KEY;
ALTER TABLE Details DROP COLUMN id;

--      Make projectID the primary key (enforces 1:1 with Projects)
ALTER TABLE Details ADD PRIMARY KEY (projectID);

-- ── 4. Add foreign key constraint ────────────────────────────────────────────
ALTER TABLE Details
  ADD CONSTRAINT fk_details_project
  FOREIGN KEY (projectID) REFERENCES Projects(projectID)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- ── 5. Ensure projectID has AUTO_INCREMENT and reset the counter ─────────────
ALTER TABLE Projects
  MODIFY COLUMN projectID INT NOT NULL AUTO_INCREMENT;

ALTER TABLE Projects AUTO_INCREMENT = 2;

-- ── 6. Replace statusID (FK → Status table) with a plain status VARCHAR ──────
--      Drop the FK constraint first (constraint name may differ — check with
--      SHOW CREATE TABLE Projects; and substitute the real name if needed)
ALTER TABLE Projects DROP FOREIGN KEY fk_projects_status;

ALTER TABLE Projects
  CHANGE COLUMN statusID status VARCHAR(15) NULL DEFAULT 'Draft';

-- Set any NULL values (previously unset) to Draft
UPDATE Projects SET status = 'Draft' WHERE status IS NULL;

SET FOREIGN_KEY_CHECKS = 1;
