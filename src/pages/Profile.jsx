import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User as UserIcon, Save } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
  'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 
  'Documentary', 'Animation', 'Crime', 'Family', 'Musical'
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setFullName(currentUser.full_name || '');
        setSelectedGenres(currentUser.favorite_genre || []);
      } catch (e) {
        base44.auth.redirectToLogin();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: () => {
      toast.error('Failed to update profile');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      full_name: fullName,
      favorite_genre: selectedGenres
    });
  };

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141414] rounded-2xl border border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/5 p-8 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37] flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">My Profile</h1>
                <p className="text-white/60 mt-1">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white text-base">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-white/5 border-white/10 text-white h-12"
                required
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white text-base">Email</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-white/5 border-white/10 text-white/50 h-12 cursor-not-allowed"
              />
              <p className="text-xs text-white/40">Email cannot be changed</p>
            </div>

            {/* Role (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-white text-base">Account Type</Label>
              <Input
                id="role"
                value={user?.role === 'admin' ? 'Administrator' : 'User'}
                disabled
                className="bg-white/5 border-white/10 text-white/50 h-12 cursor-not-allowed"
              />
            </div>

            {/* Favorite Genres */}
            <div className="space-y-4">
              <Label className="text-white text-base">Favorite Movie Genres</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-4 py-3 rounded-lg border transition-all ${
                      selectedGenres.includes(genre)
                        ? 'bg-[#D4AF37] border-[#D4AF37] text-black font-semibold'
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/40">
                Select your favorite genres to get personalized recommendations
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full h-12 bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold text-base"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}