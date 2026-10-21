import React, { useState, useEffect } from 'react';
import {
  Search,
  Plane,
  Package,
  MapPin,
  Clock,
  Warehouse,
  CheckCircle2,
  AlertCircle,
  Copy,
  Zap,
  RotateCcw,
  Shield,
  Layers,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { TrackingData } from '../types/index.ts';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { SHIPMENT_LIFECYCLE, getShipmentProgress, ShipmentStatus } from '../utils/cargo-rules.ts';

interface TrackingPageProps {
  initialCargoCode?: string;
}

export const TrackingPage: React.FC<TrackingPageProps> = ({ initialCargoCode }) => {
  const [cargoCode, setCargoCode] = useState(initialCargoCode || 'CG-10025');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [cacheSource, setCacheSource] = useState('database');
  const [copied, setCopied] = useState(false);

  const fetchTracking = async (codeToSearch: string) => {
    if (!codeToSearch.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.getTracking(codeToSearch.trim());
      setTrackingData(res.data);
      setIsCached(res.cached);
      setCacheSource(res.cacheSource);
    } catch (err: any) {
      setError(err.message || 'Tracking records not found for this Cargo ID.');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCargoCode) {
      setCargoCode(initialCargoCode);
      fetchTracking(initialCargoCode);
    } else {
      fetchTracking('CG-10025');
    }
  }, [initialCargoCode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(cargoCode);
  };

  const copyTracking = () => {
    if (trackingData) {
      navigator.clipboard.writeText(`${window.location.origin}?track=${trackingData.cargoCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sampleCodes = ['CG-10025', 'CG-10026', 'CG-10028', 'CG-10029'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Plane className="w-3.5 h-3.5 -rotate-45" />
          <span>Airport Freight Tracking System</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Cargo Consignment Live Tracking
        </h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          Query active airport shipments, warehouse storage locations, customs clearance, and flight manifests in real time.
        </p>
      </div>

      {/* Tracking Input Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              required
              value={cargoCode}
              onChange={(e) => setCargoCode(e.target.value.toUpperCase())}
              placeholder="Enter Cargo ID (e.g. CG-10025)..."
              className="w-full bg-slate-50 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-3 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white font-mono uppercase font-bold tracking-wider"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plane className="w-4 h-4" />
            )}
            <span>Track Air Cargo</span>
          </button>
        </form>

        {/* Quick Sample Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
          <span>Demo Consignments:</span>
          {sampleCodes.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setCargoCode(code);
                fetchTracking(code);
              }}
              className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition-colors font-medium"
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Error View */}
      {error && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">Consignment Lookup Failed</h4>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchTracking('CG-10025')}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700"
          >
            Load Demo CG-10025
          </button>
        </div>
      )}

      {/* Tracking Result Card */}
      {trackingData && (
        <div className="space-y-6">
          {/* Main Status & Telemetry Header */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xl sm:text-2xl font-black text-blue-700 tracking-tight">
                    {trackingData.cargoCode}
                  </span>
                  <StatusBadge status={trackingData.currentStatus} size="lg" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Commodity: <strong className="text-slate-800">{trackingData.cargoType}</strong> • Payload:{' '}
                  <strong className="text-slate-800">{trackingData.weight.toLocaleString()} kg</strong>
                </p>
              </div>

              {/* Cache Telemetry Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono border ${
                    isCached
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isCached
                      ? `Cache HIT (${cacheSource.toUpperCase()})`
                      : 'DB Read • Cached in Redis'}
                  </span>
                </div>

                <button
                  onClick={copyTracking}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied Link!' : 'Share'}</span>
                </button>
              </div>
            </div>

            {/* Visual 7-Stage Airport Lifecycle Tracker */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Airport Lifecycle Progress</span>
                <span className="font-mono font-bold text-blue-700">
                  {getShipmentProgress(trackingData.currentStatus)}% Complete
                </span>
              </div>

              {/* 7-Step Pipeline Visualizer */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {SHIPMENT_LIFECYCLE.map((step, idx) => {
                  const currentIdx = SHIPMENT_LIFECYCLE.indexOf(trackingData.currentStatus);
                  const isDone = idx < currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={step} className="flex flex-col items-center text-center">
                      <div
                        className={`w-full h-2 rounded-full mb-2 transition-all ${
                          isDone
                            ? 'bg-blue-600'
                            : isCurrent
                            ? 'bg-blue-600 ring-2 ring-blue-300 animate-pulse'
                            : 'bg-slate-200'
                        }`}
                      />
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 ${
                          isDone
                            ? 'bg-blue-600 text-white'
                            : isCurrent
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] hidden sm:block ${
                          isCurrent
                            ? 'font-bold text-blue-800'
                            : isDone
                            ? 'font-medium text-slate-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Flight Route & Location Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Air Route Manifest
                </span>
                <div className="font-semibold text-slate-900 text-xs">
                  {trackingData.origin}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  ↓ Flight Path
                </div>
                <div className="font-semibold text-slate-900 text-xs">
                  {trackingData.destination}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Current Checkpoint Location
                </span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{trackingData.currentLocation}</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Last verified:{' '}
                  {new Date(trackingData.lastUpdated).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Warehouse Storage Bay
                </span>
                {trackingData.assignedWarehouse ? (
                  <div>
                    <span className="font-mono font-bold text-blue-700 text-xs">
                      {trackingData.assignedWarehouse.code}
                    </span>
                    <span className="text-xs text-slate-700 block font-medium">
                      {trackingData.assignedWarehouse.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono block">
                      Rack: {trackingData.storageLocation || 'General Staging'}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 italic">
                    Not currently assigned to a warehouse bay (in-transit/flight).
                  </span>
                )}
              </div>
            </div>

            {/* Consignment Parties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Shipper / Sender</span>
                <span className="font-semibold text-slate-900">{trackingData.sender}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Consignee / Receiver</span>
                <span className="font-semibold text-slate-900">{trackingData.receiver}</span>
              </div>
            </div>
          </div>

          {/* Chronological Event Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Chronological Airside Event Timeline
                </h3>
                <p className="text-xs text-slate-500">
                  Time-stamped audit records logged by terminal operators &amp; customs officials
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-500">
                {trackingData.history.length} Events Logged
              </span>
            </div>

            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {trackingData.history.map((event, index) => {
                const isLatest = index === 0;
                return (
                  <div key={event._id} className="relative group">
                    <div
                      className={`absolute -left-6 top-1 w-3 h-3 rounded-full ring-4 ring-white ${
                        isLatest ? 'bg-blue-600 ring-blue-100' : 'bg-slate-400'
                      }`}
                    />
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={event.status} size="sm" />
                        <span className="font-mono text-[11px] text-slate-500">
                          {new Date(event.timestamp).toLocaleString([], {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{event.location}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Status Transition: {event.previousStatus} → {event.status} • Recorded by:{' '}
                        {event.updatedByName || 'Operations Desk'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
