import React, { useState, useEffect } from 'react';
import {
  Warehouse as WarehouseIcon,
  Plus,
  AlertCircle,
  CheckCircle2,
  X,
  Package,
  Layers,
  MapPin,
  Trash2,
  ArrowRight,
  UserCheck,
  Building2,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { WarehouseItem, CargoItem, User } from '../types/index.ts';
import { ProgressBar } from '../components/common/ProgressBar.tsx';
import { StatusBadge } from '../components/common/StatusBadge.tsx';

interface WarehousesPageProps {
  user: User | null;
  onNavigateTracking: (code: string) => void;
}

export const WarehousesPage: React.FC<WarehousesPageProps> = ({ user, onNavigateTracking }) => {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected warehouse for detail inspection
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseItem | null>(null);
  const [storedCargos, setStoredCargos] = useState<CargoItem[]>([]);
  const [loadingStored, setLoadingStored] = useState(false);

  // Create Warehouse Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWh, setNewWh] = useState({
    warehouseCode: '',
    name: '',
    location: '',
    totalCapacity: 35000,
  });

  // Assign Cargo to Warehouse Modal
  const [assigningToWh, setAssigningToWh] = useState<WarehouseItem | null>(null);
  const [availableUnassignedCargos, setAvailableUnassignedCargos] = useState<CargoItem[]>([]);
  const [selectedCargoId, setSelectedCargoId] = useState('');
  const [customRack, setCustomRack] = useState('');

  const loadWarehouses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getWarehouses();
      setWarehouses(res.data);
      if (res.data.length > 0 && !selectedWarehouse) {
        inspectWarehouse(res.data[0]);
      } else if (selectedWarehouse) {
        // Refresh currently viewed warehouse
        const updated = res.data.find((w) => w._id === selectedWarehouse._id);
        if (updated) inspectWarehouse(updated);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  const inspectWarehouse = async (wh: WarehouseItem) => {
    setSelectedWarehouse(wh);
    setLoadingStored(true);
    try {
      const res = await api.getWarehouseById(wh._id);
      setStoredCargos(res.data.storedCargos || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingStored(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createWarehouse({
        ...newWh,
        totalCapacity: Number(newWh.totalCapacity),
      });
      setSuccessMsg(`Warehouse ${newWh.warehouseCode} established successfully.`);
      setShowAddModal(false);
      setNewWh({ warehouseCode: '', name: '', location: '', totalCapacity: 35000 });
      loadWarehouses();
    } catch (err: any) {
      setError(err.message || 'Failed to create warehouse');
    }
  };

  const handleDeleteWarehouse = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete warehouse '${name}'? Only empty warehouses can be deleted.`)) return;
    setError(null);
    try {
      await api.deleteWarehouse(id);
      setSuccessMsg(`Warehouse '${name}' deleted successfully.`);
      setSelectedWarehouse(null);
      loadWarehouses();
    } catch (err: any) {
      setError(err.message || 'Failed to delete warehouse');
    }
  };

  const openAssignModal = async (wh: WarehouseItem) => {
    setAssigningToWh(wh);
    setSelectedCargoId('');
    setCustomRack('Bay ' + Math.floor(Math.random() * 5 + 1) + '-A');
    try {
      // Find unassigned or movable cargos
      const res = await api.getCargos({ limit: 50 });
      const candidates = res.items.filter((c) => c.warehouse !== wh._id && c.status !== 'Delivered');
      setAvailableUnassignedCargos(candidates);
      if (candidates.length > 0) setSelectedCargoId(candidates[0]._id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningToWh || !selectedCargoId) return;
    setError(null);

    try {
      await api.assignCargo(assigningToWh._id, selectedCargoId, customRack);
      setSuccessMsg('Cargo successfully allocated to warehouse bay.');
      setAssigningToWh(null);
      loadWarehouses();
    } catch (err: any) {
      setError(err.message || 'Failed to assign cargo');
    }
  };

  const handleRemoveCargo = async (warehouseId: string, cargoId: string) => {
    if (!window.confirm('Remove this cargo consignment from the warehouse bay?')) return;
    setError(null);
    try {
      await api.removeCargo(warehouseId, cargoId);
      setSuccessMsg('Cargo removed from warehouse bay.');
      loadWarehouses();
    } catch (err: any) {
      setError(err.message || 'Failed to remove cargo');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Warehouse Storage &amp; Capacity Management
          </h1>
          <p className="text-xs text-slate-500">
            Real-time payload allocation, bay occupancy limits, and temperature-controlled storage
          </p>
        </div>
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/20 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Storage Warehouse
          </button>
        )}
      </div>

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-10 text-center text-slate-400">Loading airport warehouses...</div>
        ) : (
          warehouses.map((wh) => {
            const percent =
              wh.totalCapacity > 0 ? Math.round((wh.occupiedCapacity / wh.totalCapacity) * 100) : 0;
            const isSelected = selectedWarehouse?._id === wh._id;

            return (
              <div
                key={wh._id}
                onClick={() => inspectWarehouse(wh)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer text-xs space-y-3 ${
                  isSelected
                    ? 'bg-blue-50/40 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {wh.warehouseCode}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {wh.cargoCount || 0} consignments stored
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{wh.name}</h3>
                  </div>
                  <WarehouseIcon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                </div>

                <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{wh.location}</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-500">Utilization</span>
                    <span className="font-bold text-slate-800">{percent}%</span>
                  </div>
                  <ProgressBar value={percent} heightClass="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Total</span>
                    <span className="font-semibold text-slate-800 text-[11px]">
                      {(wh.totalCapacity / 1000).toFixed(0)}k kg
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Occupied</span>
                    <span className="font-semibold text-blue-700 text-[11px]">
                      {(wh.occupiedCapacity / 1000).toFixed(1)}k kg
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Available</span>
                    <span className="font-semibold text-emerald-600 text-[11px]">
                      {(wh.availableCapacity / 1000).toFixed(1)}k kg
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100/80">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAssignModal(wh);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Assign Cargo
                  </button>

                  {user?.role === 'ADMIN' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWarehouse(wh._id, wh.name);
                      }}
                      title="Delete Warehouse (Must be empty)"
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Warehouse Inspection & Stored Cargo List */}
      {selectedWarehouse && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                  {selectedWarehouse.warehouseCode}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedWarehouse.name} — Stored Cargo Manifest
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Location: {selectedWarehouse.location} • Available Capacity:{' '}
                <strong className="text-emerald-700">
                  {selectedWarehouse.availableCapacity.toLocaleString()} kg
                </strong>{' '}
                remaining
              </p>
            </div>

            <button
              onClick={() => openAssignModal(selectedWarehouse)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              Assign Cargo to this Facility
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Cargo ID</th>
                  <th className="py-3 px-4">Commodity / Type</th>
                  <th className="py-3 px-4">Weight</th>
                  <th className="py-3 px-4">Assigned Rack</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingStored ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Loading inventory for {selectedWarehouse.warehouseCode}...
                    </td>
                  </tr>
                ) : storedCargos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No cargo consignments currently stored in this warehouse bay.
                    </td>
                  </tr>
                ) : (
                  storedCargos.map((cargo) => (
                    <tr key={cargo._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onNavigateTracking(cargo.cargoCode)}
                          className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {cargo.cargoCode}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{cargo.cargoType}</span>
                        <span className="text-[11px] text-slate-400 block">From: {cargo.sender}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {cargo.weight.toLocaleString()} kg
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {cargo.storageLocation || 'General Rack'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={cargo.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRemoveCargo(selectedWarehouse._id, cargo._id)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline"
                        >
                          Unassign / Release
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Warehouse Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <WarehouseIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Create Airport Storage Facility</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Warehouse Code *</label>
                <input
                  type="text"
                  required
                  value={newWh.warehouseCode}
                  onChange={(e) => setNewWh({ ...newWh, warehouseCode: e.target.value })}
                  placeholder="e.g. WH-DELTA"
                  className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={newWh.name}
                  onChange={(e) => setNewWh({ ...newWh, name: e.target.value })}
                  placeholder="e.g. Express Air Freight Hub"
                  className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Airport Airside Location *</label>
                <input
                  type="text"
                  required
                  value={newWh.location}
                  onChange={(e) => setNewWh({ ...newWh, location: e.target.value })}
                  placeholder="e.g. Ramp West 5, Gate 18"
                  className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Total Capacity in kg *</label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  required
                  value={newWh.totalCapacity}
                  onChange={(e) => setNewWh({ ...newWh, totalCapacity: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Cargo Modal */}
      {assigningToWh && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[11px] font-mono text-slate-400">Allocate Storage</span>
                <h3 className="font-bold text-slate-900 text-base">
                  Assign Cargo to {assigningToWh.warehouseCode}
                </h3>
              </div>
              <button onClick={() => setAssigningToWh(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignCargo} className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 font-mono text-[11px]">
                Remaining Available Capacity:{' '}
                <strong className="text-blue-700">
                  {assigningToWh.availableCapacity.toLocaleString()} kg
                </strong>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Select Cargo Consignment *</label>
                {availableUnassignedCargos.length === 0 ? (
                  <p className="text-slate-500 italic">No eligible cargo found for assignment.</p>
                ) : (
                  <select
                    value={selectedCargoId}
                    onChange={(e) => setSelectedCargoId(e.target.value)}
                    className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200"
                  >
                    {availableUnassignedCargos.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.cargoCode} - {c.cargoType} ({c.weight.toLocaleString()} kg)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Storage Rack / Bay Identifier</label>
                <input
                  type="text"
                  value={customRack}
                  onChange={(e) => setCustomRack(e.target.value)}
                  placeholder="e.g. Bay 2-A"
                  className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningToWh(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={availableUnassignedCargos.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
