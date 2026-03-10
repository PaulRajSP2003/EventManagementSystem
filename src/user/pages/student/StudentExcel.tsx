// src/user/pages/admin/excel_data/StudentExcel.tsx
import { useState, useEffect, useRef } from 'react';
import React from 'react';
// ErrorBoundary component for catching errors in step components
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-bold text-red-700 mb-2">Something went wrong.</h2>
          <p className="text-sm text-red-600 mb-4">An error occurred while rendering this step. Please try again or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
import {
  FiArrowLeft, FiDownload, FiUpload, FiFileText,
  FiRefreshCw, FiArrowRight, FiX, FiCheckCircle, FiAlertCircle, FiMapPin,
  FiHeart, FiChevronLeft, FiChevronRight, FiUsers, FiSave,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchPermissionData, type PermissionData, isAdminOrCoAdmin } from '../permission';
import AccessAlert from '../components/AccessAlert';
import PlaceAPI, { type PhotonFeature } from '../api/PlaceList';
import * as XLSX from 'xlsx';

// Types
interface StudentData {
  name: string;
  age: number;
  gender: 'male' | 'female';
  place: string;
  latitude?: number;
  longitude?: number;
  parentName: string;
  contactNumber: string;
  whatsappNumber: string;
  churchName: string;
  medication: 'yes' | 'no';
  medicalReport?: string;
  staying: 'no';
  status: 'registered';
  remark?: string;
}

interface ExcelRow {
  [key: string]: string | number | null | undefined;
}

interface ColumnMapping {
  excelColumn: string;
  studentField: keyof StudentData | '';
  required: boolean;
}

interface StudentWithLocation extends StudentData {
  _rowIndex: number;
  originalPlace: string;
  locationStatus?: 'pending' | 'verified' | 'not_found';
  originalMedication?: string;
  medicationStatus?: 'pending' | 'verified';
  duplicateGroup?: number;
  isDuplicate?: boolean;
  _isValid: boolean;
  _errors: string[];
  _warnings: string[];
}

interface DuplicateGroup {
  id: number;
  students: StudentWithLocation[];
  matchFields: string[];
  confidence: 'high' | 'medium' | 'low';
}

// All available fields
const ALL_FIELDS: { field: keyof StudentData; label: string; required: boolean }[] = [
  { field: 'name', label: 'Full Name', required: true },
  { field: 'age', label: 'Age', required: true },
  { field: 'gender', label: 'Gender', required: true },
  { field: 'place', label: 'Place', required: true },
  { field: 'parentName', label: 'Parent Name', required: true },
  { field: 'contactNumber', label: 'Contact Number', required: true },
  { field: 'whatsappNumber', label: 'WhatsApp Number', required: true },
  { field: 'churchName', label: 'Church Name', required: false },
  { field: 'medication', label: 'Medication', required: false },
  { field: 'remark', label: 'Remarks', required: false },
];

// Excel header mappings
const COMMON_HEADER_MAPPINGS: Record<string, keyof StudentData> = {
  'full name': 'name',
  'name': 'name',
  'student name': 'name',
  'age': 'age',
  'gender': 'gender',
  'place': 'place',
  'location': 'place',
  'parent/guardian name': 'parentName',
  'parent name': 'parentName',
  'guardian name': 'parentName',
  'parent': 'parentName',
  'church name': 'churchName',
  'church': 'churchName',
  'contact number': 'contactNumber',
  'contact': 'contactNumber',
  'phone': 'contactNumber',
  'whatsapp number': 'whatsappNumber',
  'whatsapp': 'whatsappNumber',
  'medication': 'medication',
  'remarks': 'remark',
  'notes': 'remark',
  'remarks / notes': 'remark',
};

type Step = 'upload' | 'mapping' | 'duplicates' | 'locations' | 'medications' | 'preview';

const StudentExcelSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 mt-8">
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-pulse">
      <div className="p-6 border-b border-slate-100">
        <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-64 bg-gray-200 rounded"></div>
      </div>
      <div className="p-6 space-y-6">
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8">
          <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mx-auto mb-2"></div>
          <div className="h-3 w-64 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    </div>
  </div>
);

