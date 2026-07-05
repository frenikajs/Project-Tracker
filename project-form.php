<?php
require_once __DIR__ . '/config/auth_check.php';
requireAuthRedirect();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Tracker</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>

  <header class="app-header">
    <div class="header-content">
      <div class="header-left">
        <button class="btn-back" id="headerBackBtn">← Back</button>
        <h1 class="app-title" id="pageTitle">Project Form</h1>
      </div>
    </div>
  </header>

  <main class="main-content">
    <div class="form-layout" id="formLayout">
    <div class="form-container">
      <form id="projectForm" novalidate>

        <!-- ── Core Fields ── -->
        <div class="form-group">
          <label for="projectName" class="form-label">
            Project Name <span class="required">*</span>
          </label>
          <input
            type="text"
            id="projectName"
            class="form-input"
            placeholder="Enter project name"
            maxlength="100"
            autocomplete="off"
          >
        </div>

        <div class="form-group">
          <label for="status" class="form-label">Status</label>
          <select id="status" class="form-input form-select">
            <option value="Draft">Draft</option>
            <option value="Idea">Idea</option>
            <option value="In Progress">In Progress</option>
            <option value="Live">Live</option>
          </select>
        </div>

        <div class="form-group">
          <label for="releaseDate" class="form-label">Release Date</label>
          <input
            type="date"
            id="releaseDate"
            class="form-input"
            autocomplete="off"
          >
          <div id="releaseHistory" class="release-history" style="display: none;"></div>
        </div>

        <div class="form-group">
          <label class="form-label">Type</label>
          <div class="segmented" id="productTypeToggle">
            <label class="segmented-option">
              <input type="radio" name="productType" value="Online Sequence" checked>
              <span>Online Sequence</span>
            </label>
            <label class="segmented-option">
              <input type="radio" name="productType" value="Online Puzzle">
              <span>Online Puzzle</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label for="blurb" class="form-label">Blurb</label>
          <textarea
            id="blurb"
            class="form-input form-textarea"
            placeholder="Enter a short blurb for this project"
            maxlength="1000"
            rows="4"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="accessCode" class="form-label" id="accessCodeLabel">Access Code</label>
          <input
            type="text"
            id="accessCode"
            class="form-input"
            placeholder="Access code"
            maxlength="20"
            autocomplete="off"
          >
        </div>

        <div class="form-group">
          <label for="theme" class="form-label">Theme</label>
          <div class="input-with-btn">
            <select id="theme" class="form-input form-select">
              <option value="">— None —</option>
            </select>
            <button type="button" class="btn btn-secondary btn-browse" id="addThemeBtn">+ New</button>
          </div>
          <div id="newThemeArea" class="new-option-area" style="display:none;">
            <input
              type="text"
              id="newThemeInput"
              class="form-input"
              placeholder="New theme name"
              maxlength="250"
              autocomplete="off"
            >
            <div class="new-option-actions">
              <button type="button" class="btn btn-primary" id="saveThemeBtn">Save</button>
              <button type="button" class="btn btn-secondary" id="cancelThemeBtn">Cancel</button>
            </div>
          </div>
        </div>

        <!-- ── Project Details ── -->
        <div class="form-section">
          <h3 class="form-section-title">Project Links &amp; Details</h3>

          <div class="form-group">
            <label for="canva" class="form-label">Canva</label>
            <input
              type="text"
              id="canva"
              class="form-input"
              placeholder="Canva link or notes"
              maxlength="250"
              autocomplete="off"
            >
          </div>

          <div class="form-group">
            <label for="dropbox" class="form-label">Dropbox</label>
            <input
              type="text"
              id="dropbox"
              class="form-input"
              placeholder="Dropbox link or notes"
              maxlength="250"
              autocomplete="off"
            >
          </div>

          <div class="form-group">
            <label for="mockUps" class="form-label">Mock-Ups</label>
            <div class="input-with-btn">
              <input
                type="text"
                id="mockUps"
                class="form-input"
                placeholder="Mock-ups link or path"
                maxlength="500"
                autocomplete="off"
              >
              <button type="button" class="btn btn-secondary btn-browse" id="mockUpsBrowseBtn">Browse…</button>
              <input type="file" id="mockUpsFilePicker" webkitdirectory style="display:none">
            </div>
          </div>

          <div class="form-group">
            <label for="listing" class="form-label">Listing</label>
            <input
              type="text"
              id="listing"
              class="form-input"
              placeholder="Listing link or notes"
              maxlength="250"
              autocomplete="off"
            >
          </div>

          <div class="form-group">
            <label for="sequenceLink" class="form-label" id="sequenceLinkLabel">Sequence Link</label>
            <input
              type="text"
              id="sequenceLink"
              class="form-input"
              placeholder="Sequence link or notes"
              maxlength="250"
              autocomplete="off"
            >
          </div>

          <div class="checkbox-grid">
            <label class="checkbox-label">
              <input type="checkbox" id="pinterest" class="checkbox-input">
              <span class="checkbox-text">Pinterest</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="expansion" class="checkbox-input">
              <span class="checkbox-text">Expansion Pack</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="blog" class="checkbox-input">
              <span class="checkbox-text">Blog</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="email" class="checkbox-input">
              <span class="checkbox-text">Email</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="socialMedia" class="checkbox-input">
              <span class="checkbox-text">Social Media</span>
            </label>
          </div>
        </div>

        <!-- ── Read-only info (edit mode only) ── -->
        <div id="projectInfoSection" style="display: none;">
          <div class="project-info-section">
            <h3 class="info-title">Project Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Date Created</span>
                <span class="info-value" id="infoCreated">—</span>
              </div>
              <div class="info-item">
                <span class="info-label">Last Updated</span>
                <span class="info-value" id="infoUpdated">—</span>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
          <button type="submit" class="btn btn-primary" id="submitBtn">Submit</button>
        </div>

      </form>
    </div>

    <div class="todos-panel" id="todosPanel" style="display: none;">
      <div class="todos-panel-inner">
        <h3 class="todos-panel-title">To Dos</h3>

        <div id="todosLoading" class="loading-state" style="padding: 32px 0;">
          <div class="spinner"></div>
          <p>Loading to-dos...</p>
        </div>

        <div id="todosContent" style="display: none;">
          <div id="pendingSection">
            <h4 class="todos-group-title">Pending</h4>
            <div id="pendingList" class="todos-list"></div>
            <p class="todos-empty" id="pendingEmpty" style="display: none;">All done!</p>
          </div>

          <div id="completedSection" style="display: none;">
            <h4 class="todos-group-title todos-group-completed">Completed</h4>
            <div id="completedList" class="todos-list"></div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </main>

  <div class="toast" id="toast"></div>

  <script src="js/project-form.js?v=<?= filemtime(__DIR__ . '/js/project-form.js') ?>"></script>
</body>
</html>
