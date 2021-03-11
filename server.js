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
const session = require('express-session')
server.use(session({
  name: 'sid',
  resave: false
  , saveUninitialized: false,
  secret: 'secret',
  cookie: {
    maxAge: 1000 * 60 * 60 * 2,
    sameSite: true,
    secure: false,
    httpOnly: false,

  }
}))
server.use(cors());
const secret = process.env.secret;
const saltRounds = 10;
server.use(express.urlencoded({ extended: true }));
const override = require("method-override");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
// const client = new pg.Client(process.env.DATABASE_URL);
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
server.get("/logout", logout);
server.get("/aboutUs", aboutus)
server.get("/moviespage", moviespage)
server.get('/FavoriteList', FavoriteList)
server.get("/random", randomHandler);

server.post("/signup", signupHandler);
server.post("/signin", signinHandler);

server.post('/FavoriteList', FavoriteListHandler)

server.delete('/FavoriteList', deleteHandler)

function signin(req, res) {

  res.render("pages/login")
}
function signup(req, res) {

  res.render("pages/signup")
}

function logout(req, res) {
  req.session = null
  res.clearCookie("sid", { path: '/' });
  res.redirect('/');
}

function FavoriteList(req, res) {
  let moviesAfterCombination = []
  if (req.session.sid == null)
    res.render("pages/logout")

  let user_id = req.session.sid

  let query = `select * from  users_favorite_list ufl  join users u on ufl.user_id_fk = u.id where u.id = $1`
  let safeValues2 = [+user_id]

  const tempArr = []
  const tempArr2 = []
  client.query(query, safeValues2).then(result => {
    if (result.rowCount != 0) {

      result.rows.forEach(val => {
        tempArr.push(val)
      })

    }
    else {
      console.log("what the hack")
      let noitems = "No Favorite movies Added"
      res.render('pages/FavoriteList', { movies: moviesAfterCombination, user_id: user_id, no_items: noitems });
    }
  }).then(() => {

    if (tempArr.length != 0) {

      let query3 = `select * from  movies `

      client.query(query3).then(resultss => {
        resultss.rows.forEach(val => {
          tempArr2.push(val)
        })

      }).then(() => {

        tempArr2.map((val, id) => {
          tempArr.map((val2, id) => {
            if (val.imdb_id == val2.movie_id) {
              let c = new Movie(val)
              moviesAfterCombination.push(c)
            }
          })
        })
        res.render('pages/FavoriteList', { movies: moviesAfterCombination, user_id: user_id });
      })
    }
  })



}

function aboutus(req, res) {
  res.render("pages/AboutUs")
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

  let SQL = `INSERT INTO userfeedback (username ,feedback) VALUES ($1 , $2) RETURNING id;`
  let saveValues = [req.body.username, req.body.feedback];

  client.query(SQL, saveValues)
    .then(result => {


    })
}

