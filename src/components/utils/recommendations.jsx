/**
 * Calculate personalized movie recommendations based on:
 * - User's watch history
 * - User's ratings/reviews
 * - User's explicitly stated favorite genres
 * - Genre preferences from behavior
 * - Similar movies to current one
 */
export function getRecommendations({
  allMovies,
  currentMovie,
  watchHistory = [],
  userReviews = [],
  userList = [],
  userFavoriteGenres = [],
  limit = 10
}) {
  if (!currentMovie || !allMovies || allMovies.length === 0) {
    return [];
  }

  // Get movies user has already watched
  const watchedMovieIds = new Set(watchHistory.map(h => h.movie_id));
  
  // Calculate user's genre preferences from history and ratings
  const genreScores = {};
  
  // HIGHEST PRIORITY: User's explicitly stated favorite genres (50% weight boost)
  userFavoriteGenres.forEach(genre => {
    genreScores[genre] = (genreScores[genre] || 0) + 10;
  });
  
  // Add points for watched movies
  watchHistory.forEach(history => {
    const movie = allMovies.find(m => m.id === history.movie_id);
    if (movie?.genre) {
      movie.genre.forEach(g => {
        genreScores[g] = (genreScores[g] || 0) + 1;
        // Bonus for completed movies
        if (history.completed) {
          genreScores[g] += 2;
        }
      });
    }
  });

  // Add points for rated movies (weighted by rating)
  userReviews.forEach(review => {
    const movie = allMovies.find(m => m.id === review.movie_id);
    if (movie?.genre) {
      const ratingWeight = review.rating / 5; // Normalize to 0-1
      movie.genre.forEach(g => {
        genreScores[g] = (genreScores[g] || 0) + (3 * ratingWeight);
      });
    }
  });

  // Add points for movies in user's list
  userList.forEach(item => {
    const movie = allMovies.find(m => m.id === item.movie_id);
    if (movie?.genre) {
      movie.genre.forEach(g => {
        genreScores[g] = (genreScores[g] || 0) + 1.5;
      });
    }
  });

  // Score each movie
  const scoredMovies = allMovies
    .filter(m => 
      m.id !== currentMovie.id && // Not current movie
      !watchedMovieIds.has(m.id) // Not already watched
    )
    .map(movie => {
      let score = 0;

      // 1. Genre overlap with current movie (30% weight)
      if (currentMovie.genre && movie.genre) {
        const commonGenres = currentMovie.genre.filter(g => movie.genre.includes(g));
        score += commonGenres.length * 15;
      }

      // 2. User's genre preferences (40% weight)
      if (movie.genre) {
        movie.genre.forEach(g => {
          score += (genreScores[g] || 0) * 2;
        });
      }

      // 3. Same director (15% weight)
      if (currentMovie.director && movie.director === currentMovie.director) {
        score += 20;
      }

      // 4. Similar release year (10% weight)
      if (currentMovie.release_year && movie.release_year) {
        const yearDiff = Math.abs(currentMovie.release_year - movie.release_year);
        if (yearDiff <= 3) score += 10;
        else if (yearDiff <= 5) score += 5;
      }

      // 5. Movies in user's list get a boost (5% weight)
      if (userList.some(item => item.movie_id === movie.id)) {
        score += 8;
      }

      return { movie, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.movie);

  // If we don't have enough recommendations, fill with genre-similar movies
  if (scoredMovies.length < limit && currentMovie.genre) {
    const fallbackMovies = allMovies
      .filter(m => 
        m.id !== currentMovie.id &&
        !watchedMovieIds.has(m.id) &&
        !scoredMovies.includes(m) &&
        m.genre?.some(g => currentMovie.genre.includes(g))
      )
      .slice(0, limit - scoredMovies.length);
    
    scoredMovies.push(...fallbackMovies);
  }

  return scoredMovies;
}