// D:\Project\campmanagementsystem\src\user\pages\api\SubGroupDataAPI.ts

const BASE_URL = 'https://localhost:7135/api/user/sub/group';

export interface SubGroup {
    subGroupName: string;
    leader1Id: number;
    leader2Id: number;
    studentIds: number[];
    absentStudentIds?: number[];
}

export interface GenderGroup {
    groupName: string;
    subGroups: SubGroup[];
}

export interface GroupStructure {
    male: GenderGroup[];
    female: GenderGroup[];
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export const subGroupAPI = {
    // Get all sub group data
    getAll: async (): Promise<GroupStructure> => {
        try {
            const response = await fetch(BASE_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const apiResponse: ApiResponse<GroupStructure> = await response.json();

            if (!apiResponse.success) {
                throw new Error(apiResponse.message || 'Failed to fetch sub group data');
            }

            return apiResponse.data;
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    },

    // Get sub group data filtered by main group ID
    getByGroupId: async (groupId: string): Promise<GroupStructure> => {
        try {
            const allData = await subGroupAPI.getAll();

            const maleGroupId = `M${groupId}`;
            const femaleGroupId = `F${groupId}`;

            return {
                male: (allData.male || []).filter(g => g.groupName === maleGroupId),
                female: (allData.female || []).filter(g => g.groupName === femaleGroupId)
            };
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    },

    // Get all sub group names for a specific main group
    getSubGroupNames: async (groupId: string): Promise<string[]> => {
        try {
            const groupData = await subGroupAPI.getByGroupId(groupId);
            const subGroupNames: string[] = [];

            [...groupData.male, ...groupData.female].forEach(g => {
                g.subGroups.forEach(sg => {
                    subGroupNames.push(sg.subGroupName);
                });
            });

            return [...new Set(subGroupNames)];
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    },

    // Get specific sub group by name
    getSubGroupByName: async (groupId: string, subGroupName: string): Promise<SubGroup | null> => {
        try {
            const groupData = await subGroupAPI.getByGroupId(groupId);

            for (const g of [...groupData.male, ...groupData.female]) {
                const subGroup = g.subGroups.find(sg => sg.subGroupName === subGroupName);
                if (subGroup) {
                    return subGroup;
                }
            }

            return null;
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    },

    // Download Excel file for sub groups
    downloadExcel: async (): Promise<void> => {
        try {
            const url = `${BASE_URL}/download-excel`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = 'sub-groups.xlsx';

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

        } catch (error) {
            console.error('Download Excel error:', error);
        }
    }
};