const API_BASE_URL = 'http://127.0.0.1:8000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('gyansetu_token');
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('gyansetu_token');
    localStorage.removeItem('gyansetu_user');
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && window.location.pathname !== '/') {
      window.location.href = '/login';
    }
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = data?.detail || response.statusText || 'An unexpected error occurred';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),

  // Users & Onboarding
  updateProfile: (profileData) => request('/users/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
  getSubjects: () => request('/users/subjects'),

  // AI Tutor
  getTutorSessions: () => request('/tutor/sessions'),
  createTutorSession: (data) => request('/tutor/sessions', { method: 'POST', body: JSON.stringify(data) }),
  getTutorSessionDetail: (id) => request(`/tutor/sessions/${id}`),
  deleteTutorSession: (id) => request(`/tutor/sessions/${id}`, { method: 'DELETE' }),
  sendTutorMessage: (sessionId, data) => request(`/tutor/sessions/${sessionId}/messages`, { method: 'POST', body: JSON.stringify(data) }),
  sendTutorImage: (sessionId, formData) => request(`/tutor/sessions/${sessionId}/image`, { method: 'POST', body: formData }),

  // Doubts Community
  listDoubts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.subject_id) query.append('subject_id', params.subject_id);
    if (params.status_filter) query.append('status_filter', params.status_filter);
    if (params.skip) query.append('skip', params.skip);
    if (params.limit) query.append('limit', params.limit);
    return request(`/doubts?${query.toString()}`);
  },
  getDoubtDetail: (id) => request(`/doubts/${id}`),
  createDoubt: (data) => request('/doubts', { method: 'POST', body: JSON.stringify(data) }),
  updateDoubt: (id, data) => request(`/doubts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDoubt: (id) => request(`/doubts/${id}`, { method: 'DELETE' }),
  aiCategorize: (data) => request('/doubts/categorize', { method: 'POST', body: JSON.stringify(data) }),
  summarizeDiscussion: (doubtId) => request(`/doubts/${doubtId}/summarize`, { method: 'POST' }),

  // Answers & Community Actions
  postAnswer: (doubtId, data) => request(`/doubts/${doubtId}/answers`, { method: 'POST', body: JSON.stringify(data) }),
  askAIOnDoubt: (doubtId) => request(`/doubts/${doubtId}/ask-ai`, { method: 'POST' }),
  toggleUpvote: (answerId) => request(`/answers/${answerId}/upvote`, { method: 'POST' }),
  acceptAnswer: (answerId) => request(`/answers/${answerId}/accept`, { method: 'POST' }),
  deleteAnswer: (answerId) => request(`/answers/${answerId}`, { method: 'DELETE' }),

  // Quizzes
  generateQuiz: (data) => request('/quizzes/generate', { method: 'POST', body: JSON.stringify(data) }),
  getUserQuizzes: () => request('/quizzes'),
  getQuizDetail: (id) => request(`/quizzes/${id}`),
  submitQuiz: (id, data) => request(`/quizzes/${id}/submit`, { method: 'POST', body: JSON.stringify(data) }),

  // Notes & RAG
  getDocuments: () => request('/notes'),
  uploadDocument: (formData) => request('/notes/upload', { method: 'POST', body: formData }),
  deleteDocument: (id) => request(`/notes/${id}`, { method: 'DELETE' }),
  queryNotes: (data) => request('/notes/query', { method: 'POST', body: JSON.stringify(data) }),

  // Learning & Metrics
  getLearningDashboard: () => request('/learning/dashboard'),
  markRecommendationRead: (id) => request(`/learning/recommendations/${id}/read`, { method: 'POST' }),

  // Admin & Reports
  getAdminMetrics: () => request('/admin/metrics'),
  getAdminUsers: () => request('/admin/users'),
  updateUserRole: (userId, role) => request(`/admin/users/${userId}/role?new_role=${role}`, { method: 'PUT' }),
  getReports: () => request('/admin/reports'),
  submitReport: (data) => request('/admin/reports', { method: 'POST', body: JSON.stringify(data) }),
  resolveReport: (reportId, action) => request(`/admin/reports/${reportId}/resolve?action=${action}`, { method: 'POST' }),
};
