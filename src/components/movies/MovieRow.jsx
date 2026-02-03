import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import MovieCard from './MovieCard';
import { motion } from 'framer-motion';

export default function MovieRow({ title, movies, userList, onAddToList }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!movies || movies.length === 0) return null;

  const userListMovieIds = (userList || []).map(item => item.movie_id);

  return (
    <div className="relative group py-4">
      {/* Title */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-8 xl:px-12">
        <h2 className="text-lg md:text-xl xl:text-2xl 2xl:text-3xl font-bold text-white">{title}</h2>
        <div className="hidden md:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('left')}
            className="w-10 h-10 xl:w-12 xl:h-12 rounded-full bg-white/10 hover:bg-white/20"
          >
            <ChevronLeft className="w-5 h-5 xl:w-6 xl:h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('right')}
            className="w-10 h-10 xl:w-12 xl:h-12 rounded-full bg-white/10 hover:bg-white/20"
          >
            <ChevronRight className="w-5 h-5 xl:w-6 xl:h-6" />
          </Button>
        </div>
      </div>

      {/* Scrollable Row */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 xl:gap-6 overflow-x-auto scrollbar-hide pb-4 px-4 md:px-8 xl:px-12"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {movies.map((movie, index) => (
            <div key={movie.id} style={{ scrollSnapAlign: 'start' }}>
              <MovieCard
                movie={movie}
                index={index}
                isInList={userListMovieIds.includes(movie.id)}
                onAddToList={onAddToList}
              />
            </div>
          ))}
        </div>

        {/* Gradient Edges */}
        <div className="absolute top-0 left-0 bottom-4 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-4 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none" />
      </div>
    </div>
  );
}