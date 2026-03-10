import { useState, useMemo, useEffect, useRef } from 'react';
import { FiArrowLeft, FiCheckCircle, FiMapPin, FiUser, FiEdit3 } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Student } from '../../../types';
import EmptyState from '../components/EmptyState';
import { PAGE_PERMISSIONS, canAccess, fetchPermissionData, type PermissionData } from '../permission';
import AccessAlert from '../components/AccessAlert';
import { studentAPI } from '../api/StudentData';

const place_list = [
  "New York", "New Delhi", "London", "Los Angeles", "Paris",
  "Tokyo", "Sydney", "Mumbai", "Chicago", "Boston"
];

// Skeleton (unchanged)
const StudentEditSkeleton = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6 animate-pulse">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
          <div className="pt-6 border-t border-slate-100">
            <div className="pb-5">
              <div className="h-6 w-40 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-72 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                    <div className="h-10 w-full bg-gray-100 rounded-lg"></div>
                  </div>
                ))}
              </div>
              <div>
                <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-24 w-full bg-gray-100 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

// Permission constant for this page
const PAGE_ID = PAGE_PERMISSIONS.STUDENT_EDIT;

const StudentEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Permission data state (like StudentList)
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    age: number;
    gender: string;
    place: string;
    parentName: string;
    contactNumber: string;
    whatsappNumber: string;
    churchName: string;
    staying: string;
    remark: string;
  }>({
    name: '',
    age: 0,
    gender: 'male',
    place: '',
    parentName: '',
    contactNumber: '',
    whatsappNumber: '',
    churchName: 'No',
    staying: 'no',
    remark: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccessActions, setShowSuccessActions] = useState(false);
  const [updatedStudentId, setUpdatedStudentId] = useState<number | null>(null);
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [contactNumberError, setContactNumberError] = useState(false);
  const [ageError, setAgeError] = useState('');

  const churchNameRef = useRef<HTMLInputElement>(null);

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
          setErrorMessage("You don't have permission to edit students");
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
      }
    };

    loadPermissions();
  }, []);

  // Permission check using ONLY permissionData
  const hasAccess = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return canAccess(permissionData, PAGE_ID);
  };

  useEffect(() => {
    // Check access before loading data
    if (!hasAccess()) {
      setLoading(false);
      setAccessDenied(true);
      return;
    }

    const fetchStudent = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const studentId = parseInt(id!, 10);
        if (isNaN(studentId)) {
          throw new Error('Invalid student ID');
        }

        const studentData = await studentAPI.getStudent(studentId);
        setStudent(studentData);
        setFormData({
          name: studentData.name || '',
          age: studentData.age || 0,
          gender: studentData.gender || 'male',
          place: studentData.place || '',
          parentName: studentData.parentName || '',
          contactNumber: studentData.contactNumber || '',
          whatsappNumber: studentData.whatsappNumber || '',
          churchName: studentData.churchName || 'No',
          staying: studentData.staying || 'no',
          remark: studentData.remark || '',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load student data.';
        setError(errorMessage);
        
        // Check if it's a permission error
        if (errorMessage.toLowerCase().includes('forbidden') || 
            errorMessage.toLowerCase().includes('unauthorized') ||
            errorMessage.toLowerCase().includes('permission')) {
          setAccessDenied(true);
          setErrorMessage(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchStudent();
  }, [id, permissionData]);

  const filteredPlaces = useMemo(() => {
    if (formData.place.length < 2) return [];
    return place_list.filter(p => p.toLowerCase().includes(formData.place.toLowerCase()));
  }, [formData.place]);

  const handleNameLikeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (/^[a-zA-Z\s.\-']*$/.test(value)) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNumberOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (/^\d*$/.test(value)) setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'contactNumber') setContactNumberError(false);
  };

  const handleFreeTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits while typing
    if (/^\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, age: value === '' ? 0 : Number(value) }));
    }
    // Clear age error when user starts typing
    setAgeError('');
  };

  // Add this new function to handle age validation on blur
  const handleAgeBlur = () => {
    const ageValue = formData.age;
    if (!ageValue) {
      setAgeError('Age is required');
      return;
    }

    const ageString = ageValue.toString();
    const currentYear = new Date().getFullYear();
    
    // Check if it's a 3-digit number (invalid age)
    if (ageString.length === 3 && ageValue >= 100) {
      setAgeError('Invalid age: Please enter a valid age or year of birth');
      setFormData(prev => ({ ...prev, age: 0 }));
      return;
    }
    
    // Check if it's a 4-digit number (likely a year)
    if (ageString.length === 4 && ageValue >= 1900 && ageValue <= currentYear) {
      // Convert year to age
      const calculatedAge = currentYear - ageValue;
      
      // Validate calculated age is reasonable (0-120 years)
      if (calculatedAge >= 0 && calculatedAge <= 120) {
        setFormData(prev => ({ ...prev, age: calculatedAge }));
        setAgeError(''); // Clear any error message
      } else {
        setAgeError('Invalid year: Please enter a valid year of birth');
        setFormData(prev => ({ ...prev, age: 0 }));
      }
      return;
    }
    
    // For 1-2 digit numbers (direct age input)
    if (ageString.length <= 2 || (ageString.length === 3 && ageValue < 100)) {
      // Validate age is reasonable (0-120 years)
      if (ageValue >= 0 && ageValue <= 120) {
        setAgeError(''); // Clear any error message
      } else {
        setAgeError('Please enter a valid age between 0 and 120');
        setFormData(prev => ({ ...prev, age: 0 }));
      }
    }
    
    // Handle numbers with more than 4 digits
    if (ageString.length > 4) {
      setAgeError('Invalid input: Please enter a valid age or year');
      setFormData(prev => ({ ...prev, age: 0 }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (showSuccessActions || !hasAccess() || accessDenied) return;
    const { name, value } = e.target;

    if (['name', 'parentName', 'place'].includes(name)) {
      handleNameLikeChange(e as React.ChangeEvent<HTMLInputElement>);
    } else if (['contactNumber', 'whatsappNumber'].includes(name)) {
      handleNumberOnlyChange(e as React.ChangeEvent<HTMLInputElement>);
    } else if (name === 'age') {
      handleAgeChange(e as React.ChangeEvent<HTMLInputElement>);
    } else if (['churchName', 'remark'].includes(name)) {
      handleFreeTextChange(e as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (name === 'place') setShowPlaceSuggestions(value.length >= 2);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showPlaceSuggestions && filteredPlaces.length > 0) {
      if (e.key === 'ArrowDown') setHighlightedIndex(prev => (prev + 1) % filteredPlaces.length);
      else if (e.key === 'ArrowUp') setHighlightedIndex(prev => (prev - 1 + filteredPlaces.length) % filteredPlaces.length);
      else if (e.key === 'Enter' && highlightedIndex >= 0) {
        handlePlaceSelect(filteredPlaces[highlightedIndex]);
        setHighlightedIndex(-1);
      }
    }
  };

  const handlePlaceSelect = (place: string) => {
    if (!hasAccess() || accessDenied) return;
    setFormData(prev => ({ ...prev, place }));
    setShowPlaceSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleChurchNameFocus = () => {
    if (formData.churchName === 'No' && churchNameRef.current) churchNameRef.current.select();
  };

  const handleChurchNameBlur = () => {
    if (formData.churchName.trim() === '') setFormData(prev => ({ ...prev, churchName: 'No' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate age before submission
    if (ageError) {
      setMessage(ageError);
      return;
    }
    
    if (!hasAccess() || accessDenied) return;
    
    setIsSubmitting(true);
    setMessage('');

    // Prepare updated student data
    const updatedStudent: Partial<Student> = {
      ...student,
      name: formData.name.trim().toLowerCase(),
      age: formData.age,
      gender: formData.gender as 'male' | 'female',
      place: formData.place.trim().toLowerCase(),
      parentName: formData.parentName.trim().toLowerCase(),
      contactNumber: formData.contactNumber.trim(),
      whatsappNumber: formData.whatsappNumber.trim(),
      churchName: formData.churchName.trim().toLowerCase(),
      remark: formData.remark.trim() || "",
    };

    try {
      const result = await studentAPI.updateStudent(student!.id!, updatedStudent);
      const returnedId = result?.studentId || result?.id || student!.id;
      setUpdatedStudentId(Number(returnedId));
      setMessage(result?.message || 'Student profile has been updated successfully.');
      setShowSuccessActions(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating student.';
      setMessage(errorMessage);
      
      // Check if it's a permission error during update
      if (errorMessage.toLowerCase().includes('forbidden') || 
          errorMessage.toLowerCase().includes('unauthorized')) {
        setAccessDenied(true);
        setErrorMessage(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSameNumber = () => {
    if (!hasAccess() || accessDenied) return;
    
    if (formData.contactNumber.trim() === '') {
      setContactNumberError(true);
      document.getElementById('contactNumber')?.focus();
    } else {
      setFormData(prev => ({ ...prev, whatsappNumber: prev.contactNumber }));
    }
  };

  const isValidPhoneNumber = (number: string) => /^[0-9]{10,}$/.test(number);
  const isFormDisabled = showSuccessActions || isSubmitting || !hasAccess() || accessDenied;

  const Header = () => (
    <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 border-b border-gray-100">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/user/student')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium">
            <FiArrowLeft /> Back
          </button>
          <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
          <h1 className="text-lg font-bold text-slate-800 hidden sm:block">Edit Student</h1>
        </div>
        <button onClick={() => navigate('/user/student')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium">
          View All Students
        </button>
      </div>
    </div>
  );

  // Show loading while permissions are loading (like StudentList)
  if (permissionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <Header />
        <StudentEditSkeleton />
      </div>
    );
  }

  // Show access denied if user doesn't have permission OR API returned 403/401
  if (permissionError || accessDenied || !permissionData || !hasAccess()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AccessAlert message={errorMessage || error || "You do not have access to edit this student."} />
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      <Header />
      <StudentEditSkeleton />
    </div>
  );

  // Not found
  if (error || !student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <Header />
        <div className="max-w-5xl mx-auto px-4 mt-10">
          <EmptyState
            title="Student Not Found"
            message={error || "Could not find student data."}
            buttonText="Back to List"
            navigatePath="/user/student"
          />
        </div>
      </div>
    );
  }

  // Block edit for registered or absent
  if (student.status !== 'registered') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <Header />
        <div className="max-w-5xl mx-auto px-4 mt-10">
          <div
            onClick={() => navigate(`/user/student/${id}`, { state: { fromEdit: true } })}
            className="cursor-pointer"
          >
            <EmptyState
              title="Cannot Edit"
              message={`Editing is allowed only for students with status "Registered".`}
              buttonText="Go Back to Profile"
              navigatePath={`/user/student/${id}`}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      <Header />
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">

          {/* Success Overlay Logic */}
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
                    onClick={() => navigate(`/user/student/${updatedStudentId ?? id}`, { state: { fromEdit: true } })}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-all shadow-md"
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

          <form onSubmit={handleSubmit} onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}>
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Edit Student Details</h2>
                <p className="text-slate-600 text-sm mt-1">Update the student's information below.</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    disabled={isFormDisabled} 
                    autoComplete='off' 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm capitalize" 
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    onBlur={handleAgeBlur}
                    required 
                    disabled={isFormDisabled}  
                    autoComplete='off' 
                    className={`w-full px-4 py-2.5 border rounded-lg bg-slate-50 text-sm ${ageError ? 'border-red-500' : 'border-slate-200'}`} 
                  />
                  {ageError && (
                    <p className="mt-1 text-xs text-red-500">{ageError}</p>
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
                    autoComplete='off' 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                {/* Place */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Place *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><FiMapPin /></span>
                    <input 
                      type="text" 
                      name="place" 
                      value={formData.place} 
                      onChange={handleChange} 
                      onKeyDown={handleKeyDown}  
                      autoComplete='nope' 
                      required 
                      disabled={isFormDisabled} 
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm capitalize" 
                    />
                  </div>
                  {showPlaceSuggestions && filteredPlaces.length > 0 && (
                    <div className="absolute z-30 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-40 overflow-auto">
                      {filteredPlaces.map((p, i) => (
                        <div 
                          key={i} 
                          onMouseDown={() => handlePlaceSelect(p)} 
                          className={`px-4 py-2 cursor-pointer ${highlightedIndex === i ? 'bg-indigo-100' : 'hover:bg-indigo-50'}`}
                        >
                          {p}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Parent Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Parent Name *</label>
                  <input 
                    type="text" 
                    name="parentName" 
                    value={formData.parentName} 
                    onChange={handleChange} 
                    required 
                    disabled={isFormDisabled} 
                    autoComplete='off' 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm capitalize" 
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
                      autoComplete='off' 
                      required 
                      disabled={isFormDisabled} 
                      className={`w-full px-4 py-2.5 border rounded-lg bg-slate-50 text-sm ${contactNumberError ? 'border-red-500' : 'border-slate-200'}`} 
                    />
                    {isValidPhoneNumber(formData.contactNumber) && <FiCheckCircle className="absolute right-3 top-3 text-green-500" />}
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
                      autoComplete='off' 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm" 
                    />
                    <button 
                      type="button" 
                      onClick={handleSameNumber} 
                      disabled={isFormDisabled} 
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium whitespace-nowrap"
                    >
                      Same
                    </button>
                  </div>
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
                    autoComplete="off" 
                    onFocus={handleChurchNameFocus} 
                    onBlur={handleChurchNameBlur} 
                    disabled={isFormDisabled} 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm capitalize" 
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Event Details</h2>
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Remarks</label>
                <textarea 
                  name="remark" 
                  value={formData.remark} 
                  onChange={handleChange} 
                  rows={3} 
                  disabled={isFormDisabled} 
                  autoComplete="off" 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm resize-y" 
                  placeholder="Notes, allergies, etc." 
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                type="submit" 
                disabled={isSubmitting || !hasAccess() || accessDenied || !!ageError} 
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 hover:bg-indigo-700 transition-colors"
              >
                {isSubmitting ? "Updating..." : "Update Student"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentEdit;