import type { Medical, MedicalTreatment } from '../../../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const medicalAPI = {
  saveMedicalReport: async (report: Medical): Promise<{ reportId: number }> => {
    try {
      const response = await fetch('https://localhost:7135/api/medical/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(report),
      });

      const text = await response.text();

      if (!response.ok) {
        let errorMessage = 'Failed to save medical report';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let apiResponse: { success: boolean; message: string; reportId: number };
      try {
        apiResponse = JSON.parse(text);
        
      } catch (parseErr) {
        console.error('Invalid JSON received:', text);
        throw new Error('Invalid response from server');
      }

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to save medical report');
      }

      
      return { reportId: apiResponse.reportId };
    } catch (error) {
      console.error('Save medical report error:', error);
      throw error instanceof Error ? error : new Error('Failed to save medical report');
    }
  },

  listMedicalReports: async (): Promise<Medical[]> => {
    try {
      const response = await fetch('https://localhost:7135/api/medical/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const text = await response.text();

      if (!response.ok) {
        let errorMessage = 'Failed to fetch medical reports';
        try {
          const errorData = JSON.parse(text) as ApiResponse<any>;
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let apiResponse: ApiResponse<Medical[]>;
      try {
        apiResponse = JSON.parse(text);
      } catch (parseErr) {
        console.error('Invalid JSON received:', text);
        throw new Error('Invalid response from server');
      }

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to fetch medical reports');
      }

      return apiResponse.data;
    } catch (error) {
      console.error('List medical reports error:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch medical reports');
    }
  },

  getMedicalReportById: async (reportId: number): Promise<Medical> => {
    try {
      const response = await fetch(`https://localhost:7135/api/medical/${reportId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const text = await response.text();

      if (!response.ok) {
        let errorMessage = 'Failed to fetch medical report';
        try {
          const errorData = JSON.parse(text) as ApiResponse<any>;
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let apiResponse: ApiResponse<Medical>;
      try {
        apiResponse = JSON.parse(text);
      } catch (parseErr) {
        console.error('Invalid JSON received:', text);
        throw new Error('Invalid response from server');
      }

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to fetch medical report');
      }

      return apiResponse.data;
    } catch (error) {
      console.error('Get medical report error:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch medical report');
    }
  },
// Treatment API functions (corrected URLs)
saveMedicalTreatment: async (
  treatment: Omit<MedicalTreatment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
): Promise<void> => {
  try {
    const response = await fetch('https://localhost:7135/api/medical/treatment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(treatment),
    });

    const text = await response.text();

    if (!response.ok) {
      let errorMessage = 'Failed to save medical treatment';
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const apiResponse: { success: boolean; message: string } = JSON.parse(text);
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to save medical treatment');
    }
  } catch (error) {
    console.error('Save medical treatment error:', error);
    throw error instanceof Error ? error : new Error('Failed to save medical treatment');
  }
},

updateMedicalTreatment: async (treatment: MedicalTreatment): Promise<void> => {
  try {
    const { id, treaterName, description } = treatment;

    const response = await fetch(`https://localhost:7135/api/medical/treatment/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ treaterName, description }),
    });

    const text = await response.text();

    if (!response.ok) {
      let errorMessage = 'Failed to update medical treatment';
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const apiResponse: { success: boolean; message: string } = JSON.parse(text);
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to update medical treatment');
    }
  } catch (error) {
    console.error('Update medical treatment error:', error);
    throw error instanceof Error ? error : new Error('Failed to update medical treatment');
  }
},

listTreatmentsByReportId: async (reportId: number): Promise<MedicalTreatment[]> => {
    try {
      const response = await fetch(`https://localhost:7135/api/medical/treatment/list/${reportId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

    const text = await response.text();

    if (!response.ok) {
      let errorMessage = 'Failed to fetch medical treatments';
      try {
        const errorData = JSON.parse(text) as ApiResponse<any>;
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const apiResponse: ApiResponse<MedicalTreatment[]> = JSON.parse(text);
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to fetch medical treatments');
    }

    return apiResponse.data;
  } catch (error) {
    console.error('List medical treatments error:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch medical treatments');
  }
}
};
