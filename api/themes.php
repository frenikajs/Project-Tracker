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
        'SELECT DISTINCT `theme` FROM Details WHERE `theme` IS NOT NULL AND `theme` <> \'\' ORDER BY `theme` ASC'
    );
    echo json_encode(array_column($stmt->fetchAll(), 'theme'));
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to retrieve themes', 'detail' => $e->getMessage()]);
}
