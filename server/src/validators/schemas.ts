import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const CreateCargoSchema = z.object({
  cargoCode: z.string().optional(),
  sender: z.string().min(2, 'Sender name is required'),
  receiver: z.string().min(2, 'Receiver name is required'),
  cargoType: z.string().min(2, 'Cargo type is required'),
  weight: z.number().positive('Weight must be a positive number in kg'),
  origin: z.string().min(2, 'Origin is required'),
  destination: z.string().min(2, 'Destination is required'),
  expectedArrival: z.string().optional().nullable(),
  warehouseId: z.string().optional().nullable(),
  storageLocation: z.string().optional().nullable(),
});

export const UpdateCargoSchema = z.object({
  sender: z.string().min(2).optional(),
  receiver: z.string().min(2).optional(),
  cargoType: z.string().min(2).optional(),
  weight: z.number().positive().optional(),
  origin: z.string().min(2).optional(),
  destination: z.string().min(2).optional(),
  expectedArrival: z.string().optional().nullable(),
  warehouseId: z.string().optional().nullable(),
  storageLocation: z.string().optional().nullable(),
  status: z.enum([
    'Registered',
    'Received',
    'Stored',
    'Processing',
    'Loaded',
    'In Transit',
    'Delivered',
  ]).optional(),
});

export const UpdateShipmentStatusSchema = z.object({
  status: z.enum([
    'Registered',
    'Received',
    'Stored',
    'Processing',
    'Loaded',
    'In Transit',
    'Delivered',
  ]),
  location: z.string().min(2, 'Location is required'),
  expectedArrival: z.string().optional().nullable(),
});

export const CreateWarehouseSchema = z.object({
  warehouseCode: z.string().min(2, 'Warehouse code is required'),
  name: z.string().min(2, 'Warehouse name is required'),
  location: z.string().min(2, 'Location is required'),
  totalCapacity: z.number().positive('Total capacity must be positive in kg'),
});

export const UpdateWarehouseSchema = z.object({
  name: z.string().min(2).optional(),
  location: z.string().min(2).optional(),
  totalCapacity: z.number().positive().optional(),
});

export const AssignWarehouseSchema = z.object({
  cargoId: z.string().min(1, 'Cargo ID is required'),
  storageLocation: z.string().optional(),
});
