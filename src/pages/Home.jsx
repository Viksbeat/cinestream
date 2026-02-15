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
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  // Show landing page for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#4A5396] via-[#2a2a3e] to-[#0a0a0a]" />
        
        {/* Movie Posters Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 p-4 animate-pulse">
            {movies.slice(0, 24).map((movie, index) => (
              <div key={movie.id} className="aspect-[2/3] rounded-lg overflow-hidden" style={{ animationDelay: `${index * 0.1}s` }}>
                <img 
                  src={movie.poster_url} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/40 via-[#0a0a0a]/60 to-[#0a0a0a]/80" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 md:px-8 py-20">
          {/* Logo & Tagline */}
          <div className="text-center mb-12 space-y-6">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697deede265d9acdbc187371/bc65203a9_IMG_1935.jpeg" 
              alt="MYVIBEFLIX" 
              className="h-32 md:h-40 lg:h-48 w-auto mx-auto mb-6"
            />
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4">
              YOUR MOVIES, YOUR MOOD.
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-white/80 max-w-2xl mx-auto">
              Discover thousands of movies and shows. Watch anywhere, anytime.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <button
              onClick={() => base44.auth.redirectToLogin()}
              className="px-8 py-4 bg-[#D4AF37] hover:bg-[#E5C158] text-black font-bold text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl"
            >
              Sign Up Free
            </button>
            <button
              onClick={() => base44.auth.redirectToLogin()}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-lg text-white font-semibold text-lg rounded-full border-2 border-white/30 transition-all duration-300 transform hover:scale-105"
            >
              Sign In
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="text-[#D4AF37] text-4xl mb-4">📺</div>
              <h3 className="text-xl font-bold text-white mb-2">Unlimited Entertainment</h3>
              <p className="text-white/70">Stream thousands of movies and shows on demand</p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="text-[#D4AF37] text-4xl mb-4">💎</div>
              <h3 className="text-xl font-bold text-white mb-2">Premium Quality</h3>
              <p className="text-white/70">High-definition streaming for the best experience</p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="text-[#D4AF37] text-4xl mb-4">🎬</div>
              <h3 className="text-xl font-bold text-white mb-2">Personalized Picks</h3>
              <p className="text-white/70">Get recommendations based on your taste</p>
            </div>
          </div>
        </div>
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