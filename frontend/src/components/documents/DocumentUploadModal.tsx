import React, { useState, useRef, DragEvent } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { uploadDocument, DocumentDetail } from '@/lib/api';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (document: DocumentDetail) => void;
}

export function DocumentUploadModal({ isOpen, onClose, onUploadSuccess }: DocumentUploadModalProps) {
  const { addToast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setUploadError(null);
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.tiff', '.bmp', '.txt'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(ext)) {
      setUploadError(`Unsupported file format. Please upload a PDF or image (${validExtensions.join(', ')})`);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File size exceeds the 25MB limit.');
      return;
    }

    setSelectedFile(file);
    if (!title) {
      const defaultTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setTitle(defaultTitle.replace(/[-_]/g, ' '));
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const doc = await uploadDocument(selectedFile, title);
      addToast({
        title: 'Document Uploaded Successfully',
        description: `"${doc.title}" is being processed by the OCR engine.`,
        variant: 'success',
      });
      onUploadSuccess(doc);
      onClose();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document');
      addToast({
        title: 'Upload Failed',
        description: err.message || 'Network error occurred during upload.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-ivory dark:bg-charcoal-200 rounded-card shadow-2xl border border-gold-500/30 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold-500/20 bg-navy-900/10 dark:bg-navy-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gold-500/10 text-gold-500">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg text-navy-900 dark:text-ivory">
                Upload Legal Document
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PDF, notices, petitions, court orders, or scanned images
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 text-center ${
              dragActive
                ? 'border-gold-500 bg-gold-500/10'
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-300 dark:border-charcoal-100 hover:border-gold-500/60 bg-white/50 dark:bg-charcoal/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff,.bmp,.txt"
              onChange={handleFileChange}
            />

            {selectedFile ? (
              <div className="space-y-2">
                <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="font-medium text-sm text-navy-900 dark:text-ivory">
                  {selectedFile.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click or drop to replace
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="inline-flex p-3 rounded-full bg-gold-500/10 text-gold-500">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="font-medium text-sm text-navy-900 dark:text-ivory">
                  Drag and drop your document here, or <span className="text-gold-600 dark:text-gold-400 underline">browse</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Supports PDF, PNG, JPG, JPEG (Max 25MB)
                </p>
              </div>
            )}
          </div>

          {/* Optional Title Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Document Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Criminal Petition 4022/2024 or Bail Notice"
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-charcoal border border-slate-300 dark:border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Error Message */}
          {uploadError && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800/50 text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Privacy & Safety Note */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-charcoal/80 text-[11px] text-slate-600 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-verified shrink-0 mt-0.5" />
            <span>
              <strong>Rule 6 Data Sovereignty:</strong> Your document is securely stored in your private vault. You have complete control and can permanently delete it and all parsed records at any time.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedFile || isUploading}
              className="min-w-[120px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload & Parse'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
