// src/user/pages/student/StudentNew.tsx
import { useState, useEffect, useRef } from 'react';
import { FiCheckCircle, FiMapPin, FiSave, FiX, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Student } from '../../../types';
import { studentAPI } from '../api/StudentData';
import { PAGE_PERMISSIONS, canAccess, fetchPermissionData, type PermissionData } from '../permission';
import { StickyHeader, AccessAlert } from '../components';
import PlaceAPI, { type PhotonFeature } from '../api/PlaceList';

// Permission constant for this page
const PAGE_ID = PAGE_PERMISSIONS.STUDENT_NEW;

const StudentNewSkeleton = () => (
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

const StudentNew = () => {
  const navigate = useNavigate();

  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessActions, setShowSuccessActions] = useState(false);
  const [message, setMessage] = useState('');

  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [contactNumberError, setContactNumberError] = useState(false);
  const [placeSuggestions, setPlaceSuggestions] = useState<PhotonFeature[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [newId, setNewId] = useState<number | null>(null);
  const churchNameRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    age: 0,
    gender: 'male',
    place: '',
    parentName: '',
    contactNumber: '',
    whatsappNumber: '',
    churchName: 'No',
    medication: 'no',
    medicalReport: '',
    status: 'registered',
    remark: '',
    staying: 'no',
    age_group: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  // Fetch permission data on component mount (like StudentList)
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setPermissionLoading(true);
        setPermissionError(false);
        const data = await fetchPermissionData();
        setPermissionData(data);

        // Check access using canAccess directly with permission data
        const hasAccess = canAccess(data, PAGE_ID);
        setAccessDenied(!hasAccess);

        if (!hasAccess) {
          setErrorMessage("You don't have permission to register new students");
        }
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
        setLoading(false);
      }
    };

    loadPermissions();
  }, []);

  // Permission check using ONLY permissionData
  const hasAccess = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return canAccess(permissionData, PAGE_ID);
  };

  // Check if user has permission to view student list
  const canViewStudentList = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return permissionData.role === 'admin' ||
      permissionData.role === 'co-admin' ||
      canAccess(permissionData, PAGE_PERMISSIONS.STUDENT_LIST);
  };

  // Search places using Photon API via PlaceList
  const searchPlaces = async (query: string) => {
    if (query.length < 2) {
      setPlaceSuggestions([]);
      setShowPlaceSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const features = await PlaceAPI.searchPlaces(query, 5);
      setPlaceSuggestions(features);
      setShowPlaceSuggestions(true);
    } catch (error) {
      console.error('Error searching places:', error);
      setPlaceSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearPlace = () => {
    setFormData(prev => ({
      ...prev,
      place: '',
      latitude: undefined,
      longitude: undefined
    }));
    setPlaceSuggestions([]);
    setShowPlaceSuggestions(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (showSuccessActions || isSubmitting || !hasAccess()) return;

    const { name, value } = e.target;

    if (['name', 'parentName', 'place'].includes(name)) {
      if (/^[a-zA-Z\s.\-']*$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else if (['contactNumber', 'whatsappNumber'].includes(name)) {
      if (/^\d*$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
      if (name === 'contactNumber') setContactNumberError(false);
    } else if (name === 'age') {
      // Allow only digits while typing
      if (/^\d*$/.test(value)) {
        setFormData((prev) => ({ ...prev, age: value === '' ? 0 : Number(value) }));
      }
    } else if (name === 'churchName') {
      setFormData((prev) => ({ ...prev, churchName: value }));
    } else if (name === 'medicalReport') {
      setFormData((prev) => ({ ...prev, medicalReport: value }));
    } else if (name === 'remark') {
      setFormData((prev) => ({ ...prev, remark: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Handle place search with debounce
    if (name === 'place') {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout for search
      searchTimeoutRef.current = setTimeout(() => {
        if (value.length >= 2) {
          searchPlaces(value);
        } else {
          setShowPlaceSuggestions(false);
          setPlaceSuggestions([]);
        }
      }, 300);
    }
  };

  // Add this new function to handle age validation on blur
  const handleAgeBlur = () => {
    const ageValue = formData.age;
    if (!ageValue) return;

    const ageString = ageValue.toString();

    // Check if it's a 3-digit number (invalid age)
    if (ageString.length === 3 && ageValue >= 100) {
      setMessage('Invalid age: Please enter a valid age or year of birth');
      setFormData((prev) => ({ ...prev, age: 0 }));
      return;
    }

    // Check if it's a 4-digit number (likely a year)
    const currentYear = new Date().getFullYear();
    if (ageString.length === 4 && ageValue >= 1900 && ageValue <= currentYear) {
      // Convert year to age
      const calculatedAge = currentYear - ageValue;

      // Validate calculated age is reasonable (0-120 years)
      if (calculatedAge >= 0 && calculatedAge <= 120) {
        setFormData((prev) => ({ ...prev, age: calculatedAge }));
        setMessage(''); // Clear any error message
      } else {
        setMessage('Invalid year: Please enter a valid year of birth');
        setFormData((prev) => ({ ...prev, age: 0 }));
      }
      return;
    }

    // For 1-2 digit numbers (direct age input)
    if (ageString.length <= 2 || (ageString.length === 3 && ageValue < 100)) {
      // Validate age is reasonable (0-120 years)
      if (ageValue >= 0 && ageValue <= 120) {
        setFormData((prev) => ({ ...prev, age: ageValue }));
        setMessage(''); // Clear any error message
      } else {
        setMessage('Please enter a valid age between 0 and 120');
        setFormData((prev) => ({ ...prev, age: 0 }));
      }
    }

    // Handle numbers with more than 4 digits
    if (ageString.length > 4) {
      setMessage('Invalid input: Please enter a valid age or year');
      setFormData((prev) => ({ ...prev, age: 0 }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!hasAccess()) return;

    if (showPlaceSuggestions && placeSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % placeSuggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + placeSuggestions.length) % placeSuggestions.length);
      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault();
        selectPlace(placeSuggestions[highlightedIndex]);
      } else if (e.key === 'Escape') {
        setShowPlaceSuggestions(false);
        setHighlightedIndex(-1);
      }
    }
  };

  const selectPlace = (feature: PhotonFeature) => {
    // Use PlaceAPI helper functions
    const displayName = PlaceAPI.getPlaceDisplayName(feature);
    const { lat, lng } = PlaceAPI.getPlaceCoordinates(feature);

    setFormData((prev) => ({
      ...prev,
      place: displayName,
      latitude: lat,
      longitude: lng,
    }));

    setShowPlaceSuggestions(false);
    setHighlightedIndex(-1);
    setPlaceSuggestions([]);
  };

  const handleChurchNameFocus = () => {
    if (hasAccess() && formData.churchName === 'No' && churchNameRef.current) {
      churchNameRef.current.select();
    }
  };

  const handleChurchNameBlur = () => {
    if (hasAccess() && formData.churchName.trim() === '') {
      setFormData((prev) => ({ ...prev, churchName: 'No' }));
    }
  };

  const handleSameNumber = () => {
    if (!hasAccess()) return;

    if (formData.contactNumber.trim() === '') {
      setContactNumberError(true);
      document.getElementById('contactNumber')?.focus();
      return;
    }
    setFormData((prev) => ({ ...prev, whatsappNumber: prev.contactNumber }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasAccess()) return;

    setIsSubmitting(true);
    setMessage('');

    if (!formData.name.trim() || !formData.place.trim() || formData.contactNumber.length < 10 || !formData.parentName.trim() || formData.age < 1) {
      setMessage('Please fill all required fields correctly.');
      setIsSubmitting(false);
      return;
    }

    if (formData.medication === 'yes' && !formData.medicalReport.trim()) {
      setMessage('Medical report is required when medication is needed.');
      setIsSubmitting(false);
      return;
    }

    const finalChurchName =
      formData.churchName.trim().toLowerCase() === 'no' || !formData.churchName.trim()
        ? 'no'
        : formData.churchName.trim();

    const payload: Partial<Student> = {
      id: 0,
      name: formData.name.trim().toLowerCase(),
      age: Number(formData.age),
      gender: formData.gender.toLowerCase() as 'male' | 'female',
      place: formData.place.trim().toLowerCase(),
      latitude: formData.latitude,
      longitude: formData.longitude,
      parentName: formData.parentName.trim().toLowerCase(),
      contactNumber: formData.contactNumber.trim(),
      whatsappNumber: formData.whatsappNumber.trim(),
      churchName: finalChurchName.toLowerCase(),
      medication:
        formData.medication === 'yes'
          ? formData.medicalReport.trim()
          : 'no',
      staying: 'no',
      status: 'registered',
      remark: formData.remark.trim() || "",
      registered_mode: "offline",
      age_group: "",
    };




    try {
      const result = await studentAPI.createStudent(payload);

      const payloadData = result?.data ?? result;

      const createdStudentId =
        result?.student?.studentId ||
        result?.data?.student?.studentId ||
        result?.data?.studentId ||
        payloadData?.studentId ||
        payloadData?.id ||
        result?.raw?.student?.studentId ||
        result?.raw?.data?.student?.studentId ||
        result?.raw?.data?.studentId ||
        result?.raw?.id ||
        result?.studentId ||
        result?.id ||
        null;

      if (createdStudentId) {
        setNewId(Number(createdStudentId));
        setMessage(result?.message || result?.raw?.message || 'Student has been registered successfully.');
        setShowSuccessActions(true);
      } else {
        console.warn('Student ID not found in API response:', result);
        setMessage(result?.message || 'Student registered, but could not retrieve the new student ID.');
        // don't show the overlay with View Profile since we don't have an ID
        setShowSuccessActions(true); // Still show success even without ID for navigation if we want
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error registering student. Please try again.';
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = showSuccessActions || isSubmitting || !hasAccess();


  // Show loading while permissions are loading (like StudentList)
  if (permissionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <StickyHeader title="Register New Student" />
        <StudentNewSkeleton />
      </div>
    );
  }

  // Show access denied page for permission errors or access denied (like StudentList)
  if (permissionError || accessDenied || !permissionData || !hasAccess()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <AccessAlert message={errorMessage || "You do not have access to this page."} />
      </div>
    );
  }

  // Show regular loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <StickyHeader title="Register New Student" />
        <StudentNewSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      <StickyHeader title="Register New Student">
        {canViewStudentList() && (
          <button
            onClick={() => navigate('/user/student')}
            disabled={!hasAccess()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Student List
          </button>
        )}
      </StickyHeader>

      <div className="max-w-5xl mx-auto px-4 mt-2 sm:mt-8">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative">

          {/* Success Overlay */}
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
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Registration Successful!</h2>
                <p className="text-slate-600 mb-8 max-w-sm">{message}</p>

                <div className="flex flex-wrap justify-center gap-4">
                  {newId && (
                    <button
                      onClick={() => navigate(`/user/student/${newId}`)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-all"
                    >
                      <FiUser /> View Profile
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowSuccessActions(false);
                      setFormData({
                        id: 0,
                        name: '',
                        age: 0,
                        gender: 'male',
                        place: '',
                        parentName: '',
                        contactNumber: '',
                        whatsappNumber: '',
                        churchName: 'No',
                        medication: 'no',
                        medicalReport: '',
                        staying: 'no',
                        status: 'registered',
                        remark: '',
                        age_group: '',
                        latitude: undefined,
                        longitude: undefined,
                      });
                      setMessage('');
                      setContactNumberError(false);
                      setPlaceSuggestions([]);
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all"
                  >
                    <FiSave /> Register Another
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} >
            <div className="p-4 sm:p-5 border-b border-slate-100">
              <div className="flex items-center justify-between mb-0.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-800">New Student Registration</h2>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">New Record</div>
              </div>
              <p className="text-slate-500 text-xs">Enter the student's information below.</p>
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
                    disabled={isFormDisabled}
                    autoComplete="off"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm capitalize disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Enter full name"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Age *
                    <span className="ml-2 text-xs text-slate-400 font-normal">
                      (Enter age or year of birth, e.g., {new Date().getFullYear()})
                    </span>
                  </label>
                  <input
                    type="text"
                    name="age"
                    value={formData.age || ''}
                    onChange={handleChange}
                    onBlur={handleAgeBlur}  // Add this line
                    required
                    disabled={isFormDisabled}
                    autoComplete="off"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder={`Enter age or year (e.g., ${new Date().getFullYear()})`}
                  />
                  {message && message.includes('age') && (
                    <p className="mt-1 text-xs text-red-500">{message}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    disabled={isFormDisabled}
                    autoComplete="off"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                {/* Place with Photon API Search */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Place <span className="text-red-500">*</span>
                    {formData.latitude && formData.longitude && (
                      <span className="ml-2 text-xs text-green-600">
                        ✓ Location added
                      </span>
                    )}
                  </label>

                  <div className="relative">
                    {/* Search Icon */}
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <FiMapPin />
                    </span>

                    <input
                      type="text"
                      name="place"
                      value={formData.place}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      onBlur={() => {
                        // Delay hiding to allow click on suggestions
                        setTimeout(() => {
                          setShowPlaceSuggestions(false);
                          setHighlightedIndex(-1);
                        }, 200);
                      }}
                      required
                      disabled={isFormDisabled}
                      autoComplete="nope"
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm capitalize disabled:opacity-60 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-100 focus:border-transparent outline-none transition-all "
                      placeholder="Search for a city or location..."
                    />

                    {/* Clear Icon (X) - Only shows when there is text and not loading */}
                    {!isSearching && formData.place && (
                      <button
                        type="button"
                        onClick={clearPlace}
                        disabled={isFormDisabled}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-red-500 transition-colors focus:outline-none"
                        title="Clear location"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    )}

                    {/* Loading Spinner */}
                    {isSearching && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      </span>
                    )}
                  </div>

                  {/* Place Suggestions Dropdown */}
                  {showPlaceSuggestions && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-lg overflow-hidden">

                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
                        <span className="text-xs font-medium text-slate-500">SUGGESTED PLACES</span>
                      </div>

                      {/* Sort placeSuggestions to show Indian and Kerala first */}
                      {[...placeSuggestions].sort((a: PhotonFeature, b: PhotonFeature) => {
                        // Helper function to check if location is from Kerala
                        const isKerala = (feature: PhotonFeature): boolean => {
                          const props = feature.properties;
                          return props.state?.toLowerCase() === 'kerala' ||
                            props.city?.toLowerCase().includes('kerala') ||
                            (props.state?.toLowerCase() === 'kerala');
                        };

                        // Helper function to check if location is from India (but not Kerala)
                        const isIndia = (feature: PhotonFeature): boolean => {
                          const props = feature.properties;
                          return props.country?.toLowerCase() === 'india' && !isKerala(feature);
                        };

                        const aIsKerala = isKerala(a);
                        const bIsKerala = isKerala(b);
                        const aIsIndia = isIndia(a);
                        const bIsIndia = isIndia(b);

                        // Priority: Kerala first, then other Indian locations, then rest
                        if (aIsKerala && !bIsKerala) return -1;
                        if (!aIsKerala && bIsKerala) return 1;
                        if (aIsIndia && !bIsIndia && !bIsKerala) return -1;
                        if (!aIsIndia && bIsIndia && !aIsKerala) return 1;
                        return 0;
                      }).map((feature: PhotonFeature, index: number) => {
                        const isActive = highlightedIndex === index;

                        // 1. Get the main name (e.g., "Neyyattinkara")
                        const mainName = feature.properties.name || "";

                        // 2. Format the subtitle (e.g., "Trivandrum, Kerala, India")
                        // We filter out the mainName from the parts to avoid "Neyyattinkara, Neyyattinkara..."
                        const addressParts = [
                          feature.properties.city,
                          feature.properties.state,
                          feature.properties.country
                        ].filter((part: string | undefined): part is string =>
                          Boolean(part && part !== mainName)
                        );

                        const subTitle = addressParts.join(", ");

                        return (
                          <div
                            key={index}
                            onMouseDown={() => selectPlace(feature)}
                            className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
            ${isActive ? 'bg-slate-50' : 'hover:bg-slate-50'}
            ${isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''}
            border-b border-slate-200 last:border-b-0`}
                          >
                            <div className={`mt-0.5 ${isActive ? 'text-red-500' : 'text-slate-400'}`}>
                              <FiMapPin size={18} />
                            </div>

                            <div className="flex-1">
                              {/* Top Line: Bold Name */}
                              <div className={`text-sm font-semibold ${isActive ? 'text-indigo-600' : 'text-slate-700'}`}>
                                {mainName}
                              </div>

                              {/* Bottom Line: Full Address */}
                              <div className="text-xs text-slate-500 mt-0.5">
                                {subTitle || "Location details unavailable"}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Empty State */}
                      {placeSuggestions.length === 0 && formData.place.length >= 2 && !isSearching && (
                        <div className="px-4 py-4 text-center text-sm text-slate-500">
                          No places found / Enter manually
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Parent Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Parent/Guardian Name *</label>
                  <input
                    type="text"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleChange}
                    required
                    disabled={isFormDisabled}
                    autoComplete="off"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm capitalize disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Enter parent/guardian name"
                  />
                </div>

                {/* Church Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Church Name</label>
                  <input
                    ref={churchNameRef}
                    type="text"
                    name="churchName"
                    value={formData.churchName}
                    onChange={handleChange}
                    onFocus={handleChurchNameFocus}
                    onBlur={handleChurchNameBlur}
                    disabled={isFormDisabled}
                    autoComplete="off"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm capitalize disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Enter church name or 'No'"
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
                      value={formData.contactNumber}
                      onChange={handleChange}
                      required
                      disabled={isFormDisabled}
                      autoComplete="off"
                      className={`w-full px-4 py-2.5 border rounded-lg bg-slate-50 text-sm disabled:opacity-60 disabled:cursor-not-allowed ${contactNumberError ? 'border-red-500' : 'border-slate-200'}`}
                      placeholder="Enter 10-digit number"
                    />
                    {formData.contactNumber.length >= 10 && (
                      <FiCheckCircle className="absolute right-3 top-3 text-green-500" />
                    )}
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">WhatsApp Number *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="whatsappNumber"
                      value={formData.whatsappNumber}
                      onChange={handleChange}
                      required
                      disabled={isFormDisabled}
                      autoComplete="off"
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="Enter WhatsApp number"
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
              <h2 className="text-base font-bold text-slate-800 mb-3">Health & Remarks</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Requires Medication?</label>
                  <select
                    name="medication"
                    value={formData.medication}
                    onChange={handleChange}
                    disabled={isFormDisabled}
                    autoComplete="off"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                {formData.medication === 'yes' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Medical Report *</label>
                    <input
                      type="text"
                      name="medicalReport"
                      value={formData.medicalReport}
                      onChange={handleChange}
                      required={formData.medication === 'yes'}
                      disabled={isFormDisabled}
                      autoComplete="off"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm capitalize disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="Enter medical report details"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Remarks / Notes</label>
                <textarea
                  name="remark"
                  value={formData.remark || ''}
                  onChange={handleChange}
                  rows={3}
                  disabled={isFormDisabled}
                  autoComplete="off"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm resize-y h-32 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="Allergies, special needs, food preferences, etc."
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !hasAccess()}
                className="w-full sm:w-auto justify-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-60 hover:bg-indigo-700 transition"
              >
                {isSubmitting ? 'Registering...' : 'Register Student'}
                <FiSave className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentNew;
