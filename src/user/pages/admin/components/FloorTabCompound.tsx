import React, { useEffect, useState } from 'react';
import { fetchRoomData } from '../../api/RoomData';
// Link removed as it was unused
import EventStayConfigTab from './EventStayConfigTab';
import {
    FiEdit,
    FiPlus,
    FiTrash2,
    FiSave,
    FiAlertCircle,
    FiCheckCircle,
    FiUsers,
    FiUser,
    FiBarChart2,
    FiTrendingUp,
    FiCircle,
    FiX,
    FiSettings,
} from 'react-icons/fi';

interface Room {
    roomId: number;
    roomCode: string;
    roomName: string;
    roomCapacity: number;
    isFull: boolean;
    subGroups: string[];
    stayers: {
        leaderIds: Array<{ id: number; sourceSubGroup: string }>;
        studentIds: Array<{ id: number; sourceSubGroup: string }>;
    };
}

type WaitingList = {
    waitingCount: number;
    leaderIds: Array<{ id: number; sourceSubGroup: string }>;
    studentIds: Array<{ id: number; sourceSubGroup: string }>;
};

interface RoomData {
    male: {
        floors: { [floor: string]: Room[] };
        waitingList: WaitingList;
    };
    female: {
        floors: { [floor: string]: Room[] };
        waitingList: WaitingList;
    };
}

interface FloorDataJson {
    male: { floorCount: number[] };
    female: { floorCount: number[] };
}

interface AlertState {
    message: string;
    type: 'error' | 'success' | 'warning';
    visible: boolean;
    roomId?: number;
    roomCode?: string;
    floorId?: string;
}

interface LastActionItem {
    roomId: number;
    roomCode: string;
    roomName: string;
    floor: number;
    gender: 'M' | 'F';
    capacity: number;
    actionType: 'added' | 'removed' | 'changed';
}

interface FloorTabCompoundProps {
    floorDataJson: FloorDataJson;
    roomData: RoomData;
    namingOption: 'manual' | 'auto';
    onFloorDataChange?: (data: FloorDataJson) => void;
    onRoomDataChange: (data: RoomData) => void;
    eventId: number;
    onNamingChange: (option: 'manual' | 'auto') => void;
    onSaveSuccess: () => void;
    hasEventStayConfigUnsaved: boolean;
    onEventStayConfigUnsaved: (unsaved: boolean) => void;
}

