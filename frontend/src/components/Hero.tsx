import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Lock, Shield, FileText, Sparkles, FolderLock, ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface HeroProps {
  onOpenUpload?: () => void;
  onOpenVault?: () => void;
}

export function Hero({ onOpenUpload, onOpenVault }: HeroProps) {
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
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-900/5 dark:bg-navy-900/50 border border-navy-900/10 dark:border-gold-500/20 text-xs font-semibold text-navy-900 dark:text-gold-300 mb-6 backdrop-blur-sm shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Phase 1 Active: Document Vault & OCR Pipeline</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-500 dark:text-slate-400">PDF & Image OCR</span>
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

        {/* CTA Area */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-4"
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              variant="primary"
              onClick={onOpenUpload}
              className="gap-3 px-8 shadow-soft-lg hover:shadow-gold-500/20 group"
              id="upload-doc-button"
            >
              <Upload className="w-5 h-5 text-accent group-hover:-translate-y-0.5 transition-transform" />
              <span>Upload Legal Document</span>
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={onOpenVault}
              className="gap-2.5 px-6 shadow-sm border-gold-500/40 hover:bg-gold-500/10"
              id="open-vault-button"
            >
              <FolderLock className="w-4 h-4 text-gold-500" />
              <span>Document Vault</span>
            </Button>
          </div>

          {/* Privacy Line as mandated by Rule 6 */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            <Lock className="w-3.5 h-3.5 text-verified" />
            <span>Your document is private. Complete data sovereignty with one-click permanent deletion.</span>
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
          <Badge variant="verified" className="shadow-xs">
            Verified Legal Citation
          </Badge>
          <Badge variant="needs-verification" className="shadow-xs">
            Needs Verification
          </Badge>
          <Badge variant="alleged" className="shadow-xs">
            Contested Allegation
          </Badge>
        </motion.div>
      </div>
    </section>
  );
}
