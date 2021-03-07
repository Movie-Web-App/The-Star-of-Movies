DROP TABLE IF EXISTS movies;

CREATE TABLE IF NOT EXISTS movies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  realese_year CHAR(255),
  rating CHAR(255),
  realese_date CHAR(255),
  runtime CHAR(255),
  genres CHAR(255),
  director CHAR(255),
  writer CHAR(255),
  actors VARCHAR(255),
  plot_Summary CHAR(255),
  languages CHAR(255),
  country CHAR(255),
  awards_won CHAR(255),
  movie_poster VARCHAR(255),
  ratings_recieved CHAR(255),
  metascore CHAR(255),
  imdb_rating CHAR(255),
  imdb_votes CHAR(255),
  imdb_id CHAR(255),
  type CHAR(255),
  dvd_info CHAR(255),
  box_office_results CHAR(255),
  production_company CHAR(255),
  website CHAR(255)
  };