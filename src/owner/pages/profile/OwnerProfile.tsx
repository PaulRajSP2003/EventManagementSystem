import { useState } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import { useNavigate } from 'react-router-dom';

export default function OwnerProfile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    email: localStorage.getItem('ownerEmail') || 'owner@example.com',
    ownerName: 'Owner Name',
    phoneNumber: '+1234567890',
    address: 'Your Address',
    organization: 'Your Organization',
  });
  const [formData, setFormData] = useState(profile);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSave = () => {
    setProfile(formData);
    setIsEditing(false);
  };

  const handleLogout = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    navigate('/owner/login');
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {profile.ownerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile.ownerName}</h2>
              <p className="text-gray-600">{profile.email}</p>
            </div>
          </div>

          {!isEditing ? (
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Email</h3>
                    <p className="text-gray-900">{profile.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Phone Number</h3>
                    <p className="text-gray-900">{profile.phoneNumber}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Organization</h3>
                    <p className="text-gray-900">{profile.organization}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Owner Name</h3>
                    <p className="text-gray-900">{profile.ownerName}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Address</h3>
                  <p className="text-gray-900">{profile.address}</p>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setFormData(profile);
                    setIsEditing(true);
                  }}
                  className="flex-1 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Cannot be changed)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 outline-none"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization
                  </label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(profile);
                  }}
                  className="flex-1 bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Security</h2>
          <div className="space-y-4">
            <button className="w-full bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition-colors">
              Change Password
            </button>
            <button className="w-full bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition-colors">
              View Login History
            </button>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}
