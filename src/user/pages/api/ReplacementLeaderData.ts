// src/user/api/ReplacementLeaderData.ts
import type { Leader } from '../../../types';

const BASE_URL = 'https://localhost:7135/api/leader/replacement';

export const replacementLeaderAPI = {
  getById: async (
    leaderId: number
  ): Promise<Leader> => {
    try {
      const response = await fetch(`${BASE_URL}/${leaderId}`, {
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
        throw new Error(apiResponse.message || 'Failed to fetch replacement leader');
      }
      
      return apiResponse.data;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  },
};

export const updateReplacementLeader = async (
  leaderId: number,
  changes: Record<string, any>
): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/${leaderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ changes }),
    });
    
    const apiResponse = await response.json();
    
    if (!response.ok || !apiResponse.success) {
      throw new Error(apiResponse.message || `Failed to update leader replacement (status: ${response.status})`);
    }
    
    // Return the complete data structure
    return apiResponse.data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};