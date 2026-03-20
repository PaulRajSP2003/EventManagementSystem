// src/user/pages/admin/excel_data/LeaderExcel.tsx
import { useState, useEffect, useRef } from 'react';
import React from 'react';
// ErrorBoundary component for catching errors in step components
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
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
  FiDownload, FiUpload, FiFileText,
  FiRefreshCw, FiArrowRight, FiX, FiCheckCircle, FiAlertCircle, FiMapPin,
  FiChevronLeft, FiChevronRight, FiUsers, FiSave,
} from 'react-icons/fi';
import { API_BASE } from '../../../config/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchPermissionData, type PermissionData, isAdminOrCoAdmin } from '../permission';
import { StickyHeader, AccessAlert, PlaceSearchInput, type PlaceSelectResult } from '../components';
import PlaceAPI from '../api/PlaceList';
import * as XLSX from 'xlsx';

// Types
interface LeaderData {
  name: string;
  gender: 'male' | 'female';
  place: string;
  latitude?: number;
  longitude?: number;
  contactNumber: string;
  whatsappNumber: string;
  churchName: string;
  staying: 'no' | 'yes';
  status: 'registered' | 'approved' | 'rejected' | 'pending';
  isFollowing: string; // Can be 'no' or group name like 'A', 'B', etc.
  type: 'participant' | 'guest' | 'leader2' | 'leader1';
  remark?: string;
  registeredMode: 'offline' | 'online';
}

interface ExcelRow {
  [key: string]: string | number | null | undefined;
}

interface ColumnMapping {
  excelColumn: string;
  leaderField: keyof LeaderData | '';
  required: boolean;
}

interface LeaderWithLocation extends LeaderData {
  _rowIndex: number;
  originalPlace: string;
  locationStatus?: 'pending' | 'verified' | 'not_found';
  originalIsFollowing?: string;
  isFollowingStatus?: 'pending' | 'verified';
  duplicateGroup?: number;
  isDuplicate?: boolean;
  _isValid: boolean;
  _errors: string[];
  _warnings: string[];
}

interface DuplicateGroup {
  id: number;
  leaders: LeaderWithLocation[];
  matchFields: string[];
  confidence: 'high' | 'medium' | 'low';
}

// All available fields
// Only Excel fields
const ALL_FIELDS: { field: keyof LeaderData; label: string; required: boolean }[] = [
  { field: 'name', label: 'Full Name', required: true },
  { field: 'gender', label: 'Gender', required: true },
  { field: 'place', label: 'Place', required: true },
  { field: 'contactNumber', label: 'Contact Number', required: true },
  { field: 'whatsappNumber', label: 'WhatsApp Number', required: true },
  { field: 'churchName', label: 'Church Name', required: false },
  { field: 'remark', label: 'Remarks / Notes', required: false },
];

// Excel header mappings
const COMMON_HEADER_MAPPINGS: Record<string, keyof LeaderData> = {
  'full name': 'name',
  'name': 'name',
  'leader name': 'name',
  'gender': 'gender',
  'place': 'place',
  'location': 'place',
  'contact number': 'contactNumber',
  'contact': 'contactNumber',
  'phone': 'contactNumber',
  'mobile': 'contactNumber',
  'whatsapp number': 'whatsappNumber',
  'whatsapp': 'whatsappNumber',
  'church name': 'churchName',
  'church': 'churchName',
  'group': 'isFollowing',
  'following': 'isFollowing',
  'group following': 'isFollowing',
  'type': 'type',
  'leader type': 'type',
  'staying': 'staying',
  'status': 'status',
  'remarks': 'remark',
  'notes': 'remark',
  'remarks / notes': 'remark',
};

type Step = 'upload' | 'mapping' | 'duplicates' | 'locations' | 'configuration' | 'preview';

