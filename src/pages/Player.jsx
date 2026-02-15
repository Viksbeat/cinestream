import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Plus, Check, ArrowLeft, Share2, Download, Loader2 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import MovieCard from '../components/movies/MovieCard';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import AverageRating from '../components/reviews/AverageRating';
import ReviewForm from '../components/reviews/ReviewForm';
import ReviewsList from '../components/reviews/ReviewsList';
import { getRecommendations } from '@/components/utils/recommendations';
import { getUsersAlsoWatched } from '@/components/utils/collaborativeFiltering';

export default function Player() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeout = useRef(null);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get('id');

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Check subscription status
        if (currentUser.subscription_status !== 'active') {
          window.location.href = '/Subscribe';
        }
      } catch (e) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  // Fetch movie
  const { data: movie, isLoading } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => base44.entities.Movie.filter({ id: movieId }),
    select: (data) => data[0],
    enabled: !!movieId,
  });

  // Fetch all movies for recommendations
  const { data: allMovies = [] } = useQuery({
    queryKey: ['movies'],
    queryFn: () => base44.entities.Movie.list('-created_date', 50),
  });

  // Fetch user's list
  const { data: userList = [] } = useQuery({
    queryKey: ['userList', user?.email],
    queryFn: () => base44.entities.UserList.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  // Fetch reviews for this movie
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', movieId],
    queryFn: () => base44.entities.Review.filter({ movie_id: movieId, is_approved: true }, '-created_date', 50),
    enabled: !!movieId,
  });

  // Get user's review
  const userReview = reviews.find(r => r.user_email === user?.email);

  // Fetch watch history for recommendations
  const { data: watchHistory = [] } = useQuery({
    queryKey: ['watchHistory', user?.email],
    queryFn: () => base44.entities.WatchHistory.filter({ user_email: user.email }, '-last_watched', 100),
    enabled: !!user?.email,
  });

  // Fetch ALL watch history for collaborative filtering
  const { data: allWatchHistory = [] } = useQuery({
    queryKey: ['allWatchHistory'],
    queryFn: () => base44.asServiceRole.entities.WatchHistory.list('-last_watched', 500),
    enabled: !!movieId,
  });

  // Watch history mutation
  const historyMutation = useMutation({
    mutationFn: async (data) => {
      if (!user?.email) return;
      
      const existing = await base44.entities.WatchHistory.filter({
        movie_id: movieId,
        user_email: user.email
      });
      
      if (existing.length > 0) {
        await base44.entities.WatchHistory.update(existing[0].id, data);
      } else {
        await base44.entities.WatchHistory.create({
          movie_id: movieId,
          user_email: user.email,
          ...data
        });
      }
    }
  });

  // Add/remove from list mutation
  const listMutation = useMutation({
    mutationFn: async (movieToAdd) => {
      const existing = userList.find(item => item.movie_id === movieToAdd.id);
      if (existing) {
        await base44.entities.UserList.delete(existing.id);
      } else {
        await base44.entities.UserList.create({
          movie_id: movieToAdd.id,
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

  const handleAddToList = (movieToAdd) => {
    if (!user) {
      toast.error('Please sign in to add movies to your list');
      return;
    }
    listMutation.mutate(movieToAdd);
  };

  // Submit review mutation
  const reviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      if (userReview) {
        await base44.entities.Review.update(userReview.id, reviewData);
        toast.success('Review updated!');
      } else {
        await base44.entities.Review.create({
          ...reviewData,
          movie_id: movieId,
          user_email: user.email,
          user_name: user.full_name
        });
        toast.success('Review submitted!');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    }
  });

  // Flag review mutation
  const flagMutation = useMutation({
    mutationFn: async (review) => {
      await base44.entities.Review.update(review.id, { is_flagged: true });
      toast.success('Review flagged for moderation');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    }
  });

  // Video controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Save progress every 30 seconds
      if (Math.floor(videoRef.current.currentTime) % 30 === 0) {
        historyMutation.mutate({
          progress: videoRef.current.currentTime,
          last_watched: new Date().toISOString()
        });
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0];
      setVolume(value[0]);
      setIsMuted(value[0] === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  // Keyboard controls for TV
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!videoRef.current) return;
      
      switch(e.key) {
        case ' ':
        case 'Enter':
        case 'MediaPlayPause':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          if (e.target.tagName !== 'INPUT') {
            e.preventDefault();
            videoRef.current.currentTime += 10;
          }
          break;
        case 'ArrowLeft':
          if (e.target.tagName !== 'INPUT') {
            e.preventDefault();
            videoRef.current.currentTime -= 10;
          }
          break;
        case 'ArrowUp':
          if (e.target.tagName !== 'INPUT') {
            e.preventDefault();
            const newVol = Math.min(1, volume + 0.1);
            handleVolumeChange([newVol]);
          }
          break;
        case 'ArrowDown':
          if (e.target.tagName !== 'INPUT') {
            e.preventDefault();
            const newVol = Math.max(0, volume - 0.1);
            handleVolumeChange([newVol]);
          }
          break;
        case 'm':
        case 'MediaVolumeMute':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'Escape':
        case 'Back':
        case 'Backspace':
          e.preventDefault();
          navigate(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, volume, navigate]);

  const formatTime = (time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get personalized recommendations
  const recommendations = movie ? getRecommendations({
    allMovies,
    currentMovie: movie,
    watchHistory: watchHistory,
    userReviews: reviews.filter(r => r.user_email === user?.email),
    userList,
    userFavoriteGenres: user?.favorite_genre || [],
    limit: 12
  }) : [];

  // Get collaborative filtering recommendations
  const alsoWatched = movie ? getUsersAlsoWatched({
    currentMovieId: movieId,
    allMovies,
    allWatchHistory,
    currentUserEmail: user?.email,
    limit: 12
  }) : [];

  const isInList = userList.some(item => item.movie_id === movieId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20">
        <p className="text-white/60 mb-4">Movie not found</p>
        <Link to={createPageUrl('Home')}>
          <Button className="bg-[#D4AF37] hover:bg-[#E5C158] text-black">
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Video Player */}
      <div
        ref={containerRef}
        className="relative bg-black aspect-video max-h-[70vh] mx-auto"
        onMouseMove={handleMouseMove}
        style={{ position: 'relative' }}
      >
        {movie.video_url ? (
          // Check if it's a Bunny.net embed URL or iframe URL
          (movie.video_url.includes('iframe') || 
           movie.video_url.includes('embed') || 
           movie.video_url.includes('player.mediadelivery.net') || 
           movie.video_url.includes('iframe.mediadelivery.net') ||
           movie.video_url.includes('bunnycdn.com') || 
           movie.video_url.includes('b-cdn.net')) ? (
            <iframe
              src={movie.video_url}
              className="w-full h-full"
              loading="eager"
              style={{ border: 'none', position: 'absolute', top: 0, left: 0, height: '100%', width: '100%' }}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              title={movie.title}
              onLoad={() => {
                // Track that video was loaded
                if (user) {
                  historyMutation.mutate({
                    progress: 0,
                    last_watched: new Date().toISOString()
                  });
                }
              }}
            />
          ) : (
            movie.video_url.endsWith('.mp4') || 
            movie.video_url.endsWith('.webm') || 
            movie.video_url.endsWith('.ogg') ? (
              <video
                ref={videoRef}
                src={movie.video_url}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onClick={togglePlay}
                onEnded={() => {
                  setIsPlaying(false);
                  historyMutation.mutate({ completed: true, last_watched: new Date().toISOString() });
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-black">
                <div className="text-center">
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-48 h-72 object-cover mx-auto rounded-lg mb-4 opacity-50"
                  />
                  <p className="text-white/60 mb-2">Video format not supported</p>
                  <p className="text-white/40 text-sm">Use Bunny.net iframe embed URLs or direct video files (.mp4, .webm)</p>
                </div>
              </div>
            )
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-black">
            <div className="text-center">
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-48 h-72 object-cover mx-auto rounded-lg mb-4 opacity-50"
              />
              <p className="text-white/60">Video not available</p>
            </div>
          </div>
        )}

        {/* Controls Overlay - Only show for non-iframe videos */}
        <AnimatePresence>
          {showControls && !(movie.video_url?.includes('iframe') || movie.video_url?.includes('embed') || movie.video_url?.includes('player.mediadelivery.net')) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                <Link to={createPageUrl('Home')} onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="hover:bg-white/20 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="hover:bg-white/20 rounded-full">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Center Play Button */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-20 h-20 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-2xl"
                    onClick={togglePlay}
                  >
                    <Play className="w-8 h-8 text-black fill-black ml-1" />
                  </motion.button>
                </div>
              )}

              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
                {/* Progress Bar */}
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                />

                {/* Controls Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePlay}
                      className="hover:bg-white/20 rounded-full"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>

                    <div className="flex items-center gap-2 group">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMute}
                        className="hover:bg-white/20 rounded-full"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </Button>
                      <div className="w-0 group-hover:w-24 overflow-hidden transition-all duration-300">
                        <Slider
                          value={[isMuted ? 0 : volume]}
                          max={1}
                          step={0.1}
                          onValueChange={handleVolumeChange}
                        />
                      </div>
                    </div>

                    <span className="text-sm text-white/80">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-lg font-medium">{movie.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFullscreen}
                      className="hover:bg-white/20 rounded-full"
                    >
                      {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Movie Details */}
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-12">
        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          {/* Main Content */}
          <div>
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{movie.title}</h1>
              
              {/* Average Rating */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <AverageRating reviews={reviews} />
                {movie.rating && (
                  <span className="px-3 py-1 bg-white/10 rounded text-sm font-medium">
                    {movie.rating}
                  </span>
                )}
                {movie.release_year && (
                  <span className="text-white/60">{movie.release_year}</span>
                )}
                {movie.duration && typeof movie.duration === 'string' && (
                  <span className="text-white/60">{movie.duration}</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {movie.genre?.map((g, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full text-sm"
                >
                  {g}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
              <Button
                onClick={() => handleAddToList(movie)}
                variant="outline"
                className={`gap-2 border-white/30 hover:bg-white/10 ${
                  isInList ? 'bg-white/10' : ''
                }`}
              >
                {isInList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isInList ? 'In My List' : 'Add to List'}
              </Button>
            </div>

            <p className="text-white/80 text-lg leading-relaxed mb-8">
              {movie.description}
            </p>

            {/* Cast & Crew */}
            {(movie.director || movie.cast?.length > 0) && (
              <div className="border-t border-white/10 pt-8 space-y-4">
                {movie.director && (
                  <div>
                    <span className="text-white/60">Director: </span>
                    <span className="text-white">{movie.director}</span>
                  </div>
                )}
                {movie.cast?.length > 0 && (
                  <div>
                    <span className="text-white/60">Cast: </span>
                    <span className="text-white">{movie.cast.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Poster */}
          <div className="hidden lg:block">
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-full rounded-xl shadow-2xl"
            />
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 border-t border-white/10 pt-12">
          <h2 className="text-2xl font-bold mb-8">Reviews</h2>
          
          <div className="grid lg:grid-cols-[1fr_400px] gap-8">
            {/* Reviews List */}
            <div>
              <ReviewsList
                reviews={reviews}
                currentUserEmail={user?.email}
                onFlag={(review) => flagMutation.mutate(review)}
              />
            </div>

            {/* Review Form */}
            <div>
              {user ? (
                <ReviewForm
                  onSubmit={(data) => reviewMutation.mutate(data)}
                  isSubmitting={reviewMutation.isPending}
                  userReview={userReview}
                />
              ) : (
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                  <p className="text-white/60 mb-4">Sign in to leave a review</p>
                  <Button
                    onClick={() => base44.auth.redirectToLogin()}
                    className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold"
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Users Also Watched */}
        {alsoWatched.length > 0 && (
          <div className="mt-16 border-t border-white/10 pt-12">
            <h2 className="text-2xl font-bold mb-6">Viewers Also Watched</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {alsoWatched.map((m, i) => (
                <MovieCard
                  key={m.id}
                  movie={m}
                  index={i}
                  isInList={userList.some(item => item.movie_id === m.id)}
                  onAddToList={handleAddToList}
                />
              ))}
            </div>
          </div>
        )}

        {/* Personalized Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-16 border-t border-white/10 pt-12">
            <h2 className="text-2xl font-bold mb-6">Recommended for You</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {recommendations.map((m, i) => (
                <MovieCard
                  key={m.id}
                  movie={m}
                  index={i}
                  isInList={userList.some(item => item.movie_id === m.id)}
                  onAddToList={handleAddToList}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}