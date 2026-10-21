import bcrypt from 'bcryptjs';
import { ShipmentStatus, isValidStatusTransition, calculateAvailableCapacity, canAcceptCargo } from '../../../src/utils/cargo-rules.ts';
import { UserRole } from '../models/User.ts';
import { redisCache } from '../config/redis.ts';

export interface UserDoc {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseDoc {
  _id: string;
  warehouseCode: string;
  name: string;
  location: string;
  totalCapacity: number; // kg
  occupiedCapacity: number; // kg
  createdAt: string;
  updatedAt: string;
}

export interface CargoDoc {
  _id: string;
  cargoCode: string;
  sender: string;
  receiver: string;
  cargoType: string;
  weight: number; // kg
  origin: string;
  destination: string;
  shipmentDate: string;
  expectedArrival?: string;
  status: ShipmentStatus;
  warehouse?: string; // Warehouse _id
  storageLocation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentDoc {
  _id: string;
  cargo: string; // Cargo _id
  shipmentDate: string;
  expectedArrival?: string;
  currentLocation: string;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentHistoryDoc {
  _id: string;
  cargo: string; // Cargo _id
  previousStatus: string;
  status: ShipmentStatus;
  location: string;
  updatedBy: string; // User _id or name
  timestamp: string;
}

class DatabaseStore {
  public users: Map<string, UserDoc> = new Map();
  public warehouses: Map<string, WarehouseDoc> = new Map();
  public cargos: Map<string, CargoDoc> = new Map();
  public shipments: Map<string, ShipmentDoc> = new Map();
  public shipmentHistories: ShipmentHistoryDoc[] = [];
  private cargoCounter = 10024;
  private isInitialized = false;

  constructor() {
    this.initSeed();
  }

  public async initSeed(force = false) {
    if (this.isInitialized && !force) return;

    this.users.clear();
    this.warehouses.clear();
    this.cargos.clear();
    this.shipments.clear();
    this.shipmentHistories = [];

    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
    const daysAhead = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();

    // 1. Seed Users
    const adminPasswordHash = bcrypt.hashSync('Admin123!', 8);
    const staffPasswordHash = bcrypt.hashSync('Staff123!', 8);

    const adminUser: UserDoc = {
      _id: 'usr-admin-01',
      name: 'Capt. Marcus Vance',
      email: 'admin@airportcargo.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      active: true,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(1),
    };

    const staffUser: UserDoc = {
      _id: 'usr-staff-01',
      name: 'Elena Rostova',
      email: 'staff@airportcargo.com',
      passwordHash: staffPasswordHash,
      role: 'WAREHOUSE_STAFF',
      active: true,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(1),
    };

    this.users.set(adminUser._id, adminUser);
    this.users.set(staffUser._id, staffUser);

    // 2. Seed Warehouses
    const whA: WarehouseDoc = {
      _id: 'wh-01',
      warehouseCode: 'WH-ALPHA',
      name: 'Terminal 1 - General Air Freight',
      location: 'Airside Zone 4, Gate 12',
      totalCapacity: 45000,
      occupiedCapacity: 12450,
      createdAt: daysAgo(45),
      updatedAt: daysAgo(1),
    };

    const whB: WarehouseDoc = {
      _id: 'wh-02',
      warehouseCode: 'WH-BRAVO',
      name: 'Terminal 2 - High-Value & Electronics Bay',
      location: 'Secure Logistics Vault, Sector 9',
      totalCapacity: 25000,
      occupiedCapacity: 8800,
      createdAt: daysAgo(45),
      updatedAt: daysAgo(2),
    };

    const whC: WarehouseDoc = {
      _id: 'wh-03',
      warehouseCode: 'WH-CHARLIE',
      name: 'Cold Chain & Perishables Facility',
      location: 'Refrigerated Cargo Pier 3',
      totalCapacity: 30000,
      occupiedCapacity: 5200,
      createdAt: daysAgo(40),
      updatedAt: daysAgo(1),
    };

    this.warehouses.set(whA._id, whA);
    this.warehouses.set(whB._id, whB);
    this.warehouses.set(whC._id, whC);

    // 3. Seed Cargos & Shipments (12 records across all statuses)
    const seedCargoItems: Array<{
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
      storageLocation?: string;
      currentLocation: string;
      history: Array<{ prev: string; curr: ShipmentStatus; loc: string; time: string }>;
    }> = [
      {
        cargoCode: 'CG-10025', // Dedicated prominent demo cargo
        sender: 'Apex Aeronautics Global',
        receiver: 'Skyline Avionics Labs',
        cargoType: 'Aerospace Components',
        weight: 1450,
        origin: 'Frankfurt Airport (FRA)',
        destination: 'Dubai International (DXB)',
        shipmentDate: daysAgo(4),
        expectedArrival: daysAhead(1),
        status: 'In Transit',
        warehouse: 'wh-01',
        storageLocation: 'Bay 4A-High-Priority',
        currentLocation: 'Mid-Flight Cargo Hold FL-892',
        history: [
          { prev: 'None', curr: 'Registered', loc: 'FRA Airside Registration', time: daysAgo(4) },
          { prev: 'Registered', curr: 'Received', loc: 'FRA Intake Terminal 1', time: daysAgo(3) },
          { prev: 'Received', curr: 'Stored', loc: 'Warehouse WH-ALPHA (Bay 4A)', time: daysAgo(3) },
          { prev: 'Stored', curr: 'Processing', loc: 'Customs & X-Ray Screening', time: daysAgo(2) },
          { prev: 'Processing', curr: 'Loaded', loc: 'Apron Stand 14, Flight EK-048', time: daysAgo(1) },
          { prev: 'Loaded', curr: 'In Transit', loc: 'Airborne (Cruising Altitude FL370)', time: daysAgo(0.5) },
        ],
      },
      {
        cargoCode: 'CG-10026',
        sender: 'MedLife BioPharm Inc.',
        receiver: 'Tokyo Central Hospital',
        cargoType: 'Temperature-Sensitive Vaccines',
        weight: 620,
        origin: 'Zurich Airport (ZRH)',
        destination: 'Tokyo Haneda (HND)',
        shipmentDate: daysAgo(3),
        expectedArrival: daysAhead(2),
        status: 'Stored',
        warehouse: 'wh-03',
        storageLocation: 'Cryo-Vault Shelf C-12 (-20°C)',
        currentLocation: 'WH-CHARLIE Cold Pier',
        history: [
          { prev: 'None', curr: 'Registered', loc: 'ZRH Cold Hub Desk', time: daysAgo(3) },
          { prev: 'Registered', curr: 'Received', loc: 'ZRH Transfer Bay', time: daysAgo(2) },
          { prev: 'Received', curr: 'Stored', loc: 'WH-CHARLIE Cryo-Vault Shelf C-12', time: daysAgo(1) },
        ],
      },
      {
        cargoCode: 'CG-10027',
        sender: 'Silicon Photonics Ltd',
        receiver: 'Nova Quantum Systems',
        cargoType: 'High-Purity Silicon Wafers',
        weight: 850,
        origin: 'Taipei Taoyuan (TPE)',
        destination: 'San Francisco (SFO)',
        shipmentDate: daysAgo(2),
        expectedArrival: daysAhead(2),
        status: 'Processing',
        warehouse: 'wh-02',
        storageLocation: 'ESD Secure Chamber E-3',
        currentLocation: 'Security Screening Line 2',
        history: [
          { prev: 'None', curr: 'Registered', loc: 'TPE Cargo Office', time: daysAgo(2) },
          { prev: 'Registered', curr: 'Received', loc: 'Terminal 2 Intake', time: daysAgo(1.5) },
          { prev: 'Received', curr: 'Stored', loc: 'WH-BRAVO Vault E-3', time: daysAgo(1) },
          { prev: 'Stored', curr: 'Processing', loc: 'Security Screening Line 2', time: daysAgo(0.3) },
        ],
      },
      {
        cargoCode: 'CG-10028',
        sender: 'Nordic Fisheries Alliance',
        receiver: 'Gourmet Express Logistics',
        cargoType: 'Fresh Atlantic Salmon',
        weight: 2200,
        origin: 'Oslo Gardermoen (OSL)',
        destination: 'Singapore Changi (SIN)',
        shipmentDate: daysAgo(1),
        expectedArrival: daysAhead(1),
        status: 'Loaded',
        warehouse: 'wh-03',
        storageLocation: 'Refrigerated Pallet P-8',
        currentLocation: 'Cargo Aircraft ULD Container 91',
        history: [
          { prev: 'None', curr: 'Registered', loc: 'OSL Seafood Bay', time: daysAgo(1) },
          { prev: 'Registered', curr: 'Received', loc: 'Cold Intake', time: daysAgo(0.8) },
          { prev: 'Received', curr: 'Stored', loc: 'WH-CHARLIE Pallet P-8', time: daysAgo(0.6) },
          { prev: 'Stored', curr: 'Processing', loc: 'Veterinary Inspection Passed', time: daysAgo(0.4) },
          { prev: 'Processing', curr: 'Loaded', loc: 'Apron Bay 22, Flight SQ-351', time: daysAgo(0.1) },
        ],
      },
      {
        cargoCode: 'CG-10029',
        sender: 'Bosch Automotive Mobility',
        receiver: 'Tesla Gigafactory Texas',
        cargoType: 'Electric Powertrain Units',
        weight: 3400,
        origin: 'Stuttgart Airport (STR)',
        destination: 'Austin Bergstrom (AUS)',
        shipmentDate: daysAgo(6),
        expectedArrival: daysAgo(1),
        status: 'Delivered',
        currentLocation: 'Customer Terminal Delivered & Signed',
        history: [
          { prev: 'None', curr: 'Registered', loc: 'STR Cargo Desk', time: daysAgo(6) },
          { prev: 'Registered', curr: 'Received', loc: 'STR Logistics Bay', time: daysAgo(5) },
          { prev: 'Received', curr: 'Stored', loc: 'WH-ALPHA Bay 1', time: daysAgo(4) },
          { prev: 'Stored', curr: 'Processing', loc: 'Customs Clearance', time: daysAgo(3) },
          { prev: 'Processing', curr: 'Loaded', loc: 'Freighter Stand B', time: daysAgo(2) },
          { prev: 'Loaded', curr: 'In Transit', loc: 'Transatlantic Flight LH-8220', time: daysAgo(1.5) },
          { prev: 'In Transit', curr: 'Delivered', loc: 'AUS Freight Dock, Recipient Signed', time: daysAgo(0.5) },
        ],
      },
      {
        cargoCode: 'CG-10030',
        sender: 'Hermes Luxury Goods',
        receiver: 'Fifth Avenue Flagship Boutique',
        cargoType: 'High-Value Fashion & Leather',
        weight: 480,
        origin: 'Paris Charles de Gaulle (CDG)',
        destination: 'New York JFK (JFK)',
        shipmentDate: daysAgo(2),
        expectedArrival: daysAhead(1),
        status: 'Stored',
        warehouse: 'wh-02',
        storageLocation: 'Armored Vault Locker 14',
        currentLocation: 'WH-BRAVO Secure Locker 14',
        history: [
          { prev: 'None', curr: 'Registered', loc: 'CDG VIP Freight Desk', time: daysAgo(2) },
          { prev: 'Registered', curr: 'Received', loc: 'Armored Escort Pier', time: daysAgo(1.5) },
          { prev: 'Received', curr: 'Stored', loc: 'WH-BRAVO Armored Locker 14', time: daysAgo(1) },
        ],
      },
      {
        cargoCode: 'CG-10031',
        sender: 'Siemens Healthineers',
        receiver: 'King Fahad Medical City',
        cargoType: 'MRI Sensor Assembly',
        weight: 1850,
        origin: 'Munich Airport (MUC)',
        destination: 'Riyadh King Khalid (RUH)',
        shipmentDate: daysAgo(1),
        expectedArrival: daysAhead(3),
        status: 'Received',
        warehouse: 'wh-01',
        storageLocation: 'Holding Zone Alpha-R',
        currentLocation: 'Airside Receiving Ramp 4',
        history: [
          { prev: 'None', curr: 'Registered', loc: 'MUC Logistics Hub', time: daysAgo(1) },
          { prev: 'Registered', curr: 'Received', loc: 'Airside Receiving Ramp 4', time: daysAgo(0.3) },
        ],
      },
      {
        cargoCode: 'CG-10032',
        sender: 'Samsung Electronics',
        receiver: 'BestBuy Distribution Centers',
        cargoType: 'OLED Display Panels',
        weight: 4100,
        origin: 'Seoul Incheon (ICN)',
        destination: 'Los Angeles (LAX)',
        shipmentDate: daysAgo(0.5),
        expectedArrival: daysAhead(4),
        status: 'Registered',
        currentLocation: 'Pending Terminal Drop-off',
        history: [
          { prev: 'None', curr: 'Registered', loc: 'ICN Freight Booking Desk', time: daysAgo(0.5) },
        ],
      },
      {
        cargoCode: 'CG-10033',
        sender: 'Swiss Precision Instruments',
        receiver: 'Tokyo Optical Instruments',
        cargoType: 'Calibrated Laser Interferometers',
        weight: 310,
        origin: 'Geneva Airport (GVA)',
        destination: 'Tokyo Narita (NRT)',
        shipmentDate: daysAgo(3),
        expectedArrival: daysAhead(1),
        status: 'In Transit',
        warehouse: 'wh-02',
        storageLocation: 'Vault 2-B',
        currentLocation: 'Flight LX-160 Cargo Deck',
        history: [
          { prev: 'None', curr: 'Registered', loc: 'GVA Cargo Reception', time: daysAgo(3) },
          { prev: 'Registered', curr: 'Received', loc: 'Precision Staging Zone', time: daysAgo(2.5) },
          { prev: 'Received', curr: 'Stored', loc: 'WH-BRAVO Vault 2-B', time: daysAgo(2) },
          { prev: 'Stored', curr: 'Processing', loc: 'Shock-Sensor Inspection', time: daysAgo(1.5) },
          { prev: 'Processing', curr: 'Loaded', loc: 'Apron Bay 5', time: daysAgo(1) },
          { prev: 'Loaded', curr: 'In Transit', loc: 'Flight LX-160 Cruising Over Central Asia', time: daysAgo(0.4) },
        ],
      },
      {
        cargoCode: 'CG-10034',
        sender: 'AeroSpares UK Ltd',
        receiver: 'Delta TechOps Atlanta',
        cargoType: 'Turbine Jet Blades',
        weight: 2900,
        origin: 'London Heathrow (LHR)',
        destination: 'Atlanta Hartsfield (ATL)',
        shipmentDate: daysAgo(5),
        expectedArrival: daysAgo(0.2),
        status: 'Delivered',
        currentLocation: 'ATL TechOps Receiving Bay Signed',
        history: [
          { prev: 'None', curr: 'Registered', loc: 'LHR World Cargo Center', time: daysAgo(5) },
          { prev: 'Registered', curr: 'Received', loc: 'Heavy Freight Intake', time: daysAgo(4) },
          { prev: 'Received', curr: 'Stored', loc: 'WH-ALPHA Bay H-3', time: daysAgo(3) },
          { prev: 'Stored', curr: 'Processing', loc: 'Hazmat & Heavy Staging', time: daysAgo(2) },
          { prev: 'Processing', curr: 'Loaded', loc: 'B777 Freighter Bay', time: daysAgo(1.5) },
          { prev: 'Loaded', curr: 'In Transit', loc: 'Flight BA-227 Transatlantic', time: daysAgo(1) },
          { prev: 'In Transit', curr: 'Delivered', loc: 'ATL TechOps Receiving Bay Signed', time: daysAgo(0.2) },
        ],
      },
      {
        cargoCode: 'CG-10035',
        sender: 'Dutch Flower Auctions',
        receiver: 'Manhattan Floral Wholesalers',
        cargoType: 'Cut Fresh Tulips & Orchids',
        weight: 1800,
        origin: 'Amsterdam Schiphol (AMS)',
        destination: 'New York Newark (EWR)',
        shipmentDate: daysAgo(1.5),
        expectedArrival: daysAhead(1),
        status: 'Processing',
        warehouse: 'wh-03',
        storageLocation: 'Cold Chamber Rack 1',
        currentLocation: 'Agricultural & Phytosanitary Station',
        history: [
          { prev: 'None', curr: 'Registered', loc: 'AMS Flower Auction Pier', time: daysAgo(1.5) },
          { prev: 'Registered', curr: 'Received', loc: 'AMS Perishables Gate', time: daysAgo(1.2) },
          { prev: 'Received', curr: 'Stored', loc: 'WH-CHARLIE Cold Chamber 1', time: daysAgo(0.9) },
          { prev: 'Stored', curr: 'Processing', loc: 'Phytosanitary Inspection', time: daysAgo(0.3) },
        ],
      },
      {
        cargoCode: 'CG-10036',
        sender: 'Kyoto Microelectronics',
        receiver: 'Berlin Embedded Tech GmbH',
        cargoType: 'Automotive Sensor Chips',
        weight: 950,
        origin: 'Osaka Kansai (KIX)',
        destination: 'Berlin Brandenburg (BER)',
        shipmentDate: daysAgo(0.8),
        expectedArrival: daysAhead(3),
        status: 'Received',
        warehouse: 'wh-02',
        storageLocation: 'Intake Bay 2',
        currentLocation: 'Terminal Intake Weighing Scale',
        history: [
          { prev: 'None', curr: 'Registered', loc: 'KIX Cargo Terminal', time: daysAgo(0.8) },
          { prev: 'Registered', curr: 'Received', loc: 'Terminal Intake Weighing Scale', time: daysAgo(0.2) },
        ],
      },
    ];

    let counter = 10036;
    for (let i = 0; i < seedCargoItems.length; i++) {
      const item = seedCargoItems[i];
      const cargoId = `crg-${i + 1}`;
      const shipmentId = `shp-${i + 1}`;

      const cargoDoc: CargoDoc = {
        _id: cargoId,
        cargoCode: item.cargoCode,
        sender: item.sender,
        receiver: item.receiver,
        cargoType: item.cargoType,
        weight: item.weight,
        origin: item.origin,
        destination: item.destination,
        shipmentDate: item.shipmentDate,
        expectedArrival: item.expectedArrival,
        status: item.status,
        warehouse: item.warehouse,
        storageLocation: item.storageLocation,
        createdAt: item.shipmentDate,
        updatedAt: item.history[item.history.length - 1]?.time || item.shipmentDate,
      };

      const shipmentDoc: ShipmentDoc = {
        _id: shipmentId,
        cargo: cargoId,
        shipmentDate: item.shipmentDate,
        expectedArrival: item.expectedArrival,
        currentLocation: item.currentLocation,
        status: item.status,
        createdAt: item.shipmentDate,
        updatedAt: item.history[item.history.length - 1]?.time || item.shipmentDate,
      };

      this.cargos.set(cargoId, cargoDoc);
      this.shipments.set(shipmentId, shipmentDoc);

      // Record histories
      for (const h of item.history) {
        this.shipmentHistories.push({
          _id: `shh-${this.shipmentHistories.length + 1}`,
          cargo: cargoId,
          previousStatus: h.prev,
          status: h.curr,
          location: h.loc,
          updatedBy: adminUser._id,
          timestamp: h.time,
        });
      }
    }

    this.cargoCounter = counter;
    this.recalculateWarehouseOccupancies();
    this.isInitialized = true;
    console.log('[DatabaseStore] Seeded database successfully with 2 users, 3 warehouses, 12 cargos, and full shipment histories.');
  }

  public recalculateWarehouseOccupancies() {
    // Reset all warehouses to 0 occupied
    for (const wh of this.warehouses.values()) {
      wh.occupiedCapacity = 0;
    }

    // Accumulate weights of active stored cargos
    for (const cargo of this.cargos.values()) {
      if (cargo.warehouse && ['Received', 'Stored', 'Processing'].includes(cargo.status)) {
        const wh = this.warehouses.get(cargo.warehouse);
        if (wh) {
          wh.occupiedCapacity = Math.round((wh.occupiedCapacity + cargo.weight) * 100) / 100;
        }
      }
    }
  }

  // --- User Queries ---
  public getUserByEmail(email: string): UserDoc | undefined {
    const normalized = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === normalized) {
        return user;
      }
    }
    return undefined;
  }

