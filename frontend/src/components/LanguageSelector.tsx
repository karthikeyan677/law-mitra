import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  fontClass: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', fontClass: 'font-sans' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', fontClass: 'font-kannada' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', fontClass: 'font-devanagari' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', fontClass: 'font-telugu' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', fontClass: 'font-tamil' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', fontClass: 'font-malayalam' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', fontClass: 'font-devanagari' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', fontClass: 'font-bengali' },
];

export function LanguageSelector() {
  const [selectedLang, setSelectedLang] = useState<Language>(LANGUAGES[0]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-button text-xs font-medium border border-navy-900/15 dark:border-charcoal-100 bg-white/80 dark:bg-charcoal-400/80 backdrop-blur-sm text-navy-900 dark:text-ivory hover:bg-navy-900/5 dark:hover:bg-charcoal-300 transition-all focus:outline-none focus:ring-2 focus:ring-accent"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-accent" />
        <span className={cn('font-semibold', selectedLang.fontClass)}>
          {selectedLang.nativeName}
        </span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-card border border-navy-900/10 dark:border-charcoal-100 bg-white dark:bg-charcoal-400 shadow-soft-lg z-50 py-1.5 focus:outline-none animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-navy-900/5 dark:border-charcoal-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Select Language (UI Only in Phase 0)
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLang.code === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors hover:bg-gold-50 dark:hover:bg-charcoal-300',
                    isSelected
                      ? 'bg-gold-100/50 dark:bg-charcoal-200 text-navy-900 dark:text-gold-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-300'
                  )}
                >
                  <div className="flex flex-col">
                    <span className={cn('text-sm', lang.fontClass)}>{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{lang.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-accent" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
