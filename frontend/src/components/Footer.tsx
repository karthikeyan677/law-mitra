import React from 'react';
import { Scale, Heart, ShieldAlert, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-navy-900/10 dark:border-charcoal-100 bg-white dark:bg-charcoal-500 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center border border-gold-500/30">
                <Scale className="w-4 h-4 text-gold-500" />
              </div>
              <span className="font-extrabold text-lg text-navy-900 dark:text-ivory">Law Mithra</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
              AI-Powered Multilingual Legal Document Assistant. Designed to bring equal access to legal understanding across India's linguistic diversity.
            </p>
            <div className="text-xs text-gold-600 dark:text-gold-400 font-semibold">
              Tagline: "Understand the Law. Understand Your Rights."
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 dark:text-ivory">
              Architecture & Docs
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <a href="/api/docs/" target="_blank" rel="noreferrer" className="hover:text-accent flex items-center gap-1">
                  <span>Swagger OpenAPI Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#safety-contract" className="hover:text-accent">
                  AI Safety Contract
                </a>
              </li>
              <li>
                <a href="#design-system" className="hover:text-accent">
                  Design Tokens (Phase 0)
                </a>
              </li>
            </ul>
          </div>

          {/* Supported Languages */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 dark:text-ivory">
              Supported Languages
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              English, ಕನ್ನಡ, हिन्दी, తెలుగు, தமிழ், മലയാളം, मराठी, বাংলা
            </p>
            <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-navy-900/5 dark:bg-charcoal-200 text-slate-500">
              Typography: Noto Sans & Inter
            </span>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-charcoal-400 border border-navy-900/5 dark:border-charcoal-100 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400 mb-8">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Mandatory Legal Notice:</strong> Law Mithra is an informational AI assistant designed for educational and document comprehension purposes. It does not provide legal representation, does not form an attorney-client relationship, and is not a substitute for an advocate registered with the Bar Council of India.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-navy-900/5 dark:border-charcoal-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Law Mithra Project. Final Year BCA Project (Phase 0: Foundation).</p>
          <p className="flex items-center gap-1">
            Built with React, Vite, TypeScript, Tailwind, Django & PostgreSQL
          </p>
        </div>
      </div>
    </footer>
  );
}
