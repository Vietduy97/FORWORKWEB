// Configurations for YouTube Ambient Sounds
const SOUNDS_CONFIG = {
    rain: { videoId: 'wX-y0M-3p4U', player: null, isPlaying: false, currentVolume: 50, fadeInterval: null },
    campfire: { videoId: 'L_LUpnjgPso', player: null, isPlaying: false, currentVolume: 50, fadeInterval: null },
    nature: { videoId: '62G4V654_b4', player: null, isPlaying: false, currentVolume: 50, fadeInterval: null },
    ocean: { videoId: 'Nep1qytq9JM', player: null, isPlaying: false, currentVolume: 50, fadeInterval: null },
    cafe: { videoId: 'gaGrHUekGrc', player: null, isPlaying: false, currentVolume: 50, fadeInterval: null },
    thunder: { videoId: 'T-BOPr7NXME', player: null, isPlaying: false, currentVolume: 30, fadeInterval: null },
    wind: { videoId: 'H1yB3AX1j8A', player: null, isPlaying: false, currentVolume: 40, fadeInterval: null },
    lofi: { videoId: '5w3kADg-Xik', player: null, isPlaying: false, currentVolume: 40, fadeInterval: null }
};

// Presets configuration
const PRESETS = {
    'rainy-cafe': { rain: 50, cafe: 60, thunder: 30, lofi: 30, campfire: 0, nature: 0, ocean: 0, wind: 0 },
    'beach-camp': { campfire: 70, ocean: 50, wind: 30, rain: 0, nature: 0, cafe: 0, thunder: 0, lofi: 0 },
    'deep-focus': { lofi: 40, rain: 30, wind: 20, campfire: 0, nature: 0, ocean: 0, cafe: 0, thunder: 0 },
    'forest-storm': { nature: 40, rain: 80, thunder: 60, wind: 40, campfire: 0, ocean: 0, cafe: 0, lofi: 0 },
    'sweet-dreams': { rain: 40, nature: 30, ocean: 30, campfire: 0, cafe: 0, thunder: 0, wind: 0, lofi: 0 },
    'winter-cabin': { campfire: 60, wind: 50, rain: 30, nature: 0, ocean: 0, cafe: 0, thunder: 0, lofi: 0 }
};

let playersReadyCount = 0;
const totalPlayersCount = Object.keys(SOUNDS_CONFIG).length;

// Initialize YouTube API Players
function onYouTubeIframeAPIReady() {
    Object.keys(SOUNDS_CONFIG).forEach(key => {
        const sound = SOUNDS_CONFIG[key];
        sound.player = new YT.Player(`yt-player-${key}`, {
            height: '200',
            width: '200',
            videoId: sound.videoId,
            playerVars: {
                autoplay: 1, // Autoplay on load in muted state
                controls: 0,
                loop: 1,
                playlist: sound.videoId,
                mute: 1, // Compliance with browser autoplay policies
                playsinline: 1,
                disablekb: 1,
                fs: 0,
                rel: 0,
                showinfo: 0,
                modestbranding: 1
            },
            events: {
                onReady: (event) => onPlayerReady(event, key),
                onStateChange: (event) => onPlayerStateChange(event, key)
            }
        });
    });
}

function onPlayerReady(event, key) {
    playersReadyCount++;
    const sound = SOUNDS_CONFIG[key];
    
    // Command player to start playing muted immediately under the hood
    sound.player.mute();
    sound.player.setVolume(0);
    sound.player.playVideo();
    
    if (playersReadyCount === totalPlayersCount) {
        document.getElementById('footer-mixer-status').textContent = 'Hệ thống âm thanh sẵn sàng';
    }
}

