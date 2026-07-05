<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: text/plain');

$queries = [
    "CREATE TABLE IF NOT EXISTS Todos (
        todoID INT AUTO_INCREMENT PRIMARY KEY,
        todoText VARCHAR(250) NOT NULL,
        sortOrder INT NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

    "CREATE TABLE IF NOT EXISTS ProjectTodos (
        projectID INT NOT NULL,
        todoID INT NOT NULL,
        completed TINYINT(1) NOT NULL DEFAULT 0,
        PRIMARY KEY (projectID, todoID),
        FOREIGN KEY (projectID) REFERENCES Projects(projectID) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (todoID) REFERENCES Todos(todoID) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
];

foreach ($queries as $sql) {
    try {
        $pdo->exec($sql);
        echo "OK: " . substr($sql, 0, 60) . "...\n";
    } catch (PDOException $e) {
        echo "ERR: " . $e->getMessage() . "\n";
    }
}

echo "\nDone.\n";
