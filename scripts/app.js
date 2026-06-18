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

    handleRoute: async () => {
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
        try {
            if (hash === 'home' || hash === '') {
                await UI.renderHome();
            } 
            else if (hash === 'movies') {
                await UI.renderGrid('Popular Movies', API.getPopularMovies);
            }
            else if (hash === 'series') {
                await UI.renderGrid('Popular TV Shows', API.getPopularSeries);
            }
            else if (hash === 'categories' || hash === 'mylist') {
                // Reusing Grid for demo purposes
                await UI.renderGrid(hash === 'mylist' ? 'My List' : 'Trending Now', API.getTrending);
            }
            else if (hash.startsWith('movie/') || hash.startsWith('tv/')) {
                const [type, id] = hash.split('/');
                await UI.renderDetail(id, type);
            }
            else {
                // Fallback
                await UI.renderHome();
            }
        } catch (error) {
            console.error("Routing Error:", error);
            document.getElementById('app-content').innerHTML = `<h2 style="text-align:center; padding: 100px;">An error occurred while loading this page.</h2>`;
        }
    }
};

// Initialize App when DOM is loaded
document.addEventListener('DOMContentLoaded', App.init);
