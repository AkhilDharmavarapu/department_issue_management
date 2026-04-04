import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../../services/api';

const formatClassroom = (c) =>
  c ? `${c.department} - Year ${c.year} - Section ${c.section}` : '—';

const ViewMyProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, [filterStatus]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await projectAPI.getMyProjects();
      let filtered = response.data.data;
      
      if (filterStatus) {
        filtered = filtered.filter(p => p.status === filterStatus);
      }
      
      setProjects(filtered);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      not_started: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      in_progress: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      submitted: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      evaluated: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getStatusLabel = (status) => {
    const labels = {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      submitted: 'Submitted',
      evaluated: 'Evaluated',
    };
    return labels[status] || status;
  };

  const filterButtons = [
    { label: 'All', value: '' },
    { label: 'Not Started', value: 'not_started' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Evaluated', value: 'evaluated' },
  ];

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
      <button
        onClick={() => navigate('/faculty/dashboard?tab=overview')}
        className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 mb-6 transition-colors"
      >
        <span className="text-2xl">←</span>
        <span className="font-semibold">Back to Dashboard</span>
      </button>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">📋 My Projects</h1>
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
          <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-green-300 mt-4">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-slate-800 rounded-2xl border border-green-500/20">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-green-300/70 text-lg">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(project => (
            <div key={project._id} className="bg-slate-800 rounded-2xl shadow-lg p-6 border-l-4 border-green-500 border-r border-t border-b border-r-green-500/10 border-t-green-500/10 border-b-green-500/10 hover:border-r-green-500/30 hover:border-t-green-500/30 hover:border-b-green-500/30 transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{project.projectTitle}</h3>
                  <p className="text-green-300/70 text-sm">Subject: {project.subject}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusColor(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                <div>
                  <p className="text-green-300/70">Team Members</p>
                  <p className="text-white font-medium">{project.teamMembers?.length || 0}/{project.maxTeamSize}</p>
                </div>
                <div>
                  <p className="text-green-300/70">Deadline</p>
                  <p className="text-white font-medium">{new Date(project.deadline).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mb-4 p-2 bg-slate-700/50 rounded-lg border border-slate-600/30 text-xs">
                <p className="text-green-300/70">
                  <strong>Class:</strong> {formatClassroom(project.classroomId)}
                </p>
              </div>

              <button
                onClick={() => setSelectedProject(project)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-all transform hover:scale-105"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-green-500/20">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-white">{selectedProject.projectTitle}</h2>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <p className="text-green-300/70 mb-4">
              <strong>Subject:</strong> {selectedProject.subject}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600/30">
              <div>
                <p className="text-green-300/70 text-xs">Status</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border mt-1 ${getStatusColor(selectedProject.status)}`}>
                  {getStatusLabel(selectedProject.status)}
                </span>
              </div>
              <div>
                <p className="text-green-300/70 text-xs">Max Team Size</p>
                <p className="text-white font-medium">{selectedProject.maxTeamSize}</p>
              </div>
              <div>
                <p className="text-green-300/70 text-xs">Deadline</p>
                <p className="text-white font-medium">{new Date(selectedProject.deadline).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-green-300/70 text-xs">Classroom</p>
                <p className="text-white font-medium text-sm">{formatClassroom(selectedProject.classroomId)}</p>
              </div>
            </div>

            {selectedProject.teamMembers && selectedProject.teamMembers.length > 0 && (
              <div className="mb-4 border-t border-green-500/20 pt-4">
                <h4 className="font-semibold text-white mb-2">Team Members ({selectedProject.teamMembers.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.teamMembers.map((member, idx) => (
                    <span key={idx} className="bg-green-600/20 text-green-300 px-3 py-1 rounded-full text-sm border border-green-500/30 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      {member.rollNumber || member}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedProject(null)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-gray-300 px-4 py-2 rounded-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewMyProjects;
