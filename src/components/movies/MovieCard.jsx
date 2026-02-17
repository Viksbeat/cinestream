import React, { useState } from 'react';
import { createPageUrl } from '../../utils';
import { Play, Plus, Check, Star, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import TrailerModal from './TrailerModal';

export default function MovieCard({ movie, onAddToList, isInList, index = 0 }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  const handleCardClick = (e) => {
    // Only navigate if clicking on the card itself, not buttons
    if (e.target.closest('button')) {
      return;
    }
    window.location.href = createPageUrl('Player') + `?id=${movie.id}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="relative group flex-shrink-0 w-[100px] sm:w-[110px] md:w-[120px] lg:w-[135px] xl:w-[150px] 2xl:w-[165px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <div 
        onClick={handleCardClick}
        className="focus:outline-none block cursor-pointer"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            window.location.href = createPageUrl('Player') + `?id=${movie.id}`;
          }
        }}
      >
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
            <div className="w-12 h-12 md:w-14 md:h-14 xl:w-16 xl:h-16 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-xl">
              <Play className="w-5 h-5 md:w-6 md:h-6 xl:w-7 xl:h-7 text-black fill-black ml-1" />
            </div>
          </motion.div>

          {/* Bottom Info */}
          <div className={`absolute bottom-0 left-0 right-0 p-3 md:p-4 xl:p-5 transition-all duration-300 ${
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <h3 className="font-semibold text-xs md:text-sm xl:text-base text-white line-clamp-1 mb-1">
              {movie.title}
            </h3>
            <div className="flex items-center gap-1.5 md:gap-2 text-xs xl:text-sm text-white/60">
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
            <div className="absolute top-2 left-2 md:top-3 md:left-3 xl:top-4 xl:left-4">
              <span className="px-1.5 py-0.5 md:px-2 md:py-1 xl:px-3 xl:py-1.5 bg-black/60 backdrop-blur text-xs md:text-sm xl:text-base font-medium rounded">
                {movie.rating}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className={`absolute top-2 right-2 md:top-3 md:right-3 xl:top-4 xl:right-4 flex gap-1.5 md:gap-2 transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            {movie.trailer_url && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowTrailer(true);
                }}
                className="w-8 h-8 md:w-9 md:h-9 xl:w-10 xl:h-10 rounded-full flex items-center justify-center bg-black/60 backdrop-blur text-white hover:bg-[#D4AF37] hover:text-black transition-colors"
                title="Watch Trailer"
              >
                <Film className="w-3.5 h-3.5 md:w-4 md:h-4 xl:w-5 xl:h-5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToList?.(movie);
              }}
              className={`w-8 h-8 md:w-9 md:h-9 xl:w-10 xl:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                isInList 
                  ? 'bg-[#D4AF37] text-black' 
                  : 'bg-black/60 backdrop-blur text-white hover:bg-[#D4AF37] hover:text-black'
              }`}
            >
              {isInList ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4 xl:w-5 xl:h-5" /> : <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 xl:w-5 xl:h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Title Below (visible when not hovered) */}
      <div className={`mt-2 xl:mt-3 transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
        <h3 className="font-medium text-xs md:text-sm xl:text-base text-white line-clamp-1">
          {movie.title}
        </h3>
        {movie.genre && movie.genre.length > 0 && (
          <p className="text-xs xl:text-sm text-white/50 mt-0.5 line-clamp-1">
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