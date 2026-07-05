<?php
require_once __DIR__ . '/../config/auth_check.php';
requireAuth();
require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

// GET — list all to-do templates
if ($method === 'GET') {
    try {
        $rows = $pdo->query('SELECT * FROM Todos ORDER BY sortOrder ASC, createdAt ASC')->fetchAll();
        echo json_encode($rows);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to retrieve todos', 'detail' => $e->getMessage()]);
    }
    exit;
}

// POST — create a new to-do template
if ($method === 'POST') {
    try {
        $body     = json_decode(file_get_contents('php://input'), true) ?? [];
        $todoText = trim($body['todoText'] ?? '');

        if ($todoText === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Todo text is required']);
            exit;
        }
        if (mb_strlen($todoText) > 250) {
            http_response_code(400);
            echo json_encode(['error' => 'Todo text must be 250 characters or less']);
            exit;
        }

        $stmt = $pdo->prepare('INSERT INTO Todos (todoText) VALUES (?)');
        $stmt->execute([$todoText]);

        $newId = (int)$pdo->lastInsertId();
        $stmt  = $pdo->prepare('SELECT * FROM Todos WHERE todoID = ?');
        $stmt->execute([$newId]);

        http_response_code(201);
        echo json_encode($stmt->fetch());
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create todo', 'detail' => $e->getMessage()]);
    }
    exit;
}

// PUT — reorder all to-dos  (body: { order: [todoID, ...] }, no ?id=)
if ($method === 'PUT' && $id === null) {
    $body  = json_decode(file_get_contents('php://input'), true) ?? [];
    $order = $body['order'] ?? null;

    if (!is_array($order)) {
        http_response_code(400);
        echo json_encode(['error' => 'Todo ID is required']);
        exit;
    }

    try {
        $pdo->beginTransaction();
        $upd = $pdo->prepare('UPDATE Todos SET sortOrder = ? WHERE todoID = ?');
        foreach (array_values($order) as $pos => $todoID) {
            $upd->execute([$pos, (int)$todoID]);
        }
        $pdo->commit();

        $rows = $pdo->query('SELECT * FROM Todos ORDER BY sortOrder ASC, createdAt ASC')->fetchAll();
        echo json_encode($rows);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save order', 'detail' => $e->getMessage()]);
    }
    exit;
}

// PUT — update a to-do template
if ($method === 'PUT') {
    if ($id === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Todo ID is required']);
        exit;
    }
    try {
        $body     = json_decode(file_get_contents('php://input'), true) ?? [];
        $todoText = trim($body['todoText'] ?? '');

        if ($todoText === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Todo text is required']);
            exit;
        }
        if (mb_strlen($todoText) > 250) {
            http_response_code(400);
            echo json_encode(['error' => 'Todo text must be 250 characters or less']);
            exit;
        }

        $stmt = $pdo->prepare('UPDATE Todos SET todoText = ? WHERE todoID = ?');
        $stmt->execute([$todoText, $id]);

        $stmt = $pdo->prepare('SELECT * FROM Todos WHERE todoID = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode(['error' => 'Todo not found']);
            exit;
        }
        echo json_encode($row);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update todo', 'detail' => $e->getMessage()]);
    }
    exit;
}

// DELETE — remove a to-do template (cascades to ProjectTodos)
if ($method === 'DELETE') {
    if ($id === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Todo ID is required']);
        exit;
    }
    try {
        $stmt = $pdo->prepare('DELETE FROM Todos WHERE todoID = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Todo not found']);
            exit;
        }
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete todo', 'detail' => $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
