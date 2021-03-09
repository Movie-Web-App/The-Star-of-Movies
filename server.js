"use strict";

const express = require("express");
require("dotenv").config();
const cors = require("cors");
const pg = require("pg");
const superagent = require("superagent");
const layout = require("express-ejs-layouts");
const PORT = process.env.PORT || 4800;
const server = express();

const override = require("method-override");
// const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });
const client = new pg.Client(process.env.DATABASE_URL);
server.use(cors());

server.set("view engine", "ejs");

server.use(override("_method"));

server.use(layout);

server.use(express.static("./public"));

server.get("/", home);

server.get("/details", detailHandler);

server.get("/search", searchHandler);

server.get("/databaseinit", databaseinit);

var movies_ids = [];
let flag = true;
function databaseinit(req, res) {
  let key = process.env.IMDB_KEY1;
  let url = `https://imdb-api.com/en/API/Top250Movies/${key}`;
  superagent
    .get(url)
    .then((results) => {
      results.body.items.forEach((element) => {
        movies_ids.push(element.id);
      });
    })
    .then(() => {
      movies_ids.forEach((item) => {
        let SQL = `SELECT * FROM movies WHERE  imdb_id='${item}' `;
        client
          .query(SQL)
          .then((results) => {
            // console.log(results);
            if (results.rowCount == 0) {
              flag = false;
              let url2 = `https://imdb-api.com/en/API/Title/${key}/${item}/FullActor,FullCast,Posters,Images,Trailer,Ratings,Wikipedia`;
              superagent.get(url2).then((results) => {
                let result = results.body;
                let actors = result.actorList.reduce((acc, cur) => {
                  return (acc += cur.name + " , ");
                }, "");
                let SQL = `INSERT INTO movies(imdb_id,title,year,image,stars,runtime,genre,actors,plot,trailer,imDb_rate,metacritic_rate,theMovieDb_rate,rottenTomatoes_rate) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) `;
                let safeValues = [
                  result.id,
                  result.title,
                  result.year,
                  result.image,
                  result.stars,
                  result.runtimeMins,
                  result.genres,
                  actors,
                  result.plot,
                  result.trailer.linkEmbed,
                  result.ratings.imDb,
                  result.ratings.metacritic,
                  result.ratings.theMovieDb,
                  result.ratings.rottenTomatoes,
                ];
                client.query(SQL, safeValues);
                // .then((results) => {
                //   res.json({ inst: "true" });
                // });
              });
            }
          })
          .catch((error) => {
            res.json(error);
          });
      });
    })
    .then(() => {
      res.redirect("/");
    });
}

// server.get("/", searchHandler);

function Movie(moviesData) {
  this.id = moviesData.id;
  this.title = moviesData.title;
  this.image = moviesData.image;
  this.year = moviesData.year;
  this.imDbRating = moviesData.imDbRating;
  this.Runtime = moviesData.Runtime;
  this.Genre = moviesData.Genre;
  this.Actors = moviesData.Actors;
  this.Plot = moviesData.Plot;
  this.crew = moviesData.crew;
  this.trailer = moviesData.trailer;
  this.rate = moviesData.rate;
}
let pagination = 10;
function home(req, res) {
  if (req.query.pagination) {
    pagination += +req.query.pagination;
  }
  let SQL = `SELECT * FROM movies limit ${pagination}`;
  client.query(SQL).then((results) => {
    res.render("pages/index", { movies: results.rows });
  });
}

function searchHandler(req, res) {
  let key = process.env.OMDB_KEY1;
  let title = req.query.title;
  // let URL=`https://imdb-api.com/en/API/SearchMovie/k_ksrwxn1u/${title}`
  let URL = `http://www.omdbapi.com/?t=${title}&apikey=${key}`;
  superagent.get(URL).then((results) => {
    let movies = results.body;
    console.log(movies);
    let searchedMov = movies.map((movie) => {
      return new Movie(movie);
    });
    res.render("pages/search", { movies: searchedMov });
  });
}

function detailHandler(req, res) {
  let id = req.query.id;
  let SQL = `SELECT * FROM movies WHERE Id=${id}`;
  client.query(SQL).then((results) => {
    res.render("pages/moviedetails", { movie: results.rows });
  });
}

client.connect().then(() => {
  server.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
  });
});
