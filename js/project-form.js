let isEditMode = false;
let projectId  = null;

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

function applyProductType(type) {
  const labels = PRODUCT_LABELS[type] || PRODUCT_LABELS['Online Sequence'];
  document.getElementById('accessCodeLabel').textContent   = labels.accessCode;
  document.getElementById('sequenceLinkLabel').textContent = labels.sequenceLink;
}

function getProductType() {
  const checked = document.querySelector('input[name="productType"]:checked');
  return checked ? checked.value : 'Online Sequence';
}

async function loadThemes(selectValue = '') {
  try {
    const res    = await fetch('/api/themes.php');
    const themes = res.ok ? await res.json() : [];
    const sel    = document.getElementById('theme');
    sel.innerHTML = '<option value="">— None —</option>';
    themes.forEach(name => {
      const el       = document.createElement('option');
      el.value       = name;
      el.textContent = name;
      if (name === selectValue) el.selected = true;
      sel.appendChild(el);
    });
  } catch (err) {
    console.error('Failed to load themes', err);
  }
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');

  await loadThemes();

  if (id) {
    projectId  = id;
    isEditMode = true;
    document.getElementById('pageTitle').textContent = 'Edit Project';
    document.getElementById('submitBtn').textContent = 'Save Changes';
    document.getElementById('projectInfoSection').style.display = 'block';
    await loadProject(id);
    await loadReleaseHistory(id);
    await loadProjectTodos(id);
  } else {
    document.getElementById('pageTitle').textContent = 'Create New Project';
    document.getElementById('submitBtn').textContent = 'Create Project';
  }
}

