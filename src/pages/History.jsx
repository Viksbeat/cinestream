import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Clock, Film, Play, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function History() {
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

  // Fetch watch history
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['watchHistory', user?.email],
    queryFn: () => base44.entities.WatchHistory.filter({ user_email: user.email }, '-last_watched', 50),
    enabled: !!user?.email,
  });

  // Fetch all movies
  const { data: movies = [], isLoading: moviesLoading } = useQuery({
    queryKey: ['movies'],
    queryFn: () => base44.entities.Movie.list('-created_date', 100),
  });

  // Clear history mutation
  const clearMutation = useMutation({
    mutationFn: async (historyId) => {
      await base44.entities.WatchHistory.delete(historyId);
      toast.success('Removed from history');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchHistory'] });
    }
  });

  // Get movie data for history items
  const historyWithMovies = history.map(h => ({
    ...h,
    movie: movies.find(m => m.id === h.movie_id)
  })).filter(h => h.movie);

  const isLoading = isCheckingAuth || historyLoading || moviesLoading;

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
            <Clock className="w-10 h-10 text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Sign in to see your history</h1>
          <p className="text-white/60 mb-6">
            Your watch history will be saved so you can pick up where you left off
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
            <Clock className="w-8 h-8 text-[#D4AF37]" />
            Watch History
          </h1>
          <p className="text-white/60 mt-2">
            {historyWithMovies.length} {historyWithMovies.length === 1 ? 'movie' : 'movies'} watched
          </p>
        </div>

        {/* Content */}
        {historyWithMovies.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <AnimatePresence>
              {historyWithMovies.map((item, index) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  index={index}
                  onRemove={() => clearMutation.mutate(item.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <Film className="w-10 h-10 text-white/30" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No watch history yet</h3>
            <p className="text-white/60 mb-6">
              Start watching movies to build your history
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

function HistoryItem({ item, index, onRemove }) {
  const { movie, progress, completed, last_watched } = item;

  // Calculate progress percentage
  const progressPercent = movie.duration 
    ? Math.min((progress / parseDuration(movie.duration)) * 100, 100)
    : 0;

  function parseDuration(duration) {
    if (!duration || typeof duration !== 'string') return 0;
    const match = duration.match(/(\d+)h\s*(\d+)?m?/);
    if (match) {
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      return hours * 3600 + minutes * 60;
    }
    return 0;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      className="group flex gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
    >
      {/* Poster with Progress */}
      <Link 
        to={createPageUrl('Player') + `?id=${movie.id}`}
        className="relative flex-shrink-0"
      >
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="w-24 md:w-32 aspect-[2/3] object-cover rounded-lg"
        />
        {/* Progress Bar */}
        {!completed && progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-lg overflow-hidden">
            <div 
              className="h-full bg-[#D4AF37]" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
          <div className="w-12 h-12 rounded-full bg-[#D4AF37] flex items-center justify-center">
            <Play className="w-5 h-5 text-black fill-black ml-1" />
          </div>
        </div>
        {/* Completed Badge */}
        {completed && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-[#D4AF37] text-black text-xs font-bold rounded">
            Watched
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link to={createPageUrl('Player') + `?id=${movie.id}`}>
          <h3 className="font-semibold text-lg line-clamp-1 hover:text-[#D4AF37] transition-colors">
            {movie.title}
          </h3>
        </Link>
        <div className="flex items-center gap-2 text-sm text-white/60 mt-1">
          {movie.release_year && <span>{movie.release_year}</span>}
          {movie.duration && (
            <>
              <span>•</span>
              <span>{movie.duration}</span>
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
        <div className="flex items-center gap-2 mt-3 text-sm text-white/40">
          <Clock className="w-4 h-4" />
          {last_watched && format(new Date(last_watched), 'MMM d, yyyy')}
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-start gap-2">
        <Link to={createPageUrl('Player') + `?id=${movie.id}`}>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 hover:bg-white/10 gap-2"
          >
            <Play className="w-4 h-4" />
            {completed ? 'Watch Again' : 'Continue'}
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-white/40 hover:text-red-400 hover:bg-red-400/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}