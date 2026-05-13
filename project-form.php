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
          <label for="accessCode" class="form-label">Access Code</label>
          <input
            type="text"
            id="accessCode"
            class="form-input"
            placeholder="Access code"
            maxlength="10"
            autocomplete="off"
          >
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
            <input
              type="text"
              id="mockUps"
              class="form-input"
              placeholder="Mock-ups link or notes"
              maxlength="250"
              autocomplete="off"
            >
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
  </main>

  <div class="toast" id="toast"></div>

  <script src="js/project-form.js"></script>
</body>
</html>
