"use strict";
let pagination = 10;
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
const ejslint = require('ejs-lint');
server.use(express.urlencoded({ extended: true }));


const secret = process.env.secret;
const saltRounds = 10;

server.use(express.urlencoded({ extended: true }));

const override = require("method-override");
// const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });
const client = new pg.Client(process.env.DATABASE_URL);
server.use(cors());

server.set("view engine", "ejs");
server.use(override("_method"));
server.use(layout);
server.use(express.static("./public"));
server.get("/", home);
server.get("/signup", signup);
server.get("/signin", signin);
server.get("/contactUs", contactUs);
server.post("/feedback", feedbackHandler);
server.get("/feedback", reviewskHandler);
server.get("/details", detailHandler);
server.get("/search", searchHandler);
server.get("/databaseinit", databaseinit);
server.get("/signup", signup);
server.get("/signin", signin);
server.get("/logout", logout);
server.get("/aboutUs", aboutus)
server.get("/moviespage", moviespage)
server.get('/FavoriteList', FavoriteList)



server.post("/signup", signupHandler);
server.post("/signin", signinHandler);

server.post('/FavoriteList/:id', FavoriteListHandler)
server.put('/FavoriteList/:id', FavoriteListHandler)
server.delete('/FavoriteList/:id', FavoriteListHandler)

server.get("/verifyUser", verifyUserHandler);


function signin(req, res) {

  res.render("pages/login")
}
function signup(req, res) {

  res.render("pages/signup")
}
function logout(req, res) {

  res.render("pages/logout")
}

function FavoriteList(req, res) {
  res.render("pages/FavoriteList")
}


function aboutus(req, res) {
  res.render("pages/aboutUs")
}

function moviespage(req, res) {
  if (req.query.pagination) {
    pagination += +req.query.pagination;
  }
  let SQL = `SELECT * FROM movies limit ${pagination}`;
  client.query(SQL).then((results) => {
    res.render("pages/moviespage", { movies: results.rows });
  });
}




function feedbackHandler(req, res) {
  console.log(req.body);
  let SQL = `INSERT INTO userfeedback (username ,feedback) VALUES ($1 , $2) RETURNING id;`
  let saveValues = [req.body.username, req.body.feedback];

  client.query(SQL, saveValues)
    .then(result => {
      console.log("inserted into db");

    })
}

function reviewskHandler(req, res) {
  let SQL1 = `SELECT * FROM userfeedback;`

  client.query(SQL1)
    .then(result => {

      console.log(result);
    })

}


var movies_ids = [];
let flag = true;

