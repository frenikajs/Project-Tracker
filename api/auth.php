<?php
require_once __DIR__ . '/../config/auth_check.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ── POST /api/auth/login ──────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'login') {
    $body     = json_decode(file_get_contents('php://input'), true) ?? [];
    $password = trim($body['password'] ?? '');

    // Daily password: DDMMYYFS  (e.g. 270426FS for 27 April 2026)
    $now   = new DateTime();
    $daily = $now->format('d') . $now->format('m') . $now->format('y') . 'FS';

    if ($password === $daily) {
        $_SESSION['authenticated'] = true;
        echo json_encode(['success' => true]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Incorrect password']);
    }
    exit;
}

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);
