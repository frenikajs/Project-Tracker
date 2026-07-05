let currentProject = null;
let currentDetails = null;

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'America/Chicago',
  }).format(date);
}

// Format a bare YYYY-MM-DD date without timezone conversion (avoids off-by-one)
function formatDateOnly(dateStr) {
  if (!dateStr) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!m) return dateStr;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(date);
}

const PRODUCT_LABELS = {
  'Online Sequence': { accessCode: 'Access Code', sequenceLink: 'Sequence Link' },
  'Online Puzzle':   { accessCode: 'Puzzle Code', sequenceLink: 'Puzzle URL' },
};

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Render a value as a clickable link if it looks like a URL, otherwise plain text
function formatLink(value) {
  if (!value) return '—';
  if (/^https?:\/\//i.test(value)) {
    return `<a href="${escapeHtml(value)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value)}</a>`;
  }
  return escapeHtml(value);
}

// Always render a value as a hyperlink (prepends https:// if no protocol given)
function formatAsLink(value) {
  if (!value) return '—';
  const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value)}</a>`;
}

function showLoading() {
  document.getElementById('loadingState').style.display = 'flex';
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('projectsTable').style.display = 'none';
  document.getElementById('resultsCount').textContent = '';
}

function showEmpty() {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('emptyState').style.display = 'flex';
  document.getElementById('projectsTable').style.display = 'none';
}

function showTable() {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('projectsTable').style.display = 'table';
}

async function loadThemeFilter() {
  try {
    const res    = await fetch('/api/themes.php');
    const themes = res.ok ? await res.json() : [];
    const sel    = document.getElementById('themeFilter');
    sel.innerHTML = '<option value="">All Themes</option>';
    themes.forEach(name => {
      const el       = document.createElement('option');
      el.value       = name;
      el.textContent = name;
      sel.appendChild(el);
    });
  } catch (err) {
    console.error('Failed to load theme filter', err);
  }
}

async function loadProjects(searchTerm = '', optionFilter = '') {
  showLoading();
  try {
    const params = new URLSearchParams();
    if (searchTerm)   params.set('search', searchTerm);
    if (optionFilter) params.set('option', optionFilter);
    const qs  = params.toString();
    const url = '/api/projects.php' + (qs ? `?${qs}` : '');
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch');
    const projects = await res.json();
    renderProjects(projects);
  } catch (err) {
    console.error(err);
    showToast('Failed to load projects. Please try again.', 'error');
    showEmpty();
  }
}

function renderProjects(projects) {
  const tbody   = document.getElementById('projectsTableBody');
  const countEl = document.getElementById('resultsCount');

  countEl.textContent = `${projects.length} result${projects.length !== 1 ? 's' : ''}`;

  if (projects.length === 0) {
    showEmpty();
    return;
  }

  tbody.innerHTML = '';
  projects.forEach(p => {
    const tr = document.createElement('tr');
    tr.className = 'project-row';
    tr.innerHTML = `
      <td class="td-name" data-label="Project">
        ${escapeHtml(p.projectName)}
        ${p.isIncomplete ? '<span class="incomplete-badge" title="Some details are missing">!</span>' : ''}
      </td>
      <td data-label="Status">${escapeHtml(p.status ?? '—')}</td>
      <td data-label="Theme">${escapeHtml(p.theme ?? '—')}</td>
      <td data-label="Release Date">${formatDateOnly(p.releaseDate)}</td>
      <td data-label="Created">${formatDate(p.dateCreated)}</td>
      <td data-label="Updated">${formatDate(p.lastUpdated)}</td>
    `;
    tr.addEventListener('click', () => openModal(p));
    tbody.appendChild(tr);
  });

  showTable();
}

function openModal(project) {
  currentProject = project;
  currentDetails = null;
  document.getElementById('projectModal').style.display = 'flex';
  showSummaryView();
}

function showActionView() {
  document.getElementById('actionView').style.display = 'block';
  document.getElementById('summaryView').style.display = 'none';
  document.getElementById('modalBackBtn').style.display = 'none';
  document.getElementById('modalTitle').textContent = currentProject?.projectName ?? '';
}

async function showSummaryView() {
  if (!currentProject) return;

  document.getElementById('actionView').style.display = 'none';
  document.getElementById('summaryView').style.display = 'block';
  document.getElementById('modalBackBtn').style.display = 'inline-flex';
  document.getElementById('modalTitle').textContent = 'Project Summary';

  // Populate project fields immediately
  document.getElementById('summaryName').textContent    = currentProject.projectName;
  document.getElementById('summaryStatus').textContent  = currentProject.status ?? '—';
  document.getElementById('summaryCreated').textContent = formatDate(currentProject.dateCreated);
  document.getElementById('summaryUpdated').textContent = formatDate(currentProject.lastUpdated);
  document.getElementById('summaryReleaseDate').textContent = formatDateOnly(currentProject.releaseDate);

  document.getElementById('summaryTheme').textContent = currentProject.theme ?? '—';

  // Hide blurb and access code rows until details load
  document.getElementById('summaryBlurbRow').style.display = 'none';
  document.getElementById('summaryBlurb').textContent = '';
  document.getElementById('summaryAccessCodeRow').style.display = 'none';
  document.getElementById('summaryAccessCode').textContent = '';

  // Show loading spinner while fetching details
  document.getElementById('summaryDetailsLoading').style.display = 'flex';
  document.getElementById('summaryDetailsContent').style.display = 'none';

  try {
    const res = await fetch(`/api/details.php?id=${currentProject.projectID}`);
    currentDetails = res.ok ? await res.json() : null;
  } catch {
    currentDetails = null;
  }

  populateSummaryDetails(currentDetails);
  document.getElementById('summaryDetailsLoading').style.display = 'none';
  document.getElementById('summaryDetailsContent').style.display = 'block';

  loadSummaryTodos(currentProject.projectID);
  loadSummaryReleaseHistory(currentProject.projectID);
}

function populateSummaryDetails(detail) {
  // Product type drives the Type row and the Access Code / Sequence Link labels
  const type   = detail?.productType || 'Online Sequence';
  const labels = PRODUCT_LABELS[type] || PRODUCT_LABELS['Online Sequence'];
  document.getElementById('summaryType').textContent = type;
  document.getElementById('summaryAccessCodeLabel').textContent   = labels.accessCode;
  document.getElementById('summarySequenceLinkLabel').textContent = labels.sequenceLink;

  // Blurb — show row only when there is content
  const blurb    = detail?.blurb ?? '';
  const blurbRow = document.getElementById('summaryBlurbRow');
  document.getElementById('summaryBlurb').textContent = blurb;
  blurbRow.style.display = blurb ? '' : 'none';

  // Access Code — show row only when there is content
  const accessCode    = detail?.accessCode ?? '';
  const accessCodeRow = document.getElementById('summaryAccessCodeRow');
  document.getElementById('summaryAccessCode').textContent = accessCode;
  accessCodeRow.style.display = accessCode ? '' : 'none';

  document.getElementById('summaryCanva').innerHTML       = formatAsLink(detail?.canva);
  document.getElementById('summaryDropbox').innerHTML     = formatAsLink(detail?.dropbox);
  document.getElementById('summaryMockUps').innerHTML     = formatLink(detail?.mockUps?.replaceAll(':', '/'));
  document.getElementById('summaryListing').innerHTML      = formatAsLink(detail?.listing);
  document.getElementById('summarySequenceLink').innerHTML = formatAsLink(detail?.sequenceLink);
  document.getElementById('summaryPinterest').textContent  = detail?.pinterest ? 'Yes' : 'No';
  document.getElementById('summaryExpansion').textContent  = detail?.expansion  ? 'Yes' : 'No';
  document.getElementById('summaryBlog').textContent       = detail?.blog       ? 'Yes' : 'No';
  document.getElementById('summaryEmail').textContent      = detail?.email      ? 'Yes' : 'No';
  document.getElementById('summarySocialMedia').textContent = detail?.socialMedia ? 'Yes' : 'No';
}

async function loadSummaryTodos(projectID) {
  const titleEl   = document.getElementById('summaryTodosTitle');
  const areaEl    = document.getElementById('summaryTodosArea');
  const loadingEl = document.getElementById('summaryTodosLoading');
  const contentEl = document.getElementById('summaryTodosContent');

  titleEl.style.display   = 'none';
  areaEl.style.display    = 'none';
  loadingEl.style.display = 'flex';
  contentEl.style.display = 'none';
  contentEl.innerHTML     = '';

  try {
    const res = await fetch(`/api/project-todos.php?projectId=${projectID}`);
    if (!res.ok) throw new Error('Failed to fetch');
    const todos = await res.json();
    const unchecked = todos.filter(t => !t.completed);

    if (unchecked.length === 0) return;

    titleEl.style.display = 'block';
    areaEl.style.display  = 'block';

    unchecked.forEach(todo => {
      const item = document.createElement('div');
      item.className = 'summary-todo-item';
      item.innerHTML = `<span class="summary-todo-bullet">&#x2022;</span><span>${escapeHtml(todo.todoText)}</span>`;
      contentEl.appendChild(item);
    });

    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';
  } catch {
    titleEl.style.display  = 'none';
    areaEl.style.display   = 'none';
  }
}

