import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/Toast';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { ExplainerSteps } from '@/components/ExplainerSteps';
import { DesignSystemShowcase } from '@/components/DesignSystemShowcase';
import { SafetyContractSection } from '@/components/SafetyContractSection';
import { Footer } from '@/components/Footer';
import { DocumentUploadModal } from '@/components/documents/DocumentUploadModal';
import { DocumentVaultModal } from '@/components/documents/DocumentVaultModal';
import { DocumentWorkspace } from '@/components/documents/DocumentWorkspace';

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  // Theme state: dark or light mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('law-mithra-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Modal & Workspace state
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

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <div className="min-h-screen flex flex-col bg-ivory dark:bg-charcoal text-slate-800 dark:text-slate-100 selection:bg-gold-200 selection:text-navy-900 transition-colors duration-200">
            <Navbar
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onOpenVault={() => setIsVaultModalOpen(true)}
              onGoHome={() => setSelectedDocumentId(null)}
            />

            <main className="flex-1">
              {selectedDocumentId ? (
                <DocumentWorkspace
                  documentId={selectedDocumentId}
                  onBack={() => setSelectedDocumentId(null)}
                  onDocumentDeleted={() => setSelectedDocumentId(null)}
                />
              ) : (
                <>
                  <Hero
                    onOpenUpload={() => setIsUploadModalOpen(true)}
                    onOpenVault={() => setIsVaultModalOpen(true)}
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
              onOpenUpload={() => setIsUploadModalOpen(true)}
            />
          </div>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
