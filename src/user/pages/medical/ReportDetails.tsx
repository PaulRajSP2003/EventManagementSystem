import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiEdit,
  FiUser,
  FiAlertTriangle,
  FiCalendar,
  FiInfo,
  FiHeart
} from 'react-icons/fi';
import type { Medical, MedicalTreatment } from '../../../types';
import MedicalTreatmentComponent from '../components/MedicalTreatmentComponent';
import EmptyState from '../components/EmptyState';
import StickyHeader from '../components/StickyHeader';
import { PAGE_PERMISSIONS, canAccess, fetchPermissionData, type PermissionData } from '../permission';
import AccessAlert from '../components/AccessAlert';
import { medicalAPI } from '../api/MedicalData';
import { studentAPI } from '../api/StudentData';

// --- Helper Components & Functions ---

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50 text-red-700',
        border: 'border-red-100',
        icon: 'text-red-500',
        banner: 'from-red-600 to-red-700'
      };
    case 'moderate':
      return {
        bg: 'bg-amber-50 text-amber-700',
        border: 'border-amber-100',
        icon: 'text-amber-500',
        banner: 'from-amber-500 to-amber-600'
      };
    default:
      return {
        bg: 'bg-emerald-50 text-emerald-700',
        border: 'border-emerald-100',
        icon: 'text-emerald-500',
        banner: 'from-emerald-500 to-emerald-600'
      };
  }
};

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 mb-4 mt-2 pb-2 border-b border-gray-100">
    <Icon className="text-indigo-500 text-lg" />
    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
  </div>
);

const ReportDetailsSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 animate-pulse">
    <div className="max-w-5xl mx-auto px-4 mt-8">
      {/* Main card skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="h-2 w-full bg-gray-200"></div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
              <div>
                <div className="h-7 w-48 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              <div>
                <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-40 bg-gray-200 rounded"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="h-3 w-12 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
                <div>
                  <div className="h-3 w-16 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="h-6 w-24 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-10 bg-gray-200 rounded"></div>
                <div className="h-3 w-28 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
            <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 w-full bg-gray-100 rounded-xl mb-6"></div>
            <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              <div className="h-16 w-full bg-gray-100 rounded-lg"></div>
              <div className="h-16 w-full bg-gray-100 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Permission constants
const PAGE_ID = PAGE_PERMISSIONS.MEDICAL_REPORT_DETAIL;
const STUDENT_DETAIL = PAGE_PERMISSIONS.STUDENT_DETAIL;
const MEDICAL_REPORT_EDIT = PAGE_PERMISSIONS.MEDICAL_REPORT_EDIT;
const MEDICAL_TREATMENT_ADDING = PAGE_PERMISSIONS.MEDICAL_TREATMENT_ADD;

// --- Main Component ---

const ReportDetails = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  // Permission data state
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [report, setReport] = useState<Medical | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [treatments, setTreatments] = useState<MedicalTreatment[]>([]);

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

  // Permission checks using ONLY permissionData
  const hasPageAccess = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return canAccess(permissionData, PAGE_ID);
  };

  const canViewStudentProfile = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return canAccess(permissionData, STUDENT_DETAIL);
  };

  const canEditReport = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return canAccess(permissionData, MEDICAL_REPORT_EDIT);
  };

  const canManageTreatments = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return canAccess(permissionData, MEDICAL_TREATMENT_ADDING);
  };


  useEffect(() => {
    // Check access before loading data
    if (!hasPageAccess()) {
      setLoading(false);
      return;
    }

    const fetchReportDetails = async () => {
      setLoading(true);
      try {
        const reportIdNum = Number(reportId);
        if (!reportIdNum) {
          setError('Invalid report ID');
          return;
        }

        // Fetch report and students in parallel
        const [foundReport, students] = await Promise.all([
          medicalAPI.getMedicalReportById(reportIdNum),
          studentAPI.getStudents()
        ]);

        setReport(foundReport);
        setPatient(students.find(s => s.id === foundReport.patientId) || null);

        // Fetch treatments for this report
        const treatmentsData = await medicalAPI.listTreatmentsByReportId(reportIdNum);
        setTreatments(treatmentsData);
      } catch (err) {
        console.error('Error fetching report details:', err);
        
        // Check if it's a permission error
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch report details';
        if (errorMsg.toLowerCase().includes('forbidden') || 
            errorMsg.toLowerCase().includes('403') ||
            errorMsg.toLowerCase().includes('unauthorized') ||
            errorMsg.toLowerCase().includes('401')) {
          setAccessDenied(true);
          setErrorMessage(errorMsg);
        } else {
          setError(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (hasPageAccess()) {
      fetchReportDetails();
    }
  }, [reportId, permissionData]);

  const handleAddTreatment = async (newTreatment: Omit<MedicalTreatment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!report || !hasPageAccess() || !canManageTreatments()) return;

    try {
      const treatmentToSave = {
        ...newTreatment,
        reportId: report.reportId,
      };

      await medicalAPI.saveMedicalTreatment(treatmentToSave);

      // Refresh treatments list after successful save
      const updatedTreatments = await medicalAPI.listTreatmentsByReportId(report.reportId!);
      setTreatments(updatedTreatments);
    } catch (error) {
      console.error('Failed to add treatment:', error);
      
      // Check if it's a permission error
      const errorMsg = error instanceof Error ? error.message : 'Failed to add treatment';
      if (errorMsg.toLowerCase().includes('forbidden') || 
          errorMsg.toLowerCase().includes('403') ||
          errorMsg.toLowerCase().includes('unauthorized')) {
        setAccessDenied(true);
        setErrorMessage(errorMsg);
      }
    }
  };

  const handleEditTreatment = async (_index: number, updatedTreatment: MedicalTreatment) => {
    if (!hasPageAccess() || !canManageTreatments()) return;

    try {
      const treatmentToUpdate = {
        ...updatedTreatment,
        reportId: updatedTreatment.reportId || report?.reportId || 0,
        id: updatedTreatment.id, // Use existing id for update
      };

      await medicalAPI.updateMedicalTreatment(treatmentToUpdate);

      // Refresh treatments list after successful update
      if (report) {
        const updatedTreatments = await medicalAPI.listTreatmentsByReportId(report.reportId!);
        setTreatments(updatedTreatments);
      }
    } catch (error) {
      console.error('Failed to update treatment:', error);
      
      // Check if it's a permission error
      const errorMsg = error instanceof Error ? error.message : 'Failed to update treatment';
      if (errorMsg.toLowerCase().includes('forbidden') || 
          errorMsg.toLowerCase().includes('403') ||
          errorMsg.toLowerCase().includes('unauthorized')) {
        setAccessDenied(true);
        setErrorMessage(errorMsg);
      }
    }
  };

  const handleDeleteTreatment = (_index: number) => {
    // Delete functionality not implemented in API yet
    
  };

  // Show loading while permissions are loading
  if (permissionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <StickyHeader title="Medical Report Details" onBack={() => navigate('/user/medical')} />
        <ReportDetailsSkeleton />
      </div>
    );
  }

  // Show access denied if user doesn't have page permission
  if (!hasPageAccess() || accessDenied || permissionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <AccessAlert message={errorMessage || "You do not have access to view medical reports."} />
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      <StickyHeader title="Medical Report Details" onBack={() => navigate('/user/medical')} />
      <ReportDetailsSkeleton />
    </div>
  );

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <StickyHeader title="Medical Report Details" onBack={() => navigate('/user/medical')} />
        <div className="max-w-5xl mx-auto px-4 mt-6">
          <EmptyState
            title={error ? 'Error' : 'Report Not Found'}
            error={error}
            message={!error ? 'The medical report you are looking for does not exist.' : undefined}
            buttonText="Back to List"
            navigatePath="/user/medical"
          />
        </div>
      </div>
    );
  }

  const sev = getSeverityColor(report.severity);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      <StickyHeader title="Medical Report Details" onBack={() => navigate('/user/medical')}>
        <button
          onClick={() => canEditReport() ? navigate(`/user/medical/edit/${reportId}`) : null}
          disabled={!canEditReport()}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-sm ${
            canEditReport()
              ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              : 'bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
          }`}
          title={!canEditReport() ? "You don't have permission to edit medical reports" : ""}
        >
          <FiEdit /> Edit Report
        </button>
      </StickyHeader>

      <div className="max-w-5xl mx-auto px-4 mt-6">
        {/* Report Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
          <div className={`h-2 w-full bg-gradient-to-r ${sev.banner}`}></div>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${sev.bg} bg-opacity-50`}>
                  {report.severity === 'critical' ? <FiAlertTriangle size={24} /> : <FiHeart size={24} />}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 capitalize">{report.title}</h1>
                  <p className="text-slate-500 text-sm">Report ID: #{report.reportId}</p>
                </div>
              </div>
              <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start md:self-center ${sev.bg} border ${sev.border}`}>
                {report.severity}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Patient & Meta Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
              <SectionHeader icon={FiUser} title="Patient Info" />
              {patient ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Name</p>
                    <p className="font-medium text-slate-900 capitalize">{patient.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase">Age</p>
                      <p className="font-medium text-slate-900">{patient.age} Yrs</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase">Gender</p>
                      <p className="font-medium text-slate-900 capitalize">{patient.gender}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Location</p>
                    <p className="font-medium text-slate-900 capitalize">{patient.place}</p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => canViewStudentProfile() ? navigate(`/user/student/${patient.id}`) : null}
                      disabled={!canViewStudentProfile()}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition border ${
                        canViewStudentProfile()
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                          : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                      }`}
                      title={!canViewStudentProfile() ? "You don't have permission to view student profiles" : ""}
                    >
                      <FiUser />
                      <span className="hidden sm:inline">View Profile</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No patient data linked.</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
              <SectionHeader icon={FiCalendar} title="Timeline" />
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Created:</span>
                  <span className="font-medium text-slate-700">
                    {report.createdAt ? new Date(report.createdAt).toLocaleString() : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">By:</span>
                  <span className="font-medium text-slate-700">{report.createdBy}</span>
                </div>
                {report.updatedAt !== report.createdAt && (
                  <div className="flex justify-between pt-2 border-t border-slate-50">
                    <span className="text-slate-500">Updated:</span>
                    <span className="font-medium text-slate-700">
                      {report.updatedAt ? new Date(report.updatedAt).toLocaleString() : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Details & Treatments */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
              <SectionHeader icon={FiInfo} title="Condition Details" />
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {report.description}
                </p>
              </div>

              <div className="mt-8">
                <MedicalTreatmentComponent
                  treatments={treatments}
                  onAddTreatment={handleAddTreatment}
                  onEditTreatment={handleEditTreatment}
                  onDeleteTreatment={handleDeleteTreatment}
                  canManageTreatments={canManageTreatments()}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetails;
