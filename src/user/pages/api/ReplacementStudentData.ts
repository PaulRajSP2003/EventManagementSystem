// src/user/api/ReplacementStudentData.ts
import type { Student } from '../../../types';

import { API_BASE } from '../../../config/api';
const REPLACEMENT_URL = `${API_BASE}/user/student/replacement`;

export const replacementStudentAPI = {
  update: async (
    studentId: number,
    changes: { mentor_group?: string | null; room_id?: string | null }
  ): Promise<any> => {
    try {
      const response = await fetch(`${REPLACEMENT_URL}/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ changes }),
      });

      // Log response for debugging

      const text = await response.text();


      // Handle specific HTTP status codes
      if (response.status === 401) {
        throw new Error('Unauthorized: Please login to update replacement student');
      }

      if (response.status === 403) {
        throw new Error('Forbidden: You do not have permission to update replacement student');
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Parse JSON safely
      let apiResponse;
      try {
        apiResponse = JSON.parse(text);
      } catch (parseErr) {
        console.error('Invalid JSON received:', text);
        throw new Error('Invalid response from server');
      }

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to update replacement student');
      }

      return apiResponse.data;
    } catch (error) {
      console.error('API call error:', error);
      throw error instanceof Error ? error : new Error('Failed to update replacement student');
    }
  },

  getById: async (
    studentId: number
  ): Promise<Student> => {
    try {
      const response = await fetch(`${REPLACEMENT_URL}/${studentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // ✅ Use cookies instead of token
      });

      // Log response for debugging

      const text = await response.text();


      // Handle specific HTTP status codes
      if (response.status === 401) {
        throw new Error('Unauthorized: Please login to fetch replacement student');
      }

      if (response.status === 403) {
        throw new Error('Forbidden: You do not have permission to fetch replacement student');
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Parse JSON safely
      let apiResponse;
      try {
        apiResponse = JSON.parse(text);
      } catch (parseErr) {
        console.error('Invalid JSON received:', text);
        throw new Error('Invalid response from server');
      }

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to fetch replacement student');
      }

      return apiResponse.data;
    } catch (error) {
      console.error('API call error:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch replacement student');
    }
  },
};
