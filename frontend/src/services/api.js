import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Create axios instance with default configuration
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor to add JWT token to all requests
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor to handle response errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

if (status === 401 || status === 403) {
  localStorage.removeItem('token');

  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}
    return Promise.reject(error);
  }
);

// ==================== Auth APIs ====================

export const authAPI = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  register: (data) =>
    apiClient.post('/auth/register', data),
  getMe: () =>
    apiClient.get('/auth/me'),
};

// ==================== User Management APIs ====================

export const userAPI = {
  getAllUsers: (params) =>
    apiClient.get('/auth/users', { params }),
  updateUser: (id, data) =>
    apiClient.put(`/auth/users/${id}`, data),
};

// ==================== Classroom APIs ====================

export const classroomAPI = {
  createClassroom: (data) =>
    apiClient.post('/classrooms', data),
  getAllClassrooms: (params) =>
    apiClient.get('/classrooms', { params }),
  getMyClassrooms: () =>
    apiClient.get('/classrooms/my'),
  getClassroomById: (id) =>
    apiClient.get(`/classrooms/${id}`),
  updateClassroom: (id, data) =>
    apiClient.put(`/classrooms/${id}`, data),
  deleteClassroom: (id) =>
    apiClient.delete(`/classrooms/${id}`),
};

// ==================== Utility APIs ====================

export const utilityAPI = {
  createUtility: (data) =>
    apiClient.post('/utilities', data),
  getAllUtilities: (params) =>
    apiClient.get('/utilities', { params }),
  getUtilityById: (id) =>
    apiClient.get(`/utilities/${id}`),
  updateUtility: (id, data) =>
    apiClient.put(`/utilities/${id}`, data),
  deleteUtility: (id) =>
    apiClient.delete(`/utilities/${id}`),
};

// ==================== Lab APIs ====================

export const labAPI = {
  createLab: (data) =>
    apiClient.post('/labs', data),
  getAllLabs: (params) =>
    apiClient.get('/labs', { params }),
  getLabById: (id) =>
    apiClient.get(`/labs/${id}`),
  updateLab: (id, data) =>
    apiClient.put(`/labs/${id}`, data),
  deleteLab: (id) =>
    apiClient.delete(`/labs/${id}`),
};

// ==================== Issue APIs ====================

export const issueAPI = {
  createIssue: (data) =>
    apiClient.post('/issues', data),
  getAllIssues: (params) =>
    apiClient.get('/issues', { params }),
  getMyIssues: (params) =>
    apiClient.get('/issues/my', { params }),
  getIssueById: (id) =>
    apiClient.get(`/issues/${id}`),
  updateIssueStatus: (id, data) =>
    apiClient.put(`/issues/${id}/status`, data),
  addComment: (id, data) =>
    apiClient.post(`/issues/${id}/comments`, data),
};

// ==================== Project APIs ====================

export const projectAPI = {
  createProject: (data) =>
    apiClient.post('/projects', data),
  getMyProjects: () =>
    apiClient.get('/projects/my'),
  getAssignedProjects: () =>
    apiClient.get('/projects/assigned'),
  getProjectsByClassroom: (classroomId) =>
    apiClient.get(`/projects/class/${classroomId}`),
  getProjectById: (id) =>
    apiClient.get(`/projects/${id}`),
  updateProject: (id, data) =>
    apiClient.put(`/projects/${id}`, data),
  addTeamMember: (id, data) =>
    apiClient.post(`/projects/${id}/team-members`, data),
  deleteProject: (id) =>
    apiClient.delete(`/projects/${id}`),
};

// ==================== Timetable APIs ====================

export const timetableAPI = {
  uploadTimetable: (formData) =>
    apiClient.post('/timetable/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAllTimetables: () =>
    apiClient.get('/timetable'),
  getTimetableByClassroom: (classroomId) =>
    apiClient.get(`/timetable/${classroomId}`),
  deleteTimetable: (id) =>
    apiClient.delete(`/timetable/${id}`),
};

// ==================== Stats APIs ====================

export const statsAPI = {
  getAdminStats: () =>
    apiClient.get('/stats/admin'),
  getFacultyStats: () =>
    apiClient.get('/stats/faculty'),
  getStudentStats: () =>
    apiClient.get('/stats/student'),
};

export default apiClient;
