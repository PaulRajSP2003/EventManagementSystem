// src/user/pages/medical/ReportEdit.tsx
import { useState, useEffect } from 'react';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import StudentListCompound from '../components/StudentListCompound';
import type { Medical } from '../../../types';
import { PAGE_PERMISSIONS, canAccess, fetchPermissionData, type PermissionData } from '../permission';
import AccessAlert from '../components/AccessAlert';
import { medicalAPI } from '../api/MedicalData';

// Skeleton (unchanged)
const ReportEditSkeleton = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 mt-2 sm:mt-8 space-y-6 animate-pulse">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="h-6 w-40 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-72 bg-gray-200 rounded"></div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="h-4 w-36 bg-gray-200 rounded mb-2"></div>
            <div className="h-12 w-full bg-gray-100 rounded-lg"></div>
          </div>

          <div>
            <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 w-full bg-gray-100 rounded-lg"></div>
          </div>

          <div>
            <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-32 w-full bg-gray-100 rounded-lg"></div>
          </div>

          <div>
            <div className="h-4 w-28 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 w-full bg-gray-100 rounded-lg"></div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <div className="h-10 w-24 bg-gray-200 rounded mr-3"></div>
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

// Permission constant for this page
const PAGE_ID = PAGE_PERMISSIONS.MEDICAL_REPORT_EDIT;

const ReportEdit = () => {
  const navigate = useNavigate();
  const { reportId } = useParams<{ reportId: string }>();
  const reportIdNum = parseInt(reportId || '0');
  
  // Permission data state
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Medical, 'createdAt' | 'updatedAt' | 'createdBy' | 'reportId'>>({
    patientId: 0,
    title: '',
    description: '',
    severity: 'mild',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessActions, setShowSuccessActions] = useState(false);

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

  // Check if user has permission to view medical reports list
  const canViewReportsList = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return canAccess(permissionData, PAGE_PERMISSIONS.MEDICAL_REPORT_LIST);
  };

  // Fetch report data
  useEffect(() => {
    // Check access before loading data
    if (!hasAccess()) {
      setIsLoading(false);
      return;
    }

    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const report = await medicalAPI.getMedicalReportById(reportIdNum);

        setFormData({
          patientId: report.patientId,
          title: report.title,
          description: report.description,
          severity: report.severity,
        });
      } catch (err) {
        console.error('Error loading medical report:', err);
        
        // Check if it's a permission error
        const errorMsg = err instanceof Error ? err.message : 'Error loading medical report';
        if (errorMsg.toLowerCase().includes('forbidden') || 
            errorMsg.toLowerCase().includes('403') ||
            errorMsg.toLowerCase().includes('unauthorized')) {
          setAccessDenied(true);
          setErrorMessage(errorMsg);
        } else {
          setError(errorMsg);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (reportIdNum && hasAccess()) {
      fetchReport();
    } else if (!reportIdNum) {
      setError('Invalid report ID.');
      setIsLoading(false);
    }
  }, [reportIdNum, permissionData]);

  // Auto-hide ONLY errors — success persists
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
    setMessage('');
    setError('');
    setShowSuccessActions(false);

    if (!formData.patientId || !formData.title || !formData.description || !formData.severity) {
      setError('Please fill out all required fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      const reportData: Medical = {
        ...formData,
        reportId: reportIdNum, // Include the reportId for updating
      };

      await medicalAPI.saveMedicalReport(reportData);
      setMessage('Medical report updated successfully!');
      setShowSuccessActions(true);
    } catch (err) {
      console.error('Error updating medical report:', err);
      
      // Check if it's a permission error
      const errorMsg = err instanceof Error ? err.message : 'Error updating medical report';
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

  const Header = () => (
    <div className="bg-white sticky top-0 z-10 px-4 py-3 border-b border-gray-100 hidden sm:block">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(`/user/medical/${reportId}`)}
            disabled={!hasAccess()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiArrowLeft /> Back
          </button>
          <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
          <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
            Edit Medical Report
          </h1>
        </div>
        {/* Check if user has permission to view medical reports */}
        {canViewReportsList() && (
          <button
            onClick={() => navigate('/user/medical')}
            disabled={!hasAccess()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
        <ReportEditSkeleton />
      </div>
    );
  }

  // Show access denied if user doesn't have permission
  if (!hasAccess() || accessDenied || permissionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <AccessAlert message={errorMessage || "You do not have permission to edit medical reports."} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      <Header />

      {isLoading ? (
        <ReportEditSkeleton />
      ) : (
        <div className="max-w-5xl mx-auto px-4 mt-2 sm:mt-8 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-6 flex-wrap sm:flex-nowrap">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Edit Medical Report
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Update the details of this medical report below.
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

            <div className="p-4 sm:p-6 space-y-6">
              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="patientId">
                  Student Name <span className="text-red-500">*</span>
                </label>
                
                <StudentListCompound
                  onStudentSelect={handlePatientSelect}
                  initialStudentId={formData.patientId || undefined}
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
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all resize-y disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="Provide a detailed description of the medical condition, symptoms, treatment plan, or other relevant information."
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

            {/* Form Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              {showSuccessActions ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(`/medical/${reportId}`)}
                    className="px-6 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-all"
                  >
                    View Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSuccessActions(false)}
                    className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium transition-all"
                  >
                    Edit Again
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.patientId || !hasAccess()}
                  className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : 'Update Report'}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ReportEdit;
