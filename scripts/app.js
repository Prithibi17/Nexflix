// app.js - Core routing and app initialization

const App = {
    // State for infinite scrolling
    state: {
        currentPage: 1,
        isLoadingMore: false,
        activeGridFetcher: null, // Holds the current API function reference
    },

    init: () => {
        window.addEventListener('hashchange', App.handleRoute);
        // Setup Infinite Scroll Listener
        window.addEventListener('scroll', App.handleInfiniteScroll);
        
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
        
        // Reset infinite scroll state
        App.state.currentPage = 1;
        App.state.activeGridFetcher = null;
        App.state.isLoadingMore = false;

        // Clear rotating banner interval to prevent memory leaks or dual-rotation
        if (window.heroIntervalId) {
            clearInterval(window.heroIntervalId);
            window.heroIntervalId = null;
        }

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
                await UI.renderMediaDashboard('movie');
            }
            else if (hash === 'series') {
                await UI.renderMediaDashboard('tv');
            }
            else if (hash === 'categories' || hash === 'trending') {
                App.state.activeGridFetcher = API.getTrending;
                await UI.renderGrid('Trending Now', App.state.activeGridFetcher);
            }
            else if (hash === 'filter') {
                await UI.renderFilterDashboard();
            }
            else if (hash === 'action') {
                App.state.activeGridFetcher = API.getActionMovies;
                await UI.renderGrid('Action Movies', App.state.activeGridFetcher);
            }
            else if (hash === 'comedy') {
                App.state.activeGridFetcher = API.getComedyMovies;
                await UI.renderGrid('Comedy Movies', App.state.activeGridFetcher);
            }
            else if (hash === 'scifi') {
                App.state.activeGridFetcher = API.getSciFiMovies;
                await UI.renderGrid('Sci-Fi Movies', App.state.activeGridFetcher);
            }
            else if (hash === 'anime') {
                await UI.renderAnimeDashboard();
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
    },

    handleInfiniteScroll: async () => {
        // If we are not on a grid view, or are currently loading, do nothing
        if (!App.state.activeGridFetcher || App.state.isLoadingMore) return;

        // Check if user is near bottom of the page
        const scrollPosition = window.innerHeight + window.scrollY;
        const bottomThreshold = document.body.offsetHeight - 800; // Load when 800px from bottom

        if (scrollPosition >= bottomThreshold) {
            App.state.isLoadingMore = true;
            UI.toggleGridLoader(true);
            
            App.state.currentPage++;
            
            try {
                const newItems = await App.state.activeGridFetcher(App.state.currentPage);
                if (newItems && newItems.length > 0) {
                    UI.appendGridItems(newItems);
                } else {
                    // No more items to load
                    App.state.activeGridFetcher = null; 
                }
            } catch (error) {
                console.error("Infinite Scroll Error:", error);
                App.state.currentPage--; // Revert page count on error
            } finally {
                UI.toggleGridLoader(false);
                App.state.isLoadingMore = false;
            }
        }
    }
};

// Initialize App when DOM is loaded
document.addEventListener('DOMContentLoaded', App.init);
