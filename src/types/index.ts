export interface Student {
  id?: number;
  studentId?: number;
  email?: string;
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
  registered_mode?: 'online' | 'offline';
  age_group?: string;
  mainGroup?: string;
  followed_group?: string;
  following_leader1_id?: number;
  following_leader1_name?: string;
  following_leader2_id?: number;
  following_leader2_name?: string;
  sub_group?: string;
  sub_leader1_id?: number;
  sub_leader1_name?: string;
  sub_leader2_id?: number;
  sub_leader2_name?: string;
  staying?: 'yes' | 'no';
  room_teacher?: string;
  room_number?: string;
  room_id?: string;
  parental_detail?: string;
  staying_leader?: number;
  comments?: string;
  parental_age?: number;
  tagColor?: string;
  mentor_group?: string;
  mentor_age_group?: string;
   latitude?: number; 
  longitude?: number; 
}

export interface Leader {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  gender: 'male' | 'female';
  place: string;
  latitude?: number; 
  longitude?: number; 

  contactNumber: string;
  whatsappNumber: string;
  churchName?: string;
  staying: 'yes' | 'no';
  status: 'present' | 'registered' | 'absent';
  isFollowing: string;
  type: 'guest' | 'leader1' | 'leader2' | "participant";
  remark?: string;
  registered_mode?: 'online' | 'offline';
  registeredMode?: string; // API response field
  mainGroupId?: number;
  availableGroup?: string[];
  availableFollowingGroup?: string[];
  followingGroup?: FollowingGroup[];
  subGroups?: SubGroup[];
  room_number?: string;
  room_id?: string;
}

export interface Person {
  id: number;
  name: string;
  gender: 'male' | 'female';
  place: string;
  contactNumber: string;
  whatsappNumber: string;
  status: 'present' | 'registered' | 'absent';
}

export interface FollowingGroup {
  followingName: string;
  leader1: Person;
  leader2?: Person;
  students: Student[];
}

export interface SubGroup {
  subgroupName: string;
  leader1: Person;
  leader2?: Person;
  students: Student[];
}


export interface Group {
  mainGroup?: string;
  mainGroups?: [];
  subGroup?: string;
  subGroups?: [];
}

export interface AssignRole {
  id: number;
  assignRoleName: string;
}

export interface User {
  id: number;
  token?: string;
  name: string;
  email: string;
  contactNumber: string;
  eventId?: number;
  role?: string;
  assignRole?: number;
  isActive: boolean;
  permissions?: number[]; 
  remarks?: string;
  lastLogin?: string;
}

export interface LoginCredentials {
  eventId: string | number;
  email: string;
  password: string;
}

export interface LoginResponse {
  eventId: string;
  accessToken: string;
  name: string;
  email: string;
  role: string;
  permissions: number[];
}

export interface ValidateResponse {
  valid: boolean;
  accessToken?: string;
  name?: string;
  email?: string;
  role?: string;
  permissions?: number[];
  eventId?: string;
  refreshed?: boolean;
  requiresLogin?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Medical {
  reportId?: number;
  patientId: number;
  title: string;
  description: string;
  severity: 'mild' | 'moderate' | 'critical' | 'normal';
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicalTreatment {
  id?: number;
  reportId?: number;
  treaterName: string;
  description: string;
  followingGroup?: string;
  roomNumber?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StayerInfo {
  id: number;
  sourceSubGroup: string;
}

export interface Stayers {
  leaderIds: StayerInfo[];
  studentIds: StayerInfo[];
}

export interface keyHolderInfo {
  id: number;
  timestamp: string;
  received: boolean;
}

export interface keyHandlingItem {
  leaderIds: keyHolderInfo[];
  studentIds: keyHolderInfo[];
}

export interface Room {
  roomId: number; // Numeric identifier (0, 1, 2, 3...)
  roomCode: string; // Previous roomId (e.g., "M1-01", "F2-03")
  roomName: string;
  roomCapacity: number;
  occupancyCapacity?: number;
  occupancyCount?: number;
  isFull: boolean;
  mainLeaderId: mainLeaderData[];
  subGroups: string[];
  stayers: Stayers;
}

export interface mainLeaderData {
  leaderId: number;
  createdAt: string;
}

export interface WaitingList {
  waitingCount: number;
  leaderIds: StayerInfo[];
  studentIds: StayerInfo[];
}

export interface GenderRoomData {
  floors: { [key: string]: Room[] };
  waitingList: WaitingList;
}

export interface RoomData {
  male: GenderRoomData;
  female: GenderRoomData;
  parentalStyers?: parentalStyers[];
}

export interface parentalStyers {
  studentId: number;
  stayingwith: number;
  createAt: string;
}

// Owner/Event Management Types
export interface Event {
  id: number;
  eventId?: number;
  eventName: string;
  eventDescription: string;
  email: string;
  location: string;
  phoneNumber: string;
  from: string; // YYYY-MM-DD format
  to: string; // YYYY-MM-DD format
  eventFrom?: string; // Alias for 'from'
  eventTo?: string; // Alias for 'to'
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Admin {
  id: number;
  eventId: number;
  name: string;
  contactNumber: string;
  email: string;
  role: string;
  assignRole: number;
  isActive: boolean;
  remark: string;
  password?: string;
  permissionPages?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OwnerUser {
  id?: number;
  email: string;
  password: string;
  ownerName: string;
  phoneNumber: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MainGroup {
  id?: string | number;
  name: string;
  groupName?: string;
  description?: string;
  leaderName?: string;
  studentCount?: number;
  status?: 'active' | 'inactive';
}

