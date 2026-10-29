import React, { useState } from 'react';
import { Scale, Mail, Lock, Globe2, Type, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';

interface SignupPageProps {
  onNavigateLogin: () => void;
  onSignupSuccess: () => void;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
];

export function SignupPage({ onNavigateLogin, onSignupSuccess }: SignupPageProps) {
  const { register } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter an email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        email: cleanEmail,
        password,
        preferred_language: preferredLanguage,
        text_size: textSize,
      });

      addToast({
        title: 'Account Created',
        description: 'Your private Law Mithra vault is ready.',
        variant: 'success',
      });
      onSignupSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check the information provided.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-ivory dark:bg-charcoal-200 rounded-card p-8 shadow-2xl border border-gold-500/30 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-navy-900 dark:bg-navy-800 text-gold-500 shadow-soft border border-gold-500/30 mb-2">
            <Scale className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-navy-900 dark:text-ivory">
            Create Your Law Mithra Account
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Secure, confidential legal assistance tailored for Indian citizens
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="signup-email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white dark:bg-charcoal border border-slate-300 dark:border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-slate-800 dark:text-slate-100"
              />
            </div>
            <p className="text-[11px] text-slate-400">Your email will serve as your username.</p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="signup-password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white dark:bg-charcoal border border-slate-300 dark:border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Preferences Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Preferred Language */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-language"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Preferred Language
              </label>
              <div className="relative">
                <Globe2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="signup-language"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-charcoal border border-slate-300 dark:border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-slate-800 dark:text-slate-100"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Accessibility Text Size */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-text-size"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Text Size
              </label>
              <div className="relative">
                <Type className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="signup-text-size"
                  value={textSize}
                  onChange={(e) => setTextSize(e.target.value as any)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-charcoal border border-slate-300 dark:border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-slate-800 dark:text-slate-100"
                >
                  <option value="normal">Normal (16px)</option>
                  <option value="large">Large (18px)</option>
                  <option value="xlarge">Extra Large (20px)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy Reassurance Note */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-verified shrink-0 mt-0.5" />
            <span>
              <strong>Privacy Guarantee:</strong> Documents you upload belong exclusively to you. No other user or administrator can view or access your private files.
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            className="w-full justify-center shadow-md mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <span>Create Private Account</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="pt-4 border-t border-gold-500/20 text-center">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <button
              onClick={onNavigateLogin}
              className="text-gold-600 dark:text-gold-400 font-semibold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
