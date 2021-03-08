DROP CONSTRAINT  fk_movies_id
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS movies_id;





CREATE TABLE  movies (
  id SERIAL PRIMARY KEY,
  imdb_id VARCHAR(255),
  title VARCHAR(255),
  year VARCHAR(255),
  image VARCHAR(255),
  stars VARCHAR(255),
  runtime VARCHAR(255),
  genre VARCHAR(255),
  actors VARCHAR(255),
  plot VARCHAR(255),
  trailer VARCHAR(255),
  imDb_rate VARCHAR(255),
metacritic_rate VARCHAR(255),
theMovieDb_rate VARCHAR(255),
rottenTomatoes_rate VARCHAR(255)
  );



  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255),
    useremail CHAR(255),
    password CHAR(255)
    )


