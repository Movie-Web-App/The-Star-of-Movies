"use strict";

const express = require("express");
require("dotenv").config();
const cors = require("cors");
const pg=require('pg');
const superagent = require("superagent");
const layout=require('express-ejs-layouts')
const PORT = process.env.PORT || 4800;
const server = express();

const override=require('method-override')
// const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });
const client = new pg.Client(process.env.DATABASE_URL);
server.use(cors());

server.set("view engine", "ejs");

server.use(override('_method'))

server.use(layout);

server.use(express.static("./public"));

server.get("/", home);

server.get("/search", searchHandler);

server.get('/databaseinit',databaseinit);

let movies_ids=[];



function databaseinit(req,res){
let key = process.env.moviesKey;
let url = `https://imdb-api.com/en/API/Top250Movies/${key}`;
superagent.get(url).then(results=>{
movies_ids.push(results.body.id);
})
movies_ids.forEach(item=>{
  let SQL=`SELECT * FROM movies WHERE  imdb_id=${item} `
  client.query(SQL).then(results=>{
    if(results.rowCount===0){
      let url2=`https://imdb-api.com/en/API/Title/${key}/${item}/FullActor,FullCast,Posters,Images,Trailer,Ratings,Wikipedia`
      superagent.get(url2).then(results=>{
     let result=results.body 
     let actors=actorList.reduce((acc,cur)=>{
      return acc+=cur.name+' , '

     },'')

     let SQL=`INSERT INTO movies values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETARNING imdb_id`
     let safeValues=[result.id,result.title,result.year,result.image,result.stars,result.runtimeMins,result.genres,actors,result.Plot,result.trailer.linkEmbed,result.ratings.imDb_rate,result.ratings.metacritic_rate,result.ratings.theMovieDb_rate,result.ratings.rottenTomatoes_rate]
     client.query(SQL,safeValues).then(results=>{
      res.json(results)
    
     })
      })

    }
  

  })
})

}












// server.get("/", searchHandler);

function Movie(moviesData) {
  this.id = moviesData.id;
  this.title = moviesData.title;
  this.image = moviesData.image;
  this.year = moviesData.year;
  this.imDbRating = moviesData.imDbRating;
  this.Runtime=moviesData.Runtime
  this.Genre=moviesData.Genre
  this.Actors=moviesData.Actors
  this.Plot=moviesData.Plot
  this.crew=moviesData.crew
  this.trailer=moviesData.trailer
  this.rate=moviesData.rate
}

function home(req, res) {
  let key = process.env.moviesKey;
  let url = `https://imdb-api.com/en/API/Top250Movies/${key}`;
  superagent.get(url).then((moviesData) => {
    let moviesArr = moviesData.body.items.map((val) => {

    // let SQL1='INSERT INTO movies values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)'

      // let url1 = `https://imdb-api.com/en/API/YouTubeTrailer/${key}/${val.id}`;
      // let moviesTrailerArr = [];
      // superagent.get(url1)
      //     .then(movieTrailer => {
      //         console.log("hellooo" ,movieTrailer.body)

      //         // moviesTrailerArr.push(movieTrailer.videoUrl);
      //         moviesTrailerArr = movieTrailer.body.map(value=> {
      //             return value.videoUrl ;
      //         })
      //         console.log("hiiiiiiiiiiiiiiiii" , moviesTrailerArr);
      //     })
      return new Movies(val);
    });

    res.render("pages/home", { movies: moviesArr });
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
client.connect().then(()=>{

  server.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
  })
})
