

DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS users;


CREATE TABLE  movies (
  Id SERIAL PRIMARY KEY,
  imdb_id TEXT,
  title TEXT,
  year TEXT,
  image TEXT,
  stars TEXT,
  runtime TEXT,
  genre TEXT,
  actors TEXT,
  plot TEXT,
  trailer TEXT,
  imDb_rate TEXT,
metacritic_rate TEXT,
theMovieDb_rate TEXT,
rottenTomatoes_rate TEXT
  );



  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255),
    useremail CHAR(255),
    password CHAR(255)
    )


