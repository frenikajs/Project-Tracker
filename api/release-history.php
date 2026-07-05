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

// GET — release-date change history for a project, newest first
if ($method === 'GET') {
    try {
        $stmt = $pdo->prepare(
            'SELECT historyID, projectID, oldDate, newDate, changedAt
             FROM ReleaseDateHistory
             WHERE projectID = ?
             ORDER BY changedAt DESC, historyID DESC'
        );
        $stmt->execute([$projectId]);
        echo json_encode($stmt->fetchAll());
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to retrieve release history', 'detail' => $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
