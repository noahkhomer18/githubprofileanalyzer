// GitHub API configuration
const GITHUB_API_BASE = 'https://api.github.com';
const REPOS_PER_PAGE = 100; // Maximum repos to analyze

// Language colors for tech stack visualization
const LANGUAGE_COLORS = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#2b7489',
    'Python': '#3572A5',
    'Java': '#b07219',
    'C++': '#f34b7d',
    'C#': '#178600',
    'Go': '#00ADD8',
    'Rust': '#dea584',
    'PHP': '#4F5D95',
    'Ruby': '#701516',
    'Swift': '#ffac45',
    'Kotlin': '#F18E33',
    'Dart': '#00B4AB',
    'Scala': '#c22d40',
    'R': '#198CE7',
    'MATLAB': '#e16737',
    'Shell': '#89e051',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Vue': '#2c3e50',
    'React': '#61dafb',
    'Angular': '#dd0031',
    'Svelte': '#ff3e00',
    'Solidity': '#363636',
    'Assembly': '#6E4C13',
    'C': '#555555',
    'Objective-C': '#438eff',
    'Perl': '#0298c3',
    'Lua': '#000080',
    'Haskell': '#5D4F85',
    'Clojure': '#db5855',
    'Elixir': '#6e4a7e',
    'Erlang': '#B83998',
    'F#': '#b845fc',
    'OCaml': '#3be133',
    'Racket': '#3c5caa',
    'Scheme': '#1f4f79',
    'Prolog': '#74283c',
    'COBOL': '#d4d4d4',
    'Fortran': '#4d41b1',
    'Ada': '#02f88c',
    'Lisp': '#3fb68b',
    'Groovy': '#e69f56',
    'PowerShell': '#012456',
    'Batchfile': '#C1F12E',
    'Makefile': '#427819',
    'Dockerfile': '#384d54',
    'YAML': '#cb171e',
    'JSON': '#000000',
    'Markdown': '#083fa1',
    'TeX': '#3D6117',
    'Jupyter Notebook': '#DA5B0B',
    'Vim script': '#199f4b',
    'Emacs Lisp': '#c065db',
    'VimL': '#199f4b',
    'Nix': '#7e7eff',
    'Nim': '#ffc200',
    'Crystal': '#000100',
    'Zig': '#ec915c',
    'V': '#4f87c4',
    'Carbon': '#5E8C31',
    'Mojo': '#ff4c4c',
    'default': '#6f42c1'
};

class GitHubAnalyzer {
    constructor() {
        this.initializeEventListeners();
        this.currentUser = null;
    }

