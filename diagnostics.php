<?php
require_once __DIR__ . '/config/auth_check.php';
requireAuthRedirect();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diagnostics — Project Tracker</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>

  <header class="app-header">
    <div class="header-content">
      <div class="header-left">
        <button class="btn-back" id="headerBackBtn">← Back</button>
        <h1 class="app-title">Diagnostics</h1>
      </div>
    </div>
  </header>

  <main class="main-content">
    <div class="diag-container">

      <div class="diag-section">
        <h2 class="diag-section-title">To-Do Templates</h2>
        <p class="diag-section-desc">Add items that should be tracked for every project. Each project maintains its own completion state.</p>

        <div class="diag-add-row">
          <input
            type="text"
            id="newTodoInput"
            class="form-input"
            placeholder="Enter a new to-do item..."
            maxlength="250"
            autocomplete="off"
          >
          <button class="btn btn-primary" id="addTodoBtn">Add</button>
        </div>

        <div class="loading-state" id="todoLoading">
          <div class="spinner"></div>
          <p>Loading to-dos...</p>
        </div>

        <div class="diag-list" id="todoList"></div>

        <div class="diag-empty" id="todoEmpty" style="display: none;">
          No to-do items defined yet. Add one above.
        </div>
      </div>

    </div>
  </main>

  <div class="toast" id="toast"></div>

  <script src="js/diagnostics.js?v=<?= filemtime(__DIR__ . '/js/diagnostics.js') ?>"></script>
</body>
</html>
