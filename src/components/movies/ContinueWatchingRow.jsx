import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Play, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ContinueWatchingRow({ watchHistory, movies, onAddToList, userList }) {
  if (!watchHistory || watchHistory.length === 0) {
    return null;
  }

  // Filter for in-progress movies and get corresponding movie data
  const inProgressItems = watchHistory
    .filter(h => !h.completed && h.progress > 0)
    .map(history => {
      const movie = movies.find(m => m.id === history.movie_id);
      return movie ? { ...movie, progress: history.progress, last_watched: history.last_watched } : null;
    })
    .filter(Boolean)
    .slice(0, 10);

  if (inProgressItems.length === 0) {
    return null;
  }

  const formatProgress = (progress, duration) => {
    if (!duration || typeof duration !== 'string') return 0;
    
    const match = duration.match(/(\d+)h?\s*(\d+)?m?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const totalSeconds = (hours * 3600) + (minutes * 60);
    
    if (totalSeconds === 0) return 0;
    return Math.min(100, Math.round((progress / totalSeconds) * 100));
  };

  return (
    <div className="px-4 md:px-8 mb-8">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-[#D4AF37]" />
          <h2 className="text-xl md:text-2xl font-bold text-white">Continue Watching</h2>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 pb-4">
            {inProgressItems.map((movie, index) => {
              const progressPercent = formatProgress(movie.progress, movie.duration);
              
              return (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-shrink-0 w-[300px] md:w-[340px]"
                >
                  <Link to={createPageUrl('Player') + `?id=${movie.id}`}>
                    <div className="relative group">
                      {/* Thumbnail */}
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-[#1a1a1a]">
                        <img
                          src={movie.backdrop_url || movie.poster_url}
                          alt={movie.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-14 h-14 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-2xl">
                            <Play className="w-6 h-6 text-black fill-black ml-1" />
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                          <div 
                            className="h-full bg-[#D4AF37] transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>

                        {/* Progress Badge */}
                        <div className="absolute top-3 right-3 px-2 py-1 bg-black/80 backdrop-blur rounded text-xs font-medium text-white">
                          {progressPercent}%
                        </div>
                      </div>

                      {/* Movie Info */}
                      <div className="mt-3">
                        <h3 className="font-semibold text-white line-clamp-1 mb-1">
                          {movie.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          {movie.duration && typeof movie.duration === 'string' && (
                            <span>{movie.duration}</span>
                          )}
                          {movie.genre && movie.genre.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{movie.genre[0]}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}