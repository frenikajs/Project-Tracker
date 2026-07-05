<?php
require_once __DIR__ . '/../config/auth_check.php';
requireAuth();
require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json');

$method    = $_SERVER['REQUEST_METHOD'];
$projectId = isset($_GET['projectId']) ? (int)$_GET['projectId'] : null;

if ($projectId === null) {
    http_response_code(400);
    echo json_encode(['error' => 'projectId is required']);
    exit;
}

// GET — all todos for a project with completion status
if ($method === 'GET') {
    try {
        $stmt = $pdo->prepare("
            SELECT t.todoID, t.todoText,
                   IFNULL(pt.completed, 0) AS completed
            FROM Todos t
            LEFT JOIN ProjectTodos pt
              ON pt.todoID = t.todoID AND pt.projectID = ?
            ORDER BY t.sortOrder ASC, t.createdAt ASC
        ");
        $stmt->execute([$projectId]);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$r) {
            $r['completed'] = (bool)(int)$r['completed'];
        }
        unset($r);

        echo json_encode($rows);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to retrieve project todos', 'detail' => $e->getMessage()]);
    }
    exit;
}

// PUT — set completion status for one todo on this project
if ($method === 'PUT') {
    $todoId = isset($_GET['todoId']) ? (int)$_GET['todoId'] : null;
    if ($todoId === null) {
        http_response_code(400);
        echo json_encode(['error' => 'todoId is required']);
        exit;
    }

    try {
        $body      = json_decode(file_get_contents('php://input'), true) ?? [];
        $completed = !empty($body['completed']) ? 1 : 0;

        $pdo->prepare("
            INSERT INTO ProjectTodos (projectID, todoID, completed)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE completed = VALUES(completed)
        ")->execute([$projectId, $todoId, $completed]);

        echo json_encode(['projectID' => $projectId, 'todoID' => $todoId, 'completed' => (bool)$completed]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update project todo', 'detail' => $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
