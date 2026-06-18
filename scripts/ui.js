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
        `).join('');
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

        return `<div>${listHtml}</div>`;
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

        // Hero Spotlight (Contained)
        const heroData = trending[0];
        const hero = await API.getDetails(heroData.id, heroData.type || 'tv') || heroData;
        const heroHtml = `
            <div class="anime-hero-card" style="background-image: url('${hero.backdrop}'); cursor:pointer;" onclick="window.location.hash='#${hero.type}/${hero.id}'">
                <div class="anime-hero-content">
                    <div style="color: #ff3c5b; font-weight: bold; margin-bottom: 10px; font-size: 0.9rem;"><i class="fas fa-fire"></i> #1 Trending Now</div>
                    <h1 style="font-size: 3rem; margin-bottom: 10px; line-height: 1.1; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">${hero.title}</h1>
                    <div style="display: flex; gap: 15px; margin-bottom: 15px; font-size: 0.9rem; color: #ccc;">
                        <span>${hero.year}</span>
                        <span>16+</span>
                        <span>${hero.genres ? hero.genres.slice(0,2).join(', ') : 'Animation'}</span>
                    </div>
                    <p style="font-size: 0.95rem; line-height: 1.6; color: #bbb; margin-bottom: 25px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${hero.description}</p>
                    <div style="display: flex; gap: 15px;">
                        <button class="btn btn-primary" style="background: #ff3c5b; border-radius: 25px; padding: 10px 24px;"><i class="fas fa-play"></i> Play Now</button>
                        <button class="btn btn-secondary" style="background: rgba(255,255,255,0.1); border-radius: 25px; padding: 10px 24px;"><i class="fas fa-plus"></i> My List</button>
                    </div>
                </div>
            </div>
        `;

        let html = `<div class="anime-container">`;

        // Trending Carousel HTML snippet
        const trendingCarouselHtml = `
            <div style="margin-bottom: 0;">
                <h3 style="margin-bottom: 15px; color: #fff; font-size: 1.2rem; display: flex; justify-content: space-between;">
                    <span>🔥 Trending Now</span>
                    <span style="font-size: 0.8rem; color: #aaa; font-weight: normal; cursor: pointer;">View All <i class="fas fa-chevron-right"></i></span>
                </h3>
                <div class="carousel">
                    ${trending.slice(1, 15).map((item, index) => {
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
                    }).join('')}
                </div>
            </div>
        `;

        // Top Row: (Hero + Trending) on left, Most Viewed on right
        html += `
            <div class="anime-top-row">
                <div style="flex: 3; display: flex; flex-direction: column; gap: var(--spacing-xl); overflow: hidden;">
                    ${heroHtml}
                    ${trendingCarouselHtml}
                </div>
                <div class="anime-most-viewed">
                    <h3 style="margin-bottom: 15px; color: #fff; font-size: 1.1rem; display: flex; justify-content: space-between;">
                        <span><i class="fas fa-chart-line" style="color: #ff3c5b;"></i> Most Viewed</span>
                        <span style="font-size: 0.8rem; color: #aaa; font-weight: normal; cursor: pointer;">View All</span>
                    </h3>
                    ${UI.buildMostViewedList(popular)}
                </div>
            </div>
        `;

        // Genre Bar
        html += `
            <div class="anime-genre-bar">
                <button class="genre-tag" style="background: #ff3c5b; color: white;"><i class="fas fa-layer-group"></i> All</button>
                ${['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance', 'Sci-Fi', 'Mystery', 'Horror', 'Thriller', 'Supernatural', 'Slice of Life', 'Sports', 'Mecha', 'Historical'].map(g => `<button class="genre-tag"><i class="fas fa-star" style="color:#ff3c5b; font-size:0.6rem;"></i> ${g}</button>`).join('')}
            </div>
        `;

        // 4 Columns
        const buildCol = (title, icon, items) => {
            return `
                <div class="compact-list-col">
                    <h3 style="display:flex; justify-content:space-between; align-items:center;">
                        <span>${icon} ${title}</span>
                        <span style="font-size: 0.8rem; color: #aaa; font-weight: normal; cursor: pointer;">View All</span>
                    </h3>
                    ${items.slice(0, 5).map(item => `
                        <div class="compact-list-item" onclick="window.location.hash='#${item.type || 'movie'}/${item.id}'">
                            <img src="${item.poster}" alt="${item.title}" class="compact-thumbnail" loading="lazy">
                            <div class="compact-info">
                                <div class="compact-title">${item.title}</div>
                                <div class="compact-meta">TV • ${item.year} • <i class="fas fa-star" style="color: #ff3c5b;"></i> ${item.rating}</div>
                            </div>
                            <div class="ep-badge">EP ${Math.floor(Math.random()*12)+1}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        };

        html += `
            <section class="four-columns">
                ${buildCol('New Added', '<i class="fas fa-comment-dots" style="color:#4caf50;"></i>', recent)}
                ${buildCol('Most Popular', '<i class="fas fa-star" style="color:#ffc107;"></i>', popular)}
                ${buildCol('Most Favorite', '<i class="fas fa-fire" style="color:#ff3c5b;"></i>', topRated)}
                ${buildCol('Completed', '<i class="fas fa-check-circle" style="color:#4caf50;"></i>', completed)}
            </section>
        `;

        // Bottom Split
        html += `
            <section class="dashboard-layout">
                <div class="dashboard-sidebar">
                    <div class="compact-list-col">
                        <h3 style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                            <span><i class="fas fa-tags" style="color:#2196f3;"></i> Genres</span>
                            <span style="font-size: 0.8rem; color: #aaa; font-weight: normal; cursor: pointer;">View All</span>
                        </h3>
                        <div class="genre-cloud" style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                            ${['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance', 'Sci-Fi', 'Mystery', 'Horror', 'Thriller', 'Supernatural', 'Slice of Life', 'Sports', 'Mecha', 'Historical', 'Music'].map(g => `<button class="genre-tag" style="width:100%; text-align:left;"><i class="fas fa-circle" style="color:#ff3c5b; font-size:0.4rem; margin-right:5px;"></i> ${g}</button>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="dashboard-main">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h3 style="color: #fff; display:flex; align-items:center; gap:8px;"><i class="fas fa-star" style="color:#ffc107;"></i> Recently Updated</h3>
                        <span style="font-size: 0.8rem; color: #aaa; cursor: pointer;">View All</span>
                    </div>
                    <div class="dashboard-grid" style="margin-bottom: 3rem;">
                        ${recent.slice(5, 11).map(item => `
                            <div class="media-card" onclick="window.location.hash='#${item.type || 'movie'}/${item.id}'" style="min-width:0; width:100%;">
                                <div class="card-image-wrapper">
                                    <img src="${item.poster}" alt="${item.title}" class="card-img" loading="lazy">
                                </div>
                                <div style="padding: 10px 0;">
                                    <h4 class="card-title" style="font-size:0.9rem; margin-bottom:4px;">${item.title}</h4>
                                    <div class="card-meta" style="font-size:0.8rem; color:#aaa;">EP ${Math.floor(Math.random()*24)+1} • Today</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h3 style="color: #fff; display:flex; align-items:center; gap:8px;"><i class="fas fa-calendar-alt" style="color:#ff3c5b;"></i> Estimated Schedule</h3>
                        <span style="font-size: 0.8rem; color: #aaa; cursor: pointer;">View Full Schedule</span>
                    </div>
                    <div class="schedule-header">
                        <button class="schedule-btn active">Sun</button>
                        <button class="schedule-btn">Mon</button>
                        <button class="schedule-btn">Tue</button>
                        <button class="schedule-btn">Wed</button>
                        <button class="schedule-btn">Thu</button>
                        <button class="schedule-btn">Fri</button>
                        <button class="schedule-btn">Sat</button>
                    </div>
                    <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
                        ${trending.slice(15, 20).map((item, idx) => {
                            const times = ["08:00 AM", "09:30 AM", "11:00 AM", "01:30 PM", "03:00 PM", "05:00 PM"];
                            return `
                            <div style="display:flex; gap:10px; background:#151821; padding:10px; border-radius:8px; cursor:pointer;" onclick="window.location.hash='#${item.type || 'movie'}/${item.id}'">
                                <img src="${item.poster}" style="width:40px; height:60px; object-fit:cover; border-radius:4px;" loading="lazy">
                                <div style="overflow:hidden;">
                                    <div style="font-size:0.75rem; color:#aaa; margin-bottom:2px;">${times[idx % times.length]}</div>
                                    <div style="font-size:0.85rem; font-weight:600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
                                    <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">EP ${Math.floor(Math.random()*20)+1} <span style="background:rgba(255,255,255,0.1); padding:2px 4px; border-radius:2px; margin-left:4px;">Upcoming</span></div>
                                </div>
                            </div>
                        `;}).join('')}
                    </div>
                </div>
            </section>
        `;

        html += `</div>`;

        appContent.innerHTML = html;
        window.scrollTo(0, 0);
    },

    // --- Media Dashboard Methods (Movies & Series) ---
    renderMediaDashboard: async (mediaType = 'movie') => {
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = `<div class="loader" style="margin: 100px auto;"></div>`;

        try {
            const [popular, topRated, newReleasesData] = await Promise.all([
                mediaType === 'movie' ? API.getPopularMovies(1) : API.getPopularSeries(1),
                mediaType === 'movie' ? API.getTopRatedMovies(1) : API.getTopRatedSeries(1),
                mediaType === 'movie' ? API.getNewMovies(1) : API.getNewSeries(1)
            ]);

            // Mock "Continue Watching" using a subset of popular media
            const continueWatching = popular.slice(10, 14);

            // Hero Carousel Data
            const heroMedia = popular.slice(0, 5);
            window.moviesHeroData = heroMedia;
            window.currentMoviesHeroIndex = 0;

            const buildHeroHtml = () => {
                return `
                    <div class="movies-hero-carousel">
                        <div class="movies-hero-slides-container" id="movies-hero-slides-container">
                            ${heroMedia.map((item, index) => {
                                const bgImg = item.poster.replace('w500', 'original');
                                return `
                                <div class="movies-hero-slide ${index === 0 ? 'active' : ''}" data-index="${index}" style="background-image: url('${bgImg}');">
                                    <div class="movies-hero-gradient"></div>
                                    <div class="movies-hero-content">
                                        <div class="movies-hero-tag"><i class="fas fa-fire"></i> #${index + 1} Trending</div>
                                        <h1 class="movies-hero-title">${item.title}</h1>
                                        <div class="movies-hero-meta">
                                            <span>${item.year}</span>
                                            <span><i class="fas fa-star" style="color:#ffc107;"></i> ${item.rating}</span>
                                            <span>${Math.floor(Math.random() * 2 + 1)}h ${Math.floor(Math.random() * 59)}m</span>
                                            <span>Action, Drama, Fantasy</span>
                                            <span class="movies-hero-age">UA 16+</span>
                                        </div>
                                        <p class="movies-hero-desc">${(item.description || '').substring(0, 200)}...</p>
                                        <div class="movies-hero-buttons">
                                            <button class="btn-play-now" onclick="window.location.hash='#${mediaType}/${item.id}'"><i class="fas fa-play"></i> Play Now</button>
                                            <button class="btn-more-info" onclick="window.location.hash='#${mediaType}/${item.id}'"><i class="fas fa-info-circle"></i> More Info</button>
                                        </div>
                                    </div>
                                </div>
                            `}).join('')}
                        </div>
                        <div class="movies-hero-nav movies-hero-nav-left" onclick="UI.prevMoviesHero()"><i class="fas fa-chevron-left"></i></div>
                        <div class="movies-hero-nav movies-hero-nav-right" onclick="UI.nextMoviesHero()"><i class="fas fa-chevron-right"></i></div>
                        <div class="movies-hero-dots" id="movies-hero-dots">
                            ${heroMedia.map((_, index) => `
                                <div class="movies-hero-dot ${index === 0 ? 'active' : ''}" onclick="UI.setMoviesHero(${index})"></div>
                            `).join('')}
                        </div>
                    </div>
                `;
            };

            const buildHorizontalRow = (title, items, type) => {
                let cardsHtml = items.map(item => {
                    if (type === 'popular') {
                        return `
                            <div class="movie-card-popular" onclick="window.location.hash='#${mediaType}/${item.id}'">
                                <img src="${item.poster}" alt="${item.title}" loading="lazy">
                                <div class="movie-card-popular-rating"><i class="fas fa-star" style="color:#ffc107;"></i> ${item.rating}</div>
                            </div>
                        `;
                    } else if (type === 'toprated') {
                        return `
                            <div class="movie-card-toprated" onclick="window.location.hash='#${mediaType}/${item.id}'">
                                <img src="${item.poster}" alt="${item.title}" loading="lazy">
                                <div class="movie-card-toprated-badge">${item.rating}</div>
                                <div class="movie-card-toprated-overlay">
                                    <h4>${item.title}</h4>
                                </div>
                            </div>
                        `;
                    } else if (type === 'continue') {
                        const subtext = mediaType === 'tv' ? `S1 E${Math.floor(Math.random() * 8) + 1} • ${Math.floor(Math.random() * 50) + 10}m left` : `${Math.floor(Math.random() * 50) + 10}m left`;
                        return `
                            <div class="movie-card-continue" onclick="window.location.hash='#${mediaType}/${item.id}'">
                                <img src="${item.poster}" alt="${item.title}" loading="lazy">
                                <div class="movie-card-continue-overlay">
                                    <div class="continue-info">
                                        <h4>${item.title}</h4>
                                        <p>${subtext}</p>
                                    </div>
                                    <div class="continue-play-icon"><i class="fas fa-play"></i></div>
                                </div>
                                <div class="continue-progress-bar">
                                    <div class="continue-progress-fill" style="width: ${Math.floor(Math.random() * 80) + 10}%;"></div>
                                </div>
                            </div>
                        `;
                    } else if (type === 'newrelease') {
                        return `
                            <div class="movie-card-newrelease" onclick="window.location.hash='#${mediaType}/${item.id}'">
                                <div class="movie-card-new-badge">NEW</div>
                                <img src="${item.poster}" alt="${item.title}" loading="lazy">
                                <div class="movie-card-newrelease-overlay">
                                    <h4>${item.title}</h4>
                                    <p>${item.year}</p>
                                </div>
                            </div>
                        `;
                    }
                }).join('');

                return `
                    <div class="movies-row-container">
                        <div class="movies-row-header">
                            <h3 class="movies-row-title"><i class="${type === 'continue' ? 'far fa-play-circle' : 'fas fa-th'}"></i> ${title}</h3>
                            <span class="movies-row-view-all">View All</span>
                        </div>
                        <div class="movies-row-scroll">
                            ${cardsHtml}
                        </div>
                    </div>
                `;
            };

            const typeLabel = mediaType === 'movie' ? 'Movies' : 'TV Shows';

            let html = `
                <div class="movies-dashboard">
                    ${buildHeroHtml()}
                    <div class="movies-dashboard-content">
                        ${buildHorizontalRow(`Popular ${typeLabel}`, popular.slice(0, 10), 'popular')}
                        ${buildHorizontalRow('Top Rated', topRated.slice(0, 10), 'toprated')}
                        ${buildHorizontalRow('Continue Watching', continueWatching, 'continue')}
                        ${buildHorizontalRow('New Releases', newReleasesData.slice(0, 10), 'newrelease')}
                    </div>
                </div>
            `;

            appContent.innerHTML = html;
            window.scrollTo(0, 0);

            // Auto advance carousel
            if (window.moviesHeroInterval) clearInterval(window.moviesHeroInterval);
            window.moviesHeroInterval = setInterval(UI.nextMoviesHero, 5000);

        } catch (error) {
            console.error("Error rendering movies dashboard:", error);
            appContent.innerHTML = `<h2 style="text-align:center; padding: 100px;">Failed to load movies.</h2>`;
        }
    },

    setMoviesHero: (index) => {
        window.currentMoviesHeroIndex = index;
        const slides = document.querySelectorAll('.movies-hero-slide');
        const dots = document.querySelectorAll('.movies-hero-dot');
        if (!slides.length) return;

        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));

        slides[index].classList.add('active');
        dots[index].classList.add('active');
        
        if (window.moviesHeroInterval) {
            clearInterval(window.moviesHeroInterval);
            window.moviesHeroInterval = setInterval(UI.nextMoviesHero, 5000);
        }
    },

    nextMoviesHero: () => {
        if (!window.moviesHeroData) return;
        let next = window.currentMoviesHeroIndex + 1;
        if (next >= window.moviesHeroData.length) next = 0;
        UI.setMoviesHero(next);
    },

    prevMoviesHero: () => {
        if (!window.moviesHeroData) return;
        let prev = window.currentMoviesHeroIndex - 1;
        if (prev < 0) prev = window.moviesHeroData.length - 1;
        UI.setMoviesHero(prev);
    },

    // --- Filter Dashboard Methods ---

    renderFilterDashboard: async () => {
        // Setup state
        window.filterState = {
            query: '',
            type: 'tv', // Default
            genres: [],
            status: [],
            country: '',
            language: '',
            year: '',
            sort: 'popularity.desc',
            page: 1
        };

        const appContent = document.getElementById('app-content');
        
        const genreOptions = [
            { id: 28, label: 'Action' }, { id: 12, label: 'Adventure' }, { id: 16, label: 'Animation' }, 
            { id: 35, label: 'Comedy' }, { id: 80, label: 'Crime' }, { id: 99, label: 'Documentary' }, 
            { id: 18, label: 'Drama' }, { id: 10751, label: 'Family' }, { id: 14, label: 'Fantasy' }, 
            { id: 36, label: 'History' }, { id: 27, label: 'Horror' }, { id: 10402, label: 'Music' }, 
            { id: 9648, label: 'Mystery' }, { id: 10749, label: 'Romance' }, { id: 878, label: 'Science Fiction' }, 
            { id: 10770, label: 'TV Movie' }, { id: 53, label: 'Thriller' }, { id: 10752, label: 'War' }, 
            { id: 37, label: 'Western' }
        ];

        // Custom Dropdown Builder
        const buildDropdown = (id, title, options, type = 'checkbox') => {
            let optionsHtml = options.map(opt => `
                <label class="filter-option">
                    <input type="${type}" name="${id}" value="${opt.id}" onchange="UI.updateFilterState('${id}', '${opt.id}', this.checked, '${type}')">
                    <span class="checkmark"></span>
                    ${opt.label}
                </label>
            `).join('');

            return `
                <div class="custom-dropdown" id="dropdown-${id}">
                    <div class="dropdown-header" onclick="UI.toggleDropdown('${id}')">
                        <span>${title}</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="dropdown-panel">
                        <div class="dropdown-grid">
                            ${optionsHtml}
                        </div>
                    </div>
                </div>
            `;
        };

        let html = `
            <div class="filter-dashboard-container">
                <h1 style="color: #ff3c5b; margin-bottom: 20px; font-size: 2rem;">Filters</h1>
                
                <div class="filter-bar">
                    <div class="filter-search-box">
                        <input type="text" id="filter-search-input" placeholder="Search..." oninput="UI.debounceFilterSearch(this.value)">
                    </div>
                    ${buildDropdown('genres', 'Select genre', genreOptions)}
                    ${buildDropdown('status', 'Select status', [
                        { id: 0, label: 'Releasing' },
                        { id: 3, label: 'Completed' }
                    ])}
                    ${buildDropdown('country', 'Select country', [
                        { id: 'US', label: 'United States' },
                        { id: 'JP', label: 'Japan' },
                        { id: 'KR', label: 'South Korea' },
                        { id: 'CN', label: 'China' },
                        { id: 'GB', label: 'United Kingdom' }
                    ], 'radio')}
                    ${buildDropdown('language', 'Select language', [
                        { id: 'en', label: 'English' },
                        { id: 'ja', label: 'Japanese' },
                        { id: 'ko', label: 'Korean' },
                        { id: 'zh', label: 'Chinese' },
                        { id: 'es', label: 'Spanish' },
                        { id: 'fr', label: 'French' }
                    ], 'radio')}
                    ${buildDropdown('year', 'Select year', [
                        { id: '2026', label: '2026' },
                        { id: '2025', label: '2025' },
                        { id: '2024', label: '2024' },
                        { id: '2023', label: '2023' }
                    ], 'radio')}
                    ${buildDropdown('sort', 'Sort by', [
                        { id: 'popularity.desc', label: 'Most Popular' },
                        { id: 'vote_average.desc', label: 'Highest Rated' },
                        { id: 'primary_release_date.desc', label: 'Recently Added' }
                    ], 'radio')}
                    ${buildDropdown('type', 'Select Type', [
                        { id: 'tv', label: 'TV Shows' },
                        { id: 'anime', label: 'Anime' },
                        { id: 'movie', label: 'Movies' }
                    ], 'radio')}
                    
                    <button class="filter-btn" onclick="UI.applyFilters()"><i class="fas fa-filter"></i> Filter</button>
                </div>

                <div id="filter-results-container" class="dashboard-grid" style="margin-top: 30px;">
                    <!-- Results will be injected here -->
                </div>
                
                <div id="filter-pagination" class="pagination-container">
                    <!-- Pagination injected here -->
                </div>
            </div>
        `;

        appContent.innerHTML = html;
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-dropdown')) {
                document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('active'));
            }
        });

        // Initial load
        UI.applyFilters();
    },

    toggleDropdown: (id) => {
        const el = document.getElementById(`dropdown-${id}`);
        // Close others
        document.querySelectorAll('.custom-dropdown').forEach(d => {
            if (d !== el) d.classList.remove('active');
        });
        el.classList.toggle('active');
    },

    updateFilterState: (key, value, isChecked, type) => {
        if (type === 'radio') {
            window.filterState[key] = value;
        } else {
            // Checkbox logic
            if (!Array.isArray(window.filterState[key])) {
                window.filterState[key] = [];
            }
            if (isChecked) {
                if (!window.filterState[key].includes(value)) {
                    window.filterState[key].push(value);
                }
            } else {
                window.filterState[key] = window.filterState[key].filter(v => v !== value);
            }
        }
    },

    debounceFilterSearch: (val) => {
        clearTimeout(window.filterSearchTimeout);
        window.filterSearchTimeout = setTimeout(() => {
            window.filterState.query = val;
            window.filterState.page = 1;
            UI.applyFilters();
        }, 500);
    },

    applyFilters: async () => {
        const container = document.getElementById('filter-results-container');
        if (!container) return;
        
        container.innerHTML = `<div class="loader" style="margin: 50px auto;"></div>`;
        document.getElementById('filter-pagination').innerHTML = ''; // Clear pagination while loading
        
        // Reset to page 1 if just clicking filter button manually (optional, but good UX for manual clicks)
        
        const data = await API.discoverAdvanced(window.filterState, window.filterState.page);
        
        if (!data || !data.results || data.results.length === 0) {
            container.innerHTML = `<h3 style="text-align:center; padding: 50px; grid-column: 1 / -1; color: #aaa;">No results found. Try adjusting your filters.</h3>`;
            return;
        }

        container.innerHTML = data.results.map(item => UI.createCardHTML(item)).join('');
        
        // Render pagination
        let paginationHtml = '';
        const totalPages = data.totalPages;
        const current = window.filterState.page;
        
        const createPageBtn = (num, text, active) => 
            `<button class="page-btn ${active ? 'active' : ''}" onclick="UI.changeFilterPage(${num})">${text || num}</button>`;

        if (totalPages > 1) {
            if (current > 1) {
                paginationHtml += createPageBtn(current - 1, '<i class="fas fa-chevron-left"></i>');
            }
            
            let start = Math.max(1, current - 2);
            let end = Math.min(totalPages, current + 2);
            
            for (let i = start; i <= end; i++) {
                paginationHtml += createPageBtn(i, i, i === current);
            }
            
            if (end < totalPages) {
                paginationHtml += `<span class="page-dots">...</span>`;
                paginationHtml += createPageBtn(totalPages, totalPages, false);
            }

            if (current < totalPages) {
                paginationHtml += createPageBtn(current + 1, '<i class="fas fa-chevron-right"></i>');
            }
        }
        
        document.getElementById('filter-pagination').innerHTML = paginationHtml;
    },

    changeFilterPage: (pageNum) => {
        window.filterState.page = pageNum;
        UI.applyFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
