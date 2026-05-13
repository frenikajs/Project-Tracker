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
      <h1 class="app-title">Project Tracker</h1>
      <div class="header-actions">
        <button class="btn btn-primary" onclick="window.location.href='project-form.php'">+ New Project</button>
        <button class="btn btn-ghost" id="logoutBtn">Sign Out</button>
      </div>
    </div>
  </header>

  <main class="main-content">

    <section class="search-section">
      <div class="search-container">
        <input
          type="text"
          id="searchInput"
          class="search-input"
          placeholder="Search by project name..."
          autocomplete="off"
        >
        <button class="btn btn-primary" id="searchBtn">Search</button>
        <button class="btn btn-secondary" id="clearBtn">Clear</button>
      </div>
    </section>

    <section class="results-section">
      <div class="results-header">
        <h2 class="results-title">Projects</h2>
        <span class="results-count" id="resultsCount"></span>
      </div>

      <div class="table-container">
        <div class="loading-state" id="loadingState">
          <div class="spinner"></div>
          <p>Loading projects...</p>
        </div>

        <div class="empty-state" id="emptyState" style="display: none;">
          <div class="empty-icon">📋</div>
          <p class="empty-message">No projects found</p>
          <p class="empty-sub">Try a different search or <a href="project-form.php">create a new project</a></p>
        </div>

        <table class="projects-table" id="projectsTable" style="display: none;">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Status</th>
              <th>Date Created</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody id="projectsTableBody"></tbody>
        </table>
      </div>
    </section>

  </main>

  <!-- Project Modal (Action + Summary views) -->
  <div class="modal-overlay" id="projectModal" style="display: none;">
    <div class="modal">
      <div class="modal-header">
        <button class="back-btn" id="modalBackBtn" style="display: none;">← Back</button>
        <h2 class="modal-title" id="modalTitle"></h2>
        <button class="modal-close" id="closeModal" aria-label="Close">✕</button>
      </div>

      <!-- Action View -->
      <div id="actionView">
        <div class="modal-body">
          <p class="action-subtitle">What would you like to do with this project?</p>
          <div class="action-cards">
            <button class="action-card" id="viewSummaryBtn">
              <span class="action-icon">📋</span>
              <span class="action-label">View Summary</span>
            </button>
            <button class="action-card action-card-primary" id="editBtn">
              <span class="action-icon">✏️</span>
              <span class="action-label">Edit Project</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Summary View -->
      <div id="summaryView" style="display: none;">
        <div class="modal-body modal-body-scroll">

          <div class="summary-section-title">Project</div>
          <div class="summary-fields">
            <div class="summary-row">
              <span class="summary-label">Name</span>
              <span class="summary-value" id="summaryName"></span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Status</span>
              <span class="summary-value" id="summaryStatus"></span>
            </div>
            <div class="summary-row" id="summaryBlurbRow" style="display: none;">
              <span class="summary-label">Blurb</span>
              <span class="summary-value summary-blurb" id="summaryBlurb"></span>
            </div>
            <div class="summary-row summary-row-last" id="summaryAccessCodeRow" style="display: none;">
              <span class="summary-label">Access Code</span>
              <span class="summary-value" id="summaryAccessCode"></span>
            </div>
          </div>

          <div class="summary-section-title">Details</div>
          <div class="summary-fields" id="summaryDetailsArea">
            <div class="summary-loading" id="summaryDetailsLoading">
              <div class="spinner spinner-sm"></div> Loading details...
            </div>
            <div id="summaryDetailsContent" style="display: none;">
              <div class="summary-row">
                <span class="summary-label">Canva</span>
                <span class="summary-value" id="summaryCanva"></span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Dropbox</span>
                <span class="summary-value" id="summaryDropbox"></span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Mock-Ups</span>
                <span class="summary-value" id="summaryMockUps"></span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Listing</span>
                <span class="summary-value" id="summaryListing"></span>
              </div>
              <div class="summary-bool-grid">
                <div class="summary-bool-item">
                  <span class="summary-label">Pinterest</span>
                  <span class="summary-value" id="summaryPinterest"></span>
                </div>
                <div class="summary-bool-item">
                  <span class="summary-label">Expansion Pack</span>
                  <span class="summary-value" id="summaryExpansion"></span>
                </div>
                <div class="summary-bool-item">
                  <span class="summary-label">Blog</span>
                  <span class="summary-value" id="summaryBlog"></span>
                </div>
                <div class="summary-bool-item">
                  <span class="summary-label">Email</span>
                  <span class="summary-value" id="summaryEmail"></span>
                </div>
              </div>
            </div>
          </div>

          <div class="summary-section-title">Dates</div>
          <div class="summary-fields">
            <div class="summary-row">
              <span class="summary-label">Created</span>
              <span class="summary-value" id="summaryCreated"></span>
            </div>
            <div class="summary-row summary-row-last">
              <span class="summary-label">Last Updated</span>
              <span class="summary-value" id="summaryUpdated"></span>
            </div>
          </div>

        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="copyBtn">Copy Details</button>
          <button class="btn btn-primary" id="editFromSummaryBtn">Edit Project</button>
        </div>
      </div>

    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script src="js/main.js"></script>
</body>
</html>
