import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../../services/api';

const ManageTeamMembers = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [rollNumbers, setRollNumbers] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await projectAPI.getMyProjects();
      setProjects(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeamMembers = async () => {
    if (!selectedProject || !rollNumbers.trim()) {
      setError('Please select a project and enter roll numbers');
      return;
    }

    const rolls = rollNumbers
      .split(',')
      .map(r => r.trim())
      .filter(r => r);

    if (rolls.length === 0) {
      setError('Please enter valid roll numbers');
      return;
    }

    try {
      await projectAPI.addTeamMembers(selectedProject._id, { teamMembers: rolls });
      setError('');
      setRollNumbers('');
      fetchProjects();
      setSelectedProject(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add team members');
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/faculty/dashboard?tab=overview')}
          className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Team Members</h1>

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
          <div className="grid grid-cols-1 gap-6">
            {projects.map(project => (
              <div key={project._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{project.projectTitle}</h3>
                    <p className="text-gray-600 text-sm">Subject: {project.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Team Members</p>
                    <p className="text-lg font-bold text-green-600">
                      {project.teamMembers?.length || 0}/{project.maxTeamSize}
                    </p>
                  </div>
                </div>

                {project.teamMembers && project.teamMembers.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium text-gray-700 mb-2">Current Members:</p>
                    <div className="flex flex-wrap gap-2">
                      {project.teamMembers.map((member, idx) => (
                        <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                          {member}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedProject(project);
                    setRollNumbers('');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Add Team Members
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Add Team Members to {selectedProject.projectTitle}
              </h2>

              <div className="mb-4 p-3 bg-green-50 rounded">
                <p className="text-sm text-green-800">
                  <strong>Max team size:</strong> {selectedProject.maxTeamSize}<br/>
                  <strong>Current members:</strong> {selectedProject.teamMembers?.length || 0}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roll Numbers (comma-separated)
                </label>
                <textarea
                  value={rollNumbers}
                  onChange={(e) => setRollNumbers(e.target.value)}
                  placeholder="e.g., CS001, CS002, CS003"
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter roll numbers separated by commas
                </p>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddTeamMembers}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Add Members
                </button>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTeamMembers;