  public getUserById(id: string): UserDoc | undefined {
    return this.users.get(id);
  }

  public getAllUsers(): UserDoc[] {
    return Array.from(this.users.values()).map((u) => {
      const { passwordHash, ...rest } = u;
      return {
        ...rest,
        id: u._id,
      } as any;
    });
  }

  // --- Cargo CRUD ---
  public getNextCargoCode(): string {
    this.cargoCounter += 1;
    return `CG-${this.cargoCounter}`;
  }

  public getAllCargos(filters: {
    search?: string;
    status?: string;
    cargoType?: string;
    destination?: string;
    warehouseId?: string;
    page?: number;
    limit?: number;
  }) {
    let list = Array.from(this.cargos.values());

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.cargoCode.toLowerCase().includes(q) ||
          c.sender.toLowerCase().includes(q) ||
          c.receiver.toLowerCase().includes(q) ||
          c.cargoType.toLowerCase().includes(q) ||
          c.origin.toLowerCase().includes(q) ||
          c.destination.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      list = list.filter((c) => c.status === filters.status);
    }

    if (filters.cargoType) {
      list = list.filter((c) => c.cargoType.toLowerCase() === filters.cargoType!.toLowerCase());
    }

    if (filters.destination) {
      list = list.filter((c) => c.destination.toLowerCase().includes(filters.destination!.toLowerCase()));
    }