function databaseinit(req, res) {
  let key = process.env.IMDB_KEY6;
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
                if (result.actorList) {
                  let actors = result.actorList.reduce((acc, cur) => {
                    return (acc += cur.name + " , ");
                  }, "");
                }
                let SQL = `INSERT INTO movies(imdb_id,title,year,image,stars,runtime,genre,actors,plot,trailer,imDb_rate,metacritic_rate,theMovieDb_rate,rottenTomatoes_rate) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) `;
                let safeValues = [
                  result.id,
                  result.title ? result.title : "",
                  result.year ? result.year : "",
                  result.image,
                  result.stars ? result.stars : "",
                  result.runtimeMins ? result.runtimeMins : "",
                  result.genres ? result.genres : "",
                  actors ? actors : "",
                  result.plot ? result.plot : "",
                  result.trailer.linkEmbed ? result.trailer : "",
                  result.ratings.imDb ? result.ratings : "",
                  result.ratings.metacritic ? result.ratings : "",
                  result.ratings.theMovieDb ? result.ratings : "",
                  result.ratings.rottenTomatoes ? result.ratings : "",
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
  var separateWord = words.toLowerCase().split(" ");
  for (var i = 0; i < separateWord.length; i++) {
    separateWord[i] = separateWord[i].charAt(0).toUpperCase() +
      separateWord[i].substring(1);
  }
  return separateWord.join(" ");
}



function home(req, res) {
  res.render("pages/index")
}

function searchHandler(req, res) {
  let searchedMov = []
  const key = process.env.IMDB_KEY2;
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
              if (result.actorList) {
                let actors = result.actorList.reduce((acc, cur) => {
                  return (acc += cur.name + " , ");
                }, "");
              }
              let SQL = `INSERT INTO movies(imdb_id,title,year,image,stars,runtime,genre,actors,plot,trailer,imDb_rate,metacritic_rate,theMovieDb_rate,rottenTomatoes_rate) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning * `;
              let safeValues = [
                result.id,
                result.title ? result.title : "",
                result.year ? result.year : "",
                result.image,
                result.stars ? result.stars : "",
                result.runtimeMins ? result.runtimeMins : "",
                result.genres ? result.genres : "",
                actors ? actors : "",
                result.plot ? result.plot : "",
                result.trailer.linkEmbed ? result.trailer : "",
                result.ratings.imDb ? result.ratings : "",
                result.ratings.metacritic ? result.ratings : "",
                result.ratings.theMovieDb ? result.ratings : "",
                result.ratings.rottenTomatoes ? result.ratings : "",
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


  return bcrypt.hashSync(password, saltRounds)

}

function authinticate_user(password, hash) {

  return bcrypt.compareSync(password, hash);
}


function isValidEmail(email) {

  return /\S+@\S+\.\S+/.test(email);
}

function generateToken(id) {
  const token = jwt.sign({
    exp: Math.floor(Date.now() / 1000) + 60,
    userId: id
  },
    process.env.JWT_PRIVATE_KEY.replace(/\\n/gm, '\n')
  );
  return token;
}

function verifyToken(token) {

  const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
  console.log(decoded)
  return decoded
}

function verifyUserHandler(req, res) {
  console.log(localStorage.getItem('user_token'))
}

function signupHandler(req, res) {

  let { username, email, password } = req.body


  if (!isValidEmail(email)) {
    res.render("pages/signup", { error: "Invalid Email" })
  }

  let checkForUserExistanceQuery = `select * from users where useremail=$1`
  let safevals = [email]
  client.query(checkForUserExistanceQuery, safevals).then((result) => {
    if (result.rowCount == 0) {
      password = cryptPassword(password)

      let query = "insert into users(username, useremail,password) values($1,$2,$3) returning id"
      let safe = [username, email, password]
      client.query(query, safe).then((result) => {

        let token = generateToken(result.rows[0].id)

        res.render("pages/index", { saveTokenLocally: token, user_id: result.rows[0].id })
      })
    }
    else {
      res.render("pages/signup", { error: "User Already Exists" })
    }

  })

}

function signinHandler(req, res, next) {

  let { email, password } = req.body
  console.log(req.body)
  let checkForUserExistanceQuery = `select * from users where useremail=$1;`
  // select * from users where useremail='anas@anas.anas' and password= '$2b$10$DkJWfgTbxMCzgjQPQXpiYeQNeiC3XPsLMb4I.SHMtR3YcwMo.cSCq'  
  let safevals = [email]
  console.log(checkForUserExistanceQuery)
  client.query(checkForUserExistanceQuery, safevals).then((result) => {
    console.log(result.rows)
    if (result.rowCount == 1) {
      console.log(result.rowCount)
      let userPwd = result.rows[0].password;
      let userIsExists = authinticate_user(password, userPwd)

      if (userIsExists) {

        let token = generateToken(result.rows[0].id)

        res.render("pages/index", { saveTokenLocally: token, user_id: result.rows[0].id })
      }

      else {
        res.json({ "state": "wrong password" })
      }

      // res.render("pages/index", { saveTokenLocally: localStorage.setItem('user_token', token) })
    }
    else {
      res.render("pages/signup", { error: "Wrong E-mail or Password" })
    }
  })
}

function FavoriteListHandler(req, res) {

}

// server.get("/FavoriteList/:id", (req, res) => {
//   let id = req.query.id;
//   let SQL = `SELECT * FROM movies WHERE id=$1;`;
//   let values = [id];
//   client.query(SQL, values)
//       .then((result) => {
//           console.log('MAKE SURE',result.rows[0]);
//           res.render('moviedetails', { item :result.rows[0]});
//           // res.render('pages/books/show', { book :result.rows[0]});
//       })
//       .catch(() => {
//           errorHandler('Error in getting Database');
//       });
// });

// server.post('/FavoriteList/:id', (req, res) => {
//   console.log(req.body);
//   let id = req.params.id;
//   let newSQL = `INSERT INTO usersmovies (title, year, image) VALUES ($1, $2, $3) RETURNING id;`;
//   let newValues = [req.body.title, req.body.year, req.body.image];

//   return client.query(newSQL, newValues)
//     .then(result => {
//       res.redirect(`/FavoriteList/${result.rows[0].id}`);
//     })
//     .catch(()=>{
//               errorHandler('Error in getting data!!');
//           })
//

server.get("/random", randomHandler);
function randomHandler(req, res) {
  let SQL = `SELECT * FROM movies ;`;
  client.query(SQL).then((result) => {
    res.render("pages/random", { random: result.rows[randomInt()] });
    console.log(result.rows[randomInt()]);
  });
}

function contactUs(req, res) {
  res.render("pages/ContactUs")
}
function randomInt() {
  return Math.floor(Math.random() * (250 - 0 + 1) + 0);
}
client.connect().then(() => {
  server.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
  });
});