async function loadSummaryReleaseHistory(projectID) {
  const titleEl = document.getElementById('summaryReleaseHistoryTitle');
  const areaEl  = document.getElementById('summaryReleaseHistoryArea');

  titleEl.style.display = 'none';
  areaEl.style.display  = 'none';
  areaEl.innerHTML      = '';

  try {
    const res = await fetch(`/api/release-history.php?projectId=${projectID}`);
    if (!res.ok) return;
    const history = await res.json();
    if (!Array.isArray(history) || history.length === 0) return;

    history.forEach((h, i) => {
      const row = document.createElement('div');
      row.className = 'summary-row' + (i === history.length - 1 ? ' summary-row-last' : '');
      const from = h.oldDate ? formatDateOnly(h.oldDate) : 'Not set';
      const to   = h.newDate ? formatDateOnly(h.newDate) : 'Cleared';
      row.innerHTML =
        `<span class="summary-label">${escapeHtml(formatDateOnly(h.changedAt))}</span>` +
        `<span class="summary-value">${escapeHtml(from)} &rarr; ${escapeHtml(to)}</span>`;
      areaEl.appendChild(row);
    });

    titleEl.style.display = 'block';
    areaEl.style.display  = 'block';
  } catch {
    titleEl.style.display = 'none';
    areaEl.style.display  = 'none';
  }
}

