import React from 'react';
import { Scale, Moon, Sun, BookOpen, ShieldCheck } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { ApiStatusBadge } from './ApiStatusBadge';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export function Navbar({ darkMode, setDarkMode }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-ivory/80 dark:bg-charcoal/80 border-b border-navy-900/10 dark:border-charcoal-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy-900 dark:bg-navy-800 flex items-center justify-center shadow-soft border border-gold-500/30">
            <Scale className="w-5 h-5 text-gold-500" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-navy-900 dark:text-ivory">
                Law Mithra
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gold-100 dark:bg-gold-950/50 text-gold-800 dark:text-gold-300 border border-gold-500/20">
                Phase 0
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              Understand the Law. Understand Your Rights.
            </span>
          </div>
        </div>

        {/* Center Links (Docs / Swagger) */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a
            href="#explainer"
            className="hover:text-navy-900 dark:hover:text-gold-400 transition-colors"
          >
            How It Works
          </a>
          <a
            href="#design-system"
            className="hover:text-navy-900 dark:hover:text-gold-400 transition-colors"
          >
            Design Tokens
          </a>
          <a
            href="/api/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-navy-900 dark:hover:text-gold-400 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-accent" />
            <span>API Docs</span>
          </a>
          <a
            href="#safety-contract"
            className="flex items-center gap-1.5 hover:text-navy-900 dark:hover:text-gold-400 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-verified" />
            <span>Safety Contract</span>
          </a>
        </div>

        {/* Right Tools: API status, Language, Dark Mode */}
        <div className="flex items-center gap-3">
          <ApiStatusBadge />

          <LanguageSelector />

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
