document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let tasks = JSON.parse(localStorage.getItem('studyFlowTasks')) || [];
    let focusTime = parseInt(localStorage.getItem('studyFlowFocusTime')) || 0;
    let timerInterval;
    let timeLeft = 25 * 60;
    let isTimerRunning = false;
    let currentTimerMode = 'pomodoro'; // pomodoro, short-break, long-break

    const MODES = {
        'pomodoro': 25 * 60,
        'short-break': 5 * 60,
        'long-break': 15 * 60
    };

    // --- DOM Elements ---
    const navItems = document.querySelectorAll('.nav-links li');
    const tabContents = document.querySelectorAll('.tab-content');
    const currentDateEl = document.getElementById('current-date');

    // Dashboard Elements
    const tasksCompletedCountEl = document.getElementById('tasks-completed-count');
    const totalFocusTimeEl = document.getElementById('total-focus-time');
    const dashboardTaskList = document.getElementById('dashboard-task-list');
    const quickAddTaskBtn = document.getElementById('quick-add-task');

    // Planner Elements
    const newTaskInput = document.getElementById('new-task-input');
    const taskCategorySelect = document.getElementById('task-category');
    const taskTimeInput = document.getElementById('task-time');
    const addTaskBtn = document.getElementById('add-task-btn');
    const fullTaskList = document.getElementById('full-task-list');

    // Timer Elements
    const timerTimeEl = document.getElementById('timer-time');
    const timerStatusEl = document.getElementById('timer-status');
    const timerToggleBtn = document.getElementById('timer-toggle');
    const timerResetBtn = document.getElementById('timer-reset');
    const timerTabs = document.querySelectorAll('.timer-tab');
    const timerProgress = document.getElementById('timer-progress');

    // --- Initialization ---
    updateDate();
    renderTasks();
    updateStats();
    updateTimerDisplay();

    // --- Navigation ---
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            // Add active class to clicked
            item.classList.add('active');
            const tabId = item.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // --- Date ---
    function updateDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }

    // --- Task Management ---
    function saveTasks() {
        localStorage.setItem('studyFlowTasks', JSON.stringify(tasks));
        renderTasks();
        updateStats();
    }

    function addTask(title, category, time) {
        if (!title.trim()) return;

        const newTask = {
            id: Date.now(),
            title,
            category,
            time,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
        saveTasks();
        newTaskInput.value = '';
        taskTimeInput.value = '';
    }

    function toggleTask(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        saveTasks();
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
    }

    function renderTasks() {
        // Render Dashboard List (Top 3 incomplete)
        const incompleteTasks = tasks.filter(t => !t.completed).slice(0, 3);
        dashboardTaskList.innerHTML = incompleteTasks.length ? '' : '<li class="empty-state">No pending tasks. Great job!</li>';

        incompleteTasks.forEach(task => {
            dashboardTaskList.appendChild(createTaskElement(task, true));
        });

        // Render Full List
        fullTaskList.innerHTML = tasks.length ? '' : '<li class="empty-state" style="text-align:center; padding: 2rem;">Start planning your day by adding a task above!</li>';
        tasks.sort((a, b) => a.completed - b.completed); // Completed last
        tasks.forEach(task => {
            fullTaskList.appendChild(createTaskElement(task));
        });
    }

    function createTaskElement(task, simple = false) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;

        const categoryColors = {
            'study': 'var(--accent-purple)',
            'assignment': 'var(--accent-blue)',
            'exam': 'var(--accent-pink)',
            'break': '#ffd700'
        };

        const borderStyle = `border-left: 4px solid ${categoryColors[task.category] || 'var(--text-secondary)'}`;

        li.style = borderStyle;
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                ${!simple && task.time ? `<div class="task-meta"><i class="fa-regular fa-clock"></i> ${task.time}</div>` : ''}
            </div>
            ${!simple ? `<button class="btn-icon delete-btn"><i class="fa-solid fa-trash"></i></button>` : ''}
        `;

        // Event Listeners
        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => toggleTask(task.id));

        if (!simple) {
            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
        }

        return li;
    }

    // Event Listeners for Tasks
    addTaskBtn.addEventListener('click', () => {
        addTask(newTaskInput.value, taskCategorySelect.value, taskTimeInput.value);
    });

    newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask(newTaskInput.value, taskCategorySelect.value, taskTimeInput.value);
        }
    });

    quickAddTaskBtn.addEventListener('click', () => {
        // Switch to planner tab and focus input
        navItems[1].click();
        newTaskInput.focus();
    });

    // --- Stats ---
    function updateStats() {
        const completed = tasks.filter(t => t.completed).length;
        const total = tasks.length;
        tasksCompletedCountEl.textContent = `${completed}/${total}`;

        // Convert focus time (seconds) to readable format
        const hours = Math.floor(focusTime / 3600);
        const minutes = Math.floor((focusTime % 3600) / 60);
        totalFocusTimeEl.textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    // --- Focus Timer ---

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerTimeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Update Ring
        const totalTime = MODES[currentTimerMode];
        const progress = ((totalTime - timeLeft) / totalTime) * 880;
        timerProgress.style.strokeDashoffset = 880 - progress;
    }

    function startTimer() {
        if (isTimerRunning) return;

        isTimerRunning = true;
        timerToggleBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        timerStatusEl.textContent = currentTimerMode === 'pomodoro' ? 'Focusing...' : 'Relaxing...';

        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();

                // Only track focus time if in pomodoro mode
                if (currentTimerMode === 'pomodoro') {
                    focusTime++;
                    if (focusTime % 60 === 0) { // Save every minute
                        localStorage.setItem('studyFlowFocusTime', focusTime);
                        updateStats();
                    }
                }
            } else {
                clearInterval(timerInterval);
                isTimerRunning = false;
                timerToggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
                timerStatusEl.textContent = 'Time is up!';
                playNotificationSound();
            }
        }, 1000);
    }

    function pauseTimer() {
        clearInterval(timerInterval);
        isTimerRunning = false;
        timerToggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
        timerStatusEl.textContent = 'Paused';
    }

    function resetTimer() {
        pauseTimer();
        timeLeft = MODES[currentTimerMode];
        updateTimerDisplay();
        timerStatusEl.textContent = 'Ready';
        timerToggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
    }

    function playNotificationSound() {
        // Simple beep using AudioContext or just a visual alert for now
        // Since we can't guarantee audio file existence, we'll use a visual pulse
        document.title = "⏰ Time's Up!";
        setTimeout(() => document.title = "StudyFlow - Ultimate Study Planner", 5000);
        alert("Time's up!");
    }

    timerToggleBtn.addEventListener('click', () => {
        if (isTimerRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    });

    timerResetBtn.addEventListener('click', resetTimer);

    timerTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            timerTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTimerMode = tab.getAttribute('data-mode');
            resetTimer();
        });
    });



    // --- Settings ---
    const settingsBtn = document.getElementById('settings-btn');
    const themeBtns = document.querySelectorAll('.theme-btn');
    const fontSelect = document.getElementById('font-select');

    // Load Settings
    const savedTheme = localStorage.getItem('studyFlowTheme') || 'default';
    const savedFont = localStorage.getItem('studyFlowFont') || "'Outfit', sans-serif";

    applyTheme(savedTheme);
    applyFont(savedFont);

    // Settings Button Logic (Tab Switcher)
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            // Hide all tabs
            tabContents.forEach(content => content.classList.remove('active'));
            // Show settings tab
            const settingsTab = document.getElementById('settings');
            if (settingsTab) settingsTab.classList.add('active');

            // Update sidebar active state
            navItems.forEach(item => item.classList.remove('active'));
            settingsBtn.classList.add('active');

            // Initialize settings UI state
            themeBtns.forEach(btn => {
                if (btn.dataset.theme === savedTheme) btn.classList.add('active');
                else btn.classList.remove('active');
            });
            if (fontSelect) fontSelect.value = savedFont;
        });
    }

    // Handle other nav items clicking (to deselect settings button)
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (settingsBtn) settingsBtn.classList.remove('active');
        });
    });

    if (themeBtns.length > 0) {
        themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                applyTheme(theme);
                localStorage.setItem('studyFlowTheme', theme);

                themeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    if (fontSelect) {
        fontSelect.addEventListener('change', (e) => {
            const font = e.target.value;
            applyFont(font);
            localStorage.setItem('studyFlowFont', font);
        });
    }

    function applyTheme(theme) {
        document.body.className = ''; // Clear existing themes
        if (theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }
    }

    function applyFont(font) {
        document.documentElement.style.setProperty('--font-main', font);
    }
});
