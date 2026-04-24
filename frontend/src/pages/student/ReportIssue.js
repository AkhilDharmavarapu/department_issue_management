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
        console.log('[REPORT ISSUE] Adding proof file:', { name: proof.name, size: proof.size, type: proof.type });
      }

      console.log('[REPORT ISSUE] Sending FormData with fields:', {
        title: formData.title,
        description: formData.description.substring(0, 30) + '...',
        category: formData.category,
        priority: formData.priority,
        hasProof: !!proof,
      });

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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 1: BASIC INFO */}
            <div className="pb-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-5">Basic Information</h3>

              {/* 1. Title */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Issue Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Broken projector in classroom"
                  minLength="5"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              {/* 2. Category & 3. Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="">Select Category</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="equipment">Equipment</option>
                    <option value="utilities">Utilities</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="Minor">Minor</option>
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: DETAILS */}
            <div className="pb-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-5">Details</h3>

              {/* 4. Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Explain the issue clearly (what happened, where, when...)"
                  minLength="10"
                  rows="7"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                />
              </div>
            </div>

            {/* SECTION 3: PROOF */}
            <div className="pb-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-5">Upload Proof</h3>

              {/* 5. File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Proof <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProofChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition file:mr-3 file:py-2 file:px-3 file:bg-blue-600 file:text-white file:rounded file:border-0 file:cursor-pointer file:font-medium hover:file:bg-blue-700 transition"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {proof ? `📎 Selected: ${proof.name}` : 'Images only (JPG, PNG, GIF) • Max 5MB'}
                </p>

                {/* Image Preview */}
                {proofPreview && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Preview:</p>
                    <div className="w-40 h-40 border-2 border-blue-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                      <img 
                        src={proofPreview} 
                        alt="Proof preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Classroom Information */}
            <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-5">
              <p className="text-sm font-semibold text-blue-900 mb-1">📍 Reporting for Classroom:</p>
              <p className="text-blue-900 font-medium">
                {profile?.classroomId
                  ? `${profile.classroomId.department} • Year ${profile.classroomId.year} • Section ${profile.classroomId.section}`
                  : 'No classroom assigned — contact your admin'}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
            >
              {loading ? '⏳ Submitting...' : '🚀 Submit Issue Report'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;
