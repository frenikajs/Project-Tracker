let todos = [];
let dragSrcRow = null;

async function loadTodos() {
  document.getElementById('todoLoading').style.display = 'flex';
  document.getElementById('todoEmpty').style.display = 'none';

  try {
    const res = await fetch('/api/todos.php');
    if (!res.ok) throw new Error('Failed to fetch');
    todos = await res.json();
  } catch (err) {
    console.error(err);
    showToast('Failed to load to-dos.', 'error');
    todos = [];
  }

  renderTodos();
}

function renderTodos() {
  const list    = document.getElementById('todoList');
  const loading = document.getElementById('todoLoading');
  const empty   = document.getElementById('todoEmpty');

  loading.style.display = 'none';

  if (todos.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = '';

  todos.forEach(todo => {
    const row = document.createElement('div');
    row.className = 'diag-todo-row';
    row.dataset.id = todo.todoID;
    row.draggable = true;

    row.innerHTML = `
      <span class="diag-drag-handle" title="Drag to reorder">&#x2630;</span>
      <span class="diag-todo-text">${escapeHtml(todo.todoText)}</span>
      <div class="diag-todo-actions">
        <button class="btn btn-secondary btn-sm" data-action="edit">Edit</button>
        <button class="btn btn-danger btn-sm" data-action="delete">Delete</button>
      </div>
    `;

    row.addEventListener('dragstart', onDragStart);
    row.addEventListener('dragover',  onDragOver);
    row.addEventListener('dragenter', onDragEnter);
    row.addEventListener('dragleave', onDragLeave);
    row.addEventListener('drop',      onDrop);
    row.addEventListener('dragend',   onDragEnd);

    list.appendChild(row);
  });
}

function onDragStart(e) {
  dragSrcRow = this;
  this.classList.add('diag-dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.id);
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const target = this.closest('.diag-todo-row');
  if (!target || target === dragSrcRow) return;

  const rect = target.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;

  target.classList.remove('diag-drop-above', 'diag-drop-below');
  if (e.clientY < midY) {
    target.classList.add('diag-drop-above');
  } else {
    target.classList.add('diag-drop-below');
  }
}

function onDragEnter(e) {
  e.preventDefault();
}

function onDragLeave() {
  this.classList.remove('diag-drop-above', 'diag-drop-below');
}

function onDrop(e) {
  e.preventDefault();
  e.stopPropagation();

  const target = this.closest('.diag-todo-row');
  if (!target || target === dragSrcRow) return;

  target.classList.remove('diag-drop-above', 'diag-drop-below');

  const list     = document.getElementById('todoList');
  const rows     = [...list.querySelectorAll('.diag-todo-row')];
  const fromIdx  = rows.indexOf(dragSrcRow);
  const toIdx    = rows.indexOf(target);

  const rect = target.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  const insertBefore = e.clientY < midY;

  if (insertBefore) {
    list.insertBefore(dragSrcRow, target);
  } else {
    list.insertBefore(dragSrcRow, target.nextSibling);
  }

  saveOrder();
}

function onDragEnd() {
  dragSrcRow = null;
  document.querySelectorAll('.diag-todo-row').forEach(row => {
    row.classList.remove('diag-dragging', 'diag-drop-above', 'diag-drop-below');
  });
}

async function saveOrder() {
  const rows  = document.querySelectorAll('#todoList .diag-todo-row');
  const order = [...rows].map(r => parseInt(r.dataset.id, 10));

  try {
    const res = await fetch('/api/todos.php', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ order }),
    });
    if (!res.ok) throw new Error('Failed to save order');
    todos = await res.json();
  } catch (err) {
    console.error(err);
    showToast('Failed to save order.', 'error');
    await loadTodos();
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function addTodo() {
  const input = document.getElementById('newTodoInput');
  const text  = input.value.trim();
  if (!text) return;

  try {
    const res = await fetch('/api/todos.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ todoText: text }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to add');
    }
    input.value = '';
    showToast('To-do added!', 'success');
    await loadTodos();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Failed to add to-do.', 'error');
  }
}

async function deleteTodo(todoID) {
  if (!confirm('Delete this to-do? It will be removed from all projects.')) return;

  try {
    const res = await fetch(`/api/todos.php?id=${todoID}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    showToast('To-do deleted.', 'success');
    await loadTodos();
  } catch (err) {
    console.error(err);
    showToast('Failed to delete to-do.', 'error');
  }
}

function startEdit(todoID) {
  const todo = todos.find(t => t.todoID == todoID);
  if (!todo) return;

  const row = document.querySelector(`.diag-todo-row[data-id="${todoID}"]`);
  if (!row) return;

  row.draggable = false;

  row.innerHTML = `
    <input type="text" class="form-input diag-edit-input" value="${escapeHtml(todo.todoText)}" maxlength="250">
    <div class="diag-todo-actions">
      <button class="btn btn-primary btn-sm" data-action="save">Save</button>
      <button class="btn btn-secondary btn-sm" data-action="cancel">Cancel</button>
    </div>
  `;

  const inp = row.querySelector('.diag-edit-input');
  inp.focus();
  inp.selectionStart = inp.value.length;

  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveEdit(todoID, inp.value.trim());
    if (e.key === 'Escape') renderTodos();
  });
}

async function saveEdit(todoID, text) {
  if (!text) return;

  try {
    const res = await fetch(`/api/todos.php?id=${todoID}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ todoText: text }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to save');
    }
    showToast('To-do updated!', 'success');
    await loadTodos();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Failed to update to-do.', 'error');
  }
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3500);
}

document.addEventListener('DOMContentLoaded', () => {
  loadTodos();

  document.getElementById('addTodoBtn').addEventListener('click', addTodo);

  document.getElementById('newTodoInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTodo();
  });

  document.getElementById('todoList').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const row    = btn.closest('.diag-todo-row');
    const todoID = row?.dataset.id;
    if (!todoID) return;

    const action = btn.dataset.action;
    if (action === 'edit')   startEdit(todoID);
    if (action === 'delete') deleteTodo(todoID);
    if (action === 'save')   saveEdit(todoID, row.querySelector('.diag-edit-input')?.value.trim());
    if (action === 'cancel') renderTodos();
  });

  document.getElementById('headerBackBtn').addEventListener('click', () => {
    window.location.href = '/';
  });
});
