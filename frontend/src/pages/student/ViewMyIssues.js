import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueAPI } from '../../services/api';

const ViewMyIssues = ({ onBack }) => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchIssues();
  }, [filterStatus]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const response = await issueAPI.getMyIssues(params);
      setIssues(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (issueId) => {
    if (!commentText.trim()) return;

    try {
      await issueAPI.addComment(issueId, { text: commentText });
      setCommentText('');
      fetchIssues();
      // Refresh selected issue
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
    { label: 'All', value: '' },
    { label: 'Open', value: 'Open' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Resolved', value: 'Resolved' },
  ];

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 mb-6 transition-colors"
      >
        <span className="text-2xl">←</span>
        <span className="font-semibold">Back to Dashboard</span>
      </button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">My Issues</h1>
        <p className="text-green-300/70 mb-6">Track and manage your reported issues</p>
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
              {btn.label}{btn.value === '' ? ` (${issues.length})` : ''}
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
          <div className="text-5xl mb-4">📋</div>
          <p className="text-green-300/70 text-lg">No issues found</p>
          <p className="text-gray-500 text-sm mt-2">Try reporting a new issue from the dashboard</p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map(issue => (
            <div
              key={issue._id}
              className={`bg-slate-800 rounded-xl shadow-lg p-6 border-l-4 transition-all duration-300 hover:shadow-xl ${getStatusBorderColor(issue.status)} border-r border-t border-b border-green-500/10 hover:border-green-500/30`}
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

              <div className="grid grid-cols-3 gap-4 mb-4 text-xs">
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="text-gray-300 capitalize font-medium">{issue.category}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="text-gray-300 font-medium">{new Date(issue.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Comments</p>
                  <p className="text-gray-300 font-medium">{issue.comments?.length || 0}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  issueAPI.getIssueById(issue._id).then(res => setSelectedIssue(res.data.data)).catch(() => setSelectedIssue(issue));
                }}
                className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
              >
                View Details & Add Comments →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-green-500/20">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-white">{selectedIssue.title}</h2>
              <button
                onClick={() => setSelectedIssue(null)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <p className="text-gray-300 mb-4">{selectedIssue.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-700 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Status</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(selectedIssue.status)}`}>
                  {selectedIssue.status}
                </span>
              </div>
              <div className="bg-slate-700 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Priority</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(selectedIssue.priority)}`}>
                  {selectedIssue.priority}
                </span>
              </div>
              <div className="bg-slate-700 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Category</p>
                <p className="text-gray-300 text-sm capitalize font-medium">{selectedIssue.category}</p>
              </div>
              <div className="bg-slate-700 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Created</p>
                <p className="text-gray-300 text-sm font-medium">{new Date(selectedIssue.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {selectedIssue.assignedTo && (
              <div className="bg-slate-700 rounded-lg p-3 mb-4">
                <p className="text-gray-500 text-xs mb-1">Assigned To</p>
                <p className="text-green-300 text-sm font-medium">{selectedIssue.assignedTo?.name || 'Assigned'}</p>
              </div>
            )}

            {/* Comments */}
            <div className="border-t border-green-500/20 pt-4">
              <h4 className="font-semibold text-white mb-3">Comments ({selectedIssue.comments?.length || 0})</h4>
              <div className="space-y-3 max-h-40 overflow-y-auto mb-4">
                {selectedIssue.comments && selectedIssue.comments.length > 0 ? (
                  selectedIssue.comments.map((comment, idx) => (
                    <div key={idx} className="bg-slate-700 p-3 rounded-lg text-sm">
                      <p className="font-medium text-green-300">{comment.user?.name || 'User'}</p>
                      <p className="text-gray-300">{comment.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(comment.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No comments yet</p>
                )}
              </div>

              {selectedIssue.status !== 'Resolved' && (
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
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedIssue(null)}
              className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-gray-300 px-4 py-2 rounded-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewMyIssues;
