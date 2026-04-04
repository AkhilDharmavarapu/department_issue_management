import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReportIssue from './student/ReportIssue';
import ViewMyIssues from './student/ViewMyIssues';
import { statsAPI, authAPI, timetableAPI } from '../services/api';

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [timetableLoading, setTimetableLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'overview') {
      statsAPI.getStudentStats()
        .then(res => setStats(res.data.data))
        .catch(() => {});
      // Fetch full user profile with populated classroom
      authAPI.getMe()
        .then(res => {
          setProfile(res.data.data);
          // If classroom assigned, fetch timetable
          if (res.data.data?.classroomId?._id) {
            fetchTimetable(res.data.data.classroomId._id);
          }
        })
        .catch(() => {});
    }
  }, [activeTab]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [location]);

  const fetchTimetable = async (classroomId) => {
    setTimetableLoading(true);
    try {
      const response = await timetableAPI.getTimetableByClassroom(classroomId);
      setTimetable(response.data.data);
    } catch (err) {
      setTimetable(null);
    } finally {
      setTimetableLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatClassroom = (c) =>
    c ? `${c.department} - Year ${c.year} - Section ${c.section}` : null;

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'report', label: 'Report Issue', icon: '🚨' },
    { id: 'issues', label: 'My Issues', icon: '📋' },
    { id: 'timetable', label: 'Timetable', icon: '📅' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6 shadow-2xl border-r border-green-500/20 overflow-y-auto flex-shrink-0">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-xl">🎓</div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Student</h1>
            </div>
            <p className="text-green-300/60 text-xs">Student Panel</p>
          </div>
          <nav className="space-y-2">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                    : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700 border border-slate-600/30'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="mt-8 pt-6 border-t border-slate-700">
            <button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
              <div className="mb-12">
                <h1 className="text-4xl font-bold text-white mb-3">Student Dashboard</h1>
                <p className="text-gray-400 text-lg">Report issues and track your submissions</p>
                <div className="h-1 w-24 bg-gradient-to-r from-green-500 to-emerald-500 mt-4 rounded-full"></div>
              </div>

              {/* Classroom Info Card */}
              <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-6 border border-green-500/30 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-600/30 rounded-xl flex items-center justify-center text-3xl">🏫</div>
                  <div>
                    <p className="text-green-300/70 text-xs font-semibold uppercase tracking-wide mb-1">Your Classroom</p>
                    <p className="text-white text-xl font-bold">
                      {profile?.classroomId ? formatClassroom(profile.classroomId) : 'No classroom assigned'}
                    </p>
                    {profile?.rollNumber && (
                      <p className="text-green-300/70 text-sm mt-1">Roll Number: {profile.rollNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <button
                  onClick={() => setActiveTab('report')}
                  className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-8 shadow-2xl transition-all duration-300 transform hover:scale-105 border border-green-400/30 group text-left w-full"
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🚨</div>
                  <h3 className="text-xl font-bold text-white mb-2">Report Issue</h3>
                  <p className="text-green-100 text-sm mb-4">Report a classroom problem</p>
                  <span className="text-green-100 font-medium text-sm">Report →</span>
                </button>
                <button
                  onClick={() => setActiveTab('issues')}
                  className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-8 shadow-2xl transition-all duration-300 transform hover:scale-105 border border-emerald-400/30 group text-left w-full"
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📋</div>
                  <h3 className="text-xl font-bold text-white mb-2">My Issues</h3>
                  <p className="text-emerald-100 text-sm mb-4">Track your reported issues</p>
                  <span className="text-emerald-100 font-medium text-sm">View →</span>
                </button>
              </div>

              <div id="student-stats" className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-8 border border-slate-600/50 shadow-2xl mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">Quick Stats</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div className="bg-green-500/10 rounded-lg p-6 border border-green-400/30">
                    <p className="text-green-300 text-sm font-semibold uppercase tracking-wide mb-2">Total Issues</p>
                    <p className="text-4xl font-bold text-green-400">{stats?.totalIssues ?? '—'}</p>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-6 border border-blue-400/30">
                    <p className="text-blue-300 text-sm font-semibold uppercase tracking-wide mb-2">Open</p>
                    <p className="text-4xl font-bold text-blue-400">{stats?.openIssues ?? '—'}</p>
                  </div>
                  <div className="bg-yellow-500/10 rounded-lg p-6 border border-yellow-400/30">
                    <p className="text-yellow-300 text-sm font-semibold uppercase tracking-wide mb-2">In Progress</p>
                    <p className="text-4xl font-bold text-yellow-400">{stats?.inProgressIssues ?? '—'}</p>
                  </div>
                  <div className="bg-emerald-500/10 rounded-lg p-6 border border-emerald-400/30">
                    <p className="text-emerald-300 text-sm font-semibold uppercase tracking-wide mb-2">Resolved</p>
                    <p className="text-4xl font-bold text-emerald-400">{stats?.resolvedIssues ?? '—'}</p>
                  </div>
                </div>
              </div>

              {/* Timetable Preview */}
              {profile?.classroomId && (
                <div className="bg-slate-800 rounded-xl p-8 border border-slate-600/50">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">📅 Your Timetable</h2>
                    <button
                      onClick={() => setActiveTab('timetable')}
                      className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                    >
                      View Full →
                    </button>
                  </div>
                  {timetableLoading ? (
                    <p className="text-green-300/70">Loading timetable...</p>
                  ) : timetable ? (
                    <img
                      src={`${API_BASE}${timetable.imageURL}`}
                      alt="Timetable"
                      className="w-full max-h-64 object-contain rounded-lg bg-slate-700"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <p className="text-gray-500">No timetable uploaded for your classroom yet</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'report' && <ReportIssue />}
          {activeTab === 'issues' && <ViewMyIssues />}
          {activeTab === 'timetable' && (
            <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">📅 My Timetable</h1>
                <p className="text-green-300/70">
                  {profile?.classroomId ? formatClassroom(profile.classroomId) : 'No classroom assigned'}
                </p>
              </div>
              {!profile?.classroomId ? (
                <div className="text-center py-12 bg-slate-800 rounded-2xl border border-green-500/20">
                  <p className="text-green-300/70 text-lg">You are not assigned to a classroom</p>
                </div>
              ) : timetableLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto"></div>
                  <p className="text-green-300 mt-4">Loading timetable...</p>
                </div>
              ) : timetable ? (
                <div className="bg-slate-800 rounded-2xl p-6 border border-green-500/20">
                  <img
                    src={`${API_BASE}${timetable.imageURL}`}
                    alt="Timetable"
                    className="w-full rounded-lg"
                    onError={(e) => { e.target.parentElement.innerHTML = '<p class="text-red-300 text-center py-8">Failed to load timetable image</p>'; }}
                  />
                  <p className="text-green-300/70 text-xs mt-4 text-center">
                    Uploaded {new Date(timetable.uploadedAt || timetable.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-800 rounded-2xl border border-green-500/20">
                  <div className="text-5xl mb-4">📅</div>
                  <p className="text-green-300/70 text-lg">No timetable uploaded for your classroom yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
