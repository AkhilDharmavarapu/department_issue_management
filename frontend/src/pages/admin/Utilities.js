import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { utilityAPI } from '../../services/api';

const Utilities = () => {
  const navigate = useNavigate();
  const [utilities, setUtilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    utilityName: '',
    category: '',
    location: '',
    quantity: '',
    status: 'working',
  });

  useEffect(() => {
    fetchUtilities();
  }, [filterStatus]);

  const fetchUtilities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const response = await utilityAPI.getAllUtilities(params);
      setUtilities(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch utilities');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await utilityAPI.updateUtility(editingId, formData);
      } else {
        await utilityAPI.createUtility(formData);
      }
      setFormData({
        utilityName: '',
        category: '',
        location: '',
        quantity: '',
        status: 'working',
      });
      setEditingId(null);
      setShowForm(false);
      fetchUtilities();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save utility');
    }
  };

  const handleEdit = (utility) => {
    setFormData({
      utilityName: utility.utilityName,
      category: utility.category,
      location: utility.location,
      quantity: utility.quantity,
      status: utility.status,
    });
    setEditingId(utility._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await utilityAPI.deleteUtility(id);
        fetchUtilities();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      working: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      damaged: 'bg-red-500/20 text-red-300 border-red-500/30',
      maintenance: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  // Compute analytics
  const total = utilities.length;
  const workingCount = utilities.filter(u => u.status === 'working').length;
  const damagedCount = utilities.filter(u => u.status === 'damaged').length;
  const maintenanceCount = utilities.filter(u => u.status === 'maintenance').length;

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
      <button onClick={() => navigate('/admin/dashboard?tab=overview')} className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 mb-4 transition-colors">
        <span className="text-2xl">←</span>
        <span className="font-semibold">Back to Dashboard</span>
      </button>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">🔧 Utilities & Resources</h1>
          <p className="text-emerald-300/70">Track and manage all resources</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              utilityName: '',
              category: '',
              location: '',
              quantity: '',
              status: 'working',
            });
          }}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 whitespace-nowrap"
        >
          {showForm ? '✕ Cancel' : '+ Add Utility'}
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-600/50">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Total</p>
          <p className="text-3xl font-bold text-white">{total}</p>
        </div>
        <div className="bg-emerald-500/10 rounded-xl p-5 border border-emerald-400/30">
          <p className="text-emerald-300 text-xs font-semibold uppercase tracking-wide mb-2">Working</p>
          <p className="text-3xl font-bold text-emerald-400">{workingCount}</p>
        </div>
        <div className="bg-red-500/10 rounded-xl p-5 border border-red-400/30">
          <p className="text-red-300 text-xs font-semibold uppercase tracking-wide mb-2">Damaged</p>
          <p className="text-3xl font-bold text-red-400">{damagedCount}</p>
        </div>
        <div className="bg-yellow-500/10 rounded-xl p-5 border border-yellow-400/30">
          <p className="text-yellow-300 text-xs font-semibold uppercase tracking-wide mb-2">Maintenance</p>
          <p className="text-3xl font-bold text-yellow-400">{maintenanceCount}</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {[
          { label: 'All', value: '' },
          { label: 'Working', value: 'working' },
          { label: 'Damaged', value: 'damaged' },
          { label: 'Maintenance', value: 'maintenance' },
        ].map(btn => (
          <button
            key={btn.value}
            onClick={() => setFilterStatus(btn.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              filterStatus === btn.value
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700 border border-slate-600/30'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 mb-8 border border-emerald-500/20">
          <h2 className="text-2xl font-bold text-white mb-6">
            {editingId ? '✏️ Edit Utility' : '🆕 Add New Utility'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-emerald-300 mb-2">
                  Utility Name
                </label>
                <input
                  type="text"
                  name="utilityName"
                  value={formData.utilityName}
                  onChange={handleChange}
                  placeholder="e.g., Projector"
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-emerald-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-emerald-300 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-emerald-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                >
                  <option value="">Select Category</option>
                  <option value="furniture">Furniture</option>
                  <option value="equipment">Equipment</option>
                  <option value="facilities">Facilities</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-emerald-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Room 101"
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-emerald-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-emerald-300 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="0"
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-emerald-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-emerald-300 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700 border border-emerald-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              >
                <option value="working">Working</option>
                <option value="damaged">Damaged</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              {editingId ? '💾 Update Utility' : '➕ Add Utility'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-emerald-300 mt-4 font-semibold">Loading utilities...</p>
          </div>
        </div>
      ) : utilities.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 rounded-2xl border border-emerald-500/20">
          <p className="text-emerald-300/70 text-lg">No utilities found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {utilities.map(utility => (
            <div key={utility._id} className="bg-slate-800 rounded-xl shadow-lg hover:shadow-xl p-5 border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-3">{utility.utilityName}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-emerald-300/70 text-xs font-semibold">Category</p>
                      <p className="text-white font-medium capitalize">{utility.category}</p>
                    </div>
                    <div>
                      <p className="text-emerald-300/70 text-xs font-semibold">Location</p>
                      <p className="text-white font-medium">{utility.location}</p>
                    </div>
                    <div>
                      <p className="text-emerald-300/70 text-xs font-semibold">Quantity</p>
                      <p className="text-white font-medium">{utility.quantity}</p>
                    </div>
                    <div>
                      <p className="text-emerald-300/70 text-xs font-semibold">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border mt-1 ${getStatusColor(utility.status)}`}>
                        {utility.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(utility)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(utility._id)}
                    className="bg-red-600/80 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Utilities;
