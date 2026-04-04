import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { timetableAPI, classroomAPI } from '../../services/api';

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const formatClassroom = (c) =>
  c ? `${c.department} - Year ${c.year} - Section ${c.section}` : '—';

const UploadTimetable = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [loadingTimetables, setLoadingTimetables] = useState(false);

  useEffect(() => {
    fetchClassrooms();
    fetchTimetables();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const response = await classroomAPI.getAllClassrooms();
      setClassrooms(response.data.data);
    } catch (err) {
      // silent
    }
  };

  const fetchTimetables = async () => {
    setLoadingTimetables(true);
    try {
      const response = await timetableAPI.getAllTimetables();
      setTimetables(response.data.data || []);
    } catch (err) {
      // silent
    } finally {
      setLoadingTimetables(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !selectedClassroom) {
      setError('Please select a file and classroom');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('timetable', selectedFile);
      formData.append('classroomId', selectedClassroom);

      await timetableAPI.uploadTimetable(formData);

      setSuccess('✅ Timetable uploaded successfully!');
      setSelectedFile(null);
      setSelectedClassroom('');
      // Reset file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
      fetchTimetables();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timetable?')) return;
    try {
      await timetableAPI.deleteTimetable(id);
      fetchTimetables();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete timetable');
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/admin/dashboard?tab=overview')} className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 mb-4 transition-colors">
          <span className="text-2xl">←</span>
          <span className="font-semibold">Back to Dashboard</span>
        </button>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📅 Upload Timetable</h1>
          <p className="text-green-300/70">Upload classroom timetable images</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 text-green-300 rounded-xl animate-pulse">
            {success}
          </div>
        )}

        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-green-500/20 mb-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-green-300 mb-3">
                Select Classroom
              </label>
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="w-full px-5 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              >
                <option value="">Choose a classroom...</option>
                {classrooms.map(c => (
                  <option key={c._id} value={c._id}>
                    {formatClassroom(c)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-green-300 mb-4">
                Upload Timetable Image
              </label>
              <div className="border-2 border-dashed border-green-500/50 rounded-xl p-8 text-center hover:border-green-500 transition cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <div className="text-5xl mb-4">📸</div>
                  <p className="text-white font-semibold mb-2">
                    {selectedFile ? `✅ ${selectedFile.name}` : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-green-300/70 text-sm">PNG, JPG, GIF up to 5MB</p>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedFile || !selectedClassroom}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? '⏳ Uploading...' : '🚀 Upload Timetable'}
            </button>
          </form>
        </div>

        {/* Existing Timetables */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Uploaded Timetables</h2>
          {loadingTimetables ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-green-300 mt-4">Loading timetables...</p>
            </div>
          ) : timetables.length === 0 ? (
            <div className="text-center py-8 bg-slate-800 rounded-2xl border border-green-500/20">
              <p className="text-green-300/70">No timetables uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {timetables.map(tt => (
                <div key={tt._id} className="bg-slate-800 rounded-xl shadow-lg border border-green-500/20 overflow-hidden hover:border-green-500/50 transition-all duration-300">
                  <img
                    src={`${API_BASE}${tt.imageURL}`}
                    alt={`Timetable - ${formatClassroom(tt.classroomId)}`}
                    className="w-full h-48 object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-1">
                      {formatClassroom(tt.classroomId)}
                    </h3>
                    <p className="text-green-300/70 text-xs mb-3">
                      Uploaded {new Date(tt.uploadedAt || tt.createdAt).toLocaleDateString()} by {tt.uploadedBy?.name || '—'}
                    </p>
                    <button
                      onClick={() => handleDelete(tt._id)}
                      className="bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/30 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadTimetable;
