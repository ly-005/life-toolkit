const app = {
    data: {
        todos: [],
        expenses: [],
        habits: [],
        usageStats: {
            todo: 0,
            expense: 0,
            habit: 0,
            stats: 0,
            about: 0
        }
    },
    currentFilter: 'all',
    currentTool: 'todo'
};

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initNavigation();
    initTodoList();
    initExpenseTracker();
    initHabitTracker();
    initThemeToggle();
    initDataExportImport();
    initQuickActions();
    renderAll();
});

function saveData() {
    localStorage.setItem('lifeToolkitData', JSON.stringify(app.data));
}

function loadData() {
    const savedData = localStorage.getItem('lifeToolkitData');
    if (savedData) {
        app.data = JSON.parse(savedData);
    }
    
    const savedTheme = localStorage.getItem('lifeToolkitTheme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        document.getElementById('theme-toggle').textContent = '☀️';
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tool = item.dataset.tool;
            switchTool(tool);
        });
    });
}

function switchTool(tool) {
    app.currentTool = tool;
    app.data.usageStats[tool] = (app.data.usageStats[tool] || 0) + 1;
    saveData();
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tool === tool);
    });
    
    document.querySelectorAll('.tool-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${tool}-section`).classList.add('active');
    
    if (tool === 'stats') {
        renderStats();
    }
}

function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    btn.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        btn.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('lifeToolkitTheme', isDark ? 'dark' : 'light');
    });
}

function initTodoList() {
    const addBtn = document.getElementById('todo-add-btn');
    const input = document.getElementById('todo-input');
    const prioritySelect = document.getElementById('todo-priority');
    
    addBtn.addEventListener('click', addTodo);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            app.currentFilter = btn.dataset.filter;
            renderTodoList();
        });
    });
}

function addTodo() {
    const input = document.getElementById('todo-input');
    const prioritySelect = document.getElementById('todo-priority');
    const text = input.value.trim();
    
    if (!text) {
        showToast('请输入待办事项！');
        return;
    }
    
    const todo = {
        id: Date.now(),
        text,
        priority: prioritySelect.value,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    app.data.todos.push(todo);
    saveData();
    renderTodoList();
    input.value = '';
    showToast('待办事项已添加！');
}

function renderTodoList() {
    const list = document.getElementById('todo-list');
    let filteredTodos = app.data.todos;
    
    if (app.currentFilter === 'active') {
        filteredTodos = app.data.todos.filter(t => !t.completed);
    } else if (app.currentFilter === 'completed') {
        filteredTodos = app.data.todos.filter(t => t.completed);
    }
    
    list.innerHTML = filteredTodos.map(todo => `
        <li class="todo-item ${todo.completed ? 'completed' : ''}">
            <div class="todo-content">
                <input type="checkbox" class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''} 
                    onchange="toggleTodo(${todo.id})">
                <span class="todo-text">${escapeHtml(todo.text)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="priority-badge ${todo.priority}">
                    ${todo.priority === 'high' ? '🔴 高' : todo.priority === 'medium' ? '🟡 中' : '🟢 低'}
                </span>
                <div class="item-actions">
                    <button class="btn-delete" onclick="deleteTodo(${todo.id})">删除</button>
                </div>
            </div>
        </li>
    `).join('');
    
    updateTodoStats();
}

function toggleTodo(id) {
    const todo = app.data.todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveData();
        renderTodoList();
        showToast(todo.completed ? '已完成！' : '已取消完成');
    }
}

function deleteTodo(id) {
    app.data.todos = app.data.todos.filter(t => t.id !== id);
    saveData();
    renderTodoList();
    showToast('待办已删除');
}

function updateTodoStats() {
    const total = app.data.todos.length;
    const completed = app.data.todos.filter(t => t.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('todo-total').textContent = total;
    document.getElementById('todo-completed').textContent = completed;
    document.getElementById('todo-rate').textContent = rate + '%';
}

function initExpenseTracker() {
    const addBtn = document.getElementById('expense-add-btn');
    addBtn.addEventListener('click', addExpense);
    
    document.getElementById('expense-amount').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addExpense();
    });
}

