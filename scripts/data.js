// data.js - TMDB API Integration

const TMDB_KEY = '74a7bce84da256a7bfece5ce20fc6119';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p/';
const ANIME_QUERY = 'with_genres=16&with_original_language=ja%7Cko%7Czh';

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
        return data && data.results ? data.results.map(item => API.formatMedia(item, 'movie')) : [];
    },

    getAnime: async (page = 1) => {
        // Generic discover anime (maps to popular usually)
        const data = await API.fetchData(`/discover/tv?${ANIME_QUERY}&page=${page}`);
        return data && data.results ? data.results.map(item => API.formatMedia(item, 'tv')) : [];
    },

    getAnimeTrending: async (page = 1) => {
        // TMDB doesn't have a strict trending by genre, so we use discover sorted by popularity for "trending" anime
        const data = await API.fetchData(`/discover/tv?${ANIME_QUERY}&sort_by=popularity.desc&page=${page}`);
        return data && data.results ? data.results.map(item => API.formatMedia(item, 'tv')) : [];
    },

    getAnimeRecent: async (page = 1) => {
        // Recently added/updated
        const data = await API.fetchData(`/discover/tv?${ANIME_QUERY}&sort_by=first_air_date.desc&page=${page}`);
        return data && data.results ? data.results.map(item => API.formatMedia(item, 'tv')) : [];
    },

    getAnimePopular: async (page = 1) => {
        const data = await API.fetchData(`/discover/tv?${ANIME_QUERY}&sort_by=vote_count.desc&page=${page}`);
        return data && data.results ? data.results.map(item => API.formatMedia(item, 'tv')) : [];
    },

    getAnimeTopRated: async (page = 1) => {
        const data = await API.fetchData(`/discover/tv?${ANIME_QUERY}&sort_by=vote_average.desc&vote_count.gte=200&page=${page}`);
        return data && data.results ? data.results.map(item => API.formatMedia(item, 'tv')) : [];
    },

    getAnimeCompleted: async (page = 1) => {
        // status 3 = Ended
        const data = await API.fetchData(`/discover/tv?${ANIME_QUERY}&with_status=3&sort_by=popularity.desc&page=${page}`);
        return data && data.results ? data.results.map(item => API.formatMedia(item, 'tv')) : [];
    },

    getActionMovies: async (page = 1) => {
        const data = await API.fetchData(`/discover/movie?with_genres=28&page=${page}`);
        return data && data.results ? data.results.map(item => API.formatMedia(item, 'movie')) : [];
    },

    getTopRatedMovies: async (page = 1) => {
        const data = await API.fetchData(`/movie/top_rated?page=${page}`);
        return data && data.results ? data.results.map(item => API.formatMedia(item, 'movie')) : [];
    },

    getPopularSeries: async (page = 1) => {
        const data = await API.fetchData(`/tv/popular?page=${page}`);
        return data && data.results ? data.results.map(item => API.formatMedia(item, 'tv')) : [];
    },

    getTopRatedSeries: async (page = 1) => {
        const data = await API.fetchData(`/tv/top_rated?page=${page}`);
        return data && data.results ? data.results.map(item => API.formatMedia(item, 'tv')) : [];
    },

    getNewSeries: async (page = 1) => {
        const data = await API.fetchData(`/tv/on_the_air?page=${page}`);
        return data && data.results ? data.results.map(item => API.formatMedia(item, 'tv')) : [];
    },

    getNewMovies: async (page = 1) => {
        const data = await API.fetchData(`/movie/now_playing?page=${page}`);
        return data && data.results ? data.results.map(item => API.formatMedia(item, 'movie')) : [];
    },

    getComedyMovies: async (page = 1) => {
        const data = await API.fetchData(`/discover/movie?with_genres=35&page=${page}`);
        return data && data.results ? data.results.map(item => API.formatMedia(item, 'movie')) : [];
    },

    getSciFiMovies: async (page = 1) => {
        const data = await API.fetchData(`/discover/movie?with_genres=878&page=${page}`);
        return data && data.results ? data.results.map(item => API.formatMedia(item, 'movie')) : [];
    },

    getDetails: async (id, type = 'movie') => {
        const data = await API.fetchData(`/${type}/${id}?append_to_response=credits`);
        if (!data) return null;

        const media = API.formatMedia(data, type);
        
        media.seasons = data.seasons;
        media.belongs_to_collection = data.belongs_to_collection;
        
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
    getGenres: async (type = 'movie') => {
        const targetType = type === 'anime' ? 'tv' : type;
        const data = await API.fetchData(`/genre/${targetType}/list`);
        return data && data.genres ? data.genres.map(g => ({ id: g.id, label: g.name })) : [];
    },

    search: async (query, context = 'multi', page = 1) => {
        if (!query) return [];
        let endpoint;
        if (context === 'movie') endpoint = `/search/movie?query=${encodeURIComponent(query)}&page=${page}`;
        else if (context === 'series' || context === 'anime') endpoint = `/search/tv?query=${encodeURIComponent(query)}&page=${page}`;
        else endpoint = `/search/multi?query=${encodeURIComponent(query)}&page=${page}`;

        const data = await API.fetchData(endpoint);
        if (!data || !data.results) return [];
        
        let results = data.results.filter(item => item.media_type !== 'person');
        
        if (context === 'anime') {
            // Filter TV results to animation genre from Asian countries for Anime
            results = results.filter(item => 
                item.genre_ids && item.genre_ids.includes(16) && 
                item.origin_country && (item.origin_country.includes('JP') || item.origin_country.includes('KR') || item.origin_country.includes('CN'))
            );
        }
        
        return results.map(item => API.formatMedia(item, context === 'multi' ? (item.media_type || 'movie') : (context === 'movie' ? 'movie' : 'tv')));
    },

    getCollection: async (collectionId) => {
        const data = await API.fetchData(`/collection/${collectionId}`);
        return data && data.parts ? data.parts.map(item => API.formatMedia(item, 'movie')) : [];
    },

    getEpisodes: async (tvId, seasonNum = 1) => {
        const data = await API.fetchData(`/tv/${tvId}/season/${seasonNum}`);
        if (!data || !data.episodes) return [];
        return data.episodes.map(ep => ({
            id: ep.id,
            episode_number: ep.episode_number,
            title: ep.name,
            overview: ep.overview,
            still: ep.still_path ? `${IMG_BASE_URL}w500${ep.still_path}` : 'https://via.placeholder.com/500x281?text=No+Image',
            runtime: ep.runtime ? `${ep.runtime}m` : ''
        }));
    },

    getRecommendations: async (id, type = 'movie', page = 1) => {
        const data = await API.fetchData(`/${type}/${id}/recommendations?page=${page}`);
        return data && data.results ? data.results.map(item => API.formatMedia(item, type)) : [];
    },

    discoverAdvanced: async (params, page = 1) => {
        let endpoint = '';
        let queryParams = [`page=${page}`];

        let targetType = params.type || 'movie';
        
        // Anime is just TV with genre 16 and specific languages
        if (targetType === 'anime') {
            targetType = 'tv';
            if (!params.genres || params.genres.length === 0) {
                params.genres = ['16'];
            } else if (!params.genres.includes('16')) {
                params.genres.push('16');
            }
            if (!params.language) {
                params.language = 'ja|ko|zh';
            }
        }

        if (params.query) {
            endpoint = `/search/${targetType}`;
            queryParams.push(`query=${encodeURIComponent(params.query)}`);
            // Search endpoints largely ignore other discover parameters like with_genres
        } else {
            endpoint = `/discover/${targetType}`;
            
            if (params.genres && params.genres.length > 0) {
                queryParams.push(`with_genres=${params.genres.join(',')}`);
            }

            if (params.status && params.status.length > 0) {
                // TV status mapping: 0=Returning, 3=Ended. Movie status is string-based, TMDB doesn't filter movies by status easily.
                if (targetType === 'tv') {
                    queryParams.push(`with_status=${params.status.join('|')}`);
                }
            }

            if (params.language) {
                // To support 'ja|ko|zh' we shouldn't encode the | if passed as string directly, or just encode it properly.
                // with_original_language takes a pipe separated list natively in TMDB API.
                let langStr = params.language.replace(/\|/g, '%7C');
                queryParams.push(`with_original_language=${langStr}`);
            }

            if (params.country) {
                queryParams.push(`with_origin_country=${params.country}`);
            }

            if (params.sort) {
                queryParams.push(`sort_by=${params.sort}`);
            } else {
                queryParams.push(`sort_by=popularity.desc`);
            }
            
            if (params.year) {
                if (targetType === 'movie') {
                    queryParams.push(`primary_release_year=${params.year}`);
                } else {
                    queryParams.push(`first_air_date_year=${params.year}`);
                }
            }
            
            if (params.rating) {
                queryParams.push(`vote_average.gte=${params.rating}`);
            }
            
            if (params.runtime) {
                if (params.runtime.includes('-')) {
                    const [min, max] = params.runtime.split('-');
                    queryParams.push(`with_runtime.gte=${min}`);
                    queryParams.push(`with_runtime.lte=${max}`);
                } else if (params.runtime.includes('+')) {
                    const min = params.runtime.replace('+', '');
                    queryParams.push(`with_runtime.gte=${min}`);
                } else if (params.runtime.includes('Under')) {
                    const max = params.runtime.replace('Under ', '');
                    queryParams.push(`with_runtime.lte=${max}`);
                }
            }
            
            if (params.keywords && params.keywords.length > 0) {
                queryParams.push(`with_keywords=${params.keywords.join('|')}`); // using | for OR
            }
            
            if (params.companies && params.companies.length > 0) {
                queryParams.push(`with_companies=${params.companies.join('|')}`);
            }
            
            if (params.networks && params.networks.length > 0) {
                queryParams.push(`with_networks=${params.networks.join('|')}`);
            }
        }

        const data = await API.fetchData(`${endpoint}?${queryParams.join('&')}`);
        
        if (data && data.results) {
            return {
                results: data.results.map(item => API.formatMedia(item, targetType)),
                totalPages: Math.min(data.total_pages, 500), // TMDB page limit
                totalResults: data.total_results
            };
        }
        return { results: [], totalPages: 0, totalResults: 0 };
    }
};
