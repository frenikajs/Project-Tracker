<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Call from API endpoints — returns 401 JSON and exits if not authenticated
function requireAuth() {
    if (empty($_SESSION['authenticated'])) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
}

// Call from HTML pages — redirects to login page if not authenticated
function requireAuthRedirect() {
    if (empty($_SESSION['authenticated'])) {
        header('Location: /login.html');
        exit;
    }
}
