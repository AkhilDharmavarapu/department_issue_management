import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { labAPI } from '../../services/api';

const Labs = ({ onBack }) => {
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    labName: '',
    roomNumber: '',
    numberOfSystems: '',
    department: '',
    accessories: [],
  });
  const [accessoryInput, setAccessoryInput] = useState({ name: '', quantity: '' });

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    setLoading(true);
    try {
      const response = await labAPI.getAllLabs();
      setLabs(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch labs');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddAccessory = () => {
    if (accessoryInput.name.trim() && accessoryInput.quantity) {
      setFormData(prev => ({
        ...prev,
        accessories: [
          ...prev.accessories,
          { name: accessoryInput.name, quantity: parseInt(accessoryInput.quantity) }
        ]
      }));
      setAccessoryInput({ name: '', quantity: '' });
    }
  };

  const handleRemoveAccessory = (index) => {
    setFormData(prev => ({
      ...prev,
      accessories: prev.accessories.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await labAPI.updateLab(editingId, formData);
      } else {
        await labAPI.createLab(formData);
      }
      setFormData({
        labName: '',
        roomNumber: '',
        numberOfSystems: '',
        department: '',
        accessories: [],
      });
      setEditingId(null);
      setShowForm(false);
      fetchLabs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save lab');
    }
  };

  const handleEdit = (lab) => {
    setFormData({
      labName: lab.labName,
      roomNumber: lab.roomNumber,
      numberOfSystems: lab.numberOfSystems,
      department: lab.department || '',
      accessories: lab.accessories || [],
    });
    setEditingId(lab._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await labAPI.deleteLab(id);
        fetchLabs();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete');
      }
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 mb-4 transition-colors">
        <span className="text-2xl">←</span>
        <span className="font-semibold">Back to Dashboard</span>
      </button>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">🖥️ Laboratory Management</h1>
          <p className="text-green-300/70">Manage computer labs and equipment</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              labName: '',
              roomNumber: '',
              numberOfSystems: '',
              department: '',
              accessories: [],
            });
          }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          {showForm ? '✕ Cancel' : '+ Add Lab'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 mb-8 border border-green-500/20">
          <h2 className="text-2xl font-bold text-white mb-6">
            {editingId ? '✏️ Edit Lab' : '🆕 Create New Lab'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-green-300 mb-2">Lab Name</label>
                <input
                  type="text"
                  name="labName"
                  value={formData.labName}
                  onChange={handleChange}
                  placeholder="e.g., Computer Lab 1"
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-green-300 mb-2">Room Number</label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  placeholder="e.g., 201"
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-green-300 mb-2">Number of Systems</label>
                <input
                  type="number"
                  name="numberOfSystems"
                  value={formData.numberOfSystems}
                  onChange={handleChange}
                  placeholder="0"
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-green-300 mb-2">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science"
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-green-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>
            </div>

            <div className="border-t border-green-500/20 pt-4">
              <h3 className="font-semibold text-green-300 mb-3">Accessories</h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={accessoryInput.name}
                  onChange={(e) => setAccessoryInput({ ...accessoryInput, name: e.target.value })}
                  placeholder="Accessory name"
                  className="flex-1 px-3 py-2 bg-slate-700 border border-green-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="number"
                  value={accessoryInput.quantity}
                  onChange={(e) => setAccessoryInput({ ...accessoryInput, quantity: e.target.value })}
                  placeholder="Qty"
                  className="w-24 px-3 py-2 bg-slate-700 border border-green-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={handleAddAccessory}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  Add
                </button>
              </div>

              {formData.accessories.length > 0 && (
                <div className="space-y-2">
                  {formData.accessories.map((acc, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg border border-slate-600/30">
                      <span className="text-white">{acc.name} (Qty: {acc.quantity})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAccessory(idx)}
                        className="text-red-400 hover:text-red-300 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              {editingId ? '💾 Update Lab' : '➕ Create Lab'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-green-300 mt-4 font-semibold">Loading labs...</p>
        </div>
      ) : labs.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 rounded-2xl border border-green-500/20">
          <p className="text-green-300/70 text-lg">No labs found. Add one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {labs.map(lab => (
            <div key={lab._id} className="bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl p-6 border border-green-500/20 hover:border-green-500/50 transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-3">{lab.labName}</h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-green-300/70 text-xs font-semibold">Room</p>
                    <p className="text-white font-medium">{lab.roomNumber}</p>
                  </div>
                  <div>
                    <p className="text-green-300/70 text-xs font-semibold">Systems</p>
                    <p className="text-white font-medium">{lab.numberOfSystems}</p>
                  </div>
                  <div>
                    <p className="text-green-300/70 text-xs font-semibold">Department</p>
                    <p className="text-white font-medium">{lab.department || '—'}</p>
                  </div>
                </div>
                {lab.accessories && lab.accessories.length > 0 && (
                  <div className="mt-3">
                    <p className="text-green-300/70 text-xs font-semibold mb-2">Accessories</p>
                    <div className="flex flex-wrap gap-2">
                      {lab.accessories.map((acc, idx) => (
                        <span key={idx} className="bg-green-600/20 text-green-300 px-2 py-1 rounded text-xs border border-green-500/30">
                          {acc.name} ({acc.quantity})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(lab)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(lab._id)}
                  className="flex-1 bg-red-600/80 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Labs;
