/* =====================================================
   TO-DO WEB APP — script.js
   Features : Add · Edit · Delete · Complete · LocalStorage
   ===================================================== */
 
 
/* ──────────────────────────────────────
   1. DATA LAYER — LocalStorage helpers
   ────────────────────────────────────── */
 
const STORAGE_KEY = 'todo_tasks';
 
/**
 * Load tasks array from LocalStorage.
 * Returns an empty array if nothing is stored yet.
 */
function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}
 
/**
 * Save the given tasks array to LocalStorage.
 * @param {Array} tasks
 */
function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
 
 
/* ──────────────────────────────────────
   2. STATE
   ────────────────────────────────────── */
 
let tasks = loadTasks();   // in-memory working copy
let editingId = null;      // ID of the task currently being edited
 
 
/* ──────────────────────────────────────
   3. DOM REFERENCES
   ────────────────────────────────────── */
 
const taskInput    = document.getElementById('taskInput');
const taskDateTime = document.getElementById('taskDateTime');
const taskList     = document.getElementById('taskList');
const emptyState   = document.getElementById('emptyState');
const modalOverlay = document.getElementById('modalOverlay');
const editTaskInput  = document.getElementById('editTaskInput');
const editDateInput  = document.getElementById('editDateTime');
 
 
/* ──────────────────────────────────────
   4. ADD TASK
   ────────────────────────────────────── */
 
/**
 * Called when the user clicks "Add Task".
 * Validates input, creates a task object, saves and re-renders.
 */
function addTask() {
  const name     = taskInput.value.trim();
  const datetime = taskDateTime.value;
 
  /* Basic validation: task name is required */
  if (!name) {
    shakeBorder(taskInput);
    taskInput.focus();
    return;
  }
 
  /* Build task object */
  const task = {
    id:        Date.now(),          // unique numeric ID
    name:      name,
    datetime:  datetime || '',
    completed: false,
    createdAt: new Date().toISOString()
  };
 
  /* Persist and refresh UI */
  tasks.unshift(task);              // add to front so newest appears first
  saveTasks(tasks);
  renderTasks();
 
  /* Clear inputs */
  taskInput.value    = '';
  taskDateTime.value = '';
  taskInput.focus();
}
 
/* Allow pressing Enter in the task field to add */
taskInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') addTask();
});
 
 
/* ──────────────────────────────────────
   5. DELETE TASK
   ────────────────────────────────────── */
 
/**
 * Remove a task by ID.
 * @param {number} id
 */
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks(tasks);
  renderTasks();
}
 
 
/* ──────────────────────────────────────
   6. TOGGLE COMPLETE
   ────────────────────────────────────── */
 
/**
 * Flip the completed flag for a task.
 * @param {number} id
 */
function toggleComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks(tasks);
  renderTasks();
}
 
 
/* ──────────────────────────────────────
   7. EDIT TASK — open modal
   ────────────────────────────────────── */
 
/**
 * Open the edit modal pre-filled with task data.
 * @param {number} id
 */
function openEdit(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
 
  editingId           = id;
  editTaskInput.value = task.name;
  editDateInput.value = task.datetime;
 
  modalOverlay.classList.add('open');
  editTaskInput.focus();
}
 
/**
 * Save changes from the modal back to the tasks array.
 */
function saveEdit() {
  if (!editingId) return;
 
  const name = editTaskInput.value.trim();
  if (!name) {
    shakeBorder(editTaskInput);
    return;
  }
 
  const task = tasks.find(t => t.id === editingId);
  if (task) {
    task.name     = name;
    task.datetime = editDateInput.value;
    saveTasks(tasks);
    renderTasks();
  }
 
  closeModal();
}
 
/**
 * Close the edit modal.
 * Clicking the dark overlay also closes it (handled by onclick="closeModal(event)").
 */
function closeModal(event) {
  /* If click was on the overlay itself (not on the modal box), close */
  if (event && event.target !== modalOverlay) return;
  modalOverlay.classList.remove('open');
  editingId = null;
}
 
/* Allow Escape key to close modal */
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal();
});
 
 
/* ──────────────────────────────────────
   8. RENDER
   ────────────────────────────────────── */
 
/**
 * Re-render the entire task list from the tasks array.
 * Also updates the stats counters and shows/hides empty state.
 */
function renderTasks() {
 
  /* Update stats */
  const total   = tasks.length;
  const done    = tasks.filter(t => t.completed).length;
  const pending = total - done;
 
  document.getElementById('totalCount').textContent   = total;
  document.getElementById('doneCount').textContent    = done;
  document.getElementById('pendingCount').textContent = pending;
 
  /* Show / hide empty state */
  if (total === 0) {
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
  }
 
  /* Clear current list */
  taskList.innerHTML = '';
 
  /* Build one <li> per task */
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' done' : '');
    li.dataset.id = task.id;
 
    /* Format the stored datetime for display */
    const dateDisplay = task.datetime
      ? formatDateTime(task.datetime)
      : 'No date set';
 
    /* Status badge */
    const badgeClass = task.completed ? 'badge-done' : 'badge-pending';
    const badgeLabel = task.completed ? '✓ Done'    : '● Pending';
 
    /* Complete-button icon changes based on state */
    const completeIcon  = task.completed ? '↩' : '✓';
    const completeTip   = task.completed ? 'Mark incomplete' : 'Mark complete';
 
    li.innerHTML = `
      <!-- Task text & meta -->
      <div class="task-body">
        <div class="task-name">${escapeHTML(task.name)}</div>
        <div class="task-meta">
          <span>${dateDisplay}</span>
          <span class="dot">◉</span>
          <span class="task-badge ${badgeClass}">${badgeLabel}</span>
        </div>
      </div>
 
      <!-- Action buttons -->
      <div class="task-actions">
        <button
          class="action-btn btn-complete"
          title="${completeTip}"
          onclick="toggleComplete(${task.id})"
        >${completeIcon}</button>
 
        <button
          class="action-btn btn-edit"
          title="Edit task"
          onclick="openEdit(${task.id})"
        >✎</button>
 
        <button
          class="action-btn btn-delete"
          title="Delete task"
          onclick="deleteTask(${task.id})"
        >✕</button>
      </div>
    `;
 
    taskList.appendChild(li);
  });
}
 
 
/* ──────────────────────────────────────
   9. UTILITY FUNCTIONS
   ────────────────────────────────────── */
 
/**
 * Format an ISO datetime string (e.g. "2025-06-15T14:30") into
 * a readable label like "Jun 15, 2025 · 2:30 PM".
 * @param {string} dtStr
 * @returns {string}
 */
function formatDateTime(dtStr) {
  if (!dtStr) return '';
  const dt = new Date(dtStr);
  if (isNaN(dt)) return dtStr;   // fallback: return as-is
 
  const datePart = dt.toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric'
  });
  const timePart = dt.toLocaleTimeString('en-US', {
    hour:   'numeric',
    minute: '2-digit',
    hour12: true
  });
  return `${datePart} · ${timePart}`;
}
 
/**
 * Prevent XSS by escaping special HTML characters in task names.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
 
/**
 * Briefly shake an input's border to signal a validation error.
 * @param {HTMLElement} el
 */
function shakeBorder(el) {
  el.style.borderColor = 'var(--red)';
  el.style.boxShadow   = '0 0 0 3px rgba(252,129,129,0.15)';
  setTimeout(() => {
    el.style.borderColor = '';
    el.style.boxShadow   = '';
  }, 1200);
}
 
 
/* ──────────────────────────────────────
   10. INITIAL RENDER on page load
   ────────────────────────────────────── */
 
renderTasks();