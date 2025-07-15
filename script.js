// Elements
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const dueDate = document.getElementById('due-date');
const errorMsg = document.getElementById('error-msg');
const todoList = document.getElementById('todo-list');
const toggleThemeBtn = document.getElementById('toggle-theme');
const themeIcon = document.getElementById('theme-icon');
const filterTasks = document.getElementById('filter-tasks');
const sortTasks = document.getElementById('sort-tasks');
const sortDirectionBtn = document.getElementById('sort-direction');

let sortAsc = true;

// Theme (keep)
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}
toggleThemeBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    themeIcon.textContent = isDark ? '🌙' : '☀️';
});

// Todo data model: text, completed, createdAt, dueDate
let todos = JSON.parse(localStorage.getItem('todos') || '[]');
renderTodos();

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const task = input.value.trim();
    const due = dueDate.value ? dueDate.value : null;
    if (task === "") return showError('Please enter a task!');
    if (task.length > 100) return showError('Task is too long!');
    todos.push({
        text: task,
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: due
    });
    input.value = '';
    dueDate.value = '';
    saveAndRender();
});

function showError(msg) {
    errorMsg.textContent = msg;
    setTimeout(() => errorMsg.textContent = '', 1800);
}

function renderTodos() {
    let filtered = [...todos];

    // FILTER
    const filter = filterTasks.value;
    if (filter === 'completed') filtered = filtered.filter(t => t.completed);
    else if (filter === 'active') filtered = filtered.filter(t => !t.completed);
    else if (filter === 'hasDue') filtered = filtered.filter(t => !!t.dueDate);

    // SORT
    const sort = sortTasks.value;
    filtered.sort((a, b) => {
        let cmp = 0;
        if (sort === 'created') {
            cmp = new Date(a.createdAt) - new Date(b.createdAt);
        } else if (sort === 'due') {
            if (!a.dueDate && !b.dueDate) cmp = 0;
            else if (!a.dueDate) cmp = 1;
            else if (!b.dueDate) cmp = -1;
            else cmp = new Date(a.dueDate) - new Date(b.dueDate);
        }
        return sortAsc ? cmp : -cmp;
    });

    todoList.innerHTML = '';
    if (!filtered.length) {
        todoList.innerHTML = `<li class="todo-item" style="justify-content:center;">No tasks found.</li>`;
        return;
    }
    filtered.forEach((todo, idx) => {
        // index in filtered may not be index in todos!
        const realIdx = todos.indexOf(todo);
        const li = document.createElement('li');
        li.className = 'todo-item' + (todo.completed ? ' completed' : '');
        li.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''} data-index="${realIdx}">
            <span class="todo-text" contenteditable="false">${escapeHtml(todo.text)}</span>
            <div class="todo-actions">
                <button title="Edit" data-action="edit" data-index="${realIdx}"><i class="fas fa-pencil-alt"></i></button>
                <button title="Delete" data-action="delete" data-index="${realIdx}"><i class="fas fa-trash-alt"></i></button>
            </div>
            <div class="todo-dates">
                <span title="Created date"><i class="fas fa-info-circle"></i>${formatDate(todo.createdAt)}</span>
                ${todo.dueDate ? `<span title="Due date"><i class="fas fa-hourglass-half"></i>${formatDate(todo.dueDate)}</span>` : ''}
            </div>
        `;
        todoList.appendChild(li);
    });
}

// Handle clicks (edit, delete, complete)
todoList.addEventListener('click', function (e) {
    const idx = e.target.closest('[data-index]')?.dataset.index;
    if (!idx) return;
    if (e.target.type === 'checkbox') {
        todos[idx].completed = !todos[idx].completed;
        saveAndRender();
    } else if (e.target.closest('[data-action="delete"]')) {
        todos.splice(idx, 1);
        saveAndRender();
    } else if (e.target.closest('[data-action="edit"]')) {
        editTodo(idx, e.target.closest('.todo-item'));
    }
});

// Editing (inline)
function editTodo(idx, liElem) {
    const textSpan = liElem.querySelector('.todo-text');
    textSpan.contentEditable = true;
    textSpan.focus();
    document.execCommand('selectAll', false, null);
    document.getSelection().collapseToEnd();

    function saveEdit(e) {
        if (e.type === 'blur' || (e.type === 'keydown' && e.key === 'Enter')) {
            e.preventDefault();
            textSpan.contentEditable = false;
            let newText = textSpan.textContent.trim();
            if (!newText) {
                showError('Task cannot be empty!');
                textSpan.textContent = todos[idx].text;
                return;
            }
            todos[idx].text = newText;
            saveAndRender();
        }
    }
    textSpan.addEventListener('blur', saveEdit, { once: true });
    textSpan.addEventListener('keydown', saveEdit);
}

// Filter/sort UI
filterTasks.addEventListener('change', renderTodos);
sortTasks.addEventListener('change', renderTodos);
sortDirectionBtn.addEventListener('click', () => {
    sortAsc = !sortAsc;
    sortDirectionBtn.innerHTML = sortAsc
        ? `<i class="fas fa-sort-amount-down-alt"></i>`
        : `<i class="fas fa-sort-amount-up-alt"></i>`;
    renderTodos();
});

function saveAndRender() {
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodos();
}

// Formatting helpers
function escapeHtml(text) {
    const map = { '&': "&amp;", '<': "&lt;", '>': "&gt;", '"': "&quot;", "'": "&#039;" };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
