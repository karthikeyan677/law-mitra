export interface DocumentPage {
  id: string;
  page_number: number;
  extracted_text: string;
  ocr_confidence: number | null;
  word_count: number;
  created_at: string;
}

export interface DocumentDetail {
  id: string;
  title: string;
  file_url: string | null;
  file_type: string;
  file_size: number;
  page_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string;
  detected_language: string;
  created_at: string;
  updated_at: string;
  pages: DocumentPage[];
}

export interface DocumentListItem {
  id: string;
  title: string;
  file_type: string;
  file_size: number;
  page_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  detected_language: string;
  created_at: string;
  updated_at: string;
  total_words: number;
}

export interface HealthResponse {
  status: string;
  service: string;
}

export async function checkApiHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/health/');
  if (!res.ok) {
    throw new Error(`Health check returned status ${res.status}`);
  }
  return res.json();
}

export async function uploadDocument(file: File, title?: string): Promise<DocumentDetail> {
  const formData = new FormData();
  formData.append('file', file);
  if (title && title.trim()) {
    formData.append('title', title.trim());
  }

  const res = await fetch('/api/documents/upload/', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      errorData.file?.[0] ||
      errorData.title?.[0] ||
      errorData.detail ||
      `Upload failed with HTTP ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}

export async function fetchDocuments(): Promise<DocumentListItem[]> {
  const res = await fetch('/api/documents/');
  if (!res.ok) {
    throw new Error(`Failed to load documents: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchDocument(id: string): Promise<DocumentDetail> {
  const res = await fetch(`/api/documents/${id}/`);
  if (!res.ok) {
    throw new Error(`Failed to fetch document: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`/api/documents/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete document: ${res.statusText}`);
  }
}

export async function reprocessDocument(id: string): Promise<void> {
  const res = await fetch(`/api/documents/${id}/reprocess/`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Failed to trigger reprocessing: ${res.statusText}`);
  }
}
