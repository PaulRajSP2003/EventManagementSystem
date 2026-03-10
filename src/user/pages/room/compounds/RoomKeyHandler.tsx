// src/user/pages/room/compounds/RoomKeyHandler.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentListCompound from '../../components/StudentListCompound';
import LeaderListCompound from '../../components/LeaderListCompound';
import { PAGE_PERMISSIONS, canAccess, isAdminOrCoAdmin, fetchPermissionData, type PermissionData } from '../../permission';
import { FiAlertTriangle, FiEdit2, FiRotateCcw } from 'react-icons/fi';

// ────────────────────────────────────────────────
// Interfaces
// ────────────────────────────────────────────────
interface KeyHolder {
  type: 'L' | 'S';
  id: number;
  name?: string;
}

interface KeyRecord {
  id: number;
  status: 'AVAILABLE' | 'ISSUED' | 'RETURNED' | 'LOST';
  holder: KeyHolder;
  issuedAt: string;
  returnedAt: string | null;
  notes?: string;
}

interface RoomKeyData {
  roomId: string;
  keyHistory: KeyRecord[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface RoomKeyHandlerProps {
  roomName?: string;
  roomId?: string;
  initialData?: RoomKeyData;
}

// API Base URL - move to env variable in production
const API_BASE_URL = 'https://localhost:7135/api';

// ────────────────────────────────────────────────
// Skeleton Loader Component (Compact Version)
// ────────────────────────────────────────────────
const SkeletonLoader = () => {
  return (
    <div className="w-full font-sans animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                {[1, 2, 3, 4, 5].map((i) => (
                  <th key={i} className="px-6 py-4">
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {[1, 2, 3, 4, 5].map((row) => (
                <tr key={row}>
                  <td className="px-6 py-4">
                    <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────
const RoomKeyHandler: React.FC<RoomKeyHandlerProps> = ({
  roomName,
  roomId,
}) => {
  const navigate = useNavigate();
  
  // Permission data state
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [data, setData] = useState<RoomKeyData>({ roomId: roomId || '', keyHistory: [] });
  const [showModal, setShowModal] = useState(false);
  const [viewRecord, setViewRecord] = useState<KeyRecord | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confirmation modal states
  const [showLostConfirmation, setShowLostConfirmation] = useState(false);
  const [pendingLostRecordId, setPendingLostRecordId] = useState<number | null>(null);
  const [lostNotes, setLostNotes] = useState('');

  // Form Inputs
  const [holderType, setHolderType] = useState<KeyHolder['type']>('S');
  const [holderId, setHolderId] = useState('');
  const [holderName, setHolderName] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch permission data on component mount
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setPermissionLoading(true);
        setPermissionError(false);
        const data = await fetchPermissionData();
        setPermissionData(data);
      } catch (error: any) {
        console.error('Failed to load permissions:', error);
        setPermissionData(null);
        setPermissionError(true);
        
        // Check for 403 Forbidden error
        if (error.message === 'Forbidden' || error.message?.includes('403')) {
          setErrorMessage("Access Forbidden: You don't have permission");
        } else if (error.message === 'Unauthorized' || error.message?.includes('401')) {
          setErrorMessage("Unauthorized: Please log in");
        } else {
          setErrorMessage(error.message || 'Failed to load permissions');
        }
      } finally {
        setPermissionLoading(false);
      }
    };

    loadPermissions();
  }, []);

  // Permission checks using ONLY permissionData
  const hasKeyHandingAccess = () => {
    if (!permissionData || permissionError) return false;
    return canAccess(permissionData, PAGE_PERMISSIONS.KEY_HANDING);
  };

  const isAdmin = () => {
    if (!permissionData || permissionError) return false;
    return isAdminOrCoAdmin(permissionData);
  };

  // Get headers
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
    };
  };

  // Fetch key history on component mount
  useEffect(() => {
    if (roomId) {
      fetchKeyHistory();
    }
  }, [roomId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ────────────────────────────────────────────────
  // API Functions (using fetch)
  // ────────────────────────────────────────────────
  const fetchKeyHistory = async () => {
    if (!roomId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/key/list/${roomId}`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<KeyRecord[]> = await response.json();

      if (result.success) {
        setData({
          roomId: roomId,
          keyHistory: result.data
        });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveKeyTransaction = async (record: KeyRecord, isNew: boolean) => {
    if (!roomId) return null;

    setLoading(true);
    setError(null);

    try {
      // Convert record to API format
      const apiRecord = {
        id: isNew ? 0 : record.id,
        status: record.status,
        holder: {
          type: record.holder.type,
          id: record.holder.id,
          name: record.holder.name || ''
        },
        issuedAt: record.issuedAt,
        returnedAt: record.returnedAt,
        notes: record.notes || ''
      };

      const response = await fetch(`${API_BASE_URL}/key/${roomId}`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(apiRecord)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<KeyRecord> = await response.json();

      if (result.success) {
        // Refresh the list to get updated data
        await fetchKeyHistory();
        return result.data;
      } else {
        setError(result.message);
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Permission & Edit Window Logic
  // ────────────────────────────────────────────────
  const MINUTES_EDITS = 1 * 60 * 1000; // 1 minute in milliseconds

  const isWithinEditWindow = (issuedAt: string): boolean => {
    const issuedTime = new Date(issuedAt).getTime();
    return now.getTime() - issuedTime <= MINUTES_EDITS;
  };

  const canEditRecord = (record?: KeyRecord): boolean => {
    if (!record || !hasKeyHandingAccess()) return false;
    if (isAdmin()) return true;
    return true;
  };

  const canChangeHolder = (record?: KeyRecord): boolean => {
    if (!record) return false;
    // Prevent changing holder if status is RETURNED, LOST, or NEVER
    if (record.status === 'RETURNED' || record.status === 'LOST') return false;
    if (isAdmin()) return true;
    return isWithinEditWindow(record.issuedAt);
  };

  // ────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

  const calculateDuration = (start: string, end: string | null) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : now.getTime();
    const diffMs = endTime - startTime;
    const seconds = Math.floor(diffMs / 1000);
    const mins = Math.floor(seconds / 60);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100';
      case 'ISSUED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'RETURNED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'LOST': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getDisplayType = (type: 'L' | 'S'): string => type === 'L' ? 'LEADER' : 'STUDENT';

  const handleSelection = (person: any) => {
    if (person) {
      const extractedId = person.dbId || person.id;
      setHolderId(extractedId.toString());
      setHolderName(person.name);
    } else {
      setHolderId('');
      setHolderName('');
    }
  };

  const resetForm = () => {
    setHolderType('S');
    setHolderId('');
    setHolderName('');
    setNotes('');
    setEditingRecordId(null);
  };

  const handleViewProfile = (holder: KeyHolder) => {
    const id = holder.id;
    if (holder.type === 'S') navigate(`/user/student/${id}`);
    else if (holder.type === 'L') navigate(`/user/leader/${id}`);
  };

  const openEditModal = (record: KeyRecord) => {
    if (!canEditRecord(record)) {
      return;
    }

    setEditingRecordId(record.id);
    setHolderType(record.holder.type);
    setHolderId(record.holder.id.toString());
    setHolderName(record.holder.name || '');
    setNotes(record.notes || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!holderId.trim()) {
      return;
    }
    if (!hasKeyHandingAccess()) {
      return;
    }

    if (editingRecordId) {
      const recordToEdit = data.keyHistory.find(r => r.id === editingRecordId);
      if (!recordToEdit) return;

      // Create updated record
      const updatedRecord: KeyRecord = {
        ...recordToEdit,
        notes: notes.trim(),
        ...(canChangeHolder(recordToEdit) && {
          holder: { type: holderType, id: Number(holderId), name: holderName.trim() }
        })
      };

      // Save to API
      await saveKeyTransaction(updatedRecord, false);

    } else {
      // Create new entry
      const newEntry: KeyRecord = {
        id: 0,
        status: 'ISSUED',
        holder: { type: holderType, id: Number(holderId), name: holderName.trim() },
        issuedAt: new Date().toISOString(),
        returnedAt: null,
        notes: notes.trim(),
      };

      // Save to API
      await saveKeyTransaction(newEntry, true);
    }

    setShowModal(false);
    resetForm();
  };

  const handleLostClick = (recordId: number) => {
    if (!hasKeyHandingAccess()) return;
    setPendingLostRecordId(recordId);
    setLostNotes('');
    setShowLostConfirmation(true);
  };

  const confirmLostStatus = async () => {
    if (pendingLostRecordId === null) return;

    const record = data.keyHistory.find(r => r.id === pendingLostRecordId);
    if (!record) return;

    // Create updated record
    const updatedRecord: KeyRecord = {
      ...record,
      status: 'LOST',
      returnedAt: new Date().toISOString(),
      notes: lostNotes.trim() ? lostNotes : record.notes
    };

    // Save to API
    const savedRecord = await saveKeyTransaction(updatedRecord, false);

    if (savedRecord) {
      // Update local state
      setData(prev => ({
        ...prev,
        keyHistory: prev.keyHistory.map(r =>
          r.id === pendingLostRecordId ? savedRecord : r
        ),
      }));
    }

    // Close confirmation modal
    setShowLostConfirmation(false);
    setPendingLostRecordId(null);
    setLostNotes('');
    setViewRecord(null);
  };

  const handleUpdateStatus = async (recordId: number, status: KeyRecord['status']) => {
    if (!hasKeyHandingAccess()) return;

    const record = data.keyHistory.find(r => r.id === recordId);
    if (!record) return;

    // Create updated record
    const updatedRecord: KeyRecord = {
      ...record,
      status,
      returnedAt: status === 'ISSUED' ? null : new Date().toISOString()
    };

    // Save to API
    const savedRecord = await saveKeyTransaction(updatedRecord, false);

    if (savedRecord) {
      // Update local state
      setData(prev => ({
        ...prev,
        keyHistory: prev.keyHistory.map(r =>
          r.id === recordId ? savedRecord : r
        ),
      }));
    }

    setViewRecord(null);
  };

  const activeRecord = [...data.keyHistory].reverse().find(r => r.status === 'ISSUED');
  const isKeyAvailable = !activeRecord;

  const isEditingOldRecord =
    editingRecordId !== null &&
    data.keyHistory.some(r => r.id === editingRecordId && !isWithinEditWindow(r.issuedAt));

  // Show skeleton while loading permissions or initial data
  if (permissionLoading || (loading && data.keyHistory.length === 0)) {
    return <SkeletonLoader />;
  }

  // Show error state
  if (error && data.keyHistory.length === 0) {
    return (
      <div className="w-full font-sans group">
        <div className="flex flex-col items-center py-12 px-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] transition-colors hover:border-slate-200 dark:hover:border-slate-700">

          {/* Simple Geometric Icon */}
          <div className="relative mb-6">
            <div className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-400 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-100">
              Data unavailable
            </h3>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              We couldn't reach the history service.
            </p>
          </div>

          <button
            onClick={fetchKeyHistory}
            className="mt-8 px-6 py-2 text-sm font-semibold tracking-tight text-slate-900 dark:text-white border border-slate-900 dark:border-white rounded-full hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all active:scale-95"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-sans">

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Key Management: Room {roomName || roomId || 'N/A'}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-3 h-3 rounded-full ${isKeyAvailable ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
            <p className="text-sm text-gray-500 font-medium capitalize">
              {isKeyAvailable ? 'Key is currently Available' : `Issued to ${activeRecord?.holder.name || 'Unknown'}`}
            </p>
          </div>
        </div>
        
        {/* Issue Key button - always visible, disabled if no permission */}
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          disabled={!isKeyAvailable || !hasKeyHandingAccess() || loading}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 ${
            isKeyAvailable && hasKeyHandingAccess() && !loading
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
          }`}
          title={!hasKeyHandingAccess() ? "You don't have permission to issue keys" : ""}
        >
          {loading ? 'Processing...' : 'Issue Key'}
        </button>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Custodian</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Time Issued</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {data.keyHistory
                .slice()
                .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
                .map(record => (
                  <tr
                    key={record.id}
                    onClick={() => setViewRecord(record)}
                    className="hover:bg-gray-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white text-sm capitalize">{record.holder.name || 'Anonymous'}</div>
                      <div className="text-[10px] text-gray-500 font-medium uppercase">
                        {getDisplayType(record.holder.type)} • ID #{record.holder.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center align-middle">
                      <span
                        className={`inline-block w-20 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${getStatusStyle(record.status)}`}
                      >
                        {record.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-500">{formatDate(record.issuedAt)}</td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                      {calculateDuration(record.issuedAt, record.returnedAt)}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {/* EDIT BUTTON - disabled if no permission */}
                      <button
                        onClick={() => openEditModal(record)}
                        disabled={!canEditRecord(record) || loading}
                        className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs rounded-md transition-all duration-200 shadow-sm active:scale-95 ${
                          canEditRecord(record) && !loading
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                        }`}
                        title={!hasKeyHandingAccess() ? "You don't have permission to edit keys" : ""}
                      >
                        <FiEdit2 className="w-3 h-3" />
                        Edit
                      </button>

                      {record.status === 'ISSUED' && (
                        <>
                          {/* RETURN BUTTON - disabled if no permission */}
                          <button
                            onClick={() => handleUpdateStatus(record.id, 'RETURNED')}
                            disabled={!hasKeyHandingAccess() || loading}
                            className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs rounded-md transition-all duration-200 shadow-sm active:scale-95 ${
                              hasKeyHandingAccess() && !loading
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                            }`}
                            title={!hasKeyHandingAccess() ? "You don't have permission to return keys" : ""}
                          >
                            <FiRotateCcw className="w-3 h-3" />
                            Return
                          </button>

                          {/* LOST BUTTON - disabled if no permission */}
                          <button
                            onClick={() => handleLostClick(record.id)}
                            disabled={!hasKeyHandingAccess() || loading}
                            className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs rounded-md transition-all duration-200 shadow-sm active:scale-95 ${
                              hasKeyHandingAccess() && !loading
                                ? 'bg-red-50 text-red-700 hover:bg-red-600 hover:text-white'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                            }`}
                            title={!hasKeyHandingAccess() ? "You don't have permission to mark keys as lost" : ""}
                          >
                            <FiAlertTriangle className="w-3 h-3" />
                            Lost
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              {data.keyHistory.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No key history found for this room.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lost Confirmation Modal */}
      {showLostConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">Confirm Lost</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Are you sure you want to mark this key as lost? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    placeholder="Add details about how the key was lost, circumstances, etc..."
                    value={lostNotes}
                    onChange={(e) => setLostNotes(e.target.value)}
                    className="w-full p-4 rounded-xl border dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-red-500 outline-none resize-y min-h-[100px]"
                    rows={4}
                    autoFocus
                  />
                </div>

                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-xl p-4">
                  <p className="text-xs text-red-800 dark:text-red-200 font-medium">
                    <span className="font-bold">Warning:</span> Marking a key as lost will close this transaction and record the current time as the return time.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowLostConfirmation(false);
                    setPendingLostRecordId(null);
                    setLostNotes('');
                  }}
                  disabled={loading}
                  className="flex-1 py-4 text-gray-500 dark:text-gray-400 font-bold hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLostStatus}
                  disabled={loading || !hasKeyHandingAccess()}
                  className={`flex-1 py-4 rounded-xl font-bold transition-all ${
                    hasKeyHandingAccess() && !loading
                      ? 'bg-red-600 text-white hover:bg-red-700 active:scale-95'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                  }`}
                  title={!hasKeyHandingAccess() ? "You don't have permission to mark keys as lost" : ""}
                >
                  {loading ? 'Processing...' : 'Confirm Lost'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {viewRecord && !showModal && !showLostConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">Log Details</h3>
                <button onClick={() => setViewRecord(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border dark:border-gray-700 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Active Duration</p>
                  <p className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">
                    {calculateDuration(viewRecord.issuedAt, viewRecord.returnedAt)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(viewRecord.status)}`}>
                  {viewRecord.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase">Custodian</p>
                  <p className="font-bold dark:text-white">{viewRecord.holder.name || '—'}</p>
                  <p className="text-gray-500">
                    {getDisplayType(viewRecord.holder.type)} (ID: {viewRecord.holder.id})
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase">Timeframe</p>
                  <p className="dark:text-gray-300"><b>Issued:</b> {formatDate(viewRecord.issuedAt)}</p>
                  <p className="dark:text-gray-300"><b>Return:</b> {viewRecord.returnedAt ? formatDate(viewRecord.returnedAt) : '—'}</p>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-400 rounded text-sm italic text-gray-700 dark:text-gray-300">
                "{viewRecord.notes || "No notes recorded for this transaction."}"
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleViewProfile(viewRecord.holder)}
                  className="w-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-3.5 rounded-xl font-bold transition hover:bg-blue-100"
                >
                  View {getDisplayType(viewRecord.holder.type).toLowerCase()} profile
                </button>
                <div className="flex gap-3">
                  {canEditRecord(viewRecord) && (
                    <button
                      onClick={() => { setViewRecord(null); openEditModal(viewRecord); }}
                      disabled={loading}
                      className="flex-1 border dark:border-gray-600 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                    >
                      Edit Log
                    </button>
                  )}
                  <button
                    onClick={() => setViewRecord(null)}
                    className={`${canEditRecord(viewRecord) ? 'flex-1' : 'w-full'} bg-gray-900 dark:bg-white dark:text-black text-white py-3 rounded-xl font-bold`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Issue Form Modal */}
      {showModal && !showLostConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl w-full max-w-md border dark:border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-3xl font-black mb-6 text-gray-900 dark:text-white">
              {editingRecordId ? 'Update Record' : 'Issue New Key'}
            </h2>

            {isEditingOldRecord && (
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl text-sm text-amber-800 dark:text-amber-200">
                <strong>Notice:</strong> The 1-minute edit window has expired.<br />
                You can still update <strong>notes</strong>, but the assigned person cannot be changed.
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Assign To</label>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                  {(['S', 'L'] as const).map(type => (
                    <button
                      key={type}
                      disabled={Boolean(isEditingOldRecord || loading || (editingRecordId && (() => {
                        const rec = data.keyHistory.find(r => r.id === editingRecordId);
                        return rec && !canChangeHolder(rec);
                      })())) || !hasKeyHandingAccess()}
                      onClick={() => {
                        if (!isEditingOldRecord && (!editingRecordId || (editingRecordId && (() => {
                          const rec = data.keyHistory.find(r => r.id === editingRecordId);
                          return rec && canChangeHolder(rec);
                        })()))) {
                          setHolderType(type);
                          setHolderId('');
                          setHolderName('');
                        }
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        holderType === type
                          ? 'bg-white dark:bg-gray-700 dark:text-white text-gray-900'
                          : 'text-gray-400 dark:text-gray-500'
                      } ${
                        Boolean(isEditingOldRecord || loading || (editingRecordId && (() => {
                          const rec = data.keyHistory.find(r => r.id === editingRecordId);
                          return rec && !canChangeHolder(rec);
                        })())) || !hasKeyHandingAccess() 
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                      }`}
                    >
                      {type === 'L' ? 'LEADER' : 'STUDENT'}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`transition-opacity ${isEditingOldRecord || loading || (editingRecordId && (() => {
                const rec = data.keyHistory.find(r => r.id === editingRecordId);
                return rec && !canChangeHolder(rec);
              })()) || !hasKeyHandingAccess() ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                {holderType === 'S' ? (
                  <StudentListCompound
                    onStudentSelect={handleSelection}
                    initialStudentId={editingRecordId ? Number(holderId) : undefined}
                  />
                ) : (
                  <LeaderListCompound
                    onLeaderSelect={handleSelection}
                    initialLeaderId={editingRecordId ? Number(holderId) : undefined}
                  />
                )}
              </div>

              {holderId && (
                <div className={`p-4 rounded-2xl border ${isEditingOldRecord ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'}`}>
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Selected Custodian</p>
                  <p className="font-bold dark:text-white text-lg capitalize">{holderName || '—'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getDisplayType(holderType)} • ID: {holderId}
                  </p>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Notes</label>
                <textarea
                  placeholder="Add internal notes about this handover..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  disabled={loading || !hasKeyHandingAccess()}
                  className="w-full p-4 rounded-xl border dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y min-h-[100px] disabled:opacity-50"
                  rows={4}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  disabled={loading}
                  className="flex-1 py-4 text-gray-500 dark:text-gray-400 font-bold hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={!holderId || !hasKeyHandingAccess() || loading}
                  onClick={handleSave}
                  className={`flex-1 py-4 rounded-xl font-bold transition-all ${
                    holderId && hasKeyHandingAccess() && !loading
                      ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                  title={!hasKeyHandingAccess() ? "You don't have permission to issue keys" : ""}
                >
                  {loading ? 'Saving...' : (editingRecordId ? 'Save Changes' : 'Confirm Issue')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomKeyHandler;