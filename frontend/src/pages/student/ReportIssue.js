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
    priority: 'Normal',
  });
  const [proof, setProof] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
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

  const handleProofChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProof(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create FormData to handle file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('priority', formData.priority);
      if (proof) {
        formDataToSend.append('proof', proof);
      }

      await issueAPI.createIssue(formDataToSend);
      setSuccess('✅ Issue reported successfully!');
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'Medium',
      });
      setProof(null);
      setProofPreview(null);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      <button
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
      >
        ← Back to Dashboard
      </button>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🚨 Report Classroom Issue</h1>
          <p className="text-gray-500">Help us improve by reporting any problems</p>
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

        <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Issue Title <span className="text-blue-600">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Broken projector in room 101"
                minLength="5"
                required
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <p className="text-xs text-gray-500 mt-2">Minimum 5 characters</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Description <span className="text-blue-600">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the issue in detail..."
                minLength="10"
                rows="5"
                required
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">Minimum 10 characters</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Category <span className="text-blue-600">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">Select Category</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="equipment">Equipment</option>
                  <option value="utilities">Utilities</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Priority <span className="text-blue-600">*</span>
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="Minor">Minor</option>
                  <option value="Normal">Normal</option>
                  <option value="Important">Important</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Proof Image (Optional) 📷
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleProofChange}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition file:mr-3 file:py-2 file:bg-blue-600 file:text-white file:rounded file:border-0 file:cursor-pointer hover:file:bg-blue-700"
              />
              <p className="text-xs text-gray-500 mt-2">Upload a photo to prove the issue (Max 5MB, JPEG/PNG/GIF)</p>
              {proofPreview && (
                <div className="mt-4">
                  <p className="text-xs text-gray-700 font-semibold mb-2">Preview:</p>
                  <img src={proofPreview} alt="Proof preview" className="w-32 h-32 object-cover rounded-lg border border-gray-300" />
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-blue-900 font-semibold">
                📍 Your Classroom
              </p>
              <p className="text-blue-800 mt-2 text-lg font-medium">
                {profile?.classroomId
                  ? `${profile.classroomId.department} - Year ${profile.classroomId.year} - Section ${profile.classroomId.section}`
                  : 'No classroom assigned — contact your admin'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
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