function addExpense() {
    const type = document.getElementById('expense-type').value;
    const desc = document.getElementById('expense-desc').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    
    if (!desc || isNaN(amount) || amount <= 0) {
        showToast('请输入有效的描述和金额！');
        return;
    }
    
    const expense = {
        id: Date.now(),
        type,
        desc,
        amount,
        date: new Date().toISOString()
    };
    
    app.data.expenses.push(expense);
    saveData();
    renderExpenseList();
    document.getElementById('expense-desc').value = '';
    document.getElementById('expense-amount').value = '';
    showToast('记录已添加！');
}

function renderExpenseList() {
    const list = document.getElementById('expense-list');
    const sortedExpenses = [...app.data.expenses].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    list.innerHTML = sortedExpenses.map(expense => `
        <li class="expense-item">
            <div class="expense-info">
                <div class="expense-desc">${escapeHtml(expense.desc)}</div>
                <div class="expense-date">${formatDate(expense.date)}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="expense-amount ${expense.type}">
                    ${expense.type === 'income' ? '+' : '-'}¥${expense.amount.toFixed(2)}
                </span>
                <div class="item-actions">
                    <button class="btn-delete" onclick="deleteExpense(${expense.id})">删除</button>
                </div>
            </div>
        </li>
    `).join('');
    
    updateExpenseSummary();
}

function deleteExpense(id) {
    app.data.expenses = app.data.expenses.filter(e => e.id !== id);
    saveData();
    renderExpenseList();
    showToast('记录已删除');
}

function updateExpenseSummary() {
    const income = app.data.expenses
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);
    const expense = app.data.expenses
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);
    const balance = income - expense;
    
    document.getElementById('total-income').textContent = `¥${income.toFixed(2)}`;
    document.getElementById('total-expense').textContent = `¥${expense.toFixed(2)}`;
    document.getElementById('total-balance').textContent = `¥${balance.toFixed(2)}`;
}

function initHabitTracker() {
    const addBtn = document.getElementById('habit-add-btn');
    const input = document.getElementById('habit-input');
    
    addBtn.addEventListener('click', addHabit);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addHabit();
    });
}

function addHabit() {
    const input = document.getElementById('habit-input');
    const targetInput = document.getElementById('habit-target');
    const name = input.value.trim();
    const targetDays = parseInt(targetInput.value);
    
    if (!name || isNaN(targetDays) || targetDays < 1) {
        showToast('请输入有效的习惯名称和目标天数！');
        return;
    }
    
    const habit = {
        id: Date.now(),
        name,
        targetDays,
        completedDays: [],
        createdAt: new Date().toISOString()
    };
    
    app.data.habits.push(habit);
    saveData();
    renderHabitList();
    input.value = '';
    showToast('习惯已添加！');
}

function renderHabitList() {
    const list = document.getElementById('habit-list');
    
    list.innerHTML = app.data.habits.map(habit => {
        const progress = habit.completedDays.length;
        const progressPercent = Math.min(Math.round((progress / habit.targetDays) * 100), 100);
        const today = new Date().toDateString();
        const checkedToday = habit.completedDays.includes(today);
        
        return `
            <div class="habit-card">
                <h3 class="habit-name">${escapeHtml(habit.name)}</h3>
                <div class="habit-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="progress-text">${progress} / ${habit.targetDays} 天 (${progressPercent}%)</div>
                </div>
                <div class="habit-calendar">
                    ${generateCalendar(habit)}
                </div>
                <div class="habit-actions">
                    <button class="btn-checkin" onclick="checkInHabit(${habit.id})">
                        ${checkedToday ? '✅ 今日已打卡' : '✓ 今日打卡'}
                    </button>
                    <button class="btn-delete" onclick="deleteHabit(${habit.id})">删除</button>
                </div>
            </div>
        `;
    }).join('');
}

function generateCalendar(habit) {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        const dayNum = date.getDate();
        const isCompleted = habit.completedDays.includes(dateStr);
        const isToday = i === 0;
        
        days.push(`
            <div class="day-dot ${isCompleted ? 'completed' : ''}" 
                 onclick="toggleDay(${habit.id}, '${dateStr}')"
                 title="${formatDate(date.toISOString())}">
                ${dayNum}${isToday ? '' : ''}
            </div>
        `);
    }
    
    return days.join('');
}

function checkInHabit(id) {
    const habit = app.data.habits.find(h => h.id === id);
    if (!habit) return;
    
    const today = new Date().toDateString();
    toggleDay(id, today);
}

