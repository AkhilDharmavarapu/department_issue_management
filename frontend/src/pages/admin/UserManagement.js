import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, authAPI, classroomAPI } from '../../services/api';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    rollNumber: '',
    classroomId: '',
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
      setFormData({ name: '', email: '', password: '', role: 'student', rollNumber: '', classroomId: '' });
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

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      faculty: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      student: 'bg-green-500/20 text-green-300 border-green-500/30',
    };
    return colors[role] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
      <button onClick={() => navigate('/admin/dashboard?tab=overview')} className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 mb-4 transition-colors">
        <span className="text-2xl">←</span>
        <span className="font-semibold">Back to Dashboard</span>
      </button>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
          <p className="text-green-300/70">Manage all system users</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {showForm ? '✕ Cancel' : '+ Create User'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 text-green-300 rounded-xl">
          {success}
        </div>
      )}

      {/* Create User Form */}
      {showForm && (
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 mb-8 border border-green-500/20">
          <h2 className="text-2xl font-bold text-white mb-6">Create New User</h2>
          <form onSubmit={handleCreateUser} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-green-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Full name"
                  className="w-full px-4 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-green-300 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="user@college.edu"
                  className="w-full px-4 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-green-300 mb-2">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength="6"
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-green-300 mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-green-300 mb-2">Roll Number</label>
                <input
                  type="text"
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  placeholder="e.g., CS2021001"
                  className="w-full px-4 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-green-300 mb-2">Classroom</label>
                <select
                  value={formData.classroomId}
                  onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">No Classroom</option>
                  {classrooms.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.department} - Y{c.year} S{c.section}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
            >
              Create User
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 mb-8 border border-green-500/20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-green-300 mb-2">Search Users</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-4 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-green-300 mb-2">Filter by Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
          </div>
        </div>
      </div>

      {/* User List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-green-300 mt-4">Loading users...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {users.length === 0 ? (
            <div className="text-center py-12 bg-slate-800 rounded-2xl border border-green-500/20">
              <p className="text-green-300/70 text-lg">No users found</p>
            </div>
          ) : (
            users.map(user => (
              <div key={user._id} className="bg-slate-800 rounded-xl shadow-lg p-6 border border-green-500/20 hover:border-green-500/50 transition-all duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">{user.name}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-green-300/70 text-xs font-semibold">Email</p>
                        <p className="text-white font-medium">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-green-300/70 text-xs font-semibold">Role</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border mt-1 ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                      <div>
                        <p className="text-green-300/70 text-xs font-semibold">Classroom</p>
                        <p className="text-white font-medium">
                          {user.classroomId ? `${user.classroomId.department || '—'}` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-green-300/70 text-xs font-semibold">Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                          user.isActive
                            ? 'bg-green-500/20 text-green-300 border-green-500/30'
                            : 'bg-red-500/20 text-red-300 border-red-500/30'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleActive(user._id, user.isActive)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                      user.isActive
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UserManagement;
