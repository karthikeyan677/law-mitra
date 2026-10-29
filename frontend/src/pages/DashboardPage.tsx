import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  FileText,
  Clock,
  ArrowRight,
  Download,
  Trash2,
  FolderLock,
  Loader2,
  AlertCircle,
  FileCheck,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { fetchDocuments, deleteDocument, DocumentListItem } from '@/lib/api';

interface DashboardPageProps {
  onOpenUpload: () => void;
  onSelectDocument: (documentId: string) => void;
}

export function DashboardPage({ onOpenUpload, onSelectDocument }: DashboardPageProps) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [documentToDelete, setDocumentToDelete] = useState<DocumentListItem | null>(null);

  const { data: documents, isLoading, isError, refetch } = useQuery<DocumentListItem[]>({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      addToast({
        title: 'Document Deleted',
        description: 'The document and its parsed pages have been permanently purged.',
        variant: 'info',
      });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDocumentToDelete(null);
    },
    onError: (err: any) => {
      addToast({
        title: 'Delete Failed',
        description: err.message || 'Error occurred while deleting document.',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gold-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gold-100 dark:bg-gold-950/50 text-gold-800 dark:text-gold-300 border border-gold-500/20">
              Private Vault
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-navy-900 dark:text-ivory mt-1">
            Welcome to Your Legal Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Signed in as <strong className="text-navy-900 dark:text-ivory">{user?.email}</strong>. Only you can view these documents.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={onOpenUpload}
          className="gap-2 shadow-soft hover:shadow-gold-500/20"
        >
          <Plus className="w-4 h-4 text-accent" />
          <span>Upload Document</span>
        </Button>
      </div>

      {/* Main Grid: New Document Card + Existing Documents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-navy-900 dark:text-ivory flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-gold-500" />
            <span>Your Case Documents ({documents?.length || 0})</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48 rounded-card" />
            <Skeleton className="h-48 rounded-card" />
            <Skeleton className="h-48 rounded-card" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center rounded-card border border-red-300 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h3 className="font-heading font-bold text-sm text-red-700 dark:text-red-300">
              Failed to load your documents
            </h3>
            <p className="text-xs text-slate-500">Please verify your connection and try again.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* "New Document" Action Card */}
            <div
              onClick={onOpenUpload}
              className="flex flex-col items-center justify-center p-8 rounded-card border-2 border-dashed border-gold-500/40 hover:border-gold-500 bg-gold-500/5 hover:bg-gold-500/10 cursor-pointer transition-all duration-200 text-center min-h-[220px] group shadow-xs"
            >
              <div className="p-4 rounded-full bg-gold-500/10 text-gold-600 dark:text-gold-400 group-hover:scale-110 transition-transform mb-3">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-bold text-base text-navy-900 dark:text-ivory group-hover:text-gold-600 dark:group-hover:text-gold-400">
                Upload New Document
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
                Drop PDF, court notice, petition, or order for OCR parsing
              </p>
            </div>

            {/* List of User Documents */}
            {documents?.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col justify-between p-6 rounded-card border border-slate-200 dark:border-charcoal-100 bg-white/70 dark:bg-charcoal/70 hover:border-gold-500/50 shadow-soft hover:shadow-soft-lg transition-all duration-200 group"
              >
                <div>
                  {/* Status & Date */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {doc.status === 'completed' && (
                      <Badge variant="verified" className="text-[10px] py-0.5 px-2 gap-1">
                        <FileCheck className="w-3 h-3" />
                        <span>Parsed</span>
                      </Badge>
                    )}
                    {doc.status === 'processing' && (
                      <Badge variant="needs-verification" className="text-[10px] py-0.5 px-2 animate-pulse gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Processing</span>
                      </Badge>
                    )}
                    {doc.status === 'failed' && (
                      <Badge variant="alleged" className="text-[10px] py-0.5 px-2 gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Failed</span>
                      </Badge>
                    )}

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => onSelectDocument(doc.id)}
                    className="font-heading font-bold text-base text-navy-900 dark:text-ivory group-hover:text-gold-600 dark:group-hover:text-gold-400 cursor-pointer line-clamp-2 transition-colors"
                  >
                    {doc.title}
                  </h3>

                  {/* Metadata */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-gold-500" />
                      {doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'}
                    </span>
                    <span>•</span>
                    <span>{doc.total_words} words</span>
                    <span>•</span>
                    <span>{(doc.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200/60 dark:border-charcoal-100/60">
                  <div className="flex items-center gap-1">
                    {/* Authenticated File Download */}
                    {doc.download_url && (
                      <a
                        href={doc.download_url}
                        download
                        className="p-2 text-slate-500 hover:text-navy-900 dark:hover:text-ivory rounded-lg hover:bg-slate-100 dark:hover:bg-charcoal transition-colors"
                        title="Download original file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}

                    {/* Delete Trigger */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocumentToDelete(doc);
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Permanently delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Open in Workspace */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectDocument(doc.id)}
                    className="gap-1.5 text-xs h-8"
                  >
                    <span>View Text</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (Rule 6 Data Sovereignty) */}
      {documentToDelete && (
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
              Are you sure you want to delete <strong>"{documentToDelete.title}"</strong>?
            </p>
            <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-charcoal p-3 rounded-lg space-y-1">
              <p>• The file on disk will be immediately destroyed.</p>
              <p>• All {documentToDelete.page_count} extracted page transcripts will be purged.</p>
              <p>• This action cannot be reversed.</p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDocumentToDelete(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteMutation.mutate(documentToDelete.id)}
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
