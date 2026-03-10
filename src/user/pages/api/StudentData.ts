import type { Student } from '../../../types';

interface ApiStudent {
  id: number;
  name: string;
  age: number;
  gender: 'male' | 'female';
  place: string;
  parentName: string;
  contactNumber: string;
  whatsappNumber: string;
  churchName: string;
  medication: string;
  staying: string;
  status: 'present' | 'registered' | 'absent';
  remark: string;
  registered_Mode: 'online' | 'offline';
  age_Group: string;
}

interface ApiStudentDetail {
  id: number;
  email?: string | null;
  name: string;
  age: number;
  gender: 'male' | 'female';
  place: string;
  parentName: string;
  contactNumber: string;
  whatsappNumber: string;
  churchName?: string;
  medication?: string;
  medicationIds?: number[];
  status: 'present' | 'registered' | 'absent';
  remark?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  subGroups?: string;
  registered_mode?: string;
  age_group?: string;
  mainGroup?: string | null;
  followed_group?: string;
  following_leader1_id?: number | null;
  following_leader1_name?: string;
  following_leader2_id?: number | null;
  following_leader2_name?: string;
  sub_group?: string;
  sub_leader1_id?: number | null;
  sub_leader1_name?: string;
  sub_leader2_id?: number | null;
  sub_leader2_name?: string;
  staying?: string;
  room_teacher?: string;
  room_number?: string;
  room_id?: string;
  parental_detail?: string;
  parental_age?: number;
  staying_leader?: number | null;
  comments?: string;
  tagColor?: string;
}
interface CreateStudentPayload {
  name: string;
  age: number;
  gender: string;
  place: string;
  latitude?: number;
  longitude?: number;
  parentName: string;
  contactNumber: string;
  whatsappNumber: string;
  churchName: string;
  medication: string;
  staying: string;
  status: string;
  remark: string;
  registered_Mode: string;
  age_Group: string;
}
interface CreateApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface GetApiResponse {
  success: boolean;
  message: string;
  data: ApiStudent[];
}

interface GetSingleStudentResponse {
  success: boolean;
  message: string;
  data: ApiStudent;
}

interface GetStudentDetailResponse {
  success: boolean;
  message: string;
  data: ApiStudentDetail;
}

interface UpdateStudentPayload {
  id: number;
  name: string;
  age: number;
  gender: string;
  place: string;
  parentName: string;
  contactNumber: string;
  whatsappNumber: string;
  churchName: string;
  medication: string;
  staying: string;
  status: string;
  remark: string;
  registered_Mode: string;
  age_Group: string;
}

// Helper to normalize registered mode values from the API
function normalizeRegisteredMode(raw: any): 'online' | 'offline' | undefined {
  if (raw === null || raw === undefined) return undefined;
  const s = String(raw).trim().toLowerCase();
  if (s === 'online') return 'online';
  if (s === 'offline') return 'offline';
  return undefined;
}

