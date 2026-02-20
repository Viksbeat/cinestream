import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Play, Plus, Info, Star, Film } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import TrailerModal from './TrailerModal';
import { base44 } from '@/api/base44Client';

export default function HeroSection({ movie, onAddToList, isInList }) {
  const [showTrailer, setShowTrailer] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  if (!movie) return null;

  const hasVideo = movie.video_url && (
    movie.video_url.includes('iframe') ||
    movie.video_url.includes('embed') ||
    movie.video_url.includes('player.mediadelivery.net') ||
    movie.video_url.includes('iframe.mediadelivery.net') ||
    movie.video_url.includes('bunnycdn.com') ||
    movie.video_url.includes('b-cdn.net') ||
    movie.video_url.endsWith('.mp4') ||
    movie.video_url.endsWith('.webm')
  );

  return (
    <div className="relative h-[85vh] md:h-[90vh] w-full overflow-hidden">
      {/* Background: Video or Image */}
      <div className="absolute inset-0 bg-black">
        {/* Video */}
        {hasVideo && (
          movie.video_url.endsWith('.mp4') || movie.video_url.endsWith('.webm') ? (
            <video
              src={movie.video_url}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <iframe
              src={movie.video_url.includes('?') ? `${movie.video_url}&autoplay=1&muted=1&loop=1&controls=0&preload=true` : `${movie.video_url}?autoplay=1&muted=1&loop=1&controls=0&preload=true`}
              className="absolute inset-0 w-full h-full"
              style={{ border: 'none', transform: 'scale(1.05)' }}
              allow="autoplay; encrypted-media"
              title={movie.title}
            />
          )
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/30" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 w-full pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 mb-4"
            >
              <span className="px-3 py-1 bg-[#D4AF37] text-black text-xs font-bold rounded-full">
                FEATURED
              </span>
              {movie.rating && (
                <span className="px-3 py-1 bg-white/10 backdrop-blur text-white text-xs font-medium rounded-full">
                  {movie.rating}
                </span>
              )}
              {movie.release_year && (
                <span className="text-white/60 text-sm">{movie.release_year}</span>
              )}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight"
            >
              {movie.title}
            </motion.h1>

            {/* Meta */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-4 mb-4 text-sm text-white/70"
            >
              {movie.duration && <span>{movie.duration}</span>}
              {movie.genre && movie.genre.length > 0 && (
                <span>{movie.genre.slice(0, 3).join(' • ')}</span>
              )}
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/80 text-base md:text-lg leading-relaxed mb-8 line-clamp-3"
            >
              {movie.description}
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link to={createPageUrl('Player') + `?id=${movie.id}`} tabIndex={0}>
                <Button
                  size="lg"
                  className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-bold px-8 py-6 text-lg xl:text-xl xl:px-12 xl:py-8 rounded-full gap-2 shadow-lg shadow-[#D4AF37]/30 transition-all"
                  tabIndex={-1}
                >
                  <Play className="w-5 h-5 xl:w-6 xl:h-6 fill-current" />
                  Watch Now
                </Button>
              </Link>
              {movie.trailer_url && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowTrailer(true)}
                  className="border-white/30 hover:bg-white/10 px-6 py-6 xl:px-8 xl:py-8 xl:text-lg rounded-full gap-2 transition-all"
                  tabIndex={0}
                >
                  <Film className="w-5 h-5 xl:w-6 xl:h-6" />
                  Watch Trailer
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                onClick={() => onAddToList?.(movie)}
                className={`border-white/30 hover:bg-white/10 px-6 py-6 xl:px-8 xl:py-8 xl:text-lg rounded-full gap-2 transition-all ${
                  isInList ? 'bg-white/10' : ''
                }`}
                tabIndex={0}
              >
                <Plus className={`w-5 h-5 xl:w-6 xl:h-6 ${isInList ? 'rotate-45' : ''} transition-transform`} />
                {isInList ? 'In My List' : 'Add to List'}
              </Button>
              <Link to={createPageUrl('Player') + `?id=${movie.id}`} tabIndex={0}>
                <Button
                  size="lg"
                  variant="ghost"
                  className="hover:bg-white/10 px-6 py-6 xl:px-8 xl:py-8 xl:text-lg rounded-full gap-2 transition-all"
                  tabIndex={-1}
                >
                  <Info className="w-5 h-5 xl:w-6 xl:h-6" />
                  More Info
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <TrailerModal
        isOpen={showTrailer}
        onClose={() => setShowTrailer(false)}
        movie={movie}
      />
    </div>
  );
}