<?php
require_once __DIR__ . '/../config/auth_check.php';
requireAuth();
require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

if ($id === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Project ID is required']);
    exit;
}

// ── GET /api/details/:id ──────────────────────────────────────────────────────
if ($method === 'GET') {
    try {
        $stmt = $pdo->prepare('SELECT * FROM Details WHERE projectID = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        echo json_encode($row ?: null);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to retrieve details', 'detail' => $e->getMessage()]);
    }
    exit;
}

// ── PUT /api/details/:id  (upsert — create or update) ────────────────────────
if ($method === 'PUT') {
    try {
        $body       = json_decode(file_get_contents('php://input'), true) ?? [];
        $canva      = ($body['canva']       ?? null) ?: null;
        $dropbox    = ($body['dropbox']     ?? null) ?: null;
        $mockUps    = ($body['mockUps']     ?? null) ?: null;
        $pinterest  = !empty($body['pinterest']) ? 1 : 0;
        $listing      = ($body['listing']       ?? null) ?: null;
        $sequenceLink = ($body['sequenceLink'] ?? null) ?: null;
        $blurb      = ($body['blurb']       ?? null) ?: null;
        $accessCode = ($body['accessCode']  ?? null) ?: null;
        $expansion  = !empty($body['expansion']) ? 1 : 0;
        $blog       = !empty($body['blog'])       ? 1 : 0;
        $email      = !empty($body['email'])      ? 1 : 0;
        $socialMedia = !empty($body['socialMedia']) ? 1 : 0;
        $theme      = ($body['theme']       ?? null) ?: null;
        $productType = trim($body['productType'] ?? '') ?: 'Online Sequence';

        $pdo->prepare("
            INSERT INTO Details
              (projectID, canva, dropbox, mockUps, pinterest, listing, sequenceLink, blurb, accessCode, expansion, blog, email, socialMedia, `theme`, productType)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              canva         = VALUES(canva),
              dropbox       = VALUES(dropbox),
              mockUps       = VALUES(mockUps),
              pinterest     = VALUES(pinterest),
              listing       = VALUES(listing),
              sequenceLink  = VALUES(sequenceLink),
              blurb         = VALUES(blurb),
              accessCode    = VALUES(accessCode),
              expansion     = VALUES(expansion),
              blog          = VALUES(blog),
              email         = VALUES(email),
              socialMedia   = VALUES(socialMedia),
              `theme`       = VALUES(`theme`),
              productType   = VALUES(productType)
        ")->execute([$id, $canva, $dropbox, $mockUps, $pinterest, $listing, $sequenceLink, $blurb, $accessCode, $expansion, $blog, $email, $socialMedia, $theme, $productType]);

        $stmt = $pdo->prepare('SELECT * FROM Details WHERE projectID = ?');
        $stmt->execute([$id]);
        echo json_encode($stmt->fetch());
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save details', 'detail' => $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
