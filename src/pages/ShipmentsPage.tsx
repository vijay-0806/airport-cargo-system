import React, { useState, useEffect } from 'react';
import {
  Send,
  Search,
  Filter,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  History,
  Plane,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { ShipmentItem, ShipmentHistoryItem, User } from '../types/index.ts';
import { ShipmentStatus, SHIPMENT_LIFECYCLE, VALID_STATUS_TRANSITIONS } from '../utils/cargo-rules.ts';
import { StatusBadge } from '../components/common/StatusBadge.tsx';

interface ShipmentsPageProps {
  user: User | null;
  onNavigateTracking: (code: string) => void;
}

export const ShipmentsPage: React.FC<ShipmentsPageProps> = ({ user, onNavigateTracking }) => {
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [destFilter, setDestFilter] = useState('');

  // Status Update Modal
  const [updatingShipment, setUpdatingShipment] = useState<ShipmentItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<ShipmentStatus>('Received');
  const [locationInput, setLocationInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // History Drawer Modal
  const [historyShipment, setHistoryShipment] = useState<ShipmentItem | null>(null);
  const [historyList, setHistoryList] = useState<ShipmentHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadShipments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getShipments({
        search: searchTerm,
        status: statusFilter,
        destination: destFilter,
      });
      setShipments(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load air shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, [searchTerm, statusFilter, destFilter]);

  const openStatusModal = (s: ShipmentItem) => {
    setUpdatingShipment(s);
    // Find next valid status default
    const allowed = VALID_STATUS_TRANSITIONS[s.status as ShipmentStatus] || [];
    setTargetStatus((allowed[0] as ShipmentStatus) || s.status);
    setLocationInput(s.currentLocation);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingShipment) return;
    setSubmitting(true);
    setError(null);

    try {
      await api.updateShipmentStatus(updatingShipment._id, {
        status: targetStatus,
        location: locationInput,
      });
      setSuccessMsg(`Shipment ${updatingShipment.cargoCode} advanced to '${targetStatus}'!`);
      setUpdatingShipment(null);
      loadShipments();
    } catch (err: any) {
      setError(err.message || 'Status transition rejected');
    } finally {
      setSubmitting(false);
    }
  };

  const viewHistory = async (s: ShipmentItem) => {
    setHistoryShipment(s);
    setLoadingHistory(true);
    try {
      const res = await api.getShipmentById(s._id);
      setHistoryList(res.data.history || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
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
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Shipment Lifecycle &amp; Movement Control
        </h1>
        <p className="text-xs text-slate-500">
          Enforce airport cargo lifecycle: Registered → Received → Stored → Processing → Loaded → In Transit → Delivered
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by Cargo ID (e.g. CG-10025), sender, receiver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 text-slate-900 text-xs rounded-lg pl-9 pr-4 py-2 border border-slate-200 focus:outline-none focus:border-blue-500 font-mono"
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

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 text-slate-700 text-xs rounded-lg px-3 py-2 border border-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Lifecycle Stages</option>
            {SHIPMENT_LIFECYCLE.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Cargo Code</th>
                <th className="py-3.5 px-4">Consignment Info</th>
                <th className="py-3.5 px-4">Flight Route</th>
                <th className="py-3.5 px-4">Current Location</th>
                <th className="py-3.5 px-4">Lifecycle Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                    Loading air shipments...
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Send className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No shipments found matching filters.
                  </td>
                </tr>
              ) : (
                shipments.map((shipment) => {
                  const allowedNext = VALID_STATUS_TRANSITIONS[shipment.status as ShipmentStatus] || [];
                  const isDelivered = shipment.status === 'Delivered';

                  return (
                    <tr key={shipment._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onNavigateTracking(shipment.cargoCode)}
                          className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {shipment.cargoCode}
                        </button>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Departed: {new Date(shipment.shipmentDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{shipment.cargoType}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {shipment.weight.toLocaleString()} kg • To: {shipment.receiver}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{shipment.origin}</div>
                        <div className="text-[11px] text-slate-400">→ {shipment.destination}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{shipment.currentLocation}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Last update: {new Date(shipment.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={shipment.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => viewHistory(shipment)}
                            title="View Lifecycle History"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1"
                          >
                            <History className="w-4 h-4" />
                            <span className="text-[11px] font-medium hidden sm:inline">Audit Trail</span>
                          </button>

                          {!isDelivered ? (
                            <button
                              onClick={() => openStatusModal(shipment)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors flex items-center gap-1"
                            >
                              <span>Update Status</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[11px] font-medium text-emerald-600 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                              Completed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advance Status Modal */}
      {updatingShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[11px] font-mono text-slate-400">Advance Consignment Stage</span>
                <h3 className="font-bold text-slate-900 text-base font-mono text-blue-600">
                  {updatingShipment.cargoCode}
                </h3>
              </div>
              <button
                onClick={() => setUpdatingShipment(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Current State</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={updatingShipment.status} size="md" />
                  <span className="text-slate-500">at {updatingShipment.currentLocation}</span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Next Allowed Lifecycle Status *
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as ShipmentStatus)}
                  className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-slate-800 font-semibold focus:border-blue-500"
                >
                  {(VALID_STATUS_TRANSITIONS[updatingShipment.status as ShipmentStatus] || []).map((s) => (
                    <option key={s} value={s}>
                      → {s}
                    </option>
                  ))}
                  {/* Option to keep same status and update location */}
                  <option value={updatingShipment.status}>
                    Maintain '{updatingShipment.status}' (Update Location Only)
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  New Location / Checkpoint Entry *
                </label>
                <input
                  type="text"
                  required
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 focus:bg-white focus:border-blue-500"
                  placeholder="e.g. Apron Stand 14, Aircraft Loading Bay, or In-Flight"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUpdatingShipment(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Confirm Status Progression'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Audit Trail Modal */}
      {historyShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <div>
                <span className="text-[11px] font-mono text-slate-400">Complete Shipment History</span>
                <h3 className="font-bold text-slate-900 text-base font-mono text-blue-600">
                  {historyShipment.cargoCode} • Audit Trail
                </h3>
              </div>
              <button
                onClick={() => setHistoryShipment(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 text-xs">
              {loadingHistory ? (
                <div className="py-8 text-center text-slate-400">Loading audit records...</div>
              ) : historyList.length === 0 ? (
                <div className="py-8 text-center text-slate-400">No movement entries logged yet.</div>
              ) : (
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {historyList.map((entry, idx) => (
                    <div key={entry._id} className="relative group">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center justify-between mb-1">
                          <StatusBadge status={entry.status} size="sm" />
                          <span className="font-mono text-[10px] text-slate-400">
                            {new Date(entry.timestamp).toLocaleString([], {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          <span>{entry.location}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          Operator: {entry.updatedByName || 'Airport Staff'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setHistoryShipment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs"
              >
                Close Trail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
