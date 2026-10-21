import { Request, Response } from 'express';
import { dbStore } from '../services/dbStore.ts';
import { CreateCargoSchema, UpdateCargoSchema } from '../validators/schemas.ts';

export async function getCargos(req: Request, res: Response): Promise<void> {
  const { search, status, cargoType, destination, warehouseId, page, limit } = req.query;

  const results = dbStore.getAllCargos({
    search: search as string,
    status: status as string,
    cargoType: cargoType as string,
    destination: destination as string,
    warehouseId: warehouseId as string,
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 10,
  });

  res.status(200).json({
    success: true,
    ...results,
  });
}

export async function getCargoById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const cargo = dbStore.getCargoById(id);

  if (!cargo) {
    res.status(404).json({ success: false, error: 'Cargo record not found' });
    return;
  }

  res.status(200).json({
    success: true,
    data: cargo,
  });
}

export async function createCargo(req: Request, res: Response): Promise<void> {
  const parseResult = CreateCargoSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: parseResult.error.issues.map((e: any) => e.message).join(', '),
    });
    return;
  }

  const userId = req.user?.userId || 'usr-admin-01';

  try {
    const newCargo = dbStore.createCargo(parseResult.data, userId);
    res.status(201).json({
      success: true,
      message: `Cargo ${newCargo.cargoCode} registered successfully`,
      data: newCargo,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to create cargo record',
    });
  }
}

export async function updateCargo(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parseResult = UpdateCargoSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: parseResult.error.issues.map((e: any) => e.message).join(', '),
    });
    return;
  }

  const userId = req.user?.userId || 'usr-admin-01';

  try {
    const { expectedArrival, warehouseId, ...rest } = parseResult.data;
    const updatePayload: any = {
      ...rest,
      expectedArrival: expectedArrival || undefined,
      warehouse: warehouseId || undefined,
    };
    const updated = dbStore.updateCargo(id, updatePayload, userId);
    res.status(200).json({
      success: true,
      message: `Cargo ${updated.cargoCode} updated successfully`,
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

export async function deleteCargo(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    dbStore.deleteCargo(id);
    res.status(200).json({
      success: true,
      message: 'Cargo record successfully deleted',
    });
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 409;
    res.status(status).json({
      success: false,
      error: err.message,
    });
  }
}
