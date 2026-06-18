// app.js - Core routing and app initialization

const App = {
    init: () => {
        window.addEventListener('hashchange', App.handleRoute);
        // Trigger initial route
        if (!window.location.hash) {
            window.location.hash = '#home';
        } else {
            App.handleRoute();
        }
    },

    handleRoute: () => {
        const hash = window.location.hash.substring(1);
        const navLinks = document.querySelectorAll('.nav-link');
        
        // Update active nav link (basic)
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${hash.split('/')[0]}`) {
                link.classList.add('active');
            }
        });

        // Close any active player or search
        Player.close();
        document.getElementById('search-overlay').classList.remove('active');
        document.body.style.overflow = '';

        // Route matching
        if (hash === 'home' || hash === '') {
            UI.renderHome();
        } 
        else if (hash === 'movies') {
            UI.renderGrid('Movies', [...Nexflix_DATA.popular_movies, ...Nexflix_DATA.trending.filter(m => m.type==='movie')]);
        }
        else if (hash === 'series') {
            UI.renderGrid('TV Shows', Nexflix_DATA.popular_series);
        }
        else if (hash === 'categories' || hash === 'mylist') {
            // Reusing Grid for demo
            UI.renderGrid(hash === 'mylist' ? 'My List' : 'Categories', Nexflix_DATA.trending);
        }
        else if (hash.startsWith('movie/') || hash.startsWith('tv/')) {
            const [type, id] = hash.split('/');
            UI.renderDetail(id, type);
        }
        else {
            // Fallback
            UI.renderHome();
        }
    }
};

// Initialize App when DOM is loaded
document.addEventListener('DOMContentLoaded', App.init);
