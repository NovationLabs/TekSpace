/*******************************************************
 * 2) References to DOM Elements
 *******************************************************/

const app = document.getElementById('app');

// Sidebar
const projectListEl = document.getElementById('project-list');
const newProjectBtn = document.getElementById('new-project-btn');
const sidebar = document.getElementById('sidebar');

// Content area
const projectTitleEl = document.getElementById('project-title');
const newTaskForm = document.getElementById('new-task-form');
const taskTable = document.getElementById('task-table');
const taskTableBody = document.getElementById('task-table-body');

// Modal
const modalOverlay = document.getElementById('modal-overlay');
const modal = document.getElementById('modal');

// Theme Toggle
const themeToggleBtn = document.getElementById('theme-toggle');

/*******************************************************
 * 3) Local Storage Data Model
 *******************************************************/
function getDashboardData() {
    const dataStr = localStorage.getItem('dashboardData');
    if (dataStr) {
        return JSON.parse(dataStr);
    } else {
        return {
            lastProjectName: null, // track last opened project
            theme: 'light',        // store user’s theme
            projects: {}
        };
    }
}

function saveDashboardData(data) {
    localStorage.setItem('dashboardData', JSON.stringify(data));
}

let dashboardData = getDashboardData();

/*******************************************************
 * 4) Check if we’re already logged in
 *******************************************************/
// Also apply stored theme
if (dashboardData.theme === 'dark') {
    document.body.classList.add('dark-mode');
}
app.style.display = 'block'; // Always show the app
renderProjects();
if (dashboardData.lastProjectName) {
    selectProject(dashboardData.lastProjectName);
}

/*******************************************************
 * 6) Theme Toggle
 *******************************************************/
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    dashboardData.theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    saveDashboardData(dashboardData);
});

/*******************************************************
 * 7) Project Management
 *******************************************************/
function renderProjects() {
    projectListEl.innerHTML = '';
    const projectNames = Object.keys(dashboardData.projects);

    projectNames.forEach((name) => {
        const li = document.createElement('li');
        li.classList.add('project-item');

        // Name
        const spanName = document.createElement('span');
        spanName.classList.add('project-name');
        spanName.textContent = name;
        spanName.addEventListener('click', () => {
            selectProject(name);
        });

        // Dots
        const dots = document.createElement('div');
        dots.classList.add('project-dots');
        dots.innerHTML = `<span class="dots-icon"></span>`;

        // The hidden menu
        const menu = document.createElement('div');
        menu.classList.add('project-menu');

        // "Edit name"
        const btnEditName = document.createElement('button');
        btnEditName.textContent = 'Edit name';
        btnEditName.addEventListener('click', () => {
            openRenameProjectModal(name);
            menu.style.display = 'none';
        });

        // "Duplicate"
        const btnDuplicate = document.createElement('button');
        btnDuplicate.textContent = 'Duplicate';
        btnDuplicate.addEventListener('click', () => {
            duplicateProject(name);
            menu.style.display = 'none';
        });

        // "Delete"
        const btnDelete = document.createElement('button');
        btnDelete.textContent = 'Delete';
        btnDelete.addEventListener('click', () => {
            openDeleteProjectConfirm(name);
            menu.style.display = 'none';
        });

        menu.appendChild(btnEditName);
        menu.appendChild(btnDuplicate);
        menu.appendChild(btnDelete);

        dots.addEventListener('click', (e) => {
            e.stopPropagation();
            // Hide all other menus
            document.querySelectorAll('.project-menu').forEach(m => {
                if (m !== menu) m.style.display = 'none';
            });
            menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
        });

        li.appendChild(spanName);
        li.appendChild(dots);
        li.appendChild(menu);
        projectListEl.appendChild(li);
    });
}

