require("dotenv").config();
const axios = require("axios");
const { movie: movieModel } = require("../models");


async function getActors(movieId) {
    try {
        const response = await axios.get(`${process.env.TMDB_BASE_URL}/movie/${movieId}/credits`, {
           params: {
            api_key: process.env.API_KEY
           }
        });

        return response.data.cast
            .filter(person => person.known_for_department === "Acting")
            .slice(0, 5)
            .map(actor => actor.name)
            .join(", ");
    } catch (error) {
        console.error(`Error fetching actors for movieId ${movieId}:`, error.message);
        throw new Error("Failed to fetch actors from TMDB API");
    }
}

async function searchMovie(query) {
    try {
        const response = await axios.get(`${process.env.TMDB_BASE_URL}/search/movie`, {
            
            params: { 
                query,
                api_key: process.env.API_KEY
            }
        });

        const movies = await Promise.all(
            response.data.results.map(async movie => {
                const actors = await getActors(movie.id);

                return {
                    title: movie.title,
                    tmdbId: movie.id,
                    genre: movie.genre_ids.join(", "),
                    actors,
                    releaseYear: movie.release_date ? movie.release_date.split("-")[0] : "N/A",
                    rating: movie.vote_average,
                    description: movie.overview
                };
            })
        );

        return { movies };
    } catch (error) {
        console.error("Error searching movies:", error);
        throw new Error("Failed to search movies");
    }
}


async function movieExistsInDB(tmdbId) {
    try {
        const movie = await movieModel.findOne({ 
            where: { tmdbId }
        });
        if(!movie) {
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error searching the movie table");
        throw new Error("Error querying movie table");
    }
}

async function fetchMovieAndCastDetails(tmdbId) {
    try {
        const response = await axios.get(`${process.env.TMDB_BASE_URL}/movie/${tmdbId}`, {
            params: {
                api_key: process.env.API_KEY
            }
        });
    
        const actors = await getActors(tmdbId);

        return {
            title: response.data.title,
            tmdbId: response.data.id,
            genre: response.data.genres.map(genre => genre.name).join(", "),
            actors,
            releaseYear: response.data.release_date ? response.data.release_date.split("-")[0] : "N/A",
            rating: response.data.vote_average,
            description: response.data.overview
        };
    } catch (error) {
        console.error("Error getting movie details");
        throw new Error("Failed to fetch movie details");
    }
}


module.exports = { searchMovie, movieExistsInDB, fetchMovieAndCastDetails };