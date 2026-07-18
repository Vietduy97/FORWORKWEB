// Configurations for YouTube Ambient Sounds
const SOUNDS_CONFIG = {
    rain: { videoId: 'NDtBB-HCL1s', player: null, isPlaying: false, currentVolume: 50 },
    campfire: { videoId: 'L_LUpnjgPso', player: null, isPlaying: false, currentVolume: 50 },
    nature: { videoId: 'nMfPqeZ12FM', player: null, isPlaying: false, currentVolume: 50 },
    ocean: { videoId: 'Nep1qytq9JM', player: null, isPlaying: false, currentVolume: 50 },
    cafe: { videoId: 'gaGrHUekGrc', player: null, isPlaying: false, currentVolume: 50 },
    thunder: { videoId: 'T-BOPr7NXME', player: null, isPlaying: false, currentVolume: 30 },
    wind: { videoId: '3dfSip2HRBY', player: null, isPlaying: false, currentVolume: 40 },
    lofi: { videoId: 'DWcUYDK81dQ', player: null, isPlaying: false, currentVolume: 40 }
};

// Presets configuration
const PRESETS = {
    'rainy-cafe': { rain: 60, cafe: 70, thunder: 30, campfire: 0, nature: 0, ocean: 0, wind: 0, lofi: 0 },
    'beach-camp': { campfire: 70, ocean: 80, wind: 30, rain: 0, nature: 0, cafe: 0, thunder: 0, lofi: 0 },
    'deep-focus': { lofi: 50, rain: 40, wind: 20, campfire: 0, nature: 0, ocean: 0, cafe: 0, thunder: 0 },
    'forest-storm': { nature: 50, rain: 70, thunder: 50, wind: 40, campfire: 0, ocean: 0, cafe: 0, lofi: 0 }
};

// Global state variables
let playersReadyCount = 0;
const totalPlayersCount = Object.keys(SOUNDS_CONFIG).length;

