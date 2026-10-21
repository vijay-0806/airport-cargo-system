import React, { useEffect, useState } from 'react';
import {
  Package,
  Clock,
  Warehouse,
  Send,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Plus,
  Search,
  ArrowRight,
  Database,
  Layers,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { DashboardStats } from '../types/index.ts';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { ProgressBar } from '../components/common/ProgressBar.tsx';

interface DashboardPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheSource, setCacheSource] = useState<string>('database');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, actRes] = await Promise.all([
        api.getDashboardStats(),
        api.getRecentActivity(8),
      ]);
      setStats(statsRes.data);
      setCacheSource(statsRes.source || 'database');
      setActivities(actRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-600">Loading airport terminal metrics...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">Failed to connect to Terminal API</h4>
              <p className="text-xs text-rose-700">{error || 'Unknown error'}</p>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { summary, statusDistribution, warehouseUtilization } = stats;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Airport Cargo &amp; Terminal Operations
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-100 text-blue-800 font-semibold border border-blue-200">
              LIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time air freight tracking, warehouse occupancy, and ramp dispatch.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onNavigate('tracking', 'CG-10025')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            Track CG-10025
          </button>
          <button
            onClick={() => onNavigate('cargo')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Cargo
          </button>
        </div>
      </div>

      {/* KPI Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Shipments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Cargo</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.totalShipments}</div>
          <div className="text-[11px] text-slate-500 mt-1">Air freight consignments</div>
        </div>

        {/* Pending */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Terminal</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{summary.pendingShipments}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting ramp / departure</div>
        </div>

        {/* Stored in Warehouse */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">In Storage</span>
            <Warehouse className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-sky-700">{summary.storedCargo}</div>
          <div className="text-[11px] text-slate-500 mt-1">Inside warehouse bays</div>
        </div>

        {/* In Transit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">In Transit</span>
            <Send className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">{summary.inTransitCargo}</div>
          <div className="text-[11px] text-slate-500 mt-1">Airborne / en route</div>
        </div>

        {/* Delivered */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{summary.deliveredCargo}</div>
          <div className="text-[11px] text-slate-500 mt-1">Customer received &amp; signed</div>
        </div>

        {/* Total Warehouses */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Active Bays</span>
            <Layers className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.totalWarehouses}</div>
          <div className="text-[11px] text-slate-500 mt-1">Warehouses configured</div>
        </div>
      </div>

      {/* Warehouse Capacity Overview Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Total Airport Warehouse Capacity</h3>
            <p className="text-xs text-slate-500">
              Aggregated across all active terminal facilities and cold storage bays.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500">Total: </span>
              <span className="font-bold text-slate-800">{summary.totalWarehouseCapacity.toLocaleString()} kg</span>
            </div>
            <div>
              <span className="text-slate-500">Occupied: </span>
              <span className="font-bold text-blue-700">{summary.occupiedWarehouseCapacity.toLocaleString()} kg</span>
            </div>
            <div>
              <span className="text-slate-500">Available: </span>
              <span className="font-bold text-emerald-600">{summary.availableWarehouseCapacity.toLocaleString()} kg</span>
            </div>
          </div>
        </div>

        <ProgressBar
          value={
            summary.totalWarehouseCapacity > 0
              ? Math.round((summary.occupiedWarehouseCapacity / summary.totalWarehouseCapacity) * 100)
              : 0
          }
          label={`${Math.round(
            summary.totalWarehouseCapacity > 0
              ? (summary.occupiedWarehouseCapacity / summary.totalWarehouseCapacity) * 100
              : 0
          )}% Capacity Utilized`}
          sublabel={`${summary.availableWarehouseCapacity.toLocaleString()} kg Remaining Capacity`}
          heightClass="h-3"
        />
      </div>

      {/* Two Column Layout: Status Distribution & Warehouse Capacity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Cargo Shipment Status Breakdown</h3>
                <p className="text-xs text-slate-500">Active consignments across the 7 lifecycle stages</p>
              </div>
              <button
                onClick={() => onNavigate('shipments')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <span>View Shipments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {statusDistribution.map((item) => {
                const percentage =
                  summary.totalShipments > 0
                    ? Math.round((item.count / summary.totalShipments) * 100)
                    : 0;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.name} size="sm" />
                        <span className="text-slate-600 font-medium">
                          {item.count} {item.count === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <span className="font-mono text-slate-500">{percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Individual Warehouse Utilization */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Warehouse Bays &amp; Utilization</h3>
                <p className="text-xs text-slate-500">Current load capacity per storage facility</p>
              </div>
              <button
                onClick={() => onNavigate('warehouses')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <span>Manage Bays</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {warehouseUtilization.map((wh) => (
                <div key={wh.code} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 px-1.5 py-0.5 rounded bg-white border border-slate-200">
                          {wh.code}
                        </span>
                        <span className="text-xs font-semibold text-slate-900">{wh.name}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-700">
                      {wh.utilizationPercentage}%
                    </span>
                  </div>

                  <ProgressBar
                    value={wh.utilizationPercentage}
                    heightClass="h-2"
                  />

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Occupied: {wh.occupiedCapacity.toLocaleString()} kg</span>
                    <span>Available: {wh.availableCapacity.toLocaleString()} kg</span>
                    <span>Total: {wh.totalCapacity.toLocaleString()} kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Cargo Operations Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent Airside &amp; Warehouse Movements</h3>
            <p className="text-xs text-slate-500">Live operational ledger of status and location changes</p>
          </div>
          <button
            onClick={() => onNavigate('cargo')}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Cargo Code</th>
                <th className="py-3 px-4">Cargo Type</th>
                <th className="py-3 px-4">Status Update</th>
                <th className="py-3 px-4">Recorded Location</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No recent activity records available.
                  </td>
                </tr>
              ) : (
                activities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onNavigate('tracking', act.cargoCode)}
                        className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {act.cargoCode}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{act.cargoType}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400">{act.previousStatus}</span>
                        <span className="text-[11px] text-slate-300">→</span>
                        <StatusBadge status={act.status} size="sm" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{act.location}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-medium text-slate-800">{act.operatorName}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">[{act.operatorRole}]</span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
