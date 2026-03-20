// D:\Project\campmanagementsystem_final\src\user\pages\api\TaskData.ts

// ==================== API CONFIGURATION ====================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ==================== REQUEST/INTERFACE MODELS ====================

// Request model for creating/updating task detail
export interface TaskDetailRequest {
    title: string;
    description?: string | null;
    startDateTime?: string | null;  // ISO 8601 format with timezone
    endDateTime?: string | null;     // ISO 8601 format with timezone
    isActive?: boolean;              // Optional: only for status updates`
}

// ==================== RESPONSE MODELS ====================

// Leader Master Data
export interface LeaderData {
    id: number;                 // leaderMaster.leaderId
    name: string;
    gender: string;
    place: string;
    type: string;
}

// Task Master Data
export interface TaskMasterData {
    publicTaskId: string;       // GUID as string
    assignedLeaderId: number;
    isActive: boolean;
    createdAt: string;          // DateTime
    createdBy: string;
}

// Task Detail Data
export interface TaskDetailData {
    taskId: number;
    publicTaskId: string;
    title: string;
    description: string | null;
    start: string | null;             // Formatted: yyyy-MM-ddTHH:mm:ssK
    end: string | null;               // Formatted: yyyy-MM-ddTHH:mm:ssK
    createdAt: string;                // Formatted: yyyy-MM-ddTHH:mm:ssK
    createdBy: string;
    inactiveAt: string | null;
    inactiveBy: string | null;
    status: 'Not Scheduled' | 'Upcoming' | 'In Progress' | 'Completed';
    isActive: boolean;
}

// Combined response for GetTaskDetails
export interface TaskDetailsResponse {
    leaderData: LeaderData;
    taskMasterData: TaskMasterData;
    taskDetailData: TaskDetailData[];
}

// Response for GetAllTasks
export interface TaskListResponse {
    leaderData: LeaderData;
    taskMasterData: TaskMasterData;
}

// Response for CreateTaskMaster
export interface CreateTaskMasterResponse {
    leaderData: LeaderData;
    taskMasterData: TaskMasterData;
}

// Generic API Response Wrapper
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

// ==================== API HELPERS ====================

/**
 * Safely handles API responses, providing meaningful error messages even for empty or non-JSON responses.
 */
async function handleResponse<T>(response: Response, defaultErrorMessage: string): Promise<ApiResponse<T>> {
    if (!response.ok) {
        let errorMessage = defaultErrorMessage;

        try {
            // Attempt to parse error details from response body
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            // If JSON parsing fails (common for 401/403 with no body)
            if (response.status === 401 || response.status === 403) {
                errorMessage = "Something went wrong";
            } else {
                errorMessage = `${defaultErrorMessage} (Status: ${response.status})`;
            }
        }

        const error = new Error(errorMessage) as any;
        error.status = response.status;
        throw error;
    }

    try {
        return await response.json();
    } catch (e) {
        throw new Error("Internal synchronization error: Received malformed intel from the server.");
    }
}

// ==================== API FUNCTIONS ====================

/**
 * GET: api/tasks - Get all tasks with leader info
 */
export async function getAllTasks(token?: string): Promise<ApiResponse<TaskListResponse[]>> {
    try {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'GET',
            credentials: 'include',
            headers,
        });

        return await handleResponse<TaskListResponse[]>(response, 'Failed to fetch operation logs');
    } catch (error) {
        console.error('Error fetching all tasks:', error);
        throw error;
    }
}

/**
 * POST: api/task/{leaderId} - Create a new task master for a leader
 */