export const studentAPI = {
  getStudents: async (): Promise<Student[]> => {
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
      const STUDENTS_API_URL = `${API_BASE.replace(/\/$/, '')}/user/students`;

      const response = await fetch(STUDENTS_API_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const text = await response.text();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        if (response.status === 403) {
          throw new Error('Forbidden'); 
        }
        // Or a generic error
        throw new Error(`HTTP error ${response.status}`);
      }
      // Handle other non-OK responses
      if (!response.ok) {
        let errorMessage = 'Failed to fetch students';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Parse JSON
      let apiResponse: GetApiResponse;
      try {
        apiResponse = JSON.parse(text);
      } catch {
        throw new Error('Invalid response from server');
      }

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to fetch students');
      }

      // Map API response to Student type
      return apiResponse.data.map((apiStudent: ApiStudent) => ({
        id: apiStudent.id,
        name: apiStudent.name,
        age: apiStudent.age,
        gender: apiStudent.gender,
        place: apiStudent.place,
        parentName: apiStudent.parentName,
        contactNumber: apiStudent.contactNumber,
        whatsappNumber: apiStudent.whatsappNumber,
        churchName: apiStudent.churchName,
        medication: apiStudent.medication,
        staying: apiStudent.staying as 'yes' | 'no',
        status: apiStudent.status,
        remark: apiStudent.remark,
        registered_mode: normalizeRegisteredMode(
          (apiStudent as any).registered_Mode ?? (apiStudent as any).registered_mode
        ),
        age_group: apiStudent.age_Group,
      }));
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to fetch students');
    }
  },

  createStudent: async (studentData: Partial<Student>): Promise<any> => {
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
      const CREATE_STUDENT_URL = `${API_BASE.replace(/\/$/, '')}/user/student`;

      const payload: CreateStudentPayload = {
        name: studentData.name || '',
        age: studentData.age || 0,
        gender: studentData.gender || 'male',
        place: studentData.place || '',
        latitude: studentData.latitude,
        longitude: studentData.longitude,
        parentName: studentData.parentName || '',
        contactNumber: studentData.contactNumber || '',
        whatsappNumber: studentData.whatsappNumber || '',
        churchName: studentData.churchName || '',
        medication: studentData.medication || 'no',
        staying: studentData.staying || 'no',
        status: studentData.status || 'registered',
        remark: studentData.remark || '',
        registered_Mode: studentData.registered_mode || 'offline',
        age_Group: studentData.age_group || '',
      };

      const response = await fetch(CREATE_STUDENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      

      if (response.status === 401) {
        throw new Error('Unauthorized: Please login to create a student');
      }

      if (response.status === 403) {
        throw new Error('Forbidden: You do not have permission to create students');
      }

      if (!response.ok) {
        let errorMessage = 'Failed to create student';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let apiResponse: CreateApiResponse;
      try {
        apiResponse = JSON.parse(text);
      } catch (parseErr) {
        console.error('Invalid JSON received:', text);
        throw new Error('Invalid response from server');
      }

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to create student');
      }

      // Return both data and message to let callers handle different API shapes
      return { data: apiResponse.data, message: apiResponse.message, raw: apiResponse };
    } catch (error) {
      console.error('Create student error:', error);
      throw error instanceof Error ? error : new Error('Failed to create student');
    }
  },

  getStudent: async (studentId: number): Promise<Student> => {
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
      const STUDENT_API_URL = `${API_BASE.replace(/\/$/, '')}/user/student/${studentId}`;

      const response = await fetch(STUDENT_API_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: This sends cookies with the request
      });

      const text = await response.text();

      // Handle 401 Unauthorized
      if (response.status === 401) {
        throw new Error('Unauthorized: Please login to access student data');
      }

      // Handle 403 Forbidden
      if (response.status === 403) {
        throw new Error('Forbidden: You do not have permission to access this student');
      }

      // Handle other non-OK responses
      if (!response.ok) {
        let errorMessage = 'Failed to fetch student';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Parse JSON
      let apiResponse: GetSingleStudentResponse;
      try {
        apiResponse = JSON.parse(text);
      } catch {
        throw new Error('Invalid response from server');
      }

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to fetch student');
      }

      // Map API response to Student type
      const student: Student = {
        id: apiResponse.data.id,
        name: apiResponse.data.name,
        age: apiResponse.data.age,
        gender: apiResponse.data.gender,
        place: apiResponse.data.place,
        parentName: apiResponse.data.parentName,
        contactNumber: apiResponse.data.contactNumber,
        whatsappNumber: apiResponse.data.whatsappNumber,
        churchName: apiResponse.data.churchName,
        medication: apiResponse.data.medication,
        staying: apiResponse.data.staying as 'yes' | 'no',
        status: apiResponse.data.status,
        remark: apiResponse.data.remark,
        registered_mode: normalizeRegisteredMode(
          (apiResponse.data as any).registered_Mode ?? (apiResponse.data as any).registered_mode
        ),
        age_group: apiResponse.data.age_Group,
      };

      return student;
    } catch (error) {
      console.error('Fetch student error:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch student');
    }
  },

  getStudentDetail: async (studentId: number): Promise<Student> => {
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
      const STUDENT_DETAIL_URL = `${API_BASE.replace(/\/$/, '')}/user/student/detail/${studentId}`;

      const response = await fetch(STUDENT_DETAIL_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // ✅ send cookies automatically
      });

      // Log response for debugging
      
      const text = await response.text();
      

      if (response.status === 401) {
        throw new Error('Unauthorized: Please login to access student details');
      }

      if (!response.ok) {
        let errorMessage = 'Failed to fetch student details';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Parse JSON safely
      let apiResponse: GetStudentDetailResponse;
      try {
        apiResponse = JSON.parse(text);
      } catch {
        console.error('Invalid JSON received:', text);
        throw new Error('Invalid response from server');
      }

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to fetch student details');
      }

      const data = apiResponse.data;

      // Map API response to Student interface
      const student: Student = {
        id: data.id,
        name: data.name,
        age: data.age,
        gender: data.gender,
        place: data.place,
        parentName: data.parentName,
        contactNumber: data.contactNumber,
        whatsappNumber: data.whatsappNumber,
        churchName: data.churchName,
        medication: data.medication,
        medicationIds: data.medicationIds || [],
        staying: (data.staying || 'no') as 'yes' | 'no',
        status: data.status,
        remark: data.remark,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        subGroups: data.subGroups,
        registered_mode: normalizeRegisteredMode((data as any).registered_mode ?? (data as any).registered_Mode),
        age_group: data.age_group ?? undefined,
        mainGroup: data.mainGroup ?? undefined,
        followed_group: data.followed_group ?? undefined,
        following_leader1_id: data.following_leader1_id ?? undefined,
        following_leader1_name: data.following_leader1_name ?? undefined,
        following_leader2_id: data.following_leader2_id ?? undefined,
        following_leader2_name: data.following_leader2_name ?? undefined,
        sub_group: data.sub_group ?? undefined,
        sub_leader1_id: data.sub_leader1_id ?? undefined,
        sub_leader1_name: data.sub_leader1_name ?? undefined,
        sub_leader2_id: data.sub_leader2_id ?? undefined,
        sub_leader2_name: data.sub_leader2_name ?? undefined,
        room_teacher: data.room_teacher ?? undefined,
        room_number: data.room_number ?? undefined,
        room_id: data.room_id ?? undefined,
        parental_detail: data.parental_detail ?? undefined,
        parental_age: data.parental_age ?? undefined,
        staying_leader: data.staying_leader ?? 0,
        comments: data.comments ?? undefined,
        tagColor: data.tagColor ?? undefined,
      };

      return student;
    } catch (error) {
      console.error('Fetch student detail error:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch student details');
    }
  },

  getHistory: async (studentId: number) => {
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
      const HISTORY_URL = `${API_BASE.replace(/\/$/, '')}/user/student/history/${studentId}`;

      const response = await fetch(HISTORY_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // ✅ send cookies automatically
      });

      // Log response for debugging
      

      // Handle 403 Forbidden specifically
      if (response.status === 403) {
        throw new Error('Forbidden: You do not have permission to view this student\'s history');
      }

      if (response.status === 401) {
        throw new Error('Unauthorized: Please login to access student history');
      }

      const text = await response.text();
      

      if (!response.ok) {
        let errorMessage = 'Failed to fetch student history';
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
      } catch {
        console.error('Invalid JSON received for history:', text);
        throw new Error('Invalid response from server');
      }

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to fetch student history');
      }

      return apiResponse.data;
    } catch (error) {
      console.error('Error fetching student history:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch student history');
    }
  },

  updateStudent: async (studentId: number, studentData: Partial<Student>): Promise<any> => {
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
      const STUDENT_API_URL = `${API_BASE.replace(/\/$/, '')}/user/student/${studentId}`;

      // Map the student data to API format
      const payload: UpdateStudentPayload = {
        id: studentData.id || studentId,
        name: studentData.name || '',
        age: studentData.age || 0,
        gender: studentData.gender || 'male',
        place: studentData.place || '',
        parentName: studentData.parentName || '',
        contactNumber: studentData.contactNumber || '',
        whatsappNumber: studentData.whatsappNumber || '',
        churchName: studentData.churchName || '',
        medication: studentData.medication || 'no',
        staying: studentData.staying || 'no',
        status: studentData.status || 'registered',
        remark: studentData.remark || '',
        registered_Mode: studentData.registered_mode || 'offline',
        age_Group: studentData.age_group || '',
      };

      const response = await fetch(STUDENT_API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: This sends cookies with the request
        body: JSON.stringify(payload),
      });

      const text = await response.text();

      if (response.status === 401) {
        throw new Error('Unauthorized: Please login to update student data');
      }

      if (response.status === 403) {
        throw new Error('Forbidden: You do not have permission to update this student');
      }

      if (!response.ok) {
        let errorMessage = 'Failed to update student';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let apiResponse: CreateApiResponse;
      try {
        apiResponse = JSON.parse(text);
      } catch {
        throw new Error('Invalid response from server');
      }

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to update student');
      }

      return apiResponse.data;
    } catch (error) {
      console.error('Update student error:', error);
      throw error instanceof Error ? error : new Error('Failed to update student');
    }
  },

  changeStudentStatus: async (
    studentId: number,
    status: string,
    staying: string,
    parental_detail: string,
    staying_leader: number
  ): Promise<any> => {
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
      const CHANGE_STATUS_URL = `${API_BASE.replace(/\/$/, '')}/user/change/student/${studentId}`;

      const payload = {
        status,
        staying,
        parental_detail,
        staying_leader,
      };

      const response = await fetch(CHANGE_STATUS_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // ✅ Use cookies instead of token
        body: JSON.stringify(payload),
      });

      // Log response for debugging
      
      const text = await response.text();
      

      // Handle specific HTTP status codes
      if (response.status === 401) {
        throw new Error('Unauthorized: Please login to change student status');
      }

      if (response.status === 403) {
        throw new Error('Forbidden: You do not have permission to change student status');
      }

      if (!response.ok) {
        let errorMessage = 'Failed to change student status';
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
        throw new Error(apiResponse.message || 'Failed to change student status');
      }

      return apiResponse.data;
    } catch (error) {
      console.error('Change student status error:', error);
      throw error instanceof Error ? error : new Error('Failed to change student status');
    }
  },

  downloadCSV: async (): Promise<void> => {
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'https://localhost:7135';

      const baseUrl = API_BASE.replace(/\/$/, '');
      const downloadUrl = `${baseUrl}/api/user/students/download`;

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
        } catch {
          // Ignore error reading response
        }

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

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `students_export_${getFormattedDateTime()}.csv`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[*]=UTF-8''(.+)/) ||
          contentDisposition.match(/filename=(.+?)(?:;|$)/);

        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
        }
      }

      // Create download link
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
  }
};

export const students: Student[] = [];
