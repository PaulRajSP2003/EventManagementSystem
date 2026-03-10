import type { Admin } from '../../../types';

export const mockAdminData: Admin[] = [
  {
    id: 1,
    eventId: 20001,
    name: "John Doe",
    contactNumber: "9876543210",
    email: "john@example.com",
    role: "user",
    assignRole: 2,
    isActive: true,
    remark: "Assigned as coordinator",
    password: "secure_password_123",
    createdAt: "2026-01-15",
    updatedAt: "2026-01-15"
  }
];

export const adminAPI = {
  getByEventId: async (eventId: number): Promise<Admin | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const admin = mockAdminData.find(a => a.eventId === eventId);
        resolve(admin || null);
      }, 500);
    });
  },

  getAll: async (): Promise<Admin[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockAdminData), 500);
    });
  },

  getById: async (adminId: number): Promise<Admin | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const admin = mockAdminData.find(a => a.id === adminId);
        resolve(admin || null);
      }, 500);
    });
  },

  create: async (admin: Admin): Promise<Admin> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Check if admin already exists for this event
        const existingAdmin = mockAdminData.find(a => a.eventId === admin.eventId);
        if (existingAdmin) {
          reject(new Error("An admin already exists for this event. Only one admin per event is allowed."));
        } else {
          const newAdmin: Admin = {
            ...admin,
            id: Math.max(...mockAdminData.map(a => a.id || 0)) + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          mockAdminData.push(newAdmin);
          resolve(newAdmin);
        }
      }, 500);
    });
  },

  update: async (adminId: number, admin: Partial<Admin>): Promise<Admin> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockAdminData.findIndex(a => a.id === adminId);
        if (index !== -1) {
          const currentAdmin = mockAdminData[index];
          
          // Prevent changing eventId and email
          const updates: Partial<Admin> = {
            ...admin,
            eventId: currentAdmin.eventId, // Keep original eventId
            email: currentAdmin.email // Keep original email
          };

          mockAdminData[index] = {
            ...currentAdmin,
            ...updates,
            id: currentAdmin.id,
            updatedAt: new Date().toISOString()
          };
          resolve(mockAdminData[index]);
        } else {
          reject(new Error("Admin not found"));
        }
      }, 500);
    });
  },

  delete: async (adminId: number): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockAdminData.findIndex(a => a.id === adminId);
        if (index !== -1) {
          mockAdminData.splice(index, 1);
          resolve(true);
        }
        resolve(false);
      }, 500);
    });
  }
};