export async function createTaskMaster(
    token: string,
    leaderId: number
): Promise<ApiResponse<CreateTaskMasterResponse>> {
    try {
        const response = await fetch(`${API_BASE_URL}/task/${leaderId}`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return await handleResponse<CreateTaskMasterResponse>(response, `Failed to initialize mission for leader ${leaderId}`);
    } catch (error) {
        console.error(`Error creating task master for leader ${leaderId}:`, error);
        throw error;
    }
}

/**
 * POST: api/task/{publicTaskId}/detail - Create a new task detail
 */
export async function createTaskDetail(
    token: string,
    publicTaskId: string,
    request: TaskDetailRequest
): Promise<ApiResponse<TaskDetailData>> {
    try {
        const response = await fetch(`${API_BASE_URL}/task/${publicTaskId}/detail`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        return await handleResponse<TaskDetailData>(response, 'Failed to deploy operational objective');
    } catch (error) {
        console.error(`Error creating task detail for task ${publicTaskId}:`, error);
        throw error;
    }
}

/**
 * PUT: api/task/{publicTaskId}/detail/{taskId} - Update a task detail
 */
export async function updateTaskDetail(
    token: string,
    publicTaskId: string,
    taskId: number,
    request: TaskDetailRequest
): Promise<ApiResponse<TaskDetailData>> {
    try {
        const response = await fetch(`${API_BASE_URL}/task/${publicTaskId}/detail/${taskId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        return await handleResponse<TaskDetailData>(response, `Failed to update objective ${taskId}`);
    } catch (error) {
        console.error(`Error updating task detail ${taskId}:`, error);
        throw error;
    }
}
/**
 * GET: api/task/{publicTaskId}/{leaderId}/detail - Get task details with leader and task master info
 */
export async function getTaskDetails(
    token: string,
    publicTaskId: string,
    leaderId: number
): Promise<ApiResponse<TaskDetailsResponse>> {
    try {
        const response = await fetch(`${API_BASE_URL}/task/${publicTaskId}/${leaderId}/detail`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return await handleResponse<TaskDetailsResponse>(response, 'Failed to fetch mission details');
    } catch (error) {
        console.error(`Error fetching task details for task ${publicTaskId}:`, error);
        throw error;
    }
}

/**
 * PATCH: api/task/{taskDetailId} - Soft delete a single task detail
 */
export async function softDeleteTaskDetail(
    token: string,
    taskDetailId: number
): Promise<ApiResponse<{ taskDetailId: number }>> {
    try {
        const response = await fetch(`${API_BASE_URL}/task/${taskDetailId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return await handleResponse<{ taskDetailId: number }>(response, `Failed to abort objective ${taskDetailId}`);
    } catch (error) {
        console.error(`Error deleting task detail ${taskDetailId}:`, error);
        throw error;
    }
}

/**
 * PATCH: api/task/leader/{leaderId} - Soft delete all tasks for a leader
 */
export async function softDeleteAllTasksForLeader(
    token: string,
    leaderId: number
): Promise<ApiResponse<{ leaderId: number }>> {
    try {
        const response = await fetch(`${API_BASE_URL}/task/leader/${leaderId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return await handleResponse<{ leaderId: number }>(response, `Failed to purge leader missions`);
    } catch (error) {
        console.error(`Error deleting all tasks for leader ${leaderId}:`, error);
        throw error;
    }
}

/**
 * PATCH: api/task/leader/{leaderId} - Activate or deactivate a task master
 * Request body: { action: 'active' | 'inactive' }
 */
export async function updateLeaderTasksStatus(
    token: string,
    leaderId: number,
    action: 'active' | 'inactive'
): Promise<ApiResponse<{ leaderId: number; publicTaskId: string; isActive: boolean }>> {
    try {
        const response = await fetch(`${API_BASE_URL}/task/leader/${leaderId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action })
        });

        return await handleResponse<{ leaderId: number; publicTaskId: string; isActive: boolean }>(response, `Failed to ${action} missions`);
    } catch (error) {
        console.error(`Error updating tasks for leader ${leaderId} with action ${action}:`, error);
        throw error;
    }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Helper function to format dates for API requests
 */
export function formatDateForApi(date: Date): string {
    return date.toISOString(); // Returns in format: 2026-03-19T10:30:00.000Z
}

/**
 * Helper function to create a TaskDetailRequest with proper date formatting
 */
export function createTaskDetailRequest(
    title: string,
    description?: string | null,
    startDateTime?: Date | null,
    endDateTime?: Date | null,
    isActive?: boolean  // Added optional isActive parameter
): TaskDetailRequest {
    const request: TaskDetailRequest = {
        title,
        description: description ?? null,
        startDateTime: startDateTime ? formatDateForApi(startDateTime) : null,
        endDateTime: endDateTime ? formatDateForApi(endDateTime) : null,
    };

    // Only add isActive if provided
    if (isActive !== undefined) {
        request.isActive = isActive;
    }

    return request;
}

// SignalR Event Types for Tasks
export interface TaskSignalREvents {
    messageType: 'task_added' | 'task_updated' | 'task_deleted' | 'task_detail_added' | 'task_detail_updated' | 'task_detail_deleted';
    task: {
        publicTaskId: string;
        leaderId: number;
        taskId?: number;
    };
}