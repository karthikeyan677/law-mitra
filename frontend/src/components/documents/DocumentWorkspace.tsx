import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  FileText,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Download,
  Search,
  AlertTriangle,
  FileCheck,
  Loader2,
  Clock,
  Layers,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { fetchDocument, deleteDocument, reprocessDocument, DocumentDetail } from '@/lib/api';

interface DocumentWorkspaceProps {
  documentId: string;
  onBack: () => void;
  onDocumentDeleted: () => void;
}

export function DocumentWorkspace({ documentId, onBack, onDocumentDeleted }: DocumentWorkspaceProps) {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Poll every 3s while document is pending or processing
  const { data: document, isLoading, isError, refetch } = useQuery<DocumentDetail>({
    queryKey: ['document', documentId],
    queryFn: () => fetchDocument(documentId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'pending' || status === 'processing' ? 3000 : false;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDocument(documentId),
    onSuccess: () => {
      addToast({
        title: 'Document Permanently Deleted',
        description: 'Document and all extracted pages have been purged from database and disk.',
        variant: 'info',
      });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      onDocumentDeleted();
    },
    onError: (err: any) => {
      addToast({
        title: 'Failed to delete',
        description: err.message || 'Error deleting document.',
        variant: 'destructive',
      });
    },
  });

  const reprocessMutation = useMutation({
    mutationFn: () => reprocessDocument(documentId),
    onSuccess: () => {
      addToast({
        title: 'Reprocessing Started',
        description: 'Document extraction has been re-triggered.',
        variant: 'info',
      });
      refetch();
    },
  });

  const activePage = document?.pages?.[activePageIndex];

  const handleCopyText = () => {
    if (!activePage?.extracted_text) return;
    navigator.clipboard.writeText(activePage.extracted_text);
    setCopied(true);
    addToast({
      title: 'Copied to clipboard',
      description: `Page ${activePage.page_number} extracted text copied.`,
      variant: 'info',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadText = () => {
    if (!document) return;
    const allText = document.pages
      .map((p) => `--- PAGE ${p.page_number} ---\n\n${p.extracted_text}`)
      .join('\n\n\n');

    const blob = new Blob([allText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${document.title.replace(/\s+/g, '_')}_extracted.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-24 h-10 rounded-lg" />
          <Skeleton className="w-64 h-8 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="h-96 rounded-card" />
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-16 rounded-card" />
            <Skeleton className="h-[500px] rounded-card" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-heading font-bold text-navy-900 dark:text-ivory">
          Document Not Found or Unavailable
        </h2>
        <p className="text-sm text-slate-500">
          The requested document could not be loaded or may have been deleted.
        </p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const isProcessing = document.status === 'pending' || document.status === 'processing';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gold-500/20">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Vault</span>
          </Button>

          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-navy-900 dark:text-ivory flex items-center gap-2">
              <span>{document.title}</span>
            </h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{(document.file_size / (1024 * 1024)).toFixed(2)} MB</span>
              <span>•</span>
              <span>{document.file_type || 'Document'}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(document.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          {/* Status Badge */}
          {document.status === 'completed' && (
            <Badge variant="verified" className="gap-1.5 py-1 px-3">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Parsed & Verified</span>
            </Badge>
          )}

          {isProcessing && (
            <Badge variant="needs-verification" className="gap-1.5 py-1 px-3 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Processing OCR...</span>
            </Badge>
          )}

          {document.status === 'failed' && (
            <Badge variant="alleged" className="gap-1.5 py-1 px-3">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Failed</span>
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => reprocessMutation.mutate()}
            disabled={isProcessing || reprocessMutation.isPending}
            title="Re-run text extraction"
          >
            <RefreshCw className={`w-4 h-4 ${reprocessMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="gap-1.5"
            title="Permanently delete document (Rule 6)"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Left Column: Pages List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between pb-3 border-b border-gold-500/10 mb-3">
              <h3 className="font-heading font-semibold text-sm text-navy-900 dark:text-ivory flex items-center gap-2">
                <Layers className="w-4 h-4 text-gold-500" />
                <span>Pages ({document.pages.length})</span>
              </h3>
              <span className="text-xs text-slate-500">
                {document.pages.reduce((acc, p) => acc + p.word_count, 0)} words
              </span>
            </div>

            {isProcessing && document.pages.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-gold-500 mx-auto" />
                <p className="text-xs text-slate-500">Extracting pages from document...</p>
              </div>
            ) : document.pages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No pages extracted yet.</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {document.pages.map((page, idx) => {
                  const isSelected = idx === activePageIndex;
                  return (
                    <button
                      key={page.id}
                      onClick={() => setActivePageIndex(idx)}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition-all duration-150 flex flex-col gap-1 ${
                        isSelected
                          ? 'border-gold-500 bg-gold-500/10 text-navy-900 dark:text-ivory font-semibold shadow-sm'
                          : 'border-slate-200 dark:border-charcoal-100 hover:border-gold-500/40 bg-white/40 dark:bg-charcoal/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                          <span>Page {page.page_number}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {page.word_count} words
                        </span>
                      </div>
                      <p className="line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                        {page.extracted_text || '(Empty page or image-only)'}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Page Text Viewer & Tools */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="overflow-hidden flex flex-col min-h-[600px]">
            {/* Viewer Header / Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-gold-500/10 bg-navy-950/5 dark:bg-navy-950/30">
              <div className="flex items-center gap-2">
                <span className="text-sm font-heading font-semibold text-navy-900 dark:text-ivory">
                  Page {activePage ? activePage.page_number : 1} of {document.pages.length || 1}
                </span>
                {activePage && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({activePage.word_count} words)
                  </span>
                )}
              </div>

              {/* Toolbar Buttons */}
              <div className="flex items-center gap-2">
                {/* Search in page */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in page..."
                    className="pl-8 pr-3 py-1 text-xs bg-white dark:bg-charcoal border border-slate-300 dark:border-charcoal-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 text-slate-800 dark:text-slate-200 w-36 sm:w-48"
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyText}
                  disabled={!activePage?.extracted_text}
                  className="gap-1.5 text-xs py-1 h-8"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadText}
                  disabled={!document.pages.length}
                  className="gap-1.5 text-xs py-1 h-8"
                  title="Download all pages as .txt file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export Text</span>
                </Button>
              </div>
            </div>

            {/* Viewer Body */}
            <div className="p-6 flex-1 bg-ivory/50 dark:bg-charcoal/50 overflow-y-auto max-h-[650px]">
              {isProcessing && !activePage ? (
                <div className="space-y-4 py-8">
                  <div className="flex items-center justify-center gap-2 text-gold-600 dark:text-gold-400 font-medium text-sm">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>OCR engine is extracting text from this document...</span>
                  </div>
                  <Skeleton className="h-6 w-3/4 mx-auto" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : document.status === 'failed' ? (
                <div className="p-6 text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
                  <h4 className="font-semibold text-sm text-red-600 dark:text-red-400">
                    Extraction Error
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    {document.error_message || 'An unexpected error occurred while parsing this document.'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reprocessMutation.mutate()}
                    className="mt-2"
                  >
                    Retry Extraction
                  </Button>
                </div>
              ) : activePage ? (
                <div className="prose dark:prose-invert max-w-none">
                  {searchQuery ? (
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                      {highlightMatches(activePage.extracted_text, searchQuery)}
                    </pre>
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800 dark:text-slate-200 select-text">
                      {activePage.extracted_text || (
                        <span className="text-slate-400 italic">
                          (No text detected on this page. If this is a scanned document, please ensure Tesseract OCR is configured.)
                        </span>
                      )}
                    </pre>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-12">
                  Select a page from the left to view extracted text.
                </p>
              )}
            </div>

            {/* Viewer Footer: Next Phase Prompt */}
            <div className="px-6 py-3 border-t border-gold-500/10 bg-gold-500/5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>
                <strong>Next Step:</strong> Plain Language Legal Simplification (Phase 2)
              </span>
              <span className="text-gold-600 dark:text-gold-400 font-medium">
                Phase 1 Active • OCR Ready
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal (Rule 6 Data Sovereignty) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-ivory dark:bg-charcoal-200 rounded-card p-6 shadow-2xl border border-red-500/40 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/60">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-navy-900 dark:text-ivory">
                Permanently Delete Document?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              In accordance with <strong>Rule 6 (Data Sovereignty)</strong> of the Law Mithra Safety Contract,
              confirming this action will immediately and irreversibly delete:
            </p>
            <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc list-inside space-y-1 bg-slate-100 dark:bg-charcoal p-3 rounded-lg">
              <li>The original uploaded document file from disk</li>
              <li>All {document.pages.length} extracted page records and OCR transcripts</li>
              <li>All metadata associated with this case</li>
            </ul>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Permanently Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function highlightMatches(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-gold-300 dark:bg-gold-500/40 text-inherit px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
