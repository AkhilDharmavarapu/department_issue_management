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
      Minor: 'bg-green-100 text-green-800 border-green-300',
      Normal: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Important: 'bg-orange-100 text-orange-800 border-orange-300',
      Urgent: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusColor = (status) => {
    const colors = {
      Open: 'bg-blue-100 text-blue-800 border-blue-300',
      'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Resolved: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <button
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium flex items-center gap-2 border border-gray-300 text-sm shadow-sm hover:shadow-md transition-colors"
      >
        ← Back to Dashboard
      </button>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Classroom Issues</h1>
        <p className="text-gray-600">View and respond to issues from your students</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Issues</h3>
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priority</option>
              <option value="Minor">Minor</option>
              <option value="Normal">Normal</option>
              <option value="Important">Important</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No issues found</p>
          </div>
        ) : (
          issues.map(issue => (
            <div
              key={issue._id}
              className={`bg-white rounded-lg border shadow-sm transition-all duration-300 ${
                selectedIssue?._id === issue._id
                  ? 'border-blue-500 shadow-md'
                  : 'border-gray-200 hover:shadow-md'
              }`}
            >
              {/* Card Header - Always Visible */}
              <div
                onClick={() => setSelectedIssue(selectedIssue?._id === issue._id ? null : issue)}
                className="p-6 cursor-pointer"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{issue.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{issue.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500 gap-2">
                      <span className="truncate">{issue.reportedBy?.name}</span>
                      <span className="whitespace-nowrap">{new Date(issue.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getStatusColor(issue.status)}`}>
                      {issue.status}
                    </span>
                  </div>
                </div>
                {selectedIssue?._id === issue._id && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
                    <span>Click to collapse</span>
                    <span>▼</span>
                  </div>
                )}
              </div>

              {/* Expandable Content */}
              {selectedIssue?._id === issue._id && (
                <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-6">
                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700 text-sm">{issue.description}</p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-gray-200">
                    <div>
                      <p className="text-gray-700 text-xs font-semibold mb-2">Status</p>
                      <select
                        value={issue.status}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-semibold border ${getStatusColor(issue.status)}`}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-gray-700 text-xs font-semibold mb-2">Priority</p>
                      <p className={`px-3 py-2 rounded-lg text-sm font-semibold border text-center ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </p>
                    </div>
                  </div>

                  {/* Reported By & Created */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-gray-200">
                    <div>
                      <p className="text-gray-700 text-xs font-semibold mb-1">Reported By</p>
                      <p className="text-gray-900 text-sm">{issue.reportedBy?.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-700 text-xs font-semibold mb-1">Created</p>
                      <p className="text-gray-900 text-sm">{new Date(issue.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Proofs Section */}
                  <div className="pb-6 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">📷 Proofs</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-600 text-xs mb-2">Student's Proof</p>
                        {issue.reportProof ? (
                          <img 
                            src={`http://localhost:5000/${issue.reportProof}`}
                            alt="Report proof"
                            className="w-full max-h-40 object-cover rounded-lg border border-gray-300 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => window.open(`http://localhost:5000/${issue.reportProof}`, '_blank')}
                          />
                        ) : (
                          <p className="text-gray-400 text-sm italic">No proof uploaded</p>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs mb-2">Resolution Proof</p>
                        {issue.resolutionProof ? (
                          <img 
                            src={`http://localhost:5000/${issue.resolutionProof}`}
                            alt="Resolution proof"
                            className="w-full max-h-40 object-cover rounded-lg border border-gray-300 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => window.open(`http://localhost:5000/${issue.resolutionProof}`, '_blank')}
                          />
                        ) : (
                          <p className="text-gray-400 text-sm italic">Not yet uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Comments ({issue.comments?.length || 0})</h4>

                    <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                      {issue.comments && issue.comments.length > 0 ? (
                        issue.comments.map((c, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-blue-600 text-xs font-semibold mb-1">{c.user?.name}</p>
                            <p className="text-gray-700 text-sm">{c.text}</p>
                            <p className="text-gray-500 text-xs mt-1">{new Date(c.createdAt).toLocaleString()}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm">No comments yet</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      />
                      <button
                        onClick={handleAddComment}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all"
                      >
                        Send
                      </button>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => setSelectedIssue(null)}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ViewClassroomIssues;