function onPlayerStateChange(event, key) {
    const sound = SOUNDS_CONFIG[key];
    
    // Once video actually starts playing under the hood, unMute it but keep volume at 0
    if (event.data === YT.PlayerState.PLAYING) {
        sound.player.unMute();
        // If sound was not toggled ON, keep volume 0
        if (!sound.isPlaying) {
            sound.player.setVolume(0);
        } else {
            sound.player.setVolume(sound.currentVolume);
        }
    }
    
    // Fallback: loop video if it ends
    if (event.data === YT.PlayerState.ENDED) {
        sound.player.playVideo();
    }
}

// Instant Fade Audio (200ms duration for click feedback, no lag)
function fadeAudio(key, targetVolume, duration = 200) {
    const sound = SOUNDS_CONFIG[key];
    if (!sound.player || typeof sound.player.setVolume !== 'function') return;

    if (sound.fadeInterval) clearInterval(sound.fadeInterval);

    const startVolume = sound.player.getVolume();
    const steps = 10;
    const stepTime = duration / steps;
    const volumeStep = (targetVolume - startVolume) / steps;
    let currentStep = 0;

    sound.fadeInterval = setInterval(() => {
        currentStep++;
        const newVol = startVolume + (volumeStep * currentStep);
        sound.player.setVolume(Math.min(Math.max(Math.round(newVol), 0), 100));

        if (currentStep >= steps) {
            clearInterval(sound.fadeInterval);
            sound.player.setVolume(targetVolume);
        }
    }, stepTime);
}

// Toggle sound instantly
function toggleSound(key) {
    const sound = SOUNDS_CONFIG[key];
    
    if (sound.isPlaying) {
        sound.isPlaying = false;
        updateCardUI(key, false);
        fadeAudio(key, 0); // Fade volume down to 0 instantly
    } else {
        sound.isPlaying = true;
        updateCardUI(key, true);
        
        // Ensure video is playing and fade volume up immediately
        sound.player.playVideo();
        fadeAudio(key, sound.currentVolume);
    }
}

// Update card play states instantly on UI
function updateCardUI(key, isPlaying) {
    const card = document.querySelector(`.sound-card[data-sound="${key}"]`);
    if (!card) return;

    const toggleBtn = card.querySelector('.btn-toggle-sound');
    const btnText = toggleBtn.querySelector('.btn-text');

    if (isPlaying) {
        card.classList.add('playing');
        btnText.textContent = 'Tắt';
    } else {
        card.classList.remove('playing');
        btnText.textContent = 'Bật';
    }

    updateFooterStatus();
}

function updateFooterStatus() {
    const activeKeys = Object.keys(SOUNDS_CONFIG).filter(k => SOUNDS_CONFIG[k].isPlaying);
    const activeText = document.getElementById('footer-mixer-status');
    
    if (activeKeys.length === 0) {
        activeText.textContent = 'Không có âm thanh nào đang phát';
    } else {
        const names = activeKeys.map(k => {
            const card = document.querySelector(`.sound-card[data-sound="${k}"]`);
            return card ? card.querySelector('h4').textContent : k;
        });
        activeText.textContent = `Đang phối: ${names.join(', ')}`;
    }
}