// Wait for YouTube Iframe API to load and initialize players
function onYouTubeIframeAPIReady() {
    Object.keys(SOUNDS_CONFIG).forEach(key => {
        const sound = SOUNDS_CONFIG[key];
        sound.player = new YT.Player(`yt-player-${key}`, {
            height: '100',
            width: '100',
            videoId: sound.videoId,
            playerVars: {
                autoplay: 0,
                controls: 0,
                loop: 1,
                playlist: sound.videoId, // Required for loop in single video player
                mute: 1, // Start muted to comply with browser autoplay policies
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
    // Sync initial volume from state to YouTube player
    sound.player.setVolume(sound.currentVolume);
    
    // Once all players are initialized
    if (playersReadyCount === totalPlayersCount) {
        console.log("All YouTube players are ready.");
        updateActiveSoundsIndicator();
    }
}

function onPlayerStateChange(event, key) {
    const sound = SOUNDS_CONFIG[key];
    // Force loop if video ends (fallback mechanism if YT loop parameter fails)
    if (event.data === YT.PlayerState.ENDED && sound.isPlaying) {
        sound.player.playVideo();
    }
}

// Fade Audio transition to prevent jarring volume jumps
function fadeAudio(key, targetVolume, duration = 1200) {
    const sound = SOUNDS_CONFIG[key];
    if (!sound.player || typeof sound.player.setVolume !== 'function') return;

    const startVolume = sound.isPlaying ? sound.player.getVolume() : 0;
    const steps = 24;
    const stepTime = duration / steps;
    const volumeStep = (targetVolume - startVolume) / steps;
    let currentStep = 0;

    // If starting play, unmute and play video first
    if (targetVolume > 0 && !sound.isPlaying) {
        sound.isPlaying = true;
        sound.player.unMute();
        sound.player.playVideo();
        updateSoundCardUI(key, true);
    }

    if (sound.fadeInterval) {
        clearInterval(sound.fadeInterval);
    }

    sound.fadeInterval = setInterval(() => {
        currentStep++;
        const newVol = startVolume + (volumeStep * currentStep);
        sound.player.setVolume(Math.round(newVol));

        if (currentStep >= steps) {
            clearInterval(sound.fadeInterval);
            sound.player.setVolume(targetVolume);
            
            // If muting/turning off, pause and mute player
            if (targetVolume === 0) {
                sound.isPlaying = false;
                sound.player.pauseVideo();
                sound.player.mute();
                updateSoundCardUI(key, false);
            }
            updateActiveSoundsIndicator();
        }
    }, stepTime);
}

// Toggle individual sound channel
function toggleSound(key) {
    const sound = SOUNDS_CONFIG[key];
    if (sound.isPlaying) {
        fadeAudio(key, 0); // Fade out to mute
    } else {
        fadeAudio(key, sound.currentVolume); // Fade in to current volume
    }
}

// Update DOM elements for a sound card when play state changes
function updateSoundCardUI(key, isPlaying) {
    const card = document.querySelector(`.sound-card[data-sound="${key}"]`);
    if (!card) return;

    const toggleBtn = card.querySelector('.sound-toggle-btn');
    if (isPlaying) {
        card.classList.add('playing');
        toggleBtn.textContent = 'Tắt';
    } else {
        card.classList.remove('playing');
        toggleBtn.textContent = 'Bật';
    }
}

// Update Active Sounds Bar Indicator
function updateActiveSoundsIndicator() {
    const activeKeys = Object.keys(SOUNDS_CONFIG).filter(k => SOUNDS_CONFIG[k].isPlaying);
    const indicator = document.getElementById('active-sounds-indicator');
    
    if (activeKeys.length === 0) {
        indicator.textContent = 'Chưa bật âm thanh nào';
    } else {
        indicator.textContent = `Đang phát ${activeKeys.length} âm thanh`;
    }
}

// Apply Selected Preset
function applyPreset(presetKey) {
    const presetValues = PRESETS[presetKey];
    if (!presetValues) return;

    // Reset active state for presets UI
    document.querySelectorAll('.preset-btn').forEach(btn => {
        if (btn.dataset.preset === presetKey) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    Object.keys(SOUNDS_CONFIG).forEach(key => {
        const targetVol = presetValues[key] || 0;
        const sound = SOUNDS_CONFIG[key];
        
        // Sync custom slider input values in UI
        const card = document.querySelector(`.sound-card[data-sound="${key}"]`);
        if (card) {
            const slider = card.querySelector('.volume-slider');
            slider.value = targetVol > 0 ? targetVol : sound.currentVolume;
        }

        if (targetVol > 0) {
            sound.currentVolume = targetVol;
            fadeAudio(key, targetVol);
        } else {
            if (sound.isPlaying) {
                fadeAudio(key, 0);
            }
        }
    });
}

// Mute all active sounds
function muteAll() {
    // Remove preset active styling
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));

    Object.keys(SOUNDS_CONFIG).forEach(key => {
        if (SOUNDS_CONFIG[key].isPlaying) {
            fadeAudio(key, 0);
        }
    });
}

/* ========================================================== */
/* POMODORO TIMER LOGIC                                       */
/* ========================================================== */
const TIMER_MODES = {
    work: { duration: 25 * 60, label: 'Làm việc thôi!' },
    short: { duration: 5 * 60, label: 'Thư giãn chút nào!' },
    long: { duration: 15 * 60, label: 'Nghỉ ngơi dài hơn!' }
};

let currentMode = 'work';
let timeRemaining = TIMER_MODES.work.duration;
let totalDuration = TIMER_MODES.work.duration;
let timerInterval = null;

const timerTimeDisplay = document.getElementById('timer-time');
const timerStatusDisplay = document.getElementById('timer-status');
const timerStartBtn = document.getElementById('timer-start');
const timerResetBtn = document.getElementById('timer-reset');
const progressCircle = document.querySelector('.progress-ring-bar');

// SVG Ring progress metrics
const radius = 120;
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
    // Stop running interval
    clearInterval(timerInterval);
    timerInterval = null;
    timerStartBtn.classList.remove('active');
    timerStartBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="btn-icon"><path d="M8 5v14l11-7z"/></svg>
        <span>Bắt đầu</span>
    `;

    currentMode = mode;
    totalDuration = TIMER_MODES[mode].duration;
    timeRemaining = totalDuration;
    timerStatusDisplay.textContent = TIMER_MODES[mode].label;
    
    // Sync active state in UI tabs
    document.querySelectorAll('.mode-btn').forEach(btn => {
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
        // Pause timer
        clearInterval(timerInterval);
        timerInterval = null;
        timerStartBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="btn-icon"><path d="M8 5v14l11-7z"/></svg>
            <span>Bắt đầu</span>
        `;
        timerStatusDisplay.textContent = 'Đang tạm dừng';
    } else {
        // Start timer
        timerStartBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="btn-icon"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            <span>Tạm dừng</span>
        `;
        timerStatusDisplay.textContent = TIMER_MODES[currentMode].label;
        
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();

            if (timeRemaining <= 0) {
                // Completed Session
                clearInterval(timerInterval);
                timerInterval = null;
                
                // Play completion notification bell
                const bell = document.getElementById('timer-bell');
                if (bell) bell.play().catch(e => console.log('Audio playback permission error:', e));

                timerStatusDisplay.textContent = 'Đã hoàn thành! Nhận thưởng nghỉ ngơi thôi.';
                timerStartBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="btn-icon"><path d="M8 5v14l11-7z"/></svg>
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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="btn-icon"><path d="M8 5v14l11-7z"/></svg>
        <span>Bắt đầu</span>
    `;
    updateTimerDisplay();
}

/* ========================================================== */
/* TODO CHECKLIST LOGIC                                       */
/* ========================================================== */
let todos = JSON.parse(localStorage.getItem('forwork_todos')) || [
    { id: 1, text: 'Hoàn thành báo cáo công việc', completed: false },
    { id: 2, text: 'Đọc 10 trang sách lập trình', completed: true },
    { id: 3, text: 'Uống đủ 2 lít nước hôm nay', completed: false }
];

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

function renderTodos() {
    todoList.innerHTML = '';
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.innerHTML = `
            <div class="todo-item-left">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
                <span class="todo-text">${todo.text}</span>
            </div>
            <button class="todo-delete-btn" data-id="${todo.id}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
        `;
        todoList.appendChild(li);
    });
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
    // Delete handling
    const deleteBtn = e.target.closest('.todo-delete-btn');
    if (deleteBtn) {
        const id = parseInt(deleteBtn.dataset.id);
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        renderTodos();
        return;
    }

    // Toggle completed handling
    const checkbox = e.target.closest('.todo-checkbox');
    if (checkbox) {
        const id = parseInt(checkbox.dataset.id);
        todos = todos.map(t => {
            if (t.id === id) {
                return { ...t, completed: checkbox.checked };
            }
            return t;
        });
        saveTodos();
        // Short timeout to let the strike-through style animation complete before re-render
        setTimeout(renderTodos, 200);
    }
});

/* ========================================================== */
/* QUICK NOTES LOGIC                                          */
/* ========================================================== */
const notesTextarea = document.getElementById('notes-textarea');
const saveIndicator = document.getElementById('save-indicator');
let saveTimeout = null;

// Load saved note
notesTextarea.value = localStorage.getItem('forwork_notes') || '';

notesTextarea.addEventListener('input', () => {
    saveIndicator.textContent = 'Đang lưu tự động...';
    saveIndicator.classList.add('saving');
    
    // Debounce auto-save logic to minimize write overhead
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        localStorage.setItem('forwork_notes', notesTextarea.value);
        saveIndicator.textContent = 'Đã lưu tự động';
        saveIndicator.classList.remove('saving');
    }, 600);
});

