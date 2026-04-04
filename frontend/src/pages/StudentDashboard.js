import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReportIssue from './student/ReportIssue';
import ViewMyIssues from './student/ViewMyIssues';
import { statsAPI } from '../services/api';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (activeTab === 'overview') {
      statsAPI.getStudentStats()
        .then(res => setStats(res.data.data))
        .catch(() => {});
    }
  }, [activeTab]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'report', label: 'Report Issue', icon: '🚨' },
    { id: 'issues', label: 'My Issues', icon: '📋' },
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

              <div id="student-stats" className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-8 border border-slate-600/50 shadow-2xl">
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
            </div>
          )}

          {activeTab === 'report' && <ReportIssue />}
          {activeTab === 'issues' && <ViewMyIssues />}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
