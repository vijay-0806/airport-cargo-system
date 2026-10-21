import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
  Warehouse,
  Calendar,
  Send,
  MapPin,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { CargoItem, WarehouseItem, User } from '../types/index.ts';
import { StatusBadge } from '../components/common/StatusBadge.tsx';

interface CargoPageProps {
  user: User | null;
  onNavigateTracking: (code: string) => void;
}

export const CargoPage: React.FC<CargoPageProps> = ({ user, onNavigateTracking }) => {
  const [cargos, setCargos] = useState<CargoItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCargo, setEditingCargo] = useState<CargoItem | null>(null);
  const [viewingCargo, setViewingCargo] = useState<CargoItem | null>(null);
  const [deletingCargoId, setDeletingCargoId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    sender: '',
    receiver: '',
    cargoType: 'Aerospace Components',
    weight: 250,
    origin: 'Frankfurt Airport (FRA)',
    destination: 'Dubai International (DXB)',
    expectedArrival: '',
    warehouseId: '',
    storageLocation: '',
  });

  const loadWarehouses = async () => {
    try {
      const res = await api.getWarehouses();
      setWarehouses(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCargos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCargos({
        search: searchTerm,
        status: statusFilter,
        cargoType: typeFilter,
        warehouseId: warehouseFilter,
        page,
        limit: 8,
      });
      setCargos(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      setError(err.message || 'Failed to load cargo consignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    loadCargos();
  }, [searchTerm, statusFilter, typeFilter, warehouseFilter, page]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.createCargo({
        sender: formData.sender,
        receiver: formData.receiver,
        cargoType: formData.cargoType,
        weight: Number(formData.weight),
        origin: formData.origin,
        destination: formData.destination,
        expectedArrival: formData.expectedArrival || undefined,
        warehouse: formData.warehouseId ? formData.warehouseId : undefined,
        storageLocation: formData.storageLocation || undefined,
      });
      setSuccessMsg(`Cargo consignment ${res.data.cargoCode} registered successfully!`);
      setShowAddModal(false);
      resetForm();
      loadCargos();
      loadWarehouses();
    } catch (err: any) {
      setError(err.message || 'Failed to register cargo');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCargo) return;
    setError(null);
    try {
      await api.updateCargo(editingCargo._id, {
        sender: formData.sender,
        receiver: formData.receiver,
        cargoType: formData.cargoType,
        weight: Number(formData.weight),
        origin: formData.origin,
        destination: formData.destination,
        expectedArrival: formData.expectedArrival || undefined,
        warehouse: formData.warehouseId || undefined,
        storageLocation: formData.storageLocation || undefined,
      });
      setSuccessMsg(`Cargo ${editingCargo.cargoCode} updated successfully.`);
      setEditingCargo(null);
      resetForm();
      loadCargos();
      loadWarehouses();
    } catch (err: any) {
      setError(err.message || 'Failed to update cargo');
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await api.deleteCargo(id);
      setSuccessMsg('Cargo consignment successfully removed.');
      setDeletingCargoId(null);
      loadCargos();
      loadWarehouses();
    } catch (err: any) {
      setError(err.message || 'Failed to delete cargo');
    }
  };

  const startEdit = (c: CargoItem) => {
    setEditingCargo(c);
    setFormData({
      sender: c.sender,
      receiver: c.receiver,
      cargoType: c.cargoType,
      weight: c.weight,
      origin: c.origin,
      destination: c.destination,
      expectedArrival: c.expectedArrival ? c.expectedArrival.split('T')[0] : '',
      warehouseId: c.warehouse || '',
      storageLocation: c.storageLocation || '',
    });
  };

  const resetForm = () => {
    setFormData({
      sender: '',
      receiver: '',
      cargoType: 'Aerospace Components',
      weight: 250,
      origin: 'Frankfurt Airport (FRA)',
      destination: 'Dubai International (DXB)',
      expectedArrival: '',
      warehouseId: '',
      storageLocation: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4 text-rose-600" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Air Cargo Management
          </h1>
          <p className="text-xs text-slate-500">
            Airside intake, warehouse allocations, and manifests ({totalCount} total consignments)
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/20 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Register Incoming Cargo
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by Cargo ID (e.g. CG-10025), sender, receiver, route..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 text-slate-900 text-xs rounded-lg pl-9 pr-4 py-2 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-mono"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 text-slate-700 text-xs rounded-lg px-3 py-2 border border-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Registered">Registered</option>
            <option value="Received">Received</option>
            <option value="Stored">Stored</option>
            <option value="Processing">Processing</option>
            <option value="Loaded">Loaded</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
          </select>

          {/* Warehouse Filter */}
          <select
            value={warehouseFilter}
            onChange={(e) => {
              setWarehouseFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 text-slate-700 text-xs rounded-lg px-3 py-2 border border-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>
                {w.warehouseCode} - {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cargo Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Cargo ID</th>
                <th className="py-3.5 px-4">Commodity / Type</th>
                <th className="py-3.5 px-4">Weight</th>
                <th className="py-3.5 px-4">Route</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Storage Bay</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                    Fetching cargo records...
                  </td>
                </tr>
              ) : cargos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No cargo consignments matched the selected filters.
                  </td>
                </tr>
              ) : (
                cargos.map((cargo) => (
                  <tr key={cargo._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onNavigateTracking(cargo.cargoCode)}
                        title="Click to track"
                        className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                      >
                        {cargo.cargoCode}
                      </button>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {new Date(cargo.shipmentDate).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{cargo.cargoType}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
                        From: {cargo.sender}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {cargo.weight.toLocaleString()} kg
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">{cargo.origin}</div>
                      <div className="text-[11px] text-slate-400">→ {cargo.destination}</div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={cargo.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {cargo.warehouseCode ? (
                        <div>
                          <span className="font-mono font-semibold text-slate-800">
                            {cargo.warehouseCode}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {cargo.storageLocation || 'General Rack'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingCargo(cargo)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEdit(cargo)}
                          title="Edit Cargo"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={() => setDeletingCargoId(cargo._id)}
                            title="Delete Cargo"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing Page <span className="font-semibold text-slate-700">{page}</span> of{' '}
            <span className="font-semibold text-slate-700">{totalPages}</span> ({totalCount} total)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Cargo Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Register New Cargo</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Sender Organization *</label>
                  <input
                    type="text"
                    required
                    value={formData.sender}
                    onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 focus:bg-white focus:border-blue-500"
                    placeholder="e.g. Apex Global Logistics"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Receiver Organization *</label>
                  <input
                    type="text"
                    required
                    value={formData.receiver}
                    onChange={(e) => setFormData({ ...formData, receiver: e.target.value })}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 focus:bg-white focus:border-blue-500"
                    placeholder="e.g. Skyline Avionics Labs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Cargo Commodity / Type *</label>
                  <input
                    type="text"
                    required
                    value={formData.cargoType}
                    onChange={(e) => setFormData({ ...formData, cargoType: e.target.value })}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 focus:bg-white focus:border-blue-500"
                    placeholder="e.g. Aircraft Turbine Spares"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Weight in Kilograms (kg) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    required
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 focus:bg-white focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Origin Airport / Terminal *</label>
                  <input
                    type="text"
                    required
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 focus:bg-white focus:border-blue-500"
                    placeholder="e.g. FRA Terminal 1"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Destination Airport *</label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 focus:bg-white focus:border-blue-500"
                    placeholder="e.g. DXB Cargo Pier"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Warehouse Allocation</label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 focus:bg-white focus:border-blue-500"
                  >
                    <option value="">Direct to Apron / Unassigned</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.warehouseCode} ({w.availableCapacity.toLocaleString()} kg available)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Storage Bay / Rack</label>
                  <input
                    type="text"
                    value={formData.storageLocation}
                    onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 focus:bg-white focus:border-blue-500"
                    placeholder="e.g. Bay 4A-High-Priority"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Expected Delivery Date</label>
                <input
                  type="date"
                  value={formData.expectedArrival}
                  onChange={(e) => setFormData({ ...formData, expectedArrival: e.target.value })}
                  className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Cargo Modal */}
      {editingCargo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Edit Cargo: <span className="font-mono text-blue-600">{editingCargo.cargoCode}</span>
                </h3>
              </div>
              <button
                onClick={() => setEditingCargo(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Sender</label>
                  <input
                    type="text"
                    required
                    value={formData.sender}
                    onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Receiver</label>
                  <input
                    type="text"
                    required
                    value={formData.receiver}
                    onChange={(e) => setFormData({ ...formData, receiver: e.target.value })}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Cargo Type</label>
                  <input
                    type="text"
                    required
                    value={formData.cargoType}
                    onChange={(e) => setFormData({ ...formData, cargoType: e.target.value })}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Origin</label>
                  <input
                    type="text"
                    required
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Destination</label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Warehouse</label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200"
                  >
                    <option value="">No Warehouse Assigned</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.warehouseCode} ({w.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Storage Location</label>
                  <input
                    type="text"
                    value={formData.storageLocation}
                    onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200"
                    placeholder="e.g. Bay 2-B"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCargo(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cargo Details View Modal */}
      {viewingCargo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[11px] font-mono text-slate-400">Cargo Consignment Dossier</span>
                <h3 className="font-bold text-slate-900 text-lg font-mono text-blue-600">
                  {viewingCargo.cargoCode}
                </h3>
              </div>
              <button
                onClick={() => setViewingCargo(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Current State</span>
                  <StatusBadge status={viewingCargo.status} size="md" />
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Weight</span>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {viewingCargo.weight.toLocaleString()} kg
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sender</span>
                  <span className="font-semibold text-slate-800">{viewingCargo.sender}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Receiver</span>
                  <span className="font-semibold text-slate-800">{viewingCargo.receiver}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Commodity Type</span>
                  <span className="font-medium text-slate-800">{viewingCargo.cargoType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Flight Route</span>
                  <span className="font-medium text-slate-800">
                    {viewingCargo.origin} → {viewingCargo.destination}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                <span className="text-blue-600 block text-[10px] uppercase font-semibold">
                  Warehouse &amp; Rack Information
                </span>
                <div className="font-medium text-slate-800">
                  {viewingCargo.warehouseCode ? (
                    <>
                      Warehouse: <span className="font-mono font-bold">{viewingCargo.warehouseCode}</span> ({viewingCargo.warehouseName || 'Assigned'})
                      <br />
                      Rack/Location: <span className="font-mono font-bold">{viewingCargo.storageLocation || 'General Storage'}</span>
                    </>
                  ) : (
                    'Not allocated to a warehouse rack (airside direct transit).'
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const code = viewingCargo.cargoCode;
                    setViewingCargo(null);
                    onNavigateTracking(code);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Open Live Tracking Page
                </button>
                <button
                  type="button"
                  onClick={() => setViewingCargo(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCargoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-50 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Confirm Cargo Deletion</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete this cargo record?
              <br />
              <span className="text-rose-600 font-medium">
                Note: Active cargo can only be deleted if in 'Registered' or 'Delivered' status. Active stored or in-transit cargo cannot be removed.
              </span>
            </p>
            <div className="mt-5 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeletingCargoId(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingCargoId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
