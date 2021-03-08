DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS movies_id;

CREATE TABLE IF NOT EXISTS movies (

  id SERIAL PRIMARY KEY,
  Title VARCHAR(255),
  Year VARCHAR(255),
  Runtime VARCHAR(255),
  Genre VARCHAR(255),
  Actors VARCHAR(255),
  Plot VARCHAR(255),
  image VARCHAR(255),
  crew VARCHAR(255),
  imDbRating VARCHAR(255),
  imDbRatingCount VARCHAR(255) 
  );

--  duration, genres, actors, plot_Summary, languages, imdb_id
CREATE TABLE movies_id (
  id SERIAL PRIMARY KEY,
  imdb_id VARCHAR(255) references movies(id)  
);


  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255),
    useremail CHAR(255),
    password CHAR(255)
    )


