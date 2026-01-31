import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Grid, List, Filter, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MovieCard from '../components/movies/MovieCard';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function Browse() {
  const [user, setUser] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
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

  // Get unique genres
  const allGenres = ['All', ...new Set(movies.flatMap(m => m.genre || []))];

  // Filter and sort movies
  let filteredMovies = selectedGenre === 'All'
    ? movies
    : movies.filter(m => m.genre?.includes(selectedGenre));

  // Sort movies
  filteredMovies = [...filteredMovies].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_date) - new Date(a.created_date);
      case 'oldest':
        return new Date(a.created_date) - new Date(b.created_date);
      case 'title_asc':
        return (a.title || '').localeCompare(b.title || '');
      case 'title_desc':
        return (b.title || '').localeCompare(a.title || '');
      case 'year_new':
        return (b.release_year || 0) - (a.release_year || 0);
      case 'year_old':
        return (a.release_year || 0) - (b.release_year || 0);
      default:
        return 0;
    }
  });

  const sortOptions = [
    { value: 'newest', label: 'Recently Added' },
    { value: 'oldest', label: 'Oldest Added' },
    { value: 'title_asc', label: 'Title A-Z' },
    { value: 'title_desc', label: 'Title Z-A' },
    { value: 'year_new', label: 'Newest Release' },
    { value: 'year_old', label: 'Oldest Release' },
  ];

  return (
    <div className="min-h-screen pt-24 md:pt-28">
      <div className="max-w-[1800px] mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Browse Movies</h1>
            <p className="text-white/60 mt-1">
              {filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'} available
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-white/20 hover:bg-white/10 gap-2">
                  <Filter className="w-4 h-4" />
                  Sort
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 text-white">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`cursor-pointer focus:bg-white/10 ${
                      sortBy === option.value ? 'text-[#D4AF37]' : ''
                    }`}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Toggle */}
            <div className="flex items-center bg-white/5 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={`w-8 h-8 rounded ${viewMode === 'grid' ? 'bg-white/10' : ''}`}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={`w-8 h-8 rounded ${viewMode === 'list' ? 'bg-white/10' : ''}`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Genre Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {allGenres.map((genre) => (
            <Button
              key={genre}
              variant={selectedGenre === genre ? 'default' : 'outline'}
              onClick={() => setSelectedGenre(genre)}
              className={`flex-shrink-0 rounded-full ${
                selectedGenre === genre
                  ? 'bg-[#D4AF37] hover:bg-[#E5C158] text-black'
                  : 'border-white/20 hover:bg-white/10'
              }`}
            >
              {genre}
            </Button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
          </div>
        ) : filteredMovies.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6'
                : 'flex flex-col gap-4'
            }
          >
            <AnimatePresence>
              {filteredMovies.map((movie, index) => (
                viewMode === 'grid' ? (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    index={index}
                    isInList={userList.some(item => item.movie_id === movie.id)}
                    onAddToList={handleAddToList}
                  />
                ) : (
                  <ListItem
                    key={movie.id}
                    movie={movie}
                    index={index}
                    isInList={userList.some(item => item.movie_id === movie.id)}
                    onAddToList={handleAddToList}
                  />
                )
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <p className="text-white/60">No movies found in this genre</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ListItem({ movie, isInList, onAddToList, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
    >
      <img
        src={movie.poster_url}
        alt={movie.title}
        className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-lg line-clamp-1">{movie.title}</h3>
        <div className="flex items-center gap-2 text-sm text-white/60 mt-1">
          {movie.release_year && <span>{movie.release_year}</span>}
          {movie.duration && (
            <>
              <span>•</span>
              <span>{movie.duration}</span>
            </>
          )}
          {movie.rating && (
            <>
              <span>•</span>
              <span>{movie.rating}</span>
            </>
          )}
        </div>
        {movie.genre && movie.genre.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {movie.genre.slice(0, 3).map((g, i) => (
              <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-xs">
                {g}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm text-white/60 mt-2 line-clamp-2">
          {movie.description}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onAddToList(movie)}
        className={`flex-shrink-0 ${isInList ? 'bg-white/10' : ''}`}
      >
        {isInList ? 'Added' : 'Add'}
      </Button>
    </motion.div>
  );
}