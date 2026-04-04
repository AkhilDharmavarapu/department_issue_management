import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { classroomAPI } from '../../services/api';

const Classrooms = () => {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    department: '',
    year: '',
    section: '',
  });

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const response = await classroomAPI.getAllClassrooms();
      setClassrooms(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch classrooms');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await classroomAPI.updateClassroom(editingId, formData);
      } else {
        await classroomAPI.createClassroom(formData);
      }
      setFormData({ department: '', year: '', section: '' });
      setEditingId(null);
      setShowForm(false);
      fetchClassrooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save classroom');
    }
  };

  const handleEdit = (classroom) => {
    setFormData({
      department: classroom.department,
      year: classroom.year,
      section: classroom.section,
    });
    setEditingId(classroom._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this classroom?')) {
      try {
        await classroomAPI.deleteClassroom(id);
        fetchClassrooms();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete classroom');
      }
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <button onClick={() => navigate('/admin/dashboard?tab=overview')} className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 mb-4 transition-colors">
            <span className="text-2xl">←</span>
            <span className="font-semibold">Back to Dashboard</span>
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">🏫 Classrooms</h1>
          <p className="text-green-300/70">Create and manage classroom sections</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ department: '', year: '', section: '' });
          }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          {showForm ? '✕ Cancel' : '+ Add Classroom'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 text-green-300 rounded-xl">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 mb-8 border border-green-500/20">
          <h2 className="text-2xl font-bold text-white mb-6">
            {editingId ? '✏️ Edit Classroom' : '🆕 Create New Classroom'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-green-300 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science"
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-green-300 mb-2">
                  Year
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-green-300 mb-2">
                  Section
                </label>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  placeholder="e.g., A, B"
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              {editingId ? '💾 Update Classroom' : '➕ Create Classroom'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-green-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-green-300 mt-4 font-semibold">Loading classrooms...</p>
          </div>
        </div>
      ) : classrooms.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 rounded-2xl border border-green-500/20">
          <p className="text-green-300/70 text-lg">📭 No classrooms yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map(classroom => (
            <div key={classroom._id} className="bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl p-6 border border-green-500/20 hover:border-green-500/50 transition-all duration-300 transform hover:scale-105">
              <h3 className="text-lg font-bold text-white mb-3">
                {classroom.department}
              </h3>
              <div className="space-y-2 mb-6 text-sm">
                <p className="text-green-300">
                  <span className="font-semibold">Year:</span> {classroom.year}
                </p>
                <p className="text-green-300">
                  <span className="font-semibold">Section:</span> {classroom.section}
                </p>
                <p className="text-green-300">
                  <span className="font-semibold">Faculty:</span> {classroom.facultyList?.length || 0}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(classroom)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(classroom._id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Classrooms;
