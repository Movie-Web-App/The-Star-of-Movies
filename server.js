'use strict';

const express = require('express')
var expressLayouts = require('express-layouts');
require('dotenv').config();
const cors = require('cors');

const superagent = require('superagent');

const PORT = process.env.PORT || 4800;
const server = express();
server.use(cors());
server.use(expressLayouts);
const methodOverride = require('method-override');

server.set('view engine', 'ejs');

server.use(express.static("./public"));
server.use(express.urlencoded({ extended: true }));
server.use(methodOverride('_method'));

const pg = require('pg');

// const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });
const client = new pg.Client(process.env.DATABASE_URL);

client.connect()
    .then(() => {
        server.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
    });


server.get('/', homeHandler);

server.get('/search', searchHandler)
function searchHandler(req, res) {
    res.render('search.ejs')
}

server.get('/login', loginHandler);
server.get('/moviespage', moviesHandler);

function loginHandler(req,res) {
    // MAKE SURE EMAIL AND PASSWORD ARE CORRECT 
    res.render('pages/login')
}

// function movieHandler(req,res) {
//     // MAKE SURE LOGGED IN 
//     res.render('pages/moviespage').
// }

server.get('/movies', moviesHandler);

// INSERT USER DATA INSIDE USER TABLE
server.post('/movies', moviesHandler)

server.get('/moviedetails/:id', detailsHandler);


function detailsHandler(req,res) {
    console.log('HIIIIIIIIIIIIII');
    let id = req.params.id;
    let SQL = `SELECT * FROM movies WHERE id=$1;`;
    let values = [id];
    console.log('HELOOOOOOOOOOOOOOOOOOOOOOOOOOOO');
    client.query(SQL, values)
        .then((result) => {
            console.log('MAKE SURE',result.rows[0]);
            res.render('pages/moviedetails', { movie :result.rows[0]});
        })
        .catch(() => {
            errorHandler('Error in getting Database');
        });
}

function errorHandler(errors) {
    server.use('*', (req, res) => {
        res.status(500).send(errors);
    })
}

function moviesHandler(req, res) {
    let id = req.params.id;
    // let page = req.query.page;
    // let offset = (page - 1) * 5;
    let key = process.env.MOVIES_KEY;
    let url = `https://imdb-api.com/en/API/Top250Movies/${key}`;

    let generalUrl = `http://www.omdbapi.com/?i=${id}&apikey=${key}`;
    let trailerUrl = `https://imdb-api.com/en/API/Title/${key}/${id}/FullActor,FullCast,Posters,Images,Trailer,Ratings,Wikipedia`

    

    superagent.get(url)
        .then(moviesData => {
            // console.log(moviesData.body);
            let moviesArr = moviesData.body.items.map((val) => {
                
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
            
            res.render('pages/moviespage', { movies: moviesArr });

        })
}

function homeHandler(req, res) {
    res.render('pages/home')
}

function Movies(moviesData) {
    this.id = moviesData.id;
    this.title = moviesData.title;
    this.image = moviesData.image;
    this.year = moviesData.year;
    this.imDbRating = moviesData.imDbRating ; 
    this.plot = moviesData.Plot;
    // this.trailer = moviesData.trailer.linkEmbed;
    this.runtime = moviesData.Runtime;
    this.actors = moviesData.Actors;
}

