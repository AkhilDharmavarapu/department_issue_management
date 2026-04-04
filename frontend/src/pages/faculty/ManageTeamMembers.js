import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../../services/api';

const ManageTeamMembers = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [rollNumber, setRollNumber] = useState('');

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

  const handleAddTeamMember = async () => {
    if (!selectedProject || !rollNumber.trim()) {
      setError('Please select a project and enter a roll number');
      return;
    }

    try {
      await projectAPI.addTeamMember(selectedProject._id, { rollNumber: rollNumber.trim() });
      setError('');
      setSuccess(`Added ${rollNumber.trim()} successfully`);
      setRollNumber('');
      fetchProjects();
      // Refresh selected project
      const response = await projectAPI.getProjectById(selectedProject._id);
      setSelectedProject(response.data.data);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add team member');
    }
  };

  const formatClassroom = (c) =>
    c ? `${c.department} - Year ${c.year} - Section ${c.section}` : '—';

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/faculty/dashboard?tab=overview')}
          className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 mb-6 transition-colors"
        >
          <span className="text-2xl">←</span>
          <span className="font-semibold">Back to Dashboard</span>
        </button>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">👥 Manage Team Members</h1>
          <p className="text-green-300/70">Add students to your project teams</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 text-green-300 rounded-xl">
            ✅ {success}
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
            <p className="text-gray-500 text-sm mt-2">Create a project first to add team members</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {projects.map(project => (
              <div key={project._id} className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-green-500/20 hover:border-green-500/50 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{project.projectTitle}</h3>
                    <p className="text-green-300/70 text-sm">Subject: {project.subject}</p>
                    <p className="text-gray-500 text-xs mt-1">{formatClassroom(project.classroomId)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-300/70 text-xs font-semibold">Team Members</p>
                    <p className="text-2xl font-bold text-green-400">
                      {project.teamMembers?.length || 0}/{project.maxTeamSize}
                    </p>
                  </div>
                </div>

                {project.teamMembers && project.teamMembers.length > 0 && (
                  <div className="mb-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600/30">
                    <p className="text-xs font-semibold text-green-300/70 mb-2">Current Members:</p>
                    <div className="flex flex-wrap gap-2">
                      {project.teamMembers.map((member, idx) => (
                        <span key={idx} className="bg-green-600/20 text-green-300 px-3 py-1 rounded-full text-sm border border-green-500/30">
                          {member.rollNumber || member}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedProject(project);
                    setRollNumber('');
                    setError('');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all transform hover:scale-105"
                >
                  + Add Team Member
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedProject && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-green-500/20">
              <h2 className="text-2xl font-bold text-white mb-4">
                Add Team Member
              </h2>
              <p className="text-green-300/70 text-sm mb-4">{selectedProject.projectTitle}</p>

              <div className="mb-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600/30">
                <p className="text-sm text-green-300">
                  <strong>Max team size:</strong> {selectedProject.maxTeamSize}<br/>
                  <strong>Current members:</strong> {selectedProject.teamMembers?.length || 0}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-green-300 mb-2">
                  Roll Number
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g., CS2021001"
                  className="w-full px-4 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTeamMember()}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddTeamMember}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-all"
                >
                  Add Member
                </button>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-gray-300 px-4 py-3 rounded-lg font-semibold transition-all"
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