    initializeEventListeners() {
        const searchBtn = document.getElementById('search-btn');
        const usernameInput = document.getElementById('username-input');

        searchBtn.addEventListener('click', () => this.searchUser());
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchUser();
            }
        });
    }

    async searchUser() {
        const username = document.getElementById('username-input').value.trim();
        
        if (!username) {
            this.showError('Please enter a GitHub username');
            return;
        }

        this.showLoading();
        this.hideError();
        this.hideProfile();

        try {
            const userData = await this.fetchUserProfile(username);
            const reposData = await this.fetchUserRepositories(username);
            
            this.currentUser = { ...userData, repositories: reposData };
            this.displayProfile(this.currentUser);
            this.analyzeTechStack(this.currentUser);
            this.displayRepositories(this.currentUser.repositories);
            
        } catch (error) {
            console.error('Error:', error);
            this.showError(error.message || 'Failed to fetch user data');
        } finally {
            this.hideLoading();
        }
    }

    async fetchUserProfile(username) {
        const response = await fetch(`${GITHUB_API_BASE}/users/${username}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('User not found. Please check the username and try again.');
            } else if (response.status === 403) {
                throw new Error('Rate limit exceeded. Please try again later.');
            } else {
                throw new Error(`Failed to fetch user profile (${response.status})`);
            }
        }

        return await response.json();
    }

    async fetchUserRepositories(username) {
        const response = await fetch(
            `${GITHUB_API_BASE}/users/${username}/repos?per_page=${REPOS_PER_PAGE}&sort=updated`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch repositories');
        }

        return await response.json();
    }

    displayProfile(user) {
        // Update profile information
        document.getElementById('avatar').src = user.avatar_url;
        document.getElementById('display-name').textContent = user.name || user.login;
        document.getElementById('username').textContent = `@${user.login}`;
        document.getElementById('bio').textContent = user.bio || 'No bio available';
        document.getElementById('followers-count').textContent = user.followers;
        document.getElementById('following-count').textContent = user.following;
        document.getElementById('repos-count').textContent = user.public_repos;

        this.showProfile();
    }

    analyzeTechStack(user) {
        const languageStats = {};
        let totalBytes = 0;

        // Count languages from repositories
        user.repositories.forEach(repo => {
            if (repo.language && !repo.fork) {
                const language = repo.language;
                if (!languageStats[language]) {
                    languageStats[language] = { count: 0, bytes: 0 };
                }
                languageStats[language].count++;
                // Estimate bytes based on repo size (stars as proxy for size)
                const estimatedBytes = (repo.stargazers_count + 1) * 1000;
                languageStats[language].bytes += estimatedBytes;
                totalBytes += estimatedBytes;
            }
        });

        // Calculate percentages and sort by usage
        const techStack = Object.entries(languageStats)
            .map(([language, stats]) => ({
                language,
                count: stats.count,
                percentage: totalBytes > 0 ? (stats.bytes / totalBytes) * 100 : 0,
                color: LANGUAGE_COLORS[language] || LANGUAGE_COLORS.default
            }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 10); // Top 10 languages

        this.displayTechStack(techStack);
    }

    displayTechStack(techStack) {
        const techStackContainer = document.getElementById('tech-stack');
        techStackContainer.innerHTML = '';

        if (techStack.length === 0) {
            techStackContainer.innerHTML = '<p class="no-data">No language data available</p>';
            return;
        }

        techStack.forEach(tech => {
            const techItem = document.createElement('div');
            techItem.className = 'tech-item';
            techItem.innerHTML = `
                <div class="tech-name">${tech.language}</div>
                <div class="tech-percentage">${tech.percentage.toFixed(1)}%</div>
                <div class="tech-bar">
                    <div class="tech-bar-fill" style="width: ${tech.percentage}%; background-color: ${tech.color}"></div>
                </div>
            `;
            techStackContainer.appendChild(techItem);
        });
    }

    displayRepositories(repositories) {
        const reposContainer = document.getElementById('repositories');
        reposContainer.innerHTML = '';

        if (repositories.length === 0) {
            reposContainer.innerHTML = '<p class="no-data">No repositories found</p>';
            return;
        }

        // Sort by stars and forks
        const sortedRepos = repositories
            .sort((a, b) => (b.stargazers_count + b.forks_count) - (a.stargazers_count + a.forks_count))
            .slice(0, 12); // Show top 12 repos

        sortedRepos.forEach(repo => {
            const repoCard = document.createElement('div');
            repoCard.className = 'repo-card';
            
            const languageColor = repo.language ? (LANGUAGE_COLORS[repo.language] || LANGUAGE_COLORS.default) : 'transparent';
            
            repoCard.innerHTML = `
                <div class="repo-name">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208v-1.44A1.5 1.5 0 0 1 4.5 6h8zM5 12.25v-3.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0z"/>
                    </svg>
                    <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
                </div>
                <div class="repo-description">${repo.description || 'No description available'}</div>
                <div class="repo-meta">
                    ${repo.language ? `<span><div class="repo-language" style="background-color: ${languageColor}"></div>${repo.language}</span>` : ''}
                    <span>⭐ ${repo.stargazers_count}</span>
                    <span>🍴 ${repo.forks_count}</span>
                    <span>📅 ${new Date(repo.updated_at).toLocaleDateString()}</span>
                </div>
            `;
            
            reposContainer.appendChild(repoCard);
        });
    }

    // UI State Management
    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showError(message) {
        const errorElement = document.getElementById('error');
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = message;
        errorElement.classList.remove('hidden');
    }

    hideError() {
        document.getElementById('error').classList.add('hidden');
    }

    showProfile() {
        document.getElementById('profile-section').classList.remove('hidden');
    }

    hideProfile() {
        document.getElementById('profile-section').classList.add('hidden');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new GitHubAnalyzer();
});

// Add some additional styling for better visual feedback
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add focus styles for better accessibility
    const searchInput = document.getElementById('username-input');
    searchInput.addEventListener('focus', () => {
        searchInput.parentElement.style.transform = 'scale(1.02)';
    });
    
    searchInput.addEventListener('blur', () => {
        searchInput.parentElement.style.transform = 'scale(1)';
    });
});
