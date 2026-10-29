import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { ExplainerSteps } from '@/components/ExplainerSteps';
import { DesignSystemShowcase } from '@/components/DesignSystemShowcase';
import { SafetyContractSection } from '@/components/SafetyContractSection';
import { Footer } from '@/components/Footer';
import { DocumentUploadModal } from '@/components/documents/DocumentUploadModal';
import { DocumentVaultModal } from '@/components/documents/DocumentVaultModal';
import { DocumentWorkspace } from '@/components/documents/DocumentWorkspace';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SettingsPage } from '@/pages/SettingsPage';

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10,
      refetchOnWindowFocus: false,
    },
  },
});

type ViewState = 'landing' | 'dashboard' | 'login' | 'signup' | 'settings';

function MainLayout() {
  const { user, isLoading } = useAuth();
  const { addToast } = useToast();

  // Theme state: dark or light mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('law-mithra-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Modal & Workspace state
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('law-mithra-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('law-mithra-theme', 'light');
    }
  }, [darkMode]);

  // When user logs in, if they were on landing or auth pages, send them to dashboard
  useEffect(() => {
    if (user && (currentView === 'login' || currentView === 'signup')) {
      setCurrentView('dashboard');
    }
  }, [user, currentView]);

  // Protected route enforcement
  const handleNavigate = (view: ViewState) => {
    setSelectedDocumentId(null);
    if ((view === 'dashboard' || view === 'settings') && !user) {
      addToast({
        title: 'Sign In Required',
        description: 'Please log in to access your dashboard and settings.',
        variant: 'info',
      });
      setCurrentView('login');
      return;
    }
    setCurrentView(view);
  };

  const handleOpenUpload = () => {
    if (!user) {
      addToast({
        title: 'Sign In Required',
        description: 'Please sign in or create an account to upload documents to your vault.',
        variant: 'info',
      });
      setCurrentView('login');
      return;
    }
    setIsUploadModalOpen(true);
  };

  const handleOpenVault = () => {
    if (!user) {
      addToast({
        title: 'Sign In Required',
        description: 'Please sign in to access your private document vault.',
        variant: 'info',
      });
      setCurrentView('login');
      return;
    }
    setIsVaultModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory dark:bg-charcoal text-slate-800 dark:text-slate-100 selection:bg-gold-200 selection:text-navy-900 transition-colors duration-200">
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenUpload={handleOpenUpload}
        onOpenVault={handleOpenVault}
      />

      <main className="flex-1">
        {selectedDocumentId ? (
          <DocumentWorkspace
            documentId={selectedDocumentId}
            onBack={() => {
              setSelectedDocumentId(null);
              setCurrentView(user ? 'dashboard' : 'landing');
            }}
            onDocumentDeleted={() => {
              setSelectedDocumentId(null);
              setCurrentView('dashboard');
            }}
          />
        ) : currentView === 'login' ? (
          <LoginPage
            onNavigateSignup={() => setCurrentView('signup')}
            onLoginSuccess={() => setCurrentView('dashboard')}
          />
        ) : currentView === 'signup' ? (
          <SignupPage
            onNavigateLogin={() => setCurrentView('login')}
            onSignupSuccess={() => setCurrentView('dashboard')}
          />
        ) : currentView === 'dashboard' && user ? (
          <DashboardPage
            onOpenUpload={handleOpenUpload}
            onSelectDocument={(id) => setSelectedDocumentId(id)}
          />
        ) : currentView === 'settings' && user ? (
          <SettingsPage />
        ) : (
          <>
            <Hero
              onOpenUpload={handleOpenUpload}
              onOpenVault={handleOpenVault}
            />
            <ExplainerSteps />
            <DesignSystemShowcase />
            <SafetyContractSection />
          </>
        )}
      </main>

      <Footer />

      {/* Modals */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={(doc) => {
          setSelectedDocumentId(doc.id);
        }}
      />

      <DocumentVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        onSelectDocument={(id) => setSelectedDocumentId(id)}
        onOpenUpload={handleOpenUpload}
      />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <MainLayout />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
