import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Classrooms from './admin/Classrooms';
import Utilities from './admin/Utilities';
import ManageIssues from './admin/ManageIssues';
import Labs from './admin/Labs';
import UploadTimetable from './admin/UploadTimetable';
import UserManagement from './admin/UserManagement';
import { statsAPI } from '../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (activeTab === 'overview') {
      statsAPI.getAdminStats()
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
    { id: 'classrooms', label: 'Classrooms', icon: '🏫' },
    { id: 'utilities', label: 'Utilities', icon: '🔧' },
    { id: 'labs', label: 'Labs', icon: '🖥️' },
    { id: 'issues', label: 'Manage Issues', icon: '⚠️' },
    { id: 'timetable', label: 'Timetable', icon: '📅' },
    { id: 'users', label: 'Users', icon: '👥' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6 shadow-2xl border-r border-green-500/20 overflow-y-auto flex-shrink-0">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-xl">👨‍💼</div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Admin</h1>
            </div>
            <p className="text-green-300/60 text-xs">Control Center</p>
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
                <h1 className="text-4xl font-bold text-white mb-3">Admin Dashboard</h1>
                <p className="text-gray-400 text-lg">Manage your institution's classrooms, labs, utilities & issues</p>
                <div className="h-1 w-24 bg-gradient-to-r from-green-500 to-emerald-500 mt-4 rounded-full"></div>
              </div>

              {/* Quick Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                  { id: 'classrooms', icon: '🏫', label: 'Classrooms', desc: 'Create & manage sections', color: 'from-green-600 to-green-700' },
                  { id: 'utilities', icon: '🔧', label: 'Utilities', desc: 'Track resources', color: 'from-emerald-600 to-emerald-700' },
                  { id: 'labs', icon: '🖥️', label: 'Labs', desc: 'Manage computer labs', color: 'from-green-500 to-green-600' },
                  { id: 'issues', icon: '⚠️', label: 'Issues', desc: 'Resolve reported problems', color: 'from-green-700 to-emerald-700' },
                ].map(card => (
                  <button
                    key={card.id}
                    onClick={() => setActiveTab(card.id)}
                    className={`bg-gradient-to-br ${card.color} rounded-xl p-8 shadow-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer border border-green-400/30 group text-left w-full`}
                  >
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{card.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-2">{card.label}</h3>
                    <p className="text-green-100 text-sm mb-4">{card.desc}</p>
                    <span className="text-green-100 font-medium text-sm">Manage →</span>
                  </button>
                ))}
              </div>

              {/* Stats */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-8 border border-slate-600/50 shadow-2xl mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">Quick Stats</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div className="bg-green-500/10 rounded-lg p-6 border border-green-400/30">
                    <p className="text-green-300 text-sm font-semibold uppercase tracking-wide mb-2">Classrooms</p>
                    <p className="text-4xl font-bold text-green-400">{stats?.totalClassrooms ?? '—'}</p>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-6 border border-blue-400/30">
                    <p className="text-blue-300 text-sm font-semibold uppercase tracking-wide mb-2">Open Issues</p>
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

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-600/50">
                  <p className="text-gray-400 text-sm font-semibold mb-2">Total Users</p>
                  <p className="text-3xl font-bold text-white">{stats?.totalUsers ?? '—'}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-600/50">
                  <p className="text-gray-400 text-sm font-semibold mb-2">Utilities</p>
                  <p className="text-3xl font-bold text-white">{stats?.totalUtilities ?? '—'}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-600/50">
                  <p className="text-gray-400 text-sm font-semibold mb-2">Labs</p>
                  <p className="text-3xl font-bold text-white">{stats?.totalLabs ?? '—'}</p>
                </div>
              </div>

              {/* Recent Issues */}
              {stats?.recentIssues?.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-8 border border-slate-600/50">
                  <h2 className="text-xl font-bold text-white mb-4">Recent Issues</h2>
                  <div className="space-y-3">
                    {stats.recentIssues.map(issue => (
                      <div key={issue._id} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-4">
                        <div>
                          <p className="text-white font-medium">{issue.title}</p>
                          <p className="text-gray-400 text-xs">{issue.reportedBy?.name} • {new Date(issue.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            issue.status === 'Open' ? 'bg-blue-500/20 text-blue-300' :
                            issue.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>{issue.status}</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            issue.priority === 'Critical' ? 'bg-red-500/20 text-red-300' :
                            issue.priority === 'High' ? 'bg-orange-500/20 text-orange-300' :
                            issue.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>{issue.priority}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Tools */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Other Tools</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[
                    { id: 'timetable', icon: '📅', label: 'Timetable', desc: 'Manage schedules' },
                    { id: 'users', icon: '👥', label: 'Users', desc: 'Manage accounts' },
                  ].map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTab(tool.id)}
                      className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg p-6 transition-all duration-200 text-left group w-full"
                    >
                      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{tool.icon}</div>
                      <h4 className="text-white font-semibold mb-1">{tool.label}</h4>
                      <p className="text-gray-400 text-sm">{tool.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'classrooms' && <Classrooms />}
          {activeTab === 'utilities' && <Utilities />}
          {activeTab === 'labs' && <Labs />}
          {activeTab === 'issues' && <ManageIssues />}
          {activeTab === 'timetable' && <UploadTimetable />}
          {activeTab === 'users' && <UserManagement />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