async function loadProject(id) {
  try {
    const [projectRes, detailRes] = await Promise.all([
      fetch(`/api/projects.php?id=${id}`),
      fetch(`/api/details.php?id=${id}`),
    ]);

    if (projectRes.status === 404) {
      showToast('Project not found. Redirecting...', 'error');
      setTimeout(() => window.location.href = '/', 2000);
      return;
    }
    if (!projectRes.ok) throw new Error('Failed to load project');

    const project = await projectRes.json();
    populateForm(project);

    if (detailRes.ok) {
      const detail = await detailRes.json();
      if (detail) populateDetails(detail);
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to load project. Please try again.', 'error');
  }
}

function populateForm(project) {
  document.getElementById('projectName').value = project.projectName;
  document.getElementById('status').value      = project.status ?? 'Draft';
  document.getElementById('releaseDate').value = project.releaseDate ?? '';
  document.getElementById('infoCreated').textContent = formatDate(project.dateCreated);
  document.getElementById('infoUpdated').textContent = formatDate(project.lastUpdated);
  document.getElementById('pageTitle').textContent   = `Edit: ${project.projectName}`;
}

function populateDetails(detail) {
  document.getElementById('blurb').value       = detail.blurb      ?? '';
  document.getElementById('accessCode').value  = detail.accessCode ?? '';
  document.getElementById('canva').value       = detail.canva      ?? '';
  document.getElementById('dropbox').value     = detail.dropbox   ?? '';
  document.getElementById('mockUps').value     = (detail.mockUps ?? '').replaceAll(':', '/');
  document.getElementById('pinterest').checked  = !!detail.pinterest;
  document.getElementById('listing').value       = detail.listing       ?? '';
  document.getElementById('sequenceLink').value  = detail.sequenceLink  ?? '';
  document.getElementById('expansion').checked  = !!detail.expansion;
  document.getElementById('blog').checked       = !!detail.blog;
  document.getElementById('email').checked      = !!detail.email;
  document.getElementById('socialMedia').checked = !!detail.socialMedia;

  const type  = detail.productType || 'Online Sequence';
  const radio = document.querySelector(`input[name="productType"][value="${type}"]`);
  if (radio) radio.checked = true;
  applyProductType(type);

  if (detail.theme) {
    const sel = document.getElementById('theme');
    for (const opt of sel.options) {
      if (opt.value === detail.theme) { opt.selected = true; break; }
    }
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function loadReleaseHistory(id) {
  const box = document.getElementById('releaseHistory');
  box.style.display = 'none';
  box.innerHTML = '';

  try {
    const res = await fetch(`/api/release-history.php?projectId=${id}`);
    if (!res.ok) return;
    const history = await res.json();
    if (!Array.isArray(history) || history.length === 0) return;

    const title = document.createElement('div');
    title.className = 'release-history-title';
    title.textContent = 'Release date history';
    box.appendChild(title);

    history.forEach(h => {
      const row = document.createElement('div');
      row.className = 'release-history-row';
      const from = h.oldDate ? formatDateOnly(h.oldDate) : 'Not set';
      const to   = h.newDate ? formatDateOnly(h.newDate) : 'Cleared';
      row.innerHTML =
        `<span class="release-history-change">${escapeHtml(from)} → ${escapeHtml(to)}</span>` +
        `<span class="release-history-when">${escapeHtml(formatDate(h.changedAt))}</span>`;
      box.appendChild(row);
    });

    box.style.display = 'block';
  } catch (err) {
    console.error('Failed to load release history', err);
  }
}

async function loadProjectTodos(id) {
  const panel   = document.getElementById('todosPanel');
  const loading = document.getElementById('todosLoading');
  const content = document.getElementById('todosContent');

  panel.style.display   = 'flex';
  loading.style.display = 'flex';
  content.style.display = 'none';

  try {
    const res = await fetch(`/api/project-todos.php?projectId=${id}`);
    if (!res.ok) throw new Error('Failed to fetch');
    const todos = await res.json();

    if (todos.length === 0) {
      panel.style.display = 'none';
      return;
    }

    renderProjectTodos(todos);
    loading.style.display = 'none';
    content.style.display = 'block';
  } catch (err) {
    console.error(err);
    panel.style.display = 'none';
  }
}

function renderProjectTodos(todos) {
  const pending   = todos.filter(t => !t.completed);
  const completed = todos.filter(t => t.completed);

  const pendingList    = document.getElementById('pendingList');
  const completedList  = document.getElementById('completedList');
  const pendingEmpty   = document.getElementById('pendingEmpty');
  const completedSec   = document.getElementById('completedSection');

  pendingList.innerHTML   = '';
  completedList.innerHTML = '';

  if (pending.length === 0) {
    pendingEmpty.style.display = 'block';
  } else {
    pendingEmpty.style.display = 'none';
    pending.forEach(t => pendingList.appendChild(buildTodoItem(t)));
  }

  if (completed.length > 0) {
    completedSec.style.display = 'block';
    completed.forEach(t => completedList.appendChild(buildTodoItem(t)));
  } else {
    completedSec.style.display = 'none';
  }
}

function buildTodoItem(todo) {
  const label = document.createElement('label');
  label.className = 'todo-item' + (todo.completed ? ' todo-completed' : '');

  const cb = document.createElement('input');
  cb.type    = 'checkbox';
  cb.checked = todo.completed;
  cb.className = 'checkbox-input';
  cb.addEventListener('change', () => toggleTodo(todo.todoID, cb.checked));

  const span = document.createElement('span');
  span.className = 'todo-item-text';
  span.textContent = todo.todoText;

  label.appendChild(cb);
  label.appendChild(span);
  return label;
}

async function toggleTodo(todoID, completed) {
  try {
    const res = await fetch(`/api/project-todos.php?projectId=${projectId}&todoId=${todoID}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ completed }),
    });
    if (!res.ok) throw new Error('Failed to update');
    await loadProjectTodos(projectId);
  } catch (err) {
    console.error(err);
    showToast('Failed to update to-do.', 'error');
    await loadProjectTodos(projectId);
  }
}

async function handleSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('projectName');
  const name      = nameInput.value.trim();

  if (!name) {
    setFieldError(nameInput, 'Project name is required.');
    return;
  }
  clearFieldError(nameInput);

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled    = true;
  submitBtn.textContent = isEditMode ? 'Saving...' : 'Creating...';

  try {
    // 1. Save the project
    const projectRes = await fetch(
      isEditMode ? `/api/projects.php?id=${projectId}` : '/api/projects.php',
      {
        method:  isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          projectName: name,
          status:      document.getElementById('status').value,
          releaseDate: document.getElementById('releaseDate').value || null,
        }),
      }
    );

    if (!projectRes.ok) {
      const data = await projectRes.json().catch(() => ({}));
      throw new Error(data.detail || data.error || `HTTP ${projectRes.status} — Failed to save project`);
    }

    const project        = await projectRes.json();
    const savedProjectId = project.projectID;

    // 2. Save the details (upsert — works for both create and edit)
    const detailRes = await fetch(`/api/details.php?id=${savedProjectId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        blurb:      document.getElementById('blurb').value.trim()      || null,
        accessCode: document.getElementById('accessCode').value.trim() || null,
        theme:      document.getElementById('theme').value             || null,
        canva:      document.getElementById('canva').value.trim()      || null,
        dropbox:    document.getElementById('dropbox').value.trim()    || null,
        mockUps:    document.getElementById('mockUps').value.trim()    || null,
        pinterest:  document.getElementById('pinterest').checked,
        expansion:  document.getElementById('expansion').checked,
        blog:       document.getElementById('blog').checked,
        email:      document.getElementById('email').checked,
        socialMedia: document.getElementById('socialMedia').checked,
        productType: getProductType(),
        listing:       document.getElementById('listing').value.trim()       || null,
        sequenceLink:  document.getElementById('sequenceLink').value.trim()  || null,
      }),
    });

    if (!detailRes.ok) {
      const data = await detailRes.json().catch(() => ({}));
      throw new Error(data.detail || data.error || `HTTP ${detailRes.status} — Failed to save project details`);
    }

    showToast(isEditMode ? 'Project saved!' : 'Project created!', 'success');
    setTimeout(() => window.location.href = '/', 1500);
  } catch (err) {
    console.error(err);
    showToast(err.message || 'An error occurred. Please try again.', 'error');
    submitBtn.disabled    = false;
    submitBtn.textContent = isEditMode ? 'Save Changes' : 'Create Project';
  }
}

function setFieldError(input, message) {
  input.classList.add('input-error');
  let errEl = input.parentElement.querySelector('.field-error');
  if (!errEl) {
    errEl           = document.createElement('span');
    errEl.className = 'field-error';
    input.parentElement.appendChild(errEl);
  }
  errEl.textContent = message;
  input.focus();
}

function clearFieldError(input) {
  input.classList.remove('input-error');
  const errEl = input.parentElement.querySelector('.field-error');
  if (errEl) errEl.remove();
}

function showToast(message, type = 'info') {
  const toast       = document.getElementById('toast');
  toast.textContent = message;
  toast.className   = `toast toast-${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3500);
}

document.addEventListener('DOMContentLoaded', () => {
  init();

  document.getElementById('projectForm').addEventListener('submit', handleSubmit);

  document.getElementById('cancelBtn').addEventListener('click', () => {
    window.location.href = '/';
  });

  document.getElementById('headerBackBtn').addEventListener('click', () => {
    window.location.href = '/';
  });

  document.getElementById('projectName').addEventListener('input', function () {
    clearFieldError(this);
  });

  // ── Online Sequence / Online Puzzle toggle ───────────────────────────────────
  document.querySelectorAll('input[name="productType"]').forEach(radio => {
    radio.addEventListener('change', () => applyProductType(getProductType()));
  });

  // ── Theme add-new flow ───────────────────────────────────────────────────────
  document.getElementById('addThemeBtn').addEventListener('click', () => {
    document.getElementById('newThemeArea').style.display = 'block';
    document.getElementById('newThemeInput').focus();
  });

  document.getElementById('cancelThemeBtn').addEventListener('click', () => {
    document.getElementById('newThemeArea').style.display = 'none';
    document.getElementById('newThemeInput').value = '';
  });

  document.getElementById('saveThemeBtn').addEventListener('click', () => {
    const name = document.getElementById('newThemeInput').value.trim();
    if (!name) return;

    const sel = document.getElementById('theme');
    if (![...sel.options].some(o => o.value === name)) {
      const el       = document.createElement('option');
      el.value       = name;
      el.textContent = name;
      sel.appendChild(el);
    }
    sel.value = name;

    document.getElementById('newThemeArea').style.display = 'none';
    document.getElementById('newThemeInput').value = '';
  });

  document.getElementById('newThemeInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('saveThemeBtn').click();
    if (e.key === 'Escape') document.getElementById('cancelThemeBtn').click();
  });

  // ── Mock-ups browse ──────────────────────────────────────────────────────────
  document.getElementById('mockUpsBrowseBtn').addEventListener('click', async () => {
    if (window.showDirectoryPicker) {
      try {
        const dirHandle = await window.showDirectoryPicker();
        // macOS swaps "/" and ":" in file names — reverse it to match Finder display
        document.getElementById('mockUps').value = dirHandle.name.replaceAll(':', '/');
        return;
      } catch (err) {
        if (err.name !== 'AbortError') console.warn('showDirectoryPicker failed, falling back', err);
        else return;
      }
    }
    document.getElementById('mockUpsFilePicker').click();
  });

  document.getElementById('mockUpsFilePicker').addEventListener('change', function () {
    if (this.files && this.files[0]) {
      const folderName = this.files[0].webkitRelativePath.split('/')[0];
      document.getElementById('mockUps').value = folderName.replaceAll(':', '/');
    }
    this.value = '';
  });
});
