import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
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
  BookOpen,
  Scale,
  Plus,
  CheckCircle2,
  XCircle,
  Edit2,
  Info,
  ShieldAlert,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import {
  fetchDocument,
  deleteDocument,
  reprocessDocument,
  fetchDocumentSections,
  detectDocumentSections,
  updateDocumentSection,
  addManualSection,
  deleteManualSection,
  DocumentDetail,
  DetectedSection,
  GroupedSectionsResponse
} from '@/lib/api';

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

  // Selected section for viewer highlighting & scrolling
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Manual Section Add Modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [manualForm, setManualForm] = useState({
    page_number: 1,
    start_char: 0,
    end_char: 0,
    section_number: '',
    act_key: 'UNKNOWN',
    sub_clause: '',
    matched_text_preview: '',
  });

  // Edit Section Modal state
  const [editingSection, setEditingSection] = useState<DetectedSection | null>(null);
  const [editForm, setEditForm] = useState({
    act_key: '',
    section_number: '',
  });

  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Fetch document details (poll every 3s if processing)
  const { data: document, isLoading: isDocLoading, isError: isDocError, refetch: refetchDoc } = useQuery<DocumentDetail>({
    queryKey: ['document', documentId],
    queryFn: () => fetchDocument(documentId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'pending' || status === 'processing' ? 3000 : false;
    },
  });

  // Fetch detected sections grouped by Act
  const {
    data: sectionsData,
    isLoading: isSectionsLoading,
    refetch: refetchSections,
  } = useQuery<GroupedSectionsResponse>({
    queryKey: ['document-sections', documentId],
    queryFn: () => fetchDocumentSections(documentId),
    enabled: !!document && document.status === 'completed',
  });

  // Document hard delete mutation
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

  // Re-trigger extraction
  const reprocessMutation = useMutation({
    mutationFn: () => reprocessDocument(documentId),
    onSuccess: () => {
      addToast({
        title: 'Reprocessing Started',
        description: 'Document extraction has been re-triggered.',
        variant: 'info',
      });
      refetchDoc();
    },
  });

  // Re-run section detection mutation
  const detectMutation = useMutation({
    mutationFn: () => detectDocumentSections(documentId),
    onSuccess: (data) => {
      addToast({
        title: 'Section Detection Complete',
        description: `Found ${data.length} legal ${data.length === 1 ? 'section' : 'sections'}. Auto items updated, verified items preserved.`,
        variant: 'info',
      });
      queryClient.invalidateQueries({ queryKey: ['document-sections', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (err: any) => {
      addToast({
        title: 'Detection Failed',
        description: err.message || 'Error executing section detection.',
        variant: 'destructive',
      });
    },
  });

  // Update section status or edit mutation
  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: string; data: any }) =>
      updateDocumentSection(documentId, sectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-sections', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setEditingSection(null);
    },
    onError: (err: any) => {
      addToast({
        title: 'Update Failed',
        description: err.message || 'Error updating section.',
        variant: 'destructive',
      });
    },
  });

  // Add manual section mutation
  const addManualMutation = useMutation({
    mutationFn: (data: typeof manualForm) => addManualSection(documentId, data),
    onSuccess: (newSec) => {
      addToast({
        title: 'Section Added Manually',
        description: `Section ${newSec.section_number} recorded.`,
        variant: 'info',
      });
      queryClient.invalidateQueries({ queryKey: ['document-sections', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsManualModalOpen(false);
      setSelectedSectionId(newSec.id);
    },
    onError: (err: any) => {
      addToast({
        title: 'Failed to Add Section',
        description: err.message || 'Ensure offsets match the page text length.',
        variant: 'destructive',
      });
    },
  });

  // Delete manual section mutation
  const deleteManualMutation = useMutation({
    mutationFn: (sectionId: string) => deleteManualSection(documentId, sectionId),
    onSuccess: () => {
      addToast({
        title: 'Section Deleted',
        description: 'Manually added section removed.',
        variant: 'info',
      });
      queryClient.invalidateQueries({ queryKey: ['document-sections', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedSectionId(null);
    },
    onError: (err: any) => {
      addToast({
        title: 'Delete Failed',
        description: err.message || 'Only manual sections can be deleted.',
        variant: 'destructive',
      });
    },
  });

  const activePage = document?.pages?.[activePageIndex];

  // Helper to find selected section object
  const allSections: DetectedSection[] = React.useMemo(() => {
    if (!sectionsData?.groups) return [];
    return sectionsData.groups.flatMap((g) => g.sections);
  }, [sectionsData]);

  const activeSection = React.useMemo(() => {
    return allSections.find((s) => s.id === selectedSectionId) || null;
  }, [allSections, selectedSectionId]);

  // When user clicks a section in the panel: switch to that page and highlight
  const handleSelectSection = (section: DetectedSection) => {
    setSelectedSectionId(section.id);
    const targetIdx = section.page_number - 1;
    if (targetIdx !== activePageIndex && targetIdx >= 0 && targetIdx < (document?.pages.length || 1)) {
      setActivePageIndex(targetIdx);
    }
  };

  // Handle user selecting text in the document viewer to add a manual section
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !activePage) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const fullText = activePage.extracted_text;
    const startIndex = fullText.indexOf(selectedText);
    if (startIndex !== -1) {
      setManualForm({
        page_number: activePage.page_number,
        start_char: startIndex,
        end_char: startIndex + selectedText.length,
        section_number: selectedText.replace(/[^0-9a-zA-Z]/g, '').slice(0, 20),
        act_key: 'UNKNOWN',
        sub_clause: '',
        matched_text_preview: selectedText,
      });
      setIsManualModalOpen(true);
    }
  };

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

  if (isDocLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-24 h-10 rounded-lg" />
          <Skeleton className="w-64 h-8 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-3 h-96 rounded-card" />
          <Skeleton className="lg:col-span-5 h-[600px] rounded-card" />
          <Skeleton className="lg:col-span-4 h-[600px] rounded-card" />
        </div>
      </div>
    );
  }

  if (isDocError || !document) {
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
  const pageSections = allSections.filter((s) => s.page_number === (activePage?.page_number || 1));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gold-500/20">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-2 focus:ring-2 focus:ring-gold-500"
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
            className="focus:ring-2 focus:ring-gold-500"
          >
            <RefreshCw className={`w-4 h-4 ${reprocessMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="gap-1.5 focus:ring-2 focus:ring-red-500"
            title="Permanently delete document (Rule 6)"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* Main 3-Column Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Column 1: Pages List (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-4 shadow-soft">
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
                  const pageSecCount = allSections.filter((s) => s.page_number === page.page_number).length;
                  return (
                    <button
                      key={page.id}
                      onClick={() => setActivePageIndex(idx)}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition-all duration-150 flex flex-col gap-1 focus:outline-none focus:ring-2 focus:ring-gold-500 ${
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
                        <div className="flex items-center gap-1.5">
                          {pageSecCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-gold-500/20 text-gold-800 dark:text-gold-300 font-bold">
                              {pageSecCount} {pageSecCount === 1 ? 'sec' : 'secs'}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {page.word_count}w
                          </span>
                        </div>
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

        {/* Column 2: Document Page Text Viewer (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="overflow-hidden flex flex-col min-h-[600px] shadow-soft">
            {/* Viewer Header / Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gold-500/10 bg-navy-950/5 dark:bg-navy-950/30">
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
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search page..."
                    className="pl-8 pr-2 py-1 text-xs bg-white dark:bg-charcoal border border-slate-300 dark:border-charcoal-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 text-slate-800 dark:text-slate-200 w-28 sm:w-36"
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyText}
                  disabled={!activePage?.extracted_text}
                  className="gap-1 text-xs py-1 h-8 focus:ring-2 focus:ring-gold-500"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadText}
                  disabled={!document.pages.length}
                  className="gap-1 text-xs py-1 h-8 focus:ring-2 focus:ring-gold-500"
                  title="Download all pages as .txt file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>

            {/* Instruction tooltip banner for manual selection */}
            <div className="px-4 py-1.5 bg-gold-500/5 border-b border-gold-500/10 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400 shrink-0" />
                <span>Tip: Select any text in the viewer below to add it as a legal section.</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setManualForm({
                    page_number: activePage ? activePage.page_number : 1,
                    start_char: 0,
                    end_char: 10,
                    section_number: '',
                    act_key: 'UNKNOWN',
                    sub_clause: '',
                    matched_text_preview: '',
                  });
                  setIsManualModalOpen(true);
                }}
                className="text-[10px] h-6 px-2 py-0"
              >
                + Add Manually
              </Button>
            </div>

            {/* Viewer Body with Section Highlighting */}
            <div
              ref={viewerContainerRef}
              onMouseUp={handleTextSelection}
              className="p-5 flex-1 bg-ivory/50 dark:bg-charcoal/50 overflow-y-auto max-h-[600px] select-text"
            >
              {isProcessing && !activePage ? (
                <div className="space-y-4 py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gold-500 mx-auto" />
                  <p className="text-xs text-slate-500">Extracting text...</p>
                </div>
              ) : document.status === 'failed' ? (
                <div className="p-6 text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
                  <h4 className="font-semibold text-sm text-red-600 dark:text-red-400">Extraction Error</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{document.error_message}</p>
                </div>
              ) : activePage ? (
                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm font-sans leading-relaxed text-slate-800 dark:text-slate-200">
                  {renderHighlightedText(
                    activePage.extracted_text,
                    pageSections,
                    selectedSectionId,
                    searchQuery
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-12">
                  Select a page to view extracted text.
                </p>
              )}
            </div>

            {/* Viewer Footer */}
            <div className="px-4 py-2 border-t border-gold-500/10 bg-gold-500/5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                <span>{pageSections.length} sections found on this page</span>
              </span>
              <span className="text-gold-600 dark:text-gold-400 font-medium">Deterministic Rule-based OCR</span>
            </div>
          </Card>
        </div>

        {/* Column 3: Legal Sections Side Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 shadow-soft flex flex-col min-h-[600px]">
            {/* Panel Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gold-500/10 mb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-gold-500" />
                <h2 className="font-heading font-bold text-sm sm:text-base text-navy-900 dark:text-ivory">
                  Legal Sections
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gold-500/20 text-gold-800 dark:text-gold-300">
                  {sectionsData?.total_count || 0}
                </span>
              </div>

              {/* Action Buttons: Run Detection Again & Add Manual */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => detectMutation.mutate()}
                  disabled={detectMutation.isPending || isProcessing}
                  title="Run detection again (re-scans all pages)"
                  className="h-8 px-2 gap-1 text-xs focus:ring-2 focus:ring-gold-500"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${detectMutation.isPending ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Re-detect</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setManualForm({
                      page_number: activePage ? activePage.page_number : 1,
                      start_char: 0,
                      end_char: 10,
                      section_number: '',
                      act_key: 'UNKNOWN',
                      sub_clause: '',
                      matched_text_preview: '',
                    });
                    setIsManualModalOpen(true);
                  }}
                  className="h-8 px-2.5 gap-1 text-xs focus:ring-2 focus:ring-gold-500"
                  title="Add section manually"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </Button>
              </div>
            </div>

            {/* Mandatory AI Safety Contract Banner */}
            <div className="p-2.5 mb-3 rounded-lg bg-navy-900/5 dark:bg-navy-950/40 border border-gold-500/20 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-gold-600 dark:text-gold-400 shrink-0 mt-0.5" />
              <p className="leading-tight">
                <strong>Safety Notice:</strong> These sections were found written in your document. Explanations come in a later step and will always show sources.
              </p>
            </div>

            {/* Panel Content: Grouped by Act */}
            <div className="flex-1 overflow-y-auto space-y-4 max-h-[500px] pr-1">
              {isSectionsLoading ? (
                <div className="space-y-3 py-6">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              ) : !sectionsData || sectionsData.total_count === 0 ? (
                /* Empty State */
                <div className="py-12 px-4 text-center space-y-3 rounded-lg border border-dashed border-slate-300 dark:border-charcoal-100 bg-slate-50/50 dark:bg-charcoal/30">
                  <div className="p-3 rounded-full bg-gold-500/10 text-gold-600 dark:text-gold-400 w-12 h-12 mx-auto flex items-center justify-center">
                    <Scale className="w-6 h-6" />
                  </div>
                  <h4 className="font-heading font-semibold text-xs sm:text-sm text-navy-900 dark:text-ivory">
                    No legal sections found
                  </h4>
                  <p className="text-xs text-slate-500 max-w-[220px] mx-auto leading-relaxed">
                    No legal sections were found in this document. This can happen with scanned pages. You can add one manually.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setManualForm({
                        page_number: activePage ? activePage.page_number : 1,
                        start_char: 0,
                        end_char: 10,
                        section_number: '',
                        act_key: 'UNKNOWN',
                        sub_clause: '',
                        matched_text_preview: '',
                      });
                      setIsManualModalOpen(true);
                    }}
                    className="text-xs gap-1 mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Manually</span>
                  </Button>
                </div>
              ) : (
                sectionsData.groups.map((group) => {
                  const isUnknown = group.act_key === 'UNKNOWN';
                  return (
                    <div key={group.act_key} className="space-y-2">
                      {/* Group Header */}
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-charcoal-100">
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading font-bold text-xs uppercase tracking-wider text-navy-900 dark:text-ivory">
                            {formatActName(group.act_key)}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-charcoal text-slate-600 dark:text-slate-400">
                            {group.count}
                          </span>
                        </div>
                      </div>

                      {/* UNKNOWN Warning Banner */}
                      {isUnknown && (
                        <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span>Act not identified. Please check the original text.</span>
                        </div>
                      )}

                      {/* Sections List in Group */}
                      <div className="space-y-2">
                        {group.sections.map((section) => {
                          const isSelected = selectedSectionId === section.id;
                          return (
                            <div
                              key={section.id}
                              onClick={() => handleSelectSection(section)}
                              className={`p-3 rounded-lg border text-xs transition-all cursor-pointer relative group ${
                                isSelected
                                  ? 'border-gold-500 bg-gold-500/10 shadow-sm ring-1 ring-gold-500'
                                  : 'border-slate-200 dark:border-charcoal-100 bg-white/70 dark:bg-charcoal/70 hover:border-gold-500/40'
                              }`}
                            >
                              {/* Header: Section Number + Status Badge */}
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-heading font-bold text-sm text-navy-900 dark:text-ivory">
                                    Section {section.section_number}
                                  </span>
                                  {section.sub_clause && (
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                      {section.sub_clause}
                                    </span>
                                  )}
                                </div>

                                {/* Status Badge */}
                                <SectionStatusBadge
                                  reviewStatus={section.review_status}
                                  detectionMethod={section.detection_method}
                                />
                              </div>

                              {/* Original Snippet */}
                              <div className="bg-slate-100/70 dark:bg-charcoal p-2 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300 line-clamp-2 my-1 border border-slate-200/50 dark:border-charcoal-100/50">
                                "{section.matched_text}"
                              </div>

                              {/* Footer: Page & Actions */}
                              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3 text-gold-500" />
                                  <span>Page {section.page_number}</span>
                                </span>

                                {/* Card Actions */}
                                <div
                                  className="flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Confirm Button */}
                                  {section.review_status !== 'confirmed' && (
                                    <button
                                      onClick={() =>
                                        updateSectionMutation.mutate({
                                          sectionId: section.id,
                                          data: { review_status: 'confirmed' },
                                        })
                                      }
                                      className="p-1 text-teal-600 hover:text-teal-700 dark:text-teal-400 rounded hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
                                      title="Confirm as verified"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Reject Button */}
                                  {section.review_status !== 'rejected' && (
                                    <button
                                      onClick={() =>
                                        updateSectionMutation.mutate({
                                          sectionId: section.id,
                                          data: { review_status: 'rejected' },
                                        })
                                      }
                                      className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                      title="Reject detection"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Edit Button */}
                                  <button
                                    onClick={() => {
                                      setEditingSection(section);
                                      setEditForm({
                                        act_key: section.act_key,
                                        section_number: section.section_number,
                                      });
                                    }}
                                    className="p-1 text-slate-400 hover:text-navy-900 dark:hover:text-ivory rounded hover:bg-slate-100 dark:hover:bg-charcoal transition-colors"
                                    title="Edit section details"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete (Manual Only) */}
                                  {section.detection_method === 'manual' && (
                                    <button
                                      onClick={() => deleteManualMutation.mutate(section.id)}
                                      className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                      title="Delete manually added section"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Manual Section Add Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-ivory dark:bg-charcoal-200 rounded-card p-6 shadow-2xl border border-gold-500/30 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gold-500/10">
              <h3 className="font-heading font-bold text-base text-navy-900 dark:text-ivory flex items-center gap-2">
                <Plus className="w-4 h-4 text-gold-500" />
                <span>Add Legal Section Manually</span>
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {manualForm.matched_text_preview && (
                <div className="p-2.5 rounded bg-slate-100 dark:bg-charcoal border border-slate-200 dark:border-charcoal-100">
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                    Selected Document Text:
                  </span>
                  <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                    "{manualForm.matched_text_preview}"
                  </p>
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Section Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualForm.section_number}
                  onChange={(e) => setManualForm({ ...manualForm, section_number: e.target.value })}
                  placeholder="e.g. 420, 498A, 138"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-charcoal-100 bg-white dark:bg-charcoal text-slate-900 dark:text-ivory focus:ring-1 focus:ring-gold-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Governing Act
                </label>
                <select
                  value={manualForm.act_key}
                  onChange={(e) => setManualForm({ ...manualForm, act_key: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-charcoal-100 bg-white dark:bg-charcoal text-slate-900 dark:text-ivory focus:ring-1 focus:ring-gold-500"
                >
                  <option value="UNKNOWN">UNKNOWN (Act Not Identified)</option>
                  <option value="IPC">Indian Penal Code (IPC)</option>
                  <option value="BNS">Bharatiya Nyaya Sanhita (BNS)</option>
                  <option value="CRPC">Code of Criminal Procedure (CrPC)</option>
                  <option value="BNSS">Bharatiya Nagarik Suraksha Sanhita (BNSS)</option>
                  <option value="CPC">Code of Civil Procedure (CPC)</option>
                  <option value="NI_ACT">Negotiable Instruments Act (NI Act)</option>
                  <option value="BSA">Bharatiya Sakshya Adhiniyam (BSA)</option>
                  <option value="IEA">Indian Evidence Act (IEA)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Page #
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={manualForm.page_number}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, page_number: parseInt(e.target.value) || 1 })
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-charcoal-100 bg-white dark:bg-charcoal text-slate-900 dark:text-ivory"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Start Char
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={manualForm.start_char}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, start_char: parseInt(e.target.value) || 0 })
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-charcoal-100 bg-white dark:bg-charcoal text-slate-900 dark:text-ivory"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    End Char
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={manualForm.end_char}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, end_char: parseInt(e.target.value) || 1 })
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-charcoal-100 bg-white dark:bg-charcoal text-slate-900 dark:text-ivory"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gold-500/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsManualModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => addManualMutation.mutate(manualForm)}
                disabled={!manualForm.section_number || addManualMutation.isPending}
              >
                {addManualMutation.isPending ? 'Saving...' : 'Add Section'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-ivory dark:bg-charcoal-200 rounded-card p-6 shadow-2xl border border-gold-500/30 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gold-500/10">
              <h3 className="font-heading font-bold text-base text-navy-900 dark:text-ivory flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-gold-500" />
                <span>Edit Section Details</span>
              </h3>
              <button
                onClick={() => setEditingSection(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Section Number
                </label>
                <input
                  type="text"
                  value={editForm.section_number}
                  onChange={(e) => setEditForm({ ...editForm, section_number: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-charcoal-100 bg-white dark:bg-charcoal text-slate-900 dark:text-ivory"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Act Identifier
                </label>
                <select
                  value={editForm.act_key}
                  onChange={(e) => setEditForm({ ...editForm, act_key: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-charcoal-100 bg-white dark:bg-charcoal text-slate-900 dark:text-ivory"
                >
                  <option value="UNKNOWN">UNKNOWN (Act Not Identified)</option>
                  <option value="IPC">Indian Penal Code (IPC)</option>
                  <option value="BNS">Bharatiya Nyaya Sanhita (BNS)</option>
                  <option value="CRPC">Code of Criminal Procedure (CrPC)</option>
                  <option value="BNSS">Bharatiya Nagarik Suraksha Sanhita (BNSS)</option>
                  <option value="CPC">Code of Civil Procedure (CPC)</option>
                  <option value="NI_ACT">Negotiable Instruments Act (NI Act)</option>
                  <option value="BSA">Bharatiya Sakshya Adhiniyam (BSA)</option>
                  <option value="IEA">Indian Evidence Act (IEA)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gold-500/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingSection(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  updateSectionMutation.mutate({
                    sectionId: editingSection.id,
                    data: editForm,
                  })
                }
                disabled={updateSectionMutation.isPending}
              >
                {updateSectionMutation.isPending ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

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
              <li>All detected legal sections and case annotations</li>
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
                {deleteMutation.isPending ? 'Deleting...' : 'Permanently Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Section Status Badge with appropriate theme colors
function SectionStatusBadge({
  reviewStatus,
  detectionMethod,
}: {
  reviewStatus: 'auto' | 'confirmed' | 'rejected';
  detectionMethod: 'rule' | 'manual';
}) {
  if (detectionMethod === 'manual') {
    return (
      <Badge variant="default" className="text-[10px] py-0 px-2">
        Manual
      </Badge>
    );
  }

  switch (reviewStatus) {
    case 'confirmed':
      return (
        <Badge variant="verified" className="text-[10px] py-0 px-2 gap-1">
          <Check className="w-2.5 h-2.5" />
          <span>Confirmed</span>
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="missing" className="text-[10px] py-0 px-2 gap-1">
          <span>Rejected</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="needs-verification" className="text-[10px] py-0 px-2 gap-1">
          <span>Auto-detected</span>
        </Badge>
      );
  }
}

// Format Act Key for human display
function formatActName(actKey: string): string {
  switch (actKey) {
    case 'IPC':
      return 'Indian Penal Code (IPC)';
    case 'BNS':
      return 'Bharatiya Nyaya Sanhita (BNS)';
    case 'CRPC':
      return 'Code of Criminal Procedure (CrPC)';
    case 'BNSS':
      return 'Bharatiya Nagarik Suraksha Sanhita (BNSS)';
    case 'CPC':
      return 'Code of Civil Procedure (CPC)';
    case 'NI_ACT':
      return 'Negotiable Instruments Act (NI Act)';
    case 'BSA':
      return 'Bharatiya Sakshya Adhiniyam (BSA)';
    case 'IEA':
      return 'Indian Evidence Act (IEA)';
    case 'UNKNOWN':
      return 'Act Not Identified';
    default:
      return actKey;
  }
}

// Text highlighter that highlights active section offsets and search matches
function renderHighlightedText(
  text: string,
  pageSections: DetectedSection[],
  selectedSectionId: string | null,
  searchQuery: string
) {
  if (!text) {
    return <span className="text-slate-400 italic">(No extractable text on this page)</span>;
  }

  // If a section is selected on this page, highlight its exact range
  const activeSec = pageSections.find((s) => s.id === selectedSectionId);

  if (activeSec && activeSec.start_char < activeSec.end_char && activeSec.end_char <= text.length) {
    const before = text.slice(0, activeSec.start_char);
    const highlighted = text.slice(activeSec.start_char, activeSec.end_char);
    const after = text.slice(activeSec.end_char);

    return (
      <pre className="whitespace-pre-wrap font-sans">
        {before}
        <mark
          id={`section-highlight-${activeSec.id}`}
          className="bg-gold-300 dark:bg-gold-500/50 text-navy-950 dark:text-ivory px-1 py-0.5 rounded font-semibold ring-2 ring-gold-500 shadow-sm transition-all"
        >
          {highlighted}
        </mark>
        {after}
      </pre>
    );
  }

  // If search query is entered, highlight search matches
  if (searchQuery.trim()) {
    const parts = text.split(new RegExp(`(${escapeRegex(searchQuery)})`, 'gi'));
    return (
      <pre className="whitespace-pre-wrap font-sans">
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} className="bg-gold-300 dark:bg-gold-500/40 text-inherit px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </pre>
    );
  }

  // Default: Render plain pre-wrap with soft markers on all sections on this page
  return <pre className="whitespace-pre-wrap font-sans">{text}</pre>;
}

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
