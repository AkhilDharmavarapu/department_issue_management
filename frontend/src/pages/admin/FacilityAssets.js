import React, { useState, useEffect, useMemo } from 'react';
import { assetAPI } from '../../services/api';

// ──── Constants ────

const ASSET_TYPES = [
  'Bench', 'Fan', 'LED Board', 'Projector', 'AC',
  'Whiteboard', 'Smart Board', 'Computer', 'Chair', 'Desk',
  'Speaker', 'CCTV', 'Router', 'Printer', 'UPS', 'Other',
];

const BLOCKS = ['Department', 'Algorithm'];

const INITIAL_FORM = {
  type: '',
  block: '',
  room: '',
  total: '',
};

// ──── Component ────

const FacilityAssets = ({ onBack, isReadOnly = false }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...INITIAL_FORM });

  // ──── Filters (drives both analytics and list) ────
  const [filterType, setFilterType] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [filterRoom, setFilterRoom] = useState('');

  // Fetch all assets (backend filters by block; type/room filtered client-side for instant UX)
  useEffect(() => {
    fetchAssets();
  }, [filterBlock]);

  // Reset room filter when block changes (rooms are block-dependent)
  useEffect(() => {
    setFilterRoom('');
  }, [filterBlock]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterBlock) params.block = filterBlock;
      const response = await assetAPI.getAllAssets(params);
      setAssets(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  // ──── Derived: Available rooms from current data ────
  const availableRooms = useMemo(() => {
    const rooms = new Set();
    assets.forEach(a => rooms.add(a.room));
    return Array.from(rooms).sort();
  }, [assets]);

  // ──── Derived: Filtered assets (type + room applied client-side) ────
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      if (filterType && a.type !== filterType) return false;
      if (filterRoom && a.room !== filterRoom) return false;
      return true;
    });
  }, [assets, filterType, filterRoom]);

  // ──── Derived: Context-driven analytics ────
  const analytics = useMemo(() => {
    const totalCount = filteredAssets.reduce((sum, a) => sum + a.total, 0);
    const damagedCount = filteredAssets.reduce((sum, a) => sum + (a.damaged || 0), 0);
    const maintenanceCount = filteredAssets.reduce((sum, a) => sum + (a.maintenance || 0), 0);
    const workingCount = totalCount - damagedCount - maintenanceCount;

    // Build scope label
    const scopeParts = [];
    scopeParts.push(filterType || 'All Asset Types');
    scopeParts.push(filterBlock ? `${filterBlock} Block` : 'All Blocks');
    scopeParts.push(filterRoom ? `Room ${filterRoom}` : 'All Rooms');
    const scopeLabel = scopeParts.join('  ·  ');

    return { totalCount, damagedCount, maintenanceCount, workingCount, scopeLabel };
  }, [filteredAssets, filterType, filterBlock, filterRoom]);

  // ──── Group filtered assets: block → room → assets ────
  const groupedAssets = useMemo(() => {
    return filteredAssets.reduce((acc, asset) => {
      const blockKey = asset.block;
      const roomKey = asset.room;
      if (!acc[blockKey]) acc[blockKey] = {};
      if (!acc[blockKey][roomKey]) acc[blockKey][roomKey] = [];
      acc[blockKey][roomKey].push(asset);
      return acc;
    }, {});
  }, [filteredAssets]);

  // ──── Form handlers ────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await assetAPI.updateAsset(editingId, {
          ...formData,
          total: Number(formData.total),
        });
        setSuccess('Asset updated successfully');
      } else {
        await assetAPI.createAsset({
          ...formData,
          total: Number(formData.total),
        });
        setSuccess('Asset created successfully');
      }
      setFormData({ ...INITIAL_FORM });
      setEditingId(null);
      setShowForm(false);
      fetchAssets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save asset');
    }
  };

  const handleEdit = (asset) => {
    setFormData({
      type: asset.type,
      block: asset.block,
      room: asset.room,
      total: asset.total,
    });
    setEditingId(asset._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await assetAPI.deleteAsset(id);
      fetchAssets();
      setSuccess('Asset deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete asset');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ ...INITIAL_FORM });
  };

  const clearAllFilters = () => {
    setFilterType('');
    setFilterBlock('');
    setFilterRoom('');
  };

  const hasActiveFilter = filterType || filterBlock || filterRoom;

  // ──── Shared styles ────

  const selectClass =
    'px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition min-w-[140px]';
  const inputClass =
    'w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition';
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-2';

  // ──── Status bar helper ────

  const StatusBar = ({ total, damaged, maintenance }) => {
    const working = total - damaged - maintenance;
    const workingPct = total > 0 ? (working / total) * 100 : 0;
    const damagedPct = total > 0 ? (damaged / total) * 100 : 0;
    const maintPct = total > 0 ? (maintenance / total) * 100 : 0;

    return (
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
        {workingPct > 0 && (
          <div className="bg-emerald-500 h-full" style={{ width: `${workingPct}%` }} />
        )}
        {damagedPct > 0 && (
          <div className="bg-red-500 h-full" style={{ width: `${damagedPct}%` }} />
        )}
        {maintPct > 0 && (
          <div className="bg-amber-500 h-full" style={{ width: `${maintPct}%` }} />
        )}
      </div>
    );
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      {/* Header */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
      >
        <span className="text-2xl">←</span>
        <span className="font-semibold">Back to Dashboard</span>
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Facility Assets</h1>
          <p className="text-gray-500 text-sm">Track assets by type, block, and room</p>
        </div>
        {!isReadOnly && (
          <button
            onClick={showForm ? cancelForm : () => setShowForm(true)}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
              showForm
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
            }`}
          >
            {showForm ? '✕ Cancel' : '+ Add Asset'}
          </button>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
          ✅ {success}
        </div>
      )}

      {/* ═══════ Filter Bar ═══════ */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">Filter Assets</h3>
          {hasActiveFilter && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All Filters
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-4">
          {/* Asset Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Asset Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={selectClass}
            >
              <option value="">All Types</option>
              {ASSET_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Block */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Block</label>
            <select
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
              className={selectClass}
            >
              <option value="">All Blocks</option>
              {BLOCKS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Room */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Room</label>
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className={selectClass}
            >
              <option value="">All Rooms</option>
              {availableRooms.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ═══════ Context-Driven Analytics ═══════ */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        {/* Scope Label */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Analytics for: <span className="text-gray-800 normal-case">{analytics.scopeLabel}</span>
          </p>
          <span className="text-xs text-gray-400">
            {filteredAssets.length} asset record{filteredAssets.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredAssets.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-2">No assets match the current filters.</p>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalCount}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <p className="text-emerald-700 text-xs font-semibold uppercase tracking-wide mb-1">Working</p>
                <p className="text-2xl font-bold text-emerald-600">{analytics.workingCount}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-red-700 text-xs font-semibold uppercase tracking-wide mb-1">Damaged</p>
                <p className="text-2xl font-bold text-red-600">{analytics.damagedCount}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-amber-700 text-xs font-semibold uppercase tracking-wide mb-1">Maintenance</p>
                <p className="text-2xl font-bold text-amber-600">{analytics.maintenanceCount}</p>
              </div>
            </div>

            {/* Combined Status Bar */}
            <StatusBar
              total={analytics.totalCount}
              damaged={analytics.damagedCount}
              maintenance={analytics.maintenanceCount}
            />
            <div className="flex justify-between mt-1 text-xs text-gray-400">
              <span>{analytics.totalCount > 0 ? Math.round((analytics.workingCount / analytics.totalCount) * 100) : 0}% working</span>
              <span>{analytics.totalCount > 0 ? Math.round((analytics.damagedCount / analytics.totalCount) * 100) : 0}% damaged</span>
            </div>
          </>
        )}
      </div>

      {/* ═══════ Create / Edit Form ═══════ */}
      {showForm && !isReadOnly && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-5">
            {editingId ? 'Edit Asset' : 'Add New Asset'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Asset Type */}
              <div>
                <label className={labelClass}>Asset Type <span className="text-red-500">*</span></label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">Select Type</option>
                  {ASSET_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Block */}
              <div>
                <label className={labelClass}>Block <span className="text-red-500">*</span></label>
                <select
                  name="block"
                  value={formData.block}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">Select Block</option>
                  {BLOCKS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Room */}
              <div>
                <label className={labelClass}>Room <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  placeholder="e.g. A01"
                  required
                  className={inputClass}
                />
              </div>

              {/* Total Count */}
              <div>
                <label className={labelClass}>Total Count <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="total"
                  value={formData.total}
                  onChange={handleChange}
                  placeholder="e.g. 30"
                  min="1"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              {editingId ? 'Update Asset' : 'Add Asset'}
            </button>
          </form>
        </div>
      )}

      {/* ═══════ Assets List — Grouped by Block → Room ═══════ */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 mt-4 text-sm font-medium">Loading assets…</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-gray-500 text-lg">No assets found</p>
          <p className="text-gray-400 text-sm mt-1">
            {hasActiveFilter ? 'Try adjusting your filters' : 'Add assets using the button above'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedAssets)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([blockName, rooms]) => (
            <div key={blockName}>
              {/* Block Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">
                    {blockName === 'Department' ? 'D' : 'A'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{blockName} Block</h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {Object.keys(rooms).length} room{Object.keys(rooms).length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Rooms within this block */}
              <div className="space-y-4 ml-4">
                {Object.entries(rooms)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([roomName, roomAssets]) => {
                  // Room-level totals
                  const roomTotal = roomAssets.reduce((s, a) => s + a.total, 0);
                  const roomDamaged = roomAssets.reduce((s, a) => s + (a.damaged || 0), 0);
                  const roomMaint = roomAssets.reduce((s, a) => s + (a.maintenance || 0), 0);
                  const roomWorking = roomTotal - roomDamaged - roomMaint;

                  return (
                    <div
                      key={roomName}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                    >
                      {/* Room Header */}
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-900 text-base">Room {roomName}</span>
                            <span className="text-xs text-gray-500">
                              {roomAssets.length} asset type{roomAssets.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-emerald-600 font-semibold">{roomWorking} working</span>
                            <span className="text-red-600 font-semibold">{roomDamaged} damaged</span>
                            <span className="text-amber-600 font-semibold">{roomMaint} maintenance</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <StatusBar total={roomTotal} damaged={roomDamaged} maintenance={roomMaint} />
                        </div>
                      </div>

                      {/* Asset Rows */}
                      <div className="divide-y divide-gray-100">
                        {roomAssets
                          .sort((a, b) => a.type.localeCompare(b.type))
                          .map(asset => {
                          const working = asset.total - (asset.damaged || 0) - (asset.maintenance || 0);

                          return (
                            <div key={asset._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                              {/* Left: Asset name */}
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <span className="font-medium text-gray-900 text-sm">{asset.type}</span>
                              </div>

                              {/* Center: Counts */}
                              <div className="flex items-center gap-6 text-sm">
                                <div className="text-center min-w-[50px]">
                                  <p className="text-gray-400 text-xs">Total</p>
                                  <p className="font-bold text-gray-900">{asset.total}</p>
                                </div>
                                <div className="text-center min-w-[50px]">
                                  <p className="text-emerald-600 text-xs">Working</p>
                                  <p className="font-bold text-emerald-600">{working}</p>
                                </div>
                                <div className="text-center min-w-[50px]">
                                  <p className="text-red-500 text-xs">Damaged</p>
                                  <p className="font-bold text-red-600">{asset.damaged || 0}</p>
                                </div>
                                <div className="text-center min-w-[50px]">
                                  <p className="text-amber-500 text-xs">Maint.</p>
                                  <p className="font-bold text-amber-600">{asset.maintenance || 0}</p>
                                </div>
                              </div>

                              {/* Right: Actions */}
                              {!isReadOnly && (
                                <div className="flex gap-2 ml-4">
                                  <button
                                    onClick={() => handleEdit(asset)}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(asset._id)}
                                    className="text-red-500 hover:text-red-600 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacilityAssets;
