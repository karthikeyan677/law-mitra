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
            <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
            <main className="flex-1">
              <Hero />
              <ExplainerSteps />
              <DesignSystemShowcase />
              <SafetyContractSection />
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
