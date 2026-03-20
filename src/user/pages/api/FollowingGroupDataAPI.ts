// src/user/pages/api/FollowingGroupDataAPI.ts

import { API_BASE as CENTRAL_API_BASE } from '../../../config/api';
const API_BASE = CENTRAL_API_BASE;
const BASE_URL = `${API_BASE}/user/remove/mentorGroup`;
const DOWNLOAD_BASE_URL = `${API_BASE}/user/following/group`;

// Interfaces
export interface FollowingGroup {
  followingGroupName: string;
  leader1Id: number;
  leader2Id: number;
  studentIds: number[];
  absentStudentIds: number[];
}

export interface Group {
  groupName: string;
  followingGroups: FollowingGroup[];
}

export interface GroupStructure {
  male: Group[];
  female: Group[];
}

export interface GroupStructureResponse {
  success: boolean;
  message: string;
  data: GroupStructure;
}

export const followingGroupAPI = {
  // Fetch group structure
  fetchGroupStructure: async (): Promise<GroupStructure> => {
    try {
      const url = `${API_BASE.replace(/\/$/, '')}/user/following/group`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Use cookies instead of token
      });

      const text = await response.text();

      // Handle specific HTTP status codes
      if (response.status === 401) {
        throw new Error('Unauthorized: Please login to fetch group structure');
      }

      if (response.status === 403) {
        throw new Error('Forbidden: You do not have permission to fetch group structure');
      }

      if (!response.ok) {
        let errorMessage = `Failed to fetch group structure: ${response.statusText}`;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Parse JSON safely
      let apiResponse: GroupStructureResponse;
      try {
        apiResponse = JSON.parse(text);
      } catch (parseErr) {
        console.error('Invalid JSON received:', text);
        throw new Error('Invalid response from server');
      }

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to load group structure');
      }

      return apiResponse.data;
    } catch (error) {
      console.error('Fetch group structure error:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch group structure');
    }
  },

  // Remove mentor group
  remove: async (groupName: string): Promise<any> => {
    try {
      const response = await fetch(`${BASE_URL}/${groupName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to remove mentor group');
      }

      return apiResponse.data;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  },

  // Download Excel
  downloadExcel: async (): Promise<void> => {
    try {
      const url = `${DOWNLOAD_BASE_URL}/download-excel`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        // Try to get error message from response if available
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch {
            // Ignore
          }
        }
        throw new Error(errorMessage);
      }

      // Check if response is actually a file
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('spreadsheet') && !contentType.includes('octet-stream')) {
        throw new Error('Invalid response type. Expected Excel file.');
      }

      const blob = await response.blob();

      // Check if blob is actually an Excel file or an error HTML
      if (blob.type === 'application/json' || blob.type.includes('html')) {
        const text = await blob.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Server returned an error');
        } catch {
          throw new Error('Server returned an invalid response');
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'following-groups.xlsx';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error('Download Excel error:', error);
      throw error; // Re-throw to be caught by handleDownload
    }
  }
};

// For backward compatibility, also export as default
export default followingGroupAPI;
