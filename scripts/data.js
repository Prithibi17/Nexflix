// data.js - Mock database for Nexflix

const Nexflix_DATA = {
    hero: {
        id: 155,
        title: "The Dark Knight",
        description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        backdrop: "https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
        poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        year: 2008,
        rating: 9.0,
        runtime: "2h 32m",
        genres: ["Action", "Crime", "Drama"],
        type: "movie"
    },
    trending: [
        {
            id: 299534,
            title: "Avengers: Endgame",
            poster: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
            backdrop: "https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
            year: 2019,
            rating: 8.4,
            type: "movie"
        },
        {
            id: 157336,
            title: "Interstellar",
            poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
            backdrop: "https://image.tmdb.org/t/p/original/xJHokMbljvjEVA14x8IQyY0D5x2.jpg",
            year: 2014,
            rating: 8.6,
            type: "movie"
        },
        {
            id: 27205,
            title: "Inception",
            poster: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
            backdrop: "https://image.tmdb.org/t/p/original/s3TBrRGB1invgB2E64q04TpwzZ2.jpg",
            year: 2010,
            rating: 8.8,
            type: "movie"
        },
        {
            id: 597,
            title: "Titanic",
            poster: "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
            backdrop: "https://image.tmdb.org/t/p/original/tvXqfQW8pYhJ1uL8u17x8c4BvC7.jpg",
            year: 1997,
            rating: 7.9,
            type: "movie"
        },
        {
            id: 13,
            title: "Forrest Gump",
            poster: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
            backdrop: "https://image.tmdb.org/t/p/original/mz135NGEwT9LIt8KxZ2OaG0yWf0.jpg",
            year: 1994,
            rating: 8.8,
            type: "movie"
        },
        {
            id: 603,
            title: "The Matrix",
            poster: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
            backdrop: "https://image.tmdb.org/t/p/original/lZpWprJqbIFpEV5uoHfoK0KCnTW.jpg",
            year: 1999,
            rating: 8.7,
            type: "movie"
        }
    ],
    popular_movies: [
        {
            id: 238,
            title: "The Godfather",
            poster: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
            year: 1972,
            rating: 9.2,
            type: "movie"
        },
        {
            id: 155,
            title: "The Dark Knight",
            poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
            year: 2008,
            rating: 9.0,
            type: "movie"
        },
        {
            id: 19995,
            title: "Avatar",
            poster: "https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg",
            year: 2009,
            rating: 7.9,
            type: "movie"
        },
        {
            id: 24428,
            title: "The Avengers",
            poster: "https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmja8y.jpg",
            year: 2012,
            rating: 7.7,
            type: "movie"
        },
        {
            id: 475557,
            title: "Joker",
            poster: "https://image.tmdb.org/t/p/w500/udDclJoHjfpt8Icfoz1GtOONJx.jpg",
            year: 2019,
            rating: 8.1,
            type: "movie"
        },
        {
            id: 22,
            title: "Pirates of the Caribbean",
            poster: "https://image.tmdb.org/t/p/w500/z8onk7LV9Mmw6zKz4hT6pzzvmvl.jpg",
            year: 2003,
            rating: 7.8,
            type: "movie"
        }
    ],
    popular_series: [
        {
            id: 1399,
            title: "Game of Thrones",
            poster: "https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
            year: 2011,
            rating: 8.4,
            type: "tv"
        },
        {
            id: 66732,
            title: "Stranger Things",
            poster: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8x1repk43.jpg",
            year: 2016,
            rating: 8.6,
            type: "tv"
        },
        {
            id: 63247,
            title: "Westworld",
            poster: "https://image.tmdb.org/t/p/w500/8ptioXOofQysg2LhH3OaTzofQ5J.jpg",
            year: 2016,
            rating: 8.1,
            type: "tv"
        },
        {
            id: 1402,
            title: "The Walking Dead",
            poster: "https://image.tmdb.org/t/p/w500/n7PVu0hSz2sAsVekpOIoNjq3xro.jpg",
            year: 2010,
            rating: 8.1,
            type: "tv"
        },
        {
            id: 60059,
            title: "Better Call Saul",
            poster: "https://image.tmdb.org/t/p/w500/fC2HDm5t0kHlAMO61xLAxMflCGz.jpg",
            year: 2015,
            rating: 8.6,
            type: "tv"
        },
        {
            id: 1396,
            title: "Breaking Bad",
            poster: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRte6.jpg",
            year: 2008,
            rating: 8.9,
            type: "tv"
        }
    ]
};

// Helper function to get full details for a movie/series (Mocking an API call)
function getMediaDetails(id, type = 'movie') {
    // Search in all our mock lists
    const allMedia = [
        Nexflix_DATA.hero,
        ...Nexflix_DATA.trending,
        ...Nexflix_DATA.popular_movies,
        ...Nexflix_DATA.popular_series
    ];
    
    const media = allMedia.find(m => m.id == id) || Nexflix_DATA.trending[0];
    
    // Add some dummy extended data
    return {
        ...media,
        description: media.description || "A captivating story that will keep you on the edge of your seat. Experience the journey of a lifetime with incredible performances and breathtaking visuals.",
        backdrop: media.backdrop || "https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg", // fallback
        runtime: media.runtime || (type === 'movie' ? "2h 15m" : "45m/ep"),
        genres: media.genres || ["Action", "Drama", "Thriller"],
        director: "Christopher Nolan",
        cast: "Christian Bale, Heath Ledger, Aaron Eckhart, Michael Caine"
    };
}
