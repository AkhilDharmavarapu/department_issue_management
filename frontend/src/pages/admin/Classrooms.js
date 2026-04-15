import React, { useState, useEffect } from 'react';
import { userAPI, classroomAPI } from '../../services/api';
import apiClient from '../../services/api';
import { Card } from '../../components/CardComponents';

// Course-specific specialization options
const COURSE_SPECIALIZATIONS = {
  BTech: ['Computer Science and Engineering'],
  MTech: [
    'Artificial Intelligence and Machine Learning',
    'Computer Science & Technology',
    'Computer Networks and Information Security',
  ],
};

const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const Classrooms = ({ onBack, isReadOnly = false }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [facultyUsers, setFacultyUsers] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const formRef = React.useRef(null);
  const [formData, setFormData] = useState({
    course: '',
    specialization: '',
    year: '',
    section: '',
    block: '',
    room: '',
    department: '',
    facultyList: [],
  });

  useEffect(() => {
    fetchClassrooms();
    fetchFacultyUsers();
  }, []);

  // When editing, scroll form into view
  useEffect(() => {
    if (showForm && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showForm]);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const response = await classroomAPI.getAllClassrooms();
      setClassrooms(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch classrooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyUsers = async () => {
    try {
      const response = await userAPI.getAllUsers({ role: 'faculty' });
      setFacultyUsers(response.data.data || []);
    } catch (err) {
      // silent
    }
  };

  const fetchAvailableRooms = async (block, classroomId = null) => {
    if (!block) {
      setAvailableRooms([]);
      return;
    }

    setLoadingRooms(true);
    try {
      // Normalize block name for comparison
      const normalizedBlock = block.trim();
      let url = `classrooms/available-rooms/${encodeURIComponent(normalizedBlock)}`;
      if (classroomId) {
        url += `?excludeClassroomId=${classroomId}`;
      }
      const response = await apiClient.get(url);
      const rooms = (response.data.data || []).filter(room => {
        // Double-check block matching with case-insensitive comparison
        return room.block?.toLowerCase() === normalizedBlock.toLowerCase();
      });
      setAvailableRooms(rooms);
    } catch (err) {
      console.error('Failed to fetch available rooms:', err);
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const getYearOptions = () => {
    if (formData.course === 'BTech') return [1, 2, 3, 4];
    if (formData.course === 'MTech') return [1, 2];
    return [];
  };

  const getSpecializationOptions = () => {
    return COURSE_SPECIALIZATIONS[formData.course] || [];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };

    // Handle course change
    if (name === 'course') {
      updatedData.year = ''; // Reset year
      updatedData.specialization = ''; // Reset specialization
      
      // Auto-assign specialization for BTech
      if (value === 'BTech') {
        updatedData.specialization = 'Computer Science and Engineering';
        updatedData.department = 'Computer Science and Engineering';
      }
    }

    // Auto-set department from specialization
    if (name === 'specialization') {
      updatedData.department = value || '';
    }

    // Convert section to uppercase and trim whitespace
    if (name === 'section') {
      updatedData.section = value.trim().toUpperCase();
    }

    // Reset room when block changes and fetch available rooms
    if (name === 'block') {
      updatedData.room = '';
      // Fetch available rooms for the selected block
      setTimeout(() => {
        fetchAvailableRooms(value, editingId);
      }, 0);
    }

    setFormData(updatedData);
    setSubmitError('');
  };

  const handleFacultyToggle = (facultyId) => {
    setFormData(prev => {
      const list = prev.facultyList.includes(facultyId)
        ? prev.facultyList.filter(id => id !== facultyId)
        : [...prev.facultyList, facultyId];
      return { ...prev, facultyList: list };
    });
  };

  const validateForm = () => {
    const { course, specialization, year, section, block, room } = formData;

    if (!course) {
      setSubmitError('Please select a course');
      return false;
    }
    if (!specialization) {
      setSubmitError('Please select a specialization');
      return false;
    }
    if (!year) {
      setSubmitError('Please select a year');
      return false;
    }
    if (!section || section.trim().length === 0) {
      setSubmitError('Please enter a section');
      return false;
    }
    if (!block) {
      setSubmitError('Please select a block');
      return false;
    }
    if (!room) {
      setSubmitError('Please select a room');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    try {
      const submitData = {
        course: formData.course,
        specialization: formData.specialization,
        year: parseInt(formData.year),
        section: formData.section,
        block: formData.block,
        room: formData.room,
        department: formData.department || formData.specialization,
        facultyList: formData.facultyList,
      };

      if (editingId) {
        await classroomAPI.updateClassroom(editingId, submitData);
      } else {
        await classroomAPI.createClassroom(submitData);
      }

      setFormData({
        course: '',
        specialization: '',
        year: '',
        section: '',
        block: '',
        room: '',
        department: '',
        facultyList: [],
      });
      setEditingId(null);
      setShowForm(false);
      setSubmitError('');
      fetchClassrooms();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to save classroom');
    }
  };

  const handleEdit = (classroom) => {
    // Properly prefill all form fields from existing classroom data
    // Handle room data - room can be an object with _id property
    const roomId = classroom.room?._id || classroom.room;
    const blockValue = classroom.block || (classroom.room?.block);
    
    const prefillData = {
      course: classroom.course || '',
      specialization: classroom.specialization || '',
      year: classroom.year ? classroom.year.toString() : '',
      section: classroom.section || '',
      block: blockValue || '',
      room: roomId || '',
      department: classroom.department || '',
      facultyList: (classroom.facultyList || []).map(f => (typeof f === 'object' ? f._id : f)),
    };
    
    setFormData(prefillData);
    setEditingId(classroom._id);
    setShowForm(true);
    setSubmitError('');
    
    // Fetch available rooms including the current room
    if (blockValue) {
      fetchAvailableRooms(blockValue, classroom._id);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this classroom?')) {
      try {
        await classroomAPI.deleteClassroom(id);
        fetchClassrooms();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete classroom');
      }
    }
  };

  const resetForm = () => {
    setShowForm(!showForm);
    setEditingId(null);
    setFormData({
      course: '',
      specialization: '',
      year: '',
      section: '',
      block: '',
      room: '',
      department: '',
      facultyList: [],
    });
    setSubmitError('');
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
          >
            <span>←</span>
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Classrooms</h1>
          <p className="text-gray-500">Create and manage classroom sections with structured academic format</p>
        </div>
        <button
          onClick={resetForm}
          disabled={isReadOnly}
          className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
            isReadOnly
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ Add Classroom'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Form Card */}
      {showForm && !isReadOnly && (
        <div ref={formRef} className="mb-8">
          <Card title={editingId ? 'Edit Classroom' : 'Create New Classroom'}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Course, Specialization, Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Course Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Course</option>
                  <option value="BTech">Bachelor of Technology (BTech)</option>
                  <option value="MTech">Master of Technology (MTech)</option>
                </select>
              </div>

              {/* Specialization - Dynamic based on Course */}
              {formData.course === 'MTech' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Specialization <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Specialization</option>
                    {getSpecializationOptions().map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Specialization - Auto-assigned for BTech */}
              {formData.course === 'BTech' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Specialization
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-50">
                    {formData.specialization || 'Computer Science and Engineering'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Automatically assigned for BTech</p>
                </div>
              )}
              
              {/* Placeholder when no course selected */}
              {!formData.course && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Specialization
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-400 bg-gray-50">
                    Select course first
                  </div>
                </div>
              )}

              {/* Year Dropdown - Dynamic */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  disabled={!formData.course}
                  className={`w-full px-3 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    !formData.course ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Year</option>
                  {getYearOptions().map(y => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </select>
                {!formData.course && (
                  <p className="text-xs text-gray-500 mt-1">Select course first</p>
                )}
              </div>
            </div>

            {/* Row 2: Section, Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Section Text Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Section <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  placeholder="e.g., A, B, C, A1, 4/6 CSE-2 A4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Automatically converted to uppercase and trimmed</p>
              </div>

              {/* Block Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Block <span className="text-red-500">*</span>
                </label>
                <select
                  name="block"
                  value={formData.block}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Block</option>
                  <option value="Main Block">Main Block</option>
                  <option value="Algorithm Block">Algorithm Block</option>
                </select>
              </div>
            </div>

            {/* Row 3: Room - Dependent on Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Room Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room <span className="text-red-500">*</span>
                </label>
                <select
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  disabled={!formData.block || loadingRooms}
                  className={`w-full px-3 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    !formData.block || loadingRooms ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'border-gray-300'
                  }`}
                >
                  <option value="">
                    {loadingRooms ? 'Loading rooms...' : 'Select Room'}
                  </option>
                  {availableRooms.map(room => (
                    <option key={room._id} value={room._id}>
                      Room {room.number}
                    </option>
                  ))}
                </select>
                {!formData.block && (
                  <p className="text-xs text-gray-500 mt-1">Select block first</p>
                )}
                {formData.block && availableRooms.length === 0 && !loadingRooms && (
                  <p className="text-xs text-red-500 mt-1">No available rooms in this block</p>
                )}
              </div>
            </div>

            {/* Faculty Assignment */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assign Faculty
              </label>
              {facultyUsers.length === 0 ? (
                <p className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">No faculty users found. Create faculty users first.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {facultyUsers.map(f => (
                    <label
                      key={f._id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer border transition-colors ${
                        formData.facultyList.includes(f._id)
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.facultyList.includes(f._id)}
                        onChange={() => handleFacultyToggle(f._id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm truncate">{f.name}</p>
                        <p className="text-xs text-gray-500 truncate">{f.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                ⚠️ {submitError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-colors"
            >
              {editingId ? '💾 Update Classroom' : '➕ Create Classroom'}
            </button>
          </form>
        </Card>
        </div>
      )}

      {/* Classrooms List */}
      <div className="mb-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-3 text-sm font-medium">Loading classrooms...</p>
            </div>
          </div>
        ) : classrooms.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-8">📭 No classrooms yet. Create one to get started!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map(classroom => (
              <Card key={classroom._id} className="hover:shadow-lg transition-shadow">
                {/* Main Section Display */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  {/* Section as Primary (Large Text) */}
                  <p className="text-4xl font-bold text-gray-900 mb-2">
                    {classroom.section || 'Not assigned'}
                  </p>
                  {/* Subtext: Year and Course */}
                  <p className="text-sm text-gray-600">
                    Year {classroom.year || 'N/A'} • {classroom.course || 'N/A'}
                  </p>
                </div>

                {/* Room Information */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Room</p>
                  {classroom.room ? (
                    <div>
                      <p className="text-lg font-bold text-blue-900">
                        {classroom.room?.number || classroom.room}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        {classroom.room?.block || classroom.block || 'Unknown block'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 italic">Room not assigned</p>
                  )}
                </div>

                {/* Course & Specialization Info */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Program</p>
                  <p className="text-sm font-medium text-gray-900">
                    {classroom.course && classroom.specialization
                      ? `${classroom.course} - ${classroom.specialization}`
                      : 'Not assigned'}
                  </p>
                </div>

                {/* Faculty Assignment */}
                {classroom.facultyList && classroom.facultyList.length > 0 ? (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      Faculty ({classroom.facultyList.length})
                    </p>
                    <div className="space-y-1.5">
                      {classroom.facultyList.map(f => (
                        <div
                          key={f._id || f}
                          className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50 rounded border border-blue-200"
                        >
                          <span className="text-sm font-medium text-blue-900">
                            {f.name || 'Faculty'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-2.5 bg-gray-50 rounded border border-gray-200">
                    <p className="text-xs text-gray-600 italic">No faculty assigned</p>
                  </div>
                )}

                {/* Actions */}
                {!isReadOnly && (
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleEdit(classroom)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2 px-3 rounded-lg text-sm border border-blue-200 transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(classroom._id)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-2 px-3 rounded-lg text-sm border border-red-200 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </Card>
            ))}}
          </div>
        )}
      </div>
    </div>
  );
};

export default Classrooms;
