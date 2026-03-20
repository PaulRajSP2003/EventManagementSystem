//src\types\Notification\types.ts

export interface DashboardStats {
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
}

export interface StudentInfo {
  studentId: number;
  name: string;
  status?: string;
  previousStatus?: string;
}

export interface LeaderInfo {
  leaderId: number;
  name: string;
  status?: string;
  previousStatus?: string;
}

export interface BaseNotification {
  messageType: string;
  eventId: number;
  timestamp: string;
  dashboard: DashboardStats;
  message: string;
}

export interface StudentNotification extends BaseNotification {
  student: StudentInfo;
}

export interface LeaderNotification extends BaseNotification {
  leader: LeaderInfo;
}

export type Notification = (StudentNotification | LeaderNotification) & {
  isRead?: boolean;
};

export interface BulkNotification {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
}
