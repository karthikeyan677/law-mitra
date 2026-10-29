import React, { useState } from 'react';
import {
  Globe2,
  Type,
  Lock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  User as UserIcon
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { changeUserPassword, deleteUserAccount } from '@/lib/api';

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

export function SettingsPage() {
  const { user, updateProfile, textSize, setTextSize, logout } = useAuth();
  const { addToast } = useToast();

  // Language state
  const [selectedLang, setSelectedLang] = useState(user?.preferred_language || 'en');
  const [isUpdatingLang, setIsUpdatingLang] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value as any;
    setSelectedLang(lang);
    setIsUpdatingLang(true);
    try {
      await updateProfile({ preferred_language: lang });
      addToast({
        title: 'Language Updated',
        description: 'Your preferred language has been saved.',
        variant: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Update Failed',
        description: err.message || 'Could not update language preference.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingLang(false);
    }
  };

  const handleTextSizeChange = (size: 'normal' | 'large' | 'xlarge') => {
    setTextSize(size);
    addToast({
      title: 'Text Size Adjusted',
      description: `Display size set to ${size}.`,
      variant: 'info',
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeUserPassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      addToast({
        title: 'Password Changed',
        description: 'Your password was successfully updated.',
        variant: 'success',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (!deleteConfirmPassword) {
      setDeleteError('Please enter your password to confirm deletion.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteUserAccount(deleteConfirmPassword);
      addToast({
        title: 'Account Permanently Deleted',
        description: 'Your account and all associated documents and physical files were permanently purged.',
        variant: 'info',
      });
      setShowDeleteModal(false);
    } catch (err: any) {
      setDeleteError(err.message || 'Incorrect password.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-navy-900 dark:text-ivory">
          Account & Privacy Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your account preferences, accessibility text size, and data privacy
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-navy-900 dark:text-ivory">
              {user?.email}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Account created on {user ? new Date(user.created_at).toLocaleDateString() : 'N/A'} • Private User Vault
            </p>
          </div>
        </div>
      </Card>

      {/* Preferences Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Preferred Language */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Globe2 className="w-5 h-5 text-gold-500" />
            <h3 className="font-heading font-semibold text-base text-navy-900 dark:text-ivory">
              Preferred Language
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select the regional language for legal explanations and interface text.
          </p>

          <div className="relative pt-2">
            <select
              value={selectedLang}
              onChange={handleLanguageChange}
              disabled={isUpdatingLang}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-charcoal border border-slate-300 dark:border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-slate-800 dark:text-slate-100"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            {isUpdatingLang && (
              <Loader2 className="w-4 h-4 animate-spin text-gold-500 absolute right-3 top-1/2 -translate-y-1/2 mt-1" />
            )}
          </div>
        </Card>

        {/* Text Size Accessibility */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Type className="w-5 h-5 text-gold-500" />
            <h3 className="font-heading font-semibold text-base text-navy-900 dark:text-ivory">
              Text Accessibility Size
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Scales typography across all pages for comfortable legal reading.
          </p>

          <div className="grid grid-cols-3 gap-2.5 pt-2">
            {[
              { id: 'normal', label: 'Normal', size: '16px' },
              { id: 'large', label: 'Large', size: '18px' },
              { id: 'xlarge', label: 'Extra Large', size: '20px' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTextSizeChange(item.id as any)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs transition-all ${
                  textSize === item.id
                    ? 'border-gold-500 bg-gold-500/10 text-navy-900 dark:text-ivory font-bold shadow-xs'
                    : 'border-slate-300 dark:border-charcoal-100 hover:border-gold-500/50 bg-white/50 dark:bg-charcoal/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{item.size}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Change Password Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Lock className="w-5 h-5 text-gold-500" />
          <h3 className="font-heading font-semibold text-base text-navy-900 dark:text-ivory">
            Change Account Password
          </h3>
        </div>

        {passwordError && (
          <div className="flex items-start gap-2 p-3 text-xs rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-300 text-red-700 dark:text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md pt-1">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-charcoal border border-slate-300 dark:border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              New Password (minimum 8 characters)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-charcoal border border-slate-300 dark:border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-charcoal border border-slate-300 dark:border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-slate-800 dark:text-slate-100"
            />
          </div>

          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={isChangingPassword}
            className="shadow-xs"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Updating Password...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>
      </Card>

      {/* Danger Zone: Permanent Account & Data Deletion */}
      <Card className="p-6 border-red-500/40 bg-red-500/5 space-y-4">
        <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <h3 className="font-heading font-bold text-base">
            Danger Zone: Delete Account & All Data
          </h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          In strict compliance with <strong>Rule 6 (Data Sovereignty)</strong> of the Law Mithra Safety Contract,
          you have the absolute right to destroy your account and all records at any time.
          Deleting your account will irreversibly erase your user profile, all uploaded legal documents, and all physical files from disk.
        </p>

        <div className="pt-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setDeleteConfirmPassword('');
              setDeleteError(null);
              setShowDeleteModal(true);
            }}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete my account and all my data</span>
          </Button>
        </div>
      </Card>

      {/* Delete Account Password Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-ivory dark:bg-charcoal-200 rounded-card p-6 shadow-2xl border border-red-500/50 space-y-5">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/60">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-navy-900 dark:text-ivory">
                Confirm Account Deletion
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This action is <strong>permanent and cannot be undone</strong>. To confirm, please enter your account password.
            </p>

            {deleteError && (
              <div className="flex items-start gap-2 p-3 text-xs rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-300 text-red-700 dark:text-red-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password Confirmation
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={deleteConfirmPassword}
                  onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-charcoal border border-slate-300 dark:border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeletingAccount}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={isDeletingAccount || !deleteConfirmPassword}
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Deleting Account...
                    </>
                  ) : (
                    'Permanently Delete Everything'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
