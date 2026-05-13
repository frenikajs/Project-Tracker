<?php
require_once __DIR__ . '/../config/auth_check.php';
requireAuth();
require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

// Shared SELECT with isIncomplete CASE expression
$BASE_SELECT = "
  SELECT
    p.projectID, p.projectName, p.dateCreated, p.lastUpdated, p.status,
    CASE
      WHEN d.projectID   IS NULL          THEN 1
      WHEN IFNULL(d.canva,    '') = ''    THEN 1
      WHEN IFNULL(d.dropbox,  '') = ''    THEN 1
      WHEN IFNULL(d.mockUps,  '') = ''    THEN 1
      WHEN IFNULL(d.listing,  '') = ''    THEN 1
      WHEN IFNULL(d.pinterest, 0) = 0     THEN 1
      ELSE 0
    END AS isIncomplete
  FROM Projects p
  LEFT JOIN Details d ON d.projectID = p.projectID
";

// ── GET /api/projects  or  GET /api/projects/:id ──────────────────────────────
if ($method === 'GET') {

    // Single project
    if ($id !== null) {
        try {
            $stmt = $pdo->prepare($BASE_SELECT . ' WHERE p.projectID = ?');
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row) {
                http_response_code(404);
                echo json_encode(['error' => 'Project not found']);
                exit;
            }
            $row['isIncomplete'] = (bool)$row['isIncomplete'];
            echo json_encode($row);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to retrieve project', 'detail' => $e->getMessage()]);
        }
        exit;
    }

    // List with optional search
    try {
        $search = trim($_GET['search'] ?? '');
        $sql    = $BASE_SELECT;
        $params = [];

        if ($search !== '') {
            $term   = '%' . $search . '%';
            $sql   .= ' WHERE p.projectName LIKE ? OR CAST(p.projectID AS CHAR) LIKE ?';
            $params = [$term, $term];
        }

        $sql .= ' ORDER BY p.lastUpdated DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$r) {
            $r['isIncomplete'] = (bool)$r['isIncomplete'];
        }
        unset($r);

        echo json_encode($rows);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to retrieve projects', 'detail' => $e->getMessage()]);
    }
    exit;
}

// ── POST /api/projects ────────────────────────────────────────────────────────
if ($method === 'POST') {
    try {
        $body        = json_decode(file_get_contents('php://input'), true) ?? [];
        $projectName = trim($body['projectName'] ?? '');
        $status      = trim($body['status'] ?? 'Draft') ?: 'Draft';

        if ($projectName === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Project name is required']);
            exit;
        }

        $now   = date('Y-m-d H:i:s');
        $newId = (int)$pdo->query('SELECT COALESCE(MAX(projectID), 0) + 1 FROM Projects')->fetchColumn();

        $stmt = $pdo->prepare(
            'INSERT INTO Projects (projectID, projectName, dateCreated, lastUpdated, status) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$newId, $projectName, $now, $now, $status]);

        $stmt = $pdo->prepare($BASE_SELECT . ' WHERE p.projectID = ?');
        $stmt->execute([$newId]);
        $row = $stmt->fetch();
        $row['isIncomplete'] = (bool)$row['isIncomplete'];

        http_response_code(201);
        echo json_encode($row);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create project', 'detail' => $e->getMessage()]);
    }
    exit;
}

// ── PUT /api/projects/:id ─────────────────────────────────────────────────────
if ($method === 'PUT') {
    if ($id === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Project ID is required']);
        exit;
    }

    try {
        $body        = json_decode(file_get_contents('php://input'), true) ?? [];
        $projectName = trim($body['projectName'] ?? '');
        $status      = trim($body['status'] ?? 'Draft') ?: 'Draft';

        if ($projectName === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Project name is required']);
            exit;
        }

        $now  = date('Y-m-d H:i:s');
        $stmt = $pdo->prepare(
            'UPDATE Projects SET projectName = ?, lastUpdated = ?, status = ? WHERE projectID = ?'
        );
        $stmt->execute([$projectName, $now, $status, $id]);

        $stmt = $pdo->prepare($BASE_SELECT . ' WHERE p.projectID = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode(['error' => 'Project not found']);
            exit;
        }

        $row['isIncomplete'] = (bool)$row['isIncomplete'];
        echo json_encode($row);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update project', 'detail' => $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
