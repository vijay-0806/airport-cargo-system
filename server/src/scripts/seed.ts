import { dbStore } from '../services/dbStore.ts';
import { connectDatabase, isConnectedToMongoDB } from '../config/database.ts';

async function runSeed() {
  console.log('--- Starting Airport Cargo & Warehouse Management System Seeding ---');
  await connectDatabase();

  await dbStore.initSeed(true);

  console.log('Seeded Users:');
  console.log('  1. Admin: admin@airportcargo.com (Password: Admin123!)');
  console.log('  2. Staff: staff@airportcargo.com (Password: Staff123!)');
  console.log(`Warehouses seeded: ${dbStore.warehouses.size}`);
  console.log(`Cargos seeded: ${dbStore.cargos.size}`);
  console.log(`Shipments seeded: ${dbStore.shipments.size}`);
  console.log(`History records: ${dbStore.shipmentHistories.length}`);
  console.log('Demo Cargo ID ready for live tracking: CG-10025');
  console.log('--- Seeding Completed Successfully ---');
}

runSeed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
