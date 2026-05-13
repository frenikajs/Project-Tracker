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

async function loadProjects(searchTerm = '') {
  showLoading();
  try {
    const url = '/api/projects.php' + (searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '');
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
      <td class="td-name">
        ${escapeHtml(p.projectName)}
        ${p.isIncomplete ? '<span class="incomplete-badge" title="Some details are missing">!</span>' : ''}
      </td>
      <td>${escapeHtml(p.status ?? '—')}</td>
      <td>${formatDate(p.dateCreated)}</td>
      <td>${formatDate(p.lastUpdated)}</td>
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
}

function populateSummaryDetails(detail) {
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
  document.getElementById('summaryMockUps').innerHTML     = formatLink(detail?.mockUps);
  document.getElementById('summaryListing').innerHTML     = formatAsLink(detail?.listing);
  document.getElementById('summaryPinterest').textContent  = detail?.pinterest ? 'Yes' : 'No';
  document.getElementById('summaryExpansion').textContent  = detail?.expansion  ? 'Yes' : 'No';
  document.getElementById('summaryBlog').textContent       = detail?.blog       ? 'Yes' : 'No';
  document.getElementById('summaryEmail').textContent      = detail?.email      ? 'Yes' : 'No';
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

document.addEventListener('DOMContentLoaded', () => {
  loadProjects();

  document.getElementById('searchBtn').addEventListener('click', () => {
    loadProjects(document.getElementById('searchInput').value.trim());
  });

  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('searchBtn').click();
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
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
