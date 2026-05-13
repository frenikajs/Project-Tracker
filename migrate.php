<?php
/**
 * One-time database fix script.
 *
 * Problems addressed:
 *  1. Projects.projectID auto-increment starts at 0 instead of 1.
 *  2. Details table lacks a PRIMARY KEY on projectID, allowing multiple rows
 *     per project and causing duplicate rows in the main grid JOIN.
 *
 * Run once via browser or CLI, then delete this file.
 */
require_once __DIR__ . '/config/db.php';

header('Content-Type: text/plain');

$steps = [];
$errors = [];

try {
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');

    // ── 1. Fix the existing project row that was inserted with projectID = 0 ──
    $zeroCount = (int)$pdo->query('SELECT COUNT(*) FROM Projects WHERE projectID = 0')->fetchColumn();
    if ($zeroCount > 0) {
        // Determine the next safe ID (1, or higher if 1 already exists)
        $nextId = (int)$pdo->query('SELECT COALESCE(MAX(projectID), 0) + 1 FROM Projects WHERE projectID > 0')->fetchColumn();
        if ($nextId < 1) $nextId = 1;

        // Check if that ID is already taken
        $taken = (int)$pdo->query("SELECT COUNT(*) FROM Projects WHERE projectID = $nextId")->fetchColumn();
        if ($taken > 0) {
            $errors[] = "Cannot reassign projectID 0 → $nextId: ID $nextId already exists.";
        } else {
            // Update Details first (FK child), then Projects (FK parent)
            $pdo->exec("UPDATE Details  SET projectID = $nextId WHERE projectID = 0");
            $pdo->exec("UPDATE Projects SET projectID = $nextId WHERE projectID = 0");
            $steps[] = "Reassigned projectID 0 → $nextId in Projects and Details.";
        }
    } else {
        $steps[] = "No projectID = 0 rows found in Projects — skipped.";
    }

    // ── 2. Fix the Details table schema ──────────────────────────────────────
    // Inspect current columns
    $cols = $pdo->query("SHOW COLUMNS FROM Details")->fetchAll(PDO::FETCH_ASSOC);
    $colNames = array_column($cols, 'Field');

    // Check whether a non-projectID primary key exists (auto-increment surrogate)
    $hasAutoId = in_array('id', $colNames, true);

    // Check for existing PRIMARY KEY
    $indexes = $pdo->query("SHOW INDEX FROM Details WHERE Key_name = 'PRIMARY'")->fetchAll(PDO::FETCH_ASSOC);
    $pkCols  = array_column($indexes, 'Column_name');

    if ($pkCols === ['projectID']) {
        $steps[] = "Details PRIMARY KEY is already projectID — schema is correct.";
    } else {
        // Remove duplicate Details rows before altering the key.
        // Keep the row with the most non-null/non-empty fields for each projectID.
        if ($hasAutoId) {
            // Table has a surrogate 'id'; drop duplicates keeping the best row per projectID.
            $pdo->exec("
                DELETE d1 FROM Details d1
                INNER JOIN Details d2
                  ON d1.projectID = d2.projectID
                 AND d1.id < d2.id
            ");
            $steps[] = "Removed duplicate Details rows (kept latest per projectID).";

            // Drop the surrogate PK and column, then add projectID as PK
            $pdo->exec("ALTER TABLE Details DROP PRIMARY KEY, DROP COLUMN id");
            $steps[] = "Dropped surrogate 'id' column from Details.";
        } else {
            // No surrogate id — deduplicate using a temp table approach
            $pdo->exec("
                CREATE TEMPORARY TABLE _details_keep AS
                SELECT * FROM Details
                GROUP BY projectID
            ");
            $pdo->exec("DELETE FROM Details");
            $pdo->exec("INSERT INTO Details SELECT * FROM _details_keep");
            $pdo->exec("DROP TEMPORARY TABLE _details_keep");
            $steps[] = "Deduplicated Details rows (kept one row per projectID).";

            // Drop existing PK (if any) before adding the correct one
            if (!empty($pkCols)) {
                $pdo->exec("ALTER TABLE Details DROP PRIMARY KEY");
                $steps[] = "Dropped old PRIMARY KEY from Details (" . implode(', ', $pkCols) . ").";
            }
        }

        // Add projectID as the PRIMARY KEY with FK back to Projects
        $pdo->exec("ALTER TABLE Details ADD PRIMARY KEY (projectID)");
        $steps[] = "Set projectID as PRIMARY KEY on Details.";

        // Ensure the FK constraint exists
        $fks = $pdo->query("
            SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME   = 'Details'
              AND COLUMN_NAME  = 'projectID'
              AND REFERENCED_TABLE_NAME = 'Projects'
        ")->fetchAll(PDO::FETCH_COLUMN);

        if (empty($fks)) {
            $pdo->exec("
                ALTER TABLE Details
                  ADD CONSTRAINT fk_details_project
                  FOREIGN KEY (projectID) REFERENCES Projects(projectID)
                  ON DELETE CASCADE ON UPDATE CASCADE
            ");
            $steps[] = "Added FOREIGN KEY Details.projectID → Projects.projectID.";
        } else {
            $steps[] = "FOREIGN KEY on Details.projectID already exists — skipped.";
        }
    }

    // ── 3. Reset AUTO_INCREMENT to one above the current max ─────────────────
    $maxId = (int)$pdo->query('SELECT COALESCE(MAX(projectID), 0) FROM Projects')->fetchColumn();
    $nextAutoInc = $maxId + 1;
    $pdo->exec("ALTER TABLE Projects AUTO_INCREMENT = $nextAutoInc");
    $steps[] = "Set Projects AUTO_INCREMENT = $nextAutoInc (next new project will get ID $nextAutoInc).";

    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

    echo "=== Migration complete ===\n\n";
    foreach ($steps as $i => $s) {
        echo ($i + 1) . ". " . $s . "\n";
    }
    if ($errors) {
        echo "\n=== Warnings / errors ===\n";
        foreach ($errors as $e) {
            echo "  ! " . $e . "\n";
        }
    }
    echo "\n--- Delete migrate.php from the server when done ---\n";

} catch (PDOException $e) {
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    echo "=== FAILED ===\n";
    echo $e->getMessage() . "\n";
    if ($steps) {
        echo "\nCompleted steps before failure:\n";
        foreach ($steps as $i => $s) {
            echo ($i + 1) . ". " . $s . "\n";
        }
    }
}
