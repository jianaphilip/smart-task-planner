// Smart Task Planner - Advanced Features
class TaskPlanner {
  constructor() {
    this.currentView = 'dashboard';
    this.currentTask = null;
    this.isDarkMode = true;
    this.isFocusMode = false;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadDashboard();
    this.updateStats();
    this.loadRecentPlans();
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });

    // Goal form
    document.getElementById('goal-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.createPlan();
    });

    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
      this.toggleTheme();
    });

    // Focus mode
    document.getElementById('focus-mode').addEventListener('click', () => {
      this.toggleFocusMode();
    });

    // Quick actions
    document.getElementById('add-recurring').addEventListener('click', () => {
      this.showRecurringTaskModal();
    });

    document.getElementById('add-manual').addEventListener('click', () => {
      this.showManualTaskModal();
    });

    // Modal controls
    document.getElementById('modal-close').addEventListener('click', () => {
      this.hideModal();
    });

    document.getElementById('task-modal-close').addEventListener('click', () => {
      this.hideTaskModal();
    });

    document.getElementById('cancel-edit').addEventListener('click', () => {
      this.hideTaskModal();
    });

    // Task edit form
    document.getElementById('task-edit-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveTaskEdit();
    });

    // Refresh buttons
    document.getElementById('refresh-today').addEventListener('click', () => {
      this.loadTodayTasks();
    });

    // Click outside modal to close
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.hideModal();
      }
    });

    document.getElementById('task-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.hideTaskModal();
      }
    });
  }

  switchView(view) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');

    // Update views
    document.querySelectorAll('.view').forEach(v => {
      v.classList.remove('active');
    });
    document.getElementById(`${view}-view`).classList.add('active');

    this.currentView = view;

    // Load view-specific data
    switch (view) {
      case 'today':
        this.loadTodayTasks();
        break;
      case 'upcoming':
        this.loadUpcomingTasks();
        break;
      case 'overdue':
        this.loadOverdueTasks();
        break;
      case 'priority':
        this.loadPriorityTasks();
        break;
      case 'dashboard':
        this.loadDashboard();
        break;
    }
  }

  async createPlan() {
    const goal = document.getElementById('goal').value;
    const startDate = document.getElementById('start').value;

    if (!goal.trim()) return;

    try {
      this.showLoading('Generating plan...');
      
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, startDate })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate plan');
      }

      this.hideLoading();
      this.showSuccess(`Plan generated successfully! ${data.tasks.length} tasks created.`);
      
      // Clear form
      document.getElementById('goal').value = '';
      document.getElementById('start').value = '';
      
      // Refresh dashboard
      this.loadRecentPlans();
      this.updateStats();
      
      // Show the generated plan
      this.showGeneratedPlan(data);
      
    } catch (error) {
      this.hideLoading();
      this.showError(error.message);
    }
  }

  showGeneratedPlan(planData) {
    const { tasks, timeline, goal } = planData;
    
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = `Generated Plan: ${goal}`;
    
    const timelineHtml = `
      <div class="timeline-summary">
        <h4><i class="fas fa-calendar"></i> Timeline</h4>
        <p><strong>${timeline.startDate}</strong> → <strong>${timeline.endDate}</strong> (${timeline.totalDays} days)</p>
      </div>
    `;
    
    const tasksHtml = tasks.map(task => `
      <div class="task-item ${task.priority}-priority">
        <div class="task-header">
          <div class="task-title">${task.title}</div>
          <div class="task-priority ${task.priority}">${task.priority}</div>
        </div>
        <div class="task-meta">
          <span><i class="fas fa-calendar"></i> ${task.startDate} → ${task.endDate}</span>
          <span><i class="fas fa-clock"></i> ${task.durationDays} day${task.durationDays > 1 ? 's' : ''}</span>
          ${task.dependsOnIds.length > 0 ? `<span><i class="fas fa-link"></i> ${task.dependsOnIds.length} dependencies</span>` : ''}
        </div>
        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
      </div>
    `).join('');
    
    modalBody.innerHTML = timelineHtml + `<div class="task-list">${tasksHtml}</div>`;
    
    this.showModal();
  }

  async loadTodayTasks() {
    try {
      const response = await fetch('/api/tasks/today');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load today\'s tasks');
      }

      this.renderTasks(data.tasks, 'today-tasks');
      this.renderRecurringTasks(data.recurring, 'today-recurring');
      
    } catch (error) {
      this.showError(error.message);
    }
  }

  async loadUpcomingTasks() {
    try {
      const response = await fetch('/api/tasks/upcoming');
      const tasks = await response.json();
      
      if (!response.ok) {
        throw new Error(tasks.error || 'Failed to load upcoming tasks');
      }

      this.renderTasks(tasks, 'upcoming-tasks');
      
    } catch (error) {
      this.showError(error.message);
    }
  }

  async loadOverdueTasks() {
    try {
      const response = await fetch('/api/tasks/overdue');
      const tasks = await response.json();
      
      if (!response.ok) {
        throw new Error(tasks.error || 'Failed to load overdue tasks');
      }

      this.renderTasks(tasks, 'overdue-tasks', true);
      
    } catch (error) {
      this.showError(error.message);
    }
  }

  async loadPriorityTasks() {
    try {
      const response = await fetch('/api/tasks/priority');
      const tasks = await response.json();
      
      if (!response.ok) {
        throw new Error(tasks.error || 'Failed to load priority tasks');
      }

      this.renderTasks(tasks, 'priority-tasks');
      
    } catch (error) {
      this.showError(error.message);
    }
  }

  renderTasks(tasks, containerId, isOverdue = false) {
    const container = document.getElementById(containerId);
    
    if (!tasks || tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>No tasks found</p>
        </div>
      `;
      return;
    }

    const tasksHtml = tasks.map(task => {
      const isOverdueTask = isOverdue || (task.endDate && new Date(task.endDate) < new Date());
      const isCompleted = task.status === 'completed';
      
      return `
        <div class="task-item ${isOverdueTask ? 'overdue' : ''} ${task.priority}-priority ${isCompleted ? 'completed' : ''}" 
             data-task-id="${task.id}">
          <div class="task-header">
            <div class="task-title">${task.title}</div>
            <div class="task-priority ${task.priority}">${task.priority}</div>
          </div>
          <div class="task-meta">
            <span><i class="fas fa-calendar"></i> ${task.startDate || 'No start date'}</span>
            ${task.endDate ? `<span><i class="fas fa-flag"></i> ${task.endDate}</span>` : ''}
            <span><i class="fas fa-clock"></i> ${task.durationDays} day${task.durationDays > 1 ? 's' : ''}</span>
            ${task.dependsOnIds.length > 0 ? `<span><i class="fas fa-link"></i> ${task.dependsOnIds.length} dependencies</span>` : ''}
          </div>
          ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
          <div class="task-actions">
            <div class="task-checkbox ${isCompleted ? 'checked' : ''}" 
                 onclick="taskPlanner.toggleTaskCompletion('${task.id}')">
              ${isCompleted ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <button class="btn-icon" onclick="taskPlanner.editTask('${task.id}')" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon" onclick="taskPlanner.deleteTask('${task.id}')" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = tasksHtml;
  }

  renderRecurringTasks(tasks, containerId) {
    const container = document.getElementById(containerId);
    
    if (!tasks || tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-repeat"></i>
          <p>No recurring tasks for today</p>
        </div>
      `;
      return;
    }

    const tasksHtml = tasks.map(task => `
      <div class="task-item recurring" data-task-id="${task.id}">
        <div class="task-header">
          <div class="task-title">
            <i class="fas fa-repeat"></i> ${task.title}
          </div>
          <div class="task-priority medium">Recurring</div>
        </div>
        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
        <div class="task-actions">
          <div class="task-checkbox" onclick="taskPlanner.completeRecurringTask('${task.id}')">
            <i class="fas fa-check"></i>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = tasksHtml;
  }

  async toggleTaskCompletion(taskId) {
    try {
      const task = await this.getTask(taskId);
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      // Refresh current view
      this.refreshCurrentView();
      this.updateStats();
      
    } catch (error) {
      this.showError(error.message);
    }
  }

  async completeRecurringTask(taskId) {
    try {
      const response = await fetch(`/api/task-instances/${taskId}/complete`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to complete recurring task');
      }

      this.loadTodayTasks();
      this.updateStats();
      
    } catch (error) {
      this.showError(error.message);
    }
  }

  async editTask(taskId) {
    try {
      const task = await this.getTask(taskId);
      this.currentTask = task;
      
      // Populate form
      document.getElementById('edit-title').value = task.title;
      document.getElementById('edit-description').value = task.description || '';
      document.getElementById('edit-priority').value = task.priority;
      document.getElementById('edit-status').value = task.status;
      document.getElementById('edit-start-date').value = task.startDate || '';
      document.getElementById('edit-end-date').value = task.endDate || '';
      
      this.showTaskModal();
      
    } catch (error) {
      this.showError(error.message);
    }
  }

  async saveTaskEdit() {
    if (!this.currentTask) return;

    try {
      const formData = {
        title: document.getElementById('edit-title').value,
        description: document.getElementById('edit-description').value,
        priority: document.getElementById('edit-priority').value,
        status: document.getElementById('edit-status').value,
        startDate: document.getElementById('edit-start-date').value,
        endDate: document.getElementById('edit-end-date').value
      };

      const response = await fetch(`/api/tasks/${this.currentTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      this.hideTaskModal();
      this.refreshCurrentView();
      this.updateStats();
      
    } catch (error) {
      this.showError(error.message);
    }
  }

  async deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      this.refreshCurrentView();
      this.updateStats();
      
    } catch (error) {
      this.showError(error.message);
    }
  }

  async getTask(taskId) {
    const response = await fetch(`/api/tasks/${taskId}`);
    const task = await response.json();
    
    if (!response.ok) {
      throw new Error(task.error || 'Failed to get task');
    }
    
    return task;
  }

  async updateStats() {
    try {
      const [todayResponse, overdueResponse] = await Promise.all([
        fetch('/api/tasks/today'),
        fetch('/api/tasks/overdue')
      ]);

      const todayData = await todayResponse.json();
      const overdueData = await overdueResponse.json();

      const todayTasks = todayData.tasks || [];
      const overdueTasks = overdueData || [];
      const completedToday = todayTasks.filter(t => t.status === 'completed').length;
      const highPriority = todayTasks.filter(t => t.priority === 'high').length;

      document.getElementById('today-total').textContent = todayTasks.length;
      document.getElementById('today-completed').textContent = completedToday;
      document.getElementById('overdue-count').textContent = overdueTasks.length;
      document.getElementById('priority-count').textContent = highPriority;

      // Update progress bar
      const progress = todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0;
      document.getElementById('progress-fill').style.width = `${progress}%`;

    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  async loadRecentPlans() {
    try {
      const response = await fetch('/api/tasks');
      const tasks = await response.json();
      
      if (!response.ok) {
        throw new Error(tasks.error || 'Failed to load tasks');
      }

      // Group tasks by plan_id
      const plans = {};
      tasks.forEach(task => {
        if (task.plan_id) {
          if (!plans[task.plan_id]) {
            plans[task.plan_id] = {
              id: task.plan_id,
              tasks: [],
              created_at: task.created_at
            };
          }
          plans[task.plan_id].tasks.push(task);
        }
      });

      const recentPlans = Object.values(plans)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      const container = document.getElementById('recent-plans-list');
      
      if (recentPlans.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-bullseye"></i>
            <p>No plans created yet</p>
          </div>
        `;
        return;
      }

      const plansHtml = recentPlans.map(plan => {
        const completedTasks = plan.tasks.filter(t => t.status === 'completed').length;
        const totalTasks = plan.tasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        return `
          <div class="plan-item" onclick="taskPlanner.viewPlan('${plan.id}')">
            <div class="plan-goal">Plan ${plan.id.slice(0, 8)}...</div>
            <div class="plan-meta">
              ${completedTasks}/${totalTasks} tasks completed (${Math.round(progress)}%)
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = plansHtml;

    } catch (error) {
      console.error('Failed to load recent plans:', error);
    }
  }

  refreshCurrentView() {
    switch (this.currentView) {
      case 'today':
        this.loadTodayTasks();
        break;
      case 'upcoming':
        this.loadUpcomingTasks();
        break;
      case 'overdue':
        this.loadOverdueTasks();
        break;
      case 'priority':
        this.loadPriorityTasks();
        break;
      case 'dashboard':
        this.loadDashboard();
        break;
    }
  }

  loadDashboard() {
    this.loadRecentPlans();
    this.updateStats();
  }

  showRecurringTaskModal() {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = 'Add Recurring Task';
    
    modalBody.innerHTML = `
      <form id="recurring-task-form">
        <div class="form-group">
          <label for="recurring-title">Title</label>
          <input type="text" id="recurring-title" required placeholder="e.g., Morning workout">
        </div>
        <div class="form-group">
          <label for="recurring-description">Description</label>
          <textarea id="recurring-description" placeholder="Optional description"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="recurring-frequency">Frequency</label>
            <select id="recurring-frequency" required>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div class="form-group">
            <label for="recurring-priority">Priority</label>
            <select id="recurring-priority">
              <option value="high">High</option>
              <option value="medium" selected>Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="recurring-start-date">Start Date</label>
          <input type="date" id="recurring-start-date" required>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="taskPlanner.hideModal()">Cancel</button>
          <button type="submit" class="btn-primary">Create Recurring Task</button>
        </div>
      </form>
    `;
    
    // Set default start date to today
    document.getElementById('recurring-start-date').value = new Date().toISOString().split('T')[0];
    
    // Handle form submission
    document.getElementById('recurring-task-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.createRecurringTask();
    });
    
    this.showModal();
  }

  async createRecurringTask() {
    try {
      const formData = {
        title: document.getElementById('recurring-title').value,
        description: document.getElementById('recurring-description').value,
        frequency: document.getElementById('recurring-frequency').value,
        priority: document.getElementById('recurring-priority').value,
        start_date: document.getElementById('recurring-start-date').value,
        duration_days: 1
      };

      const response = await fetch('/api/recurring-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create recurring task');
      }

      this.hideModal();
      this.showSuccess('Recurring task created successfully!');
      this.loadTodayTasks();
      
    } catch (error) {
      this.showError(error.message);
    }
  }

  showManualTaskModal() {
    // Similar to recurring task modal but for manual tasks
    this.showRecurringTaskModal(); // For now, reuse the same modal
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    const icon = document.querySelector('#theme-toggle i');
    icon.className = this.isDarkMode ? 'fas fa-moon' : 'fas fa-sun';
    // Theme is already dark by default in CSS
  }

  toggleFocusMode() {
    this.isFocusMode = !this.isFocusMode;
    const icon = document.querySelector('#focus-mode i');
    icon.className = this.isFocusMode ? 'fas fa-eye-slash' : 'fas fa-eye';
    
    if (this.isFocusMode) {
      // Hide all views except current task
      document.querySelectorAll('.view').forEach(view => {
        if (!view.classList.contains('active')) {
          view.style.display = 'none';
        }
      });
    } else {
      // Show all views
      document.querySelectorAll('.view').forEach(view => {
        view.style.display = '';
      });
    }
  }

  showModal() {
    document.getElementById('modal-overlay').classList.add('active');
  }

  hideModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  }

  showTaskModal() {
    document.getElementById('task-modal').classList.add('active');
  }

  hideTaskModal() {
    document.getElementById('task-modal').classList.remove('active');
    this.currentTask = null;
  }

  showLoading(message = 'Loading...') {
    // Create loading overlay if it doesn't exist
    let loading = document.getElementById('loading-overlay');
    if (!loading) {
      loading = document.createElement('div');
      loading.id = 'loading-overlay';
      loading.className = 'modal-overlay active';
      loading.innerHTML = `
        <div class="modal">
          <div class="modal-body">
            <div class="loading">
              <i class="fas fa-spinner"></i>
              <span>${message}</span>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(loading);
    } else {
      loading.querySelector('span').textContent = message;
      loading.classList.add('active');
    }
  }

  hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) {
      loading.classList.remove('active');
    }
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
        <span>${message}</span>
        <button class="btn-icon" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    // Add notification styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem;
      box-shadow: var(--shadow-lg);
      z-index: 1001;
      max-width: 400px;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  viewPlan(planId) {
    // Switch to priority view and highlight tasks from this plan
    this.switchView('priority');
    // Could add plan filtering here
  }
}

// Initialize the application
const taskPlanner = new TaskPlanner();

// Add CSS for notifications
const notificationStyles = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .notification-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .notification.success {
    border-left: 4px solid var(--success);
  }
  
  .notification.error {
    border-left: 4px solid var(--danger);
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-muted);
  }
  
  .empty-state i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
