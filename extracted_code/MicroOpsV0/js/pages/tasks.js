// Tasks / Planner page
App.UI.Views.Tasks = {
  render(root) {
    const tasks = App.Data.tasks || App.Data.Tasks || [];
    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.tasks.title','Tasks')}</h3>
          <button class="btn btn-primary" id="btn-add-task">+ ${App.I18n.t('common.add','Add')}</button>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>${App.I18n.t('tasks.title','Title')}</th>
              <th>${App.I18n.t('tasks.category','Category')}</th>
              <th>${App.I18n.t('tasks.status','Status')}</th>
              <th>${App.I18n.t('tasks.priority','Priority')}</th>
              <th>${App.I18n.t('tasks.assignee','Assignee')}</th>
              <th>${App.I18n.t('tasks.due','Due')}</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => `
              <tr>
                <td>${t.title || '-'}</td>
                <td>${t.category || '-'}</td>
                <td>${t.status || '-'}</td>
                <td>${t.priority || '-'}</td>
                <td>${(App.Data.users||App.Data.Users||[]).find(u=>u.id===t.assignedTo)?.name || '-'}</td>
                <td>${t.dueDate ? App.Utils.formatDate(t.dueDate) : '-'}</td>
              </tr>
            `).join('') || `<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted);">No tasks</td></tr>`}
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