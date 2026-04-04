import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { labAPI } from '../../services/api';

const Labs = () => {
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
    <div className="p-6">
      <button onClick={() => navigate('/admin/dashboard?tab=overview')} className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-4 transition-colors font-semibold">
        <span className="text-xl">←</span>
        <span>Back to Dashboard</span>
      </button>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Laboratory Management</h1>
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
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          {showForm ? 'Cancel' : 'Add Lab'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Lab' : 'Create New Lab'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lab Name
                </label>
                <input
                  type="text"
                  name="labName"
                  value={formData.labName}
                  onChange={handleChange}
                  placeholder="e.g., Computer Lab 1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  placeholder="e.g., 201"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Systems
                </label>
                <input
                  type="number"
                  name="numberOfSystems"
                  value={formData.numberOfSystems}
                  onChange={handleChange}
                  placeholder="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 mb-3">Accessories</h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={accessoryInput.name}
                  onChange={(e) => setAccessoryInput({ ...accessoryInput, name: e.target.value })}
                  placeholder="Accessory name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="number"
                  value={accessoryInput.quantity}
                  onChange={(e) => setAccessoryInput({ ...accessoryInput, quantity: e.target.value })}
                  placeholder="Qty"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={handleAddAccessory}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Add
                </button>
              </div>

              {formData.accessories.length > 0 && (
                <div className="space-y-2">
                  {formData.accessories.map((acc, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <span>{acc.name} (Qty: {acc.quantity})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAccessory(idx)}
                        className="text-green-600 hover:text-green-800 text-sm"
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
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
            >
              {editingId ? 'Update' : 'Create'} Lab
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading labs...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {labs.map(lab => (
            <div key={lab._id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{lab.labName}</h3>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p><strong>Room:</strong> {lab.roomNumber}</p>
                <p><strong>Systems:</strong> {lab.numberOfSystems}</p>
                {lab.accessories && lab.accessories.length > 0 && (
                  <div>
                    <strong>Accessories:</strong>
                    <ul className="ml-4 mt-1">
                      {lab.accessories.map((acc, idx) => (
                        <li key={idx}>• {acc.name} ({acc.quantity})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(lab)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(lab._id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                >
                  Delete
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
