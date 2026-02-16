import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, Plus, Pencil, Trash2, Film, Upload, 
  ArrowLeft, Save, X, Image, Video, Star, Users, AlertCircle,
  TrendingUp, Eye, BarChart3, Crown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import VideoUploader from '../components/admin/VideoUploader';

const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery', 'Romance',
  'Sci-Fi', 'Thriller', 'War', 'Western'
];

const RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17'];

const CATEGORIES = [
  { value: 'new_releases', label: 'New Releases' },
  { value: 'trending', label: 'Trending' },
  { value: 'popular', label: 'Popular' },
  { value: 'classics', label: 'Classics' },
];

export default function Admin() {
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('movies');
  const [userToEdit, setUserToEdit] = useState(null);
  const [userEditDialogOpen, setUserEditDialogOpen] = useState(false);
  const [userDeleteDialogOpen, setUserDeleteDialogOpen] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: [],
    release_year: new Date().getFullYear(),
    duration: '',
    rating: '',
    category: '',
    poster_url: '',
    backdrop_url: '',
    video_url: '',
    trailer_url: '',
    cast: [],
    director: '',
    is_featured: false,
  });

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

  // Fetch movies
  const { data: movies = [], isLoading } = useQuery({
    queryKey: ['movies'],
    queryFn: () => base44.entities.Movie.list('-created_date', 100),
  });

  // Fetch all reviews for moderation
  const { data: allReviews = [] } = useQuery({
    queryKey: ['allReviews'],
    queryFn: () => base44.entities.Review.list('-created_date', 100),
  });

  const flaggedReviews = allReviews.filter(r => r.is_flagged);
  const pendingReviews = allReviews.filter(r => !r.is_approved);

  // Fetch all users
  const { data: allUsers = [], refetch: refetchUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
    staleTime: 0,
  });

  // Refetch users when switching to users tab
  useEffect(() => {
    if (activeTab === 'users') {
      refetchUsers();
    }
  }, [activeTab, refetchUsers]);

  // Fetch all watch history for analytics
  const { data: allWatchHistory = [] } = useQuery({
    queryKey: ['allWatchHistory'],
    queryFn: () => base44.entities.WatchHistory.list('-last_watched', 1000),
  });

  // Fetch all reviews for analytics
  const { data: allReviewsForAnalytics = [] } = useQuery({
    queryKey: ['allReviewsAnalytics'],
    queryFn: () => base44.entities.Review.list('-created_date', 1000),
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (selectedMovie) {
        await base44.entities.Movie.update(selectedMovie.id, data);
        toast.success('Movie updated successfully');
      } else {
        await base44.entities.Movie.create(data);
        toast.success('Movie added successfully');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to save movie');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Movie.delete(id);
      toast.success('Movie deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      setDeleteDialogOpen(false);
      setSelectedMovie(null);
    }
  });

  // Review moderation mutations
  const approveReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      await base44.entities.Review.update(reviewId, { is_approved: true, is_flagged: false });
      toast.success('Review approved');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allReviews'] });
    }
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      await base44.entities.Review.delete(reviewId);
      toast.success('Review deleted');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allReviews'] });
    }
  });

  // User management mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      await base44.entities.User.update(userId, { role });
      toast.success('User role updated');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setUserEditDialogOpen(false);
      setUserToEdit(null);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.entities.User.delete(userId);
      toast.success('User deleted');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setUserDeleteDialogOpen(null);
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      genre: [],
      release_year: new Date().getFullYear(),
      duration: '',
      rating: '',
      category: '',
      poster_url: '',
      backdrop_url: '',
      video_url: '',
      trailer_url: '',
      cast: [],
      director: '',
      is_featured: false,
    });
    setSelectedMovie(null);
  };

  const handleEdit = (movie) => {
    setSelectedMovie(movie);
    setFormData({
      title: movie.title || '',
      description: movie.description || '',
      genre: movie.genre || [],
      release_year: movie.release_year || new Date().getFullYear(),
      duration: movie.duration || '',
      rating: movie.rating || '',
      category: movie.category || '',
      poster_url: movie.poster_url || '',
      backdrop_url: movie.backdrop_url || '',
      video_url: movie.video_url || '',
      trailer_url: movie.trailer_url || '',
      cast: movie.cast || [],
      director: movie.director || '',
      is_featured: movie.is_featured || false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (movie) => {
    setSelectedMovie(movie);
    setDeleteDialogOpen(true);
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, [field]: file_url }));
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenreToggle = (genre) => {
    setFormData(prev => ({
      ...prev,
      genre: prev.genre.includes(genre)
        ? prev.genre.filter(g => g !== genre)
        : [...prev.genre, genre]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isCheckingAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Access Denied</h1>
          <p className="text-white/60 mb-6">
            You need admin privileges to access this page
          </p>
          <Link to={createPageUrl('Home')}>
            <Button className="bg-[#D4AF37] hover:bg-[#E5C158] text-black">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Admin Panel</h1>
            <p className="text-white/60">Manage movies, users, and analytics</p>
          </div>
        </div>
        {activeTab === 'movies' && (
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Movie
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-white/10">
        <Button
          variant="ghost"
          onClick={() => setActiveTab('movies')}
          className={`rounded-none pb-3 ${
            activeTab === 'movies' 
              ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]' 
              : 'text-white/60'
          }`}
        >
          <Film className="w-4 h-4 mr-2" />
          Movies
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('reviews')}
          className={`rounded-none pb-3 relative ${
            activeTab === 'reviews' 
              ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]' 
              : 'text-white/60'
          }`}
        >
          <Star className="w-4 h-4 mr-2" />
          Reviews
          {flaggedReviews.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
              {flaggedReviews.length}
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('users')}
          className={`rounded-none pb-3 ${
            activeTab === 'users' 
              ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]' 
              : 'text-white/60'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          Users
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('subscriptions')}
          className={`rounded-none pb-3 ${
            activeTab === 'subscriptions' 
              ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]' 
              : 'text-white/60'
          }`}
        >
          <Crown className="w-4 h-4 mr-2" />
          Subscriptions
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('analytics')}
          className={`rounded-none pb-3 ${
            activeTab === 'analytics' 
              ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]' 
              : 'text-white/60'
          }`}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Analytics
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'subscriptions' ? (
        <>
          {/* Subscription Debugging */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-4">Subscription Debugging</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <Label className="block text-sm font-medium mb-2">User Email</Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  className="bg-white/5 border-white/10"
                  id="debug-email"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={async () => {
                    const email = document.getElementById('debug-email').value;
                    if (!email) {
                      toast.error('Enter an email');
                      return;
                    }
                    try {
                      const { data } = await base44.functions.invoke('checkWebhookLogs', { userEmail: email });
                      console.log('User Debug Info:', data);
                      alert(JSON.stringify(data, null, 2));
                    } catch (e) {
                      toast.error(e.message);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Check User Status
                </Button>
                
                <Button
                  onClick={async () => {
                    const email = document.getElementById('debug-email').value;
                    const plan = prompt('Enter plan (monthly/6months/annual):', 'monthly');
                    if (!email || !plan) return;
                    
                    if (!confirm(`Manually activate ${plan} subscription for ${email}?`)) return;
                    
                    try {
                      const { data } = await base44.functions.invoke('manualActivateSubscription', { 
                        userEmail: email, 
                        plan 
                      });
                      toast.success('Subscription activated!');
                      console.log('Activation result:', data);
                      queryClient.invalidateQueries(['users']);
                    } catch (e) {
                      toast.error(e.message);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Manual Activate
                </Button>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Webhook Setup Instructions:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside text-white/80">
                <li>Go to Dashboard → Code → Functions → korapayWebhook</li>
                <li>Copy the function endpoint URL</li>
                <li>Go to your Korapay dashboard → Settings → Webhooks</li>
                <li>Add the URL and enable webhook notifications</li>
                <li>Test payment and check function logs</li>
              </ol>
            </div>
          </div>
        </>
      ) : activeTab === 'analytics' ? (
        <>
          {/* Analytics Dashboard */}
          <div className="space-y-8">
            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Eye className="w-6 h-6 text-[#D4AF37] mb-2" />
                <p className="text-2xl font-bold">{allWatchHistory.length}</p>
                <p className="text-sm text-white/60">Total Views</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Users className="w-6 h-6 text-[#D4AF37] mb-2" />
                <p className="text-2xl font-bold">{allUsers.length}</p>
                <p className="text-sm text-white/60">Total Users</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Star className="w-6 h-6 text-[#D4AF37] mb-2" />
                <p className="text-2xl font-bold">{allReviewsForAnalytics.length}</p>
                <p className="text-sm text-white/60">Total Reviews</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Film className="w-6 h-6 text-[#D4AF37] mb-2" />
                <p className="text-2xl font-bold">{movies.length}</p>
                <p className="text-sm text-white/60">Total Movies</p>
              </div>
            </div>

            {/* Most Watched Movies */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
                Most Watched Movies
              </h2>
              <div className="space-y-3">
                {(() => {
                  const watchCounts = {};
                  allWatchHistory.forEach(h => {
                    watchCounts[h.movie_id] = (watchCounts[h.movie_id] || 0) + 1;
                  });
                  const sorted = Object.entries(watchCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10);
                  
                  return sorted.map(([movieId, count], idx) => {
                    const movie = movies.find(m => m.id === movieId);
                    if (!movie) return null;
                    return (
                      <div key={movieId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-white/40 w-8">#{idx + 1}</span>
                          {movie.poster_url && (
                            <img src={movie.poster_url} alt={movie.title} className="w-10 h-14 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium">{movie.title}</p>
                            <p className="text-sm text-white/50">{movie.genre?.slice(0, 2).join(', ')}</p>
                          </div>
                        </div>
                        <Badge className="bg-[#D4AF37] text-black">
                          {count} views
                        </Badge>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Highest Rated Movies */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#D4AF37]" />
                Highest Rated Movies
              </h2>
              <div className="space-y-3">
                {(() => {
                  const movieRatings = {};
                  allReviewsForAnalytics.forEach(r => {
                    if (!movieRatings[r.movie_id]) {
                      movieRatings[r.movie_id] = { sum: 0, count: 0 };
                    }
                    movieRatings[r.movie_id].sum += r.rating;
                    movieRatings[r.movie_id].count += 1;
                  });
                  
                  const sorted = Object.entries(movieRatings)
                    .map(([movieId, data]) => ({
                      movieId,
                      avg: data.sum / data.count,
                      count: data.count
                    }))
                    .filter(item => item.count >= 3) // At least 3 reviews
                    .sort((a, b) => b.avg - a.avg)
                    .slice(0, 10);
                  
                  return sorted.map((item, idx) => {
                    const movie = movies.find(m => m.id === item.movieId);
                    if (!movie) return null;
                    return (
                      <div key={item.movieId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-white/40 w-8">#{idx + 1}</span>
                          {movie.poster_url && (
                            <img src={movie.poster_url} alt={movie.title} className="w-10 h-14 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium">{movie.title}</p>
                            <p className="text-sm text-white/50">{item.count} reviews</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                          <span className="text-lg font-bold">{item.avg.toFixed(1)}</span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'users' ? (
        <>
          {/* Users Table */}
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">All Users ({allUsers.length})</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchUsers()}
                className="border-white/20 hover:bg-white/10"
              >
                <Loader2 className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60">User</TableHead>
                  <TableHead className="text-white/60 hidden md:table-cell">Role</TableHead>
                  <TableHead className="text-white/60 hidden lg:table-cell">Favorite Genres</TableHead>
                  <TableHead className="text-white/60 hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="text-white/60 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((u) => (
                  <TableRow key={u.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div>
                        <p className="font-medium">{u.full_name}</p>
                        <p className="text-sm text-white/50">{u.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={u.role === 'admin' ? 'default' : 'outline'} 
                        className={u.role === 'admin' ? 'bg-[#D4AF37] text-black' : 'border-white/30'}>
                        {u.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {u.favorite_genre?.slice(0, 3).map((g, i) => (
                          <Badge key={i} variant="secondary" className="bg-white/10 text-white text-xs">
                            {g}
                          </Badge>
                        ))}
                        {u.favorite_genre?.length > 3 && (
                          <Badge variant="secondary" className="bg-white/10 text-white text-xs">
                            +{u.favorite_genre.length - 3}
                          </Badge>
                        )}
                        {!u.favorite_genre?.length && (
                          <span className="text-white/40 text-sm">Not set</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-white/60 text-sm">
                      {new Date(u.created_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setUserToEdit(u);
                            setUserEditDialogOpen(true);
                          }}
                          className="hover:bg-white/10"
                          disabled={u.email === user.email}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setUserDeleteDialogOpen(u)}
                          className="hover:bg-red-500/20 text-red-400"
                          disabled={u.email === user.email}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : activeTab === 'movies' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <Film className="w-6 h-6 text-[#D4AF37] mb-2" />
          <p className="text-2xl font-bold">{movies.length}</p>
          <p className="text-sm text-white/60">Total Movies</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <Star className="w-6 h-6 text-[#D4AF37] mb-2" />
          <p className="text-2xl font-bold">{movies.filter(m => m.is_featured).length}</p>
          <p className="text-sm text-white/60">Featured</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <Video className="w-6 h-6 text-[#D4AF37] mb-2" />
          <p className="text-2xl font-bold">{movies.filter(m => m.video_url).length}</p>
          <p className="text-sm text-white/60">With Video</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <Image className="w-6 h-6 text-[#D4AF37] mb-2" />
          <p className="text-2xl font-bold">{movies.filter(m => m.poster_url).length}</p>
          <p className="text-sm text-white/60">With Poster</p>
        </div>
      </div>

      {/* Movies Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/60">Movie</TableHead>
              <TableHead className="text-white/60 hidden md:table-cell">Genre</TableHead>
              <TableHead className="text-white/60 hidden md:table-cell">Category</TableHead>
              <TableHead className="text-white/60 hidden lg:table-cell">Year</TableHead>
              <TableHead className="text-white/60 hidden lg:table-cell">Status</TableHead>
              <TableHead className="text-white/60 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movies.map((movie) => (
              <TableRow key={movie.id} className="border-white/10 hover:bg-white/5">
                <TableCell>
                  <div className="flex items-center gap-3">
                    {movie.poster_url ? (
                      <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="w-10 h-14 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-white/10 rounded flex items-center justify-center">
                        <Film className="w-5 h-5 text-white/30" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{movie.title}</p>
                      <p className="text-sm text-white/50 line-clamp-1 max-w-xs">
                        {movie.description}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {movie.genre?.slice(0, 2).map((g, i) => (
                      <Badge key={i} variant="secondary" className="bg-white/10 text-white text-xs">
                        {g}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline" className="border-[#D4AF37]/50 text-[#D4AF37]">
                    {movie.category?.replace('_', ' ') || 'None'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {movie.release_year || '-'}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    {movie.is_featured && (
                      <Badge className="bg-[#D4AF37] text-black">Featured</Badge>
                    )}
                    {movie.video_url && (
                      <Badge variant="outline" className="border-green-500/50 text-green-500">
                        Video
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(movie)}
                      className="hover:bg-white/10"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(movie)}
                      className="hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {movies.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-white/60">
                  No movies yet. Click "Add Movie" to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
        </>
      ) : (
        <>
          {/* Review Moderation */}
          <div className="space-y-6">
            {/* Flagged Reviews */}
            {flaggedReviews.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Flagged Reviews ({flaggedReviews.length})
                </h2>
                <div className="space-y-4">
                  {flaggedReviews.map((review) => {
                    const movie = movies.find(m => m.id === review.movie_id);
                    return (
                      <div key={review.id} className="bg-[#1a1a1a] rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium">{review.user_name}</p>
                            <p className="text-sm text-white/60">{movie?.title}</p>
                            <div className="flex gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= review.rating
                                      ? 'text-[#D4AF37] fill-[#D4AF37]'
                                      : 'text-white/20'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveReviewMutation.mutate(review.id)}
                              className="border-green-500/50 text-green-500 hover:bg-green-500/10"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteReviewMutation.mutate(review.id)}
                              className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                        {review.review_text && (
                          <p className="text-white/80 text-sm">{review.review_text}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Reviews */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold">All Reviews ({allReviews.length})</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/60">User</TableHead>
                    <TableHead className="text-white/60">Movie</TableHead>
                    <TableHead className="text-white/60">Rating</TableHead>
                    <TableHead className="text-white/60 hidden md:table-cell">Review</TableHead>
                    <TableHead className="text-white/60">Status</TableHead>
                    <TableHead className="text-white/60 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allReviews.map((review) => {
                    const movie = movies.find(m => m.id === review.movie_id);
                    return (
                      <TableRow key={review.id} className="border-white/10 hover:bg-white/5">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{review.user_name}</p>
                            <p className="text-xs text-white/50">{review.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{movie?.title || 'Unknown'}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= review.rating
                                    ? 'text-[#D4AF37] fill-[#D4AF37]'
                                    : 'text-white/20'
                                }`}
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p className="text-sm text-white/60 line-clamp-2 max-w-xs">
                            {review.review_text || '-'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {review.is_flagged && (
                              <Badge variant="outline" className="border-red-500/50 text-red-500 text-xs">
                                Flagged
                              </Badge>
                            )}
                            {!review.is_approved && (
                              <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 text-xs">
                                Pending
                              </Badge>
                            )}
                            {review.is_approved && !review.is_flagged && (
                              <Badge variant="outline" className="border-green-500/50 text-green-500 text-xs">
                                Approved
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteReviewMutation.mutate(review.id)}
                            className="hover:bg-red-500/20 text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {allReviews.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-white/60">
                        No reviews yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#141414] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedMovie ? 'Edit Movie' : 'Add New Movie'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Director</Label>
                <Input
                  value={formData.director}
                  onChange={(e) => setFormData(prev => ({ ...prev, director: e.target.value }))}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                rows={4}
                className="bg-white/5 border-white/10"
              />
            </div>

            {/* Genres */}
            <div className="space-y-2">
              <Label>Genres *</Label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((genre) => (
                  <Button
                    key={genre}
                    type="button"
                    variant={formData.genre.includes(genre) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleGenreToggle(genre)}
                    className={formData.genre.includes(genre)
                      ? 'bg-[#D4AF37] hover:bg-[#E5C158] text-black'
                      : 'border-white/20 hover:bg-white/10'
                    }
                  >
                    {genre}
                  </Button>
                ))}
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={formData.release_year}
                  onChange={(e) => setFormData(prev => ({ ...prev, release_year: parseInt(e.target.value) }))}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="2h 15m"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Rating</Label>
                <Select
                  value={formData.rating}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, rating: value }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {RATINGS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cast */}
            <div className="space-y-2">
              <Label>Cast (comma separated)</Label>
              <Input
                value={formData.cast.join(', ')}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  cast: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }))}
                placeholder="Actor 1, Actor 2, Actor 3"
                className="bg-white/5 border-white/10"
              />
            </div>

            {/* Media */}
            <div className="space-y-4">
              <Label className="text-lg">Media</Label>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Poster */}
                <div className="space-y-2">
                  <Label>Poster Image</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.poster_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, poster_url: e.target.value }))}
                      placeholder="URL or upload"
                      className="bg-white/5 border-white/10"
                    />
                    <Label className="cursor-pointer">
                      <div className="h-10 px-4 flex items-center justify-center rounded-md border border-white/20 hover:bg-white/10 transition-colors">
                        <Upload className="w-4 h-4" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'poster_url')}
                      />
                    </Label>
                  </div>
                  {formData.poster_url && (
                    <img src={formData.poster_url} alt="Poster" className="w-24 h-36 object-cover rounded" />
                  )}
                </div>

                {/* Backdrop */}
                <div className="space-y-2">
                  <Label>Backdrop Image</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.backdrop_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, backdrop_url: e.target.value }))}
                      placeholder="URL or upload"
                      className="bg-white/5 border-white/10"
                    />
                    <Label className="cursor-pointer">
                      <div className="h-10 px-4 flex items-center justify-center rounded-md border border-white/20 hover:bg-white/10 transition-colors">
                        <Upload className="w-4 h-4" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'backdrop_url')}
                      />
                    </Label>
                  </div>
                  {formData.backdrop_url && (
                    <img src={formData.backdrop_url} alt="Backdrop" className="w-40 h-24 object-cover rounded" />
                  )}
                </div>
              </div>

              {/* Video */}
              <div className="space-y-3">
                <Label>Video</Label>
                
                {/* Bunny.net Video Uploader */}
                <VideoUploader 
                  movieTitle={formData.title}
                  onUploadComplete={(videoUrl, videoId) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      video_url: videoUrl,
                      bunny_video_id: videoId 
                    }));
                  }}
                />

                {/* Or paste URL */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#141414] px-2 text-white/60">or paste URL</span>
                  </div>
                </div>

                <Input
                  value={formData.video_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="Paste video URL (Bunny.net embed or direct video URL)"
                  className="bg-white/5 border-white/10"
                />

                {formData.video_url && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-xs text-green-500 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Video URL set: {formData.video_url.substring(0, 50)}...
                    </p>
                  </div>
                )}
              </div>

              {/* Trailer */}
              <div className="space-y-2">
                <Label>Trailer URL</Label>
                <Input
                  value={formData.trailer_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, trailer_url: e.target.value }))}
                  placeholder="YouTube or video URL"
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <Label className="text-base">Featured Movie</Label>
                <p className="text-sm text-white/60">Show in hero section on homepage</p>
              </div>
              <Switch
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-white/20"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending || isUploading}
                className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold gap-2"
              >
                {(saveMutation.isPending || isUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                {selectedMovie ? 'Update Movie' : 'Add Movie'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Movie Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#141414] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Movie</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Are you sure you want to delete "{selectedMovie?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(selectedMovie?.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Role Dialog */}
      <Dialog open={userEditDialogOpen} onOpenChange={setUserEditDialogOpen}>
        <DialogContent className="bg-[#141414] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-white/60 mb-1">User</p>
              <p className="font-medium">{userToEdit?.full_name}</p>
              <p className="text-sm text-white/50">{userToEdit?.email}</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={userToEdit?.role}
                onValueChange={(value) => setUserToEdit({ ...userToEdit, role: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setUserEditDialogOpen(false)}
                className="border-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={() => updateUserMutation.mutate({ userId: userToEdit.id, role: userToEdit.role })}
                disabled={updateUserMutation.isPending}
                className="bg-[#D4AF37] hover:bg-[#E5C158] text-black"
              >
                {updateUserMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!userDeleteDialogOpen} onOpenChange={() => setUserDeleteDialogOpen(null)}>
        <AlertDialogContent className="bg-[#141414] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Are you sure you want to delete "{userDeleteDialogOpen?.full_name}"? This will remove all their data including reviews and watch history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserMutation.mutate(userDeleteDialogOpen?.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteUserMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}