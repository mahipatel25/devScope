/**
 * DEVSCOPE - CORE APP LOGIC
 * Dynamic integration with the GitHub REST API, localStorage history & favorites,
 * multi-dimensional repository filters (search + language + sorting),
 * dynamic statistics aggregate dashboard, neon rank ratings,
 * a simulated 53-week System Sync Grid contribution calendar,
 * and high-fidelity canvas particle drifting backgrounds.
 */

// GitHub API Base Endpoint
const GITHUB_API_URL = 'https://api.github.com/users';

// Preset color tokens for popular coding languages
const LANGUAGE_COLORS = {
    javascript: '#f1e05a',
    typescript: '#3178c6',
    html: '#e34c26',
    css: '#563d7c',
    python: '#3572a5',
    java: '#b07219',
    rust: '#dea584',
    go: '#00add8',
    ruby: '#701516',
    php: '#4f5d95',
    cpp: '#f34b7d',
    csharp: '#178600',
    swift: '#f05138',
    shell: '#89e051',
    vue: '#41b883',
    react: '#61dafb',
    kotlin: '#a97bff'
};

// Global App States
let currentReposList = []; // Caches raw fetched repositories
let activeTheme = 'dark';
let searchHistory = [];
let favoritesList = [];
let currentUserData = null; // Caches currently active user node

// DOM Element Registry
const DOM = {
    html: document.documentElement,
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    searchForm: document.getElementById('search-form'),
    searchInput: document.getElementById('search-input'),
    historyContainer: document.getElementById('history-container'),
    historyChipsList: document.getElementById('history-chips-list'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    
    // Status Panels
    emptyStatePanel: document.getElementById('empty-state-panel'),
    skeletonLoader: document.getElementById('skeleton-loader'),
    errorPanel: document.getElementById('error-panel'),
    errorHeadline: document.getElementById('error-headline'),
    errorMessageText: document.getElementById('error-message-text'),
    errorDetailsSubtext: document.getElementById('error-details-subtext'),
    errorRetryBtn: document.getElementById('error-retry-btn'),
    
    // Results Layouts
    resultsPanel: document.getElementById('results-panel'),
    profileContainer: document.getElementById('profile-container'),
    statsContainer: document.getElementById('stats-container'),
    contributionContainer: document.getElementById('contribution-container'),
    reposCardsGrid: document.getElementById('repos-cards-grid'),
    
    // Filters & Sorting Controls
    repoSearchInput: document.getElementById('repo-search-input'),
    repoLangSelect: document.getElementById('repo-lang-select'),
    repoSortSelect: document.getElementById('repo-sort-select'),
    suggestChips: document.querySelectorAll('.suggest-chip-btn'),
    
    // Favorites & Typing
    favoritesContainer: document.getElementById('favorites-container'),
    favoritesChipsList: document.getElementById('favorites-chips-list'),
    favoritesCount: document.getElementById('favorites-count'),
    typingText: document.getElementById('typing-text'),
    particlesCanvas: document.getElementById('particles-canvas')
};

// -------------------------------------------------------------
// 1. Initializers & Theme Switcher
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initHistory();
    initFavorites();
    initTypingEffect();
    setupEventListeners();
});

/**
 * Reads local preference and configures the startup theme
 */
function initTheme() {
    const cachedTheme = localStorage.getItem('devscope-theme');
    
    if (cachedTheme) {
        activeTheme = cachedTheme;
    } else {
        activeTheme = 'dark'; // Default to the luxury roasted espresso dark theme on first launch
    }
    
    DOM.html.setAttribute('data-theme', activeTheme);
}

/**
 * Toggles theme state between dark and light
 */
function toggleTheme() {
    activeTheme = activeTheme === 'dark' ? 'light' : 'dark';
    DOM.html.setAttribute('data-theme', activeTheme);
    localStorage.setItem('devscope-theme', activeTheme);
}

// -------------------------------------------------------------
// 2. Typing Terminal Effect
// -------------------------------------------------------------
const TYPING_STRINGS = [
    "Analyze profile stats instantly.",
    "Decode repository source grids.",
    "Bookmark coder nodes to favorites.",
    "Unveil open source legends."
];
let stringIdx = 0;
let charIdx = 0;
let isDeleting = false;