function selectProject(projectName) {
    // Save last project
    dashboardData.lastProjectName = projectName;
    saveDashboardData(dashboardData);

    projectTitleEl.textContent = projectName;
    newTaskForm.style.display = 'flex';
    taskTable.style.display = 'table';

    // Clear old tasks
    taskTableBody.innerHTML = '';

    const project = dashboardData.projects[projectName];
    if (!project) return;

    project.tasks.forEach((task, index) => {
        const row = document.createElement('tr');

        // Task name
        const nameTd = document.createElement('td');
        nameTd.textContent = task.name;
        row.appendChild(nameTd);

        // State
        const stateTd = document.createElement('td');
        const pill = document.createElement('span');
        pill.classList.add('state-pill');
        if (task.state === 'Completed') {
            pill.classList.add('state-completed');
            pill.textContent = 'Completed';
        } else if (task.state === 'In Process') {
            pill.classList.add('state-inprocess');
            pill.textContent = 'In Process';
        } else {
            pill.classList.add('state-notstarted');
            pill.textContent = 'Not started';
        }
        stateTd.appendChild(pill);
        row.appendChild(stateTd);

        // Category
        const catTd = document.createElement('td');
        catTd.textContent = task.category || '';
        row.appendChild(catTd);

        // Progress
        const progTd = document.createElement('td');
        const progressContainer = document.createElement('div');
        progressContainer.classList.add('progress-container');

        const progressText = document.createElement('span');
        progressText.classList.add('progress-text');
        progressText.textContent = (task.percent || 0) + '%';

        const progressCircle = document.createElement('div');
        progressCircle.classList.add('progress-circle');

        // circumference for dash array
        const c = 94;
        const offset = c - (c * (task.percent || 0)) / 100;

        progressCircle.innerHTML = `
          <svg class="progress-svg" width="25" height="25" viewBox="0 0 36 36">
            <circle class="progress-bg" cx="18" cy="18" r="15" fill="none" />
            <circle
              class="progress-fg"
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke-dasharray="${c}"
              stroke-dashoffset="${offset}"
            />
          </svg>
        `;

        progressContainer.appendChild(progressText);
        progressContainer.appendChild(progressCircle);
        progTd.appendChild(progressContainer);
        row.appendChild(progTd);

        // Actions (single Edit button)
        const actionsTd = document.createElement('td');
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => {
            openEditTaskModal(projectName, index);
        });
        actionsTd.appendChild(editBtn);

        row.appendChild(actionsTd);
        taskTableBody.appendChild(row);
    });
}

// Create a new project
newProjectBtn.addEventListener('click', () => {
    modal.innerHTML = `
        <h2>Create New Project</h2>
        <form id="new-project-form">
          <input type="text" id="new-project-name" placeholder="Project Name" required />
          <div style="display:flex;justify-content:flex-end;gap:0.5rem;">
            <button type="button" class="close-btn" id="close-modal-btn">Cancel</button>
            <button type="submit">Create</button>
          </div>
        </form>
      `;
    modalOverlay.style.display = 'flex';

    const newProjectForm = document.getElementById('new-project-form');
    const closeModalBtn = document.getElementById('close-modal-btn');

    closeModalBtn.addEventListener('click', closeModal);

    newProjectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('new-project-name').value.trim();
        if (!name) return;

        if (!dashboardData.projects[name]) {
            dashboardData.projects[name] = { tasks: [] };
            saveDashboardData(dashboardData);
            renderProjects();
        }
        closeModal();
    });
});

// Rename project
function openRenameProjectModal(oldName) {
    modal.innerHTML = `
        <h2>Rename Project</h2>
        <form id="rename-project-form">
          <input type="text" id="rename-project-name" value="${oldName}" required />
          <div style="display:flex;justify-content:flex-end;gap:0.5rem;">
            <button type="button" class="close-btn" id="close-modal-btn">Cancel</button>
            <button type="submit">Save</button>
          </div>
        </form>
      `;
    modalOverlay.style.display = 'flex';

    const renameForm = document.getElementById('rename-project-form');
    const closeModalBtn = document.getElementById('close-modal-btn');

    closeModalBtn.addEventListener('click', closeModal);

    renameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = document.getElementById('rename-project-name').value.trim();
        if (!newName) return;

        if (newName !== oldName) {
            dashboardData.projects[newName] = dashboardData.projects[oldName];
            delete dashboardData.projects[oldName];
            saveDashboardData(dashboardData);
            renderProjects();
            if (projectTitleEl.textContent === oldName) {
                projectTitleEl.textContent = newName;
                dashboardData.lastProjectName = newName;
                saveDashboardData(dashboardData);
            }
        }
        closeModal();
    });
}

// Duplicate project
function duplicateProject(name) {
    let newName = name + ' (copy)';
    let i = 1;
    while (dashboardData.projects[newName]) {
        i++;
        newName = name + ` (copy ${i})`;
    }
    const newTasks = JSON.parse(JSON.stringify(dashboardData.projects[name].tasks));
    dashboardData.projects[newName] = { tasks: newTasks };
    saveDashboardData(dashboardData);
    renderProjects();
}