// Apply selected preset instantly
function applyPreset(presetKey) {
    const presetValues = PRESETS[presetKey];
    if (!presetValues) return;

    // Update active visual class in presets list
    document.querySelectorAll('.preset-card').forEach(card => {
        if (card.dataset.preset === presetKey) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

    Object.keys(SOUNDS_CONFIG).forEach(key => {
        const targetVol = presetValues[key] || 0;
        const sound = SOUNDS_CONFIG[key];
        
        // Update slider UI elements
        const card = document.querySelector(`.sound-card[data-sound="${key}"]`);
        if (card) {
            const slider = card.querySelector('.volume-slider');
            const badge = card.querySelector('.volume-badge');
            slider.value = targetVol > 0 ? targetVol : sound.currentVolume;
            badge.textContent = `${slider.value}%`;
        }

        if (targetVol > 0) {
            sound.currentVolume = targetVol;
            sound.isPlaying = true;
            updateCardUI(key, true);
            sound.player.playVideo();
            fadeAudio(key, targetVol);
        } else {
            sound.isPlaying = false;
            updateCardUI(key, false);
            fadeAudio(key, 0);
        }
    });
}

// Mute all active sounds instantly
function muteAll() {
    document.querySelectorAll('.preset-card').forEach(card => card.classList.remove('active'));

    Object.keys(SOUNDS_CONFIG).forEach(key => {
        if (SOUNDS_CONFIG[key].isPlaying) {
            SOUNDS_CONFIG[key].isPlaying = false;
            updateCardUI(key, false);
            fadeAudio(key, 0);
        }
    });
}

/* ========================================================== */
/* POMODORO TIMER LOGIC                                       */
/* ========================================================== */
const TIMER_MODES = {
    work: { duration: 25 * 60, label: 'Tập trung cao độ' },
    short: { duration: 5 * 60, label: 'Nghỉ giải lao ngắn' },
    long: { duration: 15 * 60, label: 'Nghỉ ngơi nạp năng lượng' }
};

let currentMode = 'work';
let timeRemaining = TIMER_MODES.work.duration;
let totalDuration = TIMER_MODES.work.duration;
let timerInterval = null;

const timerTimeDisplay = document.getElementById('timer-time');
const timerStatusDisplay = document.getElementById('timer-status');
const timerStartBtn = document.getElementById('timer-start');
const timerResetBtn = document.getElementById('timer-reset');
const progressCircle = document.querySelector('.progress-indicator .bar');

const radius = 130;
const circumference = 2 * Math.PI * radius;

if (progressCircle) {
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = circumference;
}

function updateProgressCircle() {
    if (!progressCircle) return;
    const progressPercent = (timeRemaining / totalDuration);
    const offset = circumference - (progressPercent * circumference);
    progressCircle.style.strokeDashoffset = offset;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    timerTimeDisplay.textContent = formatTime(timeRemaining);
    updateProgressCircle();
}

function switchTimerMode(mode) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerStartBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-svg"><path d="M8 5v14l11-7z"/></svg>
        <span>Bắt đầu</span>
    `;

    currentMode = mode;
    totalDuration = TIMER_MODES[mode].duration;
    timeRemaining = totalDuration;
    timerStatusDisplay.textContent = TIMER_MODES[mode].label;
    
    document.querySelectorAll('.mode-selector-btn').forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    updateTimerDisplay();
}

function toggleTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerStartBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-svg"><path d="M8 5v14l11-7z"/></svg>
            <span>Bắt đầu</span>
        `;
        timerStatusDisplay.textContent = 'Đang tạm dừng';
    } else {
        timerStartBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-svg"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            <span>Tạm dừng</span>
        `;
        timerStatusDisplay.textContent = TIMER_MODES[currentMode].label;
        
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                
                const bell = document.getElementById('timer-bell');
                if (bell) bell.play().catch(e => console.log('Audio error:', e));

                timerStatusDisplay.textContent = 'Hoàn thành phiên làm việc!';
                timerStartBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-svg"><path d="M8 5v14l11-7z"/></svg>
                    <span>Bắt đầu</span>
                `;
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timeRemaining = totalDuration;
    timerStatusDisplay.textContent = TIMER_MODES[currentMode].label;
    timerStartBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-svg"><path d="M8 5v14l11-7z"/></svg>
        <span>Bắt đầu</span>
    `;
    updateTimerDisplay();
}

/* ========================================================== */
/* CHECKLIST (TO-DO) LOGIC                                    */
/* ========================================================== */
let todos = JSON.parse(localStorage.getItem('forwork_todos')) || [
    { id: 1, text: 'Phác thảo ý tưởng thiết kế giao diện', completed: false },
    { id: 2, text: 'Thiết lập danh sách phối âm yêu thích', completed: true },
    { id: 3, text: 'Lên lịch trình làm việc ngày mai', completed: false }
];

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const todoCountBadge = document.getElementById('todo-count');

function updateTodoCount() {
    const activeTasks = todos.filter(t => !t.completed).length;
    todoCountBadge.textContent = `${activeTasks} việc cần làm`;
}

function renderTodos() {
    todoList.innerHTML = '';
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'checklist-item';
        li.innerHTML = `
            <div class="checklist-item-left">
                <input type="checkbox" class="todo-check-input" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
                <span class="todo-label-text">${todo.text}</span>
            </div>
            <button class="todo-btn-delete" data-id="${todo.id}" title="Xóa việc">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
        `;
        todoList.appendChild(li);
    });
    updateTodoCount();
}

function saveTodos() {
    localStorage.setItem('forwork_todos', JSON.stringify(todos));
}

todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;

    const newTodo = {
        id: Date.now(),
        text: text,
        completed: false
    };

    todos.push(newTodo);
    saveTodos();
    renderTodos();
    todoInput.value = '';
});

todoList.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.todo-btn-delete');
    if (deleteBtn) {
        const id = parseInt(deleteBtn.dataset.id);
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        renderTodos();
        return;
    }

    const checkbox = e.target.closest('.todo-check-input');
    if (checkbox) {
        const id = parseInt(checkbox.dataset.id);
        todos = todos.map(t => {
            if (t.id === id) {
                return { ...t, completed: checkbox.checked };
            }
            return t;
        });
        saveTodos();
        setTimeout(renderTodos, 200);
    }
});

/* ========================================================== */
/* AUTO-SAVE NOTES LOGIC                                      */
/* ========================================================== */
const notesTextarea = document.getElementById('notes-textarea');
const saveIndicator = document.getElementById('save-indicator');
let saveTimeout = null;

notesTextarea.value = localStorage.getItem('forwork_notes') || '';

notesTextarea.addEventListener('input', () => {
    saveIndicator.classList.add('saving');
    saveIndicator.querySelector('.status-txt').textContent = 'Đang lưu tự động...';
    
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        localStorage.setItem('forwork_notes', notesTextarea.value);
        saveIndicator.classList.remove('saving');
        saveIndicator.querySelector('.status-txt').textContent = 'Đã lưu cục bộ';
    }, 600);
});

/* ========================================================== */
/* SPA TABS NAVIGATION                                        */
/* ========================================================== */
document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.tab-panel').forEach(panel => {
            if (panel.id === `tab-${targetTab}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
    });
});

