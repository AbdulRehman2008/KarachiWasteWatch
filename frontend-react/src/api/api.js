import axios from 'axios'

// Use VITE_API_URL if configured (for production deployments), fallback to '/api' for Vite dev proxy
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const adminLogin = (data) => api.post('/auth/admin-login', data)

// Reports — Admin (all reports)
export const getReports = (params) => api.get('/reports', { params })
export const getReport = (id) => api.get(`/reports/${id}`)
export const createReport = (formData) =>
  api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateStatus = (id, data) => api.patch(`/reports/${id}/status`, data)
export const assignReport = (id, data) => api.post(`/reports/${id}/assign`, data)
export const verifyCleanup = (id, formData) =>
  api.post(`/reports/${id}/verify-cleanup`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteReport = (id) => api.delete(`/reports/${id}`)

// Reports — Citizen (own reports only)
export const getMyReports = () => api.get('/reports/my')
export const getMyMapSummary = () => api.get('/reports/my/map-summary')

// AI
export const scanImage = (formData) =>
  api.post('/ai/scan', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

// Admin
export const getAnalytics = () => api.get('/admin/analytics')
export const getHotspots = () => api.get('/admin/hotspots')
export const getUsers = () => api.get('/admin/users')
export const deleteUser = (id) => api.delete(`/admin/users/${id}`)

// Notifications
export const getNotifications = () => api.get('/notifications/my')
export const markRead = (id) => api.patch(`/notifications/${id}/read`)

// RAG Assistant Chatbot
export const askAssistant = (question) => api.post('/chat/assistant', { question })

export default api