function reviewskHandler(req, res) {
  let SQL1 = `SELECT * FROM userfeedback;`
  client.query(SQL1)
    .then(result => {


      res.render("pages/ContactUs", { users: result.rows });
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

  this.id = moviesData.Id;
  this.imdb_id = moviesData.imdb_id;
  this.title = moviesData.title;
  this.year = moviesData.year;
  this.image = moviesData.image;
  this.stars = moviesData.stars;
  this.runtime = moviesData.runtime;
  this.genre = moviesData.genre;
  this.actors = moviesData.actors;
  this.plot = moviesData.plot;
  this.trailer = moviesData.trailer;
  this.imdb_rate = moviesData.imdb_rate;
  this.metacritic_rate = moviesData.metacritic_rate
  this.theMovieDb_rate = moviesData.theMoviedb_rate
  this.rottenTomatoes_rate = moviesData.rottentomatoes_rate


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
        // https://imdb-api.com/en/API/Search/k_ua1qw1ok/saw
        // https://imdb-api.com/en/API/Title/k_ua1qw1ok/tt0387564/FullActor,FullCast,Posters,Images,Trailer,Ratings,Wikipedia
        let URL = `https://imdb-api.com/en/API/Search/${key}/${title}`
        superagent.get(URL).then((result) => {
          if (result.body.results.length > 0) {
            result.body.results.map(item => {
              let url2 = `https://imdb-api.com/en/API/Title/${key}/${item.id}/FullActor,FullCast,Posters,Images,Trailer,Ratings,Wikipedia`;
              superagent.get(url2).then((data) => {
                let dataium = data.body;
                let actors
                if (dataium.actorList) {
                  actors = dataium.actorList.reduce((acc, cur) => {
                    return (acc += cur.name + " , ");
                  }, "");
                }

                console.log(result.actorList)
                let SQL = `INSERT INTO movies(imdb_id,title,year,image,stars,runtime,genre,actors,plot,trailer,imDb_rate,metacritic_rate,theMovieDb_rate,rottenTomatoes_rate) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning * `;
                let safeValues = [
                  dataium.id,
                  dataium.title ? dataium.title : "",
                  dataium.year ? dataium.year : "",
                  dataium.image,
                  dataium.stars ? dataium.stars : "",
                  dataium.runtimeMins ? dataium.runtimeMins : "",
                  dataium.genres ? dataium.genres : "",
                  actors ? actors : "",
                  dataium.plot ? dataium.plot : "",
                  typeof dataium.trailer.linkEmbed != "undefined" ? dataium.trailer.linkEmbed : "",
                  dataium.ratings.imDb ? dataium.ratings : "",
                  dataium.ratings.metacritic ? dataium.ratings : "",
                  dataium.ratings.theMovieDb ? dataium.ratings : "",
                  dataium.ratings.rottenTomatoes ? dataium.ratings : "",
                ];
                client.query(SQL, safeValues).then((returnedData) => {
                  searchedMov.push(returnedData)
                });

              });
            })
          }
        }).then(() => {
          let SQL = `SELECT * FROM movies WHERE title LIKE '%${title}%' ;`
          client.query(SQL)
            .then(data => {
              res.render("pages/moviespage", { movies: data.rows });
            })
        })

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


        req.session.sid = result.rows[0].id

        res.render("pages/index", { user_id: result.rows[0].id })
      })
    }
    else {
      res.render("pages/signup", { error: "User Already Exists", flag: 1 })
    }

  })

}

function signinHandler(req, res, next) {

  let { email, password } = req.body

  let checkForUserExistanceQuery = `select * from users where useremail=$1;`
  // select * from users where useremail='anas@anas.anas' and password= '$2b$10$DkJWfgTbxMCzgjQPQXpiYeQNeiC3XPsLMb4I.SHMtR3YcwMo.cSCq'  

  let safevals = [email]
  let encryptedPassword = cryptPassword(password)

  client.query(checkForUserExistanceQuery, safevals).then((result) => {

    if (result.rowCount == 1) {

      let userPwd = result.rows[0].password;
      let userIsExists = authinticate_user(password, userPwd)

      if (userIsExists) {

        req.session.sid = result.rows[0].id

        res.render("pages/index", { user_id: result.rows[0].id })
      }

      else {
        res.render("pages/signup", { error: "wrong password", flag: 2 })

      }

    }
    else {
      res.render("pages/signup", { error: "Wrong E-mail or Password", flag: 2 })
    }
  })
}
function FavoriteListHandler(req, res) {
  let { imdb_id, user_id } = req.body;
  let moviesAfterCombination = []
  let SQL = `INSERT INTO users_favorite_list ( movie_id, user_id_fk) VALUES ($1, $2) RETURNING user_id_fk;`;
  let safeValues = [imdb_id, +user_id];
  client.query(SQL, safeValues)
  let query = `select * from  users_favorite_list ufl  join users u on ufl.user_id_fk = u.id where u.id = $1`
  let safeValues2 = [+user_id]
  const tempArr = []
  const tempArr2 = []
  client.query(query, safeValues2).then(result => {
    if (result.rowCount != 0) {

      result.rows.forEach(val => {
        tempArr.push(val)
      })

    }
  }).then(() => {
    if (tempArr.length != 0) {
      let query3 = `select * from  movies `
      client.query(query3).then(resultss => {
        resultss.rows.forEach(val => {
          tempArr2.push(val)
        })
      }).then(() => {
        tempArr2.map((val, id) => {

          tempArr.map((val2, id) => {
            if (val.imdb_id == val2.movie_id) {
              let c = new Movie(val)
              moviesAfterCombination.push(c)
            }
          })
        })
        res.render('pages/FavoriteList', { movies: moviesAfterCombination, user_id: user_id });
      })
    }
  })
}
function deleteHandler(req, res) {
  let { imdb_id, user_id } = req.body
  let SQL = `DELETE FROM users_favorite_list where movie_id=$1 and user_id_fk=$2  `
  let safe = [imdb_id, user_id]
  client.query(SQL, safe)
  res.redirect("/FavoriteList")
}



function randomHandler(req, res) {
  let SQL = `SELECT * FROM movies ;`;
  client.query(SQL).then((result) => {
    res.render("pages/random", { movie: [result.rows[randomInt()]] });

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