const StudentExcel = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Permission states
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Upload states
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);

  // Mapping states
  const [columnMapping, setColumnMapping] = useState<ColumnMapping[]>([]);
  const [mappedStudents, setMappedStudents] = useState<StudentWithLocation[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Duplicate states
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  // Location states
  const [searchingLocation, setSearchingLocation] = useState<number | null>(null);

  // Import states
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState({ total: 0, completed: 0, failed: 0 });
  const [importResults, setImportResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Fetch permission data on component mount
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setPermissionLoading(true);
        setPermissionError(false);
        const data = await fetchPermissionData();
        setPermissionData(data);

        // Change from isAdmin to isAdminOrCoAdmin
        const hasAccess = isAdminOrCoAdmin(data);
        setAccessDenied(!hasAccess);

        if (!hasAccess) {
          setErrorMessage("Only administrators and co-administrators can access the student Excel import feature");
        }
      } catch (error: any) {
        console.error('Failed to load permissions:', error);
        setPermissionData(null);
        setPermissionError(true);
        setAccessDenied(true);

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

  // Update the hasAdminAccess function
  const hasAdminAccess = () => {
    return isAdminOrCoAdmin(permissionData);
  };

  // Download template
  const downloadTemplate = () => {
    const template = [
      {
        'Full Name': 'Aarav Nair',
        'Age': 14,
        'Gender': 'Male',
        'Place': 'Kazhakoottam',
        'Parent/Guardian Name': 'Suresh Nair',
        'Church Name': 'St. Thomas Church',
        'Contact Number': '9876543210',
        'WhatsApp Number': '9876543210',
        'Medication': 'None',
        'Remarks / Notes': ''
      },
      {
        'Full Name': 'Ananya Pillai',
        'Age': 13,
        'Gender': 'Female',
        'Place': 'Pattom',
        'Parent/Guardian Name': 'Lekha Pillai',
        'Church Name': 'CSI Church Pattom',
        'Contact Number': '9123456780',
        'WhatsApp Number': '9123456780',
        'Medication': 'Asthma Inhaler',
        'Remarks / Notes': 'Carries inhaler'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_import_template.xlsx');
  };

  // Reset upload
  const resetUpload = () => {
    setCurrentStep('upload');
    setFileName('');
    setUploadError('');
    setExcelData([]);
    setExcelHeaders([]);
    setColumnMapping([]);
    setMappedStudents([]);
    setDuplicateGroups([]);
    setValidationErrors([]);
    setCurrentPage(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !hasAdminAccess()) return;

    await processFile(file);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file || !hasAdminAccess()) return;

    await processFile(file);
  };

  // Process Excel file
  const processFile = async (file: File) => {
    setUploadError('');
    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        setUploadError('File must contain headers and at least one row of data');
        return;
      }

      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1).map((row: any[]) => {
        const rowData: ExcelRow = {};
        headers.forEach((header, index) => {
          const value = row[index];
          rowData[header] = value?.toString() || '';
        });
        return rowData;
      }).filter(row => Object.values(row).some(val => val && val.toString().trim() !== ''));

      setExcelHeaders(headers);
      setExcelData(rows);

      // Initialize column mappings with auto-suggestions
      const mappings: ColumnMapping[] = headers.map(header => {
        const normalizedHeader = header.toString().toLowerCase().trim();
        const mappedField = COMMON_HEADER_MAPPINGS[normalizedHeader] || '';
        const fieldInfo = ALL_FIELDS.find(f => f.field === mappedField);

        return {
          excelColumn: header,
          studentField: mappedField,
          required: fieldInfo?.required || false
        };
      });

      setColumnMapping(mappings);
      setCurrentStep('mapping');
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      setUploadError('Failed to parse Excel file. Please check the file format.');
    }
  };

  // Update column mapping
  const updateMapping = (studentField: keyof StudentData, excelColumn: string) => {
    setColumnMapping(prev => {
      // Remove any existing mapping for this student field
      const filtered = prev.filter(m => m.studentField !== studentField);
      // Add new mapping if column is selected
      if (excelColumn) {
        const fieldInfo = ALL_FIELDS.find(f => f.field === studentField);
        filtered.push({
          excelColumn,
          studentField,
          required: fieldInfo?.required || false
        });
      }
      return filtered;
    });
  };


  // Generate mapped student data
  const generateMappedData = () => {
    // Validate required fields are mapped
    const requiredFields = ALL_FIELDS.filter(f => f.required).map(f => f.field);
    const mappedFields = columnMapping.map(m => m.studentField);
    const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));

    if (missingRequired.length > 0) {
      const missingLabels = missingRequired.map(f =>
        ALL_FIELDS.find(field => field.field === f)?.label
      );
      setValidationErrors([`Required fields not mapped: ${missingLabels.join(', ')}`]);
      return;
    }

    setValidationErrors([]);

    // Create mapped student objects
    const students: StudentWithLocation[] = excelData.map((row, index) => {
      const student: Partial<StudentWithLocation> = {
        _rowIndex: index + 2,
        _isValid: true,
        _errors: [],
        _warnings: [],
        originalPlace: '',
        name: '',
        age: 0,
        gender: 'male',
        place: '',
        parentName: '',
        contactNumber: '',
        whatsappNumber: '',
        churchName: 'no',
        medication: 'no',
        staying: 'no',
        status: 'registered'
      };

      // Apply mappings
      columnMapping.forEach(mapping => {
        if (mapping.studentField) {
          const value = row[mapping.excelColumn];

          switch (mapping.studentField) {
            case 'age':
              student.age = value ? Number(value) : 0;
              break;
            case 'gender':
              const genderValue = value?.toString().toLowerCase() || '';
              student.gender = (genderValue === 'female' || genderValue === 'f') ? 'female' : 'male';
              break;
            case 'medication':
              const medValue = value?.toString().toLowerCase() || '';
              if (medValue && medValue !== 'none' && medValue !== 'no') {
                student.medication = 'yes';
                student.medicalReport = medValue;
              } else {
                student.medication = 'no';
              }
              break;
            default:
              if (value) {
                (student as any)[mapping.studentField] = value.toString().trim();
              }
          }

          if (mapping.studentField === 'place') {
            student.originalPlace = value?.toString() || '';
          }
          if (mapping.studentField === 'medication') {
            student.originalMedication = value?.toString() || '';
          }
        }
      });

      // Validate required fields
      ALL_FIELDS.filter(f => f.required).forEach(field => {
        const value = student[field.field];
        if (!value || (typeof value === 'string' && !value.trim())) {
          if (student._errors) {
            student._errors.push(`${field.label} is required`);
          }
          student._isValid = false;
        }
      });

      // Validate contact number
      if (student.contactNumber && student.contactNumber.length < 10) {
        if (student._errors) {
          student._errors.push('Contact number must be at least 10 digits');
        }
        student._isValid = false;
      }

      // Set default WhatsApp if not provided
      if (!student.whatsappNumber && student.contactNumber) {
        student.whatsappNumber = student.contactNumber;
      }

      return student as StudentWithLocation;
    });

    setMappedStudents(students);
    checkDuplicates(students);
    setCurrentStep('duplicates');
  };

  // Check for duplicates
  // Improved duplicate checking with parent name and age
  const checkDuplicates = (students: StudentWithLocation[]) => {
    const groups: DuplicateGroup[] = [];
    let groupId = 1;

    for (let i = 0; i < students.length; i++) {
      if (students[i].duplicateGroup) continue;

      const group: StudentWithLocation[] = [students[i]];
      const matchFields: string[] = [];

      for (let j = i + 1; j < students.length; j++) {
        if (students[j].duplicateGroup) continue;

        let isDuplicate = false;
        const fields: string[] = [];

        // Check if contact/WhatsApp matches (strong indicator)
        const contactMatch = students[i].contactNumber &&
          students[j].contactNumber &&
          students[i].contactNumber === students[j].contactNumber;

        const whatsappMatch = students[i].whatsappNumber &&
          students[j].whatsappNumber &&
          students[i].whatsappNumber === students[j].whatsappNumber;

        // If contact matches, check if it's the same person or different sibling
        if (contactMatch || whatsappMatch) {
          // Check parent name to distinguish siblings
          const parentMatch = students[i].parentName?.toLowerCase() ===
            students[j].parentName?.toLowerCase();

          // Check if ages are close (within 1 year) - same child
          const ageDiff = Math.abs((students[i].age || 0) - (students[j].age || 0));
          const similarAge = ageDiff <= 1;

          // Check name similarity
          const name1 = students[i].name?.toLowerCase() || '';
          const name2 = students[j].name?.toLowerCase() || '';
          const nameMatch = name1 === name2 ||
            name1.includes(name2) ||
            name2.includes(name1);

          // It's the same person if:
          // - Same contact AND (same parent OR similar age) AND name matches
          if ((contactMatch || whatsappMatch) && parentMatch && nameMatch && similarAge) {
            isDuplicate = true;
            if (contactMatch) fields.push('contactNumber');
            if (whatsappMatch) fields.push('whatsappNumber');
            if (parentMatch) fields.push('parentName');
          }
        }

        // Check name + place combination (weaker indicator)
        if (!isDuplicate && students[i].place && students[j].place) {
          const placeMatch = students[i].place.toLowerCase() === students[j].place.toLowerCase();
          const name1 = students[i].name?.toLowerCase() || '';
          const name2 = students[j].name?.toLowerCase() || '';
          const exactNameMatch = name1 === name2;

          if (exactNameMatch && placeMatch) {
            isDuplicate = true;
            fields.push('name', 'place');
          }
        }

        if (isDuplicate) {
          group.push(students[j]);
          students[j].duplicateGroup = groupId;
          students[j].isDuplicate = true;
          matchFields.push(...fields);
        }
      }

      if (group.length > 1) {
        students[i].duplicateGroup = groupId;
        students[i].isDuplicate = true;

        const confidence = matchFields.includes('contactNumber') || matchFields.includes('whatsappNumber')
          ? 'high'
          : 'medium';

        groups.push({
          id: groupId,
          students: group,
          matchFields: [...new Set(matchFields)],
          confidence
        });

        groupId++;
      }
    }

    setDuplicateGroups(groups);
  };


  // Handle duplicate actions
  const handleDuplicateAction = (action: 'keep' | 'remove') => {
    if (action === 'keep') {
      // Just keep all duplicates as is
      setCurrentStep('locations');
    } else {
      // Remove duplicates (keep first occurrence only)
      const uniqueStudents = mappedStudents.filter((student, index, self) => {
        if (!student.isDuplicate) return true;
        const firstIndex = self.findIndex(s => s.duplicateGroup === student.duplicateGroup);
        return index === firstIndex;
      });

      setMappedStudents(uniqueStudents);
      setDuplicateGroups([]);
      setCurrentStep('locations');
    }
  };

  // Verify location for a student
  const verifyLocation = async (index: number, place: string) => {
    if (!place || place.length < 2) return;

    setSearchingLocation(index);

    try {
      const features = await PlaceAPI.searchPlaces(place, 1);
      const updated = [...mappedStudents];

      if (features.length > 0) {
        const { lat, lng } = PlaceAPI.getPlaceCoordinates(features[0]);
        updated[index].latitude = lat;
        updated[index].longitude = lng;
        updated[index].locationStatus = 'verified';
        updated[index].place = PlaceAPI.getPlaceDisplayName(features[0]);
        updated[index]._warnings = updated[index]._warnings.filter(w => !w.includes('Location'));
      } else {
        updated[index].locationStatus = 'not_found';
        updated[index]._warnings.push('Location could not be verified');
      }

      setMappedStudents(updated);
    } catch (error) {
      console.error('Error verifying location:', error);
    } finally {
      setSearchingLocation(null);
    }
  };

  // Get current page data for pagination
  const getCurrentPageData = (data: any[]) => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  };

  // Pagination component
  const PaginationControls = ({ totalItems }: { totalItems: number }) => {
    const totalPages = Math.ceil(totalItems / rowsPerPage);

    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
        <div className="text-sm text-slate-600">
          Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalItems)} of {totalItems} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronLeft />
          </button>
          <span className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
    );
  };

  // Header component
  const Header = () => (
    <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 border-b border-gray-100">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/user/student')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
          >
            <FiArrowLeft /> Back to Students
          </button>
          <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
          <h1 className="text-lg font-bold text-slate-800 hidden sm:block">Student Excel Data Import</h1>
        </div>
        <div className="flex items-center gap-3">
          {currentStep !== 'upload' && (
            <button
              onClick={resetUpload}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium"
            >
              <FiRefreshCw /> New Upload
            </button>
          )}
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium"
          >
            <FiDownload /> Download Template
          </button>
        </div>
      </div>
    </div>
  );

  // Step indicator component
  const StepIndicator = () => {
    const steps = ['upload', 'mapping', 'duplicates', 'locations', 'medications', 'preview'];
    const stepLabels = ['Upload', 'Map Columns', 'Check Duplicates', 'Verify Locations', 'Medication', 'Preview'];
    const currentIndex = steps.indexOf(currentStep);

    return (
      <div className="flex items-center justify-center mb-8 flex-wrap gap-2">
        {stepLabels.map((step, index) => {
          const isActive = currentStep === steps[index];
          const isCompleted = currentIndex > index;

          return (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${isActive
                  ? 'bg-indigo-600 text-white'
                  : isCompleted
                    ? 'bg-green-100 text-green-600 border-2 border-green-600'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <FiCheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className={`mx-2 text-sm ${isActive ? 'font-medium text-slate-700' : 'text-slate-400'}`}>
                {step}
              </span>
              {index < 5 && <FiArrowRight className="text-slate-300 mx-2" />}
            </div>
          );
        })}
      </div>
    );
  };

  // Upload step component
  const UploadStep = () => (
    <div className="mb-6">
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-indigo-500 bg-indigo-50/50'
            : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <FiUpload className={`w-16 h-16 mx-auto mb-4 ${isDragging ? 'text-indigo-500' : 'text-slate-400'}`} />
        <p className="text-slate-700 font-medium mb-1">
          {isDragging ? 'Drop your file here' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-sm text-slate-500 mb-4">Excel files only (.xlsx, .xls, .csv)</p>

        {fileName && (
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg inline-flex items-center gap-2">
            <FiFileText className="text-indigo-600" />
            <span className="text-sm text-indigo-700">{fileName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetUpload();
              }}
              className="p-1 hover:bg-indigo-100 rounded"
            >
              <FiX className="w-4 h-4 text-indigo-600" />
            </button>
          </div>
        )}

        {uploadError && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg inline-flex items-center gap-2 text-red-600">
            <FiAlertCircle />
            <span className="text-sm">{uploadError}</span>
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">📋 Excel Format Tips:</h4>
        <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
          <li>First row should contain column headers (e.g., Full Name, Age, Gender, etc.)</li>
          <li>Required columns: Full Name, Age, Gender, Place, Parent/Guardian Name, Contact Number, WhatsApp Number</li>
          <li>Optional columns: Church Name, Medication, Remarks / Notes</li>
          <li>For medication: Enter "None" if no medication, or specify medication details</li>
          <li>Download the template for the correct format</li>
        </ul>
      </div>
    </div>
  );

  // Mapping step component - Simplified version with strict word matching
  const MappingStep = () => {
    const autoMapColumns = () => {
      const newMappings: ColumnMapping[] = [];
      const usedFields = new Set<keyof StudentData>();

      console.log('Excel Headers:', excelHeaders);

      const fieldKeywords: Record<keyof StudentData, string[]> = {
        name: ['Name Of Child', 'student name'],
        age: ['age'],
        gender: ['gender'],
        place: ['place', 'location'],
        parentName: ['parent', 'guardian', 'father', 'mother'],
        contactNumber: ['contact', 'phone', 'mobile'],
        whatsappNumber: ['whatsapp'],
        churchName: ['church', 'assembly'],
        medication: ['medication', 'medicine'],
        remark: ['remark', 'request', 'special'],
        medicalReport: ['report'],
        staying: ['staying'],
        status: ['status'],
        latitude: ['latitude'],
        longitude: ['longitude']
      };

      excelHeaders.forEach(header => {
        if (!header) return;

        const headerStr = header.toString().toLowerCase().trim();

        if (!headerStr) return;

        console.log(`Checking header: "${headerStr}"`);

        // Check each field's keywords
        Object.entries(fieldKeywords).forEach(([field, keywords]) => {
          const studentField = field as keyof StudentData;

          // Skip if this field is already mapped
          if (usedFields.has(studentField)) return;

          // Check if ANY keyword is present in the header
          const hasKeyword = keywords.some(keyword =>
            headerStr.includes(keyword.toLowerCase())
          );

          if (hasKeyword) {
            console.log(`✓ Matched "${header}" to ${field} (contains ${keywords.join(' or ')})`);

            const fieldInfo = ALL_FIELDS.find(f => f.field === studentField);
            newMappings.push({
              excelColumn: header,
              studentField: studentField,
              required: fieldInfo?.required || false
            });
            usedFields.add(studentField);
          }
        });
      });

      // Special handling for fields that might need multiple passes

      // If name is still not mapped, look for any header with 'name' that's not parent
      if (!usedFields.has('name')) {
        const nameHeader = excelHeaders.find(header => {
          const h = header?.toString().toLowerCase() || '';
          return h.includes('name') && !h.includes('parent') && !h.includes('guardian');
        });

        if (nameHeader) {
          console.log(`Special match: Using "${nameHeader}" for name`);
          newMappings.push({
            excelColumn: nameHeader,
            studentField: 'name',
            required: true
          });
          usedFields.add('name');
        }
      }

      // If place is not mapped, look for 'email' or 'timestamp' (from your sample data)
      if (!usedFields.has('place')) {
        const placeHeader = excelHeaders.find(header => {
          const h = header?.toString().toLowerCase() || '';
          return h.includes('email') || h.includes('timestamp');
        });

        if (placeHeader) {
          console.log(`Special match: Using "${placeHeader}" for place`);
          newMappings.push({
            excelColumn: placeHeader,
            studentField: 'place',
            required: true
          });
          usedFields.add('place');
        }
      }

      // If whatsapp is not mapped, use contact number
      if (!usedFields.has('whatsappNumber') && usedFields.has('contactNumber')) {
        const contactMapping = newMappings.find(m => m.studentField === 'contactNumber');
        if (contactMapping) {
          console.log('Using contact number for whatsapp');
          newMappings.push({
            excelColumn: contactMapping.excelColumn,
            studentField: 'whatsappNumber',
            required: false
          });
          usedFields.add('whatsappNumber');
        }
      }

      // Remove any duplicate mappings
      const uniqueMappings = newMappings.filter((mapping, index, self) =>
        index === self.findIndex(m => m.studentField === mapping.studentField)
      );

      // Log final mappings
      console.log('Final mappings:');
      uniqueMappings.forEach(m => {
        console.log(`  ${m.studentField} ← "${m.excelColumn}"`);
      });

      setColumnMapping(uniqueMappings);
      setValidationErrors([]);
    };

    return (
      <div className="mb-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <FiAlertCircle /> Map Your Excel Columns
              </h4>
              <p className="text-xs text-amber-700">
                Match your Excel columns to the student data fields. Required fields are marked with <span className="text-red-500">*</span>
              </p>
            </div>
            <button
              onClick={autoMapColumns}
              className="px-4 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 flex items-center gap-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              Auto-map
            </button>
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            {validationErrors.map((error, index) => (
              <p key={index} className="text-sm text-red-600 flex items-center gap-2">
                <FiAlertCircle /> {error}
              </p>
            ))}
          </div>
        )}

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Student Field</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Excel Column</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Sample Data</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {ALL_FIELDS.map((field) => {
                const mapping = columnMapping.find(m => m.studentField === field.field);
                const sampleValue = mapping?.excelColumn && excelData[0]
                  ? String(excelData[0][mapping.excelColumn] || '')
                  : '';
                return (
                  <tr key={field.field} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm">
                      <span className="font-medium text-slate-700">{field.label}</span>
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={mapping?.excelColumn || ''}
                        onChange={(e) => updateMapping(field.field, e.target.value)}
                        className="w-64 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-100 focus:border-transparent outline-none"
                      >
                        <option value="">-- Select column --</option>
                        {excelHeaders.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {sampleValue && (
                        <span className="font-mono">
                          {sampleValue.substring(0, 30)}
                          {sampleValue.length > 30 ? '...' : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={resetUpload}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
          >
            Back
          </button>
          <button
            onClick={generateMappedData}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition"
          >
            Next: Check for Duplicates <FiArrowRight />
          </button>
        </div>
      </div>
    );
  };

  // Duplicate step component
  const DuplicateStep = () => {
    const duplicateCount = mappedStudents.filter(s => s.isDuplicate).length;
    const uniqueCount = mappedStudents.length - duplicateCount;

    const displayData = showDuplicatesOnly
      ? mappedStudents.filter(s => s.isDuplicate)
      : mappedStudents;

    const currentData = getCurrentPageData(displayData);
    const startIndex = (currentPage - 1) * rowsPerPage;

    // Function to remove a single student
    const removeSingleStudent = (studentToRemove: StudentWithLocation) => {
      // Find the actual index in the main mappedStudents array
      const actualIndex = mappedStudents.findIndex(s =>
        s._rowIndex === studentToRemove._rowIndex
      );

      if (actualIndex === -1) return;

      // Show confirmation
      if (window.confirm(`Are you sure you want to remove ${studentToRemove.name}?`)) {
        const updatedStudents = mappedStudents.filter((_, index) => index !== actualIndex);
        setMappedStudents(updatedStudents);

        // Re-check duplicates after removal
        setTimeout(() => {
          checkDuplicates(updatedStudents);
        }, 100);
      }
    };

    // Function to keep a student (mark as not duplicate)
    const keepSingleStudent = (studentToKeep: StudentWithLocation) => {
      // Find the actual index in the main mappedStudents array
      const actualIndex = mappedStudents.findIndex(s =>
        s._rowIndex === studentToKeep._rowIndex
      );

      if (actualIndex === -1) return;

      // Show confirmation
      if (window.confirm(`Mark ${studentToKeep.name} as a unique/normal student?`)) {
        // Update the student to mark as not duplicate
        const updatedStudents = mappedStudents.map((student, index) => {
          if (index === actualIndex) {
            return {
              ...student,
              isDuplicate: false,
              duplicateGroup: undefined
            };
          }
          return student;
        });

        setMappedStudents(updatedStudents);

        // Re-check duplicates after keeping
        setTimeout(() => {
          checkDuplicates(updatedStudents);
        }, 100);
      }
    };

    return (
      <div className="mb-6">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                <FiUsers /> Duplicate Check
              </h4>
              <p className="text-xs text-orange-700">
                Found {duplicateCount} potential duplicate student records based on name, contact, WhatsApp, and place.
              </p>
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-orange-700">Total Records: {mappedStudents.length}</span>
                <span className="text-green-700">Unique: {uniqueCount}</span>
                <span className="text-red-700">Duplicates: {duplicateCount}</span>
              </div>
            </div>
            <button
              onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${showDuplicatesOnly
                ? 'bg-orange-200 text-orange-800'
                : 'bg-white text-orange-700 border border-orange-300'
                }`}
            >
              {showDuplicatesOnly ? 'Show All' : 'Show Duplicates Only'}
            </button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">WhatsApp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Place</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {currentData.map((student, index) => {
                const globalIndex = startIndex + index;

                return (
                  <tr
                    key={`duplicate-${student._rowIndex || globalIndex}-${student.name}`}
                    className={`hover:bg-slate-50 ${student.isDuplicate ? 'bg-orange-50/50' : ''
                      }`}
                  >
                    <td className="px-4 py-3 text-sm text-slate-500">{globalIndex + 1}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{student.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{student.contactNumber}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{student.whatsappNumber}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{student.place}</td>
                    <td className="px-4 py-3 text-sm">
                      {student.isDuplicate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                          <FiAlertCircle className="w-3 h-3" /> Duplicate
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          <FiCheckCircle className="w-3 h-3" /> Unique
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {/* Keep button - only show for duplicates */}
                        {student.isDuplicate && (
                          <button
                            onClick={() => keepSingleStudent(student)}
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition flex items-center gap-1"
                            title="Keep this student as unique"
                          >
                            <FiCheckCircle className="w-3 h-3" />
                            Keep
                          </button>
                        )}

                        {/* Remove button - show for all students */}
                        <button
                          onClick={() => removeSingleStudent(student)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition flex items-center gap-1"
                          title="Remove this student completely"
                        >
                          <FiX className="w-3 h-3" />
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Empty state */}
          {displayData.length === 0 && (
            <div className="text-center py-12">
              <FiUsers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No students to display</p>
            </div>
          )}
        </div>

        <PaginationControls totalItems={displayData.length} />

        <div className="flex justify-between gap-3 mt-4">
          <div className="flex gap-3">
            <button
              onClick={() => handleDuplicateAction('keep')}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 transition"
            >
              <FiCheckCircle /> Keep All Duplicates
            </button>
            <button
              onClick={() => handleDuplicateAction('remove')}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-red-700 transition"
            >
              <FiX /> Remove All Duplicates (Keep First)
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep('mapping')}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
            >
              Back to Mapping
            </button>
            <button
              onClick={() => setCurrentStep('locations')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition"
            >
              Continue to Locations <FiArrowRight />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const LocationStep = () => {
    // Guard clause: return early if no students data
    if (!mappedStudents || mappedStudents.length === 0) {
      return (
        <div className="mb-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
              <FiMapPin className="w-4 h-4" /> No Student Data
            </h4>
            <p className="text-xs text-orange-700">
              No student data available. Please go back and upload a valid Excel file.
            </p>
          </div>
          <div className="flex justify-start mt-4">
            <button
              onClick={() => setCurrentStep('duplicates')}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
            >
              Back to Duplicates
            </button>
          </div>
        </div>
      );
    }


    const [suggestions, setSuggestions] = useState<{ [key: number]: PhotonFeature[] }>({});
    const [showSuggestions, setShowSuggestions] = useState<{ [key: number]: boolean }>({});
    const [highlightedIndex, setHighlightedIndex] = useState<{ [key: number]: number }>({});
    const [isSearching, setIsSearching] = useState<{ [key: number]: boolean }>({});
    const [localInputValues, setLocalInputValues] = useState<{ [key: number]: string }>({});
    const [dropdownPosition, setDropdownPosition] = useState<{ [key: number]: 'top' | 'bottom' }>({});

    const unverifiedLocations = mappedStudents.filter(s => s && s.locationStatus !== 'verified');
    const verifiedCount = mappedStudents.filter(s => s && s.locationStatus === 'verified').length;
    const notFoundCount = mappedStudents.filter(s => s && s.locationStatus === 'not_found').length;

    const currentData = getCurrentPageData(mappedStudents);

    // Function to check available space and set dropdown position
    const checkDropdownPosition = (inputElement: HTMLInputElement, globalIndex: number) => {
      const rect = inputElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Minimum space needed for dropdown (approx 300px)
      const needsSpace = 300;

      if (spaceBelow < needsSpace && spaceAbove > spaceBelow) {
        setDropdownPosition(prev => ({ ...prev, [globalIndex]: 'top' }));
      } else {
        setDropdownPosition(prev => ({ ...prev, [globalIndex]: 'bottom' }));
      }
    };

    // Search places immediately without debounce
    const searchPlaces = async (query: string, studentIndex: number, inputElement?: HTMLInputElement) => {
      if (!query.trim() || query.trim().length < 2) {
        setSuggestions(prev => ({ ...prev, [studentIndex]: [] }));
        setShowSuggestions(prev => ({ ...prev, [studentIndex]: false }));
        setIsSearching(prev => ({ ...prev, [studentIndex]: false }));
        return;
      }

      try {
        setIsSearching(prev => ({ ...prev, [studentIndex]: true }));

        // Check dropdown position if input element is provided
        if (inputElement) {
          checkDropdownPosition(inputElement, studentIndex);
        }

        // Get up to 10 results from API but only show top 4
        const features = await PlaceAPI.searchPlaces(query, 10);
        // Limit to only 4 suggestions
        const limitedFeatures = features.slice(0, 4);
        setSuggestions(prev => ({ ...prev, [studentIndex]: limitedFeatures }));
        setShowSuggestions(prev => ({ ...prev, [studentIndex]: limitedFeatures.length > 0 }));
        setHighlightedIndex(prev => ({ ...prev, [studentIndex]: -1 }));
      } catch (error) {
        console.error('Error searching places:', error);
        setSuggestions(prev => ({ ...prev, [studentIndex]: [] }));
      } finally {
        setIsSearching(prev => ({ ...prev, [studentIndex]: false }));
      }
    };

    const handlePlaceChange = (globalIndex: number, value: string, inputElement?: HTMLInputElement) => {
      // Update local input value immediately for responsive typing
      setLocalInputValues(prev => ({ ...prev, [globalIndex]: value }));

      // Search immediately as user types
      if (value.trim().length >= 2) {
        searchPlaces(value, globalIndex, inputElement);
      } else {
        setSuggestions(prev => ({ ...prev, [globalIndex]: [] }));
        setShowSuggestions(prev => ({ ...prev, [globalIndex]: false }));
      }
    };

    const handlePlaceBlur = (globalIndex: number) => {
      // Update the main mappedStudents state only when the input loses focus
      const value = localInputValues[globalIndex] || '';

      setMappedStudents(prev => {
        const updated = [...prev];
        updated[globalIndex].place = value;
        updated[globalIndex].locationStatus = 'pending';
        updated[globalIndex].latitude = undefined;
        updated[globalIndex].longitude = undefined;
        return updated;
      });

      // Delay hiding suggestions to allow click
      setTimeout(() => {
        setShowSuggestions(prev => ({ ...prev, [globalIndex]: false }));
      }, 200);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, globalIndex: number) => {
      const studentSuggestions = suggestions[globalIndex] || [];

      if (showSuggestions[globalIndex] && studentSuggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlightedIndex(prev => ({
            ...prev,
            [globalIndex]: ((prev[globalIndex] || -1) + 1) % studentSuggestions.length
          }));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlightedIndex(prev => ({
            ...prev,
            [globalIndex]: ((prev[globalIndex] || 0) - 1 + studentSuggestions.length) % studentSuggestions.length
          }));
        } else if (e.key === 'Enter' && highlightedIndex[globalIndex] >= 0) {
          e.preventDefault();
          selectPlace(globalIndex, studentSuggestions[highlightedIndex[globalIndex]]);
        } else if (e.key === 'Escape') {
          setShowSuggestions(prev => ({ ...prev, [globalIndex]: false }));
          setHighlightedIndex(prev => ({ ...prev, [globalIndex]: -1 }));
        }
      }
    };

    const selectPlace = (globalIndex: number, feature: PhotonFeature) => {
      const displayName = PlaceAPI.getPlaceDisplayName(feature);
      const { lat, lng } = PlaceAPI.getPlaceCoordinates(feature);

      // Update both local and global state
      setLocalInputValues(prev => ({ ...prev, [globalIndex]: displayName }));

      setMappedStudents(prev => {
        const updated = [...prev];
        updated[globalIndex].place = displayName;
        updated[globalIndex].latitude = lat;
        updated[globalIndex].longitude = lng;
        updated[globalIndex].locationStatus = 'verified';
        return updated;
      });

      // Hide suggestions
      setShowSuggestions(prev => ({ ...prev, [globalIndex]: false }));
      setHighlightedIndex(prev => ({ ...prev, [globalIndex]: -1 }));
      setSuggestions(prev => ({ ...prev, [globalIndex]: [] }));
    };

    const verifyAllLocations = async () => {
      for (let i = 0; i < mappedStudents.length; i++) {
        const student = mappedStudents[i];
        if (student.place && student.place.length > 2 && student.locationStatus !== 'verified') {
          await verifyLocation(i, student.place);
        }
      }
    };

    const handleManualVerify = (globalIndex: number) => {
      const student = mappedStudents[globalIndex];
      if (student.place && student.place.trim()) {
        verifyLocation(globalIndex, student.place);
      }
    };

    return (
      <div className="mb-6">
        {/* Header with stats and actions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <FiMapPin className="w-4 h-4" /> Verify Locations
              </h4>
              <p className="text-xs text-blue-700 mb-3">
                Verify and correct location data for each student. Type any location description - no character limit.
                Click the verify button or select from suggestions.
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-blue-700">Total: {mappedStudents.length}</span>
                <span className="text-green-700">✓ Verified: {verifiedCount}</span>
                <span className="text-orange-700">⚠ Not Found: {notFoundCount}</span>
                <span className="text-slate-700">⏳ Pending: {unverifiedLocations.length}</span>
              </div>
            </div>
            <button
              onClick={verifyAllLocations}
              disabled={unverifiedLocations.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              Verify All Pending
            </button>
          </div>
        </div>

        {/* Table view */}
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Row</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Original Place</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Verified Place</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Coordinates</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {currentData.map((student, idx) => {
                const globalIndex = (currentPage - 1) * rowsPerPage + idx;
                const rowKey = `location-row-${globalIndex}-${student._rowIndex}`;

                return (
                  <tr key={rowKey} className={`hover:bg-slate-50 ${student.locationStatus === 'verified' ? 'bg-green-50/30' :
                    student.locationStatus === 'not_found' ? 'bg-orange-50/30' : ''
                    }`}>
                    <td className="px-4 py-3 text-sm text-slate-500">{globalIndex + 1}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{student._rowIndex}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{student.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{student.originalPlace}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="relative">
                        <input
                          type="text"
                          value={localInputValues[globalIndex] !== undefined ? localInputValues[globalIndex] : (student.place || '')}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            handlePlaceChange(globalIndex, newValue, e.target);
                          }}
                          onBlur={() => handlePlaceBlur(globalIndex)}
                          onKeyDown={(e) => handleKeyDown(e, globalIndex)}
                          onFocus={(e) => {
                            if (student.place && student.place.trim().length >= 2) {
                              searchPlaces(student.place, globalIndex, e.target);
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 focus:border-transparent outline-none pr-8
                                                    ${student.locationStatus === 'verified' ? 'border-green-300 bg-green-50' :
                              student.locationStatus === 'not_found' ? 'border-orange-300 bg-orange-50' :
                                'border-slate-200'}`}
                          placeholder="Type any location (no character limit)..."
                          maxLength={1000}
                        />

                        {/* Loading indicator for search */}
                        {isSearching[globalIndex] && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <FiRefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
                          </div>
                        )}

                        {/* Place Suggestions Dropdown with dynamic positioning - Limited to 4 results */}
                        {showSuggestions[globalIndex] && suggestions[globalIndex]?.length > 0 && (
                          <div
                            className={`absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden
                                                        ${dropdownPosition[globalIndex] === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}`}
                            style={{
                              ...(dropdownPosition[globalIndex] === 'top' && { bottom: '100%' })
                            }}
                          >
                            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                              <span className="text-xs font-medium text-slate-500">
                                SUGGESTED PLACES ({suggestions[globalIndex].length})
                              </span>
                              <span className="text-xs text-slate-400">
                                {student.place?.length} characters
                              </span>
                            </div>
                            {suggestions[globalIndex].map((feature: PhotonFeature, suggIdx: number) => {
                              const isActive = highlightedIndex[globalIndex] === suggIdx;
                              const mainName = feature.properties.name || "";
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
                                  key={`${globalIndex}-suggestion-${suggIdx}`}
                                  onMouseDown={() => selectPlace(globalIndex, feature)}
                                  className={`flex items-start gap-2 px-3 py-2 cursor-pointer transition-colors
                                                                    ${isActive ? 'bg-indigo-50' : 'hover:bg-slate-50'}
                                                                    border-b border-slate-100 last:border-b-0`}
                                >
                                  <FiMapPin className={`w-4 h-4 mt-0.5 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-medium truncate ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                                      {mainName}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate">
                                      {subTitle || "Location details unavailable"}
                                    </div>
                                  </div>
                                  <span className="text-xs text-slate-400 flex-shrink-0">
                                    {feature.properties.osm_value || 'place'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {typeof student.latitude === 'number' && typeof student.longitude === 'number' ? (
                        <span className="font-mono text-slate-600">
                          {student.latitude.toFixed(4)}, {student.longitude.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {student.locationStatus === 'verified' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <FiCheckCircle className="w-3 h-3" /> Verified
                        </span>
                      )}
                      {student.locationStatus === 'not_found' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          <FiAlertCircle className="w-3 h-3" /> Not Found
                        </span>
                      )}
                      {!student.locationStatus && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleManualVerify(globalIndex)}
                        disabled={searchingLocation === globalIndex || !student.place?.trim()}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {searchingLocation === globalIndex ? (
                          <>
                            <FiRefreshCw className="animate-spin w-3 h-3" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <FiMapPin className="w-3 h-3" />
                            Verify
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Empty state */}
          {mappedStudents.length === 0 && (
            <div className="text-center py-12">
              <FiMapPin className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No student data available</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <PaginationControls totalItems={mappedStudents.length} />

        {/* Summary Footer */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <span className="font-medium">Summary:</span>{' '}
            {verifiedCount} verified, {notFoundCount} not found, {unverifiedLocations.length - notFoundCount} pending
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep('duplicates')}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep('medications')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition"
            >
              Continue to Medications <FiArrowRight />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const MedicationStep = () => {
    const [autoVerifyingMedications, setAutoVerifyingMedications] = useState(false);
    const [medicationProgress, setMedicationProgress] = useState({ current: 0, total: 0 });

    const currentData = getCurrentPageData(mappedStudents);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const medicationRequired = mappedStudents.filter(s => s.medication === 'yes');
    const missingReports = medicationRequired.filter(s => !s.medicalReport);

    const autoVerifyMedications = async () => {
      setAutoVerifyingMedications(true);
      const students = [...mappedStudents];

      for (let i = 0; i < students.length; i++) {
        setMedicationProgress({ current: i + 1, total: students.length });

        const student = students[i];

        if (student.originalMedication) {
          const medText = student.originalMedication.toLowerCase().trim();

          // Keywords that indicate NO medication
          const noMedicationKeywords = [
            'none', 'no', 'nil', 'n/a', 'na', '-', 'nope', 'nothing',
            'not applicable', 'no problem', 'no issues', 'no issue', 'no meds',
            'not taking any', "don't take any", 'dont take any', 'no medication',
            'no medicines', 'fine', 'ok', 'okay', 'normal', 'illa', 'nill',
            'not taking', 'does not take', 'do not take', 'no health issues',
            'no medical', 'no known', 'no allergies', 'no condition',
            'no problems', 'no problem', 'no issues', 'no medical conditions',
            'no medications', 'no medicine', 'not on any', 'nothing to report'
          ];

          // Check if the text CONTAINS any of the "no" keywords (not exact match)
          const isNoMedication = noMedicationKeywords.some(keyword =>
            medText.includes(keyword)
          );

          if (isNoMedication) {
            console.log(`Student ${student.name}: "${medText}" → NO medication (contains "${noMedicationKeywords.find(k => medText.includes(k))}")`);
            students[i] = {
              ...student,
              medication: 'no',
              medicalReport: '',
              medicationStatus: 'verified'
            };
          } else {
            console.log(`Student ${student.name}: "${medText}" → YES medication`);
            students[i] = {
              ...student,
              medication: 'yes',
              medicalReport: student.originalMedication,
              medicationStatus: 'verified'
            };
          }
        } else {
          // Empty medication field means NO
          students[i] = {
            ...student,
            medication: 'no',
            medicalReport: '',
            medicationStatus: 'verified'
          };
        }

        setMappedStudents([...students]);
      }

      setAutoVerifyingMedications(false);
    };

    const updateMedication = (index: number, hasMedication: boolean) => {
      setMappedStudents(prev => prev.map((student, idx) => {
        if (idx === index) {
          if (hasMedication) {
            return {
              ...student,
              medication: 'yes',
              // Keep the medical report as original medication, not editable
              medicalReport: student.originalMedication || '',
              medicationStatus: 'verified'
            };
          } else {
            return {
              ...student,
              medication: 'no',
              medicalReport: '',
              medicationStatus: 'verified'
            };
          }
        }
        return student;
      }));
    };

    return (
      <div className="mb-6">
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-pink-800 mb-2 flex items-center gap-2">
            <FiHeart /> Verify Medication
          </h4>
          <p className="text-xs text-pink-700">
            Review medication information for each student. Select "Yes" if they require medication.
            The medical report is automatically populated from the original medication text and cannot be edited.
          </p>
          <div className="mt-2 text-xs text-pink-600">
            {medicationRequired.length} student{medicationRequired.length !== 1 ? 's' : ''} require medication.
            {missingReports.length > 0 && (
              <span className="ml-1 text-red-600 font-medium">
                {missingReports.length} missing medical report{missingReports.length !== 1 ? 's' : ''}!
              </span>
            )}
          </div>
        </div>

        {autoVerifyingMedications ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-600">
              Auto-verifying medications... {medicationProgress.current} of {medicationProgress.total}
            </p>
          </div>
        ) : (
          <>
            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Original Medication</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Requires Medication?</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Medical Report</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {currentData.map((student, index) => {
                    const globalIndex = startIndex + index;
                    const hasError = student.medication === 'yes' && !student.medicalReport;

                    return (
                      <tr
                        key={`med-${globalIndex}-${student._rowIndex || index}`}
                        className={`hover:bg-slate-50 ${hasError ? 'bg-red-50' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm text-slate-500">{globalIndex + 1}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{student.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {student.originalMedication || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <select
                            value={student.medication}
                            onChange={(e) => {
                              const hasMedication = e.target.value === 'yes';
                              updateMedication(globalIndex, hasMedication);
                            }}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-100 focus:border-transparent outline-none"
                          >
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {student.medication === 'yes' ? (
                            <input
                              type="text"
                              value={student.medicalReport || ''}
                              disabled
                              className="w-full px-2 py-1 border border-slate-200 rounded text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                              title="Medical report is automatically populated and cannot be edited"
                            />
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            {student.medicationStatus === 'verified' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                <FiCheckCircle /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                                Pending
                              </span>
                            )}
                            {hasError && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                <FiAlertCircle /> Missing Report
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {mappedStudents.length === 0 && (
                <div className="text-center py-12">
                  <FiHeart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">No student data available</p>
                </div>
              )}
            </div>

            <PaginationControls totalItems={mappedStudents.length} />

            <div className="flex justify-between gap-3 mt-4">
              <div>
                <button
                  onClick={autoVerifyMedications}
                  disabled={autoVerifyingMedications || mappedStudents.length === 0}
                  className="px-6 py-2.5 bg-pink-100 text-pink-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-pink-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiRefreshCw className={autoVerifyingMedications ? 'animate-spin' : ''} />
                  {autoVerifyingMedications ? 'Verifying...' : 'Auto-verify All Medications'}
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep('locations')}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Back to Locations
                </button>
                <button
                  onClick={() => {
                    // Check if all medication-required students have reports
                    const hasMissingReports = mappedStudents.some(
                      s => s.medication === 'yes' && !s.medicalReport
                    );

                    if (hasMissingReports) {
                      alert('Please ensure all students requiring medication have medical reports. Use "Auto-verify All Medications" to populate missing reports.');
                      return;
                    }

                    setMappedStudents(prev => prev.map(student => ({
                      ...student,
                      medicationStatus: 'verified'
                    })));
                    setCurrentStep('preview');
                  }}
                  disabled={missingReports.length > 0}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Preview <FiArrowRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Preview step component - Shows JSON data preview
  const PreviewStep = () => {
    const validCount = mappedStudents.filter(s => s._isValid).length;
    const invalidCount = mappedStudents.length - validCount;
    const medicationCount = mappedStudents.filter(s => s.medication === 'yes').length;
    const locationVerifiedCount = mappedStudents.filter(s => s.locationStatus === 'verified').length;

    // Helper function to validate and parse coordinates
    const parseCoordinate = (value: any): number | null => {
      if (value === null || value === undefined) return null;

      // If it's already a number, return it
      if (typeof value === 'number' && !isNaN(value)) return value;

      // If it's a string, try to parse it
      if (typeof value === 'string') {
        // Check if it's "Yes" or other invalid strings
        if (value.toLowerCase() === 'yes' || value.toLowerCase() === 'no' || value.toLowerCase() === '') {
          return null;
        }

        // Try to parse as float
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }

      return null;
    };

    // Format the student data for JSON display (excluding internal fields)
    const getJsonData = () => {
      return mappedStudents.map(student => {
        // Parse coordinates properly
        const latitude = parseCoordinate(student.latitude);
        const longitude = parseCoordinate(student.longitude);

        // If coordinates are invalid, set to empty string as per requirement
        const finalLatitude = latitude !== null ? latitude : "";
        const finalLongitude = longitude !== null ? longitude : "";

        return {
          id: 0,
          name: student.name || '',
          age: student.age || 0,
          gender: student.gender || 'male',
          place: student.place || '',
          parentName: student.parentName || '',
          contactNumber: student.contactNumber || '',
          whatsappNumber: student.whatsappNumber || '',
          churchName: student.churchName || 'No',
          medication: student.medication || 'no',
          medicalReport: student.medication === 'yes' ? (student.medicalReport || '') : '',
          status: 'registered',
          remark: student.remark || '',
          staying: 'no',
          age_group: '',
          latitude: finalLatitude,
          longitude: finalLongitude
        };
      });
    };

    return (
      <div className="mb-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600">Total Records</p>
            <p className="text-2xl font-bold text-blue-700">{mappedStudents.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600">Valid Records</p>
            <p className="text-2xl font-bold text-green-700">{validCount}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600">Invalid Records</p>
            <p className="text-2xl font-bold text-red-700">{invalidCount}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600">Medication Required</p>
            <p className="text-2xl font-bold text-purple-700">{medicationCount}</p>
          </div>
          <div className="bg-teal-50 rounded-lg p-4">
            <p className="text-sm text-teal-600">Locations Verified</p>
            <p className="text-2xl font-bold text-teal-700">{locationVerifiedCount}</p>
          </div>
        </div>

        {/* JSON Preview Section */}
        {/*<div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-800">JSON Data Preview</h3>
            <button
              onClick={() => {
                const jsonData = getJsonData();
                navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
                alert('JSON data copied to clipboard!');
              }}
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition flex items-center gap-2"
            >
              <FiSave className="w-4 h-4" />
              Copy JSON
            </button>
          </div>
          <div className="bg-slate-900 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-slate-800 text-slate-400 text-xs font-mono flex items-center justify-between">
              <span>📋 student_data.json</span>
              <span>{mappedStudents.length} records</span>
            </div>
            <pre className="p-4 text-sm font-mono text-slate-300 overflow-x-auto max-h-96 overflow-y-auto">
              {JSON.stringify(getJsonData(), null, 2)}
            </pre>
          </div>
        </div>*/}

        {/* Table Preview */}
        <details className="mb-6">
          <summary className="text-sm font-medium text-slate-700 cursor-pointer hover:text-indigo-600">
            Show Table View
          </summary>
          <div className="mt-4 overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Row</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Age</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Gender</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Place</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Parent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Medication</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Latitude</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Longitude</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {mappedStudents.slice(0, 5).map((student, idx) => {
                  const latitude = parseCoordinate(student.latitude);
                  const longitude = parseCoordinate(student.longitude);

                  return (
                    <tr key={idx} className={student._isValid ? '' : 'bg-red-50'}>
                      <td className="px-4 py-3 text-sm text-slate-500">{student._rowIndex}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">{student.age}</td>
                      <td className="px-4 py-3 text-sm capitalize text-slate-900">{student.gender}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">{student.place}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">{student.parentName}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">{student.contactNumber}</td>
                      <td className="px-4 py-3 text-sm">
                        {student.medication === 'yes' ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Yes</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {latitude !== null ? latitude.toFixed(6) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {longitude !== null ? longitude.toFixed(6) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {mappedStudents.length > 5 && (
              <div className="px-4 py-3 bg-slate-50 text-sm text-slate-600 text-center border-t">
                + {mappedStudents.length - 5} more records
              </div>
            )}
          </div>
        </details>

        {/* Validation Errors */}
        {invalidCount > 0 && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 mb-2">Validation Errors</h4>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {mappedStudents.filter(s => !s._isValid).map((student, idx) => (
                <li key={idx} className="text-sm text-red-600">
                  <span className="font-medium">Row {student._rowIndex}:</span> {student.name} - {student._errors.join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {mappedStudents.some(s => s._warnings.length > 0) && (
          <div className="mt-4 p-4 bg-orange-50 rounded-lg">
            <h4 className="text-sm font-medium text-orange-800 mb-2">Warnings</h4>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {mappedStudents.filter(s => s._warnings.length > 0).map((student, idx) => (
                <li key={idx} className="text-sm text-orange-600">
                  <span className="font-medium">Row {student._rowIndex}:</span> {student.name} - {student._warnings.join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setCurrentStep('medications')}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
          >
            Back
          </button>
          <button
            onClick={handleImport}
            disabled={isProcessing || validCount === 0}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <FiRefreshCw className="animate-spin" />
                Importing... ({importProgress.completed}/{importProgress.total})
              </>
            ) : (
              <>
                <FiSave />
                Import {validCount} Students
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Handle import - Bulk API
  const handleImport = async () => {
    if (!hasAdminAccess()) return;

    setIsProcessing(true);
    setImportProgress({ total: mappedStudents.length, completed: 0, failed: 0 });

    const validStudents = mappedStudents.filter(s => s._isValid);

    // Format all students for bulk import
    const studentsPayload = validStudents.map(student => ({
      name: student.name?.trim() || '',
      age: Number(student.age) || 0,
      gender: student.gender || 'male',
      place: student.place?.trim() || '',
      latitude: typeof student.latitude === 'number' && !isNaN(student.latitude) ? student.latitude : null,
      longitude: typeof student.longitude === 'number' && !isNaN(student.longitude) ? student.longitude : null,
      parentName: student.parentName?.trim() || '',
      contactNumber: student.contactNumber?.toString().trim() || '',
      whatsappNumber: student.whatsappNumber?.toString().trim() || student.contactNumber?.toString().trim() || '',
      churchName: student.churchName?.trim() || '',
      medication: student.medication === 'yes' ? (student.medicalReport?.trim() || 'yes') : 'no',
      staying: 'no',
      status: 'registered',
      remark: student.remark?.trim() || ''
    }));

    try {
      const apiUrl = 'https://localhost:7135/api/user/students/excel';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(studentsPayload)
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status} - ${response.statusText}`;
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.message || errorJson.title || errorText;
            } catch {
              errorMessage = errorText.substring(0, 200);
            }
          }
        } catch {
          // Ignore
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      const importResults = result.results?.map((r: any) => ({
        rowIndex: r.rowIndex,
        success: r.success,
        name: r.name,
        studentId: r.studentId,
        error: r.error
      })) || [];

      setImportResults(importResults);
      setImportProgress({
        total: result.totalProcessed,
        completed: result.successCount,
        failed: result.failedCount
      });

    } catch (error) {
      console.error('Error importing students:', error);
      setImportResults([{
        rowIndex: 0,
        success: false,
        name: 'Bulk Import',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }]);
    } finally {
      setIsProcessing(false);
      setShowResults(true);
    }
  };

  // Results modal
  const ResultsModal = () => {
    if (!showResults) return null;

    const successCount = importResults.filter(r => r.success).length;
    const failCount = importResults.filter(r => !r.success).length;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">Import Results</h3>
            <button
              onClick={() => setShowResults(false)}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-700">{successCount}</div>
                <div className="text-sm text-green-600">Successfully Imported</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-700">{failCount}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
            </div>

            <div className="space-y-3">
              {importResults.map((result, idx) => (
                <div key={idx} className={`p-3 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <FiCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <FiAlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-800">
                          Row {result.rowIndex}: {result.name}
                        </p>
                        {result.success && result.studentId && (
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                            ID: {result.studentId}
                          </span>
                        )}
                      </div>
                      {result.success ? (
                        <p className="text-sm text-green-600 mt-1">
                          Imported successfully
                        </p>
                      ) : (
                        <p className="text-sm text-red-600 mt-1">
                          Error: {result.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
            <button
              onClick={() => {
                setShowResults(false);
                resetUpload();
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowResults(false);
                navigate('/user/student');
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              View Students
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // Loading state
  if (permissionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <Header />
        <StudentExcelSkeleton />
      </div>
    );
  }

  // Access denied state
  if (permissionError || accessDenied || !hasAdminAccess()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <AccessAlert message={errorMessage || "Only administrators can access the Excel import feature."} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      <Header />

      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Step Indicator */}
          <div className="p-6 border-b border-slate-100">
            <StepIndicator />
          </div>

          {/* Step Content */}
          <div className="p-6">
            <ErrorBoundary>
              {currentStep === 'upload' && <UploadStep />}
              {currentStep === 'mapping' && <MappingStep />}
              {currentStep === 'duplicates' && <DuplicateStep />}
              {currentStep === 'locations' && <LocationStep />}
              {currentStep === 'medications' && <MedicationStep />}
              {currentStep === 'preview' && <PreviewStep />}
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Results Modal */}
      <ResultsModal />
    </div>
  );
};

export default StudentExcel;