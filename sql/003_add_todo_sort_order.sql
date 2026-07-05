-- ============================================================
-- Project Tracker - Add sortOrder to Todos table
-- Run against: dbs15601515
--
-- Skip this if running 002_add_todos.sql fresh (column included).
-- Only needed if Todos table was already created without sortOrder.
-- ============================================================

ALTER TABLE Todos ADD COLUMN sortOrder INT NOT NULL DEFAULT 0 AFTER todoText;

-- Back-fill existing rows so order matches creation time
SET @pos := 0;
UPDATE Todos SET sortOrder = (@pos := @pos + 1) ORDER BY createdAt ASC;