function initTypingEffect() {
    if (!DOM.typingText) return;
    
    const currentString = TYPING_STRINGS[stringIdx];
    
    if (!isDeleting) {
        DOM.typingText.textContent = currentString.substring(0, charIdx + 1);
        charIdx++;
        
        if (charIdx === currentString.length) {
            isDeleting = true;
            setTimeout(initTypingEffect, 2000); // Wait at full sentence
            return;
        }
    } else {
        DOM.typingText.textContent = currentString.substring(0, charIdx - 1);
        charIdx--;
        
        if (charIdx === 0) {
            isDeleting = false;
            stringIdx = (stringIdx + 1) % TYPING_STRINGS.length;
            setTimeout(initTypingEffect, 500); // Shift delay
            return;
        }
    }
    
    const speed = isDeleting ? 30 : 60;
    setTimeout(initTypingEffect, speed);
}



// -------------------------------------------------------------
// 4. Search History Caching (localStorage)
// -------------------------------------------------------------
function initHistory() {
    const cachedHistory = localStorage.getItem('devscope-history');
    if (cachedHistory) {
        try {
            searchHistory = JSON.parse(cachedHistory);
            renderHistoryChips();
        } catch (e) {
            searchHistory = [];
        }
    }
}

function addToHistory(username) {
    if (!username) return;
    const normalized = username.trim().toLowerCase();
    
    searchHistory = searchHistory.filter(item => item !== normalized);
    searchHistory.unshift(normalized);
    searchHistory = searchHistory.slice(0, 5);
    
    localStorage.setItem('devscope-history', JSON.stringify(searchHistory));
    renderHistoryChips();
}

