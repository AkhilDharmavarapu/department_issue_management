import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueAPI, userAPI } from '../../services/api';

const ManageIssues = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [commentText, setCommentText] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchIssues();
    fetchUsers();
  }, [filterStatus]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const response = await issueAPI.getAllIssues(params);
      setIssues(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAllUsers({ role: 'faculty' });
      setUsers(response.data.data || []);
    } catch (_) {}
  };

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      await issueAPI.updateIssueStatus(issueId, { status: newStatus });
      fetchIssues();
      if (selectedIssue?._id === issueId) {
        const response = await issueAPI.getIssueById(issueId);
        setSelectedIssue(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update issue');
    }
  };

  const handleAssign = async (issueId, userId) => {
    try {
      await issueAPI.updateIssueStatus(issueId, { assignedTo: userId || null });
      fetchIssues();
      if (selectedIssue?._id === issueId) {
        const response = await issueAPI.getIssueById(issueId);
        setSelectedIssue(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign issue');
    }
  };

  const handleAddComment = async (issueId) => {
    if (!commentText.trim()) return;
    try {
      await issueAPI.addComment(issueId, { text: commentText });
      setCommentText('');
      fetchIssues();
      const response = await issueAPI.getIssueById(issueId);
      setSelectedIssue(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Open: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'In Progress': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      Resolved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'bg-green-500/20 text-green-300 border-green-500/30',
      Medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      High: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      Critical: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return colors[priority] || 'bg-gray-500/20 text-gray-300';
  };

  const getStatusBorderColor = (status) => {
    const colors = {
      Open: 'border-blue-500',
      'In Progress': 'border-yellow-500',
      Resolved: 'border-emerald-500',
    };
    return colors[status] || 'border-slate-500';
  };

  const filterButtons = [
    { label: 'All Issues', value: '' },
    { label: 'Open', value: 'Open' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Resolved', value: 'Resolved' },
  ];

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
      <button
        onClick={() => navigate('/admin/dashboard?tab=overview')}
        className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 mb-6 transition-colors"
      >
        <span className="text-2xl">←</span>
        <span className="font-semibold">Back to Dashboard</span>
      </button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Manage Issues</h1>
        <p className="text-green-300/70 mb-6">Review, assign, and resolve reported issues</p>
        <div className="flex gap-2 flex-wrap">
          {filterButtons.map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilterStatus(btn.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                filterStatus === btn.value
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700 border border-slate-600/30'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-green-300/70">Loading issues...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-12 bg-slate-800 rounded-2xl border border-green-500/20">
          <p className="text-green-300/70 text-lg">No issues found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Issues List */}
          <div className="lg:col-span-2 space-y-4">
            {issues.map(issue => (
              <div
                key={issue._id}
                onClick={() => {
                  // Fetch full issue details (with comments populated)
                  issueAPI.getIssueById(issue._id).then(res => setSelectedIssue(res.data.data)).catch(() => setSelectedIssue(issue));
                }}
                className={`bg-slate-800 rounded-xl shadow-lg p-6 border-l-4 cursor-pointer transition-all duration-300 ${getStatusBorderColor(issue.status)} ${
                  selectedIssue?._id === issue._id ? 'ring-2 ring-green-500/50 bg-slate-700' : 'hover:bg-slate-750 border-r border-t border-b border-green-500/10 hover:border-green-500/30'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 mr-4">
                    <h3 className="text-lg font-semibold text-white">{issue.title}</h3>
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{issue.description}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(issue.status)}`}>
                      {issue.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-xs">
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="text-gray-300 capitalize font-medium">{issue.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Reported By</p>
                    <p className="text-gray-300 font-medium">{issue.reportedBy?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Classroom</p>
                    <p className="text-gray-300 font-medium">
                      {issue.classroomId?.department} {issue.classroomId?.year && `Y${issue.classroomId.year}`} {issue.classroomId?.section}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="text-gray-300 font-medium">{new Date(issue.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Inline status buttons */}
                <div className="flex gap-2 mt-4">
                  {issue.status === 'Open' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(issue._id, 'In Progress'); }}
                      className="bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-300 border border-yellow-500/30 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                    >
                      → In Progress
                    </button>
                  )}
                  {issue.status !== 'Resolved' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(issue._id, 'Resolved'); }}
                      className="bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                    >
                      ✓ Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Issue Detail Panel */}
          {selectedIssue && (
            <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 border border-green-500/20 lg:col-span-1 sticky top-8 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Issue Details</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-green-300/70 text-xs font-semibold mb-1">Title</p>
                  <p className="text-white font-medium">{selectedIssue.title}</p>
                </div>

                <div>
                  <p className="text-green-300/70 text-xs font-semibold mb-1">Description</p>
                  <p className="text-gray-300 text-sm">{selectedIssue.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-green-300/70 text-xs font-semibold mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedIssue.status)}`}>
                      {selectedIssue.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-green-300/70 text-xs font-semibold mb-1">Priority</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(selectedIssue.priority)}`}>
                      {selectedIssue.priority}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-green-300/70 text-xs font-semibold mb-1">Reported By</p>
                  <p className="text-white text-sm">{selectedIssue.reportedBy?.name} ({selectedIssue.reportedBy?.email})</p>
                </div>

                <div>
                  <p className="text-green-300/70 text-xs font-semibold mb-1">Classroom</p>
                  <p className="text-white text-sm">
                    {selectedIssue.classroomId?.department} Year {selectedIssue.classroomId?.year} Section {selectedIssue.classroomId?.section}
                  </p>
                </div>

                <div>
                  <p className="text-green-300/70 text-xs font-semibold mb-1">Created</p>
                  <p className="text-gray-300 text-sm">{new Date(selectedIssue.createdAt).toLocaleString()}</p>
                </div>

                {selectedIssue.resolvedAt && (
                  <div>
                    <p className="text-green-300/70 text-xs font-semibold mb-1">Resolved At</p>
                    <p className="text-emerald-300 text-sm">{new Date(selectedIssue.resolvedAt).toLocaleString()}</p>
                  </div>
                )}

                {/* Assign To */}
                <div>
                  <p className="text-green-300/70 text-xs font-semibold mb-2">Assign To</p>
                  <select
                    value={selectedIssue.assignedTo?._id || selectedIssue.assignedTo || ''}
                    onChange={(e) => handleAssign(selectedIssue._id, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-green-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Comments Section */}
              <div className="border-t border-green-500/20 pt-4">
                <h3 className="text-lg font-bold text-white mb-4">
                  Comments ({selectedIssue.comments?.length || 0})
                </h3>

                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {selectedIssue.comments && selectedIssue.comments.length > 0 ? (
                    selectedIssue.comments.map((c, idx) => (
                      <div key={idx} className="bg-slate-700 rounded-lg p-3">
                        <p className="text-green-300 text-xs font-semibold mb-1">{c.user?.name || 'User'}</p>
                        <p className="text-gray-300 text-sm">{c.text}</p>
                        <p className="text-gray-500 text-xs mt-1">{new Date(c.createdAt).toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No comments yet</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 bg-slate-700 border border-green-500/30 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(selectedIssue._id)}
                  />
                  <button
                    onClick={() => handleAddComment(selectedIssue._id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105"
                  >
                    Send
                  </button>
                </div>
              </div>

              <button
                onClick={() => setSelectedIssue(null)}
                className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-gray-300 px-4 py-2 rounded-lg transition-all"
              >
                Close Panel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageIssues;
