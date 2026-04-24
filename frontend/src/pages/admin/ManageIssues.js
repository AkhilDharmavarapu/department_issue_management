import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueAPI, userAPI } from '../../services/api';

const ManageIssues = ({ onBack, isReadOnly = false }) => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedIssueId, setExpandedIssueId] = useState(null);
  const [expandedIssueDetails, setExpandedIssueDetails] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [commentText, setCommentText] = useState({});
  const [users, setUsers] = useState([]);
  const [resolutionProof, setResolutionProof] = useState({});
  const [uploadingProof, setUploadingProof] = useState({});

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
      if (expandedIssueId === issueId) {
        const response = await issueAPI.getIssueById(issueId);
        setExpandedIssueDetails(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update issue');
    }
  };

  const handleAssign = async (issueId, userId) => {
    try {
      await issueAPI.updateIssueStatus(issueId, { assignedTo: userId || null });
      fetchIssues();
      if (expandedIssueId === issueId) {
        const response = await issueAPI.getIssueById(issueId);
        setExpandedIssueDetails(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign issue');
    }
  };

  const handleAddComment = async (issueId) => {
    if (!commentText[issueId]?.trim()) return;
    try {
      await issueAPI.addComment(issueId, { text: commentText[issueId] });
      setCommentText(prev => ({ ...prev, [issueId]: '' }));
      fetchIssues();
      const response = await issueAPI.getIssueById(issueId);
      setExpandedIssueDetails(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleUploadResolutionProof = async (issueId) => {
    if (!resolutionProof[issueId]) {
      setError('Please select a proof image');
      return;
    }

    setUploadingProof(prev => ({ ...prev, [issueId]: true }));
    try {
      const formData = new FormData();
      formData.append('proof', resolutionProof[issueId]);

      await issueAPI.uploadResolutionProof(issueId, formData);
      setResolutionProof(prev => ({ ...prev, [issueId]: null }));
      setError('');
      setSuccess('✅ Resolution proof uploaded successfully!');
      
      // Refresh issue details
      const response = await issueAPI.getIssueById(issueId);
      setExpandedIssueDetails(response.data.data);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload proof');
    } finally {
      setUploadingProof(prev => ({ ...prev, [issueId]: false }));
    }
  };

  const toggleExpandCard = async (issueId) => {
    if (expandedIssueId === issueId) {
      // Collapse the card
      setExpandedIssueId(null);
      setExpandedIssueDetails(null);
    } else {
      // Expand the card and fetch full details
      try {
        const response = await issueAPI.getIssueById(issueId);
        setExpandedIssueId(issueId);
        setExpandedIssueDetails(response.data.data);
      } catch (err) {
        setError('Failed to load issue details');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Open: 'bg-blue-100 text-blue-700 border border-blue-300',
      'In Progress': 'bg-amber-100 text-amber-700 border border-amber-300',
      Resolved: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Minor: 'bg-gray-100 text-gray-700 border border-gray-300',
      Normal: 'bg-blue-100 text-blue-700 border border-blue-300',
      Important: 'bg-orange-100 text-orange-700 border border-orange-300',
      Urgent: 'bg-red-100 text-red-700 border border-red-300',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBorderColor = (status) => {
    const colors = {
      Open: 'border-l-blue-500',
      'In Progress': 'border-l-amber-500',
      Resolved: 'border-l-emerald-500',
    };
    return colors[status] || 'border-l-gray-500';
  };

  const filterButtons = [
    { label: 'All Issues', value: '' },
    { label: 'Open', value: 'Open' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Resolved', value: 'Resolved' },
  ];

  return (
    <div className="p-8 bg-white min-h-screen">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
      >
        <span className="text-2xl">←</span>
        <span className="font-semibold">Back to Dashboard</span>
      </button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Issues</h1>
        <p className="text-gray-500 mb-6">Review, assign, and resolve reported issues</p>
        <div className="flex gap-2 flex-wrap">
          {filterButtons.map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilterStatus(btn.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                filterStatus === btn.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading issues...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
          <p className="text-gray-500 text-lg">No issues found</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-4">
          {issues.map(issue => (
            <div
              key={issue._id}
              className={`bg-white rounded-xl shadow-sm border-l-4 transition-all duration-300 ${getStatusBorderColor(issue.status)} ${
                expandedIssueId === issue._id ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-md border border-gray-200'
              }`}
            >
              {/* COLLAPSED VIEW - Always shown */}
              <div
                onClick={() => toggleExpandCard(issue._id)}
                className="p-6 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 mr-4">
                    <h3 className="text-lg font-semibold text-gray-900">{issue.title}</h3>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{issue.description}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(issue.status)}`}>
                      {issue.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs mb-4">
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="text-gray-700 capitalize font-medium">{issue.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Reported By</p>
                    <p className="text-gray-700 font-medium">{issue.reportedBy?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Classroom</p>
                    <p className="text-gray-700 font-medium">
                      {issue.classroomId?.department} {issue.classroomId?.year && `Y${issue.classroomId.year}`} {issue.classroomId?.section}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="text-gray-700 font-medium">{new Date(issue.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Expand indicator */}
                <div className="text-center text-gray-400 text-sm">
                  {expandedIssueId === issue._id ? '▼ Click to collapse' : '▶ Click to expand'}
                </div>
              </div>

              {/* EXPANDED VIEW - Details section */}
              {expandedIssueId === issue._id && expandedIssueDetails && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  {/* Full Description */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Full Description</h3>
                    <p className="text-gray-700 leading-relaxed">{expandedIssueDetails.description}</p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-gray-500 text-xs font-semibold mb-1">Reported By</p>
                      <p className="text-gray-900">{expandedIssueDetails.reportedBy?.name}</p>
                      <p className="text-gray-600 text-sm">{expandedIssueDetails.reportedBy?.email}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-xs font-semibold mb-1">Classroom</p>
                      <p className="text-gray-900">
                        {expandedIssueDetails.classroomId?.department} Year {expandedIssueDetails.classroomId?.year} Section {expandedIssueDetails.classroomId?.section}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-xs font-semibold mb-1">Created</p>
                      <p className="text-gray-700">{new Date(expandedIssueDetails.createdAt).toLocaleString()}</p>
                    </div>

                    {expandedIssueDetails.resolvedAt && (
                      <div>
                        <p className="text-gray-500 text-xs font-semibold mb-1">Resolved At</p>
                        <p className="text-emerald-600">{new Date(expandedIssueDetails.resolvedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {expandedIssueDetails.status === 'Open' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(issue._id, 'In Progress'); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                      >
                        → In Progress
                      </button>
                    )}
                    {expandedIssueDetails.status !== 'Resolved' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(issue._id, 'Resolved'); }}
                        className="bg-green-600 hover:bg-green-700 text-white border border-green-600 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                      >
                        ✓ Resolve
                      </button>
                    )}
                  </div>

                  {/* Assign To */}
                  <div className="mb-6">
                    <p className="text-gray-500 text-xs font-semibold mb-2">Assign To</p>
                    <select
                      value={expandedIssueDetails.assignedTo?._id || expandedIssueDetails.assignedTo || ''}
                      onChange={(e) => handleAssign(issue._id, e.target.value)}
                      disabled={isReadOnly}
                      className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                        isReadOnly
                          ? 'bg-gray-100 border border-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-white border border-gray-300 text-gray-900 focus:ring-blue-500'
                      }`}
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => (
                        <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>

                  {/* Proofs Section */}
                  <div className="border-t border-gray-300 pt-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📷 Proofs</h3>

                    {/* Report Proof */}
                    <div className="mb-4">
                      <p className="text-gray-500 text-xs font-semibold mb-2">Reported Proof (by Student)</p>
                      {expandedIssueDetails.reportProof ? (
                        <img 
                          src={`http://localhost:5000/${expandedIssueDetails.reportProof}`}
                          alt="Report proof"
                          className="w-full max-w-md rounded-lg border border-gray-300 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => window.open(`http://localhost:5000/${expandedIssueDetails.reportProof}`, '_blank')}
                        />
                      ) : (
                        <p className="text-gray-500 text-sm italic">No proof uploaded by student</p>
                      )}
                    </div>

                    {/* Resolution Proof */}
                    <div>
                      <p className="text-gray-500 text-xs font-semibold mb-2">Resolution Proof (by Admin/Faculty/HOD)</p>
                      {expandedIssueDetails.resolutionProof ? (
                        <img 
                          src={`http://localhost:5000/${expandedIssueDetails.resolutionProof}`}
                          alt="Resolution proof"
                          className="w-full max-w-md rounded-lg border border-gray-300 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => window.open(`http://localhost:5000/${expandedIssueDetails.resolutionProof}`, '_blank')}
                        />
                      ) : (
                        <>
                          <p className="text-gray-500 text-sm italic mb-3">No resolution proof uploaded yet</p>
                          {!isReadOnly && expandedIssueDetails.status === 'Resolved' && (
                            <div className="space-y-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setResolutionProof(prev => ({ ...prev, [issue._id]: e.target.files?.[0] || null }))}
                                className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none file:mr-3 file:py-1 file:bg-blue-600 file:text-white file:rounded file:border-0 file:cursor-pointer"
                              />
                              <button
                                onClick={() => handleUploadResolutionProof(issue._id)}
                                disabled={!resolutionProof[issue._id] || uploadingProof[issue._id]}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                              >
                                {uploadingProof[issue._id] ? '⏳ Uploading...' : '📤 Upload Proof'}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="border-t border-gray-300 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Comments ({expandedIssueDetails.comments?.length || 0})
                    </h3>

                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                      {expandedIssueDetails.comments && expandedIssueDetails.comments.length > 0 ? (
                        expandedIssueDetails.comments.map((c, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-blue-600 text-xs font-semibold mb-1">{c.user?.name || 'User'}</p>
                            <p className="text-gray-700 text-sm">{c.text}</p>
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
                        value={commentText[issue._id] || ''}
                        onChange={(e) => setCommentText(prev => ({ ...prev, [issue._id]: e.target.value }))}
                        placeholder="Add a comment..."
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(issue._id)}
                      />
                      <button
                        onClick={() => handleAddComment(issue._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all"
                      >
                        Send
                      </button>
                    </div>
                  </div>

                  {/* Collapse Button */}
                  <button
                    onClick={() => toggleExpandCard(issue._id)}
                    className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg transition-all font-semibold"
                  >
                    ▲ Collapse
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageIssues;
