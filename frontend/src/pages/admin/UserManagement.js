import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, authAPI, classroomAPI } from '../../services/api';

const UserManagement = ({ onBack }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [hodUser, setHodUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    rollNumber: '',
    classroomId: '',
    courseType: 'BTech',
    specialization: '',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    rollNumber: '',
    classroomId: '',
    courseType: 'BTech',
    specialization: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchClassrooms();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterRole) params.role = filterRole;
      if (searchQuery) params.search = searchQuery;
      const response = await userAPI.getAllUsers(params);
      setUsers(response.data.data);
      
      // Find and set the current HOD
      const currentHod = response.data.data.find(user => user.role === 'hod');
      setHodUser(currentHod || null);
      
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const response = await classroomAPI.getAllClassrooms();
      setClassrooms(response.data.data);
    } catch (err) {
      // Classrooms are optional for the form
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterRole, searchQuery]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = { ...formData };
      if (!payload.rollNumber) delete payload.rollNumber;
      if (!payload.classroomId) delete payload.classroomId;

      await authAPI.register(payload);
      setSuccess('User created successfully');
      setFormData({ name: '', email: '', password: '', role: 'student', rollNumber: '', classroomId: '', courseType: 'BTech', specialization: '' });
      setShowForm(false);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await userAPI.updateUser(userId, { isActive: !currentStatus });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleOpenEditForm = (user) => {
    // Clear any previous edit state first
    setShowEditForm(false);
    setEditingUserId(null);
    setEditFormData({ name: '', email: '', role: 'student', rollNumber: '', classroomId: '', courseType: 'BTech', specialization: '' });
    
    // Then set new user data
    setTimeout(() => {
      setEditingUserId(user._id);
      setEditFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber || '',
        classroomId: user.classroomId ? user.classroomId._id : '',
        courseType: user.courseType || 'BTech',
        specialization: user.specialization || '',
      });
      setShowEditForm(true);
    }, 0);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = { ...editFormData };
      if (!payload.rollNumber) delete payload.rollNumber;
      if (!payload.classroomId) delete payload.classroomId;

      await userAPI.updateUser(editingUserId, payload);
      
      // Close form and reset state IMMEDIATELY before refreshing
      setShowEditForm(false);
      setEditingUserId(null);
      setEditFormData({ name: '', email: '', role: 'student', rollNumber: '', classroomId: '', courseType: 'BTech', specialization: '' });
      
      // Then refresh the user list
      await fetchUsers();
      
      // Show success message
      setSuccess('User updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700',
      faculty: 'bg-blue-100 text-blue-700',
      student: 'bg-green-100 text-green-700',
      hod: 'bg-blue-100 text-blue-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors font-medium">
        <span className="text-2xl">←</span>
        <span>Back to Dashboard</span>
      </button>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-500">Manage all system users</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
        >
          {showForm ? '✕ Cancel' : '+ Create User'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Create User Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New User</h2>
          <form onSubmit={handleCreateUser} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Full name"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="user@college.edu"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength="6"
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Roll Number</label>
                <input
                  type="text"
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  placeholder="e.g., CS2021001"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Classroom</label>
                <select
                  value={formData.classroomId}
                  onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Classroom</option>
                  {classrooms.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.department} - Y{c.year} S{c.section}
                    </option>
                  ))}
                </select>
              </div>
              {formData.role === 'student' && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Course Type</label>
                <select
                  value={formData.courseType}
                  onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BTech">BTech</option>
                  <option value="MTech">MTech</option>
                </select>
              </div>
              )}
              {formData.role === 'student' && formData.courseType === 'MTech' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Specialization *</label>
                  <select
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    required={formData.courseType === 'MTech'}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Specialization</option>
                    <option value="Artificial Intelligence and Machine Learning">Artificial Intelligence and Machine Learning</option>
                    <option value="Computer Science & Technology">Computer Science & Technology</option>
                    <option value="Computer Networks and Information Security">Computer Networks and Information Security</option>
                  </select>
                </div>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
            >
              Create User
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Search Users</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Filter by Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
          </div>
        </div>
      </div>

      {/* Current HOD Display */}
      {hodUser && (
        <div className="bg-indigo-50 border-l-4 border-indigo-600 rounded-lg p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-bold text-indigo-900 mb-3">👨‍💼 Head of Department</h3>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-indigo-900 font-semibold text-lg">{hodUser.name}</p>
              <p className="text-indigo-700">{hodUser.email}</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(hodUser.role)}`}>
                {hodUser.role.toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => handleOpenEditForm(hodUser)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
            >
              ✎ Edit Basic Info
            </button>
          </div>
        </div>
      )}

      {/* User List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 font-medium">Loading users...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {users.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500 text-lg">No users found</p>
            </div>
          ) : (
            users.map(user => (
              <div key={user._id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{user.name}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs font-semibold">Email</p>
                        <p className="text-gray-900 font-medium">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs font-semibold">Role</p>
                        <span className={`inline-block px-3 py-1 rounded text-xs font-semibold mt-1 ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs font-semibold">Classroom</p>
                        <p className="text-gray-900 font-medium">
                          {user.classroomId
                            ? `${user.classroomId.department} - Year ${user.classroomId.year} - Section ${user.classroomId.section}`
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs font-semibold">Status</p>
                        <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                          user.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user.role === 'hod' ? (
                      <button
                        onClick={() => handleOpenEditForm(user)}
                        className="px-4 py-2 rounded-lg font-semibold transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        ✎ Edit Basic Info
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOpenEditForm(user)}
                          className="px-4 py-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          ✎ Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(user._id, user.isActive)}
                          className={`px-4 py-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-300 ${
                            user.isActive
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Inline Edit Form - Shows under selected user */}
                {editingUserId === user._id && (
                  <div className="mt-6 pt-6 border-t border-gray-300 bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      {user.role === 'hod' ? 'Edit HOD Information' : 'Edit User Details'}
                    </h3>
                    <form onSubmit={handleUpdateUser} className="space-y-4">
                      {user.role === 'hod' ? (
                        // Limited form for HOD (name and email only)
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Name *</label>
                            <input
                              type="text"
                              value={editFormData.name}
                              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                              required
                              placeholder="Full name"
                              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Email *</label>
                            <input
                              type="email"
                              value={editFormData.email}
                              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                              required
                              placeholder="user@college.edu"
                              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      ) : (
                        // Full form for non-HOD users
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Name *</label>
                            <input
                              type="text"
                              value={editFormData.name}
                              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                              required
                              placeholder="Full name"
                              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Email *</label>
                            <input
                              type="email"
                              value={editFormData.email}
                              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                              required
                              placeholder="user@college.edu"
                              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Role *</label>
                            <select
                              value={editFormData.role}
                              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="student">Student</option>
                              <option value="faculty">Faculty</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Roll Number</label>
                            <input
                              type="text"
                              value={editFormData.rollNumber}
                              onChange={(e) => setEditFormData({ ...editFormData, rollNumber: e.target.value })}
                              placeholder="e.g., CS2021001"
                              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Classroom</label>
                            <select
                              value={editFormData.classroomId}
                              onChange={(e) => setEditFormData({ ...editFormData, classroomId: e.target.value })}
                              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">No Classroom</option>
                              {classrooms.map(c => (
                                <option key={c._id} value={c._id}>
                                  {c.department} - Y{c.year} S{c.section}
                                </option>
                              ))}
                            </select>
                          </div>
                          {editFormData.role === 'student' && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Course Type</label>
                            <select
                              value={editFormData.courseType}
                              onChange={(e) => setEditFormData({ ...editFormData, courseType: e.target.value })}
                              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="BTech">BTech</option>
                              <option value="MTech">MTech</option>
                            </select>
                          </div>
                          )}
                          {editFormData.role === 'student' && editFormData.courseType === 'MTech' && (
                            <div>
                              <label className="block text-sm font-semibold text-gray-900 mb-2">Specialization *</label>
                              <select
                                value={editFormData.specialization}
                                onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                                required={editFormData.courseType === 'MTech'}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Specialization</option>
                                <option value="Artificial Intelligence and Machine Learning">Artificial Intelligence and Machine Learning</option>
                                <option value="Computer Science & Technology">Computer Science & Technology</option>
                                <option value="Computer Networks and Information Security">Computer Networks and Information Security</option>
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUserId(null);
                            setEditFormData({ name: '', email: '', role: 'student', rollNumber: '', classroomId: '' });
                          }}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UserManagement;
