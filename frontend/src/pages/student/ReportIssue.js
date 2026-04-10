import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ReportIssue = ({ onBack }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
  });
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    authAPI.getMe()
      .then(res => setProfile(res.data.data))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await issueAPI.createIssue(formData);
      setSuccess('✅ Issue reported successfully!');
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'Medium',
      });
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
      <button
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
      >
        ← Back to Dashboard
      </button>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🚨 Report Classroom Issue</h1>
          <p className="text-green-300/70">Help us improve by reporting any problems</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 text-green-300 rounded-xl animate-pulse">
            {success}
          </div>
        )}

        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-green-500/20">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-green-300 mb-3">
                Issue Title <span className="text-green-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Broken projector in room 101"
                minLength="5"
                required
                className="w-full px-5 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              />
              <p className="text-xs text-green-300/70 mt-2">Minimum 5 characters</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-green-300 mb-3">
                Description <span className="text-green-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the issue in detail..."
                minLength="10"
                rows="5"
                required
                className="w-full px-5 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none"
              />
              <p className="text-xs text-green-300/70 mt-2">Minimum 10 characters</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-green-300 mb-3">
                  Category <span className="text-green-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                >
                  <option value="">Select Category</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="equipment">Equipment</option>
                  <option value="utilities">Utilities</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-green-300 mb-3">
                  Priority <span className="text-green-500">*</span>
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-5 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-6">
              <p className="text-green-300 font-semibold">
                📍 Your Classroom
              </p>
              <p className="text-green-100 mt-2 text-lg font-medium">
                {profile?.classroomId
                  ? `${profile.classroomId.department} - Year ${profile.classroomId.year} - Section ${profile.classroomId.section}`
                  : 'No classroom assigned — contact your admin'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 disabled:from-green-400 disabled:to-green-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Submitting...' : '🚀 Submit Issue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;
