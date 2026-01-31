import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Bookmark, Film } from 'lucide-react';
import { Button } from "@/components/ui/button";
import MovieCard from '../components/movies/MovieCard';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function MyList() {
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    loadUser();
  }, []);

  // Fetch user's list
  const { data: userList = [], isLoading: listLoading } = useQuery({
    queryKey: ['userList', user?.email],
    queryFn: () => base44.entities.UserList.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  // Fetch all movies
  const { data: movies = [], isLoading: moviesLoading } = useQuery({
    queryKey: ['movies'],
    queryFn: () => base44.entities.Movie.list('-created_date', 100),
  });

  // Remove from list mutation
  const listMutation = useMutation({
    mutationFn: async (movie) => {
      const existing = userList.find(item => item.movie_id === movie.id);
      if (existing) {
        await base44.entities.UserList.delete(existing.id);
        toast.success('Removed from your list');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userList'] });
    }
  });

  const handleRemoveFromList = (movie) => {
    listMutation.mutate(movie);
  };

  // Get movies in user's list
  const userListMovieIds = userList.map(item => item.movie_id);
  const myMovies = movies.filter(m => userListMovieIds.includes(m.id));

  const isLoading = isCheckingAuth || listLoading || moviesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
            <Bookmark className="w-10 h-10 text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Sign in to see your list</h1>
          <p className="text-white/60 mb-6">
            Keep track of movies you want to watch by adding them to your list
          </p>
          <Button
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 md:pt-28">
      <div className="max-w-[1800px] mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Bookmark className="w-8 h-8 text-[#D4AF37]" />
            My List
          </h1>
          <p className="text-white/60 mt-2">
            {myMovies.length} {myMovies.length === 1 ? 'movie' : 'movies'} saved
          </p>
        </div>

        {/* Content */}
        {myMovies.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
          >
            <AnimatePresence>
              {myMovies.map((movie, index) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  index={index}
                  isInList={true}
                  onAddToList={handleRemoveFromList}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <Film className="w-10 h-10 text-white/30" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Your list is empty</h3>
            <p className="text-white/60 mb-6">
              Start adding movies you want to watch
            </p>
            <Link to={createPageUrl('Browse')}>
              <Button className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold">
                Browse Movies
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}