const LeaderExcelSkeleton = () => (
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

const LeaderExcel = () => {
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
  const [mappedLeaders, setMappedLeaders] = useState<LeaderWithLocation[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Duplicate states
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

  // Available groups from permission data
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);

  // Download template
  const downloadTemplate = () => {
    const template = [
      {
        'Full Name': 'Thomas Mathew',
        'Gender': 'Male',
        'Place': 'Kazhakoottam',
        'Contact Number': '9876543210',
        'WhatsApp Number': '9876543210',
        'Church Name': 'St. Thomas Church',
        'Remarks / Notes': ''
      },
      {
        'Full Name': 'Sarah Jacob',
        'Gender': 'Female',
        'Place': 'Pattom',
        'Contact Number': '9123456780',
        'WhatsApp Number': '9123456780',
        'Church Name': 'CSI Church Pattom',
        'Remarks / Notes': 'Youth coordinator'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leaders');
    XLSX.writeFile(wb, 'leader_import_template.xlsx');
  };

  // Leader type options
  const typeOptions = [
    { value: 'participant', label: 'Participant' },
    { value: 'guest', label: 'Guest' },
    { value: 'leader2', label: 'Leader 2' },
    { value: 'leader1', label: 'Leader 1' },
  ];

  // Fetch permission data on component mount
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setPermissionLoading(true);
        setPermissionError(false);
        const data = await fetchPermissionData();
        setPermissionData(data);
        if (data) {
          setAvailableGroups(data.groups || []);

          // Check if user is admin or co-admin using isAdminOrCoAdmin function
          const hasAccess = isAdminOrCoAdmin(data);
          setAccessDenied(!hasAccess);

          if (!hasAccess) {
            setErrorMessage("Only administrators and co-administrators can access the leader Excel import feature");
          }
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

  // Check if user has admin or co-admin access
  const hasAdminOrCoAdmin = () => {
    return isAdminOrCoAdmin(permissionData);
  };


  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !hasAdminOrCoAdmin()) return;

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
    if (!file || !hasAdminOrCoAdmin()) return;

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
          leaderField: mappedField,
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
  const updateMapping = (leaderField: keyof LeaderData, excelColumn: string) => {
    setColumnMapping(prev => {
      // Remove any existing mapping for this leader field
      const filtered = prev.filter(m => m.leaderField !== leaderField);
      // Add new mapping if column is selected
      if (excelColumn) {
        const fieldInfo = ALL_FIELDS.find(f => f.field === leaderField);
        filtered.push({
          excelColumn,
          leaderField,
          required: fieldInfo?.required || false
        });
      }
      return filtered;
    });
  };

  // Auto-map columns based on common headers
  const autoMapColumns = () => {
    const newMappings: ColumnMapping[] = [];
    const usedFields = new Set<keyof LeaderData>();



    const fieldKeywords: Record<keyof LeaderData, string[]> = {
      name: ['name', 'full name', 'leader name'],
      gender: ['gender', 'sex'],
      place: ['place', 'location', 'city', 'area'],
      contactNumber: ['contact', 'phone', 'mobile', 'tel'],
      whatsappNumber: ['whatsapp', 'wa'],
      churchName: ['church', 'assembly', 'parish'],
      staying: ['staying', 'accommodation', 'stay'],
      status: ['status'],
      isFollowing: ['group', 'following', 'group following'],
      type: ['type', 'leader type', 'role'],
      remark: ['remark', 'notes', 'comments'],
      latitude: ['latitude'],
      longitude: ['longitude'],
      registeredMode: ['mode', 'registered mode']
    };

    excelHeaders.forEach(header => {
      if (!header) return;

      const headerStr = header.toString().toLowerCase().trim();

      if (!headerStr) return;

      // Check each field's keywords
      Object.entries(fieldKeywords).forEach(([field, keywords]) => {
        const leaderField = field as keyof LeaderData;

        // Skip if this field is already mapped
        if (usedFields.has(leaderField)) return;

        // Check if ANY keyword is present in the header
        const hasKeyword = keywords.some(keyword =>
          headerStr.includes(keyword.toLowerCase())
        );

        if (hasKeyword) {


          const fieldInfo = ALL_FIELDS.find(f => f.field === leaderField);
          newMappings.push({
            excelColumn: header,
            leaderField: leaderField,
            required: fieldInfo?.required || false
          });
          usedFields.add(leaderField);
        }
      });
    });

    // Special handling for name if not mapped
    if (!usedFields.has('name')) {
      const nameHeader = excelHeaders.find(header => {
        const h = header?.toString().toLowerCase() || '';
        return h.includes('name');
      });

      if (nameHeader) {
        newMappings.push({
          excelColumn: nameHeader,
          leaderField: 'name',
          required: true
        });
        usedFields.add('name');
      }
    }

    // If whatsapp is not mapped, use contact number
    if (!usedFields.has('whatsappNumber') && usedFields.has('contactNumber')) {
      const contactMapping = newMappings.find(m => m.leaderField === 'contactNumber');
      if (contactMapping) {
        newMappings.push({
          excelColumn: contactMapping.excelColumn,
          leaderField: 'whatsappNumber',
          required: false
        });
        usedFields.add('whatsappNumber');
      }
    }

    // Remove any duplicate mappings
    const uniqueMappings = newMappings.filter((mapping, index, self) =>
      index === self.findIndex(m => m.leaderField === mapping.leaderField)
    );

    setColumnMapping(uniqueMappings);
    setValidationErrors([]);
  };

  // Generate mapped leader data
  const generateMappedData = () => {
    // Validate required fields are mapped
    const requiredFields = ALL_FIELDS.filter(f => f.required).map(f => f.field);
    const mappedFields = columnMapping.map(m => m.leaderField);
    const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));

    if (missingRequired.length > 0) {
      const missingLabels = missingRequired.map(f =>
        ALL_FIELDS.find(field => field.field === f)?.label
      );
      setValidationErrors([`Required fields not mapped: ${missingLabels.join(', ')}`]);
      return;
    }

    setValidationErrors([]);

    // Create mapped leader objects
    const leaders: LeaderWithLocation[] = excelData.map((row, index) => {
      const leader: Partial<LeaderWithLocation> = {
        _rowIndex: index + 2,
        _isValid: true,
        _errors: [],
        _warnings: [],
        originalPlace: '',
        name: '',
        gender: 'male',
        place: '',
        contactNumber: '',
        whatsappNumber: '',
        churchName: 'No',
        staying: 'no',
        status: 'registered',
        isFollowing: 'no',
        type: 'participant',
        registeredMode: 'offline'
      };

      // Apply mappings
      columnMapping.forEach(mapping => {
        if (mapping.leaderField) {
          const value = row[mapping.excelColumn];

          switch (mapping.leaderField) {
            case 'gender':
              const genderValue = value?.toString().toLowerCase() || '';
              leader.gender = (genderValue === 'female' || genderValue === 'f') ? 'female' : 'male';
              break;
            default:
              if (value) {
                (leader as any)[mapping.leaderField] = value.toString().trim();
              }
          }

          if (mapping.leaderField === 'place') {
            leader.originalPlace = value?.toString() || '';
          }
        }
      });
      // Status is always registered
      leader.status = 'registered';

      // Validate required fields
      ALL_FIELDS.filter(f => f.required).forEach(field => {
        const value = leader[field.field];
        if (!value || (typeof value === 'string' && !value.trim())) {
          if (leader._errors) {
            leader._errors.push(`${field.label} is required`);
          }
          leader._isValid = false;
        }
      });

      // Validate contact number
      if (leader.contactNumber && leader.contactNumber.length < 10) {
        if (leader._errors) {
          leader._errors.push('Contact number must be at least 10 digits');
        }
        leader._isValid = false;
      }

      // Set default WhatsApp if not provided
      if (!leader.whatsappNumber && leader.contactNumber) {
        leader.whatsappNumber = leader.contactNumber;
      }

      return leader as LeaderWithLocation;
    });

    setMappedLeaders(leaders);
    checkDuplicates(leaders);
    setCurrentStep('duplicates');
  };

  // Check for duplicates
  const checkDuplicates = (leaders: LeaderWithLocation[]) => {
    const groups: DuplicateGroup[] = [];
    let groupId = 1;

    for (let i = 0; i < leaders.length; i++) {
      if (leaders[i].duplicateGroup) continue;

      const group: LeaderWithLocation[] = [leaders[i]];
      const matchFields: string[] = [];

      for (let j = i + 1; j < leaders.length; j++) {
        if (leaders[j].duplicateGroup) continue;

        let isDuplicate = false;
        const fields: string[] = [];

        // Check if contact/WhatsApp matches (strong indicator)
        const contactMatch = leaders[i].contactNumber &&
          leaders[j].contactNumber &&
          leaders[i].contactNumber === leaders[j].contactNumber;

        const whatsappMatch = leaders[i].whatsappNumber &&
          leaders[j].whatsappNumber &&
          leaders[i].whatsappNumber === leaders[j].whatsappNumber;

        // If contact matches
        if (contactMatch || whatsappMatch) {
          // Check name similarity
          const name1 = leaders[i].name?.toLowerCase() || '';
          const name2 = leaders[j].name?.toLowerCase() || '';
          const nameMatch = name1 === name2 ||
            name1.includes(name2) ||
            name2.includes(name1);

          if (nameMatch) {
            isDuplicate = true;
            if (contactMatch) fields.push('contactNumber');
            if (whatsappMatch) fields.push('whatsappNumber');
            if (nameMatch) fields.push('name');
          }
        }

        // Check name + place combination (weaker indicator)
        if (!isDuplicate && leaders[i].place && leaders[j].place) {
          const placeMatch = leaders[i].place.toLowerCase() === leaders[j].place.toLowerCase();
          const name1 = leaders[i].name?.toLowerCase() || '';
          const name2 = leaders[j].name?.toLowerCase() || '';
          const exactNameMatch = name1 === name2;

          if (exactNameMatch && placeMatch) {
            isDuplicate = true;
            fields.push('name', 'place');
          }
        }

        if (isDuplicate) {
          group.push(leaders[j]);
          leaders[j].duplicateGroup = groupId;
          leaders[j].isDuplicate = true;
          matchFields.push(...fields);
        }
      }

      if (group.length > 1) {
        leaders[i].duplicateGroup = groupId;
        leaders[i].isDuplicate = true;

        const confidence = matchFields.includes('contactNumber') || matchFields.includes('whatsappNumber')
          ? 'high'
          : 'medium';

        groups.push({
          id: groupId,
          leaders: group,
          matchFields: [...new Set(matchFields)],
          confidence
        });

        groupId++;
      }
    }

    // setDuplicateGroups(groups); // removed
  };

  // Handle duplicate actions
  const handleDuplicateAction = (action: 'keep' | 'remove') => {
    if (action === 'keep') {
      // Just keep all duplicates as is
      setCurrentStep('locations');
    } else {
      // Remove duplicates (keep first occurrence only)
      const uniqueLeaders = mappedLeaders.filter((leader, index, self) => {
        if (!leader.isDuplicate) return true;
        const firstIndex = self.findIndex(s => s.duplicateGroup === leader.duplicateGroup);
        return index === firstIndex;
      });

      setMappedLeaders(uniqueLeaders);
      setCurrentStep('locations');
    }
  };

  // Verify location for a leader
  const verifyLocation = async (index: number, place: string) => {
    if (!place || place.length < 2) return;

    setSearchingLocation(index);

    try {
      const features = await PlaceAPI.searchPlaces(place, 1);
      const updated = [...mappedLeaders];

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

      setMappedLeaders(updated);
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


  // Step indicator component
  const StepIndicator = () => {
    const steps = ['upload', 'mapping', 'duplicates', 'locations', 'configuration', 'preview'];
    const stepLabels = ['Upload', 'Map Columns', 'Check Duplicates', 'Verify Locations', 'Event Configuration', 'Preview'];
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
          <li>First row should contain column headers (e.g., Full Name, Gender, Place, etc.)</li>
          <li>Required columns: Full Name, Gender, Place, Contact Number, WhatsApp Number</li>
          <li>Optional columns: Church Name, Remarks / Notes</li>
          <li>Status is always set to <span className='font-bold text-blue-700'>'registered'</span> automatically</li>
          <li>Event configuration (Group, Type, Staying) is handled after import in the page</li>
          <li>Download the template for the correct format</li>
        </ul>
      </div>
    </div>
  );

  // Mapping step component
  const MappingStep = () => (
    <div className="mb-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <FiAlertCircle /> Map Your Excel Columns
            </h4>
            <p className="text-xs text-amber-700">
              Match your Excel columns to the leader data fields. Required fields are marked with <span className="text-red-500">*</span>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Leader Field</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Excel Column</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Sample Data</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {ALL_FIELDS.map((field) => {
              const mapping = columnMapping.find(m => m.leaderField === field.field);
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

  // Duplicate step component
  const DuplicateStep = () => {
    const duplicateCount = mappedLeaders.filter(s => s.isDuplicate).length;
    const uniqueCount = mappedLeaders.length - duplicateCount;

    const displayData = showDuplicatesOnly
      ? mappedLeaders.filter(s => s.isDuplicate)
      : mappedLeaders;

    const currentData = getCurrentPageData(displayData);
    const startIndex = (currentPage - 1) * rowsPerPage;

    // Function to remove a single leader
    const removeSingleLeader = (leaderToRemove: LeaderWithLocation) => {
      const actualIndex = mappedLeaders.findIndex(s =>
        s._rowIndex === leaderToRemove._rowIndex
      );

      if (actualIndex === -1) return;

      if (window.confirm(`Are you sure you want to remove ${leaderToRemove.name}?`)) {
        const updatedLeaders = mappedLeaders.filter((_, index) => index !== actualIndex);
        setMappedLeaders(updatedLeaders);

        setTimeout(() => {
          checkDuplicates(updatedLeaders);
        }, 100);
      }
    };

    // Function to keep a leader (mark as not duplicate)
    const keepSingleLeader = (leaderToKeep: LeaderWithLocation) => {
      const actualIndex = mappedLeaders.findIndex(s =>
        s._rowIndex === leaderToKeep._rowIndex
      );

      if (actualIndex === -1) return;

      if (window.confirm(`Mark ${leaderToKeep.name} as a unique leader?`)) {
        const updatedLeaders = mappedLeaders.map((leader, index) => {
          if (index === actualIndex) {
            return {
              ...leader,
              isDuplicate: false,
              duplicateGroup: undefined
            };
          }
          return leader;
        });

        setMappedLeaders(updatedLeaders);

        setTimeout(() => {
          checkDuplicates(updatedLeaders);
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
                Found {duplicateCount} potential duplicate leader records based on name, contact, and WhatsApp.
              </p>
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-orange-700">Total Records: {mappedLeaders.length}</span>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {currentData.map((leader, index) => {
                const globalIndex = startIndex + index;

                return (
                  <tr
                    key={`duplicate-${leader._rowIndex || globalIndex}-${leader.name}`}
                    className={`hover:bg-slate-50 ${leader.isDuplicate ? 'bg-orange-50/50' : ''
                      }`}
                  >
                    <td className="px-4 py-3 text-sm text-slate-500">{globalIndex + 1}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{leader.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{leader.contactNumber}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{leader.whatsappNumber}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{leader.place}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{leader.type}</td>
                    <td className="px-4 py-3 text-sm">
                      {leader.isDuplicate ? (
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
                        {leader.isDuplicate && (
                          <button
                            onClick={() => keepSingleLeader(leader)}
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition flex items-center gap-1"
                            title="Keep this leader as unique"
                          >
                            <FiCheckCircle className="w-3 h-3" />
                            Keep
                          </button>
                        )}
                        <button
                          onClick={() => removeSingleLeader(leader)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition flex items-center gap-1"
                          title="Remove this leader completely"
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

          {displayData.length === 0 && (
            <div className="text-center py-12">
              <FiUsers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No leaders to display</p>
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

  // Location step component
  const LocationStep = () => {
    if (!mappedLeaders || mappedLeaders.length === 0) {
      return (
        <div className="mb-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
              <FiMapPin className="w-4 h-4" /> No Leader Data
            </h4>
            <p className="text-xs text-orange-700">
              No leader data available. Please go back and upload a valid Excel file.
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

    const [localInputValues, setLocalInputValues] = useState<{ [key: number]: string }>({});

    const unverifiedLocations = mappedLeaders.filter(s => s && s.locationStatus !== 'verified');
    const verifiedCount = mappedLeaders.filter(s => s && s.locationStatus === 'verified').length;
    const notFoundCount = mappedLeaders.filter(s => s && s.locationStatus === 'not_found').length;

    const currentData = getCurrentPageData(mappedLeaders);

    const handlePlaceBlur = (globalIndex: number) => {
      const value = localInputValues[globalIndex] || '';

      setMappedLeaders(prev => {
        const updated = [...prev];
        updated[globalIndex].place = value;
        updated[globalIndex].locationStatus = 'pending';
        updated[globalIndex].latitude = undefined;
        updated[globalIndex].longitude = undefined;
        return updated;
      });
    };

    const handlePlaceSelect = (globalIndex: number, result: PlaceSelectResult) => {
      setLocalInputValues(prev => ({ ...prev, [globalIndex]: result.displayName }));
      setMappedLeaders(prev => {
        const updated = [...prev];
        updated[globalIndex].place = result.displayName;
        updated[globalIndex].latitude = result.latitude;
        updated[globalIndex].longitude = result.longitude;
        updated[globalIndex].locationStatus = 'verified';
        return updated;
      });
    };

    const verifyAllLocations = async () => {
      for (let i = 0; i < mappedLeaders.length; i++) {
        const leader = mappedLeaders[i];
        if (leader.place && leader.place.length > 2 && leader.locationStatus !== 'verified') {
          await verifyLocation(i, leader.place);
        }
      }
    };

    const handleManualVerify = (globalIndex: number) => {
      const leader = mappedLeaders[globalIndex];
      if (leader.place && leader.place.trim()) {
        verifyLocation(globalIndex, leader.place);
      }
    };

    return (
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <FiMapPin className="w-4 h-4" /> Verify Locations
              </h4>
              <p className="text-xs text-blue-700 mb-3">
                Verify and correct location data for each leader. Type any location description.
                Click the verify button or select from suggestions.
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-blue-700">Total: {mappedLeaders.length}</span>
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

        <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Row</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Original Place</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Verified Place</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {currentData.map((leader, idx) => {
                const globalIndex = (currentPage - 1) * rowsPerPage + idx;
                const rowKey = `location-row-${globalIndex}-${leader._rowIndex}`;

                return (
                  <tr key={rowKey} className={`hover:bg-slate-50 ${leader.locationStatus === 'verified' ? 'bg-green-50/30' :
                    leader.locationStatus === 'not_found' ? 'bg-orange-50/30' : ''
                    }`}>
                    <td className="px-4 py-3 text-sm text-slate-500">{globalIndex + 1}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{leader._rowIndex}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{leader.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{leader.originalPlace}</td>
                    <td className="px-4 py-3 text-sm">
                      <PlaceSearchInput
                        value={localInputValues[globalIndex] !== undefined ? localInputValues[globalIndex] : (leader.place || '')}
                        onChange={(v) => setLocalInputValues(prev => ({ ...prev, [globalIndex]: v }))}
                        onSelect={(result) => handlePlaceSelect(globalIndex, result)}
                        onBlur={() => handlePlaceBlur(globalIndex)}
                        status={leader.locationStatus}
                        placeholder="Type any location..."
                      />
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {leader.locationStatus === 'verified' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <FiCheckCircle className="w-3 h-3" /> Verified
                        </span>
                      )}
                      {leader.locationStatus === 'not_found' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          <FiAlertCircle className="w-3 h-3" /> Not Found
                        </span>
                      )}
                      {!leader.locationStatus && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleManualVerify(globalIndex)}
                        disabled={searchingLocation === globalIndex || !leader.place?.trim()}
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

          {mappedLeaders.length === 0 && (
            <div className="text-center py-12">
              <FiMapPin className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No leader data available</p>
            </div>
          )}
        </div>

        <PaginationControls totalItems={mappedLeaders.length} />

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <span className="font-medium">Summary:</span>{' '}
            {verifiedCount} verified, {notFoundCount} not found, {unverifiedLocations.length - notFoundCount} pending
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep('duplicates')}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep('configuration')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition"
            >
              Continue to Event Configuration <FiArrowRight />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Event Configuration step component
  const ConfigurationStep = () => {
    const [autoVerifyingGroups, setAutoVerifyingGroups] = useState(false);
    const [configProgress, setConfigProgress] = useState({ current: 0, total: 0 });

    const currentData = getCurrentPageData(mappedLeaders);
    const startIndex = (currentPage - 1) * rowsPerPage;

    // Auto-verify group following based on original input
    const autoVerifyGroups = async () => {
      setAutoVerifyingGroups(true);
      const leaders = [...mappedLeaders];

      for (let i = 0; i < leaders.length; i++) {
        setConfigProgress({ current: i + 1, total: leaders.length });

        const leader = leaders[i];

        if (leader.originalIsFollowing) {
          const groupText = leader.originalIsFollowing.toLowerCase().trim();

          // Check if it's 'no' or 'none'
          const noGroupKeywords = ['no', 'none', 'nil', 'n/a', 'na', '-'];
          const isNoGroup = noGroupKeywords.includes(groupText);

          if (isNoGroup) {
            leaders[i] = {
              ...leader,
              isFollowing: 'no',
              isFollowingStatus: 'verified'
            };
          } else {
            // Check if the group exists in available groups
            const matchingGroup = availableGroups.find(g =>
              g.toLowerCase() === groupText ||
              groupText.includes(g.toLowerCase())
            );

            if (matchingGroup) {
              leaders[i] = {
                ...leader,
                isFollowing: matchingGroup,
                isFollowingStatus: 'verified'
              };
            } else {
              // If no matching group found, set to 'no' and add warning
              leaders[i] = {
                ...leader,
                isFollowing: 'no',
                isFollowingStatus: 'verified',
                _warnings: [...(leader._warnings || []), `Group "${groupText}" not found, set to 'no'`]
              };
            }
          }
        } else {
          // Empty group field means NO
          leaders[i] = {
            ...leader,
            isFollowing: 'no',
            isFollowingStatus: 'verified'
          };
        }

        setMappedLeaders([...leaders]);
      }

      setAutoVerifyingGroups(false);
    };

    const updateGroup = (index: number, groupValue: string) => {
      setMappedLeaders(prev => prev.map((leader, idx) => {
        if (idx === index) {
          return {
            ...leader,
            isFollowing: groupValue,
            isFollowingStatus: 'verified'
          };
        }
        return leader;
      }));
    };

    const updateType = (index: number, typeValue: string) => {
      setMappedLeaders(prev => prev.map((leader, idx) => {
        if (idx === index) {
          return {
            ...leader,
            type: typeValue as any
          };
        }
        return leader;
      }));
    };

    // Removed updateStaying (unused)

    return (
      <div className="mb-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-2">
            <FiUsers /> Event Configuration
          </h4>
          <p className="text-xs text-purple-700">
            Configure group following, leader types, and staying preferences for each leader.
          </p>
          <div className="mt-2 text-xs text-purple-600">
            <span className="font-medium">Available Groups:</span>{' '}
            {availableGroups.length > 0 ? availableGroups.join(', ') : 'No groups available'}
          </div>
        </div>

        {autoVerifyingGroups ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-600">
              Auto-verifying group assignments... {configProgress.current} of {configProgress.total}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Group Following</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Leader Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {currentData.map((leader, index) => {
                    const globalIndex = startIndex + index;
                    const hasGroupWarning = leader._warnings?.some((w: string) => w.includes('Group'));

                    // Dynamic type options per leader
                    const dynamicTypeOptions: { value: 'participant' | 'guest' | 'leader2' | 'leader1', label: string }[] = leader.isFollowing === 'no'
                      ? [
                        { value: 'participant', label: 'Participant' },
                        { value: 'guest', label: 'Guest' },
                      ]
                      : [
                        { value: 'leader2', label: 'Leader 2' },
                        { value: 'leader1', label: 'Leader 1' },
                      ];

                    // Ensure type is valid for current options
                    if (!dynamicTypeOptions.some(opt => opt.value === leader.type)) {
                      leader.type = dynamicTypeOptions[0].value;
                    }

                    return (
                      <tr
                        key={`config-${globalIndex}-${leader._rowIndex}`}
                        className={`hover:bg-slate-50 ${hasGroupWarning ? 'bg-yellow-50' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm text-slate-500">{globalIndex + 1}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{leader.name}</td>
                        <td className="px-4 py-3 text-sm">
                          {/* Group Following correction UI like leader new page */}
                          <select
                            value={leader.isFollowing || 'no'}
                            onChange={(e) => updateGroup(globalIndex, e.target.value)}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-100 focus:border-transparent outline-none"
                          >
                            <option value="no">Not Following</option>
                            {availableGroups.map(group => (
                              <option key={group} value={group}>
                                Group {group}
                              </option>
                            ))}
                          </select>
                          {hasGroupWarning && (
                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                              <FiAlertCircle /> Warning
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {/* Leader Type correction UI like leader new page, dynamic options */}
                          <select
                            value={leader.type}
                            onChange={(e) => updateType(globalIndex, e.target.value)}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-100 focus:border-transparent outline-none"
                          >
                            {dynamicTypeOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        {/* Removed Staying column */}
                        <td className="px-4 py-3 text-sm">
                          {leader.isFollowingStatus === 'verified' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                              <FiCheckCircle /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {mappedLeaders.length === 0 && (
                <div className="text-center py-12">
                  <FiUsers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">No leader data available</p>
                </div>
              )}
            </div>

            <PaginationControls totalItems={mappedLeaders.length} />

            <div className="flex justify-between gap-3 mt-4">
              <div>
                <button
                  onClick={autoVerifyGroups}
                  disabled={autoVerifyingGroups || mappedLeaders.length === 0}
                  className="px-6 py-2.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-purple-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiRefreshCw className={autoVerifyingGroups ? 'animate-spin' : ''} />
                  {autoVerifyingGroups ? 'Verifying...' : 'Auto-verify Group Assignments'}
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
                    setMappedLeaders(prev => prev.map(leader => ({
                      ...leader,
                      isFollowingStatus: 'verified'
                    })));
                    setCurrentStep('preview');
                  }}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition"
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

  // Preview step component - Optimized version with virtual scrolling and better performance
  const PreviewStep = () => {
    const validCount = mappedLeaders.filter(s => s._isValid).length;
    const invalidCount = mappedLeaders.length - validCount;
    const followingCount = mappedLeaders.filter(s => s.isFollowing !== 'no').length;
    const locationVerifiedCount = mappedLeaders.filter(s => s.locationStatus === 'verified').length;

    // State for expanded view
    const [isExpanded, setIsExpanded] = useState(false);
    const [showAllRecords, setShowAllRecords] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Helper function to validate and parse coordinates
    const parseCoordinate = (value: any): number | null => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'number' && !isNaN(value)) return value;
      if (typeof value === 'string') {
        if (value.toLowerCase() === 'yes' || value.toLowerCase() === 'no' || value.toLowerCase() === '') {
          return null;
        }
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
      return null;
    };

    // Handle expand/collapse with loading state
    const handleToggleExpand = async () => {
      if (!isExpanded) {
        setIsLoading(true);
        // Simulate a small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 100));
        setIsExpanded(true);
        setIsLoading(false);
      } else {
        setIsExpanded(false);
        setShowAllRecords(false);
      }
    };

    // Handle show all records with loading
    const handleShowAllRecords = async () => {
      setIsLoading(true);
      // Simulate a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      setShowAllRecords(true);
      setIsLoading(false);
    };

    // Determine which records to display
    const displayRecords = showAllRecords
      ? mappedLeaders
      : mappedLeaders.slice(0, 10); // Show 10 records initially when expanded

    return (
      <div className="mb-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600">Total Records</p>
            <p className="text-2xl font-bold text-blue-700">{mappedLeaders.length}</p>
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
            <p className="text-sm text-purple-600">Following Groups</p>
            <p className="text-2xl font-bold text-purple-700">{followingCount}</p>
          </div>
          <div className="bg-teal-50 rounded-lg p-4">
            <p className="text-sm text-teal-600">Locations Verified</p>
            <p className="text-2xl font-bold text-teal-700">{locationVerifiedCount}</p>
          </div>
        </div>

        {/* Table Preview - Using button toggle instead of details/summary */}
        <div className="mb-6">
          <button
            onClick={handleToggleExpand}
            className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center justify-between"
            disabled={isLoading}
          >
            <span className="text-sm font-medium text-slate-700">
              {isLoading ? 'Loading...' : (isExpanded ? 'Hide Table View' : 'Show Table View')}
            </span>
            <span className="text-xs text-slate-500">
              {mappedLeaders.length} total records
            </span>
          </button>

          {isExpanded && (
            <div className="mt-4 overflow-x-auto border border-slate-200 rounded-lg">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-sm text-slate-500 mt-2">Loading records...</p>
                </div>
              ) : (
                <>
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Row</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Gender</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Place</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Group</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Staying</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Latitude</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Longitude</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {displayRecords.map((leader, idx) => {
                        const latitude = parseCoordinate(leader.latitude);
                        const longitude = parseCoordinate(leader.longitude);

                        return (
                          <tr key={`preview-${idx}-${leader._rowIndex}`} className={leader._isValid ? '' : 'bg-red-50'}>
                            <td className="px-4 py-3 text-sm text-slate-500">{leader._rowIndex}</td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-900">{leader.name}</td>
                            <td className="px-4 py-3 text-sm capitalize text-slate-900">{leader.gender}</td>
                            <td className="px-4 py-3 text-sm text-slate-900">{leader.place}</td>
                            <td className="px-4 py-3 text-sm text-slate-900">{leader.contactNumber}</td>
                            <td className="px-4 py-3 text-sm">
                              {leader.isFollowing !== 'no' ? (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                  Group {leader.isFollowing}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-900">
                              {typeOptions.find(t => t.value === leader.type)?.label || leader.type}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {leader.staying === 'yes' ? (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Yes</span>
                              ) : (
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">No</span>
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

                  {/* Show more/less button */}
                  {mappedLeaders.length > 10 && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                      {!showAllRecords ? (
                        <button
                          onClick={handleShowAllRecords}
                          disabled={isLoading}
                          className="w-full text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center gap-2"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                              Loading...
                            </>
                          ) : (
                            <>Show All {mappedLeaders.length} Records</>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowAllRecords(false)}
                          className="w-full text-sm text-slate-600 hover:text-slate-800 font-medium"
                        >
                          Show Less
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {invalidCount > 0 && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 mb-2">Validation Errors</h4>
            <div className="max-h-40 overflow-y-auto">
              {mappedLeaders.filter(s => !s._isValid).map((leader, idx) => (
                <div key={`error-${idx}-${leader._rowIndex}`} className="text-sm text-red-600 mb-1">
                  <span className="font-medium">Row {leader._rowIndex}:</span> {leader.name} - {leader._errors.join(', ')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {mappedLeaders.some(s => s._warnings.length > 0) && (
          <div className="mt-4 p-4 bg-orange-50 rounded-lg">
            <h4 className="text-sm font-medium text-orange-800 mb-2">Warnings</h4>
            <div className="max-h-40 overflow-y-auto">
              {mappedLeaders.filter(s => s._warnings.length > 0).map((leader, idx) => (
                <div key={`warning-${idx}-${leader._rowIndex}`} className="text-sm text-orange-600 mb-1">
                  <span className="font-medium">Row {leader._rowIndex}:</span> {leader.name} - {leader._warnings.join(', ')}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setCurrentStep('configuration')}
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
                Import {validCount} Leaders
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const handleImport = async () => {
    if (!hasAdminOrCoAdmin()) return;

    setIsProcessing(true);
    setImportProgress({ total: mappedLeaders.length, completed: 0, failed: 0 });

    const validLeaders = mappedLeaders.filter(s => s._isValid);

    const leadersPayload = validLeaders.map(leader => ({
      name: leader.name?.trim() || '',
      gender: leader.gender?.toLowerCase(),
      place: leader.place?.trim() || '',
      latitude: typeof leader.latitude === 'number' && !isNaN(leader.latitude) ? leader.latitude : null,
      longitude: typeof leader.longitude === 'number' && !isNaN(leader.longitude) ? leader.longitude : null,
      contactNumber: leader.contactNumber?.toString().trim() || '',
      whatsappNumber: leader.whatsappNumber?.toString().trim() || leader.contactNumber?.toString().trim() || '',
      churchName: leader.churchName?.trim() || '',
      staying: leader.staying || 'no',
      status: 'registered',
      isFollowing: leader.isFollowing === 'no' ? 'no' : leader.isFollowing,
      type: leader.type || 'participant',
      remark: leader.remark?.trim() || '',
      registeredMode: 'offline'
    }));

    try {
      const apiUrl = `${API_BASE}/user/leaders/excel`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(leadersPayload)
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
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const importResults = result.data.results?.map((r: any) => ({
          rowIndex: r.rowIndex || 0,
          success: r.success || false,
          name: r.name || 'Unknown',
          leaderId: r.leaderId,
          error: r.error
        })) || [];

        setImportResults(importResults);
        setImportProgress({
          total: result.data.totalProcessed || mappedLeaders.length,
          completed: result.data.successCount || 0,
          failed: result.data.failedCount || 0
        });
      } else {
        console.error('Unexpected response structure:', result);
        setImportResults([{
          rowIndex: 0,
          success: false,
          name: 'Bulk Import',
          error: result.message || 'Unexpected response structure from server'
        }]);
      }

    } catch (error) {
      console.error('Error importing leaders:', error);
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
                        {result.success && result.leaderId && (
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                            ID: {result.leaderId}
                          </span>
                        )}
                      </div>
                      {result.success ? (
                        <p className="text-sm text-green-600 mt-1">
                          Imported successfully
                        </p>
                      ) : (
                        <p className="text-sm text-red-600 mt-1">
                          {result.error}
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
                navigate('/user/leader');
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              View Leaders
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // Reset upload
  const resetUpload = () => {
    setCurrentStep('upload');
    setFileName('');
    setUploadError('');
    setExcelData([]);
    setExcelHeaders([]);
    setColumnMapping([]);
    setMappedLeaders([]);
    setValidationErrors([]);
    setCurrentPage(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Access denied state
  if (permissionError || accessDenied || !hasAdminOrCoAdmin()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <AccessAlert message={errorMessage || "Only administrators and co-administrators can access the leader Excel import feature."} />
      </div>
    );
  }

  if (permissionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <StickyHeader title="Leader Excel Data Import" onBack={() => navigate('/user/leader')}>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium"
          >
            <FiDownload /> Download Template
          </button>
        </StickyHeader>
        <LeaderExcelSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      <StickyHeader title="Leader Excel Data Import" onBack={() => navigate('/user/leader')}>
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
      </StickyHeader>

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
              {currentStep === 'configuration' && <ConfigurationStep />}
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

export default LeaderExcel;
