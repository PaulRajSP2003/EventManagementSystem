import type { Leader } from '../../../types';
import { API_BASE } from '../../../config/api';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

interface CreateLeaderResponse {
  leaderId: number;
}

export const leaderAPI = {
  // New method to fetch leader details by ID D:\Project\campmanagementsystem\src\user\pages\leader\LeaderDetail.tsx
  getDetail: async (leaderId: number) => {
    try {
      const response = await fetch(`${API_BASE}/leader/detail/${leaderId}`, {
        method: 'GET',
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
        throw new Error(apiResponse.message || 'Failed to fetch leader detail');
      }
      return apiResponse.data;
    } catch (error) {
      console.error('Error fetching leader detail:', error);
      throw error;
    }
  },

  updateLeader: async (leaderId: number, changes: { status: string; staying: string }) => {
    try {
      const response = await fetch(`${API_BASE}/change/leader/${leaderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(changes),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const apiResponse = await response.json();
      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to update leader');
      }
      return apiResponse.data;
    } catch (error) {
      console.error('Error updating leader:', error);
      throw error;
    }
  },

  getAll: async (): Promise<Leader[]> => {
    try {
      const response = await fetch(`${API_BASE}/leader`, {
        method: 'GET',
        credentials: 'include', // 🔥 REQUIRED for cookie auth
      });

      // Handle Unauthorized
      if (response.status === 401) {
        throw new Error('Unauthorized: Please login');
      }

      // Handle Forbidden
      if (response.status === 403) {
        throw new Error('Forbidden: No permission');
      }

      // Handle other errors
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP error ${response.status}`);
      }

      // Parse JSON
      const apiResponse: ApiResponse<Leader[]> = await response.json();

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to fetch leaders');
      }

      // Normalize data
      return (apiResponse.data || []).map(leader => ({
        ...leader,
        registered_mode:
          leader.registeredMode === 'online' ? 'online' : 'offline',
      }));

    } catch (error) {
      console.error('Error fetching leaders:', error);
      throw error;
    }
  },

  create: async (leader: Omit<Leader, 'id'>): Promise<number> => {
    try {
      const requestBody = {
        id: 0,
        name: leader.name,
        gender: leader.gender,
        place: leader.place,
        latitude: leader.latitude,
        longitude: leader.longitude,
        contactNumber: leader.contactNumber,
        whatsappNumber: leader.whatsappNumber,
        churchName: leader.churchName || '',
        staying: leader.staying,
        status: leader.status,
        isFollowing: leader.isFollowing,
        type: leader.type,
        remark: leader.remark || '',
        registeredMode: leader.registered_mode || 'offline',
      };

      const response = await fetch(`${API_BASE}/leader`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: ApiResponse<CreateLeaderResponse> = await response.json();

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to create leader');
      }

      return apiResponse.data.leaderId;
    } catch (error) {
      console.error('Error creating leader:', error);
      throw error;
    }
  },

  getById: async (leaderId: number): Promise<Leader> => {
    try {
      const response = await fetch(`${API_BASE}/leader/${leaderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: ApiResponse<Leader> = await response.json();

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to fetch leader');
      }

      // Map API response to match Leader interface
      const leader = apiResponse.data;
      return {
        ...leader,
        registered_mode: (leader.registeredMode === 'online' ? 'online' : 'offline') as 'online' | 'offline',
      };
    } catch (error) {
      console.error('Error fetching leader by ID:', error);
      throw error;
    }
  },

  update: async (leaderId: number, leader: Omit<Leader, 'id'>): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/leader/${leaderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: leaderId,
          name: leader.name,
          gender: leader.gender,
          place: leader.place,
          contactNumber: leader.contactNumber,
          whatsappNumber: leader.whatsappNumber,
          churchName: leader.churchName || '',
          staying: leader.staying,
          status: leader.status,
          isFollowing: leader.isFollowing,
          type: leader.type,
          remark: leader.remark || '',
          registeredMode: leader.registered_mode || 'offline',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: ApiResponse<any> = await response.json();

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to update leader');
      }
    } catch (error) {
      console.error('Error updating leader:', error);
      throw error;
    }
  },

  changeLeaderStatus: async (
    leaderId: number,
    status: string,
    staying: string
  ) => {
    try {
      const response = await fetch(`${API_BASE}/change/leader/${leaderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: status,
          staying: staying,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();

      // Check if the response has a success property (indicating it's wrapped)
      if (apiResponse.success !== undefined) {
        if (!apiResponse.success) {
          throw new Error(apiResponse.message || 'Failed to update leader');
        }
        return apiResponse; // Return the full wrapped response
      } else {
        // It's a direct response (the data itself)
        return {
          success: true,
          message: 'Updated successfully',
          data: apiResponse
        };
      }
    } catch (error) {
      console.error('Error updating leader:', error);
      throw error;
    }
  },

  getHistory: async (leaderId: number) => {
    try {
      const response = await fetch(`${API_BASE}/leader/history/${leaderId}`, {
        method: 'GET',
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
        throw new Error(apiResponse.message || 'Failed to fetch leader history');
      }

      return apiResponse.data;
    } catch (error) {
      console.error('Error fetching leader history:', error);
      throw error;
    }
  },


  downloadCSV: async (): Promise<void> => {
    try {
      const downloadUrl = `${API_BASE}/leader/download`;

      const headers: HeadersInit = {
        'Accept': 'text/csv',
      };

      const response = await fetch(downloadUrl, {
        method: 'GET',
        credentials: 'include',
        headers: headers
      });

      if (!response.ok) {
        let errorMessage = `Download failed: ${response.status} ${response.statusText}`;
        try {
          const text = await response.text();
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorData.title || errorMessage;
          } catch {
            errorMessage = text || errorMessage;
          }
        } catch { }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const getFormattedDateTime = () => {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hourStr = hours.toString().padStart(2, '0');
        const timeStr = `${hourStr}-${minutes}-${seconds}-${ampm}`;
        return `${dateStr}_${timeStr}`;
      };
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `leaders_export_${getFormattedDateTime()}.csv`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[*]=UTF-8''(.+)/) ||
          contentDisposition.match(/filename=(.+?)(?:;|$)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
        }
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to download CSV');
    }
  },
};
