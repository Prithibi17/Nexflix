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
        const hero = await API.getDetails(heroData.id, heroData.type) || heroData;
        
        let html = UI.renderHeroBannerHtml(hero);

        html += UI.buildCarousel('Trending Now', trending.slice(1), 'trending'); // Skip first since it's hero
        html += UI.buildCarousel('Popular Movies', popularMovies.slice(0, 20), 'movies');
        html += UI.buildCarousel('Popular TV Shows', popularSeries.slice(0, 20), 'series');
        html += UI.buildCarousel('Action', action, 'action');
        html += UI.buildCarousel('Comedy', comedy, 'comedy');
        html += UI.buildCarousel('Sci-Fi', scifi, 'scifi');
        html += UI.buildCarousel('Anime', anime, 'anime');

        appContent.innerHTML = html;
        window.scrollTo(0, 0);
        
        // Setup dynamic rotation for Home
        UI.setupHeroCarousel(trending);
    },

    renderHeroBannerHtml: (hero) => {
        return `
            <!-- Hero Section -->
            <section class="hero" id="hero-banner" style="background-image: url('${hero.backdrop}'); transition: background-image 1s ease-in-out;">
                <div class="hero-content">
                    <h1 class="hero-title" id="hero-title">${hero.title}</h1>
                    <div class="hero-meta" id="hero-meta">
                        <span class="meta-item">${hero.year}</span>
                        <span class="meta-item"><i class="fas fa-star rating"></i> ${hero.rating}</span>
                        <span class="meta-item">${hero.runtime || 'N/A'}</span>
                        <span class="meta-item">${hero.genres ? hero.genres.join(', ') : ''}</span>
                    </div>
                    <p class="hero-desc" id="hero-desc">${hero.description}</p>
                    <div class="hero-actions" id="hero-actions">
                        <button class="btn btn-primary" onclick="Player.play(${hero.id}, '${hero.type || 'movie'}')">
                            <i class="fas fa-play"></i> Play Now
                        </button>
                        <a href="#${hero.type || 'movie'}/${hero.id}" class="btn btn-secondary">
                            <i class="fas fa-info-circle"></i> More Info
                        </a>
                    </div>
                </div>
            </section>
        `;
    },

    setupHeroCarousel: async (items) => {
        if (!items || items.length === 0) return;
        
        let currentIndex = 0;
        const bannerItems = items.slice(0, 5); // take top 5
        
        // Cache detailed info
        const detailedItems = await Promise.all(bannerItems.map(async item => {
            return await API.getDetails(item.id, item.type || 'movie') || item;
        }));

        if (window.heroIntervalId) clearInterval(window.heroIntervalId);

        window.heroIntervalId = setInterval(() => {
            currentIndex = (currentIndex + 1) % detailedItems.length;
            const hero = detailedItems[currentIndex];
            
            const heroBanner = document.getElementById('hero-banner');
            const heroTitle = document.getElementById('hero-title');
            const heroMeta = document.getElementById('hero-meta');
            const heroDesc = document.getElementById('hero-desc');
            const heroActions = document.getElementById('hero-actions');
            
            if (!heroBanner) {
                clearInterval(window.heroIntervalId);
                return;
            }

            heroBanner.style.backgroundImage = `url('${hero.backdrop}')`;
            heroTitle.innerText = hero.title;
            heroMeta.innerHTML = `
                <span class="meta-item">${hero.year}</span>
                <span class="meta-item"><i class="fas fa-star rating"></i> ${hero.rating}</span>
                <span class="meta-item">${hero.runtime || 'N/A'}</span>
                <span class="meta-item">${hero.genres ? hero.genres.join(', ') : ''}</span>
            `;
            heroDesc.innerText = hero.description;
            heroActions.innerHTML = `
                <button class="btn btn-primary" onclick="Player.play(${hero.id}, '${hero.type || 'movie'}')">
                    <i class="fas fa-play"></i> Play Now
                </button>
                <a href="#${hero.type || 'movie'}/${hero.id}" class="btn btn-secondary">
                    <i class="fas fa-info-circle"></i> More Info
                </a>
            `;
        }, 10000); // 10 seconds
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
        
        let extraHtml = '';
        if (type === 'tv' && media.seasons && media.seasons.length > 0) {
            // Find season 1 or the first valid season
            const season = media.seasons.find(s => s.season_number > 0) || media.seasons[0];
            const episodes = await API.getEpisodes(id, season.season_number);
            if (episodes && episodes.length > 0) {
                extraHtml = UI.buildEpisodeCarousel(`Season ${season.season_number} Episodes`, episodes, id);
            }
        } else if (type === 'movie' && media.belongs_to_collection) {
            const collectionParts = await API.getCollection(media.belongs_to_collection.id);
            if (collectionParts && collectionParts.length > 0) {
                extraHtml = UI.buildCarousel('The Collection', collectionParts);
            }
        }

        // Fetch recommendations (fetch 2 pages to make the horizontal scroll longer)
        const [recPage1, recPage2] = await Promise.all([
            API.getRecommendations(id, type, 1),
            API.getRecommendations(id, type, 2)
        ]);
        
        let recommendations = [];
        if (recPage1) recommendations = recommendations.concat(recPage1);
        if (recPage2) recommendations = recommendations.concat(recPage2);
        
        // Fallback to trending if no recommendations exist for this specific title
        if (recommendations.length === 0) {
            recommendations = await API.getTrending();
        }

        html += extraHtml + UI.buildCarousel('More Like This', recommendations);

        appContent.innerHTML = html;
        window.scrollTo(0, 0);
    },

    buildEpisodeCarousel: (title, episodes, tvId) => {
        if (!episodes || episodes.length === 0) return '';
        
        let cards = episodes.map(ep => `
            <div class="episode-card" onclick="Player.play(${tvId}, 'tv', 1, ${ep.episode_number})">
                <div class="episode-image-wrapper">
                    <img src="${ep.still}" alt="${ep.title}" class="card-img" loading="lazy">
                </div>
                <div class="episode-info">
                    <h5 class="episode-title">${ep.episode_number}. ${ep.title}</h5>
                    <span class="episode-runtime">${ep.runtime}</span>
                </div>
            </div>
        `).join('');

        return `
            <section class="content-row">
                <div class="row-header">
                    <h3 class="row-title">${title}</h3>
                </div>
                <div class="carousel">
                    ${cards}
                </div>
            </section>
        `;
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
        
        let heroHtml = '';
        if (items.length > 0) {
            const heroData = items[0];
            const hero = await API.getDetails(heroData.id, heroData.type || 'movie') || heroData;
            heroHtml = UI.renderHeroBannerHtml(hero);
        }
        
        appContent.innerHTML = `
            ${heroHtml}
            <div class="section-padding" style="padding-top: ${heroHtml ? '40px' : '100px'};">
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
        
        if (items.length > 0) {
            UI.setupHeroCarousel(items);
        }
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
        }).join('');
    },

    // --- Anime Dashboard Specific Rendering ---

    buildNumberedCarousel: (title, items) => {
        if (!items || items.length === 0) return '';
        let cards = items.map((item, index) => {
            const num = (index + 1).toString().padStart(2, '0');
            return `
                <div class="media-card numbered-card" data-number="${num}" onclick="window.location.hash='#${item.type || 'movie'}/${item.id}'">
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
        }).join('');

        return `
            <section class="content-row" style="margin-top: 2rem;">
                <div class="row-header">
                    <h3 class="row-title" style="color: var(--accent-color);">${title}</h3>
                </div>
                <div class="carousel">
                    ${cards}
                </div>
            </section>
        `;
    },

    buildCompactList: (title, items) => {
        if (!items || items.length === 0) return '';
        let listHtml = items.slice(0, 5).map(item => `
            <div class="compact-list-item" onclick="window.location.hash='#${item.type || 'movie'}/${item.id}'">
                <img src="${item.poster}" alt="${item.title}" class="compact-thumbnail" loading="lazy">
                <div class="compact-info">
                    <div class="compact-title">${item.title}</div>
                    <div class="compact-meta">TV • ${item.year} • <i class="fas fa-star rating" style="font-size: 0.7rem;"></i> ${item.rating}</div>
                </div>
            </div>
        `).join('');

        return `
            <div class="compact-list-col">
                <h3>${title}</h3>
                ${listHtml}
            </div>
        `;
    },

    buildGenreCloud: () => {
        const genres = ['Action', 'Adventure', 'Cars', 'Comedy', 'Dementia', 'Demons', 'Drama', 'Ecchi', 'Fantasy', 'Game', 'Harem', 'Historical', 'Horror', 'Josei', 'Kids', 'Magic', 'Martial Arts', 'Mecha', 'Military', 'Music', 'Mystery', 'Parody', 'Police', 'Psychological'];
        return `
            <div>
                <h3 style="color: var(--accent-color); margin-bottom: 1rem;">Genres</h3>
                <div class="genre-cloud" style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 8px;">
                    ${genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                </div>
            </div>
        `;
    },

    buildMostViewedList: (items) => {
        if (!items || items.length === 0) return '';
        let listHtml = items.slice(0, 10).map((item, index) => {
            const num = (index + 1).toString().padStart(2, '0');
            return `
                <div class="most-viewed-item" onclick="window.location.hash='#${item.type || 'movie'}/${item.id}'">
                    <div class="most-viewed-rank">${num}</div>
                    <img src="${item.poster}" alt="${item.title}" class="compact-thumbnail" loading="lazy">
                    <div class="compact-info">
                        <div class="compact-title">${item.title}</div>
                        <div class="compact-meta"><i class="fas fa-eye"></i> ${Math.floor(Math.random() * 900) + 100}k • <i class="fas fa-heart" style="color:var(--accent-color);"></i> ${Math.floor(Math.random() * 50) + 10}k</div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div style="margin-top: 2rem;">
                <h3 style="margin-bottom: 1rem;">Most Viewed</h3>
                <div style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 8px;">
                    ${listHtml}
                </div>
            </div>
        `;
    },

    renderAnimeDashboard: async () => {
        UI.showLoading();
        const appContent = document.getElementById('app-content');
        
        // Fetch massive dataset
        const [trending, recent, popular, topRated, completed] = await Promise.all([
            API.getAnimeTrending(),
            API.getAnimeRecent(),
            API.getAnimePopular(),
            API.getAnimeTopRated(),
            API.getAnimeCompleted()
        ]);

        if (!trending || trending.length === 0) {
            appContent.innerHTML = `<h2 style="text-align:center; padding: 100px;">Failed to load Anime data.</h2>`;
            return;
        }

        // Hero Spotlight
        const heroData = trending[0];
        const hero = await API.getDetails(heroData.id, heroData.type || 'tv') || heroData;
        let html = UI.renderHeroBannerHtml(hero);

        // Trending Row (Numbered)
        html += UI.buildNumberedCarousel('Trending', trending.slice(1, 20));

        // 4-Column Quick Lists
        html += `
            <section class="four-columns">
                ${UI.buildCompactList('New Added', recent)}
                ${UI.buildCompactList('Most Popular', popular)}
                ${UI.buildCompactList('Most Favorite', topRated)}
                ${UI.buildCompactList('Completed', completed)}
            </section>
        `;

        // Main Content / Sidebar Split
        html += `
            <section class="dashboard-layout">
                <div class="dashboard-main">
                    <h3 style="color: var(--accent-color); margin-bottom: 1rem;">Recently Updated</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--spacing-md); margin-bottom: 3rem;">
                        ${recent.slice(5, 17).map(item => UI.createCardHTML(item)).join('')}
                    </div>
                    
                    <h3 style="margin-bottom: 1rem;">Estimated Schedule</h3>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 2rem;">
                        <button class="btn btn-primary">Sun</button>
                        <button class="btn btn-secondary">Mon</button>
                        <button class="btn btn-secondary">Tue</button>
                        <button class="btn btn-secondary">Wed</button>
                        <button class="btn btn-secondary">Thu</button>
                        <button class="btn btn-secondary">Fri</button>
                        <button class="btn btn-secondary">Sat</button>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--spacing-md);">
                        ${trending.slice(15, 20).map(item => UI.createCardHTML(item)).join('')}
                    </div>
                </div>
                <div class="dashboard-sidebar">
                    ${UI.buildGenreCloud()}
                    ${UI.buildMostViewedList(popular)}
                </div>
            </section>
        `;

        appContent.innerHTML = html;
        window.scrollTo(0, 0);
        UI.setupHeroCarousel(trending);
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
