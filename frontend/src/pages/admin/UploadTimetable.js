import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const UploadTimetable = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedClassroom, setSelectedClassroom] = useState('');

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
      formData.append('image', selectedFile);
      formData.append('classroomId', selectedClassroom);

      // Mock upload - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess('✅ Timetable uploaded successfully!');
      setSelectedFile(null);
      setSelectedClassroom('');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to upload timetable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
      <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate('/admin/dashboard?tab=overview')} className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 mb-4 transition-colors">
          <span className="text-2xl">←</span>
          <span className="font-semibold">Back to Dashboard</span>
        </button>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📅 Upload Timetable</h1>
          <p className="text-green-300/70">Upload classroom timetable images</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 text-green-300 rounded-xl">
            ❌ {error}
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
                Select Classroom
              </label>
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="w-full px-5 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              >
                <option value="">Choose a classroom...</option>
                <option value="cs1">Computer Science Y1 A</option>
                <option value="cs2">Computer Science Y2 A</option>
                <option value="ec1">Electronics Y1 A</option>
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
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-400 disabled:to-emerald-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Uploading...' : '🚀 Upload Timetable'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadTimetable;
