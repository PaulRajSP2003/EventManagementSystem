import type { Admin } from '../../../types';
import { Link } from 'react-router-dom';

interface AdminCardProps {
  admin: Admin;
  onDelete?: (adminId: number) => void;
}

export default function AdminCard({ admin, onDelete }: AdminCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{admin.name}</h3>
          <p className="text-sm text-slate-600">{admin.role}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          admin.isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {admin.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-slate-700">
          <span className="font-medium w-32 text-sm">Email:</span>
          <span className="text-sm">{admin.email}</span>
        </div>
        <div className="flex items-center text-slate-700">
          <span className="font-medium w-32 text-sm">Contact:</span>
          <span className="text-sm">{admin.contactNumber}</span>
        </div>
        <div className="flex items-center text-slate-700">
          <span className="font-medium w-32 text-sm">Role Level:</span>
          <span className="text-sm">{admin.assignRole}</span>
        </div>
        <div className="flex items-start text-slate-700">
          <span className="font-medium w-32 text-sm">Permissions:</span>
          <div className="flex flex-wrap gap-1">
            {admin.permissionPages?.map((page: string, idx: number) => (
              <span key={idx} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                {page}
              </span>
            ))}
          </div>
        </div>
        {admin.remark && (
          <div className="flex items-start text-slate-700">
            <span className="font-medium w-32 text-sm">Remark:</span>
            <span className="text-sm italic">{admin.remark}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Link
          to={`/owner/admin/${admin.id}`}
          className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-center text-sm font-medium"
        >
          View Details
        </Link>
        <Link
          to={`/owner/admin/edit/${admin.id}`}
          className="flex-1 bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors text-center text-sm font-medium"
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete?.(admin.id || 0)}
          className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
