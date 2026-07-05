<?php
require_once __DIR__ . '/../config/auth_check.php';
requireAuth();
require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $stmt = $pdo->query(
        'SELECT DISTINCT `holiday` FROM Details WHERE `holiday` IS NOT NULL AND `holiday` <> \'\' ORDER BY `holiday` ASC'
    );
    echo json_encode(array_column($stmt->fetchAll(), 'holiday'));
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to retrieve holidays', 'detail' => $e->getMessage()]);
}
