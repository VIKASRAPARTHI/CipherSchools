import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api`;

// Helper to get auth token
const getToken = () => localStorage.getItem('token');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

/**
 * S3 File Operations
 */
export const s3Service = {
  // Upload file to S3
  uploadFile: async (projectId, fileName, filePath, content) => {
    try {
      const response = await api.post('/s3/upload', {
        projectId,
        fileName,
        filePath,
        content
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Upload failed');
    }
  },

  // Download file from S3
  downloadFile: async (fileId) => {
    try {
      const response = await api.get(`/s3/download/${fileId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Download failed');
    }
  },

  // Delete file from S3
  deleteFile: async (fileId) => {
    try {
      const response = await api.delete(`/s3/delete/${fileId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Delete failed');
    }
  },

  // Get signed URL for file
  getFileUrl: async (fileId) => {
    try {
      const response = await api.get(`/s3/url/${fileId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get URL');
    }
  }
};

/**
 * Project Export/Import Operations
 */
export const exportService = {
  // Export project as ZIP
  exportProjectAsZip: async (projectId) => {
    try {
      const response = await api.get(`/export/${projectId}/export`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `project-${projectId}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { message: 'Project exported successfully' };
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Export failed');
    }
  },

  // Import project from ZIP
  importProjectFromZip: async (projectId, formData) => {
    try {
      const response = await api.post(`/export/${projectId}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Import failed');
    }
  },

  // Get project statistics
  getProjectStats: async (projectId) => {
    try {
      const response = await api.get(`/export/${projectId}/stats`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get stats');
    }
  }
};

export default api;