    if (filters.warehouseId) {
      list = list.filter((c) => c.warehouse === filters.warehouseId);
    }

    // Sort descending by creation date
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 10));
    const totalCount = list.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = list.slice(startIndex, startIndex + limit);

    // Hydrate warehouse info
    const hydrated = paginatedItems.map((c) => {
      const wh = c.warehouse ? this.warehouses.get(c.warehouse) : undefined;
      return {
        ...c,
        warehouseName: wh ? wh.name : undefined,
        warehouseCode: wh ? wh.warehouseCode : undefined,
      };
    });

    return {
      items: hydrated,
      page,
      limit,
      totalCount,
      totalPages,
    };
  }

  public getCargoById(id: string): (CargoDoc & { warehouseDoc?: WarehouseDoc }) | undefined {
    const cargo = this.cargos.get(id);
    if (!cargo) return undefined;
    const warehouseDoc = cargo.warehouse ? this.warehouses.get(cargo.warehouse) : undefined;
    return { ...cargo, warehouseDoc };
  }

  public getCargoByCode(code: string): (CargoDoc & { warehouseDoc?: WarehouseDoc }) | undefined {
    const normalized = code.trim().toUpperCase();
    for (const cargo of this.cargos.values()) {
      if (cargo.cargoCode.toUpperCase() === normalized) {
        const warehouseDoc = cargo.warehouse ? this.warehouses.get(cargo.warehouse) : undefined;
        return { ...cargo, warehouseDoc };
      }
    }
    return undefined;
  }

  public createCargo(data: {
    sender: string;
    receiver: string;
    cargoType: string;
    weight: number;
    origin: string;
    destination: string;
    expectedArrival?: string | null;
    warehouseId?: string | null;
    storageLocation?: string | null;
    cargoCode?: string;
  }, userId: string): CargoDoc {
    const code = data.cargoCode && data.cargoCode.trim() !== '' ? data.cargoCode.trim().toUpperCase() : this.getNextCargoCode();

    // Check duplicate code
    if (this.getCargoByCode(code)) {
      throw new Error(`Cargo with code ${code} already exists.`);
    }

    // If warehouse provided, validate capacity
    if (data.warehouseId) {
      const wh = this.warehouses.get(data.warehouseId);
      if (!wh) {
        throw new Error('Assigned warehouse does not exist.');
      }
      if (!canAcceptCargo(wh.totalCapacity, wh.occupiedCapacity, data.weight)) {
        throw new Error(`Insufficient warehouse capacity in ${wh.name}. Remaining available: ${calculateAvailableCapacity(wh.totalCapacity, wh.occupiedCapacity)} kg, required: ${data.weight} kg.`);
      }
    }

    const now = new Date().toISOString();
    const cargoId = `crg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newCargo: CargoDoc = {
      _id: cargoId,
      cargoCode: code,
      sender: data.sender,
      receiver: data.receiver,
      cargoType: data.cargoType,
      weight: data.weight,
      origin: data.origin,
      destination: data.destination,
      shipmentDate: now,
      expectedArrival: data.expectedArrival || undefined,
      status: data.warehouseId ? 'Stored' : 'Registered',
      warehouse: data.warehouseId || undefined,
      storageLocation: data.storageLocation || undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.cargos.set(cargoId, newCargo);

    // Create corresponding shipment record
    const shipmentId = `shp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newShipment: ShipmentDoc = {
      _id: shipmentId,
      cargo: cargoId,
      shipmentDate: now,
      expectedArrival: data.expectedArrival || undefined,
      currentLocation: data.warehouseId ? `${this.warehouses.get(data.warehouseId)?.name || 'Warehouse'}` : `${data.origin} Origin Gate`,
      status: newCargo.status,
      createdAt: now,
      updatedAt: now,
    };
    this.shipments.set(shipmentId, newShipment);

    // Initial history
    this.shipmentHistories.push({
      _id: `shh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cargo: cargoId,
      previousStatus: 'None',
      status: newCargo.status,
      location: newShipment.currentLocation,
      updatedBy: userId,
      timestamp: now,
    });

    this.recalculateWarehouseOccupancies();
    redisCache.invalidateCargo(newCargo.cargoCode);

    return newCargo;
  }

  public updateCargo(id: string, updates: Partial<CargoDoc>, userId: string): CargoDoc {
    const existing = this.cargos.get(id);
    if (!existing) {
      throw new Error('Cargo record not found.');
    }

    const oldWarehouse = existing.warehouse;
    const oldWeight = existing.weight;
    const newWeight = updates.weight !== undefined ? updates.weight : oldWeight;
    const newWarehouse = updates.warehouse !== undefined ? updates.warehouse : oldWarehouse;

    // Check capacity if weight or warehouse changed
    if (newWarehouse) {
      const wh = this.warehouses.get(newWarehouse);
      if (!wh) throw new Error('Selected warehouse not found.');

      // Adjust for old weight if same warehouse
      const currentOccWithoutOld = (oldWarehouse === newWarehouse) ? wh.occupiedCapacity - oldWeight : wh.occupiedCapacity;
      if (!canAcceptCargo(wh.totalCapacity, Math.max(0, currentOccWithoutOld), newWeight)) {
        throw new Error(`Insufficient warehouse capacity in ${wh.name}.`);
      }
    }

    const updated: CargoDoc = {
      ...existing,
      ...updates,
      _id: existing._id,
      cargoCode: existing.cargoCode, // code immutable
      updatedAt: new Date().toISOString(),
    };

    this.cargos.set(id, updated);
    this.recalculateWarehouseOccupancies();
    redisCache.invalidateCargo(updated.cargoCode);

    return updated;
  }

  public deleteCargo(id: string): void {
    const cargo = this.cargos.get(id);
    if (!cargo) {
      throw new Error('Cargo record not found.');
    }

    // Safety rule: Can only delete if in 'Registered' or 'Delivered' status
    if (['Received', 'Stored', 'Processing', 'Loaded', 'In Transit'].includes(cargo.status)) {
      throw new Error(`Cannot delete active cargo while in '${cargo.status}' state. Only 'Registered' or 'Delivered' shipments may be archived or deleted.`);
    }

    this.cargos.delete(id);

    // Clean up associated shipment
    for (const [sId, shp] of this.shipments.entries()) {
      if (shp.cargo === id) {
        this.shipments.delete(sId);
      }
    }

    this.recalculateWarehouseOccupancies();
    redisCache.invalidateCargo(cargo.cargoCode);
  }

  // --- Shipment Management & History ---
  public getAllShipments(filters: { search?: string; status?: string; destination?: string }) {
    let list = Array.from(this.shipments.values());

    return list.map((shp) => {
      const cargo = this.cargos.get(shp.cargo);
      const wh = cargo?.warehouse ? this.warehouses.get(cargo.warehouse) : undefined;
      return {
        ...shp,
        cargoCode: cargo?.cargoCode || 'UNKNOWN',
        sender: cargo?.sender || 'Unknown',
        receiver: cargo?.receiver || 'Unknown',
        cargoType: cargo?.cargoType || 'Unknown',
        weight: cargo?.weight || 0,
        origin: cargo?.origin || 'Unknown',
        destination: cargo?.destination || 'Unknown',
        warehouseName: wh?.name,
      };
    }).filter((item) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!item.cargoCode.toLowerCase().includes(q) &&
            !item.sender.toLowerCase().includes(q) &&
            !item.receiver.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filters.status && item.status !== filters.status) {
        return false;
      }
      if (filters.destination && !item.destination.toLowerCase().includes(filters.destination.toLowerCase())) {
        return false;
      }
      return true;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getShipmentById(id: string) {
    const shp = this.shipments.get(id);
    if (!shp) return undefined;
    const cargo = this.cargos.get(shp.cargo);
    const wh = cargo?.warehouse ? this.warehouses.get(cargo.warehouse) : undefined;
    return {
      ...shp,
      cargoDoc: cargo,
      warehouseDoc: wh,
    };
  }

  public getShipmentHistory(cargoId: string): ShipmentHistoryDoc[] {
    return this.shipmentHistories
      .filter((h) => h.cargo === cargoId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public updateShipmentStatus(
    shipmentId: string,
    newStatus: ShipmentStatus,
    location: string,
    expectedArrival: string | null | undefined,
    userId: string
  ) {
    const shipment = this.shipments.get(shipmentId);
    if (!shipment) throw new Error('Shipment not found.');

    const cargo = this.cargos.get(shipment.cargo);
    if (!cargo) throw new Error('Associated cargo record missing.');

    const currentStatus = shipment.status;

    // Validate lifecycle progression
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new Error(`Invalid status transition from '${currentStatus}' to '${newStatus}'. Follow airport logistics lifecycle: Registered -> Received -> Stored -> Processing -> Loaded -> In Transit -> Delivered.`);
    }

    const now = new Date().toISOString();

    // Prevent duplicate history if same status & location
    if (currentStatus !== newStatus || shipment.currentLocation !== location) {
      this.shipmentHistories.push({
        _id: `shh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        cargo: cargo._id,
        previousStatus: currentStatus,
        status: newStatus,
        location,
        updatedBy: userId,
        timestamp: now,
      });
    }

    // Update shipment
    shipment.status = newStatus;
    shipment.currentLocation = location;
    if (expectedArrival !== undefined) {
      shipment.expectedArrival = expectedArrival || undefined;
    }
    shipment.updatedAt = now;

    // Sync cargo
    cargo.status = newStatus;
    if (newStatus === 'Delivered' || newStatus === 'In Transit') {
      // Clear warehouse on departure/delivery
      cargo.warehouse = undefined;
      cargo.storageLocation = undefined;
    }
    cargo.updatedAt = now;

    this.recalculateWarehouseOccupancies();
    redisCache.invalidateCargo(cargo.cargoCode);

    return {
      shipment,
      cargo,
      history: this.getShipmentHistory(cargo._id),
    };
  }

  // --- Warehouse Management ---
  public getAllWarehouses(): Array<WarehouseDoc & { availableCapacity: number; cargoCount: number }> {
    this.recalculateWarehouseOccupancies();
    return Array.from(this.warehouses.values()).map((wh) => {
      const storedCount = Array.from(this.cargos.values()).filter(
        (c) => c.warehouse === wh._id && ['Received', 'Stored', 'Processing'].includes(c.status)
      ).length;
      return {
        ...wh,
        availableCapacity: calculateAvailableCapacity(wh.totalCapacity, wh.occupiedCapacity),
        cargoCount: storedCount,
      };
    });
  }

  public getWarehouseById(id: string): (WarehouseDoc & { availableCapacity: number; storedCargos: CargoDoc[] }) | undefined {
    this.recalculateWarehouseOccupancies();
    const wh = this.warehouses.get(id);
    if (!wh) return undefined;

    const storedCargos = Array.from(this.cargos.values()).filter(
      (c) => c.warehouse === id && ['Received', 'Stored', 'Processing'].includes(c.status)
    );

    return {
      ...wh,
      availableCapacity: calculateAvailableCapacity(wh.totalCapacity, wh.occupiedCapacity),
      storedCargos,
    };
  }

  public createWarehouse(data: {
    warehouseCode: string;
    name: string;
    location: string;
    totalCapacity: number;
  }): WarehouseDoc {
    const code = data.warehouseCode.trim().toUpperCase();
    for (const w of this.warehouses.values()) {
      if (w.warehouseCode.toUpperCase() === code) {
        throw new Error(`Warehouse with code ${code} already exists.`);
      }
    }

    const now = new Date().toISOString();
    const newWh: WarehouseDoc = {
      _id: `wh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      warehouseCode: code,
      name: data.name,
      location: data.location,
      totalCapacity: data.totalCapacity,
      occupiedCapacity: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.warehouses.set(newWh._id, newWh);
    return newWh;
  }

  public updateWarehouse(id: string, updates: Partial<WarehouseDoc>): WarehouseDoc {
    const wh = this.warehouses.get(id);
    if (!wh) throw new Error('Warehouse not found.');

    if (updates.totalCapacity !== undefined && updates.totalCapacity < wh.occupiedCapacity) {
      throw new Error(`Total capacity cannot be set lower than currently occupied capacity (${wh.occupiedCapacity} kg).`);
    }

    const updated: WarehouseDoc = {
      ...wh,
      ...updates,
      _id: wh._id,
      warehouseCode: wh.warehouseCode, // immutable
      updatedAt: new Date().toISOString(),
    };

    this.warehouses.set(id, updated);
    return updated;
  }

  public deleteWarehouse(id: string): void {
    const wh = this.warehouses.get(id);
    if (!wh) throw new Error('Warehouse not found.');

    // Safe deletion: prevent deletion if any cargo is stored
    const occupied = Array.from(this.cargos.values()).some((c) => c.warehouse === id);
    if (occupied) {
      throw new Error(`Cannot delete warehouse '${wh.name}' because active cargo is stored in it. Reassign or remove cargo first.`);
    }

    this.warehouses.delete(id);
  }

  public assignCargoToWarehouse(warehouseId: string, cargoId: string, storageLocation?: string): CargoDoc {
    const wh = this.warehouses.get(warehouseId);
    if (!wh) throw new Error('Warehouse not found.');

    const cargo = this.cargos.get(cargoId);
    if (!cargo) throw new Error('Cargo not found.');

    // Check capacity
    const currentOcc = (cargo.warehouse === warehouseId) ? wh.occupiedCapacity : wh.occupiedCapacity + cargo.weight;
    if (currentOcc > wh.totalCapacity) {
      throw new Error(`Insufficient capacity in ${wh.name}. Available: ${calculateAvailableCapacity(wh.totalCapacity, wh.occupiedCapacity)} kg, Required: ${cargo.weight} kg.`);
    }

    cargo.warehouse = warehouseId;
    if (storageLocation) cargo.storageLocation = storageLocation;
    cargo.updatedAt = new Date().toISOString();

    this.recalculateWarehouseOccupancies();
    redisCache.invalidateCargo(cargo.cargoCode);

    return cargo;
  }

  public removeCargoFromWarehouse(warehouseId: string, cargoId: string): CargoDoc {
    const cargo = this.cargos.get(cargoId);
    if (!cargo) throw new Error('Cargo not found.');
    if (cargo.warehouse !== warehouseId) throw new Error('Cargo is not assigned to this warehouse.');

    cargo.warehouse = undefined;
    cargo.storageLocation = undefined;
    cargo.updatedAt = new Date().toISOString();

    this.recalculateWarehouseOccupancies();
    redisCache.invalidateCargo(cargo.cargoCode);

    return cargo;
  }

  // --- Tracking & Dashboard ---
  public getTrackingInfo(cargoCode: string) {
    const cargo = this.getCargoByCode(cargoCode);
    if (!cargo) return null;

    // Find shipment
    let shipment: ShipmentDoc | undefined;
    for (const shp of this.shipments.values()) {
      if (shp.cargo === cargo._id) {
        shipment = shp;
        break;
      }
    }

    // Find histories
    const history = this.getShipmentHistory(cargo._id).map((h) => {
      const user = this.users.get(h.updatedBy);
      return {
        ...h,
        updatedByName: user ? `${user.name} (${user.role})` : 'System Logistics Operator',
      };
    });

    const warehouseDoc = cargo.warehouse ? this.warehouses.get(cargo.warehouse) : undefined;

    return {
      cargoId: cargo._id,
      cargoCode: cargo.cargoCode,
      sender: cargo.sender,
      receiver: cargo.receiver,
      cargoType: cargo.cargoType,
      weight: cargo.weight,
      origin: cargo.origin,
      destination: cargo.destination,
      shipmentDate: cargo.shipmentDate,
      expectedArrival: cargo.expectedArrival,
      currentStatus: cargo.status,
      currentLocation: shipment ? shipment.currentLocation : (warehouseDoc ? warehouseDoc.name : cargo.origin),
      assignedWarehouse: warehouseDoc ? {
        id: warehouseDoc._id,
        code: warehouseDoc.warehouseCode,
        name: warehouseDoc.name,
        location: warehouseDoc.location,
      } : null,
      storageLocation: cargo.storageLocation,
      lastUpdated: cargo.updatedAt,
      history,
    };
  }

  public getDashboardStats() {
    this.recalculateWarehouseOccupancies();
    const cargosList = Array.from(this.cargos.values());
    const warehousesList = Array.from(this.warehouses.values());

    const totalShipments = cargosList.length;
    const registered = cargosList.filter((c) => c.status === 'Registered').length;
    const received = cargosList.filter((c) => c.status === 'Received').length;
    const stored = cargosList.filter((c) => c.status === 'Stored').length;
    const processing = cargosList.filter((c) => c.status === 'Processing').length;
    const loaded = cargosList.filter((c) => c.status === 'Loaded').length;
    const inTransit = cargosList.filter((c) => c.status === 'In Transit').length;
    const delivered = cargosList.filter((c) => c.status === 'Delivered').length;
    const pending = registered + received + stored + processing + loaded;

    const totalWarehouses = warehousesList.length;
    const totalCapacity = warehousesList.reduce((acc, w) => acc + w.totalCapacity, 0);
    const occupiedCapacity = warehousesList.reduce((acc, w) => acc + w.occupiedCapacity, 0);
    const availableCapacity = calculateAvailableCapacity(totalCapacity, occupiedCapacity);

    // Distribution
    const statusDistribution = [
      { name: 'Registered', count: registered, color: '#94a3b8' },
      { name: 'Received', count: received, color: '#38bdf8' },
      { name: 'Stored', count: stored, color: '#0284c7' },
      { name: 'Processing', count: processing, color: '#f59e0b' },
      { name: 'Loaded', count: loaded, color: '#8b5cf6' },
      { name: 'In Transit', count: inTransit, color: '#0284c7' },
      { name: 'Delivered', count: delivered, color: '#10b981' },
    ];

    const warehouseUtilization = warehousesList.map((w) => ({
      name: w.name,
      code: w.warehouseCode,
      totalCapacity: w.totalCapacity,
      occupiedCapacity: w.occupiedCapacity,
      availableCapacity: calculateAvailableCapacity(w.totalCapacity, w.occupiedCapacity),
      utilizationPercentage: w.totalCapacity > 0 ? Math.round((w.occupiedCapacity / w.totalCapacity) * 100) : 0,
    }));

    return {
      summary: {
        totalShipments,
        pendingShipments: pending,
        registeredCargo: registered,
        receivedCargo: received,
        storedCargo: stored,
        processingCargo: processing,
        loadedCargo: loaded,
        inTransitCargo: inTransit,
        deliveredCargo: delivered,
        totalWarehouses,
        totalWarehouseCapacity: totalCapacity,
        occupiedWarehouseCapacity: occupiedCapacity,
        availableWarehouseCapacity: availableCapacity,
      },
      statusDistribution,
      warehouseUtilization,
    };
  }

  public getRecentActivity(limit = 8) {
    const sorted = [...this.shipmentHistories].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, limit);

    return sorted.map((h) => {
      const cargo = this.cargos.get(h.cargo);
      const user = this.users.get(h.updatedBy);
      return {
        id: h._id,
        cargoCode: cargo?.cargoCode || 'UNKNOWN',
        cargoType: cargo?.cargoType || 'Cargo',
        previousStatus: h.previousStatus,
        status: h.status,
        location: h.location,
        timestamp: h.timestamp,
        operatorName: user ? user.name : 'Airport Operations',
        operatorRole: user ? user.role : 'STAFF',
      };
    });
  }
}

export const dbStore = new DatabaseStore();