// Delete project
function openDeleteProjectConfirm(name) {
    modal.innerHTML = `
        <h2>Delete Project</h2>
        <p class="confirm-text">Are you sure you want to delete the project <strong>${name}</strong>?</p>
        <div style="display:flex;justify-content:flex-end;gap:0.5rem;">
          <button type="button" class="close-btn" id="no-btn">No</button>
          <button type="button" style="background:#ff5858;color:#fff;" id="yes-btn">Yes</button>
        </div>
      `;
    modalOverlay.style.display = 'flex';

    const noBtn = document.getElementById('no-btn');
    const yesBtn = document.getElementById('yes-btn');

    noBtn.addEventListener('click', closeModal);
    yesBtn.addEventListener('click', () => {
        delete dashboardData.projects[name];
        saveDashboardData(dashboardData);
        if (projectTitleEl.textContent === name) {
            projectTitleEl.textContent = '';
            newTaskForm.style.display = 'none';
            taskTable.style.display = 'none';
            dashboardData.lastProjectName = null;
            saveDashboardData(dashboardData);
        }
        renderProjects();
        closeModal();
    });
}

function closeModal() {
    modalOverlay.style.display = 'none';
}

/*******************************************************
 * 8) Task Management
 *******************************************************/
newTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const projectName = projectTitleEl.textContent;
    if (!projectName) return;

    const taskName = document.getElementById('task-name').value.trim();
    const taskState = document.getElementById('task-state').value;
    const taskCategory = document.getElementById('task-category').value.trim();
    const taskPercent = parseInt(document.getElementById('task-percent').value || '0');

    const project = dashboardData.projects[projectName];
    if (!project) return;

    project.tasks.push({
        name: taskName,
        state: taskState,
        category: taskCategory,
        percent: taskPercent
    });

    saveDashboardData(dashboardData);
    selectProject(projectName);
    newTaskForm.reset();
});

// Edit Task (Save on left, Delete on right)
function openEditTaskModal(projectName, taskIndex) {
    const task = dashboardData.projects[projectName].tasks[taskIndex];
    modal.innerHTML = `
        <h2>Edit Task</h2>
        <form id="edit-task-form">
          <label>Name</label>
          <input type="text" id="edit-task-name" value="${task.name}" required />
          <label>State</label>
          <select id="edit-task-state">
            <option value="Completed" ${task.state === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="In Process" ${task.state === 'In Process' ? 'selected' : ''}>In Process</option>
            <option value="Not started" ${task.state === 'Not started' ? 'selected' : ''}>Not started</option>
          </select>
          <label>Category</label>
          <input type="text" id="edit-task-category" value="${task.category || ''}" />
          <label>Progress (%)</label>
          <input type="number" id="edit-task-percent" value="${task.percent || 0}" min="0" max="100" />
          <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;">
            <button type="submit" style="background:#4c83ff;color:#fff;">Save</button>
            <button type="button" class="close-btn" id="close-modal-btn">Close</button>
            <button type="button" class="delete-btn" style="background:#ff5858;color:#fff;" id="delete-task-btn">Delete</button>
        </form>
      `;
    modalOverlay.style.display = 'flex';

    const editTaskForm = document.getElementById('edit-task-form');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const deleteTaskBtn = document.getElementById('delete-task-btn');

    closeModalBtn.addEventListener('click', closeModal);

    // Save
    editTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = document.getElementById('edit-task-name').value.trim();
        const newState = document.getElementById('edit-task-state').value;
        const newCategory = document.getElementById('edit-task-category').value.trim();
        const newPercent = parseInt(document.getElementById('edit-task-percent').value || '0');

        dashboardData.projects[projectName].tasks[taskIndex] = {
            name: newName,
            state: newState,
            category: newCategory,
            percent: newPercent
        };

        saveDashboardData(dashboardData);
        selectProject(projectName);
        closeModal();
    });

    // Delete
    deleteTaskBtn.addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete "${task.name}"?`)) {
            dashboardData.projects[projectName].tasks.splice(taskIndex, 1);
            saveDashboardData(dashboardData);
            selectProject(projectName);
            closeModal();
        }
    });
}

/*******************************************************
 * 9) Import/Export Functionality
 *******************************************************/
document.getElementById('export-btn').addEventListener('click', exportData);
document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-input').click();
});

document.getElementById('import-input').addEventListener('change', handleFileImport);

function exportData() {
    const data = localStorage.getItem('dashboardData');
    if (!data) return;

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);

            // Basic validation
            if (!importedData.projects || !importedData.theme) {
                throw new Error('Invalid project file');
            }

            if (confirm('WARNING: This will overwrite all current data. Continue?')) {
                localStorage.setItem('dashboardData', JSON.stringify(importedData));
                location.reload();
            }
        } catch (error) {
            alert('Error importing file: Invalid format');
        }
    };
    reader.readAsText(file);

    // Clear input to allow re-uploading same file
    event.target.value = '';
}
