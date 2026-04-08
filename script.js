const form = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const stats = document.getElementById('stats');
const search = document.getElementById('search');
const statusFilter = document.getElementById('status-filter');
const categoryFilter = document.getElementById('category-filter');
const clearCompletedBtn = document.getElementById('clear-completed');

const STORAGE_KEY = 'tarefas-lar-v1';
let tasks = loadTasks();

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const task = {
    id: crypto.randomUUID(),
    title: value('title'),
    description: value('description'),
    assignee: value('assignee') || 'Não definido',
    category: value('category'),
    priority: value('priority'),
    dueDate: value('dueDate') || null,
    done: false,
    createdAt: new Date().toISOString(),
  };

  tasks.unshift(task);
  persist();
  form.reset();
  document.getElementById('priority').value = 'media';
  render();
});

search.addEventListener('input', render);
statusFilter.addEventListener('change', render);
categoryFilter.addEventListener('change', render);
clearCompletedBtn.addEventListener('click', () => {
  const before = tasks.length;
  tasks = tasks.filter((task) => !task.done);

  if (tasks.length !== before) {
    persist();
    render();
  }
});

function value(id) {
  return document.getElementById(id).value.trim();
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function filteredTasks() {
  const text = search.value.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesText =
      !text ||
      [task.title, task.assignee, task.category, task.description]
        .join(' ')
        .toLowerCase()
        .includes(text);

    const matchesStatus =
      statusFilter.value === 'all' ||
      (statusFilter.value === 'done' ? task.done : !task.done);

    const matchesCategory =
      categoryFilter.value === 'all' || task.category === categoryFilter.value;

    return matchesText && matchesStatus && matchesCategory;
  });
}

function formatDate(isoDate) {
  if (!isoDate) return 'Sem prazo';

  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function updateStats(currentTasks) {
  const total = tasks.length;
  const done = tasks.filter((task) => task.done).length;
  const pending = total - done;
  const overdue = tasks.filter(
    (task) =>
      !task.done && task.dueDate && new Date(task.dueDate) < new Date().setHours(0, 0, 0, 0)
  ).length;

  stats.innerHTML = `
    <span>Total: <strong>${total}</strong></span>
    <span>Pendentes: <strong>${pending}</strong></span>
    <span>Concluídas: <strong>${done}</strong></span>
    <span>Atrasadas: <strong>${overdue}</strong></span>
    <span>Exibindo: <strong>${currentTasks.length}</strong></span>
  `;
}

function toggleDone(id) {
  tasks = tasks.map((task) =>
    task.id === id
      ? {
          ...task,
          done: !task.done,
        }
      : task
  );
  persist();
  render();
}

function removeTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  persist();
  render();
}

function editTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  const newTitle = prompt('Novo título:', task.title);
  if (newTitle === null || !newTitle.trim()) return;

  const newDescription = prompt('Nova descrição:', task.description || '');
  if (newDescription === null) return;

  tasks = tasks.map((item) =>
    item.id === id
      ? {
          ...item,
          title: newTitle.trim(),
          description: newDescription.trim(),
        }
      : item
  );

  persist();
  render();
}

function taskTemplate(task) {
  const overdue = !task.done && task.dueDate && new Date(task.dueDate) < new Date().setHours(0, 0, 0, 0);

  return `
    <li class="task ${task.priority} ${task.done ? 'done' : ''}">
      <div class="task-top">
        <h3>${task.title}</h3>
        <small>${task.done ? '✅ Concluída' : overdue ? '⚠️ Atrasada' : '⏳ Em andamento'}</small>
      </div>

      <p class="description">${task.description || 'Sem descrição'}</p>

      <div class="meta">
        <span>👤 ${task.assignee}</span>
        <span>🏷️ ${task.category}</span>
        <span>🔥 ${task.priority}</span>
        <span>📅 ${formatDate(task.dueDate)}</span>
      </div>

      <div class="actions">
        <button type="button" onclick="toggleDone('${task.id}')">${task.done ? 'Reabrir' : 'Concluir'}</button>
        <button type="button" class="secondary" onclick="editTask('${task.id}')">Editar</button>
        <button type="button" onclick="removeTask('${task.id}')">Excluir</button>
      </div>
    </li>
  `;
}

function render() {
  const currentTasks = filteredTasks();
  updateStats(currentTasks);

  if (!currentTasks.length) {
    taskList.innerHTML = '<li class="empty">Nenhuma tarefa encontrada com os filtros atuais.</li>';
    return;
  }

  taskList.innerHTML = currentTasks.map(taskTemplate).join('');
}

window.toggleDone = toggleDone;
window.removeTask = removeTask;
window.editTask = editTask;

render();
