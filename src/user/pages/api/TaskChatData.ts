// ==================== API CONFIGURATION ====================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ==================== REQUEST/INTERFACE MODELS ====================

export interface ChatMessage {
    chatId: number;
    taskDetailId: number;
    message: string;
    sentBy: string;
    sentAt: string; // ISO format: "2024-01-01T12:00:00+05:30"
    isActive: boolean;
}

export interface ChatMessageRequest {
    message: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

// ==================== API HELPERS ====================

async function handleResponse<T>(response: Response, defaultErrorMessage: string): Promise<ApiResponse<T>> {
    if (!response.ok) {
        let errorMessage = defaultErrorMessage;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
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
        throw new Error("Target response format invalid sync error.");
    }
}

// ==================== API FUNCTIONS ====================

export const sendChatMessage = async (
    taskDetailId: number,
    message: string,
    headers?: HeadersInit
): Promise<ApiResponse<ChatMessage>> => {
    try {
        const response = await fetch(`${API_BASE_URL}/task/detail/${taskDetailId}/chat`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify({ message } as ChatMessageRequest)
        });

        return await handleResponse<ChatMessage>(response, 'Failed to transmit message');
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};

export const getTaskChatMessages = async (
    taskDetailId: number,
    headers?: HeadersInit
): Promise<ApiResponse<ChatMessage[]>> => {
    try {
        const response = await fetch(`${API_BASE_URL}/task/detail/${taskDetailId}/chat`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        });

        return await handleResponse<ChatMessage[]>(response, 'Failed to retrieve message logs');
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        throw error;
    }
};

export const editChatMessage = async (
    chatId: number,
    message: string,
    headers?: HeadersInit
): Promise<ApiResponse<ChatMessage>> => {
    try {
        const response = await fetch(`${API_BASE_URL}/task/chat/${chatId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify({ message } as ChatMessageRequest)
        });

        return await handleResponse<ChatMessage>(response, 'Failed to update outgoing message');
    } catch (error) {
        console.error('Error editing chat message:', error);
        throw error;
    }
};

export const deleteChatMessage = async (
    chatId: number,
    headers?: HeadersInit
): Promise<ApiResponse<{ chatId: number }>> => {
    try {
        const response = await fetch(`${API_BASE_URL}/task/chat/${chatId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        });

        return await handleResponse<{ chatId: number }>(response, 'Failed to wipe communication record');
    } catch (error) {
        console.error('Error deleting chat message:', error);
        throw error;
    }
};