function closeModal() {
  document.getElementById('projectModal').style.display = 'none';
  currentProject = null;
  currentDetails = null;
}

async function copyDetails() {
  if (!currentProject) return;

  const text = currentDetails?.blurb ?? '';

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  const btn = document.getElementById('copyBtn');
  const orig = btn.textContent;
  btn.textContent = '✓ Copied!';
  btn.classList.add('btn-success');
  setTimeout(() => {
    btn.textContent = orig;
    btn.classList.remove('btn-success');
  }, 2000);
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function navigateToEdit() {
  if (currentProject) window.location.href = `project-form.php?id=${currentProject.projectID}`;
}

function getFilters() {
  return {
    search: document.getElementById('searchInput').value.trim(),
    option: document.getElementById('themeFilter').value,
  };
}

document.addEventListener('DOMContentLoaded', () => {
  loadThemeFilter();
  loadProjects();

  document.getElementById('searchInput').addEventListener('input', () => {
    const { search, option } = getFilters();
    loadProjects(search, option);
  });

  document.getElementById('themeFilter').addEventListener('change', () => {
    const { search, option } = getFilters();
    loadProjects(search, option);
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('themeFilter').value = '';
    loadProjects();
  });

  document.getElementById('viewSummaryBtn').addEventListener('click', showSummaryView);
  document.getElementById('modalBackBtn').addEventListener('click', showActionView);
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('editBtn').addEventListener('click', navigateToEdit);
  document.getElementById('editFromSummaryBtn').addEventListener('click', navigateToEdit);
  document.getElementById('copyBtn').addEventListener('click', copyDetails);

  document.getElementById('projectModal').addEventListener('click', e => {
    if (e.target === document.getElementById('projectModal')) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth.php?action=logout', { method: 'POST' });
    window.location.href = '/login.html';
  });
});
