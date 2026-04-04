import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../../services/api';

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
      not_started: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-green-100 text-green-800',
      submitted: 'bg-green-100 text-green-800',
      evaluated: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/faculty/dashboard?tab=overview')}
        className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
      >
        ← Back to Dashboard
      </button>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">My Projects</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('')}
            className={`px-4 py-2 rounded-lg ${!filterStatus ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            All ({projects.length})
          </button>
          <button
            onClick={() => setFilterStatus('not_started')}
            className={`px-4 py-2 rounded-lg ${filterStatus === 'not_started' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Not Started
          </button>
          <button
            onClick={() => setFilterStatus('in_progress')}
            className={`px-4 py-2 rounded-lg ${filterStatus === 'in_progress' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilterStatus('submitted')}
            className={`px-4 py-2 rounded-lg ${filterStatus === 'submitted' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Submitted
          </button>
          <button
            onClick={() => setFilterStatus('evaluated')}
            className={`px-4 py-2 rounded-lg ${filterStatus === 'evaluated' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Evaluated
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(project => (
            <div key={project._id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{project.projectTitle}</h3>
                  <p className="text-gray-600 text-sm">Subject: {project.subject}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-xs text-gray-500">
                <div>
                  <p>Team Members</p>
                  <p className="text-gray-800 font-medium">{project.teamMembers?.length || 0}/{project.maxTeamSize}</p>
                </div>
                <div>
                  <p>Deadline</p>
                  <p className="text-gray-800 font-medium">{new Date(project.deadline).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mb-4 p-2 bg-gray-50 rounded text-xs">
                <p className="text-gray-600">
                  <strong>Class:</strong> {project.classroomId?.department} - Year {project.classroomId?.year}
                </p>
              </div>

              <button
                onClick={() => setSelectedProject(project)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm font-medium"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">{selectedProject.projectTitle}</h2>
            <p className="text-gray-600 mb-4">
              <strong>Subject:</strong> {selectedProject.subject}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-gray-800 font-medium">{getStatusLabel(selectedProject.status)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Max Team Size</p>
                <p className="text-gray-800 font-medium">{selectedProject.maxTeamSize}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Deadline</p>
                <p className="text-gray-800 font-medium">{new Date(selectedProject.deadline).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Team Members</p>
                <p className="text-gray-800 font-medium">{selectedProject.teamMembers?.length || 0}</p>
              </div>
            </div>

            {selectedProject.teamMembers && selectedProject.teamMembers.length > 0 && (
              <div className="mb-4 border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-2">Team Members</h4>
                <ul className="space-y-2">
                  {selectedProject.teamMembers.map((member, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-center">
                      <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                      {member}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => setSelectedProject(null)}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
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
