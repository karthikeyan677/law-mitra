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
  download_url: string;
  file_type: string;
  file_size: number;
  page_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string;
  detected_language: string;
  created_at: string;
  updated_at: string;
  pages: DocumentPage[];
  section_count?: number;
}

export interface DocumentListItem {
  id: string;
  title: string;
  download_url: string;
  file_type: string;
  file_size: number;
  page_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  detected_language: string;
  created_at: string;
  updated_at: string;
  total_words: number;
  section_count?: number;
}

export interface UserProfile {
  id: number;
  email: string;
  preferred_language: 'en' | 'kn' | 'hi' | 'te' | 'ta' | 'ml' | 'mr' | 'bn';
  text_size: 'normal' | 'large' | 'xlarge';
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  access: string;
  refresh?: string;
  user: UserProfile;
}

export interface HealthResponse {
  status: string;
  service: string;
}

// In-memory access token storage (Security Rule 3)
let inMemoryAccessToken: string | null = null;
let onAuthFailureCallback: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setOnAuthFailure(callback: () => void) {
  onAuthFailureCallback = callback;
}

// Helper to make authenticated requests with auto-refresh on 401
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});

  if (inMemoryAccessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
  }

  // Include cookies by default (for httpOnly SameSite refresh token)
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  let res = await fetch(url, fetchOptions);

  // If 401 received and not currently calling auth endpoints, try silent refresh once
  if (res.status === 401 && !url.includes('/api/auth/')) {
    try {
      const refreshed = await refreshAuthToken();
      if (refreshed && inMemoryAccessToken) {
        // Retry original request with new access token
        headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
        res = await fetch(url, { ...fetchOptions, headers });
      } else {
        if (onAuthFailureCallback) onAuthFailureCallback();
      }
    } catch {
      if (onAuthFailureCallback) onAuthFailureCallback();
    }
  }

  return res;
}

/* ================= Authentication API ================= */

export async function registerUser(data: {
  email: string;
  password: string;
  preferred_language?: string;
  text_size?: string;
}): Promise<AuthResponse> {
  const res = await fetch('/api/auth/register/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      errorData.email?.[0] ||
      errorData.password?.[0] ||
      errorData.detail ||
      `Registration failed (HTTP ${res.status})`;
    throw new Error(message);
  }

  const result: AuthResponse = await res.json();
  setAccessToken(result.access);
  return result;
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('Too many login attempts. Please wait a moment before trying again.');
    }
    const errorData = await res.json().catch(() => ({}));
    const message =
      errorData.non_field_errors?.[0] ||
      errorData.email?.[0] ||
      errorData.password?.[0] ||
      errorData.detail ||
      'Invalid email or password.';
    throw new Error(message);
  }

  const result: AuthResponse = await res.json();
  setAccessToken(result.access);
  return result;
}

export async function refreshAuthToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      setAccessToken(null);
      return null;
    }

    const data = await res.json();
    if (data.access) {
      setAccessToken(data.access);
      return data.access;
    }
    return null;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch('/api/auth/logout/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } finally {
    setAccessToken(null);
  }
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const res = await apiFetch('/api/auth/me/');
  if (!res.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return res.json();
}

export async function updateUserProfile(data: Partial<Pick<UserProfile, 'preferred_language' | 'text_size'>>): Promise<UserProfile> {
  const res = await apiFetch('/api/auth/me/', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update preferences');
  }

  return res.json();
}

export async function changeUserPassword(data: { current_password: string; new_password: string }): Promise<void> {
  const res = await apiFetch('/api/auth/change-password/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      errorData.current_password?.[0] ||
      errorData.new_password?.[0] ||
      errorData.detail ||
      'Failed to change password.';
    throw new Error(message);
  }
}

export async function deleteUserAccount(password: string): Promise<void> {
  const res = await apiFetch('/api/auth/me/', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      errorData.password?.[0] ||
      errorData.detail ||
      'Failed to delete account. Please verify your password.';
    throw new Error(message);
  }

  setAccessToken(null);
}

/* ================= Document API ================= */

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

  const res = await apiFetch('/api/documents/upload/', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('Upload limit reached. Please wait before uploading more documents.');
    }
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
  const res = await apiFetch('/api/documents/');
  if (!res.ok) {
    throw new Error(`Failed to load documents: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchDocument(id: string): Promise<DocumentDetail> {
  const res = await apiFetch(`/api/documents/${id}/`);
  if (!res.ok) {
    throw new Error(`Failed to fetch document: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await apiFetch(`/api/documents/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete document: ${res.statusText}`);
  }
}

export async function reprocessDocument(id: string): Promise<void> {
  const res = await apiFetch(`/api/documents/${id}/reprocess/`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Failed to trigger reprocessing: ${res.statusText}`);
  }
}

/* ================= Section Detection API ================= */

export interface DetectedSection {
  id: string;
  page_number: number;
  act_raw: string;
  act_key: string;
  section_number: string;
  sub_clause: string;
  matched_text: string;
  start_char: number;
  end_char: number;
  detection_method: 'rule' | 'manual';
  review_status: 'auto' | 'confirmed' | 'rejected';
  created_at: string;
  updated_at?: string;
}

export interface SectionGroup {
  act_key: string;
  count: number;
  sections: DetectedSection[];
}

export interface GroupedSectionsResponse {
  total_count: number;
  groups: SectionGroup[];
}

export async function fetchDocumentSections(docId: string): Promise<GroupedSectionsResponse> {
  const res = await apiFetch(`/api/documents/${docId}/sections/`);
  if (!res.ok) {
    throw new Error(`Failed to load detected sections: ${res.statusText}`);
  }
  return res.json();
}

export async function detectDocumentSections(docId: string): Promise<DetectedSection[]> {
  const res = await apiFetch(`/api/documents/${docId}/detect-sections/`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Failed to run section detection: ${res.statusText}`);
  }
  return res.json();
}

export async function updateDocumentSection(
  docId: string,
  sectionId: string,
  data: { review_status?: string; act_key?: string; section_number?: string }
): Promise<DetectedSection> {
  const res = await apiFetch(`/api/documents/${docId}/sections/${sectionId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`Failed to update section: ${res.statusText}`);
  }
  return res.json();
}

export async function addManualSection(
  docId: string,
  data: {
    page_number: number;
    start_char: number;
    end_char: number;
    section_number: string;
    act_key?: string;
    sub_clause?: string;
  }
): Promise<DetectedSection> {
  const res = await apiFetch(`/api/documents/${docId}/sections/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to add manual section`);
  }
  return res.json();
}

export async function deleteManualSection(docId: string, sectionId: string): Promise<void> {
  const res = await apiFetch(`/api/documents/${docId}/sections/${sectionId}/`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to delete manual section`);
  }
}
