import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Play, Plus, Check, Star, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import TrailerModal from './TrailerModal';

export default function MovieCard({ movie, onAddToList, isInList, index = 0 }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="relative group flex-shrink-0 w-[160px] md:w-[200px] lg:w-[220px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={createPageUrl('Player') + `?id=${movie.id}`}>
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#1a1a1a]">
          {/* Poster Image */}
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`} />

          {/* Play Button */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: isHovered ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-14 h-14 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-xl">
              <Play className="w-6 h-6 text-black fill-black ml-1" />
            </div>
          </motion.div>

          {/* Bottom Info */}
          <div className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 ${
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <h3 className="font-semibold text-sm text-white line-clamp-1 mb-1">
              {movie.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-white/60">
              {movie.release_year && <span>{movie.release_year}</span>}
              {movie.duration && (
                <>
                  <span>•</span>
                  <span>{movie.duration}</span>
                </>
              )}
            </div>
          </div>

          {/* Top Badge */}
          {movie.rating && (
            <div className="absolute top-3 left-3">
              <span className="px-2 py-1 bg-black/60 backdrop-blur text-xs font-medium rounded">
                {movie.rating}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className={`absolute top-3 right-3 flex gap-2 transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            {movie.trailer_url && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowTrailer(true);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-black/60 backdrop-blur text-white hover:bg-[#D4AF37] hover:text-black transition-colors"
                title="Watch Trailer"
              >
                <Film className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToList?.(movie);
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                isInList 
                  ? 'bg-[#D4AF37] text-black' 
                  : 'bg-black/60 backdrop-blur text-white hover:bg-[#D4AF37] hover:text-black'
              }`}
            >
              {isInList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </Link>

      {/* Title Below (visible when not hovered) */}
      <div className={`mt-2 transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
        <h3 className="font-medium text-sm text-white line-clamp-1">
          {movie.title}
        </h3>
        {movie.genre && movie.genre.length > 0 && (
          <p className="text-xs text-white/50 mt-0.5 line-clamp-1">
            {movie.genre.slice(0, 2).join(' • ')}
          </p>
        )}
      </div>

      <TrailerModal
        isOpen={showTrailer}
        onClose={() => setShowTrailer(false)}
        movie={movie}
      />
    </motion.div>
  );
}