const FloorTabCompound: React.FC<FloorTabCompoundProps> = ({
    floorDataJson,
    roomData,
    namingOption,
    onRoomDataChange,
    eventId,
    onNamingChange,
    onSaveSuccess,
    hasEventStayConfigUnsaved,
    onEventStayConfigUnsaved,
}) => {
    const [activeSubTab, setActiveSubTab] = useState<'male' | 'female' | 'eventStayConfig'>('male');
    const [editingFloor, setEditingFloor] = useState<string | null>(null);
    const [tempFloorNumber, setTempFloorNumber] = useState<number>(1);
    const [editingRoom, setEditingRoom] = useState<string | null>(null);
    const [tempRoomName, setTempRoomName] = useState('');
    const [lastAction, setLastAction] = useState<LastActionItem[]>([]);
    // ── Add these states near your other useStates ────────────────────────────────
    const [prevNamingOption, setPrevNamingOption] = useState<'manual' | 'auto' | null>(null);
    const [pendingRenameActions, setPendingRenameActions] = useState<LastActionItem[]>([]);

    // Optional: store original names/codes before mass-rename (for true undo)
    const [originalRoomSnapshot, setOriginalRoomSnapshot] = useState<RoomData | null>(null);
    const [alert, setAlert] = useState<AlertState>({
        message: '',
        type: 'error',
        visible: false,
        roomId: undefined,
    });

    // Changed: now tracks by roomCode instead of roomId
    const [editingCapacity, setEditingCapacity] = useState<{
        roomCode: string;
        gender: 'male' | 'female';
        floorNumber: number;
        tempValue: number;
        occupancy: number;
    } | null>(null);

    // ── NEW: state to control reset ────────────────────────────────
    const [shouldResetEventStayConfig, setShouldResetEventStayConfig] = useState(false);

    const gender = (activeSubTab === 'male' || activeSubTab === 'female') ? activeSubTab : 'male';

    // ── NEW: handlers for EventStayConfig save ────────────────────────────────
    const handleEventStayConfigSaveSuccess = () => {
        // Parent-level success logic (if any)
        onSaveSuccess?.();

        // Trigger reset in child
        setShouldResetEventStayConfig(true);

        // Clear it after one render cycle (prevents infinite loop)
        setTimeout(() => {
            setShouldResetEventStayConfig(false);
        }, 0);
    };

    // When child acknowledges reset (optional – for extra safety)
    const handleResetAcknowledged = () => {

    };

    const showAlert = (
        message: string,
        type: 'error' | 'success' | 'warning' = 'error',
        roomId?: number,
        roomCode?: string,           // ← add
        floorId?: string
    ) => {
        setAlert({ message, type, visible: true, roomId, roomCode, floorId });
        setTimeout(() => {
            setAlert((prev) => ({ ...prev, visible: false }));
        }, 10000);
    };

    // ── Effect to handle namingOption changes ────────────────────────────────
    useEffect(() => {
        if (namingOption === undefined) return;

        // ── Remember previous value on first change ──
        if (prevNamingOption === null && namingOption) {
            setPrevNamingOption(namingOption);
            // Optional: take snapshot only once (before any auto-rename happens)
            if (!originalRoomSnapshot) {
                setOriginalRoomSnapshot(structuredClone(roomData));
            }
            return;
        }

        // ── Same value → no action ──
        if (prevNamingOption === namingOption) return;

        const isReverting = prevNamingOption !== null && namingOption === prevNamingOption;

        if (isReverting) {
            // ── User is going back to previous mode ──
            showAlert(
                `Revert room names to previous (${namingOption}) state?`,
                'warning',
                undefined,
                undefined,
                undefined
            );

            // You can make this a confirm dialog instead of auto-revert
            // For simplicity here we show alert + button in UI, but you can use window.confirm too
            const userWantsRevert = window.confirm(
                `Do you want to undo the ${prevNamingOption} renaming and restore previous names?`
            );

            if (userWantsRevert) {
                if (originalRoomSnapshot) {
                    onRoomDataChange(structuredClone(originalRoomSnapshot));
                }

                // Remove only the rename-related pending actions
                setLastAction(prev =>
                    prev.filter(action => !pendingRenameActions.some(p =>
                        p.roomCode === action.roomCode && action.actionType === 'changed'
                    ))
                );

                setPendingRenameActions([]); // clear tracked renames

                showAlert("Reverted to previous room names", "success");
            } else {
                showAlert("Kept current names (no revert)");
            }

            // Update prev anyway
            setPrevNamingOption(namingOption);
            return;
        }

        // ── Normal forward change (manual → auto or auto → manual) ──
        const updated = structuredClone(roomData);
        let hasChanges = false;
        const newRenameActions: LastActionItem[] = [];

        (['male', 'female'] as const).forEach(gender => {
            const prefix = gender === 'male' ? 'M' : 'F';
            const genderLetter = gender === 'male' ? 'M' : 'F';

            Object.entries(updated[gender].floors).forEach(([floorStr, rooms]) => {
                const floorNum = Number(floorStr);
                rooms.forEach((room, idx) => {
                    const seq = (idx + 1).toString().padStart(2, '0');
                    const targetName = namingOption === 'auto'
                        ? `${prefix}${floorNum}${seq}`     // ← your preferred style
                        : `Room ${idx + 1}`;

                    const targetCode = `${prefix}${floorNum}-${seq}`;

                    if (room.roomName !== targetName || room.roomCode !== targetCode) {
                        hasChanges = true;
                        room.roomName = targetName;
                        room.roomCode = targetCode;

                        newRenameActions.push({
                            roomId: room.roomId,
                            roomCode: targetCode,
                            roomName: targetName,
                            floor: floorNum,
                            gender: genderLetter,
                            capacity: room.roomCapacity,
                            actionType: 'changed',
                        });
                    }
                });
            });
        });

        if (hasChanges) {
            onRoomDataChange(updated);

            // Store these actions so we can remove them on revert
            setPendingRenameActions(newRenameActions);

            // Add to lastAction (append or replace previous renames)
            setLastAction(prev => {
                const withoutPreviousRenames = prev.filter(a =>
                    !pendingRenameActions.some(p => p.roomCode === a.roomCode && a.actionType === 'changed')
                );
                return [...withoutPreviousRenames, ...newRenameActions];
            });

            showAlert(
                `Rooms renamed to ${namingOption} style (${namingOption === 'auto' ? 'M101/F201' : 'Room 1/2/..'})`,
                'success'
            );
        }

        // Update previous state
        setPrevNamingOption(namingOption);

    }, [namingOption, roomData, onRoomDataChange, showAlert, prevNamingOption, originalRoomSnapshot]);


    const handleSaveFloorSettings = async () => {
        if (lastAction.length === 0) {
            showAlert("No changes to save", "warning");
            return;
        }

        const dataToSave = {
            roomChanges: lastAction
        };

        try {
            const response = await fetch("/api/admin/roomChanges", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                credentials: 'include',
                body: JSON.stringify(dataToSave),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Authentication failed. Please login again.");
                }

                if (response.status === 403) {
                    throw new Error("You do not have permission to perform this action.");
                }

                throw new Error(`Server error: ${response.status}`);
            }

            await response.json();


            // Show success with saved icon
            showAlert("Configuration saved successfully!", "success");

            // Reset lastAction after successful save
            setLastAction([]);

            // Refresh data
            const data = await fetchRoomData();
            if (onRoomDataChange) {
                onRoomDataChange(data);
            }

            // Reset editing states
            setEditingFloor(null);
            setEditingRoom(null);
            setEditingCapacity(null);
            setTempRoomName('');
            setTempFloorNumber(1);

        } catch (error) {
            console.error("POST Error:", error);
            showAlert(error instanceof Error ? error.message : "Failed to save configuration. Check console for details.", "error");
        }
    };

    // Add missing addFloor and cancelEditFloorNumber definitions
    const addFloor = (gender: 'male' | 'female') => {
        const currentFloors = floorDataJson[gender].floorCount;
        const newFloorNumber = currentFloors.length > 0 ? Math.max(...currentFloors) + 1 : 1;
        const floorKey = newFloorNumber.toString();
        onRoomDataChange({
            ...roomData,
            [gender]: {
                ...roomData[gender],
                floors: {
                    ...roomData[gender].floors,
                    [floorKey]: [],
                },
            },
        });
    };

    const cancelEditFloorNumber = () => {
        setEditingFloor(null);
        setTempFloorNumber(1);
    };


    // ────────────────────────────────────────────────
    // Floor Editing
    // ────────────────────────────────────────────────

    const startEditFloorNumber = (gender: 'male' | 'female', floorNumber: number) => {
        setEditingFloor(`${gender}-${floorNumber}`);
        setTempFloorNumber(floorNumber);
    };

    const saveFloorNumber = (
        gender: 'male' | 'female',
        oldFloorNumber: number,
        newFloorNumber: number
    ) => {
        if (floorDataJson[gender].floorCount.includes(newFloorNumber)) {
            showAlert(
                `Floor ${newFloorNumber} already exists for ${gender}. Please choose a different number.`,
                "warning"
            );
            return;
        }

        const oldFloorKey = oldFloorNumber.toString();
        const newFloorKey = newFloorNumber.toString();

        // Get all rooms on the old floor
        const oldFloorRooms = roomData[gender].floors[oldFloorKey] || [];

        // Update room codes for all rooms (convert F1-01 to F2-01, etc.)
        const updatedRooms = oldFloorRooms.map(room => {
            const roomNumber = room.roomCode.split('-')[1]; // Extract "01", "02", etc.
            const newRoomCode = `${gender === 'male' ? 'M' : 'F'}${newFloorNumber}-${roomNumber}`;

            return {
                ...room,
                roomCode: newRoomCode
            };
        });

        // Update the floor key in roomData with updated room codes
        onRoomDataChange({
            ...roomData,
            [gender]: {
                ...roomData[gender],
                floors: Object.fromEntries(
                    Object.entries(roomData[gender].floors).map(([key, rooms]) => {
                        if (key === oldFloorKey) {
                            // Return updated rooms with new floor key
                            return [newFloorKey, updatedRooms];
                        }
                        return [key, rooms];
                    })
                ),
            },
        });

        // Update lastAction with correct room codes
        setLastAction((prev) => {
            // Remove any previous 'changed' actions for these rooms
            const filtered = prev.filter(
                (a) => !(a.gender === (gender === 'male' ? 'M' : 'F') &&
                    a.floor === oldFloorNumber &&
                    a.actionType === 'changed')
            );

            // Add a 'changed' action for each room with updated roomCode
            const changedRooms: LastActionItem[] = updatedRooms.map((room) => ({
                roomId: room.roomId,
                roomCode: room.roomCode, // This now has the updated code (F2-02)
                roomName: room.roomName,
                floor: newFloorNumber,
                gender: (gender === 'male' ? 'M' : 'F') as 'M' | 'F',
                capacity: room.roomCapacity,
                actionType: 'changed',
            }));

            return [...filtered, ...changedRooms];
        });

        setEditingFloor(null);
        setTempFloorNumber(1);

        // Show success message
        showAlert(
            `Floor ${oldFloorNumber} changed to ${newFloorNumber}. Room codes updated accordingly.`,
            'success'
        );
    };
    const removeFloor = (gender: 'male' | 'female', floorNumber: number) => {
        const floorKey = floorNumber.toString();
        if (floorDataJson[gender].floorCount.length <= 1) {
            showAlert('Cannot remove the last floor', 'warning', undefined, floorKey);
            return;
        }

        const floorRooms = roomData[gender].floors[floorKey] || [];
        const totalLeaders = floorRooms.reduce((sum, room) => sum + room.stayers.leaderIds.length, 0);
        const totalStudents = floorRooms.reduce((sum, room) => sum + room.stayers.studentIds.length, 0);
        const totalStayers = totalLeaders + totalStudents;

        if (totalStayers > 0) {
            showAlert(
                `Deletion is not allowed. This floor currently contains ${totalStayers} Stayers.`,
                'error',
                undefined,
                floorKey
            );
            return;
        }

        onRoomDataChange({
            ...roomData,
            [gender]: {
                ...roomData[gender],
                floors: Object.fromEntries(
                    Object.entries(roomData[gender].floors).filter(([k]) => k !== floorKey)
                ),
            },
        });
    };

    // ────────────────────────────────────────────────
    // Room Management
    // ────────────────────────────────────────────────

    const addRoom = (gender: 'male' | 'female', floorNumber: number) => {
        const floorKey = floorNumber.toString();
        const currentRooms = roomData[gender].floors[floorKey] || [];

        const roomNumber = currentRooms.length + 1;
        let roomName =
            namingOption === 'auto'
                ? `${gender === 'male' ? 'M' : 'F'}${floorNumber}${roomNumber.toString().padStart(2, '0')}`
                : `Room ${roomNumber}`;

        const newRoom: Room = {
            roomId: 0,
            roomCode: `${gender === 'male' ? 'M' : 'F'}${floorNumber}-${roomNumber.toString().padStart(2, '0')}`,
            roomName,
            roomCapacity: 4,
            isFull: false,
            subGroups: [],
            stayers: { leaderIds: [], studentIds: [] },
        };

        onRoomDataChange({
            ...roomData,
            [gender]: {
                ...roomData[gender],
                floors: {
                    ...roomData[gender].floors,
                    [floorKey]: [...currentRooms, newRoom],
                },
            },
        });

        setLastAction((prev) => [
            ...prev,
            {
                roomId: 0,
                roomCode: newRoom.roomCode,
                roomName: newRoom.roomName,
                floor: floorNumber,
                gender: gender === 'male' ? 'M' : 'F',
                capacity: newRoom.roomCapacity,
                actionType: 'added',
            },
        ]);
    };

    // 1. Change function signature
    const removeRoom = (
        gender: 'male' | 'female',
        floorNumber: number,
        roomCode: string
    ) => {
        const floorKey = floorNumber.toString();

        // Find the room we're trying to delete
        const roomToDelete = (roomData[gender].floors[floorKey] || []).find(
            (r) => r.roomCode === roomCode
        );

        if (!roomToDelete) return;

        const totalOccupancy =
            roomToDelete.stayers.leaderIds.length + roomToDelete.stayers.studentIds.length;

        if (totalOccupancy > 0) {
            showAlert(
                `Cannot delete: Room ${roomToDelete.roomName} has ${totalOccupancy} occupants.`,
                'error',
                roomToDelete.roomId,
                roomToDelete.roomCode
            );
            return;
        }

        // Extract floor from room code for lastAction
        const floorFromCode = parseInt(roomToDelete.roomCode.match(/\d+/)?.[0] || '0');

        // Remove the room
        onRoomDataChange({
            ...roomData,
            [gender]: {
                ...roomData[gender],
                floors: {
                    ...roomData[gender].floors,
                    [floorKey]: (roomData[gender].floors[floorKey] || []).filter(
                        (r) => r.roomCode !== roomCode
                    ),
                },
            },
        });

        // Update lastAction
        setLastAction((prev) => {
            // For new rooms (roomId === 0) → remove the "added" entry
            if (roomToDelete.roomId === 0) {
                return prev.filter(
                    (a) =>
                        !(
                            a.roomId === 0 &&
                            a.roomCode === roomCode &&
                            a.actionType === 'added'
                        )
                );
            }

            // For existing rooms → add "removed" action + remove any "changed"
            return [
                ...prev.filter((a) => !(a.roomCode === roomCode && a.actionType === 'changed')),
                {
                    roomId: roomToDelete.roomId,
                    roomCode: roomToDelete.roomCode,
                    roomName: roomToDelete.roomName,
                    floor: floorFromCode, // Use floor from room code
                    gender: gender === 'male' ? 'M' : 'F',
                    capacity: roomToDelete.roomCapacity,
                    actionType: 'removed',
                },
            ];
        });
    };

    // ────────────────────────────────────────────────
    // Capacity Editing (FIXED VERSION)
    // ────────────────────────────────────────────────

    const startEditCapacity = (
        gender: 'male' | 'female',
        floorNumber: number,
        roomCode: string,
        currentCapacity: number
    ) => {
        const floorKey = floorNumber.toString();
        const room = (roomData[gender].floors[floorKey] || []).find((r) => r.roomCode === roomCode);
        if (room) {
            const occupancy = room.stayers.leaderIds.length + room.stayers.studentIds.length;
            setEditingCapacity({
                roomCode: room.roomCode,
                gender,
                floorNumber,
                tempValue: currentCapacity,
                occupancy,
            });
        }
    };

    const saveCapacity = (gender: 'male' | 'female', floorNumber: number, roomCode: string) => {
        if (!editingCapacity || editingCapacity.roomCode !== roomCode) return;

        const floorKey = floorNumber.toString();
        const room = (roomData[gender].floors[floorKey] || []).find((r) => r.roomCode === roomCode);
        if (!room) return;

        const occupancy = room.stayers.leaderIds.length + room.stayers.studentIds.length;
        const oldCapacity = room.roomCapacity;
        const newCapacity = editingCapacity.tempValue;

        // ── Validation & auto-correct ────────────────────────────────
        if (newCapacity < occupancy) {
            showAlert(
                `Capacity cannot be lower than current occupancy (${occupancy}). Adjusted to ${occupancy}.`,
                'error',
                room.roomId,
                room.roomCode
            );

            // Auto-correct
            onRoomDataChange({
                ...roomData,
                [gender]: {
                    ...roomData[gender],
                    floors: {
                        ...roomData[gender].floors,
                        [floorKey]: (roomData[gender].floors[floorKey] || []).map((r) =>
                            r.roomCode === roomCode
                                ? { ...r, roomCapacity: occupancy, isFull: true }
                                : r
                        ),
                    },
                },
            });

            // Update lastAction (use the corrected value)
            updateLastActionCapacity(roomCode, occupancy, room);
        } else {
            // Normal change
            onRoomDataChange({
                ...roomData,
                [gender]: {
                    ...roomData[gender],
                    floors: {
                        ...roomData[gender].floors,
                        [floorKey]: (roomData[gender].floors[floorKey] || []).map((r) =>
                            r.roomCode === roomCode
                                ? { ...r, roomCapacity: newCapacity, isFull: occupancy >= newCapacity }
                                : r
                        ),
                    },
                },
            });

            // If capacity actually changed → update lastAction
            if (newCapacity !== oldCapacity) {
                updateLastActionCapacity(roomCode, newCapacity, room);

                // Optional: success message only on increase (as in original)
                if (newCapacity > oldCapacity) {
                    showAlert(
                        `Room capacity updated to ${newCapacity}`,
                        'success',
                        room.roomId,
                        room.roomCode
                    );
                }
            }
        }

        setEditingCapacity(null);
    };

    const updateLastActionCapacity = (roomCode: string, newCapacity: number, room: Room) => {
        // Extract floor from room code (e.g., "F1-02" → 1)
        const floorFromCode = parseInt(roomCode.match(/\d+/)?.[0] || '0');

        setLastAction((prev) =>
            prev.map((action) => {
                // For newly added rooms → update the "added" entry
                if (action.roomCode === roomCode && action.actionType === 'added') {
                    return { ...action, capacity: newCapacity };
                }

                // For existing rooms → update or add "changed" entry
                if (action.roomCode === roomCode && action.actionType === 'changed') {
                    return { ...action, capacity: newCapacity };
                }

                return action;
            }).concat(
                // If it was an existing room and no "changed" entry existed yet → add one
                room.roomId !== 0 &&
                    !prev.some((a) => a.roomCode === roomCode && a.actionType === 'changed')
                    ? [{
                        roomId: room.roomId,
                        roomCode: room.roomCode,
                        roomName: room.roomName,
                        floor: floorFromCode, // Use extracted floor
                        gender: roomCode.startsWith('M') ? 'M' : 'F',
                        capacity: newCapacity,
                        actionType: 'changed',
                    }]
                    : []
            )
        );
    };
    // Removed unused startEditRoomName

    const saveRoomName = (gender: 'male' | 'female', floorNumber: number, roomCode: string) => {
        const floorKey = floorNumber.toString();
        const roomIndex = (roomData[gender].floors[floorKey] || []).findIndex(
            (r) => r.roomCode === roomCode
        );
        if (roomIndex === -1) return;

        const existingRoom = roomData[gender].floors[floorKey][roomIndex];
        const newName = tempRoomName.trim();

        if (newName === '') {
            showAlert('Room name cannot be empty', 'error', existingRoom.roomId);
            return;
        }

        if (newName === existingRoom.roomName) {
            setEditingRoom(null);
            setTempRoomName('');
            return;
        }

        const updatedRooms = [...roomData[gender].floors[floorKey]];
        updatedRooms[roomIndex] = { ...existingRoom, roomName: newName };

        onRoomDataChange({
            ...roomData,
            [gender]: {
                ...roomData[gender],
                floors: {
                    ...roomData[gender].floors,
                    [floorKey]: updatedRooms,
                },
            },
        });

        setLastAction((prev) => {
            const filtered = prev.filter(
                (a) => !(a.roomCode === roomCode && a.actionType === 'changed')
            );

            if (existingRoom.roomId !== 0) {
                return [
                    ...filtered,
                    {
                        roomId: existingRoom.roomId,
                        roomCode,
                        roomName: newName,
                        floor: floorNumber,
                        gender: gender === 'male' ? 'M' : 'F',
                        capacity: existingRoom.roomCapacity,
                        actionType: 'changed' as const,
                    },
                ];
            }

            return prev.map((a) =>
                a.roomCode === roomCode && a.actionType === 'added'
                    ? { ...a, roomName: newName }
                    : a
            );
        });

        setEditingRoom(null);
        setTempRoomName('');
    };

    const cancelEditRoomName = () => {
        setEditingRoom(null);
        setTempRoomName('');
    };

    // ────────────────────────────────────────────────
    // RENDER
    // ────────────────────────────────────────────────

    return (
        <div className="space-y-6 bg-transparent rounded-xl">
            {/* Gender Tabs */}
            <div className="flex flex-col gap-4 p-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-4">

                    {/* Segmented Control Tabs */}
                    <nav
                        className="inline-flex p-1 bg-gray-200/50 dark:bg-gray-800/50 rounded-xl"
                        aria-label="Gender Tabs"
                    >
                        {(['male', 'female', 'eventStayConfig'] as const).map((g) => {
                            const hasUnsavedChanges = g === 'eventStayConfig' ? hasEventStayConfigUnsaved : lastAction.some(
                                (action) =>
                                    (action.gender === 'M' && g === 'male') ||
                                    (action.gender === 'F' && g === 'female')
                            );

                            const isActive = activeSubTab === g;

                            return (
                                <button
                                    key={g}
                                    onClick={() => setActiveSubTab(g)}
                                    className={`
                            relative flex items-center gap-2 px-6 py-2 text-sm font-semibold
                            transition-all duration-300 rounded-lg
                            ${isActive
                                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }
                        `}
                                >
                                    {g === 'eventStayConfig' ? (
                                        <FiSettings
                                            className={`text-lg ${isActive ? 'text-indigo-500' : 'text-gray-400'
                                                }`}
                                        />
                                    ) : (
                                        <FiUsers
                                            className={`text-lg ${isActive ? 'text-indigo-500' : 'text-gray-400'
                                                }`}
                                        />
                                    )}

                                    <span>
                                        {g === 'eventStayConfig' ? 'Event Stay Config' : g.charAt(0).toUpperCase() + g.slice(1)}
                                    </span>

                                    {/* Count Badge */}
                                    {g !== 'eventStayConfig' && (
                                        <span
                                            className={`
                                ml-1 px-1.5 py-0.5 text-[10px] rounded-md
                                ${isActive
                                                    ? 'bg-indigo-50 text-indigo-600'
                                                    : 'bg-gray-300/30 text-gray-500'
                                                }
`}
                                        >
                                            {floorDataJson[g as 'male' | 'female'].floorCount.length}
                                        </span>
                                    )}

                                    {/* Minimalist Notification Dot */}
                                    {hasUnsavedChanges && (
                                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Modern Status Pill */}
                    <div className="flex items-center">
                        {lastAction.length > 0 ? (
                            <div className="flex items-center gap-2 pl-2 pr-4 py-1.5 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-full shadow-sm">
                                <div className="flex -space-x-1">
                                    <div className="z-10 bg-orange-500 text-white rounded-full p-1 ring-2 ring-white dark:ring-gray-900">
                                        <FiAlertCircle className="w-3 h-3" />
                                    </div>
                                </div>

                                <span className="text-orange-700 dark:text-orange-300 text-xs font-bold tracking-wide uppercase">
                                    {lastAction.length} Changes Pending
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-full shadow-sm">
                                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />

                                <span className="text-emerald-700 dark:text-emerald-300 text-xs font-bold tracking-wide uppercase">
                                    System Synced
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {activeSubTab === 'eventStayConfig' ? (
                <EventStayConfigTab eventId={eventId} namingOption={namingOption} onNamingChange={onNamingChange} onSaveSuccess={handleEventStayConfigSaveSuccess} onUnsavedChange={onEventStayConfigUnsaved} resetUnsaved={shouldResetEventStayConfig} onResetAcknowledged={handleResetAcknowledged} />
            ) : (
                <>
                    {/* Floors Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {gender === 'male' ? <FiUsers className="text-2xl" /> : <FiUsers className="text-2xl" />}
                                {gender.charAt(0).toUpperCase() + gender.slice(1)} Floors
                            </h2>
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => addFloor(gender)}
                                    className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg"
                                >
                                    <FiPlus className="mr-2" />
                                    Add Floor
                                </button>
                                <button
                                    onClick={handleSaveFloorSettings}
                                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg"
                                >
                                    <FiSave className="mr-2" />
                                    Save All
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {floorDataJson[gender].floorCount.map((floorNumber) => {
                                const floorKey = floorNumber.toString();
                                const floorRooms = roomData[gender]?.floors?.[floorKey] || [];

                                return (
                                    <div
                                        key={floorNumber}
                                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative"
                                    >
                                        {alert.visible && alert.floorId === floorKey && (
                                            <div className="absolute inset-0 z-30 flex items-center justify-center p-4 rounded-lg overflow-hidden">
                                                <div className="absolute inset-0 bg-black/50 backdrop-blur-md animate-in fade-in duration-500" />
                                                <div className="relative w-full max-w-[280px] group">
                                                    <div
                                                        className={`absolute inset-0 blur-2xl opacity-40 mix-blend-screen animate-pulse ${alert.type === 'error'
                                                            ? 'bg-red-500'
                                                            : alert.type === 'success'
                                                                ? 'bg-emerald-500'
                                                                : 'bg-amber-500'
                                                            }`}
                                                    />
                                                    <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-300">
                                                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                                                        <div className="p-7 flex flex-col items-center">
                                                            <div
                                                                className={`mb-4 p-3 rounded-2xl ${alert.type === 'error'
                                                                    ? 'text-red-400 bg-red-500/20'
                                                                    : alert.type === 'success'
                                                                        ? 'text-emerald-400 bg-emerald-500/20'
                                                                        : 'text-amber-400 bg-amber-500/20'
                                                                    }`}
                                                            >
                                                                {alert.type === 'error' && (
                                                                    <FiAlertCircle size={28} className="animate-pulse" />
                                                                )}
                                                                {alert.type === 'success' && (
                                                                    <FiCheckCircle size={28} className="animate-in zoom-in duration-500" />
                                                                )}
                                                                {alert.type === 'warning' && <FiAlertCircle size={28} />}
                                                            </div>
                                                            <div className="text-center mb-5">
                                                                <p
                                                                    className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 ${alert.type === 'error'
                                                                        ? 'text-red-400'
                                                                        : alert.type === 'success'
                                                                            ? 'text-emerald-400'
                                                                            : 'text-amber-400'
                                                                        }`}
                                                                >
                                                                    {alert.type}
                                                                </p>
                                                                <p className="text-white text-[14px] font-semibold leading-tight px-1">
                                                                    {alert.message}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => setAlert((prev) => ({ ...prev, visible: false }))}
                                                                className="w-full py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-100 active:scale-95 transition-all shadow-md"
                                                            >
                                                                Dismiss
                                                            </button>
                                                        </div>
                                                        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/10">
                                                            <div
                                                                className={`h-full animate-out slide-out-to-right fill-mode-forwards duration-[3000ms] origin-left ${alert.type === 'error'
                                                                    ? 'bg-red-500 shadow-red-500/50'
                                                                    : alert.type === 'success'
                                                                        ? 'bg-emerald-500 shadow-emerald-500/50'
                                                                        : 'bg-amber-500 shadow-amber-500/50'
                                                                    }`}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 px-6 py-4 border-b border-indigo-600">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                                        {floorNumber}
                                                    </div>
                                                    <div>
                                                        {editingFloor === `${gender}-${floorNumber}` ? (
                                                            <div className="flex items-center space-x-2">
                                                                <input
                                                                    type="number"
                                                                    value={tempFloorNumber}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;
                                                                        if (value === '') {
                                                                            setTempFloorNumber(1);
                                                                        } else {
                                                                            const numValue = parseInt(value);
                                                                            if (!isNaN(numValue) && numValue > 0) {
                                                                                setTempFloorNumber(numValue);
                                                                            }
                                                                        }
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            if (tempFloorNumber > 0) {
                                                                                saveFloorNumber(gender, floorNumber, tempFloorNumber);
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="w-20 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                                                    placeholder="Floor number"
                                                                    min="1"
                                                                    autoFocus
                                                                    onBlur={() => {
                                                                        if (!tempFloorNumber || tempFloorNumber <= 0) {
                                                                            setTempFloorNumber(1);
                                                                        }
                                                                    }}
                                                                />
                                                                <button
                                                                    onClick={() => saveFloorNumber(gender, floorNumber, tempFloorNumber)}
                                                                    disabled={!tempFloorNumber || tempFloorNumber <= 0}
                                                                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={cancelEditFloorNumber}
                                                                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <h3 className="text-lg font-semibold text-white">Floor {floorNumber}</h3>
                                                                <p className="text-sm text-white/80">{floorRooms.length} Rooms</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {editingFloor !== `${gender}-${floorNumber}` && (
                                                        <button
                                                            onClick={() => startEditFloorNumber(gender, floorNumber)}
                                                            className="p-2 text-white hover:text-white/80 transition-all duration-200 bg-white/20 rounded-lg hover:bg-white/30"
                                                        >
                                                            <FiEdit />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => removeFloor(gender, floorNumber)}
                                                        disabled={floorDataJson[gender].floorCount.length <= 1}
                                                        className="p-2 text-white hover:text-white/80 dark:text-white/70 dark:hover:text-white disabled:text-white/40 dark:disabled:text-white/30 disabled:cursor-not-allowed transition-all duration-200 bg-white/20 rounded-lg hover:bg-white/30 disabled:bg-white/10 dark:disabled:bg-white/5"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                    Rooms ({floorRooms.length})
                                                </h3>
                                                <button
                                                    onClick={() => addRoom(gender, floorNumber)}
                                                    className="flex items-center px-3 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 transition-all duration-200 text-xs font-semibold shadow-sm"
                                                >
                                                    <FiPlus className="mr-1.5 text-sm" />
                                                    Add
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                {floorRooms.map((room) => {
                                                    const occupancy = room.stayers.leaderIds.length + room.stayers.studentIds.length;
                                                    const isEditingThisRoom = editingCapacity?.roomCode === room.roomCode;

                                                    return (
                                                        <div
                                                            key={room.roomCode}
                                                            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 group relative hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 overflow-hidden"
                                                        >
                                                            {alert.visible && alert.roomCode === room.roomCode && (
                                                                <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                                                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-lg animate-in fade-in duration-500" />
                                                                    <div className="relative w-full max-w-[240px] group">
                                                                        <div
                                                                            className={`absolute inset-0 blur-3xl opacity-40 mix-blend-screen transition-colors duration-500 animate-pulse ${alert.type === 'error'
                                                                                ? 'bg-red-500'
                                                                                : alert.type === 'success'
                                                                                    ? 'bg-emerald-500'
                                                                                    : 'bg-amber-500'
                                                                                }`}
                                                                        />
                                                                        <div className="relative overflow-hidden rounded-[2rem] border border-white/30 bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
                                                                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                                                                            <div className="p-6 flex flex-col items-center">
                                                                                <div
                                                                                    className={`mb-3 p-3 rounded-2xl shadow-inner ${alert.type === 'error'
                                                                                        ? 'text-red-400 bg-red-500/15'
                                                                                        : alert.type === 'success'
                                                                                            ? 'text-emerald-400 bg-emerald-500/15'
                                                                                            : 'text-amber-400 bg-amber-500/15'
                                                                                        }`}
                                                                                >
                                                                                    {alert.type === 'error' && (
                                                                                        <FiAlertCircle
                                                                                            size={28}
                                                                                            className="drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]"
                                                                                        />
                                                                                    )}
                                                                                    {alert.type === 'success' && (
                                                                                        <FiCheckCircle
                                                                                            size={28}
                                                                                            className="drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                                                                                        />
                                                                                    )}
                                                                                    {alert.type === 'warning' && (
                                                                                        <FiAlertCircle
                                                                                            size={28}
                                                                                            className="drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                                                                                        />
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-center space-y-1 mb-4">
                                                                                    <p
                                                                                        className={`text-[10px] font-black uppercase tracking-[0.3em] drop-shadow-sm ${alert.type === 'error'
                                                                                            ? 'text-red-400'
                                                                                            : alert.type === 'success'
                                                                                                ? 'text-emerald-400'
                                                                                                : 'text-amber-400'
                                                                                            }`}
                                                                                    >
                                                                                        {alert.type}
                                                                                    </p>
                                                                                    <p className="text-white text-[13px] font-semibold leading-tight tracking-tight">
                                                                                        {alert.message}
                                                                                    </p>
                                                                                </div>
                                                                                <button
                                                                                    onClick={() => setAlert((prev) => ({ ...prev, visible: false }))}
                                                                                    className="w-full py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all active:scale-95 shadow-lg"
                                                                                >
                                                                                    Got it
                                                                                </button>
                                                                            </div>
                                                                            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/5">
                                                                                <div
                                                                                    className={`h-full animate-out slide-out-to-right fill-mode-forwards duration-[3500ms] origin-left shadow-[0_0_8px] ${alert.type === 'error'
                                                                                        ? 'bg-red-500 shadow-red-500/50'
                                                                                        : alert.type === 'success'
                                                                                            ? 'bg-emerald-500 shadow-emerald-500/50'
                                                                                            : 'bg-amber-500 shadow-amber-500/50'
                                                                                        }`}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <div className="mb-3">
                                                                        {editingRoom === room.roomCode && namingOption === 'manual' ? (
                                                                            <div className="flex items-center space-x-2">
                                                                                <input
                                                                                    type="text"
                                                                                    value={tempRoomName}
                                                                                    onChange={(e) => setTempRoomName(e.target.value)}
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === 'Enter') {
                                                                                            e.preventDefault();
                                                                                            if (tempRoomName.trim() !== '') {
                                                                                                saveRoomName(gender, floorNumber, room.roomCode);
                                                                                            }
                                                                                        }
                                                                                    }}
                                                                                    onBlur={() => {
                                                                                        if (tempRoomName.trim() !== '') {
                                                                                            saveRoomName(gender, floorNumber, room.roomCode);
                                                                                        } else {
                                                                                            cancelEditRoomName();
                                                                                        }
                                                                                    }}
                                                                                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                                                                    placeholder="Enter room name"
                                                                                    autoFocus
                                                                                />
                                                                                <button
                                                                                    onClick={() => saveRoomName(gender, floorNumber, room.roomCode)}
                                                                                    disabled={!tempRoomName.trim()}
                                                                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                                                                                >
                                                                                    Save
                                                                                </button>
                                                                                <button
                                                                                    onClick={cancelEditRoomName}
                                                                                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center justify-between w-full">
                                                                                <div className="flex items-center space-x-2">
                                                                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                                                        {room.roomName.charAt(0)}
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                                                            {room.roomName}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                {namingOption === 'manual' && (
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setEditingRoom(room.roomCode);
                                                                                            setTempRoomName(room.roomName);
                                                                                        }}
                                                                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-all duration-200 bg-indigo-50 dark:bg-indigo-900/20 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                                                                                    >
                                                                                        <FiEdit size={16} />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                                                        <div>
                                                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">
                                                                                Capacity
                                                                            </label>
                                                                            <div className="relative">
                                                                                {isEditingThisRoom ? (
                                                                                    // ── Edit mode ────────────────────────────────
                                                                                    <div className="flex items-center gap-2">
                                                                                        <input
                                                                                            type="number"
                                                                                            value={editingCapacity?.tempValue ?? room.roomCapacity}
                                                                                            onChange={(e) => {
                                                                                                const val = e.target.value;
                                                                                                if (val === '') {
                                                                                                    setEditingCapacity(prev => prev ? { ...prev, tempValue: 0 } : null);
                                                                                                    return;
                                                                                                }
                                                                                                const num = parseInt(val, 10);
                                                                                                if (!isNaN(num) && num >= 0) {
                                                                                                    setEditingCapacity(prev => prev ? { ...prev, tempValue: num } : null);
                                                                                                }
                                                                                            }}
                                                                                            onKeyDown={(e) => {
                                                                                                if (e.key === 'Enter') {
                                                                                                    e.preventDefault();
                                                                                                    saveCapacity(gender, floorNumber, room.roomCode);
                                                                                                }
                                                                                                if (e.key === 'Escape') {
                                                                                                    setEditingCapacity(null);
                                                                                                }
                                                                                            }}
                                                                                            className="w-full border border-indigo-400 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                                            min="1"
                                                                                            autoFocus
                                                                                        />
                                                                                        <button
                                                                                            onClick={() => saveCapacity(gender, floorNumber, room.roomCode)}
                                                                                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                                                                                            title="Save"
                                                                                        >
                                                                                            <FiCheckCircle size={18} />
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => setEditingCapacity(null)}
                                                                                            className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
                                                                                            title="Cancel"
                                                                                        >
                                                                                            <FiX size={18} /> {/* ← add FiX to imports if needed */}
                                                                                        </button>
                                                                                    </div>
                                                                                ) : (
                                                                                    // ── View mode (click to edit) ────────────────
                                                                                    <div
                                                                                        onClick={() => startEditCapacity(gender, floorNumber, room.roomCode, room.roomCapacity)}
                                                                                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 cursor-pointer hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors flex items-center justify-between"
                                                                                        tabIndex={0}
                                                                                        role="button"
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                                                e.preventDefault();
                                                                                                startEditCapacity(gender, floorNumber, room.roomCode, room.roomCapacity);
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <span>{room.roomCapacity}</span>
                                                                                        <FiEdit size={14} className="text-gray-400" />
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {isEditingThisRoom && editingCapacity.tempValue < occupancy && (
                                                                                <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                                                                                    ⚠️ Warn: Minimum Capacity {occupancy}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                                                                Occupancy Details
                                                                            </label>
                                                                            <div className="text-xs space-y-1.5 bg-gray-100 dark:bg-gray-800 p-2.5 rounded-md">
                                                                                <div className="flex justify-between items-center">
                                                                                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                                                                        <FiUser className="text-sm" /> Leaders:
                                                                                    </span>
                                                                                    <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                                                                                        {room.stayers.leaderIds.length}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex justify-between items-center">
                                                                                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                                                                        <FiUsers className="text-sm" /> Students:
                                                                                    </span>
                                                                                    <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                                                                                        {room.stayers.studentIds.length}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="border-t border-gray-300 dark:border-gray-600 pt-1.5 mt-1.5">
                                                                                    <div className="flex justify-between items-center">
                                                                                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                                                                            <FiBarChart2 className="text-sm" /> Occupancy:
                                                                                        </span>
                                                                                        <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">
                                                                                            {occupancy} / {room.roomCapacity}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex justify-between items-center mt-1">
                                                                                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                                                                            <FiTrendingUp className="text-sm" /> Vacancy:
                                                                                        </span>
                                                                                        <span
                                                                                            className={`font-bold text-sm ${occupancy >= room.roomCapacity
                                                                                                ? 'text-red-600 dark:text-red-400'
                                                                                                : 'text-emerald-600 dark:text-emerald-400'
                                                                                                }`}
                                                                                        >
                                                                                            {Math.max(0, room.roomCapacity - occupancy)}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="mt-2">
                                                                        {occupancy >= room.roomCapacity ? (
                                                                            <span className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-800/40 dark:text-red-300 rounded-md font-bold gap-1">
                                                                                <FiCircle className="text-xs fill-current" /> FULL
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-800/40 dark:text-green-300 rounded-md font-bold gap-1">
                                                                                <FiCircle className="text-xs fill-current" /> AVAILABLE
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <button
                                                                    onClick={() => removeRoom(gender, floorNumber, room.roomCode)}
                                                                    className="ml-3 p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all duration-200 bg-red-50 dark:bg-red-900/20 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                                                                >
                                                                    <FiTrash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}


            {/* <div className="bg-slate-900/40 dark:bg-slate-800 rounded-lg p-5 border border-slate-700 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-blue-400">
                        <FiCode className="text-xl" />
                        <h3 className="text-sm font-bold uppercase tracking-widest font-mono">Room Data</h3>
                    </div>
                    <div className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border bg-blue-500/10 text-blue-500 border-blue-500/20">
                        LIVE DATA
                    </div>
                </div>
                <div className="font-mono text-[11px] text-blue-200 leading-relaxed bg-black/40 p-4 rounded border border-white/5 overflow-x-auto max-h-96 overflow-y-auto">
                    <pre>{JSON.stringify(roomData, null, 2)}</pre>
                </div>
            </div>

            {lastAction.length > 0 && (
                <div className="mt-8 bg-emerald-900/20 rounded-xl p-6 border border-emerald-800 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <FiSave className="text-xl" />
                            <h3 className="text-sm font-bold uppercase tracking-widest font-mono">Last Action</h3>
                        </div>
                        <div className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 animate-pulse">
                            UPDATED
                        </div>
                    </div>
                    <div className="font-mono text-[12px] text-emerald-200 leading-relaxed bg-black/40 p-4 rounded border border-emerald-500/20 overflow-x-auto max-h-96 overflow-y-auto">
                        <pre>{JSON.stringify(lastAction, null, 2)}</pre>
                    </div>
                </div>
            )}*/}
        </div>
    );
}

export default FloorTabCompound;
