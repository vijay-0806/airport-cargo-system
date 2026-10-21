/**
 * Pure domain logic for Airport Cargo & Warehouse Management
 * Decoupled from Express / Mongoose for clean unit testing and deterministic validation.
 */

export type ShipmentStatus =
  | 'Registered'
  | 'Received'
  | 'Stored'
  | 'Processing'
  | 'Loaded'
  | 'In Transit'
  | 'Delivered';

export const SHIPMENT_LIFECYCLE: ShipmentStatus[] = [
  'Registered',
  'Received',
  'Stored',
  'Processing',
  'Loaded',
  'In Transit',
  'Delivered',
];

export const VALID_STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  Registered: ['Received'],
  Received: ['Stored', 'Processing'],
  Stored: ['Processing'],
  Processing: ['Loaded'],
  Loaded: ['In Transit'],
  'In Transit': ['Delivered'],
  Delivered: [],
};

/**
 * Checks if a requested status transition is valid according to airport logistics rules.
 */
export function isValidStatusTransition(currentStatus: ShipmentStatus, nextStatus: ShipmentStatus): boolean {
  if (currentStatus === nextStatus) return true; // idempotent
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(nextStatus) : false;
}

/**
 * Computes available warehouse capacity in kilograms.
 * Prevents negative available capacity.
 */
export function calculateAvailableCapacity(totalCapacity: number, occupiedCapacity: number): number {
  if (totalCapacity < 0 || occupiedCapacity < 0) {
    throw new Error('Capacities must be non-negative');
  }
  const available = totalCapacity - occupiedCapacity;
  return Math.max(0, Math.round(available * 100) / 100);
}

/**
 * Validates whether a warehouse can safely accept a cargo weight.
 */
export function canAcceptCargo(totalCapacity: number, currentOccupied: number, cargoWeight: number): boolean {
  if (cargoWeight <= 0) return false;
  return currentOccupied + cargoWeight <= totalCapacity;
}

/**
 * Validates cargo code format (e.g. CG-10025)
 */
export function isValidCargoCode(code: string): boolean {
  return /^CG-\d{4,6}$/.test(code.trim().toUpperCase());
}

/**
 * Generates the next sequential cargo code given an index or count.
 */
export function generateCargoCode(index: number): string {
  const numberPart = 10000 + Math.max(1, index);
  return `CG-${numberPart}`;
}

/**
 * Computes progress percentage (0 - 100) across the 7-stage shipment lifecycle.
 */
export function getShipmentProgress(status: ShipmentStatus): number {
  const index = SHIPMENT_LIFECYCLE.indexOf(status);
  if (index === -1) return 0;
  return Math.round((index / (SHIPMENT_LIFECYCLE.length - 1)) * 100);
}
