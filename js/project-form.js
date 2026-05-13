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

async function init() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');

  if (id) {
    projectId  = id;
    isEditMode = true;
    document.getElementById('pageTitle').textContent = 'Edit Project';
    document.getElementById('submitBtn').textContent = 'Save Changes';
    document.getElementById('projectInfoSection').style.display = 'block';
    await loadProject(id);
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
  document.getElementById('infoCreated').textContent = formatDate(project.dateCreated);
  document.getElementById('infoUpdated').textContent = formatDate(project.lastUpdated);
  document.getElementById('pageTitle').textContent   = `Edit: ${project.projectName}`;
}

function populateDetails(detail) {
  document.getElementById('blurb').value       = detail.blurb      ?? '';
  document.getElementById('accessCode').value  = detail.accessCode ?? '';
  document.getElementById('canva').value       = detail.canva      ?? '';
  document.getElementById('dropbox').value     = detail.dropbox   ?? '';
  document.getElementById('mockUps').value     = detail.mockUps   ?? '';
  document.getElementById('pinterest').checked  = !!detail.pinterest;
  document.getElementById('listing').value      = detail.listing   ?? '';
  document.getElementById('expansion').checked  = !!detail.expansion;
  document.getElementById('blog').checked       = !!detail.blog;
  document.getElementById('email').checked      = !!detail.email;
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
        canva:      document.getElementById('canva').value.trim()      || null,
        dropbox:   document.getElementById('dropbox').value.trim()  || null,
        mockUps:   document.getElementById('mockUps').value.trim()  || null,
        pinterest: document.getElementById('pinterest').checked,
        expansion: document.getElementById('expansion').checked,
        blog:      document.getElementById('blog').checked,
        email:     document.getElementById('email').checked,
        listing:   document.getElementById('listing').value.trim()  || null,
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
});