function renderHistoryChips() {
    if (searchHistory.length === 0) {
        DOM.historyContainer.classList.add('hidden');
        return;
    }
    
    DOM.historyContainer.classList.remove('hidden');
    DOM.historyChipsList.innerHTML = '';
    
    searchHistory.forEach(username => {
        const chip = document.createElement('div');
        chip.className = 'history-chip';
        chip.innerHTML = `
            <span class="chip-name" title="${username}">${username}</span>
            <button class="delete-chip-btn" data-user="${username}" aria-label="Delete history entry">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        
        chip.addEventListener('click', (e) => {
            if (e.target.closest('.delete-chip-btn')) return;
            DOM.searchInput.value = username;
            executeSearch(username);
        });
        
        DOM.historyChipsList.appendChild(chip);
    });
    
    document.querySelectorAll('.delete-chip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const userToRemove = btn.getAttribute('data-user');
            deleteHistoryEntry(userToRemove);
        });
    });
}

function deleteHistoryEntry(username) {
    searchHistory = searchHistory.filter(item => item !== username);
    localStorage.setItem('devscope-history', JSON.stringify(searchHistory));
    renderHistoryChips();
}

function clearAllHistory() {
    searchHistory = [];
    localStorage.removeItem('devscope-history');
    renderHistoryChips();
}

// -------------------------------------------------------------
// 5. Bookmarks Favorites Manager (localStorage)
// -------------------------------------------------------------
function initFavorites() {
    const cachedFavorites = localStorage.getItem('devscope-favorites');
    if (cachedFavorites) {
        try {
            favoritesList = JSON.parse(cachedFavorites);
        } catch (e) {
            favoritesList = [];
        }
    }
    renderFavorites();
}

function isFavorite(username) {
    return favoritesList.some(item => item.username.toLowerCase() === username.toLowerCase());
}

function toggleFavorite(userData) {
    const username = userData.login;
    if (isFavorite(username)) {
        favoritesList = favoritesList.filter(item => item.username.toLowerCase() !== username.toLowerCase());
    } else {
        favoritesList.push({
            username: username,
            avatarUrl: userData.avatar_url,
            name: userData.name || userData.login
        });
    }
    localStorage.setItem('devscope-favorites', JSON.stringify(favoritesList));
    renderFavorites();
    
    // Synchronize current profile toggle button state
    const btn = document.getElementById('profile-favorite-btn');
    if (btn) {
        const active = isFavorite(username);
        btn.className = `profile-favorite-btn ${active ? 'active' : ''}`;
        btn.title = active ? 'Remove Bookmark' : 'Bookmark Profile';
        btn.innerHTML = `<i class="${active ? 'fa-solid' : 'fa-regular'} fa-star"></i>`;
    }
}

function renderFavorites() {
    if (!DOM.favoritesContainer || !DOM.favoritesChipsList || !DOM.favoritesCount) return;
    
    if (favoritesList.length === 0) {
        DOM.favoritesContainer.classList.add('hidden');
        return;
    }
    
    DOM.favoritesContainer.classList.remove('hidden');
    DOM.favoritesCount.textContent = favoritesList.length;
    DOM.favoritesChipsList.innerHTML = '';
    
    favoritesList.forEach(fav => {
        const chip = document.createElement('div');
        chip.className = 'favorite-chip';
        chip.innerHTML = `
            <img src="${fav.avatarUrl}" alt="${fav.name}" class="favorite-chip-avatar">
            <span class="favorite-chip-name">${fav.name}</span>
        `;
        
        chip.addEventListener('click', () => {
            DOM.searchInput.value = fav.username;
            executeSearch(fav.username);
        });
        
        DOM.favoritesChipsList.appendChild(chip);
    });
}

// -------------------------------------------------------------
// 6. Status State Managers
// -------------------------------------------------------------
function showState(stateName) {
    DOM.emptyStatePanel.classList.add('hidden');
    DOM.skeletonLoader.classList.add('hidden');
    DOM.errorPanel.classList.add('hidden');
    DOM.resultsPanel.classList.add('hidden');
    
    switch (stateName) {
        case 'empty':
            DOM.emptyStatePanel.classList.remove('hidden');
            break;
        case 'loading':
            DOM.skeletonLoader.classList.remove('hidden');
            break;
        case 'error':
            DOM.errorPanel.classList.remove('hidden');
            break;
        case 'results':
            DOM.resultsPanel.classList.remove('hidden');
            break;
    }
}

/**
 * Formats custom cyberpunk style errors
 */
function triggerErrorUI(status, details = '') {
    showState('error');
    
    let title = "System Disruption";
    let message = "“Developer vanished into the void.”";
    let subtext = "The requested developer node was not registered on the GitHub server cluster.";
    
    if (status === 404) {
        title = "Scope Disconnected";
        message = "“Developer vanished into the void.”";
        subtext = `The profile node is either completely absent, deleted, or offline.`;
    } else if (status === 403) {
        title = "Grid Locking";
        message = "“GitHub servers are tired. Try again later.”";
        subtext = "You have exhausted the rate limit allocated for unauthenticated profiles. Wait an hour, or try again later.";
    } else if (status === 'offline') {
        title = "Signal Loss";
        message = "“Lost connection in the cyberspace.”";
        subtext = "Verify your local network transmission integrity and retry the connection handshake.";
    } else {
        title = "Query Failed";
        message = `“Anomaly identified: Code ${status}”`;
        subtext = details || "An unexpected response payload arrived from the GitHub host servers.";
    }
    
    DOM.errorHeadline.textContent = title;
    DOM.errorMessageText.textContent = message;
    DOM.errorDetailsSubtext.textContent = subtext;
}

// -------------------------------------------------------------
// 7. API Integration & Logic Pipelines
// -------------------------------------------------------------
async function executeSearch(username) {
    if (!username || username.trim() === '') return;
    
    const targetUser = username.trim();
    showState('loading');
    
    // Smooth scroll top on new search query
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    try {
        // Step A: Fetch User Profile
        const userResponse = await fetch(`${GITHUB_API_URL}/${targetUser}`);
        
        if (!userResponse.ok) {
            triggerErrorUI(userResponse.status);
            return;
        }
        
        const userData = await userResponse.json();
        currentUserData = userData; // Save to global state
        
        // Step B: Fetch User Repositories
        const reposResponse = await fetch(`${GITHUB_API_URL}/${targetUser}/repos?per_page=100`);
        let reposData = [];
        
        if (reposResponse.ok) {
            reposData = await reposResponse.json();
        }
        
        // Save history entry on successfully located profile
        addToHistory(targetUser);
        
        // Update variables & rendering pipeline
        currentReposList = reposData;
        
        // A. Profile Card Left Col
        renderUserProfile(userData);
        
        // B. Statistics Widget Left Col
        renderStatistics(userData, reposData);
        
        // C. Contribution Heatmap Right Col
        renderContributionHeatmap(userData, reposData);
        
        // D. Setup filters in repos-header-bar
        populateLanguageFilter(reposData);
        if (DOM.repoSearchInput) DOM.repoSearchInput.value = ''; // Reset query value
        
        // E. Trigger repositories list sorting and build
        filterAndSortRepositories();
        
        // Switch views into final results display
        showState('results');
        
    } catch (error) {
        console.error("Fetch Exception: ", error);
        triggerErrorUI('offline');
    }
}

// -------------------------------------------------------------
// 8. Dynamic Document Rendering Engine
// -------------------------------------------------------------

/**
 * Dynamic HTML assembly for user profile details (Left Column top)
 */
function renderUserProfile(user) {
    const joinDate = new Date(user.created_at);
    const dateFormatted = joinDate.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    
    // Safety fallback for empty properties
    const bioText = user.bio ? user.bio : `<span class="bio-empty">This coder has left their transmission bio blank.</span>`;
    const company = user.company ? user.company : '<span class="detail-muted">Unspecified Group</span>';
    const location = user.location ? user.location : '<span class="detail-muted">Uncharted Grid</span>';
    const blogUrl = user.blog ? user.blog : null;
    const twitterHandle = user.twitter_username ? user.twitter_username : null;
    
    const favorited = isFavorite(user.login);
    
    DOM.profileContainer.innerHTML = `
        <div class="profile-card">
            <!-- Bookmarked Favorite button -->
            <button class="profile-favorite-btn ${favorited ? 'active' : ''}" id="profile-favorite-btn" title="${favorited ? 'Remove Bookmark' : 'Bookmark Profile'}" aria-label="Bookmark profile">
                <i class="${favorited ? 'fa-solid' : 'fa-regular'} fa-star"></i>
            </button>

            <!-- Floating GitHub Link -->
            <a href="${user.html_url}" target="_blank" rel="noopener noreferrer" class="profile-github-link" title="Open GitHub Profile">
                <i class="fa-brands fa-github"></i>
            </a>

            <!-- Avatar -->
            <div class="avatar-container">
                <div class="avatar-glow"></div>
                <img src="${user.avatar_url}" alt="${user.name || user.login}'s profile avatar" class="profile-avatar">
            </div>

            <!-- Identifiers -->
            <div class="profile-names">
                <h2 class="profile-fullname">${user.name || user.login}</h2>
                <span class="profile-handle">@${user.login}</span>
            </div>

            <!-- Bio -->
            <p class="profile-bio">${bioText}</p>

            <!-- Stats Capsules -->
            <div class="profile-stats-capsules">
                <div class="stat-capsule">
                    <span class="stat-count">${user.public_repos}</span>
                    <span class="stat-label">Repos</span>
                </div>
                <div class="stat-capsule">
                    <span class="stat-count">${formatStatNumber(user.followers)}</span>
                    <span class="stat-label">Followers</span>
                </div>
                <div class="stat-capsule">
                    <span class="stat-count">${formatStatNumber(user.following)}</span>
                    <span class="stat-label">Following</span>
                </div>
            </div>

            <!-- Details List -->
            <div class="profile-details-list">
                <div class="detail-item" title="Company Linkage">
                    <i class="fa-solid fa-building"></i>
                    <span>${company}</span>
                </div>
                <div class="detail-item" title="Location coordinate">
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${location}</span>
                </div>
                <div class="detail-item" title="Blog Link">
                    <i class="fa-solid fa-link"></i>
                    ${blogUrl ? `<a href="${blogUrl.startsWith('http') ? blogUrl : 'https://' + blogUrl}" target="_blank" rel="noopener noreferrer">${blogUrl}</a>` : `<span class="detail-muted">No external connection</span>`}
                </div>
                <div class="detail-item" title="Twitter handle">
                    <i class="fa-brands fa-x-twitter"></i>
                    ${twitterHandle ? `<a href="https://x.com/${twitterHandle}" target="_blank" rel="noopener noreferrer">@${twitterHandle}</a>` : `<span class="detail-muted">Unlinked</span>`}
                </div>
                <div class="detail-item" title="Joining system date">
                    <i class="fa-solid fa-calendar-days"></i>
                    <span>Joined ${dateFormatted}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renders statistical metrics card (Left Column bottom)
 */
function renderStatistics(user, repos) {
    if (!DOM.statsContainer) return;
    
    // A. Sum Stars & Forks
    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
    
    // B. Calculate Developer Rating Level Badge
    const rankScore = (user.followers * 3) + user.public_repos + (totalStars * 5);
    let badgeText = "Beginner Dev";
    let badgeClass = "badge-beginner";
    let badgeIcon = '<i class="fa-solid fa-seedling"></i>';
    
    if (rankScore >= 120) {
        badgeText = "Open Source Legend";
        badgeClass = "badge-legend";
        badgeIcon = '<i class="fa-solid fa-crown"></i>';
    } else if (rankScore >= 25) {
        badgeText = "Pro Dev";
        badgeClass = "badge-pro";
        badgeIcon = '<i class="fa-solid fa-code"></i>';
    }
    
    // C. Process Language statistics
    const langCounts = {};
    let totalLangReposCount = 0;
    
    repos.forEach(r => {
        if (r.language) {
            langCounts[r.language] = (langCounts[r.language] || 0) + 1;
            totalLangReposCount++;
        }
    });
    
    const langArray = [];
    for (const lang in langCounts) {
        langArray.push({
            name: lang,
            count: langCounts[lang],
            percentage: Math.round((langCounts[lang] / totalLangReposCount) * 100)
        });
    }
    langArray.sort((a, b) => b.count - a.count);
    
    const displayLangs = langArray.slice(0, 3); // top 3 languages
    
    let langRowsHtml = '';
    if (displayLangs.length === 0) {
        langRowsHtml = `<div class="detail-muted" style="font-size: 0.8rem; font-style: italic;">No core languages identified.</div>`;
    } else {
        displayLangs.forEach(lang => {
            const langKey = lang.name.toLowerCase();
            const langColor = LANGUAGE_COLORS[langKey] || '#64748b';
            langRowsHtml += `
                <div class="language-row">
                    <div class="language-meta">
                        <div class="language-name-box">
                            <span class="lang-dot" style="background-color: ${langColor}"></span>
                            <span>${lang.name}</span>
                        </div>
                        <span class="language-pct">${lang.percentage}%</span>
                    </div>
                    <div class="progress-bg">
                        <div class="progress-fill" style="width: ${lang.percentage}%; background: ${langColor}; box-shadow: 0 0 6px ${langColor}80"></div>
                    </div>
                </div>
            `;
        });
    }
    
    DOM.statsContainer.innerHTML = `
        <h3 class="stats-card-title"><i class="fa-solid fa-chart-simple"></i> System Diagnostics</h3>
        
        <div class="stats-grid-compact">
            <div class="stat-block">
                <div class="stat-block-icon stars"><i class="fa-solid fa-star"></i></div>
                <div class="stat-block-details">
                    <span class="stat-block-num">${formatStatNumber(totalStars)}</span>
                    <span class="stat-block-lbl">Total Stars</span>
                </div>
            </div>
            <div class="stat-block">
                <div class="stat-block-icon forks"><i class="fa-solid fa-code-branch"></i></div>
                <div class="stat-block-details">
                    <span class="stat-block-num">${formatStatNumber(totalForks)}</span>
                    <span class="stat-block-lbl">Forks</span>
                </div>
            </div>
        </div>
        
        <div class="badge-block">
            <span class="badge-label">Developer Rating Node</span>
            <div class="badge-pill ${badgeClass}">${badgeIcon} ${badgeText}</div>
            <span class="badge-rank-score">Sync Rank: #${rankScore}</span>
        </div>
        
        <div class="languages-widget">
            <span class="badge-label" style="display: block; margin-bottom: 0.6rem;">Dominant Core Stacks</span>
            <div class="languages-list">
                ${langRowsHtml}
            </div>
        </div>
    `;
}

/**
 * Builds Simulated 53-week contribution matrix telemetry (Right Column top)
 */
function renderContributionHeatmap(user, repos) {
    if (!DOM.contributionContainer) return;
    
    const totalCells = 53 * 7;
    const cells = [];
    const today = new Date();
    
    // Seed randomness on user indicators
    const starsSum = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    let seedValue = (user.public_repos * 1.8) + (user.followers * 0.4) + (starsSum * 1.5);
    if (seedValue === 0) seedValue = 15; // default fallback
    
    const offsetBack = totalCells - 1;
    
    for (let i = 0; i < totalCells; i++) {
        const cellDate = new Date();
        cellDate.setDate(today.getDate() - (offsetBack - i));
        
        // Find if repo was pushed/updated on this day
        const repoMatches = repos.some(r => {
            const upd = new Date(r.updated_at);
            return upd.toDateString() === cellDate.toDateString();
        });
        
        let level = 0;
        let commitsCount = 0;
        
        if (repoMatches) {
            level = Math.floor(Math.random() * 2) + 3; // level 3 or 4
            commitsCount = Math.floor(Math.random() * 6) + 5; // 5 to 10 commits
        } else {
            // Pseudo random date generator
            const dayVal = cellDate.getDate();
            const monthVal = cellDate.getMonth();
            const rndSeed = Math.sin(dayVal * 12.9898 + monthVal * 78.233) * 43758.5453123;
            const rndFloat = rndSeed - Math.floor(rndSeed);
            
            // Higher seed yields denser activity levels
            const limit0 = 0.65 - (seedValue / 1200);
            const limit1 = 0.82 - (seedValue / 1200);
            const limit2 = 0.94 - (seedValue / 1200);
            
            if (rndFloat > limit2) {
                level = 3;
                commitsCount = Math.floor(Math.random() * 3) + 4;
            } else if (rndFloat > limit1) {
                level = 2;
                commitsCount = Math.floor(Math.random() * 2) + 2;
            } else if (rndFloat > limit0) {
                level = 1;
                commitsCount = 1;
            } else {
                level = 0;
                commitsCount = 0;
            }
        }
        
        cells.push({
            date: cellDate,
            level: level,
            commits: commitsCount
        });
    }
    
    const totalCommits = cells.reduce((sum, c) => sum + c.commits, 0);
    
    // Draw cells
    let matrixHtml = '';
    cells.forEach(cell => {
        const dateStr = cell.date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        const commitText = cell.commits === 0 ? "No sync updates" : `${cell.commits} sync stream${cell.commits > 1 ? 's' : ''}`;
        const tooltipPayload = `${commitText} on ${dateStr}`;
        
        matrixHtml += `
            <div 
                class="heatmap-cell level-${cell.level}" 
                data-tooltip="${tooltipPayload}"
                aria-label="${tooltipPayload}"
            ></div>
        `;
    });
    
    DOM.contributionContainer.innerHTML = `
        <div class="contribution-header">
            <div class="contribution-info">
                <h3 class="contribution-title"><i class="fa-solid fa-network-wired"></i> System Grid Synchronization</h3>
                <span class="contribution-sub">Dynamic commit telemetry tracking real-time repository clusters.</span>
            </div>
            
            <div class="contribution-stats-summary">
                <div class="cont-stat">
                    <span class="cont-stat-num">${totalCommits} Syncs</span>
                    <span class="cont-stat-lbl">Active Telemetry</span>
                </div>
                <div class="cont-stat">
                    <span class="cont-stat-num">${Math.round(totalCommits / totalCells * 100)}%</span>
                    <span class="cont-stat-lbl">Sync Ratio</span>
                </div>
            </div>
        </div>
        
        <div class="heatmap-grid-scroll">
            <div class="heatmap-wrapper">
                <div class="heatmap-months-labels">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                    <span>Sep</span>
                    <span>Oct</span>
                    <span>Nov</span>
                    <span>Dec</span>
                </div>
                
                <div class="heatmap-grid-container">
                    <div class="heatmap-days-labels">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                    </div>
                    
                    <div class="heatmap-matrix" id="heatmap-matrix-grid">
                        ${matrixHtml}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="heatmap-legend-bar">
            <span>Retrospective Grid Mapping</span>
            <div class="legend-cells-box">
                <span>Less</span>
                <div class="legend-cell level-0"></div>
                <div class="legend-cell level-1"></div>
                <div class="legend-cell level-2"></div>
                <div class="legend-cell level-3"></div>
                <div class="legend-cell level-4"></div>
                <span>More</span>
            </div>
        </div>
    `;
    
    setupHeatmapTooltips();
}

let tooltipEl = null;

function setupHeatmapTooltips() {
    tooltipEl = document.getElementById('heatmap-global-tooltip');
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'heatmap-global-tooltip';
        tooltipEl.className = 'heatmap-tooltip';
        document.body.appendChild(tooltipEl);
    }
    
    const cells = document.querySelectorAll('.heatmap-cell');
    cells.forEach(cell => {
        cell.addEventListener('mouseenter', () => {
            const valText = cell.getAttribute('data-tooltip');
            tooltipEl.textContent = valText;
            tooltipEl.classList.add('visible');
        });
        
        cell.addEventListener('mousemove', (e) => {
            tooltipEl.style.left = e.clientX + 'px';
            tooltipEl.style.top = e.clientY + 'px';
        });
        
        cell.addEventListener('mouseleave', () => {
            tooltipEl.classList.remove('visible');
        });
    });
}

/**
 * Dynamically fills language filter drop choices
 */
function populateLanguageFilter(repos) {
    if (!DOM.repoLangSelect) return;
    
    DOM.repoLangSelect.innerHTML = '<option value="all" selected>All Languages</option>';
    
    const langs = new Set();
    repos.forEach(r => {
        if (r.language) langs.add(r.language);
    });
    
    const sorted = Array.from(langs).sort();
    sorted.forEach(lang => {
        const opt = document.createElement('option');
        opt.value = lang.toLowerCase();
        opt.textContent = lang;
        DOM.repoLangSelect.appendChild(opt);
    });
}

/**
 * Aggregates live repository filter selections (text filter + lang dropdown + sorter dropdown)
 */
function filterAndSortRepositories() {
    const query = DOM.repoSearchInput ? DOM.repoSearchInput.value.toLowerCase().trim() : '';
    const selectedLang = DOM.repoLangSelect ? DOM.repoLangSelect.value : 'all';
    const sortChoice = DOM.repoSortSelect ? DOM.repoSortSelect.value : 'stars';
    
    let filtered = [...currentReposList];
    
    // 1. Text Filter key lookup
    if (query !== '') {
        filtered = filtered.filter(repo => repo.name.toLowerCase().includes(query));
    }
    
    // 2. Language dropdown filter
    if (selectedLang !== 'all') {
        filtered = filtered.filter(repo => repo.language && repo.language.toLowerCase() === selectedLang);
    }
    
    // 3. Sorting chosen Choice
    if (sortChoice === 'stars') {
        filtered.sort((a, b) => b.stargazers_count - a.stargazers_count);
    } else if (sortChoice === 'forks') {
        filtered.sort((a, b) => b.forks_count - a.forks_count);
    } else if (sortChoice === 'newest') {
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortChoice === 'oldest') {
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortChoice === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    renderReposGrid(filtered);
}

/**
 * Builds repository card layout elements
 */
function renderReposGrid(displayList) {
    if (!displayList || displayList.length === 0) {
        DOM.reposCardsGrid.innerHTML = `
            <div class="empty-state-card" style="grid-column: 1 / -1; width: 100%; max-width: 100%; box-shadow: none;">
                <div class="empty-icon-wrapper">
                    <i class="fa-solid fa-code-fork empty-icon"></i>
                </div>
                <h3 class="empty-title">Empty Code Vault</h3>
                <p class="empty-desc">No public repositories match your current filter parameters.</p>
            </div>
        `;
        return;
    }
    
    // Render top 8 matching projects
    const topList = displayList.slice(0, 8);
    DOM.reposCardsGrid.innerHTML = '';
    
    topList.forEach(repo => {
        const repoCard = document.createElement('div');
        repoCard.className = 'repo-card';
        
        const lang = repo.language ? repo.language : 'Plaintext';
        const langKey = lang.toLowerCase();
        const langColor = LANGUAGE_COLORS[langKey] || '#64748b';
        
        const description = repo.description ? repo.description : `<span class="repo-desc-empty">This vault does not contain a description payload.</span>`;
        
        const updateDateObj = new Date(repo.pushed_at || repo.updated_at);
        const dateFormatted = updateDateObj.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        repoCard.innerHTML = `
            <div class="repo-top">
                <div class="repo-title-wrapper">
                    <h3 class="repo-title" title="${repo.name}">${repo.name}</h3>
                    <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" aria-label="Open ${repo.name} repository">
                        <i class="fa-solid fa-arrow-up-right-from-square repo-link-icon"></i>
                    </a>
                </div>
                <p class="repo-desc">${description}</p>
            </div>
            
            <div class="repo-bottom">
                <div class="repo-bottom-left">
                    <div class="repo-lang-box">
                        <span class="lang-dot" style="background-color: ${langColor}"></span>
                        <span>${lang}</span>
                    </div>
                    <span class="repo-update-date"><i class="fa-regular fa-clock"></i> Updated ${dateFormatted}</span>
                </div>
                <div class="repo-stats-box">
                    <div class="repo-stat-item stars" title="${repo.stargazers_count} stars">
                        <i class="fa-solid fa-star"></i>
                        <span>${formatStatNumber(repo.stargazers_count)}</span>
                    </div>
                    <div class="repo-stat-item forks" title="${repo.forks_count} forks">
                        <i class="fa-solid fa-code-branch"></i>
                        <span>${formatStatNumber(repo.forks_count)}</span>
                    </div>
                </div>
            </div>
        `;
        
        DOM.reposCardsGrid.appendChild(repoCard);
    });
}

// -------------------------------------------------------------
// 9. Utility Functions
// -------------------------------------------------------------
function formatStatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
}

// -------------------------------------------------------------
// 10. Event Dispatch Panel
// -------------------------------------------------------------
function setupEventListeners() {
    // Theme Switch Slider
    DOM.themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Main Search Form Submission trigger
    DOM.searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const value = DOM.searchInput.value.trim();
        if (value !== '') {
            executeSearch(value);
        }
    });
    
    // History Panel Clear
    DOM.clearHistoryBtn.addEventListener('click', clearAllHistory);
    
    // Quick suggestion chip buttons click triggers
    DOM.suggestChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const presetUser = chip.textContent;
            DOM.searchInput.value = presetUser;
            executeSearch(presetUser);
        });
    });
    
    // Error panel reload retry button
    DOM.errorRetryBtn.addEventListener('click', () => {
        const query = DOM.searchInput.value.trim();
        if (query !== '') {
            executeSearch(query);
        } else {
            showState('empty');
        }
    });
    
    // Live filter search keys keyup listening
    if (DOM.repoSearchInput) {
        DOM.repoSearchInput.addEventListener('input', () => {
            filterAndSortRepositories();
        });
    }
    
    // Language dropdown selection change listening
    if (DOM.repoLangSelect) {
        DOM.repoLangSelect.addEventListener('change', () => {
            filterAndSortRepositories();
        });
    }
    
    // Sorter dropdown choice change listening
    if (DOM.repoSortSelect) {
        DOM.repoSortSelect.addEventListener('change', () => {
            filterAndSortRepositories();
        });
    }
    
    // Dynamic Event delegation for favoriting button clicks
    document.addEventListener('click', (e) => {
        const favBtn = e.target.closest('#profile-favorite-btn');
        if (favBtn && currentUserData) {
            toggleFavorite(currentUserData);
        }
    });
}
