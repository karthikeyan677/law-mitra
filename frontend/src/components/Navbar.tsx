import React, { useState } from 'react';
import {
  Scale,
  Moon,
  Sun,
  BookOpen,
  FolderLock,
  Plus,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Settings,
  LogOut,
  User
} from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { ApiStatusBadge } from './ApiStatusBadge';
import { Button } from './ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  currentView: string;
  onNavigate: (view: 'landing' | 'dashboard' | 'login' | 'signup' | 'settings') => void;
  onOpenUpload: () => void;
  onOpenVault: () => void;
}

export function Navbar({
  darkMode,
  setDarkMode,
  currentView,
  onNavigate,
  onOpenUpload,
  onOpenVault,
}: NavbarProps) {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleProtectedAction = (action: () => void) => {
    if (!user) {
      addToast({
        title: 'Authentication Required',
        description: 'Please sign in or create an account to access document upload and vault.',
        variant: 'info',
      });
      onNavigate('login');
      return;
    }
    action();
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-ivory/85 dark:bg-charcoal/85 border-b border-navy-900/10 dark:border-charcoal-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-navy-900 dark:bg-navy-800 flex items-center justify-center shadow-soft border border-gold-500/30 group-hover:border-gold-500 transition-colors">
            <Scale className="w-5 h-5 text-gold-500" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-navy-900 dark:text-ivory">
                Law Mithra
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gold-100 dark:bg-gold-950/50 text-gold-800 dark:text-gold-300 border border-gold-500/20">
                Phase 1
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              Understand the Law. Understand Your Rights.
            </span>
          </div>
        </div>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          {user ? (
            <>
              <button
                onClick={() => onNavigate('dashboard')}
                className={`flex items-center gap-1.5 transition-colors ${
                  currentView === 'dashboard' ? 'text-gold-600 dark:text-gold-400 font-bold' : 'hover:text-navy-900 dark:hover:text-gold-400'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-gold-500" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => onNavigate('settings')}
                className={`flex items-center gap-1.5 transition-colors ${
                  currentView === 'settings' ? 'text-gold-600 dark:text-gold-400 font-bold' : 'hover:text-navy-900 dark:hover:text-gold-400'
                }`}
              >
                <Settings className="w-4 h-4 text-gold-500" />
                <span>Settings</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleProtectedAction(onOpenVault)}
                className="flex items-center gap-1.5 hover:text-navy-900 dark:hover:text-gold-400 transition-colors"
              >
                <FolderLock className="w-4 h-4 text-gold-500" />
                <span>Document Vault</span>
              </button>
              <a
                href="#explainer"
                className="hover:text-navy-900 dark:hover:text-gold-400 transition-colors"
              >
                How It Works
              </a>
            </>
          )}

          <a
            href="/api/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-navy-900 dark:hover:text-gold-400 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-accent" />
            <span>API Docs</span>
          </a>
        </div>

        {/* Right Tools: Upload Button, Auth status / User menu, Language, Dark Mode */}
        <div className="flex items-center gap-3">
          {user ? (
            <Button
              size="sm"
              variant="gold"
              onClick={onOpenUpload}
              className="gap-1.5 hidden sm:flex text-xs py-1.5 px-3 h-8 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="gold"
              onClick={() => handleProtectedAction(onOpenUpload)}
              className="gap-1.5 hidden sm:flex text-xs py-1.5 px-3 h-8 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload</span>
            </Button>
          )}

          <ApiStatusBadge />

          <LanguageSelector />

          {/* User Menu / Auth Buttons */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-300 dark:border-charcoal-100 hover:border-gold-500/50 bg-white/50 dark:bg-charcoal/50 text-xs font-medium text-slate-800 dark:text-slate-100 transition-colors"
                aria-label="User menu"
              >
                <div className="w-6 h-6 rounded-lg bg-gold-500/10 text-gold-600 dark:text-gold-400 flex items-center justify-center font-bold">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="hidden lg:inline max-w-[120px] truncate">{user.email}</span>
              </button>

              {showUserDropdown && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-ivory dark:bg-charcoal-200 rounded-card shadow-soft-lg border border-gold-500/30 py-1.5 z-50 animate-in fade-in duration-100"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <div className="px-3 py-2 border-b border-gold-500/10">
                    <p className="text-[11px] text-slate-400">Signed in as</p>
                    <p className="text-xs font-semibold text-navy-900 dark:text-ivory truncate">
                      {user.email}
                    </p>
                  </div>

                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-gold-500/10 transition-colors text-left"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-gold-500" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => onNavigate('settings')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-gold-500/10 transition-colors text-left"
                  >
                    <Settings className="w-3.5 h-3.5 text-gold-500" />
                    <span>Settings</span>
                  </button>

                  <div className="border-t border-gold-500/10 my-1" />

                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('login')}
                className="gap-1 text-xs py-1.5 px-3 h-8"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate('signup')}
                className="gap-1 text-xs py-1.5 px-3 h-8 hidden sm:flex"
              >
                <UserPlus className="w-3.5 h-3.5 text-accent" />
                <span>Sign Up</span>
              </Button>
            </div>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-navy-900/5 dark:hover:bg-charcoal-300 transition-colors border border-navy-900/10 dark:border-charcoal-100"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-gold-400" /> : <Moon className="w-4 h-4 text-navy-800" />}
          </button>
        </div>
      </div>
    </header>
  );
}
