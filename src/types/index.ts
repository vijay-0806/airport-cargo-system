import { ShipmentStatus } from '../utils/cargo-rules.ts';

export type UserRole = 'ADMIN' | 'WAREHOUSE_STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active?: boolean;
}

export interface CargoItem {
  _id: string;
  cargoCode: string;
  sender: string;
  receiver: string;
  cargoType: string;
  weight: number;
  origin: string;
  destination: string;
  shipmentDate: string;
  expectedArrival?: string;
  status: ShipmentStatus;
  warehouse?: string;
  warehouseName?: string;
  warehouseCode?: string;
  storageLocation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentItem {
  _id: string;
  cargo: string;
  cargoCode: string;
  sender: string;
  receiver: string;
  cargoType: string;
  weight: number;
  origin: string;
  destination: string;
  currentLocation: string;
  status: ShipmentStatus;
  warehouseName?: string;
  shipmentDate: string;
  expectedArrival?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentHistoryItem {
  _id: string;
  cargo: string;
  previousStatus: string;
  status: ShipmentStatus;
  location: string;
  updatedBy: string;
  updatedByName?: string;
  timestamp: string;
}

export interface WarehouseItem {
  _id: string;
  warehouseCode: string;
  name: string;
  location: string;
  totalCapacity: number;
  occupiedCapacity: number;
  availableCapacity: number;
  cargoCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  summary: {
    totalShipments: number;
    pendingShipments: number;
    registeredCargo: number;
    receivedCargo: number;
    storedCargo: number;
    processingCargo: number;
    loadedCargo: number;
    inTransitCargo: number;
    deliveredCargo: number;
    totalWarehouses: number;
    totalWarehouseCapacity: number;
    occupiedWarehouseCapacity: number;
    availableWarehouseCapacity: number;
  };
  statusDistribution: Array<{
    name: string;
    count: number;
    color: string;
  }>;
  warehouseUtilization: Array<{
    name: string;
    code: string;
    totalCapacity: number;
    occupiedCapacity: number;
    availableCapacity: number;
    utilizationPercentage: number;
  }>;
}

export interface TrackingData {
  cargoId: string;
  cargoCode: string;
  sender: string;
  receiver: string;
  cargoType: string;
  weight: number;
  origin: string;
  destination: string;
  shipmentDate: string;
  expectedArrival?: string;
  currentStatus: ShipmentStatus;
  currentLocation: string;
  assignedWarehouse: {
    id: string;
    code: string;
    name: string;
    location: string;
  } | null;
  storageLocation?: string;
  lastUpdated: string;
  history: ShipmentHistoryItem[];
}
