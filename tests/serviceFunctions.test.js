const { movieExistsInDB, fetchMovieAndCastDetails } = require("../serviceFunctions/index");
const { movie: movieModel } = require("../models");
const axios = require("axios");
jest.mock("axios");


describe("Service Functions", () => {
    test("movieExistsInDB should return false when movie is not in DB", async () => {
        movieModel.findOne = jest.fn().mockResolvedValue(null);
        const result = await movieExistsInDB(123);
        expect(result).toBe(false);
    });

    test("movieExistsInDB should return true when movie is in DB", async () => {
        movieModel.findOne = jest.fn().mockResolvedValue({ id: 1 });
        const result = await movieExistsInDB(123);
        expect(result).toBe(true);
    });

    test("fetchMovieAndCastDetails should return movie details with actors", async () => {
        const movieData = {
            title: "Inception",
            tmdbId: 123,
            genre: "Action, Sci-Fi",
            actors: "Leonardo DiCaprio, Joseph Gordon-Levitt",
            releaseYear: "2010",
            rating: 8.8,
            description: "A mind-bending thriller."
        };
        axios.get.mockResolvedValueOnce({
            data: {
                title: "Inception",
                id: 123,
                genres: [{ name: "Action" }, { name: "Sci-Fi" }],
                release_date: "2010-07-16",
                vote_average: 8.8,
                overview: "A mind-bending thriller."
            }
        });

        axios.get.mockResolvedValueOnce({
            data: { cast: [{ name: "Leonardo DiCaprio" }, { name: "Joseph Gordon-Levitt" }] }
        });

        const result = await fetchMovieAndCastDetails(123);
        expect(result).toHaveProperty("title", "Inception");
        expect(result).toHaveProperty("actors", "Leonardo DiCaprio, Joseph Gordon-Levitt");
    });
});