/* ========================================================== */
/* TABS NAVIGATION                                            */
/* ========================================================== */
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        // Toggle tab button active style
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Toggle tab content visibility
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content.id === `tab-${targetTab}`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    });
});

/* ========================================================== */
/* INIT EVENT LISTENERS FOR SOUND CARDS                        */
/* ========================================================== */
function initSoundCards() {
    document.querySelectorAll('.sound-card').forEach(card => {
        const soundKey = card.dataset.sound;
        const toggleBtn = card.querySelector('.sound-toggle-btn');
        const slider = card.querySelector('.volume-slider');

        // Handle Click Play/Pause toggle
        toggleBtn.addEventListener('click', () => toggleSound(soundKey));

        // Handle Volume Slider interactions
        slider.addEventListener('input', (e) => {
            const vol = parseInt(e.target.value);
            SOUNDS_CONFIG[soundKey].currentVolume = vol;

            // Update volume immediately in YouTube player if sound is playing
            if (SOUNDS_CONFIG[soundKey].isPlaying) {
                const player = SOUNDS_CONFIG[soundKey].player;
                if (player && typeof player.setVolume === 'function') {
                    player.setVolume(vol);
                }
            }
        });
    });

    // Mute all trigger
    document.getElementById('mute-all-btn').addEventListener('click', muteAll);

    // Preset button triggers
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetKey = btn.dataset.preset;
            applyPreset(presetKey);
        });
    });
}

// Attach event listeners to Pomodoro Timer
timerStartBtn.addEventListener('click', toggleTimer);
timerResetBtn.addEventListener('click', resetTimer);
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        switchTimerMode(btn.dataset.mode);
    });
});

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderTodos();
    initSoundCards();
    updateTimerDisplay();
});
