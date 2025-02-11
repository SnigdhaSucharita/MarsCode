const { 
    curatedList: curatedListModel, 
    movie: movieModel, 
    watchlist: watchlistModel, 
    wishlist: wishlistModel, 
    curatedListItem: curatedListItemModel,
    review: reviewModel 
} = require("../models");
const { 
    searchMovie,
    movieExistsInDB, 
    fetchMovieAndCastDetails 
} = require("../serviceFunctions/index");
const Sequelize = require("sequelize");


const fetchMovies = async (req, res) => {
    const { query } = req.query;

    if(!query) {
        return res.status(400).json({ error: "Query parameter is required" });
    }

    try {
        const movies = await searchMovie(query);
        res.json(movies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const createCuratedList = async (req, res) => {

    const { name, description, slug } = req.body;

    try {
       const newCuratedList = await curatedListModel.create({
          name: name,
          slug: slug,
          description: description  
        });

        res.status(201).json({ message: "Curated list created successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error in creating curated list", error: error.message });
    }

};

const updateCuratedList = async (req, res) => {

    const { curatedListId } = req.params;
    const updateData = req.body;

    try {
        const CuratedList = await curatedListModel.findByPk(curatedListId);
        if(!CuratedList) {
            return res.status(404).json({ message: "No curated list found." });
        }
        CuratedList.set(updateData);
        const updatedCuratedList = await CuratedList.save();

        res.status(200).json({ message: "Curated list updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating curated list", error: error.message });
    }
};


const addToWatchlist = async (req, res) => {

    const { movieId } = req.body;

    if(!movieId || typeof movieId !== "number") {
        return res.status(400).json({ error: "movieId is required and should be a number." });
    }

    try {
        const flag = await movieExistsInDB(movieId);
        if(!flag) {
            const movieData = await fetchMovieAndCastDetails(movieId);
            await movieModel.create(movieData);
        }

        const movie = await movieModel.findOne({ where: { tmdbId: movieId } });

        const watchlist = await watchlistModel.findOne({ where: { movieId: movie.id } });

        if(watchlist) {
            return res.json({ message: "Movie already exists in watchlist" });
        }
    
        await watchlistModel.create({
            movieId: movie.id
        });

        res.status(201).json({ message: "Movie added to watchlist successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error adding to watchlist", error: error.message });
    }
};


const addToWishlist = async (req, res) => {

    const { movieId } = req.body;

    if(!movieId || typeof movieId !== "number") {
        return res.status(400).json({ error: "movieId is required and should be a number." });
    }

    try {
        const flag = await movieExistsInDB(movieId);
        if(!flag) {
            const movieData = await fetchMovieAndCastDetails(movieId);
            await movieModel.create(movieData);
        }

        const movie = await movieModel.findOne({ where: { tmdbId: movieId } });
        
        const wishlist = await wishlistModel.findOne({ where: { movieId: movie.id } });

        if(wishlist) {
            return res.json({ message: "Movie already exists in wishlist" });
        }

        await wishlistModel.create({
            movieId: movie.id
        });

        res.status(201).json({ message: "Movie added to wishlist successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error adding to wishlist", error: error.message });
    }
};


const addToCuratedList = async (req, res) => {
    const { movieId, curatedListId } = req.body;

    if(!movieId || typeof movieId !== "number") {
        return res.status(400).json({ error: "movieId is required and should be a number." });
    }

    if(!curatedListId || typeof curatedListId !== "number") {
        return res.status(400).json({ error: "curatedListId is required and should be a number." });
    }

    try {
        const flag = await movieExistsInDB(movieId);
        if(!flag) {
            const movieData = await fetchMovieAndCastDetails(movieId);
            await movieModel.create(movieData);
        }

        const movie = await movieModel.findOne({ where: { tmdbId: movieId } });

        const curatedItem = await curatedListItemModel.findOne({ where: { curatedListId, movieId: movie.id } });

        if(curatedItem) {
            return res.json({ message: "Movie already exists in curated list" });
        }

        await curatedListItemModel.create({
            curatedListId,
            movieId: movie.id
        });

        res.status(201).json({ message: "Movie added to curated list successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error adding to curated list", error: error.message });
    }
}; 


const addReviewAndRating = async (req, res) => {

    const { movieId } = req.params;
    const { rating, reviewText } = req.body;

    if(typeof rating !== "number" || rating < 0 || rating > 10) {
        return res.status(400).json({ error: "Rating must be a float between 0 and 10." });
    }

    if(typeof reviewText !== "string" || reviewText.length > 500) {
        return res.status(400).json({ error: "Review text must be a maximum of 500 characters."});
    }

    try {
        const review = await reviewModel.create({
            movieId,
            rating,
            reviewText
        });
        res.json({ message: "Review added successfully." });
    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ message: "Failed to add review", error: error.message });
    }
};


const searchByGenreAndActor = async (req, res) => {
    const { genre, actor } = req.query;

    if(!genre && !actor) {
        return res.status(400).json({ error: "At least one search parameter (genre or actor) must be provided." });
    }

    try {
        const whereClause = {};

        if(genre) {
            whereClause.genre = { [Sequelize.Op.like]: `%${genre}%` };
        }

        if(actor) {
            whereClause.actors = { [Sequelize.Op.like]: `%${actor}%` };
        }

        const movies = await movieModel.findAll({ where: whereClause });

        res.json({movies});

    } catch (error) {
        console.error("Error searching movies:", error);
        res.status(500).json({ error: "Failed to search movies" });
    }
};


const sortListBy = async (req, res) => {

    const { list, sortBy, order = "ASC" } = req.query;

    if(!list || !sortBy) {
        return res.status(400).json({ error: "Both list and sortBy parameters are required." });
    }

    const validLists = {
        watchlist: watchlistModel,
        wishlist: wishlistModel,
        curatedlist: curatedListItemModel
    };

    const listModel = validLists[list.toLowerCase()];

    if(!listModel) {
        return res.status(400).json({ error: "Invalid list parameter. Must be one of watchlist, wishlist, or curatedlist." });
    }

    if(!["rating", "releaseYear"].includes(sortBy)) {
        return res.status(400).json({ error: "Invalid sortBy parameter. Must be one of rating or releaseYear." });
    }

    try {
        const entries = await listModel.findAll({
            include: [{ model: movieModel }]
        });

        const movies = entries.map(entry => entry.movie);

        movies.sort((a, b) => {
            if(order.toUpperCase() === "ASC") {
                return a[sortBy] - b[sortBy];
            }

            return b[sortBy] - a[sortBy];
        });

        res.json({movies});

    } catch (error) {
        console.error("Error sorting movies:", error);
        res.status(500).json({ error: "Failed to sort movies" });
    }
};


const getTopMovies = async (req, res) => {
    try {
        const topMovies = await movieModel.findAll({
            order: [["rating", "DESC"]],
            limit: 5,
            include: [{ model: reviewModel }]
        });

        const movies = topMovies.map(movie => {
            const review = movie.reviews[0];
            return {
                title: movie.title,
                rating: movie.rating,
                review: review ?
                    {
                        text: review.reviewText,
                        wordCount: review.reviewText.split(" ").length
                    }
                    : null
            };
        });

        res.json({ movies });
    } catch (error) {
        console.error("Error fetching top 5 movies", error);
        res.status(500).json({ error: "Failed to fetch top 5 movies" });
    }
};


module.exports = { 
    fetchMovies, 
    createCuratedList, 
    updateCuratedList, 
    addToWatchlist, 
    addToWishlist, 
    addToCuratedList, 
    addReviewAndRating, 
    searchByGenreAndActor,
    sortListBy,
    getTopMovies
};