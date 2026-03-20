
import type { RoomData } from '../../../types';
import { API_BASE as CENTRAL_API_BASE } from '../../../config/api';

export interface mainLeaderData {
  leaderId: number;
  createdAt: string;
}

/*const mockRoomDataContent: RoomData = {
  male: {
    floors: {
      "1": [
        {
          roomId: 2,
          roomCode: "M1-01",
          roomName: "M101",
          roomCapacity: 6,
          isFull: true,
          mainLeaderId: [
            { leaderId: 1, createdAt: '2026-01-01T10:00:00Z' },
            { leaderId: 2, createdAt: '2026-01-01T10:00:00Z' }
          ],
          subGroups: ["MA1", "MA2","Participants"],
          stayers: {
            leaderIds: [
              //{ id: 1, sourceSubGroup: "MA1" },
             //{ id: 2, sourceSubGroup: "Participants" }
            ],
            studentIds: [
                //{ id: 1, sourceSubGroup: "MA1" },
             // { id: 2, sourceSubGroup: "MA1" },
             // { id: 3, sourceSubGroup: "MA2" },
            // { id: 4, sourceSubGroup: "MA2" }
            ]
          }
        },
        {
          roomId: 1,
          roomCode: "M1-02",
          roomName: "M102",
          roomCapacity: 6,
          isFull: false,
          mainLeaderId: [
            { leaderId: 3, createdAt: '2026-01-02T10:00:00Z' }
          ],
          subGroups: ["MA3"],
          stayers: {
            leaderIds: [{ id: 3, sourceSubGroup: "MA3" }],
            studentIds: [
              { id: 5, sourceSubGroup: "MA3" },
              { id: 6, sourceSubGroup: "MA3" }
            ]
          }
        }
      ],
      "2": [
        {
          roomId: 2,
          roomCode: "M2-01",
          roomName: "M201",
          roomCapacity: 8,
          isFull: true,
          mainLeaderId: [
            { leaderId: 4, createdAt: '2026-01-03T10:00:00Z' },
            { leaderId: 5, createdAt: '2026-01-04T10:00:00Z' }
          ],
          subGroups: ["MB1", "MB2"],
          stayers: {
            leaderIds: [
              { id: 4, sourceSubGroup: "MB1" },
              { id: 5, sourceSubGroup: "MB2" }
            ],
            studentIds: [
              { id: 7, sourceSubGroup: "MB1" },
              { id: 8, sourceSubGroup: "MB1" },
              { id: 9, sourceSubGroup: "MB1" },
              { id: 10, sourceSubGroup: "MB2" },
              { id: 11, sourceSubGroup: "MB2" },
              { id: 12, sourceSubGroup: "MB2" }
            ]
          }
        },
        {
          roomId: 3,
          roomCode: "M2-02",
          roomName: "M202",
          roomCapacity: 6,
          isFull: false,
          mainLeaderId: [],
          subGroups: ["MB3"],
          stayers: {
            leaderIds: [],
            studentIds: [
              { id: 13, sourceSubGroup: "MB3" }
            ]
          }
        }
      ],
      "3": [
        {
          roomId: 4,
          roomCode: "M3-01",
          roomName: "M301",
          roomCapacity: 10,
          isFull: true,
          mainLeaderId: [
            { leaderId: 6, createdAt: '2026-01-05T10:00:00Z' }
          ],
          subGroups: ["MC1"],
          stayers: {
            leaderIds: [{ id: 6, sourceSubGroup: "MC1" }],
            studentIds: [
              { id: 14, sourceSubGroup: "MC1" },
              { id: 15, sourceSubGroup: "MC1" },
              { id: 16, sourceSubGroup: "MC1" },
              { id: 17, sourceSubGroup: "MC1" },
              { id: 18, sourceSubGroup: "MC1" },
              { id: 19, sourceSubGroup: "MC1" },
              { id: 20, sourceSubGroup: "MC1" },
              { id: 21, sourceSubGroup: "MC1" }
            ]
          }
        }
      ]
    },
    waitingList: {
      waitingCount: 6,
      leaderIds: [
        { id: 1, sourceSubGroup: "MA1" },
        { id: 8, sourceSubGroup: "MB2" }
      ],
      studentIds: [
        { id: 22, sourceSubGroup: "MA2" },
        { id: 23, sourceSubGroup: "MA3" },
        { id: 24, sourceSubGroup: "MB1" },
        { id: 25, sourceSubGroup: "MB3" },
        { id: 25, sourceSubGroup: "MB3" }
      ]
    },
  },
  female: {
    floors: {
      "1": [
        {
          roomId: 5,
          roomCode: "F1-01",
          roomName: "F101",
          roomCapacity: 6,
          isFull: false,
          mainLeaderId: [
            { leaderId: 101, createdAt: '2026-01-06T10:00:00Z' }
          ],
          subGroups: ["FA1"],
          stayers: {
            leaderIds: [
              { id: 101, sourceSubGroup: "FA1" }],
            studentIds: [
              { id: 201, sourceSubGroup: "FA1" },
              { id: 202, sourceSubGroup: "FA1" }
            ]
          }
        }
      ],
      "2": [
        {
          roomId: 6,
          roomCode: "F2-01",
          roomName: "F201",
          roomCapacity: 6,
          isFull: true,
          mainLeaderId: [
            { leaderId: 102, createdAt: '2026-01-07T10:00:00Z' },
            { leaderId: 103, createdAt: '2026-01-08T10:00:00Z' }
          ],
          subGroups: ["FB1", "FB2"],
          stayers: {
            leaderIds: [
              { id: 102, sourceSubGroup: "FB1" },
              { id: 103, sourceSubGroup: "FB2" }
            ],
            studentIds: [
              { id: 203, sourceSubGroup: "FB1" },
              { id: 204, sourceSubGroup: "FB1" },
              { id: 205, sourceSubGroup: "FB2" },
              { id: 206, sourceSubGroup: "FB2" }
            ]
          }
        }
      ],
      "3": [
        {
          roomId: 7,
          roomCode: "F3-01",
          roomName: "F301",
          roomCapacity: 8,
          isFull: false,
          mainLeaderId: [],
          subGroups: ["FC1"],
          stayers: {
            leaderIds: [],
            studentIds: [
              { id: 207, sourceSubGroup: "FC1" }
            ]
          }
        }
      ]
    },
    waitingList: {
      waitingCount: 3,
      leaderIds: [
        { id: 104, sourceSubGroup: "FB2" }
      ],
      studentIds: [
        { id: 208, sourceSubGroup: "FB1" },
        { id: 209, sourceSubGroup: "FB2" }
      ]
    },
    
  },parentalStyers: [
    { studentId: 22, stayingwith: 3, createAt: '2026-01-10T09:00:00Z' },
    { studentId: 23, stayingwith: 3, createAt: '2026-01-11T09:00:00Z' },
    { studentId: 24, stayingwith: 3, createAt: '2026-01-12T09:00:00Z' },
    { studentId: 208, stayingwith: 102, createAt: '2026-01-13T09:00:00Z' },
    { studentId: 209, stayingwith: 103, createAt: '2026-01-14T09:00:00Z' }
  ],
};*/