/* ========================================================== */
/* INIT SOUND CARDS CONTROLS                                  */
/* ========================================================== */
function initSoundCards() {
    document.querySelectorAll('.sound-card').forEach(card => {
        const soundKey = card.dataset.sound;
        const toggleBtn = card.querySelector('.btn-toggle-sound');
        const slider = card.querySelector('.volume-slider');
        const badge = card.querySelector('.volume-badge');

        toggleBtn.addEventListener('click', () => toggleSound(soundKey));

        slider.addEventListener('input', (e) => {
            const vol = parseInt(e.target.value);
            SOUNDS_CONFIG[soundKey].currentVolume = vol;
            badge.textContent = `${vol}%`;

            if (SOUNDS_CONFIG[soundKey].isPlaying) {
                const player = SOUNDS_CONFIG[soundKey].player;
                if (player && typeof player.setVolume === 'function') {
                    player.setVolume(vol);
                }
            }
        });
    });

    document.getElementById('mute-all-btn').addEventListener('click', muteAll);

    document.querySelectorAll('.preset-card').forEach(card => {
        card.addEventListener('click', () => {
            const presetKey = card.dataset.preset;
            applyPreset(presetKey);
        });
    });
}

timerStartBtn.addEventListener('click', toggleTimer);
timerResetBtn.addEventListener('click', resetTimer);
document.querySelectorAll('.mode-selector-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        switchTimerMode(btn.dataset.mode);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    renderTodos();
    initSoundCards();
    updateTimerDisplay();
});
