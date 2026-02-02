import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import HeroSection from '../components/movies/HeroSection';
import MovieRow from '../components/movies/MovieRow';
import ContinueWatchingRow from '../components/movies/ContinueWatchingRow';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRecommendations } from '../components/utils/recommendations';

export default function Home() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  // Fetch all movies
  const { data: movies = [], isLoading } = useQuery({
    queryKey: ['movies'],
    queryFn: () => base44.entities.Movie.list('-created_date', 100),
  });

  // Fetch user's list
  const { data: userList = [] } = useQuery({
    queryKey: ['userList', user?.email],
    queryFn: () => base44.entities.UserList.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  // Fetch watch history for continue watching
  const { data: watchHistory = [] } = useQuery({
    queryKey: ['watchHistory', user?.email],
    queryFn: () => base44.entities.WatchHistory.filter({ user_email: user.email }, '-last_watched', 20),
    enabled: !!user?.email,
  });

  // Fetch user's reviews for recommendations
  const { data: userReviews = [] } = useQuery({
    queryKey: ['userReviews', user?.email],
    queryFn: () => base44.entities.Review.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  // Add/remove from list mutation
  const listMutation = useMutation({
    mutationFn: async (movie) => {
      const existing = userList.find(item => item.movie_id === movie.id);
      if (existing) {
        await base44.entities.UserList.delete(existing.id);
      } else {
        await base44.entities.UserList.create({
          movie_id: movie.id,
          user_email: user.email
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userList'] });
    },
    onError: () => {
      toast.error('Please sign in to add movies to your list');
    }
  });

  const handleAddToList = (movie) => {
    if (!user) {
      toast.error('Please sign in to add movies to your list');
      return;
    }
    listMutation.mutate(movie);
  };

  // Organize movies by category
  const featuredMovie = movies.find(m => m.is_featured) || movies[0];
  const newReleases = movies.filter(m => m.category === 'new_releases').slice(0, 15);
  const trending = movies.filter(m => m.category === 'trending').slice(0, 15);
  const popular = movies.filter(m => m.category === 'popular').slice(0, 15);
  const classics = movies.filter(m => m.category === 'classics').slice(0, 15);
  
  // Group by genre
  const actionMovies = movies.filter(m => m.genre?.includes('Action'));
  const dramaMovies = movies.filter(m => m.genre?.includes('Drama'));
  const comedyMovies = movies.filter(m => m.genre?.includes('Comedy'));
  const thrillerMovies = movies.filter(m => m.genre?.includes('Thriller'));

  // Get personalized recommendations for homepage
  const personalizedForYou = user && featuredMovie ? getRecommendations({
    allMovies: movies,
    currentMovie: featuredMovie,
    watchHistory,
    userReviews,
    userList,
    userFavoriteGenres: user.favorite_genre || [],
    limit: 15
  }) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  const userListMovieIds = userList.map(item => item.movie_id);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      {featuredMovie && (
        <HeroSection
          movie={featuredMovie}
          onAddToList={handleAddToList}
          isInList={userListMovieIds.includes(featuredMovie.id)}
        />
      )}

      {/* Movie Rows */}
      <div className="-mt-32 relative z-10 space-y-8 pb-12">
        {/* Continue Watching */}
        {user && (
          <ContinueWatchingRow
            watchHistory={watchHistory}
            movies={movies}
            onAddToList={handleAddToList}
            userList={userList}
          />
        )}

        {/* Personalized For You - Based on favorite genres and history */}
        {user && personalizedForYou.length > 0 && (
          <MovieRow
            title="Recommended For You"
            movies={personalizedForYou}
            userList={userList}
            onAddToList={handleAddToList}
          />
        )}

        {newReleases.length > 0 && (
          <MovieRow
            title="New Releases"
            movies={newReleases}
            userList={userList}
            onAddToList={handleAddToList}
          />
        )}

        {trending.length > 0 && (
          <MovieRow
            title="Trending Now"
            movies={trending}
            userList={userList}
            onAddToList={handleAddToList}
          />
        )}

        {popular.length > 0 && (
          <MovieRow
            title="Popular on Vibeflix"
            movies={popular}
            userList={userList}
            onAddToList={handleAddToList}
          />
        )}

        {actionMovies.length > 0 && (
          <MovieRow
            title="Action & Adventure"
            movies={actionMovies}
            userList={userList}
            onAddToList={handleAddToList}
          />
        )}

        {dramaMovies.length > 0 && (
          <MovieRow
            title="Drama"
            movies={dramaMovies}
            userList={userList}
            onAddToList={handleAddToList}
          />
        )}

        {comedyMovies.length > 0 && (
          <MovieRow
            title="Comedy"
            movies={comedyMovies}
            userList={userList}
            onAddToList={handleAddToList}
          />
        )}

        {thrillerMovies.length > 0 && (
          <MovieRow
            title="Thrillers"
            movies={thrillerMovies}
            userList={userList}
            onAddToList={handleAddToList}
          />
        )}

        {classics.length > 0 && (
          <MovieRow
            title="Classic Films"
            movies={classics}
            userList={userList}
            onAddToList={handleAddToList}
          />
        )}

        {/* All Movies if no categories */}
        {movies.length > 0 && newReleases.length === 0 && trending.length === 0 && (
          <MovieRow
            title="All Movies"
            movies={movies}
            userList={userList}
            onAddToList={handleAddToList}
          />
        )}
      </div>
    </div>
  );
}