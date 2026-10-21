import { Request, Response } from 'express';
import { dbStore } from '../services/dbStore.ts';
import { UpdateShipmentStatusSchema } from '../validators/schemas.ts';

export async function getShipments(req: Request, res: Response): Promise<void> {
  const { search, status, destination } = req.query;

  const shipments = dbStore.getAllShipments({
    search: search as string,
    status: status as string,
    destination: destination as string,
  });

  res.status(200).json({
    success: true,
    data: shipments,
    totalCount: shipments.length,
  });
}

export async function getShipmentById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const shipment = dbStore.getShipmentById(id);

  if (!shipment) {
    res.status(404).json({ success: false, error: 'Shipment record not found' });
    return;
  }

  const history = dbStore.getShipmentHistory(shipment.cargo);

  res.status(200).json({
    success: true,
    data: {
      ...shipment,
      history,
    },
  });
}

export async function updateShipmentStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parseResult = UpdateShipmentStatusSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: parseResult.error.issues.map((e: any) => e.message).join(', '),
    });
    return;
  }

  const { status, location, expectedArrival } = parseResult.data;
  const userId = req.user?.userId || 'usr-staff-01';

  try {
    const result = dbStore.updateShipmentStatus(id, status, location, expectedArrival, userId);
    res.status(200).json({
      success: true,
      message: `Shipment updated to '${status}' successfully.`,
      data: result,
    });
  } catch (err: any) {
    const httpStatus = err.message.includes('not found') ? 404 : 400;
    res.status(httpStatus).json({
      success: false,
      error: err.message,
    });
  }
}

export async function getShipmentHistory(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const history = dbStore.getShipmentHistory(id);

  res.status(200).json({
    success: true,
    data: history,
  });
}
