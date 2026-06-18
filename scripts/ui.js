// ui.js - DOM manipulation and rendering functions

const UI = {
    renderHome: () => {
        const appContent = document.getElementById('app-content');
        const hero = Nexflix_DATA.hero;
        
        let html = `
            <!-- Hero Section -->
            <section class="hero" style="background-image: url('${hero.backdrop}');">
                <div class="hero-content">
                    <h1 class="hero-title">${hero.title}</h1>
                    <div class="hero-meta">
                        <span class="meta-item">${hero.year}</span>
                        <span class="meta-item"><i class="fas fa-star rating"></i> ${hero.rating}</span>
                        <span class="meta-item">${hero.runtime}</span>
                        <span class="meta-item">${hero.genres.join(', ')}</span>
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

        html += UI.buildCarousel('Trending Now', Nexflix_DATA.trending);
        html += UI.buildCarousel('Popular Movies', Nexflix_DATA.popular_movies);
        html += UI.buildCarousel('Popular TV Shows', Nexflix_DATA.popular_series);

        appContent.innerHTML = html;
        window.scrollTo(0, 0);
    },

    buildCarousel: (title, items) => {
        let cards = items.map(item => `
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
        `).join('');

        return `
            <section class="content-row">
                <div class="row-header">
                    <h3 class="row-title">${title}</h3>
                    <a href="#" class="view-all">View All</a>
                </div>
                <div class="carousel">
                    ${cards}
                </div>
            </section>
        `;
    },

    renderDetail: (id, type) => {
        const appContent = document.getElementById('app-content');
        const media = getMediaDetails(id, type);

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
        
        // Add recommendations
        html += UI.buildCarousel('More Like This', Nexflix_DATA.trending.slice().reverse());

        appContent.innerHTML = html;
        window.scrollTo(0, 0);
    },
    
    renderGrid: (title, items) => {
        const appContent = document.getElementById('app-content');
        
        let cards = items.map(item => `
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
        `).join('');
        
        appContent.innerHTML = `
            <div class="section-padding" style="padding-top: 100px;">
                <h2 style="margin-bottom: var(--spacing-lg);">${title}</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--spacing-md);">
                    ${cards}
                </div>
            </div>
        `;
        window.scrollTo(0, 0);
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
document.querySelector('.search-btn').addEventListener('click', () => {
    const overlay = document.getElementById('search-overlay');
    overlay.classList.add('active');
    document.getElementById('search-input').focus();
    document.body.style.overflow = 'hidden';
});

document.querySelector('.close-search').addEventListener('click', () => {
    document.getElementById('search-overlay').classList.remove('active');
    document.body.style.overflow = '';
});
