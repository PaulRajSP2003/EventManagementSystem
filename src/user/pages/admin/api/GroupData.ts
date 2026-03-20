import { API_BASE } from '../../../../config/api';
const BASE_URL = `${API_BASE}/admin`;

export interface SectionGroup {
  groupName: string;
  initialAge: number;
  finalAge: number;
  tagColor: string;
}

export interface MentorGroup {
  groupName: string;
  initialAge: number;
  finalAge: number;
  capacity: number;
}

interface ApiSectionGroup {
  groupCode: string;
  initialAge: number;
  finalAge: number;
  tagColor: string;
}

interface ApiMentorGroup {
  groupCode: string;
  initialAge: number;
  finalAge: number;
  capacity: number;
}

interface ApiGroupResponse {
  success: boolean;
  data: {
    sectionGroup: ApiSectionGroup[];
    mentorGroup: ApiMentorGroup[];
  };
}

interface ApiSaveResponse {
  success: boolean;
  message: string;
}


//Get authentication headers from localStorage

const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  return headers;
};

//Fetch section groups and mentor groups from API
 
export const fetchGroupData = async (): Promise<{
  sectionGroups: SectionGroup[];
  mentorGroups: MentorGroup[];
} | null> => {
  try {
    const headers = getAuthHeaders();
    

    const response = await fetch(`${BASE_URL}/group`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: ApiGroupResponse = await response.json();

    if (!data.success) {
      throw new Error('API returned success: false');
    }

    return {
      sectionGroups: data.data.sectionGroup.map((sg) => ({
        groupName: sg.groupCode,
        initialAge: sg.initialAge,
        finalAge: sg.finalAge,
        tagColor: sg.tagColor,
      })),
      mentorGroups: data.data.mentorGroup.map((mg) => ({
        groupName: mg.groupCode,
        initialAge: mg.initialAge,
        finalAge: mg.finalAge,
        capacity: mg.capacity,
      })),
    };
  } catch (error) {
    console.error('Failed to fetch group data:', error);
    return null;
  }
};

//Save section groups to API

export const saveSectionGroups = async (
  groups: SectionGroup[]
): Promise<boolean> => {
  try {
    const headers = getAuthHeaders();

    const response = await fetch(`${BASE_URL}/sectiongroup`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(groups),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: ApiSaveResponse = await response.json();

    if (!data.success) {
      throw new Error('API returned success: false');
    }

    
    return true;
  } catch (error) {
    console.error('Failed to save section groups:', error);
    return false;
  }
};

//Save mentor groups to API
export const saveMentorGroups = async (
  groups: MentorGroup[]
): Promise<boolean> => {
  try {
    const headers = getAuthHeaders();

    const response = await fetch(`${BASE_URL}/mentorgroup`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(groups),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: ApiSaveResponse = await response.json();

    if (!data.success) {
      throw new Error('API returned success: false');
    }

    
    return true;
  } catch (error) {
    console.error('Failed to save mentor groups:', error);
    return false;
  }
};


//Save floor settings/room changes to API

export const saveFloorSettings = async (
  lastAction: any[]
): Promise<boolean> => {
  try {
    if (lastAction.length === 0) {
      
      return false;
    }

    const dataToSave = {
      roomChanges: lastAction
    };

    const headers = getAuthHeaders();

    const response = await fetch(`${BASE_URL}/roomChanges`, {
      method: "POST",
      headers,
      body: JSON.stringify(dataToSave),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(`Authentication failed. Please login again.`);
      }
      throw new Error(`Server error: ${response.status}`);
    }

    await response.json();
    
    return true;

  } catch (error) {
    console.error("POST Error:", error);
    throw error;
  }
};
