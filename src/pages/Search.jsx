import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search as SearchIcon, Loader2, Film, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MovieCard from '../components/movies/MovieCard';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function Search() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      setDebouncedQuery(initialQuery);
    }
  }, []);

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

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Filter movies based on search
  const filteredMovies = debouncedQuery
    ? movies.filter(movie => {
        const query = debouncedQuery.toLowerCase();
        return (
          movie.title?.toLowerCase().includes(query) ||
          movie.description?.toLowerCase().includes(query) ||
          movie.genre?.some(g => g.toLowerCase().includes(query)) ||
          movie.cast?.some(c => c.toLowerCase().includes(query)) ||
          movie.director?.toLowerCase().includes(query)
        );
      })
    : [];

  // Get unique genres for suggestions
  const allGenres = [...new Set(movies.flatMap(m => m.genre || []))];

  return (
    <div className="min-h-screen pt-24 md:pt-28">
      <div className="max-w-[1800px] mx-auto px-4 md:px-8">
        {/* Search Header */}
        <div className="max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Search Movies
          </h1>
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              type="text"
              placeholder="Search by title, genre, director, actor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-12 text-lg bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 rounded-2xl"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Genre Suggestions */}
          {!debouncedQuery && allGenres.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-white/60 mb-3">Popular genres</p>
              <div className="flex flex-wrap gap-2">
                {allGenres.slice(0, 8).map((genre) => (
                  <Button
                    key={genre}
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery(genre)}
                    className="border-white/20 hover:bg-white/10 hover:border-[#D4AF37] rounded-full"
                  >
                    {genre}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
          </div>
        ) : debouncedQuery ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-white/60">
                {filteredMovies.length} {filteredMovies.length === 1 ? 'result' : 'results'} for "{debouncedQuery}"
              </p>
            </div>

            {filteredMovies.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
              >
                <AnimatePresence>
                  {filteredMovies.map((movie, index) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      index={index}
                      isInList={userList.some(item => item.movie_id === movie.id)}
                      onAddToList={handleAddToList}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                  <Film className="w-10 h-10 text-white/30" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-white/60">
                  Try searching with different keywords
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <SearchIcon className="w-10 h-10 text-white/30" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Start searching</h3>
            <p className="text-white/60 mb-4">
              Search by title, genre, director, or actor name
            </p>
            <p className="text-sm text-white/40">
              Try: "Action", "Christopher Nolan", or any movie title
            </p>
          </div>
        )}
      </div>
    </div>
  );
}