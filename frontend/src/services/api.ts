import {
  User,
  AuthResponse,
  DocumentItem,
  DocumentDetail,
  ChatSession,
  ChatSessionDetail,
  AskResponse,
  StudyItem,
  AnalyticsSummary,
  MultiDocCompareResult
} from '../types';

const rawApiBase = import.meta.env.VITE_API_URL ?? '';
const API_BASE = rawApiBase ? `${rawApiBase.replace(/\/$/, '')}/api` : '/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('docmind_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMessage = `HTTP error ${res.status}`;
      try {
        const errJson = await res.json();
        errorMessage = errJson.detail || errorMessage;
      } catch (e) {
        // ignore
      }
      throw new Error(errorMessage);
    }

    return res.json() as Promise<T>;
  }

  // Auth
  async register(data: { email: string; password: string; full_name?: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async updateSettings(data: any): Promise<User> {
    return this.request<User>('/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Documents
  async getDocuments(params?: { q?: string; status?: string }): Promise<DocumentItem[]> {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.status) query.append('status_filter', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<DocumentItem[]>(`/documents${qs}`);
  }

  async getDocumentDetail(id: string): Promise<DocumentDetail> {
    return this.request<DocumentDetail>(`/documents/${id}`);
  }

  async uploadDocuments(files: File[]): Promise<DocumentItem[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return this.request<DocumentItem[]>('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async reprocessDocument(id: string): Promise<DocumentItem> {
    return this.request<DocumentItem>(`/documents/${id}/reprocess`, {
      method: 'POST',
    });
  }

  async deleteDocument(id: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  getDocumentFileUrl(id: string): string {
    return `${API_BASE}/documents/${id}/file`;
  }

  // Research Chat
  async askQuestion(data: {
    question: string;
    session_id?: string;
    document_ids?: string[];
  }): Promise<AskResponse> {
    return this.request<AskResponse>('/chat/ask', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getChatSessions(): Promise<ChatSession[]> {
    return this.request<ChatSession[]>('/chat/sessions');
  }

  async createChatSession(data: { title?: string; document_ids?: string[] }): Promise<ChatSession> {
    return this.request<ChatSession>('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getChatSessionDetail(id: string): Promise<ChatSessionDetail> {
    return this.request<ChatSessionDetail>(`/chat/sessions/${id}`);
  }

  async updateChatSession(id: string, data: { title?: string; document_ids?: string[] }): Promise<ChatSession> {
    return this.request<ChatSession>(`/chat/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteChatSession(id: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/chat/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  // Multi-Document Intelligence
  async compareDocuments(data: {
    document_ids: string[];
    focus_topic?: string;
  }): Promise<MultiDocCompareResult> {
    return this.request<MultiDocCompareResult>('/documents/compare', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async summarizeMultiDocs(data: {
    document_ids: string[];
    max_sections?: number;
  }): Promise<{ documents_analyzed: string[]; executive_summary: string; sections: any[] }> {
    return this.request('/documents/summarize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Study Tools
  async generateStudyContent(data: {
    document_ids: string[];
    item_type: string;
    topic_focus?: string;
    count?: number;
  }): Promise<StudyItem> {
    return this.request<StudyItem>('/study/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStudyItems(): Promise<StudyItem[]> {
    return this.request<StudyItem[]>('/study/items');
  }

  async deleteStudyItem(id: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/study/items/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics & Admin
  async getAnalytics(): Promise<AnalyticsSummary> {
    return this.request<AnalyticsSummary>('/analytics');
  }

  async getAdminStats(): Promise<any> {
    return this.request<any>('/admin/stats');
  }

  async getAdminUsers(): Promise<any[]> {
    return this.request<any[]>('/admin/users');
  }
}

export const api = new ApiService();
