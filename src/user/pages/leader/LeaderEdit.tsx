// src/user/pages/leader/LeaderEdit.tsx
import { useState, useMemo, useEffect, useRef } from 'react';
import { FiArrowLeft, FiCheckCircle, FiMapPin, FiUser, FiEdit3, FiAlertTriangle } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Leader } from '../../../types';
import EmptyState from '../components/EmptyState';
import { PAGE_PERMISSIONS, canAccess, isAdminOrCoAdmin, fetchPermissionData, type PermissionData } from '../permission';
import { StickyHeader, AccessAlert } from '../components';
import { leaderAPI } from '../api/LeaderData';

const place_list = [
  "New York",
  "New Delhi",
  "London",
  "Los Angeles",
  "Paris",
  "Tokyo",
  "Sydney",
  "Mumbai",
  "Chicago",
  "Boston",
];

const LeaderEditSkeleton = () => (
  <div className="max-w-5xl mx-auto px-4 mt-2 sm:mt-8">
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="p-6 border-b border-slate-100">
        <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-64 bg-gray-200 rounded"></div>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i}>
              <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 w-full bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
        <div className="h-10 w-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

// Permission constant for this page
const PAGE_ID = PAGE_PERMISSIONS.LEADER_EDIT;

const LeaderEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const leaderIdFromUrl = Number(id);
  
  // Permission data state
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Groups come from PermissionData.groups
  const groups = permissionData?.groups || [];
  
  const [loading, setLoading] = useState(true);
  const [leader, setLeader] = useState<Leader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    gender: 'male' | 'female';
    place: string;
    contactNumber: string;
    whatsappNumber: string;
    churchName: string;
    staying: 'yes' | 'no';
    status: 'present' | 'registered' | 'absent';
    isFollowing: string;
    type: 'guest' | 'leader1' | 'leader2' | 'participant';
    remark: string;
    registered_mode: 'online' | 'offline';
  }>({
    name: '',
    gender: 'male',
    place: '',
    contactNumber: '',
    whatsappNumber: '',
    churchName: 'No',
    staying: 'no',
    status: 'registered',
    isFollowing: 'no',
    type: 'leader2',
    remark: '',
    registered_mode: 'offline',
  });

  const [typeOptions, setTypeOptions] = useState([
    { value: 'participant', label: 'Participant' },
    { value: 'guest', label: 'Guest' },
    { value: 'leader2', label: 'Leader 2' },
    { value: 'leader1', label: 'Leader 1' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccessActions, setShowSuccessActions] = useState(false);
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [contactNumberError, setContactNumberError] = useState(false);

  const churchNameRef = useRef<HTMLInputElement>(null);

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
        setAccessDenied(true);
        
        // Check for 403 Forbidden error
        if (error.message === 'Forbidden' || error.message?.includes('403')) {
          setErrorMessage("Access Forbidden: You don't have permission to access this resource");
        } else if (error.message === 'Unauthorized' || error.message?.includes('401')) {
          setErrorMessage("Unauthorized: Please log in to access this page");
        } else {
          setErrorMessage(error.message || 'Failed to load permissions');
        }
      } finally {
        setPermissionLoading(false);
      }
    };

    loadPermissions();
  }, []);

  // Permission check using ONLY permissionData
  const hasAccess = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return canAccess(permissionData, PAGE_ID);
  };

  // Check if user is admin or co-admin
  const isAdminUser = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return isAdminOrCoAdmin(permissionData);
  };

  // Check if user has permission to view leader list
  const canViewLeaderList = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return canAccess(permissionData, PAGE_PERMISSIONS.LEADER_LIST);
  };

  useEffect(() => {
    // Check access before loading data
    if (!hasAccess()) {
      setLoading(false);
      return;
    }

    const fetchLeader = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiLeader = await leaderAPI.getById(leaderIdFromUrl);
        if (!apiLeader) {
          throw new Error('Leader not found');
        }

        setLeader(apiLeader);
        setFormData({
          name: apiLeader.name || '',
          gender: apiLeader.gender || 'male',
          place: apiLeader.place || '',
          contactNumber: apiLeader.contactNumber || '',
          whatsappNumber: apiLeader.whatsappNumber || '',
          churchName: apiLeader.churchName || 'No',
          staying: apiLeader.staying || 'no',
          status: apiLeader.status || 'registered',
          isFollowing: apiLeader.isFollowing || 'no',
          type: apiLeader.type || 'leader2',
          remark: apiLeader.remark || '',
          registered_mode: apiLeader.registered_mode || 'offline',
        });
      
      } catch (err) {
        console.error('Failed to fetch leader:', err);
        
        // Check if it's a permission error
        const errorMsg = err instanceof Error ? err.message : 'Failed to load leader';
        if (errorMsg.toLowerCase().includes('forbidden') || 
            errorMsg.toLowerCase().includes('unauthorized') ||
            errorMsg.toLowerCase().includes('permission')) {
          setAccessDenied(true);
          setErrorMessage(errorMsg);
        } else {
          setError('Leader not found or failed to load');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchLeader();
  }, [id, leaderIdFromUrl, permissionData]);

  useEffect(() => {
    if (!hasAccess()) return;
    
    if (formData.isFollowing === 'no') {
      setTypeOptions([
        { value: 'participant', label: 'Participant' },
        { value: 'guest', label: 'Guest' },
      ]);
      if (!['participant', 'guest'].includes(formData.type)) {
        setFormData(prev => ({ ...prev, type: 'participant' }));
      }
    } else {
      setTypeOptions([
        { value: 'leader2', label: 'Leader 2' },
        { value: 'leader1', label: 'Leader 1' },
      ]);
      if (!['leader1', 'leader2'].includes(formData.type)) {
        setFormData(prev => ({ ...prev, type: 'leader2' }));
      }
    }
  }, [formData.isFollowing, permissionData]);

  const filteredPlaces = useMemo(() => {
    if (formData.place.length < 2) return [];
    return place_list.filter(p => p.toLowerCase().includes(formData.place.toLowerCase()));
  }, [formData.place]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (showSuccessActions || !hasAccess()) return;
    const { name, value } = e.target;

    if (['name', 'place'].includes(name)) {
      if (/^[a-zA-Z\s.\-']*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else if (['contactNumber', 'whatsappNumber'].includes(name)) {
      if (/^\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
      if (name === 'contactNumber') setContactNumberError(false);
    } else if (name === 'churchName') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (name === 'place') setShowPlaceSuggestions(value.length >= 2);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!hasAccess()) return;
    
    if (showPlaceSuggestions && filteredPlaces.length > 0) {
      if (e.key === 'ArrowDown') {
        setHighlightedIndex(prev => (prev + 1) % filteredPlaces.length);
      } else if (e.key === 'ArrowUp') {
        setHighlightedIndex(prev => (prev - 1 + filteredPlaces.length) % filteredPlaces.length);
      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
        setFormData(prev => ({ ...prev, place: filteredPlaces[highlightedIndex] }));
        setShowPlaceSuggestions(false);
        setHighlightedIndex(-1);
        e.preventDefault();
      }
    }
  };

  const handleChurchNameFocus = () => {
    if (hasAccess() && formData.churchName === 'No' && churchNameRef.current) {
      churchNameRef.current.select();
    }
  };

  const handleChurchNameBlur = () => {
    if (hasAccess() && formData.churchName.trim() === '') {
      setFormData(prev => ({ ...prev, churchName: 'No' }));
    }
  };

  const handleSameNumber = () => {
    if (!hasAccess()) return;
    
    if (formData.contactNumber.trim() === '') {
      setContactNumberError(true);
      document.getElementById('contactNumber')?.focus();
    } else {
      setFormData(prev => ({ ...prev, whatsappNumber: prev.contactNumber }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess()) return;
    
    setIsSubmitting(true);
    setMessage('');

    if (!formData.name.trim() || !formData.place.trim() || formData.contactNumber.length < 10) {
      setMessage('Please fill all required fields correctly.');
      setIsSubmitting(false);
      return;
    }

    const finalChurchName =
      formData.churchName.trim().toLowerCase() === 'no' || !formData.churchName.trim()
        ? 'no'
        : formData.churchName.trim();

    try {
      const leaderData: Omit<Leader, 'id'> = {
        name: formData.name.trim(),
        gender: formData.gender,
        place: formData.place.trim(),
        contactNumber: formData.contactNumber.trim(),
        whatsappNumber: formData.whatsappNumber.trim(),
        churchName: finalChurchName,
        staying: formData.staying,
        status: formData.status,
        isFollowing: formData.isFollowing === 'no' ? 'no' : formData.isFollowing,
        type: formData.type,
        remark: formData.remark.trim() || '',
        registered_mode: formData.registered_mode,
      };

      await leaderAPI.update(leaderIdFromUrl, leaderData);
      
      setMessage('Leader profile has been updated successfully.');
      setShowSuccessActions(true);
    } catch (err) {
      console.error('Error updating leader:', err);
      
      // Check if it's a permission error
      const errorMsg = err instanceof Error ? err.message : 'Error updating leader';
      if (errorMsg.toLowerCase().includes('forbidden') || 
          errorMsg.toLowerCase().includes('unauthorized')) {
        setAccessDenied(true);
        setErrorMessage(errorMsg);
      } else {
        setMessage('Error updating leader. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = showSuccessActions || isSubmitting || leader?.status !== 'registered' || !hasAccess();


  // Show loading while permissions are loading
  if (permissionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <StickyHeader title="Edit Leader" onBack={() => navigate(-1)} />
        <LeaderEditSkeleton />
      </div>
    );
  }

  // Show access denied if user doesn't have permission
  if (!hasAccess() || accessDenied || permissionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <AccessAlert message={errorMessage || "You do not have permission to edit leaders."} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <StickyHeader title="Edit Leader" onBack={() => navigate(-1)} />
        <LeaderEditSkeleton />
      </div>
    );
  }

  if (error || !leader || leader.id !== leaderIdFromUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <StickyHeader title="Edit Leader" onBack={() => navigate(-1)} />
        <EmptyState
          title="Invalid Leader"
          message="The leader ID in the URL does not match any record."
          buttonText="Back to Leader List"
          navigatePath="/user/leader"
        />
      </div>
    );
  }

  if (leader.status !== 'registered') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <StickyHeader title="Edit Leader" onBack={() => navigate(-1)} />
        <div className="max-w-5xl mx-auto px-4 mt-10">
          <div className="max-w-6xl mx-auto py-16 px-4 flex justify-center">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                <FiAlertTriangle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">
                Cannot Edit Leader
              </h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Editing is allowed only for leaders with status Registered.
              </p>
              <button
                onClick={() => navigate(`/user/leader/${id}`, { state: { fromEdit: true } })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
              >
                <FiArrowLeft className="w-4 h-4" />
                Go Back to Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      <StickyHeader title="Edit Leader" onBack={() => navigate(-1)}>
        {canViewLeaderList() && (
          <button
            onClick={() => navigate('/user/leader')}
            disabled={!hasAccess()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Leader List
          </button>
        )}
      </StickyHeader>

      <div className="max-w-5xl mx-auto px-4 mt-2 sm:mt-8">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative">
          <AnimatePresence>
            {showSuccessActions && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                >
                  <FiCheckCircle className="w-16 h-16 text-green-500 mb-4 mx-auto" />
                </motion.div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Update Successful!</h2>
                <p className="text-slate-600 mb-8 max-w-sm">{message}</p>
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    onClick={() => navigate(`/user/leader/${id}`, { state: { fromEdit: true } })}
                    className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-all"
                  >
                    <FiUser /> View Profile
                  </button>
                  <button
                    onClick={() => setShowSuccessActions(false)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all"
                  >
                    <FiEdit3 /> Edit Again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit}>
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800">Edit Leader Details</h2>
                <p className="text-slate-500 text-xs mt-1">Update the leader's information below.</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-slate-400">ID: #{leaderIdFromUrl}</div>
              </div>
            </div>

            <div className="p-3 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                    disabled={isFormDisabled}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm capitalize disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                    disabled={isFormDisabled}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                {/* Place */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Place *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <FiMapPin />
                    </span>
                    
                    <input
                      type="text"
                      name="place"
                      value={formData.place}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      required
                      autoComplete="nope"
                      disabled={isFormDisabled}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm capitalize disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  {showPlaceSuggestions && filteredPlaces.length > 0 && (
                    <div className="absolute z-30 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-40 overflow-auto">
                      {filteredPlaces.map((p, i) => (
                        <div
                          key={p}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormData(prev => ({ ...prev, place: p }));
                            setShowPlaceSuggestions(false);
                            setHighlightedIndex(-1);
                          }}
                          className={`px-4 py-2 cursor-pointer ${highlightedIndex === i ? 'bg-indigo-100' : 'hover:bg-indigo-50'} ${isFormDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {p}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Church Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Church Name</label>
                  <input
                    ref={churchNameRef}
                    type="text"
                    name="churchName"
                    autoComplete="off"
                    value={formData.churchName}
                    onChange={handleChange}
                    onFocus={handleChurchNameFocus}
                    onBlur={handleChurchNameBlur}
                    disabled={isFormDisabled}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm capitalize disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number *</label>
                  <div className="relative">
                    <input
                      id="contactNumber"
                      type="text"
                      name="contactNumber"
                      autoComplete="off"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      required
                      disabled={isFormDisabled}
                      className={`w-full px-4 py-2 border rounded-lg bg-slate-50 text-sm disabled:opacity-60 disabled:cursor-not-allowed ${contactNumberError ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {formData.contactNumber.length >= 10 && (
                      <FiCheckCircle className="absolute right-3 top-3 text-green-500" />
                    )}
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">WhatsApp Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="whatsappNumber"
                      autoComplete="off"
                      value={formData.whatsappNumber}
                      onChange={handleChange}
                      disabled={isFormDisabled}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={handleSameNumber}
                      disabled={isFormDisabled}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Same
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-6 border-t border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800 mb-3">Event Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Group Following</label>
                  <select
                    name="isFollowing"
                    value={formData.isFollowing}
                    onChange={handleChange}
                    disabled={isFormDisabled || !isAdminUser()}
                    autoComplete="off"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="no">Not Following</option>
                    {groups.map(g => (
                      <option key={g} value={g}>Group {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Leader Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    disabled={isFormDisabled}
                    autoComplete="off"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm font-medium text-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {typeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Remarks / Notes</label>
                <textarea
                  name="remark"
                  value={formData.remark}
                  onChange={handleChange}
                  rows={3}
                  disabled={isFormDisabled}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="Youth coordinator, food preferences, special notes..."
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !hasAccess()}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Updating...' : 'Update Leader'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeaderEdit;
