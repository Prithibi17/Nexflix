// data.js - TMDB API Integration

const TMDB_KEY = '74a7bce84da256a7bfece5ce20fc6119';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p/';

const API = {
    // Helper to fetch and parse JSON
    fetchData: async (endpoint) => {
        try {
            const separator = endpoint.includes('?') ? '&' : '?';
            const response = await fetch(`${BASE_URL}${endpoint}${separator}api_key=${TMDB_KEY}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error("API Fetch Error:", error);
            return null;
        }
    },

    // Format raw TMDB data into our app's structure
    formatMedia: (item, type = 'movie') => {
        if (!item) return null;
        
        // Determine type (multi-search returns media_type)
        const mediaType = item.media_type || type;
        
        return {
            id: item.id,
            title: item.title || item.name,
            description: item.overview || "No description available.",
            poster: item.poster_path ? `${IMG_BASE_URL}w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image',
            backdrop: item.backdrop_path ? `${IMG_BASE_URL}original${item.backdrop_path}` : 'https://via.placeholder.com/1280x720?text=No+Background',
            year: (item.release_date || item.first_air_date || "N/A").split('-')[0],
            rating: item.vote_average ? item.vote_average.toFixed(1) : "N/A",
            type: mediaType
        };
    },

    getTrending: async (page = 1) => {
        const data = await API.fetchData(`/trending/all/day?page=${page}`);
        return data ? data.results.map(item => API.formatMedia(item, item.media_type)).filter(item => item.title) : [];
    },

    getPopularMovies: async (page = 1) => {
        const data = await API.fetchData(`/movie/popular?page=${page}`);
        return data ? data.results.map(item => API.formatMedia(item, 'movie')) : [];
    },

    getPopularSeries: async (page = 1) => {
        const data = await API.fetchData(`/tv/popular?page=${page}`);
        return data ? data.results.map(item => API.formatMedia(item, 'tv')) : [];
    },

    getAnime: async (page = 1) => {
        const data = await API.fetchData(`/discover/tv?with_genres=16&page=${page}`);
        return data ? data.results.map(item => API.formatMedia(item, 'tv')) : [];
    },

    getActionMovies: async (page = 1) => {
        const data = await API.fetchData(`/discover/movie?with_genres=28&page=${page}`);
        return data ? data.results.map(item => API.formatMedia(item, 'movie')) : [];
    },

    getComedyMovies: async (page = 1) => {
        const data = await API.fetchData(`/discover/movie?with_genres=35&page=${page}`);
        return data ? data.results.map(item => API.formatMedia(item, 'movie')) : [];
    },

    getSciFiMovies: async (page = 1) => {
        const data = await API.fetchData(`/discover/movie?with_genres=878&page=${page}`);
        return data ? data.results.map(item => API.formatMedia(item, 'movie')) : [];
    },

    getDetails: async (id, type = 'movie') => {
        const data = await API.fetchData(`/${type}/${id}?append_to_response=credits`);
        if (!data) return null;

        const media = API.formatMedia(data, type);
        
        // Extract genres
        media.genres = data.genres ? data.genres.map(g => g.name) : ["Unknown"];
        
        // Extract runtime
        if (type === 'movie' && data.runtime) {
            const hours = Math.floor(data.runtime / 60);
            const mins = data.runtime % 60;
            media.runtime = `${hours}h ${mins}m`;
        } else if (type === 'tv' && data.episode_run_time && data.episode_run_time.length > 0) {
            media.runtime = `${data.episode_run_time[0]}m/ep`;
        } else {
            media.runtime = "N/A";
        }

        // Extract Director and Cast
        if (data.credits) {
            if (type === 'movie') {
                const director = data.credits.crew.find(c => c.job === 'Director');
                media.director = director ? director.name : "Unknown";
            } else {
                media.director = data.created_by && data.created_by.length > 0 ? data.created_by[0].name : "Unknown";
            }
            
            media.cast = data.credits.cast.slice(0, 5).map(c => c.name).join(', ') || "Unknown";
        }

        return media;
    },

    search: async (query, page = 1) => {
        if (!query) return [];
        const data = await API.fetchData(`/search/multi?query=${encodeURIComponent(query)}&page=${page}`);
        return data ? data.results.filter(item => item.media_type !== 'person').map(item => API.formatMedia(item, item.media_type)) : [];
    }
};
