import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FolderLock,
  X,
  FileText,
  Clock,
  ArrowRight,
  Plus,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { fetchDocuments, DocumentListItem } from '@/lib/api';

interface DocumentVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument: (documentId: string) => void;
  onOpenUpload: () => void;
}

export function DocumentVaultModal({
  isOpen,
  onClose,
  onSelectDocument,
  onOpenUpload,
}: DocumentVaultModalProps) {
  const { data: documents, isLoading, isError, refetch } = useQuery<DocumentListItem[]>({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-ivory dark:bg-charcoal-200 rounded-card shadow-2xl border border-gold-500/30 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold-500/20 bg-navy-900/10 dark:bg-navy-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gold-500/10 text-gold-500">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg text-navy-900 dark:text-ivory">
                Your Document Vault
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Secure, private repository of your uploaded legal papers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-ivory rounded-full hover:bg-slate-200 dark:hover:bg-charcoal-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : isError ? (
            <div className="p-6 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="text-sm text-red-600 dark:text-red-400">Failed to load document vault.</p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : documents?.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="inline-flex p-4 rounded-full bg-gold-500/10 text-gold-500">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="font-heading font-semibold text-sm text-navy-900 dark:text-ivory">
                No documents uploaded yet
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload your first court notice, petition, or contract to parse text and begin simplification.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenUpload();
                }}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Upload Document
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {documents?.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    onSelectDocument(doc.id);
                    onClose();
                  }}
                  className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-charcoal-100 hover:border-gold-500/50 bg-white/60 dark:bg-charcoal/60 hover:bg-gold-500/5 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-navy-500/10 dark:bg-gold-500/10 text-navy-700 dark:text-gold-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-medium text-sm text-navy-900 dark:text-ivory group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
                        {doc.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{doc.page_count} pages</span>
                        <span>•</span>
                        <span>{doc.total_words} words</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {doc.status === 'completed' && (
                      <Badge variant="verified" className="text-[10px] py-0.5 px-2">
                        Parsed
                      </Badge>
                    )}
                    {doc.status === 'processing' && (
                      <Badge variant="needs-verification" className="text-[10px] py-0.5 px-2 animate-pulse">
                        Processing
                      </Badge>
                    )}
                    {doc.status === 'failed' && (
                      <Badge variant="alleged" className="text-[10px] py-0.5 px-2">
                        Failed
                      </Badge>
                    )}

                    <div className="text-slate-400 group-hover:text-gold-500 group-hover:translate-x-0.5 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gold-500/20 bg-navy-950/5 dark:bg-navy-950/30 flex items-center justify-between">
          <Button
            variant="gold"
            size="sm"
            onClick={() => {
              onClose();
              onOpenUpload();
            }}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Document</span>
          </Button>

          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
