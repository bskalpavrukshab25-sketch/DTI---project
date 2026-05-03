let currentUser = null;
let moodEntries = [];
let chartInstance = null;


const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const authMessage = document.getElementById('auth-message');
const entryMessage = document.getElementById('entry-message');
let selectedMood = null;
let selectedEmoji = null;


function init() {

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = storedUser;
        showDashboard();
    }
}

function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || {};
}

document.getElementById('signup-btn').addEventListener('click', () => {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    
    if (!user || !pass) return authMessage.textContent = 'Please enter username and password.';
    
    const users = getUsers();
    if (users[user]) return authMessage.textContent = 'Username exists. Please login.';
    
    users[user] = { password: pass };
    localStorage.setItem('users', JSON.stringify(users));
    
    
    loginUser(user);
});

document.getElementById('login-btn').addEventListener('click', () => {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    
    if (!user || !pass) return authMessage.textContent = 'Please enter username and password.';
    
    const users = getUsers();
    if (users[user] && users[user].password === pass) {
        loginUser(user);
    } else {
        authMessage.className = 'message error-msg';
        authMessage.textContent = 'Invalid username or password.';
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    authMessage.textContent = '';
    dashboardSection.classList.add('hidden');
    authSection.classList.remove('hidden');
});

function loginUser(user) {
    currentUser = user;
    localStorage.setItem('currentUser', currentUser);
    showDashboard();
}

function showDashboard() {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    document.getElementById('display-username').textContent = currentUser;
    loadUserData();
    renderHistory();
    renderChart();
}


function loadUserData() {
    moodEntries = JSON.parse(localStorage.getItem(`moods_${currentUser}`)) || [];
}

function saveUserData() {
    localStorage.setItem(`moods_${currentUser}`, JSON.stringify(moodEntries));
}

const emojiBtns = document.querySelectorAll('.emoji-btn');
emojiBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        emojiBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedMood = parseInt(btn.getAttribute('data-mood'));
        selectedEmoji = btn.getAttribute('data-emoji');
    });
});

document.getElementById('save-entry-btn').addEventListener('click', () => {
    if (!selectedMood) {
        entryMessage.className = 'message error-msg';
        entryMessage.textContent = 'Please select a mood emoji first!';
        return;
    }
    
    const note = document.getElementById('journal-entry').value.trim();
    const newEntry = {
        date: new Date().toLocaleString(),
        timestamp: Date.now(),
        moodValue: selectedMood,
        emoji: selectedEmoji,
        note: note
    };
    
    moodEntries.push(newEntry);
    saveUserData();
    
   
    document.getElementById('journal-entry').value = '';
    emojiBtns.forEach(b => b.classList.remove('selected'));
    selectedMood = null;
    selectedEmoji = null;
    
    entryMessage.className = 'message success-msg';
    entryMessage.textContent = 'Journal entry saved successfully!';
    setTimeout(() => entryMessage.textContent = '', 3000);
    
    renderHistory();
    renderChart();
});


function renderHistory() {
    const historyBody = document.getElementById('history-body');
    historyBody.innerHTML = '';
    
    
    const sortedEntries = [...moodEntries].sort((a, b) => b.timestamp - a.timestamp);
    
    if (sortedEntries.length === 0) {
        historyBody.innerHTML = '<tr><td colspan="3" style="text-align:center">No entries yet. Start journaling!</td></tr>';
        return;
    }
    
    sortedEntries.forEach(entry => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${entry.date}</td>
            <td style="font-size: 1.5rem;">${entry.emoji}</td>
            <td>${entry.note || '<em>No reflection provided.</em>'}</td>
        `;
        historyBody.appendChild(tr);
    });
}


function renderChart() {
    const ctx = document.getElementById('moodChart').getContext('2d');
    

    const recentEntries = [...moodEntries]
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-7);
        
    const labels = recentEntries.map(e => {
        const d = new Date(e.timestamp);
        return `${d.getMonth()+1}/${d.getDate()}`; 
    });
    
    const data = recentEntries.map(e => e.moodValue);
    
    if (chartInstance) chartInstance.destroy(); 
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Mood Level',
                data: data,
                borderColor: '#8b5cf6', 
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                borderWidth: 3,
                tension: 0.4, 
                fill: true,
                pointBackgroundColor: '#10b981',
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    min: 0, max: 6,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                       
                            const emojiMap = {1: '😔', 2: '😰', 3: '😐', 4: '⚡', 5: '😊'};
                            return emojiMap[value] || '';
                        }
                    }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}


function parseYouTubeUrl(url) {
    if (!url) return null;
    
    
    const listMatch = url.match(/[?&]list=([^&]+)/);
    if (listMatch) return `https://www.youtube.com/embed/videoseries?list=${listMatch[1]}`;
    

    const videoMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (videoMatch) return `https://www.youtube.com/embed/${videoMatch[1]}`;
    
    return null;
}

document.getElementById('load-yt-btn').addEventListener('click', () => {
    const url = document.getElementById('youtube-url').value.trim();
    const embedUrl = parseYouTubeUrl(url);
    const container = document.getElementById('yt-container');
    
    if (embedUrl) {
        container.innerHTML = `<iframe src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border:none;"></iframe>`;
    } else {
        container.innerHTML = `<p class="error-msg">Please enter a valid YouTube Video or Playlist URL.</p>`;
    }
});


init();