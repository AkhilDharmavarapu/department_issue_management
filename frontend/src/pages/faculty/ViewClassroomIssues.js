import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueAPI } from '../../services/api';

const ViewClassroomIssues = ({ onBack }) => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchIssues();
  }, [filterStatus, filterPriority]);

  const fetchIssues = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;

      const response = await issueAPI.getMyIssues(params);
      setIssues(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      await issueAPI.addComment(selectedIssue._id, { text: comment });
      setComment('');
      fetchIssues();
      // Refresh selected issue
      const response = await issueAPI.getIssueById(selectedIssue._id);
      setSelectedIssue(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await issueAPI.updateIssueStatus(selectedIssue._id, { status: newStatus });
      fetchIssues();
      const response = await issueAPI.getIssueById(selectedIssue._id);
      setSelectedIssue(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
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

  const getStatusColor = (status) => {
    const colors = {
      Open: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'In Progress': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      Resolved: 'bg-green-500/20 text-green-300 border-green-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300';
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
      <button
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
      >
        ← Back to Dashboard
      </button>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Classroom Issues</h1>
        <p className="text-green-300/70">View and respond to issues from your students</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 mb-8 border border-green-500/20">
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-semibold text-green-300 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-green-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-green-300 mb-2">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-green-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Issues List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-green-300/70">Loading issues...</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center py-8 bg-slate-800 rounded-2xl border border-green-500/20">
              <p className="text-green-300/70">No issues found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map(issue => (
                <div
                  key={issue._id}
                  onClick={() => setSelectedIssue(issue)}
                  className={`bg-slate-800 rounded-xl shadow-lg p-6 border cursor-pointer transition-all duration-300 ${
                    selectedIssue?._id === issue._id
                      ? 'border-green-500 bg-slate-700'
                      : 'border-green-500/20 hover:border-green-500/50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className="text-lg font-bold text-white flex-1">{issue.title}</h3>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(issue.status)}`}>
                        {issue.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">{issue.description}</p>
                  <div className="flex justify-between text-xs text-green-300/70">
                    <span>{issue.reportedBy?.name}</span>
                    <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Issue Details */}
        {selectedIssue && (
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 border border-green-500/20 lg:col-span-1">
            <h2 className="text-2xl font-bold text-white mb-6">Issue Details</h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-green-300/70 text-xs font-semibold mb-2">Title</p>
                <p className="text-white font-medium">{selectedIssue.title}</p>
              </div>

              <div>
                <p className="text-green-300/70 text-xs font-semibold mb-2">Description</p>
                <p className="text-gray-300 text-sm">{selectedIssue.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-green-300/70 text-xs font-semibold mb-2">Status</p>
                  <select
                    value={selectedIssue.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-white text-sm font-semibold border ${getStatusColor(selectedIssue.status)}`}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <p className="text-green-300/70 text-xs font-semibold mb-2">Priority</p>
                  <p className={`px-3 py-2 rounded-lg text-sm font-semibold border text-center ${getPriorityColor(selectedIssue.priority)}`}>
                    {selectedIssue.priority}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-green-300/70 text-xs font-semibold mb-2">Reported By</p>
                <p className="text-white">{selectedIssue.reportedBy?.name}</p>
              </div>

              <div>
                <p className="text-green-300/70 text-xs font-semibold mb-2">Created</p>
                <p className="text-gray-300 text-sm">{new Date(selectedIssue.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t border-green-500/20 pt-4">
              <h3 className="text-lg font-bold text-white mb-4">Comments</h3>

              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {selectedIssue.comments && selectedIssue.comments.length > 0 ? (
                  selectedIssue.comments.map((c, idx) => (
                    <div key={idx} className="bg-slate-700 rounded-lg p-3">
                      <p className="text-green-300 text-xs font-semibold mb-1">{c.user?.name}</p>
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
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 bg-slate-700 border border-green-500/30 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  onClick={handleAddComment}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewClassroomIssues;
