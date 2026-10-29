import React, { useState } from 'react';
import { Scale, Mail, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';

interface LoginPageProps {
  onNavigateSignup: () => void;
  onLoginSuccess: () => void;
}

export function LoginPage({ onNavigateSignup, onLoginSuccess }: LoginPageProps) {
  const { login } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: cleanEmail, password });
      addToast({
        title: 'Welcome Back',
        description: 'You have signed in to your Law Mithra vault.',
        variant: 'success',
      });
      onLoginSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-ivory dark:bg-charcoal-200 rounded-card p-8 shadow-2xl border border-gold-500/30 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-navy-900 dark:bg-navy-800 text-gold-500 shadow-soft border border-gold-500/30 mb-2">
            <Scale className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-navy-900 dark:text-ivory">
            Sign In to Law Mithra
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Access your private legal document vault and case notes
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
              htmlFor="login-email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
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
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white dark:bg-charcoal border border-slate-300 dark:border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-slate-800 dark:text-slate-100"
              />
            </div>
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
                Signing In...
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="pt-4 border-t border-gold-500/20 text-center space-y-2">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Don't have an account yet?{' '}
            <button
              onClick={onNavigateSignup}
              className="text-gold-600 dark:text-gold-400 font-semibold hover:underline"
            >
              Create Account
            </button>
          </p>
          <p className="text-[11px] text-slate-400">
            🔒 Complete privacy. Every document is strictly isolated to your account.
          </p>
        </div>
      </div>
    </div>
  );
}