function toggleDay(id, dateStr) {
    const habit = app.data.habits.find(h => h.id === id);
    if (!habit) return;
    
    const index = habit.completedDays.indexOf(dateStr);
    if (index > -1) {
        habit.completedDays.splice(index, 1);
        showToast('已取消打卡');
    } else {
        habit.completedDays.push(dateStr);
        showToast('打卡成功！');
    }
    
    saveData();
    renderHabitList();
}

function deleteHabit(id) {
    app.data.habits = app.data.habits.filter(h => h.id !== id);
    saveData();
    renderHabitList();
    showToast('习惯已删除');
}

function renderStats() {
    const usageStatsDiv = document.getElementById('usage-stats');
    const todoStatsDiv = document.getElementById('todo-stats-detail');
    const expenseStatsDiv = document.getElementById('expense-stats-detail');
    const habitStatsDiv = document.getElementById('habit-stats-detail');
    
    const toolNames = {
        todo: '待办清单',
        expense: '记账本',
        habit: '习惯打卡',
        stats: '使用统计',
        about: '关于我'
    };
    
    usageStatsDiv.innerHTML = Object.entries(app.data.usageStats)
        .sort((a, b) => b[1] - a[1])
        .map(([tool, count]) => `
            <div class="usage-item">
                <span>${toolNames[tool] || tool}</span>
                <span class="usage-count">${count} 次</span>
            </div>
        `).join('');
    
    const todoTotal = app.data.todos.length;
    const todoCompleted = app.data.todos.filter(t => t.completed).length;
    todoStatsDiv.innerHTML = `
        <div class="usage-item">
            <span>总待办数</span>
            <span class="usage-count">${todoTotal}</span>
        </div>
        <div class="usage-item">
            <span>已完成</span>
            <span class="usage-count">${todoCompleted}</span>
        </div>
        <div class="usage-item">
            <span>完成率</span>
            <span class="usage-count">${todoTotal > 0 ? Math.round((todoCompleted/todoTotal)*100) : 0}%</span>
        </div>
    `;
    
    const income = app.data.expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const expense = app.data.expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    expenseStatsDiv.innerHTML = `
        <div class="usage-item">
            <span>总收入</span>
            <span class="usage-count" style="color: var(--success-color)">¥${income.toFixed(2)}</span>
        </div>
        <div class="usage-item">
            <span>总支出</span>
            <span class="usage-count" style="color: var(--danger-color)">¥${expense.toFixed(2)}</span>
        </div>
        <div class="usage-item">
            <span>记账笔数</span>
            <span class="usage-count">${app.data.expenses.length}</span>
        </div>
    `;
    
    const totalHabits = app.data.habits.length;
    const totalCheckins = app.data.habits.reduce((sum, h) => sum + h.completedDays.length, 0);
    habitStatsDiv.innerHTML = `
        <div class="usage-item">
            <span>习惯数量</span>
            <span class="usage-count">${totalHabits}</span>
        </div>
        <div class="usage-item">
            <span>总打卡次数</span>
            <span class="usage-count">${totalCheckins}</span>
        </div>
    `;
}

function initDataExportImport() {
    document.getElementById('export-btn').addEventListener('click', exportData);
    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', importData);
}

function exportData() {
    const dataStr = JSON.stringify(app.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-toolkit-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('数据导出成功！');
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (confirm('确定要导入数据吗？这将覆盖现有数据！')) {
                app.data = data;
                saveData();
                renderAll();
                showToast('数据导入成功！');
            }
        } catch (err) {
            showToast('导入失败：无效的 JSON 文件！');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function initQuickActions() {
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.quick;
            if (action === 'add-todo') {
                switchTool('todo');
                document.getElementById('todo-input').focus();
            } else if (action === 'add-expense') {
                switchTool('expense');
                document.getElementById('expense-desc').focus();
            } else if (action === 'add-habit') {
                switchTool('habit');
                document.getElementById('habit-input').focus();
            }
        });
    });
}

function renderAll() {
    renderTodoList();
    renderExpenseList();
    renderHabitList();
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case '1':
                switchTool('todo');
                break;
            case '2':
                switchTool('expense');
                break;
            case '3':
                switchTool('habit');
                break;
            case '4':
                switchTool('stats');
                break;
            case '5':
                switchTool('about');
                break;
        }
    }
});