
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS users_favorite_list;
DROP TABLE IF EXISTS userfeedback;

CREATE TABLE  movies (
  id SERIAL PRIMARY KEY,
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
  imdb_rate TEXT,
metacritic_rate TEXT,
themoviedb_rate TEXT,
rottentomatoes_rate TEXT
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255),
    useremail CHAR(255),
    password TEXT

);

  -- add foreign key related to the user id
  -- insert movies
CREATE TABLE users_favorite_list (  id SERIAL PRIMARY KEY,  movie_id text,  user_id_fk int );



CREATE TABLE userfeedback (id SERIAL PRIMARY KEY, username TEXT,feedback TEXT);


