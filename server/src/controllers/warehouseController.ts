import { Request, Response } from 'express';
import { dbStore } from '../services/dbStore.ts';
import {
  CreateWarehouseSchema,
  UpdateWarehouseSchema,
  AssignWarehouseSchema,
} from '../validators/schemas.ts';

export async function getWarehouses(req: Request, res: Response): Promise<void> {
  const warehouses = dbStore.getAllWarehouses();
  res.status(200).json({
    success: true,
    data: warehouses,
  });
}

export async function getWarehouseById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const wh = dbStore.getWarehouseById(id);

  if (!wh) {
    res.status(404).json({ success: false, error: 'Warehouse not found' });
    return;
  }

  res.status(200).json({
    success: true,
    data: wh,
  });
}

export async function createWarehouse(req: Request, res: Response): Promise<void> {
  const parseResult = CreateWarehouseSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: parseResult.error.issues.map((e: any) => e.message).join(', '),
    });
    return;
  }

  try {
    const created = dbStore.createWarehouse(parseResult.data);
    res.status(201).json({
      success: true,
      message: `Warehouse ${created.warehouseCode} created successfully`,
      data: created,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
}

export async function updateWarehouse(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parseResult = UpdateWarehouseSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: parseResult.error.issues.map((e: any) => e.message).join(', '),
    });
    return;
  }

  try {
    const updated = dbStore.updateWarehouse(id, parseResult.data);
    res.status(200).json({
      success: true,
      message: 'Warehouse updated successfully',
      data: updated,
    });
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 400;
    res.status(status).json({
      success: false,
      error: err.message,
    });
  }
}

export async function deleteWarehouse(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    dbStore.deleteWarehouse(id);
    res.status(200).json({
      success: true,
      message: 'Warehouse deleted successfully',
    });
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 409;
    res.status(status).json({
      success: false,
      error: err.message,
    });
  }
}

export async function getWarehouseCargo(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const wh = dbStore.getWarehouseById(id);

  if (!wh) {
    res.status(404).json({ success: false, error: 'Warehouse not found' });
    return;
  }

  res.status(200).json({
    success: true,
    data: wh.storedCargos,
  });
}

export async function assignCargo(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parseResult = AssignWarehouseSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: parseResult.error.issues.map((e: any) => e.message).join(', '),
    });
    return;
  }

  const { cargoId, storageLocation } = parseResult.data;

  try {
    const cargo = dbStore.assignCargoToWarehouse(id, cargoId, storageLocation);
    res.status(200).json({
      success: true,
      message: `Cargo ${cargo.cargoCode} assigned to warehouse successfully.`,
      data: cargo,
    });
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 400;
    res.status(status).json({
      success: false,
      error: err.message,
    });
  }
}

export async function removeCargo(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { cargoId } = req.body;

  if (!cargoId) {
    res.status(400).json({ success: false, error: 'cargoId is required in request body.' });
    return;
  }

  try {
    const cargo = dbStore.removeCargoFromWarehouse(id, cargoId);
    res.status(200).json({
      success: true,
      message: `Cargo ${cargo.cargoCode} unassigned from warehouse successfully.`,
      data: cargo,
    });
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 400;
    res.status(status).json({
      success: false,
      error: err.message,
    });
  }
}
