// src/user/pages/medical/ReportNew.tsx
import { useState, useEffect } from 'react';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import StudentListCompound from '../components/StudentListCompound';
import type { Medical } from '../../../types';
import { PAGE_PERMISSIONS, canAccess, fetchPermissionData, type PermissionData } from '../permission';
import AccessAlert from '../components/AccessAlert';
import { medicalAPI } from '../api/MedicalData';

// Skeleton Component
const ReportFormSkeleton = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6 animate-pulse">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded"></div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-12 w-full bg-gray-100 rounded-lg"></div>
          </div>
          <div>
            <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 w-full bg-gray-100 rounded-lg"></div>
          </div>
          <div>
            <div className="h-4 w-36 bg-gray-200 rounded mb-2"></div>
            <div className="h-32 w-full bg-gray-100 rounded-lg"></div>
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
const PAGE_ID = PAGE_PERMISSIONS.MEDICAL_REPORT_NEW;

const ReportNew = () => {
  const navigate = useNavigate();
  
  // Permission data state
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialFormState = {
    reportId: 0,
    patientId: 0,
    title: '',
    description: '',
    severity: 'mild' as const,
  };

  const [formData, setFormData] = useState<Omit<Medical, 'createdAt' | 'updatedAt' | 'createdBy'>>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessActions, setShowSuccessActions] = useState(false);
  const [createdReportId, setCreatedReportId] = useState<number | null>(null);

  // resetKey forces StudentListCompound to completely reset its internal state/input
  const [resetKey, setResetKey] = useState(0);

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
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, []);

  // Permission check using ONLY permissionData
  const hasAccess = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return canAccess(permissionData, PAGE_ID);
  };

  // Check if user has permission to view medical reports list
  const canViewReportsList = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return canAccess(permissionData, PAGE_PERMISSIONS.MEDICAL_REPORT_LIST);
  };

  // Auto-hide ONLY errors
  useEffect(() => {
    if (error || (message && !showSuccessActions)) {
      const timer = setTimeout(() => {
        setError('');
        if (!showSuccessActions) setMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, message, showSuccessActions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!hasAccess()) return;
    
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePatientSelect = (student: { id?: number } | null) => {
    if (!hasAccess()) return;
    
    setFormData(prev => ({
      ...prev,
      patientId: student ? student.id! : 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess()) return;
    
    setIsSubmitting(true);
    setError('');

    if (!formData.patientId || !formData.title || !formData.description || !formData.severity) {
      setError('Please fill out all required fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      const reportData: Medical = {
        ...formData,
        reportId: 0, // Use 0 for new submissions as expected by backend
      };

      const result = await medicalAPI.saveMedicalReport(reportData);

      // Handle the response which now contains just the reportId
      setCreatedReportId(result.reportId);
      setMessage(`Medical report created successfully! (ID: ${result.reportId})`);
      setShowSuccessActions(true);
    } catch (err) {
      console.error('Error creating medical report:', err);
      
      // Check if it's a permission error
      const errorMsg = err instanceof Error ? err.message : 'Error creating medical report';
      if (errorMsg.toLowerCase().includes('forbidden') || 
          errorMsg.toLowerCase().includes('403') ||
          errorMsg.toLowerCase().includes('unauthorized')) {
        setAccessDenied(true);
        setErrorMessage(errorMsg);
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterNew = () => {
    if (!hasAccess()) return;
    
    // 1. Reset Form state
    setFormData(initialFormState);
    setShowSuccessActions(false);
    setCreatedReportId(null);
    setMessage('');
    setError('');

    // 2. Force Student Name component to blank out by changing its key
    setResetKey(prev => prev + 1);

    // 3. Reset scroll position
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Header component
  const Header = () => (
    <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 border-b border-gray-100">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/user/medical')}
            disabled={!hasAccess()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiArrowLeft /> Back
          </button>
          <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
          <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
            Register New Medical Report
          </h1>
        </div>
        {/* Check if user has permission to view medical reports */}
        {canViewReportsList() && (
          <button
            onClick={() => navigate('/user/medical')}
            disabled={!hasAccess()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            View All Reports
          </button>
        )}
      </div>
    </div>
  );

  // Show loading while permissions are loading
  if (permissionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <Header />
        <ReportFormSkeleton />
      </div>
    );
  }

  // Show access denied if user doesn't have permission
  if (!hasAccess() || accessDenied || permissionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <AccessAlert message={errorMessage || "You do not have permission to create medical reports."} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      <Header />

      {isLoading ? (
        <ReportFormSkeleton />
      ) : (
        <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-6 flex-wrap sm:flex-nowrap">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Register New Medical Report
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Fill in the details below to register a new medical report.
                </p>
              </div>

              {(message || error) && (
                <div
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 border min-w-[220px] ${
                    showSuccessActions
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {showSuccessActions ? (
                    <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                    </svg>
                  )}
                  <span>{message || error}</span>
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="patientId">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <StudentListCompound
                  onStudentSelect={handlePatientSelect}
                  initialStudentId={formData.patientId || undefined}
                  key={resetKey}
                />
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={!hasAccess()}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="e.g., Asthma Management Plan"
                />
              </div>

              {/* Description Textarea */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  required
                  disabled={!hasAccess()}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="Provide a detailed description..."
                />
              </div>

              {/* Severity Select */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="severity">
                  Severity Level <span className="text-red-500">*</span>
                </label>
                <select
                  id="severity"
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  required
                  disabled={!hasAccess()}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="critical">Critical</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              {showSuccessActions ? (
                <>
                  {createdReportId && (
                    <button
                      type="button"
                      onClick={() => navigate(`/medical/${createdReportId}`)}
                      className="px-6 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all"
                    >
                      View Report
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRegisterNew}
                    className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all"
                  >
                    Register New
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.patientId || !hasAccess()}
                  className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Registering...
                    </>
                  ) : 'Register Report'}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ReportNew;