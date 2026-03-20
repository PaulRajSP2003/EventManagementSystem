// import mockData from './mockData.json';
import { API_BASE } from '../../../config/api';

export interface DashboardData {
  dashboard: {
    eventInfo: {
      eventId: number;
      eventName: string;
      duration: string;
      startDate: string;
      endDate: string;
      currentDay: number;
      daysRemaining: number;
      progress: string;
      totalCapacity: number;
      totalRegistered: number;
    };
    summary: {
      totalStudents: number;
      totalLeaders: number;
      totalRooms: number;
      totalUsers: number;
    };
    attendance: {
      students: {
        present: number;
        absent: number;
        registered: number;
      };
      leaders: {
        present: number;
        absent: number;
        registered: number;
      };
      overall: {
        totalParticipants: number;
        present: number;
        absent: number;
        registered: number;
      };
    };
    stayingStatus: {
      students: {
        staying: number;
        notStaying: number;
      };
      leaders: {
        staying: number;
        notStaying: number;
      };
      overall: {
        totalStaying: number;
        totalNotStaying: number;
      };
    };
    genderDistribution: {
      students: {
        male: number;
        female: number;
      };
      leaders: {
        male: number;
        female: number;
      };
      total: {
        male: number;
        female: number;
      };
    };
    sectionGroups: {
      activeGroups: Array<{
        ageGroupId: number;
        groupCode: string;
        ageRange: string;
        initialAge: number;
        finalAge: number;
        tagColor: string;
        studentCount: number;
        attendance: {
          present: number;
          absent: number;
        };
        staying: {
          yes: number;
          no: number;
        };
      }>;
    };
    registrationMode: {
      online: number;
      offline: number;
    };
  };
}

export const fetchDashboardData = async (token?: string): Promise<DashboardData> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/user/dashboard`, {
    method: 'GET',
    headers,
    credentials: 'include', // If cookies/session needed
  });
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  const result = await response.json();
  // API returns { success, message, data }, so extract data
  return { dashboard: result.data } as DashboardData;
};

export interface SignalRNotification {
  messageType: string;
  eventId: number;
  timestamp: string;
  dashboard: {
    registered: number;
    present: number;
    absent: number;
    total: number;
    student: {
      registered: number;
      present: number;
      absent: number;
    };
    leader: {
      registered: number;
      present: number;
      absent: number;
    };
  };
  student?: {
    studentId: number;
    name: string;
    status: string;
    previousStatus?: string;
  };
  leader?: {
    leaderId: number;
    name: string;
    status: string;
    previousStatus?: string;
  };
  message: string;
}
