// Tasks / Planner page
App.UI.Views.Tasks = {
  render(root) {
    const t = (key, fallback) => App.I18n.t(`tasks.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const tasks = App.Data.tasks || App.Data.Tasks || [];

    const getStatusLabel = (status) => {
      if (status === 'open') return t('statusOpen', 'Open');
      if (status === 'in progress') return t('statusInProgress', 'In Progress');
      if (status === 'completed') return t('statusCompleted', 'Completed');
      return status || '-';
    };

    const getPriorityLabel = (priority) => {
      if (priority === 'low') return t('priorityLow', 'Low');
      if (priority === 'medium') return t('priorityMedium', 'Medium');
      if (priority === 'high') return t('priorityHigh', 'High');
      return priority || '-';
    };

    const getCategoryLabel = (category) => {
      if (category === 'General') return t('categoryGeneral', 'General');
      if (category === 'Programming') return t('categoryProgramming', 'Programming');
      if (category === 'Production') return t('categoryProduction', 'Production');
      if (category === 'Warehouse') return t('categoryWarehouse', 'Warehouse');
      return category || '-';
    };

    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.tasks.title','Tasks')}</h3>
          <button class="btn btn-primary" id="btn-add-task">+ ${App.I18n.t('common.add','Add')}</button>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>${t('title','Title')}</th>
              <th>${t('category','Category')}</th>
              <th>${t('status','Status')}</th>
              <th>${t('priority','Priority')}</th>
              <th>${t('assignee','Assignee')}</th>
              <th>${t('due','Due')}</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(task => `
              <tr>
                <td>${esc(task.title || '-')}</td>
                <td>${getCategoryLabel(task.category)}</td>
                <td>${getStatusLabel(task.status)}</td>
                <td>${getPriorityLabel(task.priority)}</td>
                <td>${esc((App.Data.users||App.Data.Users||[]).find(u=>u.id===task.assignedTo)?.name || '-')}</td>
                <td>${task.dueDate ? App.Utils.formatDate(task.dueDate) : '-'}</td>
              </tr>
            `).join('') || `<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted);">${t('noTasks', 'No tasks')}</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
    // Bind add button to open modal for new task
    const addBtn = document.getElementById('btn-add-task');
    if (addBtn) {
      addBtn.onclick = () => this.openTaskModal();
    }

    // Make table rows clickable to edit tasks
    const rows = root.querySelectorAll('tbody tr');
    rows.forEach((row, index) => {
      row.addEventListener('click', () => {
        const task = tasks[index];
        if (task) this.openTaskModal(task);
      });
    });
  }
  ,
  /**
   * Opens a modal dialog to add or edit a task. When a task is supplied, its values are prefilled.
   * @param {Object} task Existing task to edit
   */
  openTaskModal(task) {
    const isEdit = !!task;
    const users = App.Data.users || App.Data.Users || [];
    const userOptions = users.map(u => `<option value="${u.id}">${u.name} (${u.role})</option>`).join('');
    const statuses = ['open','in progress','completed'];
    const priorities = ['low','medium','high'];
    const categories = ['General','Programming','Production','Warehouse'];
    const body = `
      <div>
        <label class="field-label">${App.I18n.t('tasks.title','Title')}*</label>
        <input id="task-title" class="input" value="${task ? (task.title || '') : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('tasks.category','Category')}</label>
        <select id="task-category" class="input">
          ${categories.map(c => `<option value="${c}" ${task && task.category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('tasks.status','Status')}</label>
        <select id="task-status" class="input">
          ${statuses.map(s => `<option value="${s}" ${task && task.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('tasks.priority','Priority')}</label>
        <select id="task-priority" class="input">
          ${priorities.map(p => `<option value="${p}" ${task && task.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
        </select>

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('tasks.assignee','Assignee')}</label>
        <select id="task-assignee" class="input">
          <option value="">-</option>
          ${userOptions}
        </select>

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('tasks.due','Due')}</label>
        <input id="task-due" class="input" type="date" value="${task && task.dueDate ? task.dueDate.split('T')[0] : ''}" />
      </div>
    `;
    const title = isEdit ? App.I18n.t('tasks.edit','Edit Task') : App.I18n.t('tasks.add','Add Task');
    App.UI.Modal.open(title, body, [
      { text: App.I18n.t('common.cancel','Cancel'), variant:'ghost', onClick: () => {} },
      {
        text: App.I18n.t('common.save','Save'), variant:'primary',
        onClick: () => {
          const titleVal = document.getElementById('task-title').value.trim();
          if (!titleVal) {
            App.UI.Toast.show(App.I18n.t('tasks.title','Title') + ' is required');
            return false;
          }
          const newTask = {
            id: isEdit ? task.id : App.Utils.generateId('t'),
            title: titleVal,
            category: document.getElementById('task-category').value,
            status: document.getElementById('task-status').value,
            priority: document.getElementById('task-priority').value,
            assignedTo: document.getElementById('task-assignee').value || null,
            dueDate: document.getElementById('task-due').value ? new Date(document.getElementById('task-due').value).toISOString() : null
          };
          const list = App.Data.tasks || App.Data.Tasks || [];
          if (isEdit) {
            const idx = list.findIndex(x => x.id === newTask.id);
            if (idx >= 0) list[idx] = newTask;
          } else {
            list.push(newTask);
          }
          // Save changes
          if (App.Data.tasks) App.Data.tasks = list;
          if (App.Data.Tasks) App.Data.Tasks = list;
          App.DB.save();
          App.UI.Toast.show(App.I18n.t('tasks.saved','Task saved'));
          App.Core.Router.navigate('tasks');
        }
      }
    ]);
    // Preselect assigned user
    if (task && task.assignedTo) {
      const sel = document.getElementById('task-assignee');
      if (sel) sel.value = task.assignedTo;
    }
  }
};