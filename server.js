'use strict';

const express = require('express')
require('dotenv').config();
const cors = require('cors');

const superagent = require('superagent');

const PORT = process.env.PORT || 4800;
const server = express();
server.use(cors());

server.set('view engine', 'ejs')

server.use(express.static("./public"));

server.listen(PORT, () => {
    console.log(`server is listening to ${PORT}`)
})


server.get('/', testFun)
function testFun(req, res) {
    res.send('hello')
}


server.get('/search', searchHandler)
function searchHandler(req, res) {
    res.render('search.ejs')
}

server.get('/movies', moviesHandler);



function moviesHandler(req, res) {

    let key = process.env.moviesKey;
    let url = `https://imdb-api.com/en/API/Top250Movies/${key}`;

    

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

function Movies(moviesData) {
    this.id = moviesData.id;
    this.title = moviesData.title;
    this.image = moviesData.image;
    this.year = moviesData.year;
    this.imDbRating = moviesData.imDbRating ; 
    // this.trailer = moviesData.
}

