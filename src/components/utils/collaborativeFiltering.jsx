/**
 * Calculate "Users who watched this also watched" recommendations
 * Uses collaborative filtering based on watch history overlap
 */
export function getUsersAlsoWatched({
  currentMovieId,
  allMovies,
  allWatchHistory,
  currentUserEmail,
  limit = 12
}) {
  if (!currentMovieId || !allWatchHistory || allWatchHistory.length === 0) {
    return [];
  }

  // Find all users who watched the current movie
  const usersWhoWatchedCurrent = allWatchHistory
    .filter(h => h.movie_id === currentMovieId && h.user_email !== currentUserEmail)
    .map(h => h.user_email);

  if (usersWhoWatchedCurrent.length === 0) {
    return [];
  }

  // Find what else these users watched
  const movieScores = {};
  
  allWatchHistory.forEach(history => {
    // Skip if not from relevant users or if it's the current movie
    if (!usersWhoWatchedCurrent.includes(history.user_email) || 
        history.movie_id === currentMovieId) {
      return;
    }

    if (!movieScores[history.movie_id]) {
      movieScores[history.movie_id] = {
        count: 0,
        completedCount: 0,
        users: new Set()
      };
    }

    // Count unique users who watched this movie
    movieScores[history.movie_id].users.add(history.user_email);
    movieScores[history.movie_id].count += 1;
    
    // Bonus for completed watches
    if (history.completed) {
      movieScores[history.movie_id].completedCount += 1;
    }
  });

  // Calculate final scores and sort
  const recommendations = Object.entries(movieScores)
    .map(([movieId, data]) => {
      // Score based on:
      // - Number of unique users (primary)
      // - Completion rate (secondary)
      const uniqueUsers = data.users.size;
      const completionRate = data.completedCount / data.count;
      const score = uniqueUsers * 10 + (completionRate * 5);
      
      const movie = allMovies.find(m => m.id === movieId);
      return { movie, score, viewerCount: uniqueUsers };
    })
    .filter(item => item.movie) // Only include movies that exist
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => ({
      ...item.movie,
      viewerCount: item.viewerCount // Add viewer count for display
    }));

  return recommendations;
}