import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Lock, Shield, FileText, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export function Hero() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold-400/10 dark:bg-gold-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-navy-400/5 dark:bg-navy-600/10 blur-[90px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Phase Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-900/5 dark:bg-navy-900/50 border border-navy-900/10 dark:border-gold-500/20 text-xs font-semibold text-navy-900 dark:text-gold-300 mb-6 backdrop-blur-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Foundation & Design System (Phase 0)</span>
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-slate-500 dark:text-slate-400">8 Indic Scripts Supported</span>
        </motion.div>

        {/* Main Title & Tagline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-navy-900 dark:text-ivory leading-[1.15]"
        >
          Understand the Law. <br />
          <span className="bg-gradient-to-r from-accent via-gold-400 to-amber-500 bg-clip-text text-transparent">
            Understand Your Rights.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed"
        >
          Demystifying court orders, petitions, contracts, and legal notices for everyday Indian citizens.
          Transform convoluted legalese into clear, verifiable explanations in your regional language.
        </motion.p>

        {/* CTA Area with "Coming Soon" Tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-4"
        >
          <div
            className="relative inline-block"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Button
              size="lg"
              variant="primary"
              disabled
              className="gap-3 px-8 shadow-soft-lg cursor-not-allowed opacity-75"
              id="upload-doc-button"
            >
              <Upload className="w-5 h-5 text-accent" />
              <span>Upload your document</span>
            </Button>

            {/* Coming Soon Tooltip Popover */}
            {showTooltip && (
              <div
                role="tooltip"
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-navy-950 text-ivory text-xs rounded-card shadow-soft-lg border border-gold-500/30 text-center z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-center gap-1.5 text-accent font-bold mb-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Coming soon in Phase 1</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-tight">
                  Document upload, OCR, and AI pipeline will be activated in the next development phase.
                </p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy-950" />
              </div>
            )}
          </div>

          {/* Privacy Line as mandated */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            <Lock className="w-3.5 h-3.5 text-verified" />
            <span>Your document is private. You can delete it anytime.</span>
          </div>
        </motion.div>

        {/* Preview Legal Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Safety Standards:
          </span>
          <Badge variant="verified" withIcon>
            Statute Citations Required
          </Badge>
          <Badge variant="needs-verification" withIcon>
            Unverified Claims Flagged
          </Badge>
          <Badge variant="alleged" withIcon>
            Allegations Never Shown as Facts
          </Badge>
          <Badge variant="default" withIcon>
            Zero Hallucination
          </Badge>
        </motion.div>
      </div>
    </section>
  );
}