/*const mockRoomDataContent: RoomData = {
  male: {
    floors: {},
    waitingList: {
      waitingCount: 0,
      leaderIds: [],
      studentIds: []
    }
  },

  female: {
    floors: {},
    waitingList: {
      waitingCount: 0,
      leaderIds: [],
      studentIds: []
    }
  }
};*/

// Download Excel file for rooms
export async function downloadRoomCSV(): Promise<void> {
  try {
    const baseUrl = CENTRAL_API_BASE.replace(/\/$/, '');
    const downloadUrl = `${baseUrl}/room/download`;

    const headers: HeadersInit = {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv',
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

    // Check content type to determine file extension
    const contentType = response.headers.get('Content-Type');
    const isExcel = contentType?.includes('spreadsheetml.sheet') ||
      contentType?.includes('excel') ||
      contentType?.includes('octet-stream');

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
    let filename = '';

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[*]=UTF-8''(.+)/) ||
        contentDisposition.match(/filename=(.+?)(?:;|$)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
      }
    }

    // If no filename from header, generate one with correct extension
    if (!filename) {
      const extension = isExcel ? '.xlsx' : '.csv';
      filename = `rooms_export_${getFormattedDateTime()}${extension}`;
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
    throw error instanceof Error ? error : new Error('Failed to download file');
  }
}

// Fetch room data from API
export async function fetchRoomData(): Promise<RoomData> {
  try {
    const API_BASE = CENTRAL_API_BASE;
    const ROOM_URL = `${API_BASE.replace(/\/$/, '')}/room`;

    const response = await fetch(ROOM_URL, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      credentials: 'include',
      mode: 'cors'
    });

    if (response.status === 401) {
      throw new Error('Unauthorized: Please login to access room data');
    }

    if (response.status === 403) {
      throw new Error('Forbidden: You do not have permission to access room data');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FetchRoomData - Error response:', errorText);
      throw new Error(`Failed to fetch room data: ${response.status} - ${errorText}`);
    }

    const text = await response.text();


    // Parse JSON safely
    let result;
    try {
      result = JSON.parse(text);
    } catch (parseErr) {
      console.error('FetchRoomData - Invalid JSON received:', text);
      throw new Error('Invalid response from server');
    }



    if (result.success && result.data) {
      return result.data;
    }
    return result;

  } catch (error) {
    console.error('FetchRoomData - Network error:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch room data');
  }
}

export interface EventStayConfig {
  eventId: number;
  namingOption: 'manual' | 'auto';
  parentStayMaxAge: number;
}

export async function fetchEventStayConfig(): Promise<EventStayConfig | null> {

  try {
    const response = await fetch(`${CENTRAL_API_BASE}/admin/eventStayRoomConfig`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      credentials: 'include',
      mode: 'cors'
    });



    if (!response.ok) {
      const errorText = await response.text();
      console.error('FetchEventStayConfig - Error response:', errorText);
      throw new Error(`Failed to fetch event stay config: ${response.status} - ${errorText}`);
    }

    const result = await response.json();


    if (result.success && result.data) {
      return result.data;
    } else {
      return null;
    }

  } catch (error) {
    console.error('FetchEventStayConfig - Network error:', error);
    throw error;
  }
}

export async function saveEventStayConfig(config: EventStayConfig): Promise<{ success: boolean; message: string }> {

  try {
    const response = await fetch(`${CENTRAL_API_BASE}/admin/eventStayRoomConfig`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      credentials: 'include',
      body: JSON.stringify(config),
      mode: 'cors'
    });



    if (!response.ok) {
      const errorText = await response.text();
      console.error('SaveEventStayConfig - Error response:', errorText);
      throw new Error(`Failed to save event stay config: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    return result;

  } catch (error) {
    console.error('SaveEventStayConfig - Network error:', error);
    throw error;
  }
}
