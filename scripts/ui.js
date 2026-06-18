// ui.js - DOM manipulation and rendering functions with async API integration

const UI = {
    showLoading: () => {
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 70vh;">
                <div class="loader"></div>
            </div>
        `;
    },

    renderHome: async () => {
        UI.showLoading();
        const appContent = document.getElementById('app-content');
        
        // Fetch data concurrently
        const [trending, popularMovies, popularSeries, anime, action, comedy, scifi] = await Promise.all([
            API.getTrending(),
            API.getPopularMovies(),
            API.getPopularSeries(),
            API.getAnime(),
            API.getActionMovies(),
            API.getComedyMovies(),
            API.getSciFiMovies()
        ]);

        if (!trending || trending.length === 0) {
            appContent.innerHTML = `<h2 style="text-align:center; padding: 100px;">Failed to load data.</h2>`;
            return;
        }

        // Use the first trending item as the Hero
        const heroData = trending[0];
        // Fetch full details for the hero to get genres/runtime
        const hero = await API.getDetails(heroData.id, heroData.type) || heroData;
        
        let html = `
            <!-- Hero Section -->
            <section class="hero" style="background-image: url('${hero.backdrop}');">
                <div class="hero-content">
                    <h1 class="hero-title">${hero.title}</h1>
                    <div class="hero-meta">
                        <span class="meta-item">${hero.year}</span>
                        <span class="meta-item"><i class="fas fa-star rating"></i> ${hero.rating}</span>
                        <span class="meta-item">${hero.runtime || 'N/A'}</span>
                        <span class="meta-item">${hero.genres ? hero.genres.join(', ') : ''}</span>
                    </div>
                    <p class="hero-desc">${hero.description}</p>
                    <div class="hero-actions">
                        <button class="btn btn-primary" onclick="Player.play(${hero.id}, '${hero.type}')">
                            <i class="fas fa-play"></i> Play Now
                        </button>
                        <a href="#movie/${hero.id}" class="btn btn-secondary">
                            <i class="fas fa-info-circle"></i> More Info
                        </a>
                    </div>
                </div>
            </section>
        `;

        html += UI.buildCarousel('Trending Now', trending.slice(1), 'trending'); // Skip first since it's hero
        html += UI.buildCarousel('Popular Movies', popularMovies.slice(0, 20), 'movies');
        html += UI.buildCarousel('Popular TV Shows', popularSeries.slice(0, 20), 'series');
        html += UI.buildCarousel('Action', action, 'action');
        html += UI.buildCarousel('Comedy', comedy, 'comedy');
        html += UI.buildCarousel('Sci-Fi', scifi, 'scifi');
        html += UI.buildCarousel('Anime', anime, 'anime');

        appContent.innerHTML = html;
        window.scrollTo(0, 0);
    },

    buildCarousel: (title, items, viewAllRoute = '') => {
        if (!items || items.length === 0) return '';
        
        let cards = items.map(item => UI.createCardHTML(item)).join('');
        
        let viewAllHtml = viewAllRoute ? `<a href="#${viewAllRoute}" class="view-all">View All</a>` : '';

        return `
            <section class="content-row">
                <div class="row-header">
                    <h3 class="row-title">${title}</h3>
                    ${viewAllHtml}
                </div>
                <div class="carousel">
                    ${cards}
                </div>
            </section>
        `;
    },

    createCardHTML: (item) => {
        return `
            <div class="media-card" onclick="window.location.hash='#${item.type || 'movie'}/${item.id}'">
                <div class="card-image-wrapper">
                    <img src="${item.poster}" alt="${item.title}" class="card-img" loading="lazy">
                </div>
                <div class="card-overlay">
                    <h4 class="card-title">${item.title}</h4>
                    <div class="card-meta">
                        <span>${item.year}</span>
                        <span><i class="fas fa-star rating"></i> ${item.rating}</span>
                    </div>
                </div>
            </div>
        `;
    },

    renderDetail: async (id, type) => {
        UI.showLoading();
        const appContent = document.getElementById('app-content');
        const media = await API.getDetails(id, type);

        if (!media) {
            appContent.innerHTML = `<h2 style="text-align:center; padding: 100px;">Media not found.</h2>`;
            return;
        }

        let html = `
            <section class="detail-hero" style="background-image: url('${media.backdrop}');">
                <div class="detail-content">
                    <img src="${media.poster}" alt="${media.title}" class="detail-poster">
                    <div class="detail-info">
                        <h1 class="detail-title">${media.title}</h1>
                        <div class="detail-meta">
                            <span>${media.year}</span>
                            <span>•</span>
                            <span>${media.runtime}</span>
                            <span>•</span>
                            <span><i class="fas fa-star rating"></i> ${media.rating}</span>
                        </div>
                        <p class="detail-overview">${media.description}</p>
                        
                        <div class="detail-cast">
                            <p><strong>Genres:</strong> <span>${media.genres.join(', ')}</span></p>
                            <p><strong>Director:</strong> <span>${media.director}</span></p>
                            <p><strong>Cast:</strong> <span>${media.cast}</span></p>
                        </div>
                        
                        <div class="hero-actions" style="margin-top: 2rem;">
                            <button class="btn btn-primary" onclick="Player.play(${media.id}, '${type}')">
                                <i class="fas fa-play"></i> Play Now
                            </button>
                            <button class="btn btn-secondary">
                                <i class="fas fa-plus"></i> Add to My List
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            <div style="padding-top: 4rem;"></div>
        `;
        
        // Add recommendations (just use trending for now to simulate)
        const trending = await API.getTrending();
        html += UI.buildCarousel('More Like This', trending);

        appContent.innerHTML = html;
        window.scrollTo(0, 0);
    },
    
    renderGrid: async (title, fetchFunction) => {
        UI.showLoading();
        const appContent = document.getElementById('app-content');
        
        // The fetchFunction is executed via App router passing page 1
        const items = await fetchFunction(1);
        
        if (!items || items.length === 0) {
            appContent.innerHTML = `<h2 style="text-align:center; padding: 100px;">No items found.</h2>`;
            return;
        }
        
        let cards = items.map(item => UI.createCardHTML(item)).join('');
        
        appContent.innerHTML = `
            <div class="section-padding" style="padding-top: 100px;">
                <h2 style="margin-bottom: var(--spacing-lg);">${title}</h2>
                <div id="grid-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--spacing-md);">
                    ${cards}
                </div>
                <div id="grid-loader" style="display: none; padding: 40px; text-align: center;">
                    <div class="loader"></div>
                </div>
            </div>
        `;
        window.scrollTo(0, 0);
    },

    appendGridItems: (items) => {
        const gridContainer = document.getElementById('grid-container');
        if (!gridContainer || !items) return;
        
        const html = items.map(item => UI.createCardHTML(item)).join('');
        gridContainer.insertAdjacentHTML('beforeend', html);
    },

    toggleGridLoader: (show) => {
        const loader = document.getElementById('grid-loader');
        if (loader) loader.style.display = show ? 'block' : 'none';
    },

    renderSearchResults: (items) => {
        const resultsContainer = document.getElementById('search-results');
        if (!items || items.length === 0) {
            resultsContainer.innerHTML = '<p>No results found.</p>';
            return;
        }

        resultsContainer.innerHTML = items.map(item => `
            <div class="media-card" onclick="document.getElementById('search-overlay').classList.remove('active'); window.location.hash='#${item.type || 'movie'}/${item.id}'">
                <div class="card-image-wrapper">
                    <img src="${item.poster}" alt="${item.title}" class="card-img" loading="lazy">
                </div>
                <div class="card-overlay">
                    <h4 class="card-title">${item.title}</h4>
                    <div class="card-meta">
                        <span>${item.year}</span>
                        <span><i class="fas fa-star rating"></i> ${item.rating}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
};

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Search Overlay Logic
const searchOverlay = document.getElementById('search-overlay');
const searchInput = document.getElementById('search-input');
let searchTimeout;

document.querySelector('.search-btn').addEventListener('click', () => {
    searchOverlay.classList.add('active');
    searchInput.focus();
    document.body.style.overflow = 'hidden';
});

document.querySelector('.close-search').addEventListener('click', () => {
    searchOverlay.classList.remove('active');
    document.body.style.overflow = '';
});

// Debounced Search Input
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        document.getElementById('search-results').innerHTML = '';
        return;
    }
    
    searchTimeout = setTimeout(async () => {
        document.getElementById('search-results').innerHTML = '<div class="loader"></div>';
        const results = await API.search(query);
        UI.renderSearchResults(results);
    }, 500);
});
