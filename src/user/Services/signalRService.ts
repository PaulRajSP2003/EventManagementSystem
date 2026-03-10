// src/Services/signalRService.ts
import * as signalR from '@microsoft/signalr';
import type { Notification } from '../../types/Notification/types';

class SignalRService {
    private connection: signalR.HubConnection | null = null;
    private notificationCallbacks: ((notification: Notification) => void)[] = [];
    private bulkNotificationCallbacks: ((notifications: Notification[]) => void)[] = [];
    private connectionStateChangeCallbacks: ((state: string) => void)[] = [];
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private currentEventId: string | null = null;
    private connectionPromise: Promise<void> | null = null;

    public async startConnection(eventId?: string): Promise<void> {
        // Store eventId for reconnection
        if (eventId !== undefined) {
            this.currentEventId = eventId;
        }

        // If already connected or connecting, just update eventId and rejoin if needed
        if (this.connection) {
            if (eventId && eventId !== this.currentEventId) {
                this.currentEventId = eventId;
                if (this.connection.state === signalR.HubConnectionState.Connected) {
                    try {
                        await this.connection.invoke('JoinEventGroup', eventId);
                    } catch { }
                }
            }
            return;
        }

        // If connection is in progress, return that promise
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        const apiUrl = 'https://localhost:7135';
        const hubUrl = `${apiUrl}/notificationHub`;

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                withCredentials: true
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Error)
            .build();

        // Single notification
        this.connection.on('ReceiveNotification', (notification: Notification) => {
            this.notificationCallbacks.forEach(callback => {
                try {
                    callback(notification);
                } catch {
                    // swallow callback errors
                }
            });
        });

        // Bulk notifications
        this.connection.on('ReceiveBulkNotifications', (data: { notifications: Notification[] }) => {
            this.bulkNotificationCallbacks.forEach(callback => {
                callback(data.notifications);
            });
        });

        // Reconnecting
        this.connection.onreconnecting(() => {
            this.reconnectAttempts++;
            this.notifyStateChange('reconnecting');
        });

        // Reconnected
        this.connection.onreconnected(async () => {
            this.reconnectAttempts = 0;
            this.notifyStateChange('connected');

            if (this.currentEventId && this.connection) {
                try {
                    await this.connection.invoke('JoinEventGroup', this.currentEventId);
                } catch {
                    // ignore
                }
            }
        });

        // Connection closed
        this.connection.onclose(() => {
            this.connection = null;
            this.connectionPromise = null;
            this.notifyStateChange('disconnected');

            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(
                    () => this.startConnection(this.currentEventId || undefined),
                    5000
                );
            }
        });

        try {
            this.connectionPromise = this.connection.start();
            await this.connectionPromise;
            this.reconnectAttempts = 0;
            this.notifyStateChange('connected');

            if (this.currentEventId && this.connection) {
                try {
                    await this.connection.invoke('JoinEventGroup', this.currentEventId);
                } catch {
                    // ignore
                }
            }

            this.connectionPromise = null;
        } catch (err) {
            this.connection = null;
            this.connectionPromise = null;
            this.notifyStateChange('disconnected');

            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(
                    () => this.startConnection(this.currentEventId || undefined),
                    5000
                );
            }
        }
    }

    public onNotification(callback: (notification: Notification) => void): void {
        this.notificationCallbacks.push(callback);
    }

    public onBulkNotifications(callback: (notifications: Notification[]) => void): void {
        this.bulkNotificationCallbacks.push(callback);
    }

    public removeNotificationCallback(callback: (notification: Notification) => void): void {
        this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
    }

    public removeBulkNotificationsCallback(callback: (notifications: Notification[]) => void): void {
        this.bulkNotificationCallbacks = this.bulkNotificationCallbacks.filter(cb => cb !== callback);
    }

    public onConnectionStateChange(callback: (state: string) => void): () => void {
        this.connectionStateChangeCallbacks.push(callback);
        // Return unsubscribe function
        return () => {
            this.connectionStateChangeCallbacks = this.connectionStateChangeCallbacks.filter(cb => cb !== callback);
        };
    }

    private notifyStateChange(state: string): void {
        this.connectionStateChangeCallbacks.forEach(callback => {
            try {
                callback(state);
            } catch {
                // ignore
            }
        });
    }

    public async stopConnection(): Promise<void> {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
            this.connectionPromise = null;
            this.reconnectAttempts = 0;
            this.currentEventId = null;
            this.notifyStateChange('disconnected');
        }
    }

    public isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }

    public getConnectionState(): string {
        return this.connection?.state || 'disconnected';
    }

    public getCurrentEventId(): string | null {
        return this.currentEventId;
    }
}

export default new SignalRService();