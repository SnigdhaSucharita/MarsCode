const express = require("express");
const cors = require("cors");
const { 
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
} = require("./controller/controller");
const { sequelize } = require("./models");

const app = express();

app.use(express.json());
app.use(cors());

app.get("/api/movies/search", fetchMovies);
app.post("/api/movies/watchlist", addToWatchlist);
app.post("/api/movies/wishlist", addToWishlist)
app.post("/api/movies/curated-list", addToCuratedList);
app.get("/api/movies/searchByGenreAndActor", searchByGenreAndActor);
app.get("/api/movies/sort", sortListBy);
app.get("/api/movies/top5", getTopMovies);
app.post("/api/movies/:movieId/reviews", addReviewAndRating);
app.post("/api/curated-lists", createCuratedList);
app.put("/api/curated-lists/:curatedListId", updateCuratedList);


sequelize
    .authenticate()
    .then(() => {
        console.log("Database connected.");
    })
    .catch((error) => {
        console.error("Unable to connect to database.", error);
    });


app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

module.exports = app;