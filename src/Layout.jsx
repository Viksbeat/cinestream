import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Search, User, Menu, X, Home, Film, Bookmark, Clock, Settings, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(createPageUrl('Search') + `?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const navLinks = [
    { name: 'Home', icon: Home, page: 'Home' },
    { name: 'Browse', icon: Film, page: 'Browse' },
    { name: 'My List', icon: Bookmark, page: 'MyList' },
    { name: 'History', icon: Clock, page: 'History' },
  ];

  if (currentPageName === 'Admin') {
    return <div className="min-h-screen bg-[#0a0a0a]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <style>{`
        :root {
          --accent-gold: #D4AF37;
          --accent-gold-hover: #E5C158;
          --bg-dark: #0a0a0a;
          --bg-card: #141414;
          --bg-hover: #1a1a1a;
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: #333 #0a0a0a;
        }
        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        *::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        *::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
      `}</style>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'bg-[#0a0a0a]/95 backdrop-blur-lg shadow-2xl' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}>
        <div className="max-w-[1800px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-lg flex items-center justify-center">
                <Film className="w-5 h-5 md:w-6 md:h-6 text-black" />
              </div>
              <span className="text-xl md:text-2xl font-bold tracking-tight">
                <span className="text-[#D4AF37]">VIBE</span>FLIX
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  className={`text-sm font-medium transition-colors hover:text-[#D4AF37] ${
                    currentPageName === link.page ? 'text-[#D4AF37]' : 'text-white/70'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              {user?.role === 'admin' && (
                <Link
                  to={createPageUrl('Admin')}
                  className={`text-sm font-medium transition-colors hover:text-[#D4AF37] ${
                    currentPageName === 'Admin' ? 'text-[#D4AF37]' : 'text-white/70'
                  }`}
                >
                  Admin
                </Link>
              )}
            </nav>

            {/* Search & User */}
            <div className="flex items-center gap-3 md:gap-4">
              <form onSubmit={handleSearch} className="hidden md:flex items-center">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[#D4AF37] transition-colors" />
                  <Input
                    type="text"
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 lg:w-64 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 rounded-full"
                  />
                </div>
              </form>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border-white/10 text-white">
                    <div className="px-3 py-2 border-b border-white/10">
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-white/50">{user.email}</p>
                    </div>
                    <DropdownMenuItem asChild className="focus:bg-white/10 cursor-pointer">
                      <Link to={createPageUrl('MyList')}>
                        <Bookmark className="w-4 h-4 mr-2" /> My List
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-white/10 cursor-pointer">
                      <Link to={createPageUrl('History')}>
                        <Clock className="w-4 h-4 mr-2" /> Watch History
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild className="focus:bg-white/10 cursor-pointer">
                        <Link to={createPageUrl('Admin')}>
                          <Settings className="w-4 h-4 mr-2" /> Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={handleLogout} className="focus:bg-white/10 cursor-pointer text-red-400">
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => base44.auth.redirectToLogin()}
                  className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold rounded-full px-6"
                >
                  Sign In
                </Button>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0a0a0a]/98 backdrop-blur-lg border-t border-white/10">
            <div className="px-4 py-4 space-y-2">
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    type="text"
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-full"
                  />
                </div>
              </form>
              {navLinks.map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    currentPageName === link.page 
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37]' 
                      : 'text-white/70 hover:bg-white/5'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </Link>
              ))}
              {user?.role === 'admin' && (
                <Link
                  to={createPageUrl('Admin')}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5"
                >
                  <Settings className="w-5 h-5" />
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded flex items-center justify-center">
                <Film className="w-4 h-4 text-black" />
              </div>
              <span className="font-bold">
                <span className="text-[#D4AF37]">VIBE</span>FLIX
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/50">
              <span>© 2026 Vibeflix. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}