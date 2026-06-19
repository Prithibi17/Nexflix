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
        let relatedShows = [];
        if (type === 'tv') {
            // Fetch related shows if it's an Animation/Anime to link split sequels
            if (media.genres.some(g => g === 'Animation' || g === 'Anime')) {
                relatedShows = await API.getRelatedAnimeShows(media.title, id);
            }
            
            if ((media.seasons && media.seasons.length > 0) || relatedShows.length > 0) {
                let targetSeasonNum = 1;
                if (media.seasons && media.seasons.length > 0) {
                    if (media.next_episode_to_air) targetSeasonNum = media.next_episode_to_air.season_number;
                    else if (media.last_episode_to_air) targetSeasonNum = media.last_episode_to_air.season_number;
                    else {
                        const valid = media.seasons.filter(s => s.season_number > 0);
                        if (valid.length > 0) targetSeasonNum = valid[valid.length - 1].season_number;
                    }
                }
                extraHtml = UI.buildSeasonSection(media.seasons || [], targetSeasonNum, id, relatedShows);
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

        if (type === 'tv' && media.seasons && media.seasons.length > 0) {
            let targetSeasonNum = 1;
            if (media.next_episode_to_air) targetSeasonNum = media.next_episode_to_air.season_number;
            else if (media.last_episode_to_air) targetSeasonNum = media.last_episode_to_air.season_number;
            else {
                const valid = media.seasons.filter(s => s.season_number > 0);
                if (valid.length > 0) targetSeasonNum = valid[valid.length - 1].season_number;
            }
            UI.loadSeasonEpisodes(id, targetSeasonNum);
        }
    },

    buildSeasonSection: (seasons, currentSeasonNum, tvId, relatedShows = []) => {
        return `
            <section class="content-row" id="season-episodes-section">
                <div class="row-header" style="display: flex; gap: 15px; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0;">Episodes</h3>
                    <select id="episode-range-selector" class="season-selector" style="display: none; background: #1c202a; color: #fff; border: 1px solid rgba(139, 124, 255,0.5); padding: 8px 15px; border-radius: 6px; font-size: 1.1rem; font-weight: bold; outline: none; cursor: pointer;" onchange="UI.renderEpisodeChunk(${tvId}, this.value)">
                    </select>
                </div>
                <div class="carousel" id="episodes-container">
                    <!-- Episodes injected here -->
                </div>
            </section>
        `;
    },

    handleSeasonDropdownChange: (tvId, value) => {
        if (value.startsWith('show_')) {
            const showId = value.replace('show_', '');
            App.navigate('details', { type: 'tv', id: showId });
        } else if (value.startsWith('season_')) {
            const seasonNum = value.replace('season_', '');
            UI.loadSeasonEpisodes(tvId, seasonNum);
        }
    },

    loadSeasonEpisodes: async (tvId, seasonNum) => {
        const container = document.getElementById('episodes-container');
        if (container) container.innerHTML = '<div class="loader" style="margin: 20px auto;"></div>';
        
        const episodes = await API.getEpisodes(tvId, seasonNum);
        window.currentSeasonEpisodes = episodes;
        
        const rangeSelector = document.getElementById('episode-range-selector');
        if (episodes && episodes.length > 100) {
            rangeSelector.style.display = 'block';
            let options = '';
            for (let i = 0; i < episodes.length; i += 100) {
                let start = i + 1;
                let end = Math.min(i + 100, episodes.length);
                options += `<option value="${i}">${start} - ${end}</option>`;
            }
            rangeSelector.innerHTML = options;
            rangeSelector.value = 0;
            UI.renderEpisodeChunk(tvId, 0);
        } else {
            if (rangeSelector) rangeSelector.style.display = 'none';
            UI.renderEpisodeChunk(tvId, 0, episodes ? episodes.length : 100);
        }
    },

    renderEpisodeChunk: (tvId, startIndex, chunkSize = 100) => {
        const episodes = window.currentSeasonEpisodes;
        if (!episodes || episodes.length === 0) {
            const container = document.getElementById('episodes-container');
            if (container) container.innerHTML = '<p style="color: #aaa; margin-top: 10px;">No episodes found for this season.</p>';
            return;
        }
        
        startIndex = parseInt(startIndex);
        const chunk = episodes.slice(startIndex, startIndex + chunkSize);
        
        let cards = chunk.map(ep => `
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
        
        const container = document.getElementById('episodes-container');
        if (container) {
            container.innerHTML = cards;
            // Scroll to the start of the carousel
            container.scrollLeft = 0;
        }
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

    renderNavSearchResults: (items, query, context) => {
        const dropdown = document.getElementById('nav-search-dropdown');
        if (!items || items.length === 0) {
            dropdown.innerHTML = `<div class="nav-search-no-results">No results for "${query}" in ${context}</div>`;
            return;
        }

        dropdown.innerHTML = items.map(item => `
            <a href="#${item.type || 'movie'}/${item.id}" class="nav-search-result-item" onclick="document.getElementById('nav-search-dropdown').classList.remove('active')">
                <img src="${item.poster}" alt="${item.title}" loading="lazy">
                <div class="nav-search-result-info">
                    <div class="nav-search-result-title">${item.title}</div>
                    <div class="nav-search-result-meta">${item.year} • <i class="fas fa-star" style="color:#ffc107;"></i> ${item.rating}</div>
                </div>
            </a>
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
        window.animeTrendingData = trending;

        if (!trending || trending.length === 0) {
            appContent.innerHTML = `<h2 style="text-align:center; padding: 100px;">Failed to load Anime data.</h2>`;
            return;
        }

        // Hero Carousel Data
        const combinedTrendingAndPopular = [...trending, ...popular];
        const uniqueHeroList = Array.from(new Map(combinedTrendingAndPopular.map(item => [item.id, item])).values()).slice(0, 10);
        window.animeHeroData = await Promise.all(uniqueHeroList.map(async (item) => await API.getDetails(item.id, item.type || 'tv') || item));
        window.currentAnimeHeroIndex = 0;

        const heroHtml = `
            <div class="movies-hero-carousel" style="border-radius:12px; overflow:hidden; position:relative; aspect-ratio:21/9; margin-bottom:0;">
                <div class="movies-hero-slides-container" id="anime-hero-slides-container">
                    ${window.animeHeroData.map((item, index) => {
                        const bgImg = item.backdrop ? item.backdrop : item.poster.replace('w500', 'original');
                        return `
                        <div class="movies-hero-slide ${index === 0 ? 'active' : ''}" data-index="${index}" style="background-image: url('${bgImg}'); cursor:pointer;" onclick="window.location.hash='#${item.type || 'tv'}/${item.id}'">
                            <div class="movies-hero-gradient"></div>
                            <div class="movies-hero-content">
                                <div class="movies-hero-tag" style="color: var(--accent-primary);"><i class="fas fa-fire"></i> #${index + 1} Trending & Popular</div>
                                <h1 class="movies-hero-title">${item.title}</h1>
                                <div class="movies-hero-meta">
                                    <span>${item.year}</span>
                                    <span class="age-rating">16+</span>
                                    <span>${item.genres ? item.genres.slice(0, 2).join(', ') : 'Animation'}</span>
                                </div>
                                <p class="movies-hero-desc" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin-bottom:15px;">${item.description}</p>
                                <div class="movies-hero-actions">
                                    <button class="btn btn-primary" style="background: var(--accent-primary); border-radius: 25px;" onclick="event.stopPropagation(); window.location.hash='#${item.type || 'tv'}/${item.id}'"><i class="fas fa-play"></i> Watch Now</button>
                                    <button class="btn btn-secondary" style="border-radius: 25px;" onclick="event.stopPropagation();"><i class="fas fa-plus"></i> My List</button>
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
                <div class="movies-hero-nav movies-hero-nav-left" onclick="UI.prevAnimeHero()"><i class="fas fa-chevron-left"></i></div>
                <div class="movies-hero-nav movies-hero-nav-right" onclick="UI.nextAnimeHero()"><i class="fas fa-chevron-right"></i></div>
                <div class="movies-hero-dots" id="anime-hero-dots">
                    ${window.animeHeroData.map((_, index) => `<div class="movies-hero-dot ${index === 0 ? 'active' : ''}" onclick="UI.setAnimeHero(${index}); event.stopPropagation();"></div>`).join('')}
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
                        <span><i class="fas fa-chart-line" style="color: var(--accent-primary);"></i> Most Viewed</span>
                        <span style="font-size: 0.8rem; color: #aaa; font-weight: normal; cursor: pointer;">View All</span>
                    </h3>
                    ${UI.buildMostViewedList(popular)}
                </div>
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
                                <div class="compact-meta">TV • ${item.year} • <i class="fas fa-star" style="color: var(--accent-primary);"></i> ${item.rating}</div>
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
                ${buildCol('Most Favorite', '<i class="fas fa-fire" style="color:var(--accent-primary);"></i>', topRated)}
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
                            ${['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance', 'Sci-Fi', 'Mystery', 'Horror', 'Thriller', 'Supernatural', 'Slice of Life', 'Sports', 'Mecha', 'Historical', 'Music'].map(g => `<button class="genre-tag" style="width:100%; text-align:left;"><i class="fas fa-circle" style="color:var(--accent-primary); font-size:0.4rem; margin-right:5px;"></i> ${g}</button>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="dashboard-main">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h3 style="color: #fff; display:flex; align-items:center; gap:8px;"><i class="fas fa-star" style="color:#ffc107;"></i> Recently Updated</h3>
                        <span style="font-size: 0.8rem; color: #aaa; cursor: pointer;" onclick="window.filterState = { type: 'anime', genres: [], keywords: [], companies: [], networks: [], year: 'All', sort: 'primary_release_date.desc', rating: 0 }; window.location.hash='#filter';">View All</span>
                    </div>
                    <div class="dashboard-grid" style="margin-bottom: 3rem;">
                        ${recent.slice(0, 15).map(item => {
                            let timeString = 'Today';
                            if (item.exact_release_time) {
                                const diffMs = new Date() - new Date(item.exact_release_time);
                                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                const diffDays = Math.floor(diffHours / 24);
                                
                                if (diffHours <= 0) {
                                    timeString = 'Just now';
                                } else if (diffHours < 24) {
                                    timeString = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                                } else if (diffDays === 1) {
                                    timeString = '1 day ago';
                                } else {
                                    timeString = `${diffDays} days ago`;
                                }
                            } else if (item.latest_episode_date) {
                                const diffMs = new Date() - new Date(item.latest_episode_date);
                                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                if (diffDays === 1) timeString = '1 day ago';
                                else if (diffDays > 1) timeString = `${diffDays} days ago`;
                            }
                            const epNum = item.latest_episode ? item.latest_episode : (Math.floor(Math.random()*24)+1);
                            return `
                            <div class="media-card" onclick="window.location.hash='#${item.type || 'movie'}/${item.id}'" style="min-width:0; width:100%;">
                                <div class="card-image-wrapper">
                                    <img src="${item.poster}" alt="${item.title}" class="card-img" loading="lazy">
                                </div>
                                <div style="padding: 10px 0;">
                                    <h4 class="card-title" style="font-size:0.9rem; margin-bottom:4px;">${item.title}</h4>
                                    <div class="card-meta" style="font-size:0.8rem; color:#aaa;">EP ${epNum} • ${timeString}</div>
                                </div>
                            </div>
                        `;}).join('')}
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h3 style="color: #fff; display:flex; align-items:center; gap:8px;"><i class="fas fa-calendar-alt" style="color:var(--accent-primary);"></i> Estimated Schedule</h3>
                        <span style="font-size: 0.8rem; color: #aaa; cursor: pointer;" onclick="window.filterState = { type: 'anime', genres: [], keywords: [], companies: [], networks: [], year: 'All', sort: 'popularity.desc', rating: 0 }; window.location.hash='#filter';">View Full Schedule</span>
                    </div>
                    <div class="schedule-header-wrapper" style="display:flex; align-items:center; gap: 10px; margin-bottom: 20px;">
                        <button class="btn-icon" style="background:rgba(255,255,255,0.05); border:none; padding:15px; border-radius:8px; color:#fff; cursor:pointer; flex-shrink:0; transition: background 0.2s;" onmouseover="this.style.background='var(--accent-primary)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'" onclick="UI.scrollSchedule(-1)"><i class="fas fa-chevron-left"></i></button>
                        <div class="schedule-header" id="anime-schedule-header" style="flex:1; display:flex; gap:10px; margin-bottom:0;">
                            <!-- Header rendered by JS -->
                        </div>
                        <button class="btn-icon" style="background:rgba(255,255,255,0.05); border:none; padding:15px; border-radius:8px; color:#fff; cursor:pointer; flex-shrink:0; transition: background 0.2s;" onmouseover="this.style.background='var(--accent-primary)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'" onclick="UI.scrollSchedule(1)"><i class="fas fa-chevron-right"></i></button>
                    </div>
                    <div class="dashboard-grid" id="anime-schedule-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
                        ${UI.buildScheduleGridHtml(trending, 'Sun')}
                    </div>
                </div>
            </section>
        `;

        html += `</div>`;

        appContent.innerHTML = html;
        window.scrollTo(0, 0);

        if (window.animeHeroInterval) clearInterval(window.animeHeroInterval);
        window.animeHeroInterval = setInterval(UI.nextAnimeHero, 5000);

        // Auto-select today for schedule
        window.scheduleOffsetDays = 0;
        const today = new Date();
        window.currentScheduleDate = today.toISOString().split('T')[0];
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][today.getDay()];
        UI.renderScheduleHeader();
        UI.changeScheduleDay(window.currentScheduleDate, dayName);
    },

    renderScheduleHeader: () => {
        const header = document.getElementById('anime-schedule-header');
        if (!header) return;
        window.scheduleOffsetDays = window.scheduleOffsetDays || 0;
        const html = [0,1,2,3,4,5,6].map(i => {
            const d = new Date();
            d.setDate(d.getDate() - d.getDay() + window.scheduleOffsetDays + i);
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
            const isToday = d.toDateString() === new Date().toDateString();
            const dateStr = d.toISOString().split('T')[0];
            const isActive = window.currentScheduleDate === dateStr;
            return `
            <button class="schedule-btn ${isActive ? 'active' : ''}" onclick="UI.changeScheduleDay('${dateStr}', '${dayName}')" style="flex:1; border: ${isToday ? '1px solid var(--accent-primary)' : '1px solid transparent'};">
                <div style="font-size:0.8rem; opacity:0.8; color: ${isToday ? 'var(--accent-primary)' : 'inherit'};">${dayName}</div>
                <div style="font-size:1.1rem; font-weight:bold; color: ${isToday ? 'var(--accent-primary)' : 'inherit'};">${d.getDate()}</div>
            </button>
            `;
        }).join('');
        header.innerHTML = html;
    },

    scrollSchedule: (direction) => {
        window.scheduleOffsetDays = (window.scheduleOffsetDays || 0) + (direction * 7);
        UI.renderScheduleHeader();
    },

    changeScheduleDay: (dateStr, dayName) => {
        window.currentScheduleDate = dateStr;
        UI.renderScheduleHeader(); // re-render to update active state
        const grid = document.getElementById('anime-schedule-grid');
        if (grid && window.animeTrendingData) {
            grid.innerHTML = UI.buildScheduleGridHtml(window.animeTrendingData, dateStr);
        }
    },

    buildScheduleGridHtml: (data, dateStr) => {
        if (!data || data.length === 0) return '';
        
        // Pseudo-randomize selection based on exact dateStr string (e.g., 2026-06-19)
        const hash = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const startIndex = hash % Math.max(1, data.length - 6);
        const chunk = data.slice(startIndex, startIndex + 6);
        
        const times = ["08:00 AM", "09:30 AM", "11:00 AM", "01:30 PM", "03:00 PM", "05:00 PM"];
        return chunk.map((item, idx) => {
            const deterministicEp = (hash + item.id) % 24 + 1;
            return `
            <div style="display:flex; gap:10px; background:#151821; padding:10px; border-radius:8px; cursor:pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'" onclick="window.location.hash='#${item.type || 'movie'}/${item.id}'">
                <img src="${item.poster}" style="width:40px; height:60px; object-fit:cover; border-radius:4px;" loading="lazy">
                <div style="overflow:hidden;">
                    <div style="font-size:0.75rem; color:#aaa; margin-bottom:2px;">${times[idx % times.length]}</div>
                    <div style="font-size:0.85rem; font-weight:600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">EP ${deterministicEp} <span style="background:rgba(255,255,255,0.1); padding:2px 4px; border-radius:2px; margin-left:4px;">Upcoming</span></div>
                </div>
            </div>
        `}).join('');
    },

    // --- Media Dashboard Methods (Movies & Series) ---
    renderMediaDashboard: async (mediaType = 'movie') => {
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = `
            <div class="skeleton-container" style="padding: 20px;">
                <div class="skeleton skeleton-hero"></div>
                <div class="skeleton skeleton-row-title"></div>
                <div class="skeleton-card-row">
                    ${Array(6).fill('<div class="skeleton skeleton-card"></div>').join('')}
                </div>
                <div class="skeleton skeleton-row-title" style="margin-top: 30px;"></div>
                <div class="skeleton-card-row">
                    ${Array(6).fill('<div class="skeleton skeleton-card"></div>').join('')}
                </div>
            </div>
        `;

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

    setAnimeHero: (index) => {
        window.currentAnimeHeroIndex = index;
        const container = document.getElementById('anime-hero-slides-container');
        if (!container) return;
        const slides = container.querySelectorAll('.movies-hero-slide');
        const dots = container.parentElement.querySelectorAll('.movies-hero-dot');
        if (!slides.length) return;

        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));

        if(slides[index]) slides[index].classList.add('active');
        if(dots[index]) dots[index].classList.add('active');
        
        if (window.animeHeroInterval) {
            clearInterval(window.animeHeroInterval);
            window.animeHeroInterval = setInterval(UI.nextAnimeHero, 5000);
        }
    },

    nextAnimeHero: () => {
        if (!window.animeHeroData) return;
        let next = window.currentAnimeHeroIndex + 1;
        if (next >= window.animeHeroData.length) next = 0;
        UI.setAnimeHero(next);
    },

    prevAnimeHero: () => {
        if (!window.animeHeroData) return;
        let prev = window.currentAnimeHeroIndex - 1;
        if (prev < 0) prev = window.animeHeroData.length - 1;
        UI.setAnimeHero(prev);
    },

    // --- Filter Dashboard Methods ---

    buildFilterDropdown: (id, title, options, type = 'checkbox') => {
        let optionsHtml = options.map(opt => `
            <label class="filter-option">
                <input type="${type}" name="${opt.filterType || id}" value="${opt.id}" onchange="UI.updateFilterState('${opt.filterType || id}', '${opt.id}', this.checked, '${type}')">
                <span class="checkmark"></span>
                ${opt.label}
            </label>
        `).join('');

        return `
            <div class="custom-dropdown" id="dropdown-${id}">
                <div class="dropdown-header" onclick="UI.toggleDropdown('${id}')">
                    <span id="dropdown-header-text-${id}" data-original-title="${title}">${title}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="dropdown-panel">
                    <div class="dropdown-grid" id="grid-${id}">
                        ${optionsHtml}
                    </div>
                </div>
            </div>
        `;
    },

    renderFilterDashboard: async () => {
        // Setup state
        window.filterState = {
            query: '',
            type: 'movie', // Default
            genres: [],
            keywords: [],
            companies: [],
            networks: [],
            rating: '',
            runtime: '',
            status: [],
            country: '',
            language: '',
            year: '',
            sort: 'popularity.desc',
            page: 1
        };

        const appContent = document.getElementById('app-content');
        
        // Generate years from current year down to 1950
        const currentYear = new Date().getFullYear();
        const yearOptions = [];
        for (let y = currentYear; y >= 1950; y--) {
            yearOptions.push({ id: y.toString(), label: y.toString() });
        }

        let html = `
            <div class="filter-dashboard-container">
                <h1 class="filter-page-title">Filters</h1>
                
                <div class="filter-controls-container">
                    <!-- Big Search Row -->
                    <div class="filter-search-box-full">
                        <i class="fas fa-search"></i>
                        <input type="text" id="filter-search-input" placeholder="Search..." oninput="UI.updateFilterSearch(this.value)">
                    </div>

                    <!-- Primary Filters Row -->
                    <div class="filter-controls-row">
                        ${UI.buildFilterDropdown('type', 'Select Type', [
                            { id: 'movie', label: 'Movies' },
                            { id: 'tv', label: 'TV Shows' },
                            { id: 'anime', label: 'Anime' }
                        ], 'radio')}
                        
                        <div id="genre-dropdown-container">
                            <!-- Injected dynamically -->
                        </div>
                        
                        ${UI.buildFilterDropdown('year', 'Select year', yearOptions, 'radio')}
                        
                        ${UI.buildFilterDropdown('rating', 'Rating', [
                            { id: '9', label: '⭐ 9.0+' },
                            { id: '8', label: '⭐ 8.0+' },
                            { id: '7', label: '⭐ 7.0+' },
                            { id: '6', label: '⭐ 6.0+' },
                            { id: '5', label: '⭐ 5.0+' }
                        ], 'radio')}
                        
                        ${UI.buildFilterDropdown('sort', 'Sort by', [
                            { id: 'popularity.desc', label: 'Popularity' },
                            { id: 'vote_average.desc', label: 'Highest Rated' },
                            { id: 'primary_release_date.desc', label: 'Recently Added' },
                            { id: 'title.asc', label: 'A-Z' },
                            { id: 'title.desc', label: 'Z-A' }
                        ], 'radio')}
                    </div>
                    
                    <!-- Accordion Toggle -->
                    <div class="more-filters-toggle" onclick="document.getElementById('more-filters-panel').classList.toggle('active')">
                        More Filters <i class="fas fa-chevron-down"></i>
                    </div>

                    <!-- More Filters Accordion -->
                    <div class="more-filters-panel" id="more-filters-panel">
                        <div class="filter-controls-row">
                            ${UI.buildFilterDropdown('status', 'Select status', [
                                { id: 0, label: 'Releasing' },
                                { id: 3, label: 'Completed' }
                            ])}
                            ${UI.buildFilterDropdown('runtime', 'Select runtime', [
                                { id: 'Under 90', label: 'Under 90 min' },
                                { id: '90-120', label: '90–120 min' },
                                { id: '120-180', label: '120–180 min' },
                                { id: '180+', label: '180+ min' }
                            ], 'radio')}
                            ${UI.buildFilterDropdown('language', 'Select language', [
                                { id: 'en', label: 'English' },
                                { id: 'ja', label: 'Japanese' },
                                { id: 'ko', label: 'Korean' },
                                { id: 'hi', label: 'Hindi' },
                                { id: 'zh', label: 'Chinese' },
                                { id: 'es', label: 'Spanish' },
                                { id: 'fr', label: 'French' }
                            ], 'radio')}
                            ${UI.buildFilterDropdown('country', 'Select country', [
                                { id: 'US', label: 'USA' },
                                { id: 'JP', label: 'Japan' },
                                { id: 'KR', label: 'Korea' },
                                { id: 'IN', label: 'India' },
                                { id: 'CN', label: 'China' },
                                { id: 'GB', label: 'UK' },
                                { id: 'FR', label: 'France' },
                                { id: 'DE', label: 'Germany' }
                            ], 'radio')}
                        </div>
                        
                        <!-- Type Specific Row -->
                        <div class="filter-controls-row type-specific-row" id="type-specific-filters">
                            <!-- Injected dynamically based on type -->
                        </div>
                    </div>
                    
                    <button class="filter-submit-btn" onclick="UI.triggerFilterSearch()"><i class="fas fa-filter"></i> Apply Filters</button>
                </div>

                <div id="filter-chips-container" class="filter-chips-container">
                    <!-- Chips will be injected here -->
                </div>

                <div id="filter-results-container" class="filter-results-grid">
                    <!-- Results will be injected here -->
                </div>
                
                <div id="filter-sentinel" style="height: 50px; width: 100%;"></div>
            </div>
        `;
        appContent.innerHTML = html;
        
        const initialType = window.filterState && window.filterState.type ? window.filterState.type : 'movie';
        
        // Trigger initial type setup to inject genres and specific filters, passing true to preserve any incoming state
        await UI.setupTypeSpecificFilters(initialType, true);        
        
        UI.syncDOMWithFilterState();
        
        // Initial UI update for headers and chips
        UI.updateFilterUI();

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-dropdown')) {
                document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('active'));
            }
        });

        // Initialize intersection observer for infinite scroll
        UI.setupFilterInfiniteScroll();

        // Initial load
        UI.triggerFilterSearch();
    },

    toggleDropdown: (id) => {
        const el = document.getElementById(`dropdown-${id}`);
        // Close others
        document.querySelectorAll('.custom-dropdown').forEach(d => {
            if (d !== el) d.classList.remove('active');
        });
        el.classList.toggle('active');
    },

    setupTypeSpecificFilters: async (type, preserveState = false) => {
        const container = document.getElementById('type-specific-filters');
        if (!container) return;
        
        if (!preserveState) {
            // Reset state for specific filters
            window.filterState.keywords = [];
            window.filterState.companies = [];
            window.filterState.networks = [];
            window.filterState.genres = [];
            window.filterState.type = type;
            window.filterState.page = 1;
        }
        
        let html = '';
        let genreOptions = [];

        if (type === 'anime') {
            genreOptions = [
                { id: 10759, label: 'Action & Adventure', filterType: 'genres' },
                { id: 35, label: 'Comedy', filterType: 'genres' },
                { id: 18, label: 'Drama', filterType: 'genres' },
                { id: 10765, label: 'Sci-Fi & Fantasy', filterType: 'genres' },
                { id: 9648, label: 'Mystery', filterType: 'genres' },
                { id: 6054, label: 'Psychological', filterType: 'keywords' },
                { id: 9840, label: 'Romance', filterType: 'keywords' },
                { id: 197204, label: 'Slice of Life', filterType: 'keywords' },
                { id: 6075, label: 'Sports', filterType: 'keywords' },
                { id: 6152, label: 'Supernatural', filterType: 'keywords' },
                { id: 10078, label: 'Thriller', filterType: 'keywords' },
                { id: 3406, label: 'Mecha', filterType: 'keywords' },
                { id: 4350, label: 'Military', filterType: 'keywords' },
                { id: 10836, label: 'School', filterType: 'keywords' },
                { id: 2343, label: 'Magic', filterType: 'keywords' },
                { id: 105315, label: 'Isekai', filterType: 'keywords' },
                { id: 10466, label: 'Historical', filterType: 'keywords' },
                { id: 6027, label: 'Music', filterType: 'keywords' },
                { id: 18146, label: 'Ecchi', filterType: 'keywords' },
                { id: 10112, label: 'Shounen', filterType: 'keywords' },
                { id: 10113, label: 'Seinen', filterType: 'keywords' },
                { id: 10114, label: 'Shojo', filterType: 'keywords' },
                { id: 10115, label: 'Josei', filterType: 'keywords' },
                { id: 278635, label: 'Harem', filterType: 'keywords' }
            ];
            
            html += UI.buildFilterDropdown('companies', 'Select Studio', [
                { id: 18055, label: 'MAPPA' },
                { id: 5122, label: 'Ufotable' },
                { id: 529, label: 'Madhouse' },
                { id: 2883, label: 'A-1 Pictures' },
                { id: 508, label: 'Bones' },
                { id: 153093, label: 'CloverWorks' },
                { id: 35147, label: 'Wit Studio' }
            ]);
            
            html += UI.buildFilterDropdown('keywords', 'Source Material', [
                { id: 3222, label: 'Manga' },
                { id: 233481, label: 'Light Novel' },
                { id: 195321, label: 'Original' },
                { id: 308119, label: 'Webtoon' },
                { id: 2095, label: 'Game' }
            ]);
        } 
        else if (type === 'tv') {
            genreOptions = await API.getGenres('tv');
            
            html += UI.buildFilterDropdown('networks', 'Platform', [
                { id: 213, label: 'Netflix' },
                { id: 1024, label: 'Prime Video' },
                { id: 2739, label: 'Disney+' },
                { id: 49, label: 'HBO' },
                { id: 2552, label: 'Apple TV+' },
                { id: 453, label: 'Hulu' }
            ]);
        } 
        else if (type === 'movie') {
            genreOptions = await API.getGenres('movie');
            
            html += UI.buildFilterDropdown('query', 'Collection', [
                { id: 'Marvel', label: 'Marvel' },
                { id: 'DC', label: 'DC' },
                { id: 'Star Wars', label: 'Star Wars' },
                { id: 'Fast & Furious', label: 'Fast & Furious' },
                { id: 'Harry Potter', label: 'Harry Potter' }
            ], 'radio');
        }
        
        container.innerHTML = html;
        
        const genreContainer = document.getElementById('genre-dropdown-container');
        if (genreContainer) {
            genreContainer.innerHTML = UI.buildFilterDropdown('genres', 'Select genre', genreOptions);
        }
        
        // Since we injected new HTML, we should update UI state
        UI.syncDOMWithFilterState();
        UI.updateFilterUI();
    },

    syncDOMWithFilterState: () => {
        if (!window.filterState) return;
        
        document.querySelectorAll('.filter-dashboard-container input').forEach(input => {
            const key = input.name;
            const val = input.value;
            
            if (input.type === 'radio') {
                input.checked = (String(window.filterState[key]) === String(val));
            } else if (input.type === 'checkbox') {
                if (Array.isArray(window.filterState[key])) {
                    input.checked = window.filterState[key].some(v => String(v) === String(val));
                } else {
                    input.checked = false;
                }
            }
        });
    },

    updateFilterUI: () => {
        // 1. Update dropdown headers
        document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
            const id = dropdown.id.replace('dropdown-', '');
            const headerSpan = document.getElementById(`dropdown-header-text-${id}`);
            if (!headerSpan) return;
            const originalTitle = headerSpan.getAttribute('data-original-title');
            
            // Collect selected options within this specific dropdown
            const checkedInputs = Array.from(dropdown.querySelectorAll('input:checked'));
            
            if (checkedInputs.length === 0) {
                headerSpan.textContent = originalTitle;
            } else if (checkedInputs.length === 1) {
                const labelText = checkedInputs[0].parentElement.textContent.trim();
                headerSpan.textContent = labelText;
            } else if (checkedInputs.length === 2) {
                const labelText1 = checkedInputs[0].parentElement.textContent.trim();
                const labelText2 = checkedInputs[1].parentElement.textContent.trim();
                headerSpan.textContent = `${labelText1}, ${labelText2}`;
            } else {
                const labelText1 = checkedInputs[0].parentElement.textContent.trim();
                headerSpan.textContent = `${labelText1} +${checkedInputs.length - 1}`;
            }
        });

        // 2. Render Chips
        const chipsContainer = document.getElementById('filter-chips-container');
        if (!chipsContainer) return;
        
        let chipsHtml = '';
        let hasFilters = false;

        document.querySelectorAll('.filter-dashboard-container input:checked').forEach(input => {
            const labelText = input.parentElement.textContent.trim();
            const key = input.name;
            const value = input.value;
            const type = input.type;
            
            // Don't show 'sort' in chips as it's a default state
            if (key === 'sort') return;

            hasFilters = true;
            chipsHtml += `<div class="filter-chip" onclick="UI.removeFilter('${key}', '${value}', '${type}')">${labelText} <i class="fas fa-times"></i></div>`;
        });

        if (hasFilters) {
            chipsHtml += `<div class="clear-all-chips-btn" onclick="UI.clearAllFilters()">Clear All</div>`;
        }
        
        chipsContainer.innerHTML = chipsHtml;
    },

    removeFilter: async (key, value, type) => {
        const input = document.querySelector(`input[name="${key}"][value="${value}"]`);
        if (input) {
            input.checked = false;
        }

        if (type === 'radio') {
            window.filterState[key] = ''; 
            if (key === 'type') {
                window.filterState[key] = 'movie'; 
                const defaultType = document.querySelector('input[name="type"][value="movie"]');
                if (defaultType) defaultType.checked = true;
                window.filterState.genres = [];
                await UI.setupTypeSpecificFilters('movie');
            }
        } else {
            if (Array.isArray(window.filterState[key])) {
                window.filterState[key] = window.filterState[key].filter(v => v !== value);
            }
        }

        UI.updateFilterUI();
        UI.triggerFilterSearch();
    },

    clearAllFilters: async () => {
        window.filterState = {
            query: '',
            type: 'movie', 
            genres: [],
            keywords: [],
            companies: [],
            networks: [],
            rating: '',
            runtime: '',
            status: [],
            country: '',
            language: '',
            year: '',
            sort: 'popularity.desc',
            page: 1
        };

        document.querySelectorAll('.filter-dashboard-container input').forEach(input => {
            input.checked = false;
        });
        
        const defaultTypeRadio = document.querySelector('input[name="type"][value="movie"]');
        if (defaultTypeRadio) defaultTypeRadio.checked = true;
        const defaultSortRadio = document.querySelector('input[name="sort"][value="popularity.desc"]');
        if (defaultSortRadio) defaultSortRadio.checked = true;

        await UI.setupTypeSpecificFilters('movie');
        UI.updateFilterUI();
        UI.triggerFilterSearch();
    },

    updateFilterState: async (key, value, isChecked, type) => {
        if (type === 'radio') {
            // For Collection search query, handle it via query key
            if (key === 'query' && !isChecked) {
                // Not standard for radio, but just in case
            }
            window.filterState[key] = value;
            
            // If the user changed the "Type" filter, dynamically re-fetch and re-render genres
            if (key === 'type') {
                await UI.setupTypeSpecificFilters(value);
            }
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
        
        UI.updateFilterUI();
    },

    updateFilterSearch: (val) => {
        window.filterState.query = val;
    },

    triggerFilterSearch: () => {
        window.filterState.page = 1;
        window.filterIsLoading = false;
        window.filterHasMore = true;
        const container = document.getElementById('filter-results-container');
        if (container) container.innerHTML = '';
        UI.applyFilters();
    },

    setupFilterInfiniteScroll: () => {
        const sentinel = document.getElementById('filter-sentinel');
        if (!sentinel) return;

        if (window.filterObserver) {
            window.filterObserver.disconnect();
        }

        window.filterObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !window.filterIsLoading && window.filterHasMore) {
                window.filterState.page += 1;
                UI.applyFilters(true);
            }
        }, { rootMargin: '100px' });

        window.filterObserver.observe(sentinel);
    },

    applyFilters: async (isAppend = false) => {
        const container = document.getElementById('filter-results-container');
        if (!container) return;
        
        if (window.filterIsLoading || !window.filterHasMore) return;
        window.filterIsLoading = true;
        
        if (!isAppend) {
            container.innerHTML = `<div class="loader" style="margin: 50px auto; grid-column: 1/-1;"></div>`;
        } else {
            // Append a mini loader to the bottom
            const loaderHtml = `<div class="mini-loader" id="mini-loader" style="margin: 20px auto; grid-column: 1/-1; text-align:center;"><i class="fas fa-spinner fa-spin" style="color:var(--accent-primary); font-size:2rem;"></i></div>`;
            container.insertAdjacentHTML('beforeend', loaderHtml);
        }
        
        const data = await API.discoverAdvanced(window.filterState, window.filterState.page);
        
        if (!isAppend) {
            container.innerHTML = '';
        } else {
            const miniLoader = document.getElementById('mini-loader');
            if (miniLoader) miniLoader.remove();
        }
        
        if (!data || !data.results || data.results.length === 0) {
            if (!isAppend) {
                container.innerHTML = `<h3 style="text-align:center; padding: 50px; grid-column: 1 / -1; color: #aaa;">No results found. Try adjusting your filters.</h3>`;
            }
            window.filterHasMore = false;
            window.filterIsLoading = false;
            return;
        }

        if (window.filterState.page >= data.totalPages) {
            window.filterHasMore = false;
        }

        const cardsHtml = data.results.map(item => {
            // Special compact card for filter grid
            return `
                <div class="movie-card-popular" onclick="window.location.hash='#${window.filterState.type}/${item.id}'">
                    <img src="${item.poster}" alt="${item.title}" loading="lazy">
                    <div class="movie-card-popular-rating">
                        <span style="font-weight:400; font-size:0.8rem; margin-right:4px;">${item.year}</span>
                        <i class="fas fa-star" style="color:#ffc107;"></i> ${item.rating}
                    </div>
                </div>
            `;
        }).join('');

        container.insertAdjacentHTML('beforeend', cardsHtml);
        window.filterIsLoading = false;
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

// Navbar Contextual Search Logic
const navSearchInput = document.getElementById('nav-search-input');
const navSearchDropdown = document.getElementById('nav-search-dropdown');
let navSearchTimeout;

if (navSearchInput) {
    navSearchInput.addEventListener('input', (e) => {
        clearTimeout(navSearchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            navSearchDropdown.classList.remove('active');
            navSearchDropdown.innerHTML = '';
            return;
        }
        
        navSearchDropdown.classList.add('active');
        navSearchDropdown.innerHTML = '<div class="nav-search-loader"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
        
        navSearchTimeout = setTimeout(async () => {
            // Determine Context
            let context = 'multi';
            const hash = window.location.hash.substring(1).split('/')[0];
            
            if (hash === 'movies') context = 'movie';
            else if (hash === 'series') context = 'series';
            else if (hash === 'anime') context = 'anime';
            else context = 'multi'; // home or filter or others
            
            const results = await API.search(query, context);
            UI.renderNavSearchResults(results, query, context === 'multi' ? 'All' : context);
        }, 500);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#nav-search-container')) {
            navSearchDropdown.classList.remove('active');
        }
    });

    // Re-open dropdown when focusing input if there's text
    navSearchInput.addEventListener('focus', () => {
        if (navSearchInput.value.trim().length >= 2) {
            navSearchDropdown.classList.add('active');
        }
    });
}
