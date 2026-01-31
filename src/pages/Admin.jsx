import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, Plus, Pencil, Trash2, Film, Upload, 
  ArrowLeft, Save, X, Image, Video, Star
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
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

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
            <p className="text-white/60">Manage your movie catalog</p>
          </div>
        </div>
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
      </div>

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
              <div className="space-y-2">
                <Label>Video URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                    placeholder="Video URL or upload"
                    className="bg-white/5 border-white/10"
                  />
                  <Label className="cursor-pointer">
                    <div className="h-10 px-4 flex items-center justify-center rounded-md border border-white/20 hover:bg-white/10 transition-colors">
                      <Upload className="w-4 h-4" />
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'video_url')}
                    />
                  </Label>
                </div>
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

      {/* Delete Confirmation */}
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
    </div>
  );
}