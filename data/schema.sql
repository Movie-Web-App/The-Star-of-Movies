

DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS usersMovies;



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
    password TEXT

    );

  -- add foreign key related to the user id
  -- insert movies
CREATE TABLE users_favorite_list (
  id SERIAL PRIMARY KEY,
  movie_id int,
  user_id_fk int
  
);

ALTER TABLE users_favorite _list ADD CONSTRAINT FOREIGN KEY (user_id_fk)  REFERENCES  users(id);




