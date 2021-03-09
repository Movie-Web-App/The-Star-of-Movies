"use strict";

const express = require("express");
require("dotenv").config();
const cors = require("cors");
const pg = require("pg");
const superagent = require("superagent");
const layout = require("express-ejs-layouts");
const PORT = process.env.PORT || 4800;
const server = express();
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

const secret = process.env.secret;
const saltRounds = 10;

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
server.get("/signup", signup);
server.get("/signin", signin);

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

function capitalizeTheFirstLetterOfEachWord(words) {
  var separateWord = words.toLowerCase().split(' ');
  for (var i = 0; i < separateWord.length; i++) {
    separateWord[i] = separateWord[i].charAt(0).toUpperCase() +
      separateWord[i].substring(1);
  }
  return separateWord.join(' ');
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
  let searchedMov = []
  const key = process.env.IMDB_KEY1;
  let title = null
  if (req.query.search)
    title = capitalizeTheFirstLetterOfEachWord(req.query.search);
  else
    res.redirect("/")
  let SQL = `SELECT * FROM movies WHERE title LIKE '%${title}%' ;`

  client.query(SQL)
    .then(data => {

      if (data.rowCount == 0) {

        let URL = `https://imdb-api.com/en/API/Search/${key}/${title}`
        superagent.get(URL).then((results) => {
          results.body.results.map(item => {
            let url2 = `https://imdb-api.com/en/API/Title/${key}/${item.id}/FullActor,FullCast,Posters,Images,Trailer,Ratings,Wikipedia`;
            superagent.get(url2).then((results) => {
              let result = results.body;
              let actors = result.actorList.reduce((acc, cur) => {
                return (acc += cur.name + " , ");
              }, "");
              let SQL = `INSERT INTO movies(imdb_id,title,year,image,stars,runtime,genre,actors,plot,trailer,imDb_rate,metacritic_rate,theMovieDb_rate,rottenTomatoes_rate) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning * `;
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
              client.query(SQL, safeValues).then((returnedData) => {
                searchedMov.push(returnedData)
              });

            });
          })

        }).then(() => {
          console.log(searchedMov);
          res.render("pages/moviespage", { movies: searchedMov });
        })
          .catch((error) => {
            res.json(error)
          });
      } else {
        // res.json(result)
        res.render("pages/moviespage", { movies: data.rows });

      }
    })
}

function detailHandler(req, res) {
  let id = req.query.id;
  let SQL = `SELECT * FROM movies WHERE Id=${id}`;
  client.query(SQL).then((results) => {
    res.render("pages/moviedetails", { movie: results.rows });
  });
}

function cryptPassword(password) {


  bcrypt.hash(password, saltRounds, (err, hash) => {

    return hash

  })
}

function isValidEmail(email) {

  return /\S+@\S+\.\S+/.test(email);
}

function generateToken(id) {
  const token = jwt.sign({
    userId: id
  },
    process.env.SECRET, { expiresIn: '7d' }
  );
  return token;
}

function verifyToken(req, res, next) {
  const token = req.headers['x-access-token'];
  if (!token) {
    return res.status(400).send({ 'message': 'Token is not provided' });
  }
  try {
    const decoded = await jwt.verify(token, process.env.SECRET);
    const text = 'SELECT * FROM users WHERE id = $1';
    const { rows } = await db.query(text, [decoded.userId]);
    if (!rows[0]) {
      return res.status(400).send({ 'message': 'The token you provided is invalid' });
    }
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(400).send(error);
  }
}

function signup(req, res, next) {
  let { username, useremail, password } = req.params

  let checkForUserExistanceQuery = `select * from users where useremail=$1`
  let safevals = [useremail]
  client.query(checkForUserExistanceQuery, safevals).then((result) => {
    if (result.rowCount == 0) {
      password = cryptPassword(password)
      let query = "insert into users(username, useremail,password) values($1,$2,$3)"
      let safe = [username, useremail, password]
      client.query(query, safe).then((result) => {
        res.redirect("/login")
      })
    }
    else {
      res.render("pages/signup")
    }

  })

}

function signin(req, res, next) {

}

client.connect().then(() => {
  server.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
  });
});